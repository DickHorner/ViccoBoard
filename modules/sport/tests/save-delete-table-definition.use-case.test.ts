/**
 * SaveTableDefinitionUseCase Tests
 */

import { SaveTableDefinitionUseCase } from '../src/use-cases/save-table-definition.use-case';
import { DeleteTableDefinitionUseCase } from '../src/use-cases/delete-table-definition.use-case';
import { TableDefinitionRepository } from '../src/repositories/table-definition.repository';
import { SQLiteStorage, InitialSchemaMigration, GradingSchemaMigration, CooperTestSchemaMigration } from '@viccoboard/storage/node';

describe('SaveTableDefinitionUseCase', () => {
  let storage: SQLiteStorage;
  let repository: TableDefinitionRepository;
  let saveUseCase: SaveTableDefinitionUseCase;
  let deleteUseCase: DeleteTableDefinitionUseCase;

  beforeEach(async () => {
    storage = new SQLiteStorage({ databasePath: ':memory:', memory: true });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    storage.registerMigration(new GradingSchemaMigration(storage));
    storage.registerMigration(new CooperTestSchemaMigration(storage));
    await storage.migrate();

    repository = new TableDefinitionRepository(storage.getAdapter());
    saveUseCase = new SaveTableDefinitionUseCase(repository);
    deleteUseCase = new DeleteTableDefinitionUseCase(repository);
  });

  afterEach(async () => {
    await storage.close();
  });

  test('creates a new simple table definition', async () => {
    const result = await saveUseCase.execute({
      name: 'Cooper Tabelle Klasse 9',
      type: 'simple',
      source: 'local',
      dimensions: [{ name: 'gender', values: ['m', 'w'] }],
      mappingRules: [],
      entries: [
        { key: { gender: 'm' }, value: 2400 },
        { key: { gender: 'w' }, value: 2000 }
      ]
    });

    expect(result.id).toBeTruthy();
    expect(result.name).toBe('Cooper Tabelle Klasse 9');
    expect(result.type).toBe('simple');
    expect(result.entries).toHaveLength(2);
  });

  test('updates an existing table definition', async () => {
    const created = await saveUseCase.execute({
      name: 'Original Name',
      type: 'simple',
      source: 'local',
      dimensions: [],
      mappingRules: [],
      entries: []
    });

    const updated = await saveUseCase.execute({
      id: created.id,
      name: 'Aktualisierter Name',
      type: 'complex',
      source: 'local',
      dimensions: [],
      mappingRules: [],
      entries: []
    });

    expect(updated.name).toBe('Aktualisierter Name');
    expect(updated.type).toBe('complex');
  });

  test('rejects empty name', async () => {
    await expect(saveUseCase.execute({
      name: '',
      type: 'simple',
      source: 'local',
      dimensions: [],
      mappingRules: [],
      entries: []
    })).rejects.toThrow('Table name is required');
  });

  test('rejects missing type', async () => {
    await expect(saveUseCase.execute({
      name: 'Test',
      type: '' as any,
      source: 'local',
      dimensions: [],
      mappingRules: [],
      entries: []
    })).rejects.toThrow('Table type is required');
  });
});

describe('DeleteTableDefinitionUseCase', () => {
  let storage: SQLiteStorage;
  let repository: TableDefinitionRepository;
  let saveUseCase: SaveTableDefinitionUseCase;
  let deleteUseCase: DeleteTableDefinitionUseCase;

  beforeEach(async () => {
    storage = new SQLiteStorage({ databasePath: ':memory:', memory: true });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    storage.registerMigration(new GradingSchemaMigration(storage));
    storage.registerMigration(new CooperTestSchemaMigration(storage));
    await storage.migrate();

    repository = new TableDefinitionRepository(storage.getAdapter());
    saveUseCase = new SaveTableDefinitionUseCase(repository);
    deleteUseCase = new DeleteTableDefinitionUseCase(repository);
  });

  afterEach(async () => {
    await storage.close();
  });

  test('deletes an existing table definition', async () => {
    const created = await saveUseCase.execute({
      name: 'Zu löschen',
      type: 'simple',
      source: 'imported',
      dimensions: [],
      mappingRules: [],
      entries: []
    });

    await deleteUseCase.execute(created.id);

    const found = await repository.findById(created.id);
    expect(found).toBeNull();
  });

  test('rejects empty id', async () => {
    await expect(deleteUseCase.execute('')).rejects.toThrow('Table Definition ID is required');
  });
});
