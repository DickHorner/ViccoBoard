import { IndexedDBMigration } from './indexeddb-migration.js';

export class IndexedDBExamSchemaMigration implements IndexedDBMigration {
  storage: 'indexeddb' = 'indexeddb';
  version = 6;
  name = 'indexeddb_exam_schema';

  up(db: IDBDatabase, _tx: IDBTransaction): void {
    if (!db.objectStoreNames.contains('exams')) {
      const exams = db.createObjectStore('exams', { keyPath: 'id' });
      exams.createIndex('class_group_id', 'class_group_id', { unique: false });
      exams.createIndex('status', 'status', { unique: false });
    }

    if (!db.objectStoreNames.contains('task_nodes')) {
      const tasks = db.createObjectStore('task_nodes', { keyPath: 'id' });
      tasks.createIndex('exam_id', 'exam_id', { unique: false });
      tasks.createIndex('parent_id', 'parent_id', { unique: false });
      tasks.createIndex('order_index', 'order_index', { unique: false });
    }

    if (!db.objectStoreNames.contains('criteria')) {
      const criteria = db.createObjectStore('criteria', { keyPath: 'id' });
      criteria.createIndex('exam_id', 'exam_id', { unique: false });
      criteria.createIndex('task_id', 'task_id', { unique: false });
    }
  }
}
