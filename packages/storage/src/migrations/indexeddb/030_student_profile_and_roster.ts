import type { IndexedDBMigration } from './indexeddb-migration.js';

export class IndexedDBStudentProfileAndRosterMigration implements IndexedDBMigration {
  storage: 'indexeddb' = 'indexeddb';
  version = 30;
  name = 'indexeddb_student_profile_and_roster';

  up(db: IDBDatabase): void {
    if (!db.objectStoreNames.contains('student_long_term_notes')) {
      const notes = db.createObjectStore('student_long_term_notes', { keyPath: 'id' });
      notes.createIndex('student_id', 'student_id', { unique: false });
      notes.createIndex('class_group_id', 'class_group_id', { unique: false });
      notes.createIndex('school_year', 'school_year', { unique: false });
    }
  }
}
