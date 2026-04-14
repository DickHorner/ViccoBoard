import { Exams } from '@viccoboard/core';
import type { CorrectionEntryRepository } from '../repositories/correction-entry.repository';
import type { ExamRepository } from '../repositories/exam.repository';
import { GetCorrectionSheetPresetUseCase } from './get-correction-sheet-preset.use-case';
import { getCorrectionRelevantTaskNodes } from '../utils/task-tree';

function resolveCandidateName(candidate: Exams.Candidate): string {
  return `${candidate.firstName} ${candidate.lastName}`.trim();
}

function resolvePartLabel(exam: Exams.Exam, taskId: string): string | undefined {
  return exam.structure.parts.find((part) => part.taskIds.includes(taskId))?.name;
}

function resolveGeneralComment(
  correction: Exams.CorrectionEntry,
  preset: Exams.CorrectionSheetPreset
): string | undefined {
  if (!preset.showGeneralComment) {
    return undefined;
  }

  const examComments = correction.comments
    .filter((comment) => comment.level === 'exam')
    .sort((left, right) => {
      return new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime();
    });

  const latestComment = examComments[examComments.length - 1];
  return latestComment?.text?.trim() || undefined;
}

export interface BuildCorrectionSheetProjectionOptions {
  /** When true, allows building projections for non-completed corrections (for preview only). Default: false. */
  allowIncomplete?: boolean;
}

export class BuildCorrectionSheetProjectionUseCase {
  constructor(
    private readonly examRepository: ExamRepository,
    private readonly correctionEntryRepository: CorrectionEntryRepository,
    private readonly getCorrectionSheetPresetUseCase: GetCorrectionSheetPresetUseCase
  ) {}

  async execute(
    examId: string,
    candidateId: string,
    options: BuildCorrectionSheetProjectionOptions = {}
  ): Promise<Exams.CorrectionSheetProjection> {
    const exam = await this.examRepository.findById(examId);
    if (!exam) {
      throw new Error(`Exam ${examId} not found`);
    }

    const candidate = exam.candidates.find((entry) => entry.id === candidateId);
    if (!candidate) {
      throw new Error(`Candidate ${candidateId} not found in exam ${examId}`);
    }

    const correction = await this.correctionEntryRepository.findByExamAndCandidate(
      examId,
      candidateId
    );
    if (!correction) {
      throw new Error(`Correction for candidate ${candidateId} not found`);
    }

    if (!options.allowIncomplete && correction.status !== 'completed') {
      throw new Error(
        `Korrektur für Prüfling ${candidateId} ist noch nicht abgeschlossen (Status: ${correction.status}). Nur abgeschlossene Korrekturen können als Druckbogen ausgegeben werden.`
      );
    }

    const preset = await this.getCorrectionSheetPresetUseCase.execute(examId);

    const taskRows = getCorrectionRelevantTaskNodes(exam.structure.tasks)
      .map((task) => {
        const score = correction.taskScores.find((entry) => entry.taskId === task.id);
        return {
          taskId: task.id,
          label: task.title,
          maxPoints: task.points,
          awardedPoints: score?.points ?? 0,
          comment: preset.showTaskComments ? score?.comment : undefined,
          partLabel: preset.showExamParts ? resolvePartLabel(exam, task.id) : undefined
        };
      });

    return {
      examId: exam.id,
      examTitle: exam.title,
      examDate: exam.date ?? exam.createdAt,
      candidateId: candidate.id,
      candidateName: resolveCandidateName(candidate),
      maxPoints: exam.gradingKey.totalPoints || exam.structure.totalPoints,
      totalPoints: correction.totalPoints,
      grade: preset.showGrade ? correction.totalGrade : undefined,
      generalComment: resolveGeneralComment(correction, preset),
      headerText: preset.headerText,
      footerText: preset.footerText,
      layoutMode: preset.layoutMode,
      showHeader: preset.showHeader,
      showOverallPoints: preset.showOverallPoints,
      showGrade: preset.showGrade,
      showTaskPoints: preset.showTaskPoints,
      showTaskComments: preset.showTaskComments,
      showGeneralComment: preset.showGeneralComment,
      showExamParts: preset.showExamParts,
      showSignatureArea: preset.showSignatureArea,
      taskRows
    };
  }
}
