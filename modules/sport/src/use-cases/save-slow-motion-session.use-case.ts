/**
 * Save Slow Motion Analysis Session Use Case
 * Persists a slow-motion / biomechanics analysis session as a ToolSession
 * (toolType = 'slow-motion').
 */

import { Sport } from '@viccoboard/core';
import type { ToolSessionRepository } from '../repositories/tool-session.repository.js';

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface BiomechanicsMarkerInput {
  bodyPoint: Sport.BodyPoint;
  x: number;
  y: number;
  color?: string;
}

export interface BiomechanicsKeyframeInput {
  id: string;
  timeSec: number;
  markers: BiomechanicsMarkerInput[];
}

export interface ReferenceLineInput {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
}

export interface SaveSlowMotionSessionInput {
  /** Existing session ID to update, or omit to create a new session. */
  sessionId?: string;
  classGroupId?: string;
  lessonId?: string;
  sessionName: string;
  studentLabel?: string;
  exerciseName?: string;
  videoDurationSec?: number;
  keyframes: BiomechanicsKeyframeInput[];
  notes?: string;
  referenceLines?: ReferenceLineInput[];
}

// ---------------------------------------------------------------------------
// Stored metadata (strict shape persisted in session_metadata JSON)
// ---------------------------------------------------------------------------

export interface SlowMotionSessionMetadata {
  sessionName: string;
  studentLabel?: string;
  exerciseName?: string;
  videoDurationSec?: number;
  keyframes: BiomechanicsKeyframeInput[];
  notes?: string;
  referenceLines?: ReferenceLineInput[];
}

// ---------------------------------------------------------------------------
// Use case
// ---------------------------------------------------------------------------

export class SaveSlowMotionSessionUseCase {
  constructor(private toolSessionRepository: ToolSessionRepository) {}

  async execute(input: SaveSlowMotionSessionInput): Promise<Sport.ToolSession> {
    if (!input.sessionName || !input.sessionName.trim()) {
      throw new Error('sessionName is required');
    }

    const metadata: SlowMotionSessionMetadata = {
      sessionName: input.sessionName.trim(),
      studentLabel: input.studentLabel,
      exerciseName: input.exerciseName,
      videoDurationSec: input.videoDurationSec,
      keyframes: input.keyframes,
      notes: input.notes,
      referenceLines: input.referenceLines
    };

    if (input.sessionId) {
      return this.toolSessionRepository.update(input.sessionId, {
        sessionMetadata: metadata,
        endedAt: new Date()
      });
    }

    return this.toolSessionRepository.create({
      toolType: 'slow-motion',
      classGroupId: input.classGroupId,
      lessonId: input.lessonId,
      sessionMetadata: metadata
    });
  }
}
