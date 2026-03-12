/**
 * IndexedDB Tactics Snapshots Schema Migration
 * Creates dedicated object store for tactics board snapshots.
 */

import { IndexedDBMigration } from './indexeddb-migration.js';

export class IndexedDBTacticsSnapshotsSchemaMigration implements IndexedDBMigration {
  storage: 'indexeddb' = 'indexeddb';
  version = 15;
  name = 'tactics_snapshots_schema';

  up(db: IDBDatabase, _tx: IDBTransaction): void {
    if (!db.objectStoreNames.contains('tactics_snapshots')) {
      const store = db.createObjectStore('tactics_snapshots', { keyPath: 'id' });
      store.createIndex('lesson_id', 'lesson_id', { unique: false });
      store.createIndex('created_at', 'created_at', { unique: false });
    }
  }

  down(): void {
    throw new Error('Reverting tactics_snapshots migration not supported in IndexedDB');
  }
}
