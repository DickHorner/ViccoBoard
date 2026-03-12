import {
  SQLiteStorage,
  InitialSchemaMigration,
  GradingSchemaMigration,
  CooperTestSchemaMigration,
  TableActiveSchemaMigration
} from '@viccoboard/storage/node';
import { TableDefinitionRepository } from '../src/repositories/table-definition.repository';
import { ImportTableDefinitionUseCase } from '../src/use-cases/import-table-definition.use-case';

describe('ImportTableDefinitionUseCase', () => {
  let storage: SQLiteStorage;
  let repository: TableDefinitionRepository;
  let useCase: ImportTableDefinitionUseCase;

  beforeEach(async () => {
    storage = new SQLiteStorage({
      databasePath: ':memory:',
      memory: true
    });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    storage.registerMigration(new GradingSchemaMigration(storage));
    storage.registerMigration(new CooperTestSchemaMigration(storage));
    storage.registerMigration(new TableActiveSchemaMigration(storage));
    await storage.migrate();

    repository = new TableDefinitionRepository(storage.getAdapter());
    useCase = new ImportTableDefinitionUseCase(repository);
  });

  afterEach(async () => {
    await storage.close();
  });

  describe('execute – successful import', () => {
    test('imports a valid CSV and persists the definition', async () => {
      const csv = 'min_meters,max_meters,value\n3200,9999,1\n2800,3199,2\n';

      const result = await useCase.execute({
        name: 'Cooper Normen',
        csvContent: csv,
        description: 'Klassennormen Sek 1'
      });

      expect(result.success).toBe(true);
      expect(result.errors).toBeUndefined();
      expect(result.definition).toBeDefined();
      expect(result.definition!.name).toBe('Cooper Normen');
      expect(result.definition!.source).toBe('imported');
      expect(result.definition!.active).toBe(true);
      expect(result.definition!.entries).toHaveLength(2);
      expect(result.definition!.description).toBe('Klassennormen Sek 1');
    });

    test('persisted definition is retrievable from repository', async () => {
      const csv = 'meters,value\n1000,3\n';

      const result = await useCase.execute({ name: 'Run Table', csvContent: csv });

      expect(result.success).toBe(true);
      const found = await repository.findById(result.definition!.id);
      expect(found).not.toBeNull();
      expect(found!.name).toBe('Run Table');
      expect(found!.active).toBe(true);
    });

    test('successive imports create separate records', async () => {
      const csv = 'meters,value\n1000,3\n';

      await useCase.execute({ name: 'Table A', csvContent: csv });
      await useCase.execute({ name: 'Table B', csvContent: csv });

      const all = await repository.findAll();
      expect(all).toHaveLength(2);
    });
  });

  describe('execute – invalid input', () => {
    test('returns failure for empty name', async () => {
      const csv = 'meters,value\n1000,3\n';

      const result = await useCase.execute({ name: '', csvContent: csv });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    test('returns failure for missing value column', async () => {
      const csv = 'meters,grade\n1000,3\n';

      const result = await useCase.execute({ name: 'Bad Table', csvContent: csv });

      expect(result.success).toBe(false);
      expect(result.errors!.some((e) => e.includes('"value"'))).toBe(true);
    });

    test('returns failure for empty CSV', async () => {
      const result = await useCase.execute({ name: 'Empty', csvContent: '' });

      expect(result.success).toBe(false);
    });

    test('does not persist anything on failure', async () => {
      const csv = 'meters,grade\n1000,3\n';
      await useCase.execute({ name: 'Bad', csvContent: csv });

      const all = await repository.findAll();
      expect(all).toHaveLength(0);
    });
  });
});
