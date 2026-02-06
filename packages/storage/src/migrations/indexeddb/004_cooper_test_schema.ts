import { IndexedDBMigration } from './indexeddb-migration.js';

export class IndexedDBCooperTestSchemaMigration implements IndexedDBMigration {
  storage: 'indexeddb' = 'indexeddb';
  version = 4;
  name = 'indexeddb_cooper_test_schema';

  up(db: IDBDatabase, _tx: IDBTransaction): void {
    if (!db.objectStoreNames.contains('table_definitions')) {
      const tableStore = db.createObjectStore('table_definitions', { keyPath: 'id' });
      tableStore.createIndex('source', 'source', { unique: false });
      tableStore.createIndex('type', 'type', { unique: false });
    }

    if (!db.objectStoreNames.contains('cooper_test_configs')) {
      const configStore = db.createObjectStore('cooper_test_configs', { keyPath: 'id' });
      configStore.createIndex('sport_type', 'sport_type', { unique: false });
      configStore.createIndex('source', 'source', { unique: false });
    }
  }
}
