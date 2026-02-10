/**
 * In-Memory Storage Adapter
 * Simple map-backed adapter for unit tests.
 * NOT for production use.
 */

import type { StorageAdapter, TableSchema } from './storage-adapter.interface.js';

export class InMemoryStorageAdapter implements StorageAdapter {
  private tables: Map<string, Map<string, Record<string, any>>> = new Map();

  async initialize(): Promise<void> {
    this.tables.clear();
  }

  async query<T = any>(_query: string, _params?: any[]): Promise<T[]> {
    return [];
  }

  async queryOne<T = any>(_query: string, _params?: any[]): Promise<T | null> {
    return null;
  }

  async execute(_query: string, _params?: any[]): Promise<{ changes: number; lastId?: any }> {
    return { changes: 0 };
  }

  async transaction<T>(callback: () => T | Promise<T>): Promise<T> {
    return callback();
  }

  async tableExists(tableName: string): Promise<boolean> {
    return this.tables.has(tableName);
  }

  async createTable(tableName: string, _schema: TableSchema): Promise<void> {
    if (!this.tables.has(tableName)) {
      this.tables.set(tableName, new Map());
    }
  }

  async getAll<T = any>(tableName: string, criteria?: Record<string, any>): Promise<T[]> {
    const table = this.tables.get(tableName);
    if (!table) return [];

    let rows = Array.from(table.values());

    if (criteria && Object.keys(criteria).length > 0) {
      rows = rows.filter(row =>
        Object.entries(criteria).every(([key, value]) => row[key] === value)
      );
    }

    return rows as T[];
  }

  async getById<T = any>(tableName: string, id: string): Promise<T | null> {
    const table = this.tables.get(tableName);
    if (!table) return null;
    return (table.get(id) as T) ?? null;
  }

  async insert(tableName: string, record: Record<string, any>): Promise<void> {
    if (!this.tables.has(tableName)) {
      this.tables.set(tableName, new Map());
    }
    const table = this.tables.get(tableName)!;
    table.set(record.id, { ...record });
  }

  async update(tableName: string, id: string, updates: Record<string, any>): Promise<void> {
    const table = this.tables.get(tableName);
    if (!table) return;

    const existing = table.get(id);
    if (existing) {
      table.set(id, { ...existing, ...updates });
    }
  }

  async delete(tableName: string, id: string): Promise<boolean> {
    const table = this.tables.get(tableName);
    if (!table) return false;
    return table.delete(id);
  }

  async count(tableName: string, criteria?: Record<string, any>): Promise<number> {
    const rows = await this.getAll(tableName, criteria);
    return rows.length;
  }
}
