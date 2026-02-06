import { IndexedDBMigration } from './indexeddb-migration.js';

export class IndexedDBSportabzeichenSchemaMigration implements IndexedDBMigration {
  storage: 'indexeddb' = 'indexeddb';
  version = 5;
  name = 'indexeddb_sportabzeichen_schema';

  up(db: IDBDatabase, _tx: IDBTransaction): void {
    if (!db.objectStoreNames.contains('sportabzeichen_standards')) {
      const standards = db.createObjectStore('sportabzeichen_standards', { keyPath: 'id' });
      standards.createIndex('discipline_id', 'discipline_id', { unique: false });
      standards.createIndex('gender', 'gender', { unique: false });
      standards.createIndex('age_min', 'age_min', { unique: false });
      standards.createIndex('age_max', 'age_max', { unique: false });
    }

    if (!db.objectStoreNames.contains('sportabzeichen_results')) {
      const results = db.createObjectStore('sportabzeichen_results', { keyPath: 'id' });
      results.createIndex('student_id', 'student_id', { unique: false });
      results.createIndex('test_date', 'test_date', { unique: false });
    }
  }
}
