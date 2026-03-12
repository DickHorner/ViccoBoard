/**
 * Save Multistop Session Use Case
 * Persists a multi-stopwatch session (student times captured during a run) to the
 * tool_sessions table so that results are durable, reopenable, and transferable
 * to the Mittelstrecke grading workflow.
 */

import { Sport } from '@viccoboard/core';
import type { ToolSessionRepository } from '../repositories/tool-session.repository.js';

export interface MultistopStudentResult {
  studentId: string;
  studentName: string;
  /** Captured time in milliseconds */
  timeMs: number;
  /** Lap splits in milliseconds, may be empty */
  laps: number[];
}

export interface SaveMultistopSessionInput {
  classGroupId: string;
  lessonId?: string;
  results: MultistopStudentResult[];
  /** ISO string or Date for when the session was captured */
  capturedAt?: Date;
}

export class SaveMultistopSessionUseCase {
  constructor(private toolSessionRepository: ToolSessionRepository) {}

  async execute(input: SaveMultistopSessionInput): Promise<Sport.ToolSession> {
    if (!input.classGroupId) {
      throw new Error('classGroupId is required');
    }
    if (!Array.isArray(input.results) || input.results.length === 0) {
      throw new Error('results must be a non-empty array');
    }

    for (const r of input.results) {
      if (!r.studentId) {
        throw new Error('Each result must have a studentId');
      }
      if (typeof r.timeMs !== 'number' || r.timeMs < 0) {
        throw new Error(`Invalid timeMs for student ${r.studentId}`);
      }
    }

    const now = input.capturedAt ?? new Date();

    return this.toolSessionRepository.create({
      toolType: 'multistop',
      classGroupId: input.classGroupId,
      lessonId: input.lessonId,
      sessionMetadata: {
        results: input.results,
        capturedAt: now.toISOString()
      },
      startedAt: now,
      endedAt: now
    });
  }
}
