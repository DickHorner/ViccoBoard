/**
 * SQLite Storage Implementation with Encryption
 * Provides encrypted local database storage
 */

import Database from 'better-sqlite3';
import { Storage, Migration } from '@viccoboard/core';
import { StorageAdapter } from './adapters/storage-adapter.interface';
import { SQLiteAdapter } from './adapters/sqlite.adapter';
import * as path from 'path';
import * as fs from 'fs';

export interface StorageConfig {
  databasePath: string;
  verbose?: boolean;
  memory?: boolean;
}

export class SQLiteStorage implements Storage {
  private db: Database.Database | null = null;
  private adapter: SQLiteAdapter | null = null;
  private config: StorageConfig;
  private migrations: Migration[] = [];
  private initialized: boolean = false;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  async initialize(password: string): Promise<void> {
    if (this.initialized) {
      throw new Error('Storage is already initialized');
    }

    // Ensure directory exists
    if (!this.config.memory) {
      const dir = path.dirname(this.config.databasePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    // Open database
    this.db = new Database(
      this.config.memory ? ':memory:' : this.config.databasePath,
      { verbose: this.config.verbose ? console.log : undefined }
    );


    // Initialize adapter
    this.adapter = new SQLiteAdapter(this.db);
    // Enable encryption (using SQLCipher pragma if available)
    // Note: better-sqlite3 doesn't include SQLCipher by default
    // For production, use @journeyapps/sqlcipher or similar
    try {
      this.db.pragma(`key = '${password}'`);
    } catch (error) {
      // If SQLCipher is not available, continue without encryption
      // This is acceptable for development but NOT for production
      console.warn('SQLCipher not available, database will not be encrypted');
    }

    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');

    this.initialized = true;
  }


  getAdapter(): StorageAdapter {
    if (!this.adapter) {
      throw new Error('Storage not initialized');
    }
    return this.adapter;
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    this.adapter = null;
      this.initialized = false;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getDatabase(): Database.Database {
    if (!this.db) {
      throw new Error('Storage not initialized');
    }
    return this.db;
  }

  registerMigration(migration: Migration): void {
    this.migrations.push(migration);
    this.migrations.sort((a, b) => a.version - b.version);
  }

  async migrate(): Promise<void> {
    if (!this.db) {
      throw new Error('Storage not initialized');
    }

    // Create migrations table if it doesn't exist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get current version
    const result = this.db
      .prepare('SELECT MAX(version) as version FROM migrations')
      .get() as { version: number | null };
    
    const currentVersion = result.version || 0;

    // Apply pending migrations
    for (const migration of this.migrations) {
      if (migration.version > currentVersion) {
        console.log(`Applying migration ${migration.version}: ${migration.name}`);
        
        try {
          // Call up() method - should be synchronous
          await migration.up();
          
          // Record migration in migrations table
          this.db.prepare(
            'INSERT INTO migrations (version, name) VALUES (?, ?)'
          ).run(migration.version, migration.name);
          
          console.log(`✓ Migration ${migration.version} completed`);
        } catch (error) {
          console.error(`✗ Migration ${migration.version} failed:`, error);
          throw error;
        }
      }
    }
  }

  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    if (!this.db) {
      throw new Error('Storage not initialized');
    }

    const transaction = this.db.transaction(() => callback());
    return transaction() as T;
  }

  /**
   * Execute a SQL statement
   */
  exec(sql: string): void {
    if (!this.db) {
      throw new Error('Storage not initialized');
    }
    this.db.exec(sql);
  }

  /**
   * Prepare a SQL statement
   */
  prepare(sql: string): Database.Statement {
    if (!this.db) {
      throw new Error('Storage not initialized');
    }
    return this.db.prepare(sql);
  }
}
