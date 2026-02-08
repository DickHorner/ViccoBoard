/**
 * SportZens UserData Repository
 * Stores raw SportZens user schema fields in user_data.
 */

import { SportZens, safeJsonParse, safeJsonStringify } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

export class SportZensUserDataRepository {
  private readonly tableName = 'user_data';

  constructor(private adapter: StorageAdapter) {}

  async save(entity: SportZens.SportZensUserData): Promise<SportZens.SportZensUserData> {
    const existing = await this.adapter.getById(this.tableName, entity.id);
    const row = this.mapToRow(entity);

    if (existing) {
      await this.adapter.update(this.tableName, entity.id, row);
      return entity;
    }

    await this.adapter.insert(this.tableName, row);
    return entity;
  }

  async findById(id: string): Promise<SportZens.SportZensUserData | null> {
    const row = await this.adapter.getById(this.tableName, id);
    return row ? this.mapToEntity(row) : null;
  }

  async findAll(): Promise<SportZens.SportZensUserData[]> {
    const rows = await this.adapter.getAll(this.tableName);
    return rows.map((row) => this.mapToEntity(row));
  }

  async delete(id: string): Promise<boolean> {
    return this.adapter.delete(this.tableName, id);
  }

  private mapToEntity(row: Record<string, unknown>): SportZens.SportZensUserData {
    return {
      email: row.email as string,
      id: row.id as string,
      role: row.role as string,
      addons: safeJsonParse(row.addons as string | undefined, undefined, 'SportZensUserData.addons') as unknown[] | undefined,
      first_name: row.first_name as string | undefined,
      invoices: safeJsonParse(row.invoices as string | undefined, undefined, 'SportZensUserData.invoices') as unknown[] | undefined,
      last_name: row.last_name as string | undefined,
      settings: safeJsonParse(row.settings as string | undefined, undefined, 'SportZensUserData.settings')
    };
  }

  private mapToRow(entity: SportZens.SportZensUserData): Record<string, unknown> {
    return {
      id: entity.id,
      email: entity.email,
      role: entity.role,
      addons: entity.addons ? safeJsonStringify(entity.addons, 'SportZensUserData.addons') : undefined,
      first_name: entity.first_name,
      invoices: entity.invoices ? safeJsonStringify(entity.invoices, 'SportZensUserData.invoices') : undefined,
      last_name: entity.last_name,
      settings: entity.settings ? safeJsonStringify(entity.settings, 'SportZensUserData.settings') : undefined
    };
  }
}
