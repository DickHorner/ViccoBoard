import type { IndexedDBMigration } from './indexeddb-migration.js';

export class IndexedDBStudentImportBatchesMigration implements IndexedDBMigration {
  storage: 'indexeddb' = 'indexeddb';
  version = 21;
  name = 'indexeddb_student_import_batches';

  up(db: IDBDatabase): void {
    if (!db.objectStoreNames.contains('sport_student_profiles')) {
      const profiles = db.createObjectStore('sport_student_profiles', { keyPath: 'id' });
      profiles.createIndex('student_id', 'student_id', { unique: true });
    }

    if (!db.objectStoreNames.contains('import_batches')) {
      const batches = db.createObjectStore('import_batches', { keyPath: 'id' });
      batches.createIndex('source_type', 'source_type', { unique: false });
    }

    if (!db.objectStoreNames.contains('import_batch_items')) {
      const items = db.createObjectStore('import_batch_items', { keyPath: 'id' });
      items.createIndex('batch_id', 'batch_id', { unique: false });
      items.createIndex('entity', ['entity_type', 'entity_id'], { unique: false });
    }
  }
}
