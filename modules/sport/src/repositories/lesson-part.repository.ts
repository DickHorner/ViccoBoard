/**
 * Lesson Part Repository
 * Handles persistence of lesson-part records associated with a lesson.
 * Uses the same pattern as other sport repositories (uuid + adapter.insert).
 */

import { LessonPart } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';
import { v4 as uuidv4 } from 'uuid';

export class LessonPartRepository {
  constructor(private readonly adapter: StorageAdapter) {}

  private toEntity(row: any): LessonPart {
    return {
      id: row.id,
      description: row.description,
      duration: row.duration ?? undefined,
      type: row.type || undefined
    };
  }

  /** Return all parts for a lesson ordered by order_index. */
  async findByLesson(lessonId: string): Promise<LessonPart[]> {
    const rows = await this.adapter.getAll('lesson_parts', { lesson_id: lessonId }) as Array<{
      id: string; lesson_id: string; description: string;
      duration?: number; type?: string; order_index: number;
    }>;
    return rows
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
      .map(row => this.toEntity(row));
  }

  /** Create a new lesson part and associate it with a lesson. */
  async createPart(
    lessonId: string,
    input: Omit<LessonPart, 'id'>,
    orderIndex: number
  ): Promise<LessonPart> {
    const part: LessonPart = { id: uuidv4(), ...input };
    await this.adapter.insert('lesson_parts', {
      id: part.id,
      lesson_id: lessonId,
      description: part.description,
      duration: part.duration ?? null,
      type: part.type ?? null,
      order_index: orderIndex
    });
    return part;
  }

  /**
   * Replace all parts for a lesson atomically.
   * Uses the adapter transaction so a failed insert does not leave the lesson without parts.
   */
  async replacePartsForLesson(
    lessonId: string,
    parts: Omit<LessonPart, 'id'>[]
  ): Promise<LessonPart[]> {
    const created: LessonPart[] = [];
    await this.adapter.transaction(async () => {
      await this.deleteByLesson(lessonId);
      for (let i = 0; i < parts.length; i++) {
        created.push(await this.createPart(lessonId, parts[i], i));
      }
    });
    return created;
  }

  /** Delete all parts for a lesson. */
  async deleteByLesson(lessonId: string): Promise<void> {
    const parts = await this.findByLesson(lessonId);
    for (const part of parts) {
      await this.adapter.delete('lesson_parts', part.id);
    }
  }
}
