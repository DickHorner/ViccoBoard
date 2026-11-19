import { Sport } from '@viccoboard/core';
import type { PerformanceEntryRepository } from '../repositories/performance-entry.repository.js';
import type { ToolSessionRepository } from '../repositories/tool-session.repository.js';

export type SportExamStudentState =
  | 'ready'
  | 'absent'
  | 'passive'
  | 'missing-kit'
  | 'not-assessed';

export interface SportExamStudentEntry {
  studentId: string;
  state: SportExamStudentState;
  rawValue?: string;
  value?: number;
  criterionScores?: Record<string, number>;
  criteriaTotalPoints?: number;
  criteriaMaxPoints?: number;
  criteriaPercentage?: number;
  calculatedGrade?: string | number;
  comment?: string;
  assessedOn?: string;
  bodyHeightCm?: number;
  attendanceSource?: 'lesson' | 'calendar';
}

export interface SaveSportExamSessionInput {
  sessionId?: string;
  classGroupId: string;
  lessonId?: string;
  categoryId: string;
  tableId?: string;
  assessmentType?: 'performance' | 'criteria';
  examDate: string;
  announced: boolean;
  sport?: string;
  discipline?: string;
  measurementType?: 'number' | 'time';
  normalization?: Sport.PerformanceNormalization;
  unit?: string;
  entries: SportExamStudentEntry[];
  drawHistory?: string[];
}

export interface SportExamSessionMetadata {
  categoryId: string;
  tableId?: string;
  assessmentType: 'performance' | 'criteria';
  examDate: string;
  announced: boolean;
  sport?: string;
  discipline?: string;
  measurementType?: 'number' | 'time';
  normalization?: Sport.PerformanceNormalization;
  unit?: string;
  studentStates: Array<{
    studentId: string;
    state: SportExamStudentState;
    attendanceSource?: 'lesson' | 'calendar';
    requiresAttest: boolean;
  }>;
  entryIds: string[];
  entryCount: number;
  drawHistory?: string[];
}

export class SaveSportExamSessionUseCase {
  constructor(
    private toolSessionRepository: ToolSessionRepository,
    private performanceEntryRepository: PerformanceEntryRepository
  ) {}

  async execute(input: SaveSportExamSessionInput): Promise<Sport.ToolSession> {
    if (!input.classGroupId) throw new Error('classGroupId is required');
    if (!input.categoryId) throw new Error('categoryId is required');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.examDate)) {
      throw new Error('examDate must use YYYY-MM-DD format');
    }
    if (!Array.isArray(input.entries) || input.entries.length === 0) {
      throw new Error('entries must not be empty');
    }

    const assessmentType = input.assessmentType ?? 'performance';
    const studentIds = new Set<string>();
    for (const entry of input.entries) {
      if (!entry.studentId) throw new Error('studentId is required');
      if (studentIds.has(entry.studentId)) {
        throw new Error(`Duplicate student entry: ${entry.studentId}`);
      }
      studentIds.add(entry.studentId);
      if (entry.assessedOn && !/^\d{4}-\d{2}-\d{2}$/.test(entry.assessedOn)) {
        throw new Error('assessedOn must use YYYY-MM-DD format');
      }

      if (entry.state === 'ready') {
        if (assessmentType === 'performance') {
          if (!Number.isFinite(entry.value) || entry.value! < 0) {
            throw new Error(`Performance value missing for student: ${entry.studentId}`);
          }
        } else if (!entry.criterionScores || Object.keys(entry.criterionScores).length === 0) {
          throw new Error(`Criterion scores missing for student: ${entry.studentId}`);
        }

        if (entry.calculatedGrade === undefined && assessmentType !== 'criteria') {
          throw new Error(`Calculated grade missing for student: ${entry.studentId}`);
        }
      }
    }

    if (input.drawHistory &&
        (new Set(input.drawHistory).size !== input.drawHistory.length ||
         input.drawHistory.some((id) => !studentIds.has(id)))) {
      throw new Error('drawHistory must contain unique student IDs from entries');
    }

    const previousSession = input.sessionId
      ? await this.toolSessionRepository.findById(input.sessionId)
      : null;
    if (input.sessionId && !previousSession) {
      throw new Error('Sport exam session not found');
    }
    if (previousSession) {
      const metadata = previousSession.sessionMetadata as SportExamSessionMetadata;
      if (previousSession.toolType !== 'sport-exam' ||
          previousSession.classGroupId !== input.classGroupId ||
          metadata.categoryId !== input.categoryId ||
          metadata.examDate !== input.examDate ||
          metadata.assessmentType !== assessmentType) {
        throw new Error('Sport exam session does not match this assessment');
      }
    }

    const previousMetadata = previousSession?.sessionMetadata as SportExamSessionMetadata | undefined;
    const previousEntries = new Map<string, Sport.PerformanceEntry>();
    if (previousMetadata) {
      const existing = await Promise.all(
        previousMetadata.entryIds.map((id) => this.performanceEntryRepository.findById(id))
      );
      if (existing.some((entry) => !entry)) {
        throw new Error('Saved sport exam contains missing performance entries');
      }
      for (const entry of existing) {
        if (!entry || entry.categoryId !== input.categoryId ||
            entry.metadata?.sessionId !== previousSession?.id ||
            previousEntries.has(entry.studentId)) {
          throw new Error('Saved sport exam contains inconsistent performance entries');
        }
        previousEntries.set(entry.studentId, entry);
      }
    }

    const now = new Date();
    const session = previousSession ?? await this.toolSessionRepository.create({
      toolType: 'sport-exam',
      classGroupId: input.classGroupId,
      lessonId: input.lessonId,
      startedAt: now,
      sessionMetadata: {
        categoryId: input.categoryId,
        tableId: input.tableId,
        assessmentType,
        examDate: input.examDate,
        announced: input.announced,
        sport: input.sport,
        discipline: input.discipline,
        measurementType: input.measurementType,
        normalization: input.normalization,
        unit: input.unit,
        studentStates: [],
        entryIds: [],
        entryCount: 0
      } satisfies SportExamSessionMetadata
    });

    const gradeEntries = input.entries.filter(
      (entry) => entry.state === 'ready' || entry.state === 'missing-kit'
    );

    const savedEntries = await Promise.all(gradeEntries.map(async (entry) => {
      const existing = previousEntries.get(entry.studentId);
      const missingKit = entry.state === 'missing-kit';
      const measurements = missingKit
        ? { state: 'missing-kit' }
        : assessmentType === 'criteria'
          ? {
              criteria: entry.criterionScores,
              totalPoints: entry.criteriaTotalPoints,
              maxPoints: entry.criteriaMaxPoints,
              percentage: entry.criteriaPercentage
            }
          : {
              value: entry.value,
              rawValue: entry.rawValue,
              measurementType: input.measurementType,
              normalization: input.normalization,
              bodyHeightCm: entry.bodyHeightCm,
              unit: input.unit,
              tableId: input.tableId
            };
      const calculatedGrade = missingKit ? 6 : entry.calculatedGrade;
      const assessedOn = entry.assessedOn ?? existing?.metadata?.assessedOn ?? input.examDate;
      const metadata = {
        testType: 'sport-exam',
        sessionId: session.id,
        examDate: input.examDate,
        assessedOn,
        announced: input.announced,
        state: entry.state
      };

      if (existing &&
          JSON.stringify(existing.measurements) === JSON.stringify(measurements) &&
          existing.calculatedGrade === calculatedGrade &&
          existing.metadata?.assessedOn === assessedOn &&
          existing.comment === entry.comment) {
        return existing;
      }

      if (existing) {
        return this.performanceEntryRepository.update(existing.id, {
          measurements,
          calculatedGrade,
          timestamp: now,
          comment: entry.comment,
          metadata
        });
      }

      return this.performanceEntryRepository.create({
        studentId: entry.studentId,
        categoryId: input.categoryId,
        measurements,
        calculatedGrade,
        timestamp: now,
        comment: entry.comment,
        metadata
      });
    }));

    const updatedSession = await this.toolSessionRepository.update(session.id, {
      endedAt: new Date(),
      sessionMetadata: {
        ...(session.sessionMetadata as SportExamSessionMetadata),
        announced: input.announced,
        drawHistory: input.drawHistory ?? previousMetadata?.drawHistory ?? [],
        studentStates: input.entries.map((entry) => ({
          studentId: entry.studentId,
          state: entry.state,
          attendanceSource: entry.attendanceSource,
          requiresAttest: input.announced && entry.state === 'absent'
        })),
        entryIds: savedEntries.map((entry) => entry.id),
        entryCount: savedEntries.length
      }
    });

    const remainingIds = new Set(savedEntries.map((entry) => entry.id));
    const removedIds = (previousMetadata?.entryIds ?? []).filter((id) => !remainingIds.has(id));
    await Promise.all(removedIds.map((id) => this.performanceEntryRepository.delete(id)));
    return updatedSession;
  }
}
