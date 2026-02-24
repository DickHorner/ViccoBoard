/**
 * SportZens Student Repository
 * Stores raw SportZens student schema fields in students.
 */

import { SportZens, safeJsonParse, safeJsonStringify } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

export class SportZensStudentRepository {
  private readonly tableName = 'students';

  constructor(private adapter: StorageAdapter) {}

  async save(entity: SportZens.SportZensStudent): Promise<SportZens.SportZensStudent> {
    const existing = await this.adapter.getById(this.tableName, entity.id);
    const row = this.mapToRow(entity);

    if (existing) {
      await this.adapter.update(this.tableName, entity.id, row);
      return entity;
    }

    await this.adapter.insert(this.tableName, row);
    return entity;
  }

  async findById(id: string): Promise<SportZens.SportZensStudent | null> {
    const row = await this.adapter.getById(this.tableName, id);
    return row ? this.mapToEntity(row) : null;
  }

  async findAll(): Promise<SportZens.SportZensStudent[]> {
    const rows = await this.adapter.getAll(this.tableName);
    return rows.map((row) => this.mapToEntity(row));
  }

  async delete(id: string): Promise<boolean> {
    return this.adapter.delete(this.tableName, id);
  }

  private mapToEntity(row: Record<string, unknown>): SportZens.SportZensStudent {
    return {
      class_id: row.class_group_id as string,
      first_name: row.first_name as string,
      id: row.id as string,
      last_name: row.last_name as string,
      teacher_id: row.teacher_id as string,
      gender: row.gender as string | undefined,
      is_dirty: row.is_dirty as number | undefined,
      public_code: row.public_code as string | undefined,
      settings: safeJsonParse(row.settings as string | undefined, undefined, 'SportZensStudent.settings'),
      stats: safeJsonParse(row.stats as string | undefined, undefined, 'SportZensStudent.stats'),
      version: row.version as number | undefined
    };
  }

  private mapToRow(entity: SportZens.SportZensStudent): Record<string, unknown> {
    const now = new Date().toISOString();
    return {
      id: entity.id,
      class_group_id: entity.class_id,
      first_name: entity.first_name,
      last_name: entity.last_name,
      // Ensure created_at and last_modified are set (required by ViccoBoard schema)
      created_at: now,
      last_modified: now,
      teacher_id: entity.teacher_id,
      gender: entity.gender,
      is_dirty: entity.is_dirty,
      public_code: entity.public_code,
      settings: entity.settings ? safeJsonStringify(entity.settings, 'SportZensStudent.settings') : undefined,
      stats: entity.stats ? safeJsonStringify(entity.stats, 'SportZensStudent.stats') : undefined,
      version: entity.version
    };
  }
}
