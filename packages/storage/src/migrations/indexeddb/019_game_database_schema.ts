/**
 * IndexedDB Game Database Schema Migration
 * Creates an object store for the local sport game / exercise database.
 */

import { IndexedDBMigration } from './indexeddb-migration.js';

export class IndexedDBGameDatabaseSchemaMigration implements IndexedDBMigration {
  storage: 'indexeddb' = 'indexeddb';
  version = 19;
  name = 'game_database_schema';

  up(db: IDBDatabase, _tx: IDBTransaction): void {
    if (!db.objectStoreNames.contains('game_entries')) {
      const store = db.createObjectStore('game_entries', { keyPath: 'id' });
      store.createIndex('category', 'category', { unique: false });
      store.createIndex('phase', 'phase', { unique: false });
      store.createIndex('difficulty', 'difficulty', { unique: false });
      store.createIndex('is_custom', 'is_custom', { unique: false });
    }
  }

  down(): void {
    throw new Error('Reverting game_database_schema migration not supported in IndexedDB');
  }
}
