/**
 * Record Timer Result Use Case
 * Persists timer session logs to dedicated tool_sessions table
 * Refactored from PerformanceEntry to ToolSession for domain integrity
 */

import { Sport } from '@viccoboard/core';
import type { ToolSessionRepository } from '../repositories/tool-session.repository.js';

export interface RecordTimerResultInput {
  sessionId: string;
  classGroupId?: string;
  lessonId?: string;
  mode: 'stopwatch' | 'countdown' | 'interval';
  elapsedMs: number;
  durationMs?: number;
  intervalMs?: number;
  intervalCount?: number;
  audioEnabled: boolean;
  metadata?: Record<string, any>;
}

export class RecordTimerResultUseCase {
  constructor(private toolSessionRepository: ToolSessionRepository) {}

  async execute(input: RecordTimerResultInput): Promise<Sport.ToolSession> {
    // Validate input
    if (!input.sessionId) {
      throw new Error('sessionId is required');
    }
    if (!['stopwatch', 'countdown', 'interval'].includes(input.mode)) {
      throw new Error('mode must be one of: stopwatch, countdown, interval');
    }
    if (input.elapsedMs === undefined || input.elapsedMs === null) {
      throw new Error('elapsedMs is required');
    }
    if (input.elapsedMs < 0) {
      throw new Error('elapsedMs must be non-negative');
    }
    if (typeof input.audioEnabled !== 'boolean') {
      throw new Error('audioEnabled must be a boolean');
    }

    const now = new Date();

    // Persist timer session to tool_sessions table
    return this.toolSessionRepository.create({
      toolType: 'timer',
      classGroupId: input.classGroupId,
      lessonId: input.lessonId,
      sessionMetadata: {
        sessionId: input.sessionId,
        mode: input.mode,
        elapsedMs: input.elapsedMs,
        durationMs: input.durationMs,
        intervalMs: input.intervalMs,
        intervalCount: input.intervalCount,
        audioEnabled: input.audioEnabled,
        ...input.metadata
      },
      startedAt: input.metadata?.timestamp || now
    });
  }
}
