/**
 * Record Feedback Session Use Case
 * Creates or finalises a lesson feedback session with method, config, and responses.
 */

import { Sport } from '@viccoboard/core';
import type { FeedbackSessionRepository } from '../repositories/feedback-session.repository.js';

export interface RecordFeedbackSessionInput {
  classGroupId: string;
  lessonId?: string;
  method: Sport.FeedbackMethod;
  configuration: Sport.FeedbackConfig;
  responses: Sport.FeedbackResponse[];
  completedAt?: Date;
}

export class RecordFeedbackSessionUseCase {
  constructor(private feedbackSessionRepository: FeedbackSessionRepository) {}

  async execute(input: RecordFeedbackSessionInput): Promise<Sport.FeedbackSession> {
    if (!input.classGroupId) {
      throw new Error('classGroupId is required');
    }
    if (!input.method || !input.method.type) {
      throw new Error('method with type is required');
    }
    if (!input.configuration) {
      throw new Error('configuration is required');
    }

    return this.feedbackSessionRepository.create({
      classGroupId: input.classGroupId,
      lessonId: input.lessonId,
      method: input.method,
      configuration: input.configuration,
      responses: input.responses,
      completedAt: input.completedAt ?? new Date()
    });
  }
}
