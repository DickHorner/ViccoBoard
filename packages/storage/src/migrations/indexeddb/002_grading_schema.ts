import { IndexedDBMigration } from './indexeddb-migration';

export class IndexedDBGradingSchemaMigration implements IndexedDBMigration {
  storage: 'indexeddb' = 'indexeddb';
  version = 2;
  name = 'indexeddb_grading_schema';

  up(db: IDBDatabase, _tx: IDBTransaction): void {
    const createStore = (
      storeName: string,
      indexes: Array<{ name: string; keyPath: string | string[]; unique?: boolean }> = []
    ) => {
      if (db.objectStoreNames.contains(storeName)) {
        return;
      }
      const store = db.createObjectStore(storeName, { keyPath: 'id' });
      for (const index of indexes) {
        store.createIndex(index.name, index.keyPath, { unique: !!index.unique });
      }
    };

    createStore('grade_schemes', [
      { name: 'type', keyPath: 'type' }
    ]);

    createStore('grade_categories', [
      { name: 'class_group_id', keyPath: 'class_group_id' },
      { name: 'type', keyPath: 'type' }
    ]);

    createStore('performance_entries', [
      { name: 'student_id', keyPath: 'student_id' },
      { name: 'category_id', keyPath: 'category_id' },
      { name: 'timestamp', keyPath: 'timestamp' }
    ]);
  }
}
