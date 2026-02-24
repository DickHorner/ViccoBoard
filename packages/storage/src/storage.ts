/**
 * SQLite Storage Implementation with Encryption
 * Provides encrypted local database storage
 * 
 * ⚠️ NODE.JS ONLY: This module uses Node.js modules (fs, path, better-sqlite3)
 * BROWSER: Use IndexedDBStorage instead
 * 
 * @see IndexedDBStorage for browser/web environments
 */

import { Storage, Migration } from '@viccoboard/core';
import { StorageAdapter } from './adapters/storage-adapter.interface.js';
import { SQLiteAdapter } from './adapters/sqlite.adapter.js';

// ✅ Dynamic imports for Node.js modules
// These will be loaded dynamically when SQLiteStorage is constructed
let Database: any = null;
let path: any = null;
let fs: any = null;
let sqliteLoadError: Error | null = null;

export interface StorageConfig {
  databasePath: string;
  verbose?: boolean;
  memory?: boolean;
}

function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

export class SQLiteStorage implements Storage {
  private db: any = null;
  private adapter: SQLiteAdapter | null = null;
  private config: StorageConfig;
  private migrations: Migration[] = [];
  private initialized: boolean = false;
  private modulesLoaded: boolean = false;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  private async loadNodeModules(): Promise<void> {
    if (this.modulesLoaded) return;
    
    try {
      // Dynamically import Node.js modules using ESM dynamic import
      const betterSqlite3 = await import('better-sqlite3');
      const pathModule = await import('path');
      const fsModule = await import('fs');
      
      Database = betterSqlite3.default;
      path = pathModule;
      fs = fsModule;
      this.modulesLoaded = true;
    } catch (error) {
      sqliteLoadError = error as Error;
      throw new Error(
        'SQLiteStorage requires Node.js environment. ' +
        'For browser/web environments, use IndexedDBStorage instead. ' +
        'Error: ' + (error as Error).message
      );
    }
  }

  async initialize(password: string): Promise<void> {
    if (this.initialized) {
      throw new Error('Storage is already initialized');
    }

    // Load Node.js modules dynamically
    await this.loadNodeModules();

    if (!Database || !path || !fs) {
      throw new Error('SQLiteStorage requires Node.js and better-sqlite3');
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

    if (!password) {
      this.db.close();
      this.db = null;
      this.adapter = null;
      throw new Error('SQLiteStorage requires a non-empty encryption password');
    }

    // Enable encryption (using SQLCipher pragma)
    // Note: better-sqlite3 doesn't include SQLCipher by default
    // For production, use @journeyapps/sqlcipher or install SQLCipher separately
    // 
    // ⚠️ SECURITY: This implementation hard-fails if encryption is unavailable
    // to prevent accidental plaintext database storage
    try {
      const escapedPassword = escapeSqlString(password);
      this.db.pragma(`key = '${escapedPassword}'`);
      
      // Verify encryption is actually working by trying to access the database
      // If SQLCipher is not installed, this will fail
      this.db.pragma('cipher_version');
    } catch (error) {
      this.db.close();
      this.db = null;
      this.adapter = null;
      throw new Error(
        'SQLCipher encryption library not available. ' +
        'Cannot initialize encrypted storage. ' +
        'Install SQLCipher or use IndexedDBStorage for browser environments. ' +
        `Original error: ${error instanceof Error ? error.message : 'Unknown'}`
      );
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
      try {
        // Ensure all prepared statements are finalized
        this.db.close();
      } catch (error) {
        // Ignore errors during close - resource may already be released
        console.debug('Note during storage close:', error instanceof Error ? error.message : 'Unknown');
      }
      this.db = null;
      this.adapter = null;
      this.initialized = false;
      
      // Clear all module references to allow garbage collection
      Database = null;
      path = null;
      fs = null;
      this.modulesLoaded = false;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getDatabase() {
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

  async transaction<T>(callback: () => T | Promise<T>): Promise<T> {
    if (!this.db) {
      throw new Error('Storage not initialized');
    }

    const transaction = this.db.transaction(() => {
      const result = callback();
      if (result && typeof (result as any).then === 'function') {
        throw new Error('SQLiteStorage.transaction callback must be synchronous');
      }
      return result as T;
    });

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
  prepare(sql: string) {
    if (!this.db) {
      throw new Error('Storage not initialized');
    }
    return this.db.prepare(sql);
  }
}
