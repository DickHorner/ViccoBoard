/**
 * Save Cooper Session Use Case
 *
 * Records a class-level Cooper test session as a ToolSession, then persists each
 * student's PerformanceEntry with a back-reference to the session.  This replaces
 * the previous pattern of calling RecordCooperTestResultUseCase per-student without
 * a shared session record, and enables session history / reopenability.
 */

import { Sport } from '@viccoboard/core';
import type { ToolSessionRepository } from '../repositories/tool-session.repository.js';
import type { PerformanceEntryRepository } from '../repositories/performance-entry.repository.js';
import type { CooperTestConfigRepository } from '../repositories/cooper-test-config.repository.js';

export interface CooperSessionStudentEntry {
  studentId: string;
  rounds: number;
  lapLengthMeters: number;
  extraMeters?: number;
  distanceMeters: number;
  calculatedGrade?: string | number;
  comment?: string;
}

export interface SaveCooperSessionInput {
  /** The class this session belongs to — required for session history lookup. */
  classGroupId: string;
  /** Optional lesson context for lesson-bound sessions. */
  lessonId?: string;
  /** The grade category that owns this Cooper test. */
  categoryId: string;
  /** Sport type must match the selected config. */
  SportType: 'running' | 'swimming';
  /** Cooper test configuration ID. */
  configId: string;
  /** Grading table used for auto-evaluation (optional). */
  tableId?: string;
  /** Lap length used during this session. */
  lapLengthMeters: number;
  /** One entry per student.  Entries with distanceMeters <= 0 are skipped. */
  entries: CooperSessionStudentEntry[];
}

/** Shape of session_metadata stored in the ToolSession record. */
export interface CooperSessionMetadata {
  categoryId: string;
  SportType: 'running' | 'swimming';
  configId: string;
  tableId?: string;
  lapLengthMeters: number;
  entryIds: string[];
  entryCount: number;
}

export class SaveCooperSessionUseCase {
  constructor(
    private toolSessionRepository: ToolSessionRepository,
    private performanceEntryRepository: PerformanceEntryRepository,
    private cooperTestConfigRepository: CooperTestConfigRepository
  ) {}

  async execute(input: SaveCooperSessionInput): Promise<Sport.ToolSession> {
    // ── Validation ──────────────────────────────────────────────────────────
    if (!input.classGroupId) {
      throw new Error('classGroupId is required');
    }
    if (!input.categoryId) {
      throw new Error('categoryId is required');
    }
    if (!input.configId) {
      throw new Error('configId is required');
    }
    if (!input.SportType) {
      throw new Error('SportType is required');
    }
    if (!input.entries || input.entries.length === 0) {
      throw new Error('entries must not be empty');
    }

    // Validate config exists and sport type matches
    const config = await this.cooperTestConfigRepository.findById(input.configId);
    if (!config) {
      throw new Error(`Cooper Test Config not found: ${input.configId}`);
    }
    if (config.SportType !== input.SportType) {
      throw new Error(
        `Sport type mismatch: config expects ${config.SportType}, got ${input.SportType}`
      );
    }

    // Only save entries that represent actual participation
    const activeEntries = input.entries.filter(
      (e) => e.distanceMeters != null && e.distanceMeters > 0
    );
    if (activeEntries.length === 0) {
      throw new Error('No entries with distance > 0 to save');
    }

    const now = new Date();

    // ── Create session record first (to obtain session ID) ───────────────────
    const session = await this.toolSessionRepository.create({
      toolType: 'cooper-test',
      classGroupId: input.classGroupId,
      lessonId: input.lessonId,
      startedAt: now,
      sessionMetadata: {
        categoryId: input.categoryId,
        SportType: input.SportType,
        configId: input.configId,
        tableId: input.tableId,
        lapLengthMeters: input.lapLengthMeters,
        entryIds: [],
        entryCount: 0
      } as CooperSessionMetadata
    });

    // ── Persist performance entries ───────────────────────────────────────────
    const savedEntries = await Promise.all(
      activeEntries.map((entry) =>
        this.performanceEntryRepository.create({
          studentId: entry.studentId,
          categoryId: input.categoryId,
          measurements: {
            SportType: input.SportType,
            rounds: entry.rounds,
            lapLengthMeters: entry.lapLengthMeters,
            extraMeters: entry.extraMeters ?? 0,
            distanceMeters: entry.distanceMeters
          },
          calculatedGrade: entry.calculatedGrade,
          timestamp: now,
          comment: entry.comment,
          metadata: {
            testType: 'cooper-test',
            sessionId: session.id,
            configId: input.configId,
            tableId: input.tableId
          }
        })
      )
    );

    // ── Update session with final entry IDs ──────────────────────────────────
    const updatedSession = await this.toolSessionRepository.update(session.id, {
      endedAt: new Date(),
      sessionMetadata: {
        ...(session.sessionMetadata as CooperSessionMetadata),
        entryIds: savedEntries.map((e) => e.id),
        entryCount: savedEntries.length
      } as CooperSessionMetadata
    });

    return updatedSession;
  }
}
