import { ShuttleRunConfigRepository } from '../src/repositories/shuttle-run-config.repository';
import { SQLiteStorage, InitialSchemaMigration, GradingSchemaMigration, ShuttleRunSchemaMigration } from '@viccoboard/storage';
describe('ShuttleRunConfigRepository', () => {
    let storage;
    let repository;
    beforeEach(async () => {
        storage = new SQLiteStorage({
            databasePath: ':memory:',
            memory: true
        });
        await storage.initialize('test-password');
        storage.registerMigration(new InitialSchemaMigration(storage));
        storage.registerMigration(new GradingSchemaMigration(storage));
        storage.registerMigration(new ShuttleRunSchemaMigration(storage));
        await storage.migrate();
        repository = new ShuttleRunConfigRepository(storage.getAdapter());
    });
    afterEach(async () => {
        await storage.close();
    });
    test('creates and reads a shuttle run config', async () => {
        const created = await repository.create({
            name: 'Standard',
            levels: [
                { level: 1, lane: 1, speed: 8, duration: 9 }
            ],
            audioSignalsEnabled: true,
            source: 'default'
        });
        const found = await repository.findById(created.id);
        expect(found).not.toBeNull();
        expect(found?.name).toBe('Standard');
        expect(found?.levels).toHaveLength(1);
    });
    test('filters by source', async () => {
        await repository.create({
            name: 'Default',
            levels: [],
            audioSignalsEnabled: true,
            source: 'default'
        });
        await repository.create({
            name: 'Imported',
            levels: [],
            audioSignalsEnabled: false,
            source: 'imported'
        });
        const imported = await repository.findBySource('imported');
        expect(imported).toHaveLength(1);
        expect(imported[0].name).toBe('Imported');
    });
});
