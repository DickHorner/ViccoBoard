/**
 * Update Lesson Use Case
 * Business logic for updating an existing lesson.
 * Enforces the same time/overlap rules as CreateLessonUseCase.
 */

import { Lesson } from '@viccoboard/core';
import type { LessonRepository } from '../repositories/lesson.repository.js';

const DEFAULT_LESSON_START_MINUTES = 8 * 60;

export interface UpdateLessonInput {
  lessonId: string;
  date?: Date;
  startTime?: string;
  durationMinutes?: 45 | 90;
  title?: string;
  room?: string;
  shortcuts?: string[];
}

export class UpdateLessonUseCase {
  constructor(private lessonRepo: LessonRepository) {}

  async execute(input: UpdateLessonInput): Promise<Lesson> {
    await this.validate(input);

    const updates: Partial<Lesson> = {};
    if (input.date !== undefined) updates.date = input.date;
    if (input.startTime !== undefined) updates.startTime = input.startTime.trim();
    if (input.durationMinutes !== undefined) updates.durationMinutes = input.durationMinutes;
    if (input.title !== undefined) updates.title = input.title;
    if (input.room !== undefined) updates.room = input.room;
    if (input.shortcuts !== undefined) updates.shortcuts = input.shortcuts;

    return this.lessonRepo.update(input.lessonId, updates);
  }

  private async validate(input: UpdateLessonInput): Promise<void> {
    const validDurations: Array<UpdateLessonInput['durationMinutes']> = [45, 90];
    if (input.durationMinutes !== undefined && !validDurations.includes(input.durationMinutes)) {
      throw new Error('Duration must be 45 or 90 minutes');
    }

    // Parse once, reuse in the overlap check below
    const parsedStartMinutes =
      input.startTime !== undefined ? this.parseStartTimeToMinutes(input.startTime) : undefined;

    // Only run overlap check when schedule-relevant fields are touched
    if (input.startTime !== undefined || input.date !== undefined || input.durationMinutes !== undefined) {
      const existing = await this.lessonRepo.findById(input.lessonId);
      if (!existing) {
        throw new Error('Lesson not found');
      }

      const updatedDate = input.date ?? existing.date;
      const updatedStart =
        parsedStartMinutes !== undefined
          ? parsedStartMinutes
          : this.resolveLessonStartMinutes(existing);
      const updatedDuration = input.durationMinutes ?? existing.durationMinutes;
      const updatedEnd = updatedStart + updatedDuration;

      const classLessons = await this.lessonRepo.findByClassGroup(existing.classGroupId);
      const hasOverlap = classLessons.some((other) => {
        if (other.id === input.lessonId) return false;
        if (!this.isSameCalendarDay(other.date, updatedDate)) return false;
        const otherStart = this.resolveLessonStartMinutes(other);
        const otherEnd = otherStart + other.durationMinutes;
        return updatedStart < otherEnd && updatedEnd > otherStart;
      });

      if (hasOverlap) {
        throw new Error('Lesson overlaps with an existing lesson for this class on this day');
      }
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
    const parsed = this.parseStartTimeToMinutesOrNull(lesson.startTime);
    if (parsed !== null) return parsed;

    const dateDerived = lesson.date.getHours() * 60 + lesson.date.getMinutes();
    if (dateDerived > 0) return dateDerived;

    return DEFAULT_LESSON_START_MINUTES;
  }

  private parseStartTimeToMinutesOrNull(startTime: string | undefined): number | null {
    if (!startTime || !/^(\d{2}):(\d{2})$/.test(startTime)) return null;

    const [hours, minutes] = startTime.split(':').map(Number);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

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
