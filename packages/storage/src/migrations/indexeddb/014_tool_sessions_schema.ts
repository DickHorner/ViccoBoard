/**
 * IndexedDB Tool Sessions Schema Migration
 * Creates dedicated object store for tool usage logs
 */

import { IndexedDBMigration } from './indexeddb-migration.js';

export class IndexedDBToolSessionsSchemaMigration implements IndexedDBMigration {
  storage: 'indexeddb' = 'indexeddb';
  version = 14;
  name = 'tool_sessions_schema';

  up(db: IDBDatabase, _tx: IDBTransaction): void {
    if (!db.objectStoreNames.contains('tool_sessions')) {
      const store = db.createObjectStore('tool_sessions', { keyPath: 'id' });
      store.createIndex('tool_type', 'tool_type', { unique: false });
      store.createIndex('class_group_id', 'class_group_id', { unique: false });
      store.createIndex('started_at', 'started_at', { unique: false });
    }
  }

  down() {
    // IndexedDB doesn't support synchronous deletions during upgrade
    throw new Error('Reverting tool_sessions migration not supported in IndexedDB');
  }
}
