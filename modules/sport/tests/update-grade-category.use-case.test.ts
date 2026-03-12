/**
 * UpdateGradeCategoryUseCase Tests
 */

import { UpdateGradeCategoryUseCase } from '../src/use-cases/update-grade-category.use-case';
import { CreateGradeCategoryUseCase } from '../src/use-cases/create-grade-category.use-case';
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
  let classGroupId: string;

  beforeEach(async () => {
    storage = new SQLiteStorage({
      databasePath: ':memory:',
      memory: true,
    });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    storage.registerMigration(new GradingSchemaMigration(storage));
    await storage.migrate();

    repository = new GradeCategoryRepository(storage.getAdapter());
    classGroupRepository = new ClassGroupRepository(storage.getAdapter());
    createUseCase = new CreateGradeCategoryUseCase(repository);
    updateUseCase = new UpdateGradeCategoryUseCase(repository);

    const classGroup = await classGroupRepository.create({
      name: 'Test Class',
      schoolYear: '2023/2024',
      gradingScheme: 'default',
    });
    classGroupId = classGroup.id;
  });

  afterEach(async () => {
    await storage.close();
  });

  async function createTestCategory() {
    return createUseCase.execute({
      classGroupId,
      name: 'Original Name',
      description: 'Original description',
      type: Sport.GradeCategoryType.Criteria,
      weight: 30,
      configuration: {
        type: 'criteria',
        criteria: [],
        allowSelfAssessment: false,
        selfAssessmentViaWOW: false,
      },
    });
  }

  test('updates name and weight of a category', async () => {
    const category = await createTestCategory();

    const updated = await updateUseCase.execute({
      id: category.id,
      name: 'Updated Name',
      weight: 50,
    });

    expect(updated.id).toBe(category.id);
    expect(updated.name).toBe('Updated Name');
    expect(updated.weight).toBe(50);
    expect(updated.description).toBe('Original description');
    expect(updated.type).toBe(Sport.GradeCategoryType.Criteria);
  });

  test('updates description to empty string', async () => {
    const category = await createTestCategory();

    const updated = await updateUseCase.execute({
      id: category.id,
      description: '',
    });

    expect(updated.description).toBe('');
  });

  test('updates configuration', async () => {
    const category = await createTestCategory();

    const newConfig: Sport.CriteriaGradingConfig = {
      type: 'criteria',
      criteria: [{ id: 'c1', name: 'Technik', weight: 100, minValue: 0, maxValue: 10 }],
      allowSelfAssessment: true,
      selfAssessmentViaWOW: false,
    };

    const updated = await updateUseCase.execute({
      id: category.id,
      configuration: newConfig,
    });

    const config = updated.configuration as Sport.CriteriaGradingConfig;
    expect(config.criteria).toHaveLength(1);
    expect(config.criteria[0].name).toBe('Technik');
    expect(config.allowSelfAssessment).toBe(true);
  });

  test('trims whitespace from name', async () => {
    const category = await createTestCategory();

    const updated = await updateUseCase.execute({
      id: category.id,
      name: '  Trimmed Name  ',
    });

    expect(updated.name).toBe('Trimmed Name');
  });

  test('throws error when id is missing', async () => {
    await expect(
      updateUseCase.execute({ id: '' })
    ).rejects.toThrow('Category ID is required');
  });

  test('throws error when category is not found', async () => {
    await expect(
      updateUseCase.execute({ id: 'non-existent-id', name: 'New Name' })
    ).rejects.toThrow('not found');
  });

  test('throws error for empty name string', async () => {
    const category = await createTestCategory();

    await expect(
      updateUseCase.execute({ id: category.id, name: '   ' })
    ).rejects.toThrow('Category name cannot be empty');
  });

  test('throws error for weight less than 0', async () => {
    const category = await createTestCategory();

    await expect(
      updateUseCase.execute({ id: category.id, weight: -5 })
    ).rejects.toThrow('Weight must be between 0 and 100');
  });

  test('throws error for weight greater than 100', async () => {
    const category = await createTestCategory();

    await expect(
      updateUseCase.execute({ id: category.id, weight: 110 })
    ).rejects.toThrow('Weight must be between 0 and 100');
  });

  test('accepts weight of 0', async () => {
    const category = await createTestCategory();

    const updated = await updateUseCase.execute({ id: category.id, weight: 0 });
    expect(updated.weight).toBe(0);
  });

  test('accepts weight of 100', async () => {
    const category = await createTestCategory();

    const updated = await updateUseCase.execute({ id: category.id, weight: 100 });
    expect(updated.weight).toBe(100);
  });

  test('does not change type on update', async () => {
    const category = await createTestCategory();

    const updated = await updateUseCase.execute({
      id: category.id,
      name: 'New Name',
    });

    expect(updated.type).toBe(Sport.GradeCategoryType.Criteria);
  });

  test('updates lastModified timestamp', async () => {
    const category = await createTestCategory();
    const originalModified = category.lastModified;

    // Ensure some time passes
    await new Promise(resolve => setTimeout(resolve, 5));

    const updated = await updateUseCase.execute({
      id: category.id,
      name: 'Changed Name',
    });

    expect(updated.lastModified.getTime()).toBeGreaterThan(originalModified.getTime());
  });
});
