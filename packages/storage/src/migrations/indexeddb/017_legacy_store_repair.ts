/**
 * IndexedDB Legacy Store Repair Migration
 * Repairs object stores that may be missing in older live databases that
 * already reached a high DB version before specific sport migrations existed.
 */

import { IndexedDBMigration } from './indexeddb-migration.js';

export class IndexedDBLegacyStoreRepairMigration implements IndexedDBMigration {
  storage: 'indexeddb' = 'indexeddb';
  version = 17;
  name = 'legacy_store_repair';

  up(db: IDBDatabase, _tx: IDBTransaction): void {
    if (!db.objectStoreNames.contains('Sportabzeichen_standards')) {
      const standards = db.createObjectStore('Sportabzeichen_standards', { keyPath: 'id' });
      standards.createIndex('discipline_id', 'discipline_id', { unique: false });
      standards.createIndex('gender', 'gender', { unique: false });
      standards.createIndex('age_min', 'age_min', { unique: false });
      standards.createIndex('age_max', 'age_max', { unique: false });
    }

    if (!db.objectStoreNames.contains('Sportabzeichen_results')) {
      const results = db.createObjectStore('Sportabzeichen_results', { keyPath: 'id' });
      results.createIndex('student_id', 'student_id', { unique: false });
      results.createIndex('test_date', 'test_date', { unique: false });
    }
  }

  down(): void {
    throw new Error('Reverting legacy_store_repair migration not supported in IndexedDB');
  }
}
