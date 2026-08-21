import type { IndexedDBMigration } from './indexeddb-migration.js';

/** Creates the locally persisted support-tip library used by KBR correction. */
export class IndexedDBSupportTipsMigration implements IndexedDBMigration {
  storage: 'indexeddb' = 'indexeddb';
  version = 23;
  name = 'indexeddb_support_tips';

  up(db: IDBDatabase): void {
    if (db.objectStoreNames.contains('support_tips')) return;

    const tips = db.createObjectStore('support_tips', { keyPath: 'id' });
    tips.createIndex('category', 'category', { unique: false });
    tips.createIndex('usage_count', 'usage_count', { unique: false });
    tips.createIndex('last_modified', 'last_modified', { unique: false });
  }
}
