/**
 * PerformanceEntry Repository Tests
 */

import { PerformanceEntryRepository } from '../src/repositories/performance-entry.repository';
import { GradeCategoryRepository } from '../src/repositories/grade-category.repository';
import { StudentRepository } from '@viccoboard/students';
import { ClassGroupRepository } from '../src/repositories/class-group.repository';
import { SQLiteStorage, InitialSchemaMigration, GradingSchemaMigration } from '@viccoboard/storage/node';
import { Sport} from '@viccoboard/core';

describe('PerformanceEntryRepository', () => {
  let storage: SQLiteStorage;
  let repository: PerformanceEntryRepository;
  let categoryRepository: GradeCategoryRepository;
  let studentRepository: StudentRepository;
  let classGroupRepository: ClassGroupRepository;
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
    categoryRepository = new GradeCategoryRepository(storage.getAdapter());
    studentRepository = new StudentRepository(storage.getAdapter());
    classGroupRepository = new ClassGroupRepository(storage.getAdapter());

    // Create test data
    const classGroup = await classGroupRepository.create({
      name: 'Test Class',
      schoolYear: '2023/2024',
      gradingScheme: 'default'
    });

    const student = await studentRepository.create({
      firstName: 'John',
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
          { id: 'c1', name: 'Skill', weight: 50, minValue: 0, maxValue: 10 },
          { id: 'c2', name: 'Effort', weight: 50, minValue: 0, maxValue: 10 }
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

  describe('create', () => {
    test('creates a performance entry successfully', async () => {
      const entry: Omit<Sport.PerformanceEntry, 'id' | 'createdAt' | 'lastModified'> = {
        studentId: testStudentId,
        categoryId: testCategoryId,
        measurements: {
          c1: 8,
          c2: 9
        },
        calculatedGrade: '1',
        timestamp: new Date(),
        comment: 'Excellent performance'
      };

      const result = await repository.create(entry);

      expect(result.id).toBeDefined();
      expect(result.studentId).toBe(testStudentId);
      expect(result.categoryId).toBe(testCategoryId);
      expect(result.measurements.c1).toBe(8);
      expect(result.measurements.c2).toBe(9);
      expect(result.calculatedGrade).toBe('1');
      expect(result.comment).toBe('Excellent performance');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.lastModified).toBeInstanceOf(Date);
    });

    test('creates entry with metadata', async () => {
      const entry: Omit<Sport.PerformanceEntry, 'id' | 'createdAt' | 'lastModified'> = {
        studentId: testStudentId,
        categoryId: testCategoryId,
        measurements: { distance: 2800 },
        calculatedGrade: '2',
        timestamp: new Date(),
        deviceInfo: 'iPad Pro 12.9',
        metadata: {
          weather: 'sunny',
          temperature: 22,
          location: 'outdoor track'
        }
      };

      const result = await repository.create(entry);

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.weather).toBe('sunny');
      expect(result.metadata?.temperature).toBe(22);
      expect(result.deviceInfo).toBe('iPad Pro 12.9');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.lastModified).toBeInstanceOf(Date);
    });
  });

  describe('findByStudent', () => {
    test('finds all entries for a student', async () => {
      await repository.create({
        studentId: testStudentId,
        categoryId: testCategoryId,
        measurements: { score: 85 },
        timestamp: new Date('2024-01-01')
      });

      await repository.create({
        studentId: testStudentId,
        categoryId: testCategoryId,
        measurements: { score: 90 },
        timestamp: new Date('2024-01-15')
      });

      const entries = await repository.findByStudent(testStudentId);
      expect(entries).toHaveLength(2);
      // Should be sorted by timestamp descending
      expect(entries[0].measurements.score).toBe(90);
      expect(entries[1].measurements.score).toBe(85);
    });

    test('returns empty array when no entries exist', async () => {
      const entries = await repository.findByStudent('non-existent-id');
      expect(entries).toHaveLength(0);
    });
  });

  describe('findByCategory', () => {
    test('finds all entries for a category', async () => {
      // Create another student
      const student2 = await studentRepository.create({
        firstName: 'Jane',
        lastName: 'Smith',
        classGroupId: (await classGroupRepository.findAll())[0].id
      });

      await repository.create({
        studentId: testStudentId,
        categoryId: testCategoryId,
        measurements: { score: 85 },
        timestamp: new Date()
      });

      await repository.create({
        studentId: student2.id,
        categoryId: testCategoryId,
        measurements: { score: 92 },
        timestamp: new Date()
      });

      const entries = await repository.findByCategory(testCategoryId);
      expect(entries).toHaveLength(2);
    });
  });

  describe('findByStudentAndCategory', () => {
    test('finds entries for specific student and category', async () => {
      // Create another category
      const category2 = await categoryRepository.create({
        classGroupId: (await classGroupRepository.findAll())[0].id,
        name: 'Category 2',
        type: Sport.GradeCategoryType.Time,
        weight: 20,
        configuration: {
          type: 'time',
          bestGrade: 1,
          worstGrade: 6,
          linearMapping: true,
          adjustableAfterwards: true
        }
      });

      await repository.create({
        studentId: testStudentId,
        categoryId: testCategoryId,
        measurements: { score: 85 },
        timestamp: new Date('2024-01-01')
      });

      await repository.create({
        studentId: testStudentId,
        categoryId: category2.id,
        measurements: { time: 45.2 },
        timestamp: new Date('2024-01-02')
      });

      await repository.create({
        studentId: testStudentId,
        categoryId: testCategoryId,
        measurements: { score: 90 },
        timestamp: new Date('2024-01-15')
      });

      const entries = await repository.findByStudentAndCategory(testStudentId, testCategoryId);
      expect(entries).toHaveLength(2);
      expect(entries[0].measurements.score).toBe(90);
      expect(entries[1].measurements.score).toBe(85);
    });
  });

  describe('getLatestEntry', () => {
    test('returns the most recent entry', async () => {
      await repository.create({
        studentId: testStudentId,
        categoryId: testCategoryId,
        measurements: { score: 85 },
        timestamp: new Date('2024-01-01')
      });

      await repository.create({
        studentId: testStudentId,
        categoryId: testCategoryId,
        measurements: { score: 90 },
        timestamp: new Date('2024-01-15')
      });

      await repository.create({
        studentId: testStudentId,
        categoryId: testCategoryId,
        measurements: { score: 88 },
        timestamp: new Date('2024-01-10')
      });

      const latest = await repository.getLatestEntry(testStudentId, testCategoryId);
      expect(latest).not.toBeNull();
      expect(latest?.measurements.score).toBe(90);
    });

    test('returns null when no entries exist', async () => {
      const latest = await repository.getLatestEntry('non-existent-student', 'non-existent-category');
      expect(latest).toBeNull();
    });
  });

  describe('findByDateRange', () => {
    test('filters entries by date range', async () => {
      await repository.create({
        studentId: testStudentId,
        categoryId: testCategoryId,
        measurements: { score: 80 },
        timestamp: new Date('2024-01-01')
      });

      await repository.create({
        studentId: testStudentId,
        categoryId: testCategoryId,
        measurements: { score: 85 },
        timestamp: new Date('2024-01-15')
      });

      await repository.create({
        studentId: testStudentId,
        categoryId: testCategoryId,
        measurements: { score: 90 },
        timestamp: new Date('2024-02-01')
      });

      const entries = await repository.findByDateRange(
        new Date('2024-01-10'),
        new Date('2024-01-31')
      );

      expect(entries).toHaveLength(1);
      expect(entries[0].measurements.score).toBe(85);
    });
  });

  describe('countByStudentAndCategory', () => {
    test('counts entries correctly', async () => {
      await repository.create({
        studentId: testStudentId,
        categoryId: testCategoryId,
        measurements: { score: 85 },
        timestamp: new Date()
      });

      await repository.create({
        studentId: testStudentId,
        categoryId: testCategoryId,
        measurements: { score: 90 },
        timestamp: new Date()
      });

      const count = await repository.countByStudentAndCategory(testStudentId, testCategoryId);
      expect(count).toBe(2);
    });

    test('returns 0 when no entries exist', async () => {
      const count = await repository.countByStudentAndCategory('non-existent', 'non-existent');
      expect(count).toBe(0);
    });
  });

  describe('update', () => {
    test('updates a performance entry', async () => {
      const entry = await repository.create({
        studentId: testStudentId,
        categoryId: testCategoryId,
        measurements: { score: 85 },
        timestamp: new Date()
      });

      const updated = await repository.update(entry.id, {
        measurements: { score: 92 },
        calculatedGrade: '1',
        comment: 'Improved significantly'
      });

      expect(updated.measurements.score).toBe(92);
      expect(updated.calculatedGrade).toBe('1');
      expect(updated.comment).toBe('Improved significantly');
    });
  });

  describe('delete', () => {
    test('deletes a performance entry', async () => {
      const entry = await repository.create({
        studentId: testStudentId,
        categoryId: testCategoryId,
        measurements: { score: 85 },
        timestamp: new Date()
      });

      const deleted = await repository.delete(entry.id);
      expect(deleted).toBe(true);

      const found = await repository.findById(entry.id);
      expect(found).toBeNull();
    });
  });
});
