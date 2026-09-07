import type { IndexedDBMigration } from './indexeddb-migration.js';

/** Creates locally persisted planning blocks for the teacher planning view. */
export class IndexedDBPlanningBlocksMigration implements IndexedDBMigration {
  storage: 'indexeddb' = 'indexeddb';
  version = 24;
  name = 'indexeddb_planning_blocks';

  up(db: IDBDatabase): void {
    if (db.objectStoreNames.contains('planning_blocks')) return;

    const blocks = db.createObjectStore('planning_blocks', { keyPath: 'id' });
    blocks.createIndex('class_group_id', 'class_group_id', { unique: false });
    blocks.createIndex('start_date', 'start_date', { unique: false });
    blocks.createIndex('end_date', 'end_date', { unique: false });
    blocks.createIndex('last_modified', 'last_modified', { unique: false });
  }
}
