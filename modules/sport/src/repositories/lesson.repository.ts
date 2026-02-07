/**
 * Lesson Repository
 * Handles persistence of lesson records
 */

import { AdapterRepository } from '@viccoboard/storage';
import { Lesson } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

export class LessonRepository extends AdapterRepository<Lesson> {
  constructor(adapter: StorageAdapter) {
    super(adapter, 'lessons');
  }

  /**
   * Map database row to Lesson entity
   */
  mapToEntity(row: any): Lesson {
    return {
      id: row.id,
      classGroupId: row.class_group_id,
      date: new Date(row.date),
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
}
