/**
 * Save Finish Camera Session Use Case
 * Persists a finish-line camera session (time events captured at the finish line
 * during a long-distance run) to the tool_sessions table so that results are
 * durable, reopenable, and transferable to Mittelstrecke/Langstrecke grading.
 */

import { Sport } from '@viccoboard/core';
import type { ToolSessionRepository } from '../repositories/tool-session.repository.js';

/** Single crossing event captured at the finish line */
export interface FinishCameraEvent {
  /** Unique event ID within the session */
  id: string;
  /** Elapsed time in milliseconds from start of stopwatch */
  elapsedMs: number;
  /** ISO timestamp when the event was recorded */
  recordedAt: string;
  /** Student ID if this event has been assigned to a student */
  studentId?: string;
  /** Student display name for convenience (denormalised) */
  studentName?: string;
  /** Whether this event was manually added (vs. motion-detected) */
  manual: boolean;
}

export interface SaveFinishCameraSessionInput {
  /** Mandatory: which class this session belongs to */
  classGroupId: string;
  /** Optional lesson context */
  lessonId?: string;
  /** All finish-line crossing events captured during the session */
  events: FinishCameraEvent[];
  /** Total elapsed duration of the stopwatch in milliseconds */
  totalElapsedMs: number;
  /** ISO timestamp when the session was started */
  startedAt?: Date;
  /** ISO timestamp when the session was ended */
  endedAt?: Date;
}

export class SaveFinishCameraSessionUseCase {
  constructor(private toolSessionRepository: ToolSessionRepository) {}

  async execute(input: SaveFinishCameraSessionInput): Promise<Sport.ToolSession> {
    if (!input.classGroupId) {
      throw new Error('classGroupId is required');
    }
    if (!Array.isArray(input.events)) {
      throw new Error('events must be an array');
    }
    if (typeof input.totalElapsedMs !== 'number' || input.totalElapsedMs < 0) {
      throw new Error('totalElapsedMs must be a non-negative number');
    }

    for (const event of input.events) {
      if (!event.id) {
        throw new Error('Each event must have an id');
      }
      if (typeof event.elapsedMs !== 'number' || event.elapsedMs < 0) {
        throw new Error(`Invalid elapsedMs for event ${event.id}`);
      }
    }

    const now = new Date();
    const startedAt = input.startedAt ?? now;
    const endedAt = input.endedAt ?? now;

    return this.toolSessionRepository.create({
      toolType: 'finish-camera',
      classGroupId: input.classGroupId,
      lessonId: input.lessonId,
      sessionMetadata: {
        events: input.events,
        totalElapsedMs: input.totalElapsedMs
      },
      startedAt,
      endedAt
    });
  }
}
