import type { IndexedDBMigration } from './indexeddb-migration';

export const correctionSchemaMigration: IndexedDBMigration = {
  storage: 'indexeddb',
  version: 7,
  name: 'correction_schema',
  up(db: IDBDatabase) {
    if (!db.objectStoreNames.contains('correctionEntries')) {
      const store = db.createObjectStore('correctionEntries', { keyPath: 'id' });
      store.createIndex('examId', 'examId');
      store.createIndex('candidateId', 'candidateId');
      store.createIndex('status', 'status');
    }
  }
};
