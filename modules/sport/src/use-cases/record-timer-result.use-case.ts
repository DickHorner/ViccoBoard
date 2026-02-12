/**
 * Record Timer Result Use Case
 * Persists timer session logs to database
 */

import { Sport } from '@viccoboard/core';
import type { PerformanceEntryRepository } from '../repositories/performance-entry.repository.js';

export interface RecordTimerResultInput {
  sessionId: string;
  categoryId: string;
  mode: 'stopwatch' | 'countdown' | 'interval';
  elapsedMs: number;
  durationMs?: number;
  intervalMs?: number;
  intervalCount?: number;
  audioEnabled: boolean;
  metadata?: Record<string, any>;
}

export class RecordTimerResultUseCase {
  constructor(private performanceEntryRepository: PerformanceEntryRepository) {}

  async execute(input: RecordTimerResultInput): Promise<Sport.PerformanceEntry> {
    // Validate input
    if (!input.sessionId) {
      throw new Error('Session ID is required');
    }
    if (!input.categoryId) {
      throw new Error('Category ID is required');
    }
    if (!input.mode) {
      throw new Error('Timer mode is required');
    }
    if (input.elapsedMs === undefined || input.elapsedMs === null) {
      throw new Error('Elapsed time is required');
    }
    if (typeof input.audioEnabled !== 'boolean') {
      throw new Error('Audio enabled flag is required');
    }

    const now = new Date();

    // Persist timer result
    return this.performanceEntryRepository.create({
      studentId: input.sessionId,
      categoryId: input.categoryId,
      measurements: {
        mode: input.mode,
        elapsedMs: input.elapsedMs,
        durationMs: input.durationMs || null,
        intervalMs: input.intervalMs || null,
        intervalCount: input.intervalCount || 0,
        audioEnabled: input.audioEnabled
      },
      timestamp: input.metadata?.timestamp || now,
      metadata: {
        ...input.metadata,
        toolType: 'timer',
        sessionId: input.sessionId
      }
    });
  }
}
