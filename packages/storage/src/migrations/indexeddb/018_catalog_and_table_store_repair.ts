/**
 * IndexedDB Catalog and Table Store Repair Migration
 * Repairs stores that were either introduced after some legacy upgrades
 * or skipped entirely in older browser databases.
 */

import { IndexedDBMigration } from './indexeddb-migration.js';

export class IndexedDBCatalogAndTableStoreRepairMigration implements IndexedDBMigration {
  storage: 'indexeddb' = 'indexeddb';
  version = 18;
  name = 'catalog_and_table_store_repair';

  up(db: IDBDatabase, _tx: IDBTransaction): void {
    if (!db.objectStoreNames.contains('status_catalogs')) {
      const statusCatalogs = db.createObjectStore('status_catalogs', { keyPath: 'id' });
      statusCatalogs.createIndex('class_group_id', 'class_group_id', { unique: false });
      statusCatalogs.createIndex('context', 'context', { unique: false });
      statusCatalogs.createIndex('class_group_context', ['class_group_id', 'context'], { unique: false });
    }

    if (!db.objectStoreNames.contains('table_definitions')) {
      const tableDefinitions = db.createObjectStore('table_definitions', { keyPath: 'id' });
      tableDefinitions.createIndex('source', 'source', { unique: false });
      tableDefinitions.createIndex('type', 'type', { unique: false });
      tableDefinitions.createIndex('active', 'active', { unique: false });
    }

    if (!db.objectStoreNames.contains('cooper_test_configs')) {
      const cooperConfigs = db.createObjectStore('cooper_test_configs', { keyPath: 'id' });
      cooperConfigs.createIndex('sport_type', 'sport_type', { unique: false });
      cooperConfigs.createIndex('source', 'source', { unique: false });
    }
  }

  down(): void {
    throw new Error('Reverting catalog_and_table_store_repair migration not supported in IndexedDB');
  }
}
