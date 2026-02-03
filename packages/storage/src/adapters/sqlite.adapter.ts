/**
 * SQLite Storage Adapter
 * Wraps SQLite operations in the common StorageAdapter interface
 */

import Database from 'better-sqlite3';
import { StorageAdapter, TableSchema } from './storage-adapter.interface';

export class SQLiteAdapter implements StorageAdapter {
  constructor(private db: Database.Database) {}

  async query<T = any>(query: string, params: any[] = []): Promise<T[]> {
    const stmt = this.db.prepare(query);
    return stmt.all(...params) as T[];
  }

  async queryOne<T = any>(query: string, params: any[] = []): Promise<T | null> {
    const stmt = this.db.prepare(query);
    const result = stmt.get(...params);
    return result ? (result as T) : null;
  }

  async execute(query: string, params: any[] = []): Promise<{ changes: number; lastId?: any }> {
    const stmt = this.db.prepare(query);
    const result = stmt.run(...params);
    return {
      changes: result.changes,
      lastId: result.lastInsertRowid
    };
  }

  async transaction<T>(callback: () => T | Promise<T>): Promise<T> {
    const transaction = this.db.transaction(() => {
      const result = callback();
      if (result && typeof (result as any).then === 'function') {
        throw new Error('SQLiteAdapter.transaction callback must be synchronous');
      }
      return result as T;
    });
    return transaction() as T;
  }

  async tableExists(tableName: string): Promise<boolean> {
    const result = await this.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?`,
      [tableName]
    );
    return result ? result.count > 0 : false;
  }

  async createTable(tableName: string, schema: TableSchema): Promise<void> {
    const columns = schema.columns.map(col => {
      let def = `${col.name} ${col.type}`;
      if (col.primaryKey) def += ' PRIMARY KEY';
      if (!col.nullable) def += ' NOT NULL';
      if (col.defaultValue !== undefined) def += ` DEFAULT ${col.defaultValue}`;
      return def;
    }).join(', ');

    await this.execute(`CREATE TABLE IF NOT EXISTS ${tableName} (${columns})`);

    if (schema.indexes) {
      for (const index of schema.indexes) {
        const unique = index.unique ? 'UNIQUE' : '';
        await this.execute(
          `CREATE ${unique} INDEX IF NOT EXISTS ${index.name} ON ${tableName} (${index.columns.join(', ')})`
        );
      }
    }
  }

  async getAll<T = any>(tableName: string, criteria?: Record<string, any>): Promise<T[]> {
    if (!criteria || Object.keys(criteria).length === 0) {
      return this.query<T>(`SELECT * FROM ${tableName}`);
    }

    const keys = Object.keys(criteria);
    const whereClause = keys.map(key => `${key} = ?`).join(' AND ');
    const values = keys.map(key => criteria[key]);

    return this.query<T>(`SELECT * FROM ${tableName} WHERE ${whereClause}`, values);
  }

  async getById<T = any>(tableName: string, id: string): Promise<T | null> {
    return this.queryOne<T>(`SELECT * FROM ${tableName} WHERE id = ?`, [id]);
  }

  async insert(tableName: string, record: Record<string, any>): Promise<void> {
    const keys = Object.keys(record);
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map(key => record[key]);

    await this.execute(
      `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`,
      values
    );
  }

  async update(tableName: string, id: string, updates: Record<string, any>): Promise<void> {
    const keys = Object.keys(updates);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = [...keys.map(key => updates[key]), id];

    await this.execute(`UPDATE ${tableName} SET ${setClause} WHERE id = ?`, values);
  }

  async delete(tableName: string, id: string): Promise<boolean> {
    const result = await this.execute(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
    return result.changes > 0;
  }

  async count(tableName: string, criteria?: Record<string, any>): Promise<number> {
    if (!criteria || Object.keys(criteria).length === 0) {
      const result = await this.queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM ${tableName}`);
      return result?.count || 0;
    }

    const keys = Object.keys(criteria);
    const whereClause = keys.map(key => `${key} = ?`).join(' AND ');
    const values = keys.map(key => criteria[key]);

    const result = await this.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${tableName} WHERE ${whereClause}`,
      values
    );
    return result?.count || 0;
  }
}
