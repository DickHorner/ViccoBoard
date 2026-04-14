/**
 * DeleteGradeCategoryUseCase Tests
 */

import { DeleteGradeCategoryUseCase } from '../src/use-cases/delete-grade-category.use-case';
import { CreateGradeCategoryUseCase } from '../src/use-cases/create-grade-category.use-case';
import { RecordGradeUseCase } from '../src/use-cases/record-grade.use-case';
import { GradeCategoryRepository } from '../src/repositories/grade-category.repository';
import { PerformanceEntryRepository } from '../src/repositories/performance-entry.repository';
import { ClassGroupRepository } from '../src/repositories/class-group.repository';
import { StudentRepository } from '@viccoboard/students';
import { SQLiteStorage, InitialSchemaMigration, GradingSchemaMigration } from '@viccoboard/storage/node';
import { Sport } from '@viccoboard/core';

describe('DeleteGradeCategoryUseCase', () => {
  let storage: SQLiteStorage;
  let categoryRepository: GradeCategoryRepository;
  let performanceEntryRepository: PerformanceEntryRepository;
  let classGroupRepository: ClassGroupRepository;
  let studentRepository: StudentRepository;
  let createUseCase: CreateGradeCategoryUseCase;
  let recordGradeUseCase: RecordGradeUseCase;
  let deleteUseCase: DeleteGradeCategoryUseCase;
  let classGroupId: string;
  let studentId1: string;
  let studentId2: string;

  beforeEach(async () => {
    storage = new SQLiteStorage({
      databasePath: ':memory:',
      memory: true,
    });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    storage.registerMigration(new GradingSchemaMigration(storage));
    await storage.migrate();

    categoryRepository = new GradeCategoryRepository(storage.getAdapter());
    performanceEntryRepository = new PerformanceEntryRepository(storage.getAdapter());
    classGroupRepository = new ClassGroupRepository(storage.getAdapter());
    studentRepository = new StudentRepository(storage.getAdapter());
    createUseCase = new CreateGradeCategoryUseCase(categoryRepository);
    recordGradeUseCase = new RecordGradeUseCase(performanceEntryRepository);
    deleteUseCase = new DeleteGradeCategoryUseCase(categoryRepository, performanceEntryRepository);

    const classGroup = await classGroupRepository.create({
      name: 'Test Class',
      schoolYear: '2023/2024',
      gradingScheme: 'default',
    });
    classGroupId = classGroup.id;

    const s1 = await studentRepository.create({
      firstName: 'Anna',
      lastName: 'Müller',
      dateOfBirth: '2012-03-10',
      classGroupId
    });
    const s2 = await studentRepository.create({
      firstName: 'Ben',
      lastName: 'Schmidt',
      dateOfBirth: '2012-07-18',
      classGroupId
    });
    studentId1 = s1.id;
    studentId2 = s2.id;
  });

  afterEach(async () => {
    await storage.close();
  });

  async function createTestCategory(name = 'Test Category') {
    return createUseCase.execute({
      classGroupId,
      name,
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

  test('deletes a category with no performance entries', async () => {
    const category = await createTestCategory();

    const result = await deleteUseCase.execute({ id: category.id });

    expect(result.deleted).toBe(true);
    expect(result.orphanedEntryCount).toBe(0);

    const found = await categoryRepository.findById(category.id);
    expect(found).toBeNull();
  });

  test('deletes a category and reports orphaned entry count', async () => {
    const category = await createTestCategory();

    await recordGradeUseCase.execute({
      studentId: studentId1,
      categoryId: category.id,
      measurements: { score: 8 },
      calculatedGrade: 2,
    });
    await recordGradeUseCase.execute({
      studentId: studentId2,
      categoryId: category.id,
      measurements: { score: 6 },
      calculatedGrade: 3,
    });

    const result = await deleteUseCase.execute({ id: category.id });

    expect(result.deleted).toBe(true);
    expect(result.orphanedEntryCount).toBe(2);

    const found = await categoryRepository.findById(category.id);
    expect(found).toBeNull();
  });

  test('performance entries are removed with category due to cascade delete', async () => {
    const category = await createTestCategory();

    await recordGradeUseCase.execute({
      studentId: studentId1,
      categoryId: category.id,
      measurements: { score: 8 },
      calculatedGrade: 2,
    });

    const result = await deleteUseCase.execute({ id: category.id });

    // orphanedEntryCount is the count BEFORE deletion (for UI warning)
    expect(result.orphanedEntryCount).toBe(1);
    // Due to ON DELETE CASCADE in schema, entries are removed with the category
    const entries = await performanceEntryRepository.findByCategory(category.id);
    expect(entries).toHaveLength(0);
  });

  test('throws error when id is missing', async () => {
    await expect(
      deleteUseCase.execute({ id: '' })
    ).rejects.toThrow('Category ID is required');
  });

  test('throws error when category is not found', async () => {
    await expect(
      deleteUseCase.execute({ id: 'non-existent-id' })
    ).rejects.toThrow('not found');
  });

  test('does not affect other categories', async () => {
    const cat1 = await createTestCategory('Category 1');
    const cat2 = await createTestCategory('Category 2');

    await deleteUseCase.execute({ id: cat1.id });

    const remaining = await categoryRepository.findByClassGroup(classGroupId);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(cat2.id);
  });
});

