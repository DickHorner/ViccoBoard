import {
  SQLiteStorage,
  InitialSchemaMigration,
  GradingSchemaMigration,
  SportabzeichenSchemaMigration
} from '@viccoboard/storage/node';
import { SportabzeichenStandardRepository } from '../src/repositories/sportabzeichen-standard.repository';

describe('SportabzeichenStandardRepository', () => {
  let storage: SQLiteStorage;
  let repository: SportabzeichenStandardRepository;

  beforeEach(async () => {
    storage = new SQLiteStorage({
      databasePath: ':memory:',
      memory: true
    });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    storage.registerMigration(new GradingSchemaMigration(storage));
    storage.registerMigration(new SportabzeichenSchemaMigration(storage));
    await storage.migrate();

    repository = new SportabzeichenStandardRepository(storage.getAdapter());
  });

  afterEach(async () => {
    await storage.close();
  });

  test('creates and reads a standard', async () => {
    const created = await repository.create({
      disciplineId: 'run',
      gender: 'any',
      ageMin: 12,
      ageMax: 13,
      level: 'bronze',
      comparison: 'max',
      threshold: 2000,
      unit: 'm'
    });

    const found = await repository.findById(created.id);
    expect(found).not.toBeNull();
    expect(found?.disciplineId).toBe('run');
  });

  test('filters by discipline', async () => {
    await repository.create({
      disciplineId: 'run',
      gender: 'any',
      ageMin: 12,
      ageMax: 13,
      level: 'bronze',
      comparison: 'max',
      threshold: 2000,
      unit: 'm'
    });

    await repository.create({
      disciplineId: 'swim',
      gender: 'any',
      ageMin: 12,
      ageMax: 13,
      level: 'bronze',
      comparison: 'min',
      threshold: 90,
      unit: 's'
    });

    const runStandards = await repository.findByDiscipline('run');
    expect(runStandards).toHaveLength(1);
    expect(runStandards[0].disciplineId).toBe('run');
  });
});
