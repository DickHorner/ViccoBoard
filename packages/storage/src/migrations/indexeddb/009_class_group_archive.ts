import { IndexedDBMigration } from './indexeddb-migration.js';

export class IndexedDBClassGroupArchiveMigration implements IndexedDBMigration {
  storage: 'indexeddb' = 'indexeddb';
  version = 9;
  name = 'indexeddb_class_group_archive';

  up(db: IDBDatabase, tx: IDBTransaction): void {
    if (!db.objectStoreNames.contains('class_groups')) {
      return;
    }

    const store = tx.objectStore('class_groups');
    if (!store.indexNames.contains('archived')) {
      store.createIndex('archived', 'archived');
    }
  }
}
