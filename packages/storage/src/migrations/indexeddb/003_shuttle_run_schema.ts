import { IndexedDBMigration } from './indexeddb-migration.js';

export class IndexedDBShuttleRunSchemaMigration implements IndexedDBMigration {
  storage: 'indexeddb' = 'indexeddb';
  version = 3;
  name = 'indexeddb_shuttle_run_schema';

  up(db: IDBDatabase, _tx: IDBTransaction): void {
    if (db.objectStoreNames.contains('shuttle_run_configs')) {
      return;
    }

    const store = db.createObjectStore('shuttle_run_configs', { keyPath: 'id' });
    store.createIndex('source', 'source', { unique: false });
  }
}
