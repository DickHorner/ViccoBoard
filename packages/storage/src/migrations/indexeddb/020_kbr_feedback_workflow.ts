import type { IndexedDBMigration } from './indexeddb-migration.js';

export class IndexedDBKbrFeedbackWorkflowMigration implements IndexedDBMigration {
  storage: 'indexeddb' = 'indexeddb';
  version = 20;
  name = 'indexeddb_kbr_feedback_workflow';

  up(db: IDBDatabase): void {
    if (!db.objectStoreNames.contains('correction_entries')) {
      const correctionEntries = db.createObjectStore('correction_entries', { keyPath: 'id' });
      correctionEntries.createIndex('exam_id', 'exam_id', { unique: false });
      correctionEntries.createIndex('candidate_id', 'candidate_id', { unique: false });
      correctionEntries.createIndex('status', 'status', { unique: false });
    }
  }
}
