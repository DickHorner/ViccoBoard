import type { IndexedDBMigration } from './indexeddb-migration.js';

/** Stores dated student absence and injury entries independently from lessons. */
export class IndexedDBStudentCalendarEntriesMigration implements IndexedDBMigration {
  storage: 'indexeddb' = 'indexeddb';
  version = 25;
  name = 'indexeddb_student_calendar_entries';

  up(db: IDBDatabase): void {
    if (db.objectStoreNames.contains('student_calendar_entries')) return;

    const entries = db.createObjectStore('student_calendar_entries', { keyPath: 'id' });
    entries.createIndex('student_id', 'student_id', { unique: false });
    entries.createIndex('start_date', 'start_date', { unique: false });
    entries.createIndex('end_date', 'end_date', { unique: false });
    entries.createIndex('source', 'source', { unique: false });
    entries.createIndex('source_key', 'source_key', { unique: false });
    entries.createIndex('last_modified', 'last_modified', { unique: false });
  }
}
