import { SQLiteStorage, InitialSchemaMigration, GradingSchemaMigration, CooperTestSchemaMigration } from '@viccoboard/storage/node';
import { TableDefinitionRepository } from '../src/repositories/table-definition.repository';
describe('TableDefinitionRepository', () => {
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
        storage.registerMigration(new CooperTestSchemaMigration(storage));
        await storage.migrate();
        repository = new TableDefinitionRepository(storage.getAdapter());
    });
    afterEach(async () => {
        await storage.close();
    });
    test('creates and reads a table definition', async () => {
        const created = await repository.create({
            name: 'Cooper Table',
            type: 'simple',
            description: 'Sample',
            source: 'local',
            dimensions: [],
            mappingRules: [],
            entries: []
        });
        const found = await repository.findById(created.id);
        expect(found).not.toBeNull();
        expect(found?.name).toBe('Cooper Table');
        expect(found?.description).toBe('Sample');
    });
    test('filters by source', async () => {
        await repository.create({
            name: 'Local Table',
            type: 'simple',
            source: 'local',
            dimensions: [],
            mappingRules: [],
            entries: []
        });
        await repository.create({
            name: 'Imported Table',
            type: 'complex',
            source: 'imported',
            dimensions: [],
            mappingRules: [],
            entries: []
        });
        const imported = await repository.findBySource('imported');
        expect(imported).toHaveLength(1);
        expect(imported[0].name).toBe('Imported Table');
    });
});
