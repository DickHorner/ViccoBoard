import {
  SQLiteStorage,
  InitialSchemaMigration,
  GradingSchemaMigration,
  CooperTestSchemaMigration
} from '@viccoboard/storage/node';
import { CooperTestConfigRepository } from '../src/repositories/cooper-test-config.repository';

describe('CooperTestConfigRepository', () => {
  let storage: SQLiteStorage;
  let repository: CooperTestConfigRepository;

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

    repository = new CooperTestConfigRepository(storage.getAdapter());
  });

  afterEach(async () => {
    await storage.close();
  });

  test('creates and reads a cooper test config', async () => {
    const created = await repository.create({
      name: 'Cooper Running',
      sportType: 'running',
      distanceUnit: 'meters',
      lapLengthMeters: 200,
      source: 'default'
    });

    const found = await repository.findById(created.id);
    expect(found).not.toBeNull();
    expect(found?.sportType).toBe('running');
    expect(found?.lapLengthMeters).toBe(200);
  });

  test('filters by sport type', async () => {
    await repository.create({
      name: 'Running',
      sportType: 'running',
      distanceUnit: 'meters',
      lapLengthMeters: 200,
      source: 'default'
    });

    await repository.create({
      name: 'Swimming',
      sportType: 'swimming',
      distanceUnit: 'meters',
      lapLengthMeters: 25,
      source: 'default'
    });

    const running = await repository.findBySportType('running');
    expect(running).toHaveLength(1);
    expect(running[0].name).toBe('Running');
  });
});
