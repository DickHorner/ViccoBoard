/**
 * Record Dice Roll Use Case
 * Persists dice roll logs to dedicated tool_sessions table
 */

import { Sport } from '@viccoboard/core';
import type { ToolSessionRepository } from '../repositories/tool-session.repository.js';

export interface RecordDiceRollInput {
  sessionId: string;
  classGroupId?: string;
  lessonId?: string;
  min: number;
  max: number;
  result: number;
  metadata?: Record<string, any>;
}

export class RecordDiceRollUseCase {
  constructor(private toolSessionRepository: ToolSessionRepository) {}

  async execute(input: RecordDiceRollInput): Promise<Sport.ToolSession> {
    if (!input.sessionId) {
      throw new Error('sessionId is required');
    }
    if (!Number.isInteger(input.min)) {
      throw new Error('min must be an integer');
    }
    if (!Number.isInteger(input.max)) {
      throw new Error('max must be an integer');
    }
    if (input.min > input.max) {
      throw new Error('min must not be greater than max');
    }
    if (!Number.isInteger(input.result)) {
      throw new Error('result must be an integer');
    }
    if (input.result < input.min || input.result > input.max) {
      throw new Error('result must be within the configured range');
    }

    return this.toolSessionRepository.create({
      toolType: 'dice',
      classGroupId: input.classGroupId,
      lessonId: input.lessonId,
      sessionMetadata: {
        sessionId: input.sessionId,
        min: input.min,
        max: input.max,
        result: input.result,
        ...input.metadata
      },
      startedAt: input.metadata?.timestamp instanceof Date
      ? input.metadata.timestamp
      : new Date()
    });
  }
}
