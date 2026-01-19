/**
 * RecordGradeUseCase Tests
 */

import { RecordGradeUseCase } from '../src/use-cases/record-grade.use-case';
import { PerformanceEntryRepository } from '../src/repositories/performance-entry.repository';
import { SQLiteStorage, InitialSchemaMigration } from '@viccoboard/storage';

describe('RecordGradeUseCase', () => {
  let storage: SQLiteStorage;
  let repository: PerformanceEntryRepository;
  let useCase: RecordGradeUseCase;

  beforeEach(async () => {
    // Use in-memory database for tests
    storage = new SQLiteStorage({
      databasePath: ':memory:',
      memory: true
    });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    await storage.migrate();

    repository = new PerformanceEntryRepository(storage.getAdapter());
    useCase = new RecordGradeUseCase(repository);
  });

  afterEach(async () => {
    await storage.close();
  });

  test('records a grade entry successfully', async () => {
    const input = {
      studentId: 'student-123',
      categoryId: 'category-456',
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
    expect(result.studentId).toBe('student-123');
    expect(result.categoryId).toBe('category-456');
    expect(result.measurements).toEqual(input.measurements);
    expect(result.calculatedGrade).toBe('2');
    expect(result.comment).toBe('Gute Leistung');
    expect(result.timestamp).toBeInstanceOf(Date);
  });

  test('records a time-based grade entry successfully', async () => {
    const input = {
      studentId: 'student-123',
      categoryId: 'category-456',
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
      categoryId: 'category-456',
      measurements: { value: 10 }
    };

    await expect(useCase.execute(input)).rejects.toThrow('Student ID is required');
  });

  test('throws error for missing category ID', async () => {
    const input = {
      studentId: 'student-123',
      categoryId: '',
      measurements: { value: 10 }
    };

    await expect(useCase.execute(input)).rejects.toThrow('Category ID is required');
  });

  test('throws error for missing measurements', async () => {
    const input = {
      studentId: 'student-123',
      categoryId: 'category-456',
      measurements: {} as any
    };

    await expect(useCase.execute(input)).rejects.toThrow('Measurements are required');
  });

  test('throws error for null measurements', async () => {
    const input = {
      studentId: 'student-123',
      categoryId: 'category-456',
      measurements: null as any
    };

    await expect(useCase.execute(input)).rejects.toThrow('Measurements are required');
  });

  test('accepts metadata', async () => {
    const input = {
      studentId: 'student-123',
      categoryId: 'category-456',
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
      studentId: 'student-123',
      categoryId: 'category-456',
      measurements: { value: 10 }
    };

    const result = await useCase.execute(input);

    expect(result.id).toBeDefined();
    expect(result.calculatedGrade).toBeUndefined();
  });

  test('works without comment', async () => {
    const input = {
      studentId: 'student-123',
      categoryId: 'category-456',
      measurements: { value: 10 }
    };

    const result = await useCase.execute(input);

    expect(result.id).toBeDefined();
    expect(result.comment).toBeUndefined();
  });
});
