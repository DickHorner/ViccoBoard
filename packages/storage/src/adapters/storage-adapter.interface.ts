/**
 * Storage Adapter Interface
 * Abstracts database operations for different backends (SQLite, IndexedDB)
 */

export interface QueryResult<T = any> {
  rows: T[];
  count: number;
}

export interface StorageAdapter {
  /**
   * Execute a query and return all matching rows
   */
  query<T = any>(query: string, params?: any[]): Promise<T[]>;

  /**
   * Execute a query and return a single row
   */
  queryOne<T = any>(query: string, params?: any[]): Promise<T | null>;

  /**
   * Execute an insert/update/delete operation
   */
  execute(query: string, params?: any[]): Promise<{ changes: number; lastId?: any }>;

  /**
   * Execute multiple operations in a transaction
   */
  transaction<T>(callback: () => T | Promise<T>): Promise<T>;

  /**
   * Check if a table exists
   */
  tableExists(tableName: string): Promise<boolean>;

  /**
   * Create a table (used by migrations)
   */
  createTable(tableName: string, schema: TableSchema): Promise<void>;

  /**
   * Get all records from a table with optional filtering
   */
  getAll<T = any>(tableName: string, criteria?: Record<string, any>): Promise<T[]>;

  /**
   * Get a single record by ID
   */
  getById<T = any>(tableName: string, id: string): Promise<T | null>;

  /**
   * Insert a record
   */
  insert(tableName: string, record: Record<string, any>): Promise<void>;

  /**
   * Update a record
   */
  update(tableName: string, id: string, updates: Record<string, any>): Promise<void>;

  /**
   * Delete a record
   */
  delete(tableName: string, id: string): Promise<boolean>;

  /**
   * Count records matching criteria
   */
  count(tableName: string, criteria?: Record<string, any>): Promise<number>;
}

export interface TableSchema {
  columns: ColumnDefinition[];
  indexes?: IndexDefinition[];
}

export interface ColumnDefinition {
  name: string;
  type: 'TEXT' | 'INTEGER' | 'REAL' | 'BLOB';
  primaryKey?: boolean;
  nullable?: boolean;
  defaultValue?: any;
}

export interface IndexDefinition {
  name: string;
  columns: string[];
  unique?: boolean;
}
