/**
 * Save Pushup Session Use Case
 *
 * Persists a completed push-up tracking session (per-person rep counts and
 * quality ratings, session configuration, duration) to the tool_sessions table
 * so that results are durable and inspectable in the statistics view.
 */

import { Sport } from '@viccoboard/core';
import type { ToolSessionRepository } from '../repositories/tool-session.repository.js';
import type { PushupQuality } from '../services/pushup-repetition-counter.service.js';

export interface PushupPersonData {
  personId: number;
  count: number;
  quality: PushupQuality;
}

export interface SavePushupSessionInput {
  classGroupId?: string;
  lessonId?: string;
  /** Frame-capture rate used during the session (frames per second). */
  fps: number;
  /** Maximum number of persons tracked during the session (1–4). */
  maxPersons: number;
  /** Total elapsed tracking time in seconds. */
  durationSeconds: number;
  /** Per-person results at the time the session was stopped. */
  persons: PushupPersonData[];
  /** Optional extra metadata (e.g. { startedAt: Date }). */
  metadata?: Record<string, unknown>;
}

export class SavePushupSessionUseCase {
  constructor(private toolSessionRepository: ToolSessionRepository) {}

  async execute(input: SavePushupSessionInput): Promise<Sport.ToolSession> {
    if (typeof input.fps !== 'number' || !isFinite(input.fps) || input.fps <= 0) {
      throw new Error('fps must be a positive number');
    }
    if (!Number.isInteger(input.maxPersons) || input.maxPersons < 1 || input.maxPersons > 4) {
      throw new Error('maxPersons must be an integer between 1 and 4');
    }
    if (
      typeof input.durationSeconds !== 'number' ||
      !isFinite(input.durationSeconds) ||
      input.durationSeconds < 0
    ) {
      throw new Error('durationSeconds must be a non-negative number');
    }
    if (!Array.isArray(input.persons) || input.persons.length === 0) {
      throw new Error('persons must be a non-empty array');
    }

    const now = new Date();
    const startedAt =
      input.metadata?.startedAt instanceof Date
        ? input.metadata.startedAt
        : new Date(now.getTime() - input.durationSeconds * 1000);

    return this.toolSessionRepository.create({
      toolType: 'pushup-tracking',
      classGroupId: input.classGroupId,
      lessonId: input.lessonId,
      sessionMetadata: {
        fps: input.fps,
        maxPersons: input.maxPersons,
        durationSeconds: input.durationSeconds,
        persons: input.persons,
        totalReps: input.persons.reduce((sum, p) => sum + p.count, 0),
        ...input.metadata,
      },
      startedAt,
      endedAt: now,
    });
  }
}
