/**
 * Create Lesson Use Case  
 * Business logic for creating a new lesson
 */

import { Lesson } from '@viccoboard/core';
import { LessonRepository } from '../repositories/lesson.repository.js';

export interface CreateLessonInput {
  classGroupId: string;
  date: Date;
  shortcuts?: string[];
  randomStudentSeed?: string;
}

export class CreateLessonUseCase {
  constructor(
    private lessonRepo: LessonRepository
  ) {}

  async execute(input: CreateLessonInput): Promise<Lesson> {
    // Validation
    await this.validate(input);

    // Create new lesson
    const lesson = await this.lessonRepo.create({
      classGroupId: input.classGroupId,
      date: input.date,
      shortcuts: input.shortcuts,
      randomStudentSeed: input.randomStudentSeed,
      lessonParts: [],
      attendance: []
    });

    return lesson;
  }

  private async validate(input: CreateLessonInput): Promise<void> {
    if (!input.classGroupId || input.classGroupId.trim().length === 0) {
      throw new Error('Class group ID is required');
    }

    if (!input.date) {
      throw new Error('Date is required');
    }

    if (isNaN(input.date.getTime())) {
      throw new Error('Invalid date');
    }
  }
}
