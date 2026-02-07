import { IndexedDBMigration } from './indexeddb-migration.js';

export class IndexedDBInitialSchemaMigration implements IndexedDBMigration {
  storage: 'indexeddb' = 'indexeddb';
  version = 1;
  name = 'indexeddb_initial_schema';

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

    createStore('teacher_accounts');

    createStore('class_groups', [
      { name: 'school_year', keyPath: 'school_year' },
      { name: 'state', keyPath: 'state' },
      { name: 'archived', keyPath: 'archived' }
    ]);

    createStore('students', [
      { name: 'class_group_id', keyPath: 'class_group_id' }
    ]);

    createStore('lessons', [
      { name: 'class_group_id', keyPath: 'class_group_id' },
      { name: 'date', keyPath: 'date' }
    ]);

    createStore('lesson_parts', [
      { name: 'lesson_id', keyPath: 'lesson_id' }
    ]);

    createStore('attendance_records', [
      { name: 'lesson_id', keyPath: 'lesson_id' },
      { name: 'student_id', keyPath: 'student_id' },
      { name: 'lesson_student', keyPath: ['lesson_id', 'student_id'], unique: true }
    ]);

    createStore('backups', [
      { name: 'created_at', keyPath: 'created_at' }
    ]);

    createStore('templates', [
      { name: 'type', keyPath: 'type' }
    ]);
  }
}
