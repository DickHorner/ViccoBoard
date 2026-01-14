"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("fake-indexeddb/auto");
const indexeddb_storage_1 = require("../src/indexeddb.storage");
describe('IndexedDBStorage (basic)', () => {
    it('initializes and runs simple migration', async () => {
        const storage = new indexeddb_storage_1.IndexedDBStorage({ databaseName: 'viccoboard-test' });
        let migrated = false;
        storage.registerMigration({
            version: 1,
            name: 'create_test_store',
            up: async () => {
                // create an object store
                const req = indexedDB.open('viccoboard-test');
                await new Promise((resolve, reject) => {
                    req.onupgradeneeded = () => {
                        req.result.createObjectStore('tests', { keyPath: 'id' });
                    };
                    req.onsuccess = () => resolve();
                    req.onerror = () => reject(req.error);
                });
                migrated = true;
            },
            down: async () => { },
        });
        await storage.initialize('pass');
        await storage.migrate();
        expect(storage.isInitialized()).toBe(true);
        expect(migrated).toBe(true);
        await storage.close();
    });
});
