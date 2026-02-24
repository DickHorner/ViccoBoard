/**
 * RecordGradeUseCase Tests
 */

import { RecordGradeUseCase } from '../src/use-cases/record-grade.use-case';
import { PerformanceEntryRepository } from '../src/repositories/performance-entry.repository';
import { ClassGroupRepository } from '../src/repositories/class-group.repository';
import { StudentRepository } from '@viccoboard/students';
import { GradeCategoryRepository } from '../src/repositories/grade-category.repository';
import { SQLiteStorage, InitialSchemaMigration, GradingSchemaMigration } from '@viccoboard/storage/node';
import { Sport} from '@viccoboard/core';

describe('RecordGradeUseCase', () => {
  let storage: SQLiteStorage;
  let repository: PerformanceEntryRepository;
  let useCase: RecordGradeUseCase;
  let testStudentId: string;
  let testCategoryId: string;

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

    repository = new PerformanceEntryRepository(storage.getAdapter());
    useCase = new RecordGradeUseCase(repository);

    const classGroupRepository = new ClassGroupRepository(storage.getAdapter());
    const studentRepository = new StudentRepository(storage.getAdapter());
    const categoryRepository = new GradeCategoryRepository(storage.getAdapter());

    const classGroup = await classGroupRepository.create({
      name: 'Test Class',
      schoolYear: '2023/2024',
      gradingScheme: 'default'
    });

    const student = await studentRepository.create({
      firstName: 'Jane',
      lastName: 'Doe',
      classGroupId: classGroup.id
    });
    testStudentId = student.id;

    const category = await categoryRepository.create({
      classGroupId: classGroup.id,
      name: 'Test Category',
      type: Sport.GradeCategoryType.Criteria,
      weight: 30,
      configuration: {
        type: 'criteria',
        criteria: [
          { id: 'c1', name: 'Skill', weight: 50, minValue: 0, maxValue: 10 }
        ],
        allowSelfAssessment: false,
        selfAssessmentViaWOW: false
      }
    });
    testCategoryId = category.id;
  });

  afterEach(async () => {
    await storage.close();
  });

  test('records a grade entry successfully', async () => {
    const input = {
      studentId: testStudentId,
      categoryId: testCategoryId,
      measurements: {
        criterion1: 8,
        criterion2: 9,
        criterion3: 7
      },
      calculatedGrade: '2',
      comment: 'Gute Leistung'
    };

    const result = await useCase.execute(input);

    expect(result.id).toBeDefined();
    expect(result.studentId).toBe(testStudentId);
    expect(result.categoryId).toBe(testCategoryId);
    expect(result.measurements).toEqual(input.measurements);
    expect(result.calculatedGrade).toBe('2');
    expect(result.comment).toBe('Gute Leistung');
    expect(result.timestamp).toBeInstanceOf(Date);
  });

  test('records a time-based grade entry successfully', async () => {
    const input = {
      studentId: testStudentId,
      categoryId: testCategoryId,
      measurements: {
        time: 125.5
      },
      calculatedGrade: 3
    };

    const result = await useCase.execute(input);

    expect(result.id).toBeDefined();
    expect(result.measurements.time).toBe(125.5);
    expect(result.calculatedGrade).toBe(3);
  });

  test('throws error for missing student ID', async () => {
    const input = {
      studentId: '',
      categoryId: testCategoryId,
      measurements: { value: 10 }
    };

    await expect(useCase.execute(input)).rejects.toThrow('Student ID is required');
  });

  test('throws error for missing category ID', async () => {
    const input = {
      studentId: testStudentId,
      categoryId: '',
      measurements: { value: 10 }
    };

    await expect(useCase.execute(input)).rejects.toThrow('Category ID is required');
  });

  test('throws error for missing measurements', async () => {
    const input = {
      studentId: testStudentId,
      categoryId: testCategoryId,
      measurements: {} as any
    };

    await expect(useCase.execute(input)).rejects.toThrow('Measurements are required');
  });

  test('throws error for null measurements', async () => {
    const input = {
      studentId: testStudentId,
      categoryId: testCategoryId,
      measurements: null as any
    };

    await expect(useCase.execute(input)).rejects.toThrow('Measurements are required');
  });

  test('accepts metadata', async () => {
    const input = {
      studentId: testStudentId,
      categoryId: testCategoryId,
      measurements: { value: 10 },
      metadata: {
        deviceInfo: 'iPad',
        location: 'Sporthalle'
      }
    };

    const result = await useCase.execute(input);

    expect(result.metadata).toEqual(input.metadata);
  });

  test('works without calculated grade', async () => {
    const input = {
      studentId: testStudentId,
      categoryId: testCategoryId,
      measurements: { value: 10 }
    };

    const result = await useCase.execute(input);

    expect(result.id).toBeDefined();
    expect(result.calculatedGrade).toBeUndefined();
  });

  test('works without comment', async () => {
    const input = {
      studentId: testStudentId,
      categoryId: testCategoryId,
      measurements: { value: 10 }
    };

    const result = await useCase.execute(input);

    expect(result.id).toBeDefined();
    expect(result.comment).toBeUndefined();
  });
});
