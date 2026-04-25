/**
 * Lesson Repository
 * Handles persistence of lesson records
 */

import { AdapterRepository } from '@viccoboard/storage';
import { Lesson } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

const DEFAULT_LESSON_START_TIME = '08:00';

export class LessonRepository extends AdapterRepository<Lesson> {
  constructor(adapter: StorageAdapter) {
    super(adapter, 'lessons');
  }

  /**
   * Map database row to Lesson entity
   */
  mapToEntity(row: any): Lesson {
    const lessonDate = new Date(row.date);

    return {
      id: row.id,
      classGroupId: row.class_group_id,
      date: lessonDate,
      startTime: this.resolveStartTime(row.start_time, lessonDate),
      durationMinutes: this.resolveDurationMinutes(row.duration_minutes),
      title: row.title || undefined,
      room: row.room || undefined,
      lessonParts: [], // Loaded separately via LessonPartRepository
      shortcuts: row.shortcuts ? JSON.parse(row.shortcuts) : undefined,
      randomStudentSeed: row.random_student_seed || undefined,
      randomStudentHistory: row.random_student_history ? JSON.parse(row.random_student_history) : undefined,
      attendance: [], // Loaded separately via AttendanceRepository
      createdAt: new Date(row.created_at),
      lastModified: new Date(row.last_modified)
    };
  }

  /**
   * Map Lesson entity to database row
   */
  mapToRow(entity: Partial<Lesson>): any {
    const row: any = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.classGroupId !== undefined) row.class_group_id = entity.classGroupId;
    if (entity.date !== undefined) row.date = entity.date.toISOString();
    if (entity.startTime !== undefined) row.start_time = entity.startTime;
    if (entity.durationMinutes !== undefined) row.duration_minutes = entity.durationMinutes;
    if (entity.title !== undefined) row.title = entity.title;
    if (entity.room !== undefined) row.room = entity.room;
    if (entity.shortcuts !== undefined) row.shortcuts = JSON.stringify(entity.shortcuts);
    if (entity.randomStudentSeed !== undefined) row.random_student_seed = entity.randomStudentSeed;
    if (entity.randomStudentHistory !== undefined) row.random_student_history = JSON.stringify(entity.randomStudentHistory);
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt.toISOString();
    if (entity.lastModified !== undefined) row.last_modified = entity.lastModified.toISOString();

    return row;
  }

  /**
   * Find all lessons for a class group
   */
  async findByClassGroup(classGroupId: string): Promise<Lesson[]> {
    return this.find({ class_group_id: classGroupId });
  }

  /**
   * Find lessons by date range
   */
  async findByDateRange(classGroupId: string, startDate: Date, endDate: Date): Promise<Lesson[]> {
    const allLessons = await this.findByClassGroup(classGroupId);
    return allLessons.filter(lesson => 
      lesson.date >= startDate && lesson.date <= endDate
    );
  }

  /**
   * Find today's lessons for a class
   */
  async findTodayByClassGroup(classGroupId: string): Promise<Lesson[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.findByDateRange(classGroupId, today, tomorrow);
  }

  /**
   * Get most recent lesson for a class
   */
  async getMostRecent(classGroupId: string): Promise<Lesson | null> {
    const lessons = await this.findByClassGroup(classGroupId);
    if (lessons.length === 0) return null;

    lessons.sort((a, b) => b.date.getTime() - a.date.getTime());
    return lessons[0];
  }

  private resolveStartTime(rawStartTime: unknown, lessonDate: Date): string {
    if (typeof rawStartTime === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(rawStartTime)) {
      return rawStartTime;
    }

    if (lessonDate.getHours() !== 0 || lessonDate.getMinutes() !== 0) {
      const hours = lessonDate.getHours().toString().padStart(2, '0');
      const minutes = lessonDate.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }

    return DEFAULT_LESSON_START_TIME;
  }

  private resolveDurationMinutes(rawDuration: unknown): 45 | 90 {
    if (rawDuration === 45 || rawDuration === '45') {
      return 45;
    }
    if (rawDuration === 90 || rawDuration === '90') {
      return 90;
    }

    if (rawDuration !== null && rawDuration !== undefined) {
      throw new Error(`Invalid lesson duration value "${String(rawDuration)}" in persistence layer`);
    }

    return 45;
  }
}
