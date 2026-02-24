/**
 * SportZens Class Repository
 * Stores raw SportZens class schema fields in class_groups.
 */

import { SportZens, safeJsonParse, safeJsonStringify } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

export class SportZensClassRepository {
  private readonly tableName = 'class_groups';

  constructor(private adapter: StorageAdapter) {}

  async save(entity: SportZens.SportZensClass): Promise<SportZens.SportZensClass> {
    const existing = await this.adapter.getById(this.tableName, entity.id);
    const row = this.mapToRow(entity);

    if (existing) {
      await this.adapter.update(this.tableName, entity.id, row);
      return entity;
    }

    await this.adapter.insert(this.tableName, row);
    return entity;
  }

  async findById(id: string): Promise<SportZens.SportZensClass | null> {
    const row = await this.adapter.getById(this.tableName, id);
    return row ? this.mapToEntity(row) : null;
  }

  async findAll(): Promise<SportZens.SportZensClass[]> {
    const rows = await this.adapter.getAll(this.tableName);
    return rows.map((row) => this.mapToEntity(row));
  }

  async delete(id: string): Promise<boolean> {
    return this.adapter.delete(this.tableName, id);
  }

  private mapToEntity(row: Record<string, unknown>): SportZens.SportZensClass {
    return {
      id: row.id as string,
      name: row.name as string,
      school_year: row.school_year as string,
      teacher_id: row.teacher_id as string,
      color: row.color as string | undefined,
      created_at: row.created_at as string | undefined,
      grade_category_count: row.grade_category_count as number | undefined,
      grade_scheme: row.grade_scheme as string | undefined,
      is_dirty: row.is_dirty as number | undefined,
      settings: safeJsonParse(row.settings as string | undefined, undefined, 'SportZensClass.settings'),
      sort: row.sort as string | undefined,
      stats: safeJsonParse(row.stats as string | undefined, undefined, 'SportZensClass.stats'),
      student_count: row.student_count as number | undefined,
      // Map last_modified -> updated_at for SportZens compatibility
      updated_at: (row.updated_at as string | undefined) || (row.last_modified as string | undefined),
      version: row.version as number | undefined
    };
  }

  private mapToRow(entity: SportZens.SportZensClass): Record<string, unknown> {
    const now = new Date().toISOString();
    return {
      id: entity.id,
      name: entity.name,
      school_year: entity.school_year,
      teacher_id: entity.teacher_id,
      color: entity.color,
      // Ensure created_at is set (required by ViccoBoard schema)
      created_at: entity.created_at || now,
      grade_category_count: entity.grade_category_count,
      grade_scheme: entity.grade_scheme,
      is_dirty: entity.is_dirty,
      settings: entity.settings ? safeJsonStringify(entity.settings, 'SportZensClass.settings') : undefined,
      sort: entity.sort,
      stats: entity.stats ? safeJsonStringify(entity.stats, 'SportZensClass.stats') : undefined,
      student_count: entity.student_count,
      updated_at: entity.updated_at,
      // Map updated_at -> last_modified (required by ViccoBoard schema)
      last_modified: entity.updated_at || now,
      version: entity.version
    };
  }
}
