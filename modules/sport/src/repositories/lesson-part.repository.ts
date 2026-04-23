/**
 * Lesson Part Repository
 * Handles persistence of lesson part records (plannable lesson structure)
 */

import { AdapterRepository } from '@viccoboard/storage';
import { LessonPart } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

/**
 * Internal row type used when persisting lesson parts.
 * Extends LessonPart with the foreign-key and ordering fields that
 * live in the DB but are not part of the core LessonPart interface.
 */
interface LessonPartRow {
  id: string;
  lesson_id: string;
  description: string;
  duration?: number;
  type?: string;
  order_index: number;
}

export class LessonPartRepository extends AdapterRepository<LessonPart> {
  constructor(adapter: StorageAdapter) {
    super(adapter, 'lesson_parts');
  }

  mapToEntity(row: any): LessonPart {
    return {
      id: row.id,
      description: row.description,
      duration: row.duration ?? undefined,
      type: row.type || undefined
    };
  }

  mapToRow(entity: Partial<LessonPart>): any {
    const row: any = {};
    if (entity.id !== undefined) row.id = entity.id;
    if (entity.description !== undefined) row.description = entity.description;
    if (entity.duration !== undefined) row.duration = entity.duration;
    if (entity.type !== undefined) row.type = entity.type;
    return row;
  }

  /**
   * Find all parts for a given lesson, ordered by order_index.
   */
  async findByLesson(lessonId: string): Promise<LessonPart[]> {
    const rows = await this.adapter.getAll('lesson_parts', { lesson_id: lessonId }) as LessonPartRow[];
    rows.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    return rows.map(row => this.mapToEntity(row));
  }

  /**
   * Create a new lesson part and associate it with a lesson.
   */
  async createPart(
    lessonId: string,
    input: Omit<LessonPart, 'id'>,
    orderIndex: number
  ): Promise<LessonPart> {
    const id = this.generateId();
    const row: LessonPartRow = {
      id,
      lesson_id: lessonId,
      description: input.description,
      order_index: orderIndex
    };
    if (input.duration !== undefined) row.duration = input.duration;
    if (input.type) row.type = input.type;

    await this.adapter.insert('lesson_parts', row);
    return { id, description: input.description, duration: input.duration, type: input.type };
  }

  /**
   * Delete all parts for a lesson (used before replacing with new parts on update).
   */
  async deleteByLesson(lessonId: string): Promise<void> {
    const parts = await this.findByLesson(lessonId);
    for (const part of parts) {
      await this.adapter.delete('lesson_parts', part.id);
    }
  }

  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
