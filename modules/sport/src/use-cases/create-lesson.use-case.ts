/**
 * Create Lesson Use Case  
 * Business logic for creating a new lesson
 */

import { Lesson } from '@viccoboard/core';
import { LessonRepository } from '../repositories/lesson.repository.js';

const DEFAULT_LESSON_START_MINUTES = 8 * 60;

export interface CreateLessonInput {
  classGroupId: string;
  date: Date;
  startTime: string;
  durationMinutes: number;
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
      startTime: input.startTime.trim(),
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
    if (
      !Number.isInteger(input.durationMinutes) ||
      input.durationMinutes <= 0 ||
      input.durationMinutes > 300
    ) {
      throw new Error('Duration must be a whole number between 1 and 300 minutes');
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
    const parsedStartTime = this.parseStartTimeToMinutesOrNull(lesson.startTime);
    if (parsedStartTime !== null) {
      return parsedStartTime;
    }

    const dateDerivedMinutes = lesson.date.getHours() * 60 + lesson.date.getMinutes();
    if (dateDerivedMinutes > 0) {
      return dateDerivedMinutes;
    }

    return DEFAULT_LESSON_START_MINUTES;
  }

  private parseStartTimeToMinutesOrNull(startTime: string | undefined): number | null {
    if (!startTime || !/^(\d{2}):(\d{2})$/.test(startTime)) {
      return null;
    }

    const [hours, minutes] = startTime.split(':').map((value) => Number(value));
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }

    return hours * 60 + minutes;
  }

  private isSameCalendarDay(left: Date, right: Date): boolean {
    return (
      left.getFullYear() === right.getFullYear() &&
      left.getMonth() === right.getMonth() &&
      left.getDate() === right.getDate()
    );
  }
}
