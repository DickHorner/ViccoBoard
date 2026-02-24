/**
 * Sport UserData Repository
 * Stores raw Sport user schema fields in user_data.
 */

import { SportSchema, safeJsonParse, safeJsonStringify } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

export class SportUserDataRepository {
  private readonly tableName = 'user_data';

  constructor(private adapter: StorageAdapter) {}

  async save(entity: SportSchema.SportUserData): Promise<SportSchema.SportUserData> {
    const existing = await this.adapter.getById(this.tableName, entity.id);
    const row = this.mapToRow(entity);

    if (existing) {
      await this.adapter.update(this.tableName, entity.id, row);
      return entity;
    }

    await this.adapter.insert(this.tableName, row);
    return entity;
  }

  async findById(id: string): Promise<SportSchema.SportUserData | null> {
    const row = await this.adapter.getById(this.tableName, id);
    return row ? this.mapToEntity(row) : null;
  }

  async findAll(): Promise<SportSchema.SportUserData[]> {
    const rows = await this.adapter.getAll(this.tableName);
    return rows.map((row) => this.mapToEntity(row));
  }

  async delete(id: string): Promise<boolean> {
    return this.adapter.delete(this.tableName, id);
  }

  private mapToEntity(row: Record<string, unknown>): SportSchema.SportUserData {
    return {
      email: row.email as string,
      id: row.id as string,
      role: row.role as string,
      addons: safeJsonParse(row.addons as string | undefined, undefined, 'SportUserData.addons') as unknown[] | undefined,
      first_name: row.first_name as string | undefined,
      invoices: safeJsonParse(row.invoices as string | undefined, undefined, 'SportUserData.invoices') as unknown[] | undefined,
      last_name: row.last_name as string | undefined,
      settings: safeJsonParse(row.settings as string | undefined, undefined, 'SportUserData.settings')
    };
  }

  private mapToRow(entity: SportSchema.SportUserData): Record<string, unknown> {
    return {
      id: entity.id,
      email: entity.email,
      role: entity.role,
      addons: entity.addons ? safeJsonStringify(entity.addons, 'SportUserData.addons') : undefined,
      first_name: entity.first_name,
      invoices: entity.invoices ? safeJsonStringify(entity.invoices, 'SportUserData.invoices') : undefined,
      last_name: entity.last_name,
      settings: entity.settings ? safeJsonStringify(entity.settings, 'SportUserData.settings') : undefined
    };
  }
}
