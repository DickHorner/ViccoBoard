import { IndexedDBMigration } from './indexeddb-migration.js';

export class IndexedDBSportSchemaMigration implements IndexedDBMigration {
  storage: 'indexeddb' = 'indexeddb';
  version = 13;
  name = 'indexeddb_sport_schema';

  up(db: IDBDatabase, _tx: IDBTransaction): void {
    const createStore = (
      storeName: string,
      keyPath: string,
      indexes: Array<{ name: string; keyPath: string | string[]; unique?: boolean }> = []
    ) => {
      if (db.objectStoreNames.contains(storeName)) {
        return;
      }
      const store = db.createObjectStore(storeName, { keyPath });
      for (const index of indexes) {
        store.createIndex(index.name, index.keyPath, { unique: !!index.unique });
      }
    };

    createStore('grades', 'id', [
      { name: 'class_id', keyPath: 'class_id' },
      { name: 'student_id', keyPath: 'student_id' },
      { name: 'category_id', keyPath: 'category_id' }
    ]);

    createStore('sport_tables', 'id', [
      { name: 'teacher_id', keyPath: 'teacher_id' }
    ]);

    createStore('grade_weightings', 'id');
    createStore('new_day_data', 'id', [
      { name: 'date', keyPath: 'date' }
    ]);

    createStore('user_data', 'id', [
      { name: 'email', keyPath: 'email' },
      { name: 'role', keyPath: 'role' }
    ]);
  }
}
