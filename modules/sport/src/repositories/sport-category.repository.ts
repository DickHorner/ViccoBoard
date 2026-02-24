/**
 * SportZens Category Repository
 * Stores raw SportZens category schema fields in grade_categories.
 */

import { SportZens, safeJsonParse, safeJsonStringify } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

export class SportZensCategoryRepository {
  private readonly tableName = 'grade_categories';

  constructor(private adapter: StorageAdapter) {}

  async save(entity: SportZens.SportZensCategory): Promise<SportZens.SportZensCategory> {
    const existing = await this.adapter.getById(this.tableName, entity.id);
    const row = this.mapToRow(entity);

    if (existing) {
      await this.adapter.update(this.tableName, entity.id, row);
      return entity;
    }

    await this.adapter.insert(this.tableName, row);
    return entity;
  }

  async findById(id: string): Promise<SportZens.SportZensCategory | null> {
    const row = await this.adapter.getById(this.tableName, id);
    return row ? this.mapToEntity(row) : null;
  }

  async findAll(): Promise<SportZens.SportZensCategory[]> {
    const rows = await this.adapter.getAll(this.tableName);
    return rows.map((row) => this.mapToEntity(row));
  }

  async delete(id: string): Promise<boolean> {
    return this.adapter.delete(this.tableName, id);
  }

  private mapToEntity(row: Record<string, unknown>): SportZens.SportZensCategory {
    return {
      class_id: row.class_group_id as string,
      id: row.id as string,
      name: row.name as string,
      teacher_id: row.teacher_id as string,
      type: row.type as string,
      weight: row.weight as number,
      year: row.year as number,
      categories: safeJsonParse(row.categories as string | undefined, undefined, 'SportZensCategory.categories'),
      color: row.color as string | undefined,
      created_at: row.created_at as string | undefined,
      deleted: row.deleted as number | undefined,
      is_dirty: row.is_dirty as number | undefined,
      main_category_id: row.main_category_id as string | undefined,
      max_value: row.max_value as number | undefined,
      min_value: row.min_value as number | undefined,
      settings: safeJsonParse(row.settings as string | undefined, undefined, 'SportZensCategory.settings'),
      stats: safeJsonParse(row.stats as string | undefined, undefined, 'SportZensCategory.stats'),
      // Map last_modified -> updated_at for SportZens compatibility
      updated_at: (row.updated_at as string | undefined) || (row.last_modified as string | undefined)
    };
  }

  private mapToRow(entity: SportZens.SportZensCategory): Record<string, unknown> {
    const now = new Date().toISOString();
    return {
      id: entity.id,
      class_group_id: entity.class_id,
      name: entity.name,
      teacher_id: entity.teacher_id,
      type: entity.type,
      weight: entity.weight,
      year: entity.year,
      categories: entity.categories ? safeJsonStringify(entity.categories, 'SportZensCategory.categories') : undefined,
      color: entity.color,
      // Ensure created_at and last_modified are set (required by ViccoBoard schema)
      created_at: entity.created_at || now,
      last_modified: entity.updated_at || now,
      // ViccoBoard requires configuration (use settings as fallback)
      configuration: entity.settings ? safeJsonStringify(entity.settings, 'SportZensCategory.configuration') : '{}',
      deleted: entity.deleted,
      is_dirty: entity.is_dirty,
      main_category_id: entity.main_category_id,
      max_value: entity.max_value,
      min_value: entity.min_value,
      settings: entity.settings ? safeJsonStringify(entity.settings, 'SportZensCategory.settings') : undefined,
      stats: entity.stats ? safeJsonStringify(entity.stats, 'SportZensCategory.stats') : undefined,
      updated_at: entity.updated_at
    };
  }
}
