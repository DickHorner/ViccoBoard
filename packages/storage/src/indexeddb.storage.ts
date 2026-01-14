import { Storage, Migration } from '@viccoboard/core';
import { IndexedDBAdapter } from './adapters/indexeddb.adapter';
import { StorageAdapter } from './adapters/storage-adapter.interface';

export interface IndexedDBStorageConfig {
  databaseName: string;
  version?: number;
}

export class IndexedDBStorage implements Storage {
  private db: IDBDatabase | null = null;
  private adapter: IndexedDBAdapter | null = null;
  private migrations: Migration[] = [];
  private initialized = false;
  private config: IndexedDBStorageConfig;

  constructor(config: IndexedDBStorageConfig) {
    this.config = { version: 1, ...config };
  }

  async initialize(_password: string): Promise<void> {
    if (this.initialized) return;

    // Open or create DB using IndexedDB API
    const req = indexedDB.open(this.config.databaseName, this.config.version);

    this.db = await new Promise<IDBDatabase>((resolve, reject) => {
      req.onupgradeneeded = (ev) => {
        // Upgrades will be orchestrated by migrations
        // But ensure objectStores created by migrations are created when migrate() runs
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

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

  registerMigration(migration: Migration): void {
    this.migrations.push(migration);
    this.migrations.sort((a, b) => a.version - b.version);
  }

  async migrate(): Promise<void> {
    if (!this.db) throw new Error('Storage not initialized');

    // Run migrations sequentially
    for (const m of this.migrations) {
      // Migrations are expected to make their own IndexedDB calls
      await m.up();
    }
  }

  async transaction<T>(callback: () => T): Promise<T> {
    // IndexedDB transactions are event based; for now we simply run the callback and
    // return the result. Implementing true rollback semantics will be a follow-up.
    return Promise.resolve(callback());
  }
}
