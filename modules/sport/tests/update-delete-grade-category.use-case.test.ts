/**
 * UpdateGradeCategoryUseCase Tests
 */

import { CreateGradeCategoryUseCase } from '../src/use-cases/create-grade-category.use-case';
import { UpdateGradeCategoryUseCase } from '../src/use-cases/update-grade-category.use-case';
import { DeleteGradeCategoryUseCase } from '../src/use-cases/delete-grade-category.use-case';
import { GradeCategoryRepository } from '../src/repositories/grade-category.repository';
import { ClassGroupRepository } from '../src/repositories/class-group.repository';
import { SQLiteStorage, InitialSchemaMigration, GradingSchemaMigration } from '@viccoboard/storage/node';
import { Sport } from '@viccoboard/core';

describe('UpdateGradeCategoryUseCase', () => {
  let storage: SQLiteStorage;
  let repository: GradeCategoryRepository;
  let classGroupRepository: ClassGroupRepository;
  let createUseCase: CreateGradeCategoryUseCase;
  let updateUseCase: UpdateGradeCategoryUseCase;
  let deleteUseCase: DeleteGradeCategoryUseCase;
  let classGroupId: string;

  beforeEach(async () => {
    storage = new SQLiteStorage({ databasePath: ':memory:', memory: true });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    storage.registerMigration(new GradingSchemaMigration(storage));
    await storage.migrate();

    repository = new GradeCategoryRepository(storage.getAdapter());
    classGroupRepository = new ClassGroupRepository(storage.getAdapter());
    createUseCase = new CreateGradeCategoryUseCase(repository);
    updateUseCase = new UpdateGradeCategoryUseCase(repository);
    deleteUseCase = new DeleteGradeCategoryUseCase(repository);

    const classGroup = await classGroupRepository.create({
      name: 'Test Class',
      schoolYear: '2024/2025',
      gradingScheme: 'default'
    });
    classGroupId = classGroup.id;
  });

  afterEach(async () => {
    await storage.close();
  });

  test('updates name and weight of an existing category', async () => {
    const created = await createUseCase.execute({
      classGroupId,
      name: 'Ausdauer',
      type: Sport.GradeCategoryType.Criteria,
      weight: 30,
      configuration: {
        type: 'criteria',
        criteria: [],
        allowSelfAssessment: false,
        selfAssessmentViaWOW: false
      }
    });

    const updated = await updateUseCase.execute({
      id: created.id,
      name: 'Ausdauer (aktualisiert)',
      weight: 40
    });

    expect(updated.name).toBe('Ausdauer (aktualisiert)');
    expect(updated.weight).toBe(40);
    expect(updated.type).toBe(Sport.GradeCategoryType.Criteria);
  });

  test('rejects empty name', async () => {
    const created = await createUseCase.execute({
      classGroupId,
      name: 'Technik',
      type: Sport.GradeCategoryType.Time,
      weight: 50,
      configuration: {
        type: 'time',
        bestGrade: 1,
        worstGrade: 6,
        linearMapping: true,
        adjustableAfterwards: true
      }
    });

    await expect(updateUseCase.execute({ id: created.id, name: '   ' }))
      .rejects.toThrow('Category name cannot be empty');
  });

  test('rejects weight out of range', async () => {
    const created = await createUseCase.execute({
      classGroupId,
      name: 'Technik',
      type: Sport.GradeCategoryType.Criteria,
      weight: 50,
      configuration: {
        type: 'criteria',
        criteria: [],
        allowSelfAssessment: false,
        selfAssessmentViaWOW: false
      }
    });

    await expect(updateUseCase.execute({ id: created.id, weight: 150 }))
      .rejects.toThrow('Weight must be between 0 and 100');
  });

  test('rejects missing id', async () => {
    await expect(updateUseCase.execute({ id: '' }))
      .rejects.toThrow('Category ID is required');
  });
});

describe('DeleteGradeCategoryUseCase', () => {
  let storage: SQLiteStorage;
  let repository: GradeCategoryRepository;
  let classGroupRepository: ClassGroupRepository;
  let createUseCase: CreateGradeCategoryUseCase;
  let deleteUseCase: DeleteGradeCategoryUseCase;
  let classGroupId: string;

  beforeEach(async () => {
    storage = new SQLiteStorage({ databasePath: ':memory:', memory: true });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    storage.registerMigration(new GradingSchemaMigration(storage));
    await storage.migrate();

    repository = new GradeCategoryRepository(storage.getAdapter());
    classGroupRepository = new ClassGroupRepository(storage.getAdapter());
    createUseCase = new CreateGradeCategoryUseCase(repository);
    deleteUseCase = new DeleteGradeCategoryUseCase(repository);

    const classGroup = await classGroupRepository.create({
      name: 'Test Class',
      schoolYear: '2024/2025',
      gradingScheme: 'default'
    });
    classGroupId = classGroup.id;
  });

  afterEach(async () => {
    await storage.close();
  });

  test('deletes an existing category', async () => {
    const created = await createUseCase.execute({
      classGroupId,
      name: 'Zu löschende Kategorie',
      type: Sport.GradeCategoryType.Verbal,
      weight: 20,
      configuration: {
        type: 'verbal',
        fields: [],
        scales: [],
        exportFormat: 'text'
      }
    });

    await deleteUseCase.execute(created.id);

    const found = await repository.findById(created.id);
    expect(found).toBeNull();
  });

  test('rejects empty id', async () => {
    await expect(deleteUseCase.execute('')).rejects.toThrow('Category ID is required');
  });
});
