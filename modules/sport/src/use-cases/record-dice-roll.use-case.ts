/**
 * Record Dice Roll Use Case
 * Persists a dice roll log entry as a ToolSession (toolType = 'dice').
 */

import { Sport } from '@viccoboard/core';
import type { ToolSessionRepository } from '../repositories/tool-session.repository.js';

export interface RecordDiceRollInput {
  classGroupId?: string;
  lessonId?: string;
  minValue: number;
  maxValue: number;
  result: number;
}

export class RecordDiceRollUseCase {
  constructor(private toolSessionRepository: ToolSessionRepository) {}

  async execute(input: RecordDiceRollInput): Promise<Sport.ToolSession> {
    if (input.minValue === undefined || input.minValue === null) {
      throw new Error('minValue is required');
    }
    if (input.maxValue === undefined || input.maxValue === null) {
      throw new Error('maxValue is required');
    }
    if (input.minValue > input.maxValue) {
      throw new Error('minValue must be less than or equal to maxValue');
    }
    if (input.result < input.minValue || input.result > input.maxValue) {
      throw new Error('result must be between minValue and maxValue');
    }

    const now = new Date();

    return this.toolSessionRepository.create({
      toolType: 'dice',
      classGroupId: input.classGroupId,
      lessonId: input.lessonId,
      sessionMetadata: {
        minValue: input.minValue,
        maxValue: input.maxValue,
        result: input.result,
        timestamp: now.toISOString()
      },
      startedAt: now
    });
  }
}
