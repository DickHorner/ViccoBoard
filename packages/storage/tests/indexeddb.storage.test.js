import 'fake-indexeddb/auto';
import { IndexedDBStorage } from '../src/indexeddb.storage';
describe('IndexedDBStorage (basic)', () => {
    it('initializes and runs simple migration', async () => {
        const storage = new IndexedDBStorage({ databaseName: 'viccoboard-test' });
        let migrated = false;
        const migration = {
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
});
