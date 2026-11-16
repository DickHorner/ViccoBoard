import type { IndexedDBMigration } from './indexeddb-migration.js';

export class IndexedDBSchoolYearStateMigration implements IndexedDBMigration {
  storage: 'indexeddb' = 'indexeddb';
  version = 29;
  name = 'indexeddb_school_year_state';

  up(db: IDBDatabase): void {
    if (!db.objectStoreNames.contains('school_year_state')) {
      db.createObjectStore('school_year_state', { keyPath: 'id' });
    }
  }
}
