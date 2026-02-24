/**
 * Sport Table Repository
 * Stores raw Sport grading table schema fields in sport_tables.
 */

import { SportSchema } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

export class SportTableRepository {
  private readonly tableName = 'sport_tables';

  constructor(private adapter: StorageAdapter) {}

  async save(entity: SportSchema.SportTable): Promise<SportSchema.SportTable> {
    const existing = await this.adapter.getById(this.tableName, entity.id);
    const row = this.mapToRow(entity);

    if (existing) {
      await this.adapter.update(this.tableName, entity.id, row);
      return entity;
    }

    await this.adapter.insert(this.tableName, row);
    return entity;
  }

  async findById(id: string): Promise<SportSchema.SportTable | null> {
    const row = await this.adapter.getById(this.tableName, id);
    return row ? this.mapToEntity(row) : null;
  }

  async findAll(): Promise<SportSchema.SportTable[]> {
    const rows = await this.adapter.getAll(this.tableName);
    return rows.map((row) => this.mapToEntity(row));
  }

  async delete(id: string): Promise<boolean> {
    return this.adapter.delete(this.tableName, id);
  }

  private mapToEntity(row: Record<string, unknown>): SportSchema.SportTable {
    return {
      grade_scheme: row.grade_scheme as string,
      id: row.id as string,
      name: row.name as string,
      teacher_id: row.teacher_id as string,
      color: row.color as string | undefined,
      created_at: row.created_at as string | undefined,
      grade_scheme_direction: row.grade_scheme_direction as string | undefined,
      is_dirty: row.is_dirty as number | undefined,
      school: row.school as string | undefined,
      updated_at: row.updated_at as string | undefined,
      version: row.version as number | undefined,
      visibility: row.visibility as string | undefined
    };
  }

  private mapToRow(entity: SportSchema.SportTable): Record<string, unknown> {
    return {
      id: entity.id,
      name: entity.name,
      grade_scheme: entity.grade_scheme,
      teacher_id: entity.teacher_id,
      color: entity.color,
      created_at: entity.created_at,
      grade_scheme_direction: entity.grade_scheme_direction,
      is_dirty: entity.is_dirty,
      school: entity.school,
      updated_at: entity.updated_at,
      version: entity.version,
      visibility: entity.visibility
    };
  }
}
