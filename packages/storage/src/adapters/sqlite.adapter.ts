/**
 * SQLite Storage Adapter
 * Wraps SQLite operations in the common StorageAdapter interface
 * Includes SQL injection protection via identifier validation and escaping
 */

import Database from 'better-sqlite3';
import { StorageAdapter, TableSchema } from './storage-adapter.interface';

export class SQLiteAdapter implements StorageAdapter {
  // Valid SQL identifier pattern: starts with letter or underscore, contains alphanumeric or underscores
  private static readonly IDENTIFIER_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

  constructor(private db: Database.Database) {}

  /**
   * Validate SQL identifier (table name, column name, index name)
   * Throws error if invalid to prevent SQL injection
   */
  private validateIdentifier(name: string, type: string = 'identifier'): void {
    if (!name || typeof name !== 'string') {
      throw new Error(`Invalid ${type}: must be a non-empty string`);
    }
    if (!SQLiteAdapter.IDENTIFIER_PATTERN.test(name)) {
      throw new Error(
        `Invalid ${type}: "${name}". ` +
        `Must start with letter or underscore, contain only alphanumeric characters and underscores.`
      );
    }
  }

  /**
   * Escape SQL identifier by validating and wrapping in double quotes
   */
  private escapeIdentifier(name: string, type: string = 'identifier'): string {
    this.validateIdentifier(name, type);
    return `"${name}"`;
  }

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
    this.validateIdentifier(tableName, 'table name');
    const result = await this.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?`,
      [tableName]
    );
    return result ? result.count > 0 : false;
  }

  async createTable(tableName: string, schema: TableSchema): Promise<void> {
    const escapedTable = this.escapeIdentifier(tableName, 'table name');
    
    const columns = schema.columns.map(col => {
      const escapedCol = this.escapeIdentifier(col.name, 'column name');
      let def = `${escapedCol} ${col.type}`;
      if (col.primaryKey) def += ' PRIMARY KEY';
      if (!col.nullable) def += ' NOT NULL';
      if (col.defaultValue !== undefined) def += ` DEFAULT ${col.defaultValue}`;
      return def;
    }).join(', ');

    await this.execute(`CREATE TABLE IF NOT EXISTS ${escapedTable} (${columns})`);

    if (schema.indexes) {
      for (const index of schema.indexes) {
        const unique = index.unique ? 'UNIQUE' : '';
        const escapedIndex = this.escapeIdentifier(index.name, 'index name');
        const escapedCols = index.columns.map(c => this.escapeIdentifier(c, 'column name')).join(', ');
        await this.execute(
          `CREATE ${unique} INDEX IF NOT EXISTS ${escapedIndex} ON ${escapedTable} (${escapedCols})`
        );
      }
    }
  }

  async getAll<T = any>(tableName: string, criteria?: Record<string, any>): Promise<T[]> {
    const escapedTable = this.escapeIdentifier(tableName, 'table name');
    
    if (!criteria || Object.keys(criteria).length === 0) {
      return this.query<T>(`SELECT * FROM ${escapedTable}`);
    }

    const keys = Object.keys(criteria);
    const whereClause = keys.map(key => `${this.escapeIdentifier(key, 'column name')} = ?`).join(' AND ');
    const values = keys.map(key => criteria[key]);

    return this.query<T>(`SELECT * FROM ${escapedTable} WHERE ${whereClause}`, values);
  }

  async getById<T = any>(tableName: string, id: string): Promise<T | null> {
    const escapedTable = this.escapeIdentifier(tableName, 'table name');
    return this.queryOne<T>(`SELECT * FROM ${escapedTable} WHERE "id" = ?`, [id]);
  }

  async insert(tableName: string, record: Record<string, any>): Promise<void> {
    const escapedTable = this.escapeIdentifier(tableName, 'table name');
    const keys = Object.keys(record);
    const escapedKeys = keys.map(k => this.escapeIdentifier(k, 'column name')).join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map(key => record[key]);

    await this.execute(
      `INSERT INTO ${escapedTable} (${escapedKeys}) VALUES (${placeholders})`,
      values
    );
  }

  async update(tableName: string, id: string, updates: Record<string, any>): Promise<void> {
    const escapedTable = this.escapeIdentifier(tableName, 'table name');
    const keys = Object.keys(updates);
    const setClause = keys.map(key => `${this.escapeIdentifier(key, 'column name')} = ?`).join(', ');
    const values = [...keys.map(key => updates[key]), id];

    await this.execute(`UPDATE ${escapedTable} SET ${setClause} WHERE "id" = ?`, values);
  }

  async delete(tableName: string, id: string): Promise<boolean> {
    const escapedTable = this.escapeIdentifier(tableName, 'table name');
    const result = await this.execute(`DELETE FROM ${escapedTable} WHERE "id" = ?`, [id]);
    return result.changes > 0;
  }

  async count(tableName: string, criteria?: Record<string, any>): Promise<number> {
    const escapedTable = this.escapeIdentifier(tableName, 'table name');
    
    if (!criteria || Object.keys(criteria).length === 0) {
      const result = await this.queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM ${escapedTable}`);
      return result?.count || 0;
    }

    const keys = Object.keys(criteria);
    const whereClause = keys.map(key => `${this.escapeIdentifier(key, 'column name')} = ?`).join(' AND ');
    const values = keys.map(key => criteria[key]);

    const result = await this.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${escapedTable} WHERE ${whereClause}`,
      values
    );
    return result?.count || 0;
  }
}
