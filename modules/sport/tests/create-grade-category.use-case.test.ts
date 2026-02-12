/**
 * CreateGradeCategoryUseCase Tests
 */

import { CreateGradeCategoryUseCase } from '../src/use-cases/create-grade-category.use-case';
import { GradeCategoryRepository } from '../src/repositories/grade-category.repository';
import { ClassGroupRepository } from '../src/repositories/class-group.repository';
import { SQLiteStorage, InitialSchemaMigration, GradingSchemaMigration } from '@viccoboard/storage/node';
import { Sport } from '@viccoboard/core';

describe('CreateGradeCategoryUseCase', () => {
  let storage: SQLiteStorage;
  let repository: GradeCategoryRepository;
  let classGroupRepository: ClassGroupRepository;
  let useCase: CreateGradeCategoryUseCase;
  let classGroupId: string;

  beforeEach(async () => {
    // Use in-memory database for tests
    storage = new SQLiteStorage({
      databasePath: ':memory:',
      memory: true
    });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    storage.registerMigration(new GradingSchemaMigration(storage));
    await storage.migrate();

    repository = new GradeCategoryRepository(storage.getAdapter());
    classGroupRepository = new ClassGroupRepository(storage.getAdapter());
    useCase = new CreateGradeCategoryUseCase(repository);

    const classGroup = await classGroupRepository.create({
      name: 'Test Class',
      schoolYear: '2023/2024',
      gradingScheme: 'default'
    });
    classGroupId = classGroup.id;
  });

  afterEach(async () => {
    await storage.close();
  });

  test('creates a criteria-based grade category successfully', async () => {
    const input = {
      classGroupId,
      name: 'Technik',
      description: 'Technische Fähigkeiten',
      type: Sport.GradeCategoryType.Criteria,
      weight: 50,
      configuration: {
        type: 'criteria' as const,
        criteria: [],
        allowSelfAssessment: false,
        selfAssessmentViaWOW: false
      }
    };

    const result = await useCase.execute(input);

    expect(result.id).toBeDefined();
    expect(result.classGroupId).toBe(classGroupId);
    expect(result.name).toBe('Technik');
    expect(result.description).toBe('Technische Fähigkeiten');
    expect(result.type).toBe(Sport.GradeCategoryType.Criteria);
    expect(result.weight).toBe(50);
    expect(result.configuration).toEqual(input.configuration);
  });

  test('creates a time-based grade category successfully', async () => {
    const input = {
      classGroupId,
      name: 'Sprint 100m',
      type: Sport.GradeCategoryType.Time,
      weight: 30,
      configuration: {
        type: 'time' as const,
        bestGrade: 1,
        worstGrade: 6,
        linearMapping: true,
        adjustableAfterwards: true
      }
    };

    const result = await useCase.execute(input);

    expect(result.id).toBeDefined();
    expect(result.type).toBe(Sport.GradeCategoryType.Time);
    expect(result.configuration).toEqual(input.configuration);
  });

  test('throws error for missing class group ID', async () => {
    const input = {
      classGroupId: '',
      name: 'Test Category',
      type: Sport.GradeCategoryType.Criteria,
      weight: 50,
      configuration: {
        type: 'criteria' as const,
        criteria: [],
        allowSelfAssessment: false,
        selfAssessmentViaWOW: false
      }
    };

    await expect(useCase.execute(input)).rejects.toThrow('Class Group ID is required');
  });

  test('throws error for missing name', async () => {
    const input = {
      classGroupId,
      name: '',
      type: Sport.GradeCategoryType.Criteria,
      weight: 50,
      configuration: {
        type: 'criteria' as const,
        criteria: [],
        allowSelfAssessment: false,
        selfAssessmentViaWOW: false
      }
    };

    await expect(useCase.execute(input)).rejects.toThrow('Category name is required');
  });

  test('throws error for missing type', async () => {
    const input = {
      classGroupId,
      name: 'Test Category',
      type: '' as any,
      weight: 50,
      configuration: {
        type: 'criteria' as const,
        criteria: [],
        allowSelfAssessment: false,
        selfAssessmentViaWOW: false
      }
    };

    await expect(useCase.execute(input)).rejects.toThrow('Category type is required');
  });

  test('throws error for weight less than 0', async () => {
    const input = {
      classGroupId,
      name: 'Test Category',
      type: Sport.GradeCategoryType.Criteria,
      weight: -10,
      configuration: {
        type: 'criteria' as const,
        criteria: [],
        allowSelfAssessment: false,
        selfAssessmentViaWOW: false
      }
    };

    await expect(useCase.execute(input)).rejects.toThrow('Weight must be between 0 and 100');
  });

  test('throws error for weight greater than 100', async () => {
    const input = {
      classGroupId,
      name: 'Test Category',
      type: Sport.GradeCategoryType.Criteria,
      weight: 150,
      configuration: {
        type: 'criteria' as const,
        criteria: [],
        allowSelfAssessment: false,
        selfAssessmentViaWOW: false
      }
    };

    await expect(useCase.execute(input)).rejects.toThrow('Weight must be between 0 and 100');
  });

  test('throws error for missing configuration', async () => {
    const input = {
      classGroupId,
      name: 'Test Category',
      type: Sport.GradeCategoryType.Criteria,
      weight: 50,
      configuration: null as any
    };

    await expect(useCase.execute(input)).rejects.toThrow('Category configuration is required');
  });
});
