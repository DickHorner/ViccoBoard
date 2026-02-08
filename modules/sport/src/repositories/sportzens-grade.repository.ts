/**
 * SportZens Grade Repository
 * Stores raw SportZens grade schema fields in grades.
 */

import { SportZens, safeJsonParse, safeJsonStringify } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

export class SportZensGradeRepository {
  private readonly tableName = 'grades';

  constructor(private adapter: StorageAdapter) {}

  async save(entity: SportZens.SportZensGrade): Promise<SportZens.SportZensGrade> {
    const existing = await this.adapter.getById(this.tableName, entity.id);
    const row = this.mapToRow(entity);

    if (existing) {
      await this.adapter.update(this.tableName, entity.id, row);
      return entity;
    }

    await this.adapter.insert(this.tableName, row);
    return entity;
  }

  async findById(id: string): Promise<SportZens.SportZensGrade | null> {
    const row = await this.adapter.getById(this.tableName, id);
    return row ? this.mapToEntity(row) : null;
  }

  async findAll(): Promise<SportZens.SportZensGrade[]> {
    const rows = await this.adapter.getAll(this.tableName);
    return rows.map((row) => this.mapToEntity(row));
  }

  async delete(id: string): Promise<boolean> {
    return this.adapter.delete(this.tableName, id);
  }

  private mapToEntity(row: Record<string, unknown>): SportZens.SportZensGrade {
    return {
      category_id: row.category_id as string,
      class_id: row.class_id as string,
      id: row.id as string,
      student_id: row.student_id as string,
      teacher_id: row.teacher_id as string,
      type: row.type as string,
      year: row.year as number,
      created_at: row.created_at as string | undefined,
      criterias: safeJsonParse(row.criterias as string | undefined, undefined, 'SportZensGrade.criterias'),
      deleted: row.deleted as number | undefined,
      grade: row.grade as string | undefined,
      is_dirty: row.is_dirty as number | undefined,
      main_category_id: row.main_category_id as string | undefined,
      name: row.name as string | undefined,
      total_points: row.total_points as number | undefined,
      updated_at: row.updated_at as string | undefined,
      weight: row.weight as number | undefined
    };
  }

  private mapToRow(entity: SportZens.SportZensGrade): Record<string, unknown> {
    return {
      id: entity.id,
      category_id: entity.category_id,
      class_id: entity.class_id,
      student_id: entity.student_id,
      teacher_id: entity.teacher_id,
      type: entity.type,
      year: entity.year,
      created_at: entity.created_at,
      criterias: entity.criterias ? safeJsonStringify(entity.criterias, 'SportZensGrade.criterias') : undefined,
      deleted: entity.deleted,
      grade: entity.grade,
      is_dirty: entity.is_dirty,
      main_category_id: entity.main_category_id,
      name: entity.name,
      total_points: entity.total_points,
      updated_at: entity.updated_at,
      weight: entity.weight
    };
  }
}
