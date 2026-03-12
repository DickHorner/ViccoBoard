/**
 * IndexedDB Tournament Schema Migration
 * Creates a dedicated object store for tournament structures.
 */

import { IndexedDBMigration } from './indexeddb-migration.js';

export class IndexedDBTournamentSchemaMigration implements IndexedDBMigration {
  storage: 'indexeddb' = 'indexeddb';
  version = 16;
  name = 'tournament_schema';

  up(db: IDBDatabase, _tx: IDBTransaction): void {
    if (!db.objectStoreNames.contains('tournaments')) {
      const store = db.createObjectStore('tournaments', { keyPath: 'id' });
      store.createIndex('class_group_id', 'class_group_id', { unique: false });
      store.createIndex('status', 'status', { unique: false });
    }
  }

  down(): void {
    throw new Error('Reverting tournament_schema migration not supported in IndexedDB');
  }
}
