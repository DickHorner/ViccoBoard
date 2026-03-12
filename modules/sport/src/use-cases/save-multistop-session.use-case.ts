/**
 * Save Multistop Session Use Case
 * Persists a multistop session (captured times grid) as a ToolSession (toolType = 'multistop').
 * Enables session reopen and handoff into middle-distance grading.
 */

import { Sport } from '@viccoboard/core';
import type { ToolSessionRepository } from '../repositories/tool-session.repository.js';

export interface MultistopCapturedTime {
  /** Student identifier */
  studentId: string;
  /** Display name at capture time */
  studentName: string;
  /** Elapsed time in milliseconds */
  timeMs: number;
  /** Unix timestamp of capture */
  capturedAt: number;
  /** Optional lap splits in ms */
  laps: number[];
}

export interface SaveMultistopSessionInput {
  /** Class this session belongs to (required for context). */
  classGroupId: string;
  /** Optional lesson context. */
  lessonId?: string;
  /** Human-readable session name. */
  sessionName: string;
  /** All captured times collected during the session. */
  capturedTimes: MultistopCapturedTime[];
}

/** Shape of sessionMetadata stored for a multistop session. */
export interface MultistopSessionMetadata {
  sessionName: string;
  capturedTimes: MultistopCapturedTime[];
}

export class SaveMultistopSessionUseCase {
  constructor(private toolSessionRepository: ToolSessionRepository) {}

  async execute(input: SaveMultistopSessionInput): Promise<Sport.ToolSession> {
    if (!input.classGroupId || !input.classGroupId.trim()) {
      throw new Error('classGroupId is required');
    }
    if (!input.sessionName || !input.sessionName.trim()) {
      throw new Error('sessionName is required');
    }
    if (!input.capturedTimes || input.capturedTimes.length === 0) {
      throw new Error('capturedTimes must not be empty');
    }

    const metadata: MultistopSessionMetadata = {
      sessionName: input.sessionName.trim(),
      capturedTimes: input.capturedTimes
    };

    return this.toolSessionRepository.create({
      toolType: 'multistop',
      classGroupId: input.classGroupId,
      lessonId: input.lessonId,
      sessionMetadata: metadata
    });
  }
}
