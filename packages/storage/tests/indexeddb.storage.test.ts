import 'fake-indexeddb/auto';
import { IndexedDBStorage } from '../src/indexeddb.storage';
import type { IndexedDBMigration } from '../src/migrations/indexeddb/indexeddb-migration';
import { IndexedDBLegacyStoreRepairMigration } from '../src/migrations/indexeddb/017_legacy_store_repair';
import { IndexedDBCatalogAndTableStoreRepairMigration } from '../src/migrations/indexeddb/018_catalog_and_table_store_repair';

describe('IndexedDBStorage (basic)', () => {
  it('initializes and runs simple migration', async () => {
    const storage = new IndexedDBStorage({ databaseName: 'viccoboard-test' });

    let migrated = false;

    const migration: IndexedDBMigration = {
      storage: 'indexeddb',
      version: 1,
      name: 'create_test_store',
      up: (db) => {
        if (!db.objectStoreNames.contains('tests')) {
          db.createObjectStore('tests', { keyPath: 'id' });
        }
        migrated = true;
      }
    };

    storage.registerMigration(migration);

    await storage.initialize('pass');
    await storage.migrate();

    expect(storage.isInitialized()).toBe(true);
    expect(migrated).toBe(true);

    await storage.close();
  });

  it('repairs missing legacy sportabzeichen stores on version upgrade', async () => {
    const dbName = 'viccoboard-test-legacy-repair';

    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(dbName, 16);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('classes')) {
          db.createObjectStore('classes', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        request.result.close();
        resolve();
      };

      request.onerror = () => reject(request.error);
    });

    const storage = new IndexedDBStorage({ databaseName: dbName });
    storage.registerMigration(new IndexedDBLegacyStoreRepairMigration());

    await storage.initialize('pass');

    const db = storage.getDatabase();
    expect(db.version).toBe(17);
    expect(db.objectStoreNames.contains('Sportabzeichen_standards')).toBe(true);
    expect(db.objectStoreNames.contains('Sportabzeichen_results')).toBe(true);

    await storage.close();
  });

  it('repairs missing catalog and table stores on version upgrade', async () => {
    const dbName = 'viccoboard-test-catalog-and-table-repair';

    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(dbName, 17);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('classes')) {
          db.createObjectStore('classes', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        request.result.close();
        resolve();
      };

      request.onerror = () => reject(request.error);
    });

    const storage = new IndexedDBStorage({ databaseName: dbName });
    storage.registerMigration(new IndexedDBCatalogAndTableStoreRepairMigration());

    await storage.initialize('pass');

    const db = storage.getDatabase();
    expect(db.version).toBe(18);
    expect(db.objectStoreNames.contains('status_catalogs')).toBe(true);
    expect(db.objectStoreNames.contains('table_definitions')).toBe(true);
    expect(db.objectStoreNames.contains('cooper_test_configs')).toBe(true);

    await storage.close();
  });
});
