import { IndexedDBMigration } from './indexeddb-migration.js';

export class IndexedDBClassGroupColorMigration implements IndexedDBMigration {
  storage: 'indexeddb' = 'indexeddb';
  version = 8;
  name = 'indexeddb_class_group_color';

  up(db: IDBDatabase, tx: IDBTransaction): void {
    if (!db.objectStoreNames.contains('class_groups')) {
      return;
    }

    const store = tx.objectStore('class_groups');
    if (!store.indexNames.contains('color')) {
      store.createIndex('color', 'color');
    }
  }
}
