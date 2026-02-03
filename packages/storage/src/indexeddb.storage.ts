import { Storage, Migration } from '@viccoboard/core';
import { IndexedDBAdapter } from './adapters/indexeddb.adapter';
import { StorageAdapter } from './adapters/storage-adapter.interface';
import type { IndexedDBMigration } from './migrations/indexeddb/indexeddb-migration';

export interface IndexedDBStorageConfig {
  databaseName: string;
  version?: number;
}

type AnyMigration = Migration | IndexedDBMigration;

export class IndexedDBStorage implements Storage {
  private db: IDBDatabase | null = null;
  private adapter: IndexedDBAdapter | null = null;
  private migrations: IndexedDBMigration[] = [];
  private initialized = false;
  private config: IndexedDBStorageConfig;

  constructor(config: IndexedDBStorageConfig) {
    this.config = { version: 1, ...config };
  }

  async initialize(_password: string): Promise<void> {
    if (this.initialized) return;

    const targetVersion = this.getTargetVersion();
    this.db = await this.openDatabase(targetVersion);

    // Initialize adapter
    this.adapter = new IndexedDBAdapter(this.db);
    this.initialized = true;
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

  getDatabase(): IDBDatabase {
    if (!this.db) {
      throw new Error('Storage not initialized');
    }
    return this.db;
  }

  getAdapter(): StorageAdapter {
    if (!this.adapter) {
      throw new Error('Storage not initialized');
    }
    return this.adapter;
  }

  registerMigration(migration: AnyMigration): void {
    if (!this.isIndexedDBMigration(migration)) {
      throw new Error(
        `Migration "${migration.name}" does not support IndexedDB. ` +
        'Register an IndexedDBMigration instead.'
      );
    }

    this.migrations.push(migration);
    this.migrations.sort((a, b) => a.version - b.version);
  }

  async migrate(): Promise<void> {
    if (!this.db) throw new Error('Storage not initialized');

    const targetVersion = this.getTargetVersion();
    if (this.db.version >= targetVersion) {
      return;
    }

    this.db.close();
    this.db = await this.openDatabase(targetVersion);
    this.adapter = new IndexedDBAdapter(this.db);
  }

  async transaction<T>(callback: () => T | Promise<T>): Promise<T> {
    if (!this.adapter) {
      throw new Error('Storage not initialized');
    }
    return this.adapter.transaction(callback);
  }

  private getTargetVersion(): number {
    const migrationMax = this.migrations.length > 0
      ? Math.max(...this.migrations.map(m => m.version))
      : 1;
    return Math.max(this.config.version ?? 1, migrationMax);
  }

  private async openDatabase(targetVersion: number): Promise<IDBDatabase> {
    const req = indexedDB.open(this.config.databaseName, targetVersion);

    req.onupgradeneeded = (event) => {
      const db = req.result;
      const tx = req.transaction as IDBTransaction;
      const oldVersion = event.oldVersion;
      const newVersion = event.newVersion ?? targetVersion;

      const pending = this.migrations
        .filter(m => m.version > oldVersion && m.version <= newVersion)
        .sort((a, b) => a.version - b.version);

      for (const migration of pending) {
        migration.up(db, tx);
      }
    };

    return new Promise<IDBDatabase>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('IndexedDB open blocked by another connection'));
    });
  }

  private isIndexedDBMigration(migration: AnyMigration): migration is IndexedDBMigration {
    return (migration as IndexedDBMigration).storage === 'indexeddb';
  }
}
