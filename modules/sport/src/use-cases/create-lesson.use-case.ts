/**
 * Create Lesson Use Case  
 * Business logic for creating a new lesson
 */

import { Lesson } from '@viccoboard/core';
import { LessonRepository } from '../repositories/lesson.repository.js';

export interface CreateLessonInput {
  classGroupId: string;
  date: Date;
  startTime: string;
  durationMinutes: 45 | 90;
  title?: string;
  room?: string;
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
      startTime: input.startTime,
      durationMinutes: input.durationMinutes,
      title: input.title,
      room: input.room,
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

    if (!input.startTime || input.startTime.trim().length === 0) {
      throw new Error('Start time is required');
    }

    const lessonStart = this.parseStartTimeToMinutes(input.startTime);
    const validDurations: Array<CreateLessonInput['durationMinutes']> = [45, 90];
    if (!validDurations.includes(input.durationMinutes)) {
      throw new Error('Duration must be 45 or 90 minutes');
    }

    const lessonEnd = lessonStart + input.durationMinutes;
    const lessons = await this.lessonRepo.findByClassGroup(input.classGroupId);
    const hasOverlap = lessons.some((existingLesson) => {
      if (!this.isSameCalendarDay(existingLesson.date, input.date)) {
        return false;
      }

      const existingStart = this.resolveLessonStartMinutes(existingLesson);
      const existingEnd = existingStart + existingLesson.durationMinutes;
      return lessonStart < existingEnd && lessonEnd > existingStart;
    });

    if (hasOverlap) {
      throw new Error('Lesson overlaps with an existing lesson for this class on this day');
    }
  }

  private parseStartTimeToMinutes(startTime: string): number {
    const normalized = startTime.trim();
    const match = /^(\d{2}):(\d{2})$/.exec(normalized);
    if (!match) {
      throw new Error('Start time must be in HH:MM format');
    }

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error('Start time must be in HH:MM format');
    }

    return hours * 60 + minutes;
  }

  private resolveLessonStartMinutes(lesson: Lesson): number {
    if (lesson.startTime) {
      try {
        return this.parseStartTimeToMinutes(lesson.startTime);
      } catch {
        // Fall back to lesson date time for legacy rows with malformed startTime.
      }
    }

    return lesson.date.getHours() * 60 + lesson.date.getMinutes();
  }

  private isSameCalendarDay(left: Date, right: Date): boolean {
    return (
      left.getFullYear() === right.getFullYear() &&
      left.getMonth() === right.getMonth() &&
      left.getDate() === right.getDate()
    );
  }
}
