/**
 * GradeCategory Repository Tests
 */

import { GradeCategoryRepository } from '../src/repositories/grade-category.repository';
import { ClassGroupRepository } from '../src/repositories/class-group.repository';
import { SQLiteStorage, InitialSchemaMigration, GradingSchemaMigration } from '@viccoboard/storage/node';
import { Sport} from '@viccoboard/core';

describe('GradeCategoryRepository', () => {
  let storage: SQLiteStorage;
  let repository: GradeCategoryRepository;
  let classGroupRepository: ClassGroupRepository;
  let testClassGroupId: string;

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

    // Create a test class group
    const classGroup = await classGroupRepository.create({
      name: 'Test Class',
      schoolYear: '2023/2024',
      gradingScheme: 'default'
    });
    testClassGroupId = classGroup.id;
  });

  afterEach(async () => {
    await storage.close();
  });

  describe('create', () => {
    test('creates a criteria-based grade category', async () => {
      const category: Omit<Sport.GradeCategory, 'id' | 'createdAt' | 'lastModified'> = {
        classGroupId: testClassGroupId,
        name: 'Team Sports Skills',
        description: 'Assessment of team Sports abilities',
        type: Sport.GradeCategoryType.Criteria,
        weight: 30,
        configuration: {
          type: 'criteria',
          criteria: [
            { id: 'c1', name: 'Technique', weight: 40, minValue: 0, maxValue: 10 },
            { id: 'c2', name: 'Teamwork', weight: 30, minValue: 0, maxValue: 10 },
            { id: 'c3', name: 'Effort', weight: 30, minValue: 0, maxValue: 10 }
          ],
          allowSelfAssessment: true,
          selfAssessmentViaWOW: false
        }
      };

      const result = await repository.create(category);

      expect(result.id).toBeDefined();
      expect(result.name).toBe('Team Sports Skills');
      expect(result.type).toBe(Sport.GradeCategoryType.Criteria);
      expect(result.weight).toBe(30);
      expect(result.configuration.type).toBe('criteria');
      expect(result.classGroupId).toBe(testClassGroupId);
    });

    test('creates a time-based grade category', async () => {
      const category: Omit<Sport.GradeCategory, 'id' | 'createdAt' | 'lastModified'> = {
        classGroupId: testClassGroupId,
        name: '100m Sprint',
        type: Sport.GradeCategoryType.Time,
        weight: 20,
        configuration: {
          type: 'time',
          bestGrade: 1,
          worstGrade: 6,
          linearMapping: true,
          adjustableAfterwards: true
        }
      };

      const result = await repository.create(category);

      expect(result.id).toBeDefined();
      expect(result.name).toBe('100m Sprint');
      expect(result.type).toBe(Sport.GradeCategoryType.Time);
      expect(result.configuration.type).toBe('time');
    });

    test('creates a Cooper test category', async () => {
      const category: Omit<Sport.GradeCategory, 'id' | 'createdAt' | 'lastModified'> = {
        classGroupId: testClassGroupId,
        name: 'Cooper Running Test',
        type: Sport.GradeCategoryType.Cooper,
        weight: 25,
        configuration: {
          type: 'cooper',
          SportType: 'running',
          distanceUnit: 'meters',
          autoEvaluation: true
        }
      };

      const result = await repository.create(category);

      expect(result.id).toBeDefined();
      expect(result.type).toBe(Sport.GradeCategoryType.Cooper);
      const cooperConfig = result.configuration as Sport.CooperGradingConfig;
      expect(cooperConfig.SportType).toBe('running');
    });
  });

  describe('findByClassGroup', () => {
    test('finds all categories for a class group', async () => {
      await repository.create({
        classGroupId: testClassGroupId,
        name: 'Category 1',
        type: Sport.GradeCategoryType.Criteria,
        weight: 30,
        configuration: { type: 'criteria', criteria: [], allowSelfAssessment: false, selfAssessmentViaWOW: false }
      });

      await repository.create({
        classGroupId: testClassGroupId,
        name: 'Category 2',
        type: Sport.GradeCategoryType.Time,
        weight: 20,
        configuration: { type: 'time', bestGrade: 1, worstGrade: 6, linearMapping: true, adjustableAfterwards: true }
      });

      const categories = await repository.findByClassGroup(testClassGroupId);
      expect(categories).toHaveLength(2);
    });

    test('returns empty array when no categories exist', async () => {
      const categories = await repository.findByClassGroup('non-existent-id');
      expect(categories).toHaveLength(0);
    });
  });

  describe('findByType', () => {
    test('filters categories by type', async () => {
      await repository.create({
        classGroupId: testClassGroupId,
        name: 'Criteria Category',
        type: Sport.GradeCategoryType.Criteria,
        weight: 30,
        configuration: { type: 'criteria', criteria: [], allowSelfAssessment: false, selfAssessmentViaWOW: false }
      });

      await repository.create({
        classGroupId: testClassGroupId,
        name: 'Time Category',
        type: Sport.GradeCategoryType.Time,
        weight: 20,
        configuration: { type: 'time', bestGrade: 1, worstGrade: 6, linearMapping: true, adjustableAfterwards: true }
      });

      const criteriaCategories = await repository.findByType(Sport.GradeCategoryType.Criteria);
      expect(criteriaCategories).toHaveLength(1);
      expect(criteriaCategories[0].name).toBe('Criteria Category');

      const timeCategories = await repository.findByType(Sport.GradeCategoryType.Time);
      expect(timeCategories).toHaveLength(1);
      expect(timeCategories[0].name).toBe('Time Category');
    });
  });

  describe('findByClassGroupAndType', () => {
    test('filters by both class group and type', async () => {
      // Create another class group
      const classGroup2 = await classGroupRepository.create({
        name: 'Class 2',
        schoolYear: '2023/2024',
        gradingScheme: 'default'
      });

      await repository.create({
        classGroupId: testClassGroupId,
        name: 'Class 1 Criteria',
        type: Sport.GradeCategoryType.Criteria,
        weight: 30,
        configuration: { type: 'criteria', criteria: [], allowSelfAssessment: false, selfAssessmentViaWOW: false }
      });

      await repository.create({
        classGroupId: classGroup2.id,
        name: 'Class 2 Criteria',
        type: Sport.GradeCategoryType.Criteria,
        weight: 30,
        configuration: { type: 'criteria', criteria: [], allowSelfAssessment: false, selfAssessmentViaWOW: false }
      });

      await repository.create({
        classGroupId: testClassGroupId,
        name: 'Class 1 Time',
        type: Sport.GradeCategoryType.Time,
        weight: 20,
        configuration: { type: 'time', bestGrade: 1, worstGrade: 6, linearMapping: true, adjustableAfterwards: true }
      });

      const categories = await repository.findByClassGroupAndType(
        testClassGroupId,
        Sport.GradeCategoryType.Criteria
      );

      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('Class 1 Criteria');
    });
  });

  describe('getTotalWeight', () => {
    test('calculates total weight correctly', async () => {
      await repository.create({
        classGroupId: testClassGroupId,
        name: 'Category 1',
        type: Sport.GradeCategoryType.Criteria,
        weight: 30,
        configuration: { type: 'criteria', criteria: [], allowSelfAssessment: false, selfAssessmentViaWOW: false }
      });

      await repository.create({
        classGroupId: testClassGroupId,
        name: 'Category 2',
        type: Sport.GradeCategoryType.Time,
        weight: 25,
        configuration: { type: 'time', bestGrade: 1, worstGrade: 6, linearMapping: true, adjustableAfterwards: true }
      });

      await repository.create({
        classGroupId: testClassGroupId,
        name: 'Category 3',
        type: Sport.GradeCategoryType.Cooper,
        weight: 45,
        configuration: { type: 'cooper', SportType: 'running', distanceUnit: 'meters', autoEvaluation: true }
      });

      const totalWeight = await repository.getTotalWeight(testClassGroupId);
      expect(totalWeight).toBe(100);
    });

    test('returns 0 when no categories exist', async () => {
      const totalWeight = await repository.getTotalWeight('non-existent-id');
      expect(totalWeight).toBe(0);
    });
  });

  describe('update', () => {
    test('updates a grade category', async () => {
      const category = await repository.create({
        classGroupId: testClassGroupId,
        name: 'Original Name',
        type: Sport.GradeCategoryType.Criteria,
        weight: 30,
        configuration: { type: 'criteria', criteria: [], allowSelfAssessment: false, selfAssessmentViaWOW: false }
      });

      const updated = await repository.update(category.id, {
        name: 'Updated Name',
        weight: 40
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.weight).toBe(40);
      expect(updated.type).toBe(Sport.GradeCategoryType.Criteria);
    });
  });

  describe('delete', () => {
    test('deletes a grade category', async () => {
      const category = await repository.create({
        classGroupId: testClassGroupId,
        name: 'To Delete',
        type: Sport.GradeCategoryType.Criteria,
        weight: 30,
        configuration: { type: 'criteria', criteria: [], allowSelfAssessment: false, selfAssessmentViaWOW: false }
      });

      const deleted = await repository.delete(category.id);
      expect(deleted).toBe(true);

      const found = await repository.findById(category.id);
      expect(found).toBeNull();
    });
  });

  describe('count', () => {
    test('counts all categories', async () => {
      await repository.create({
        classGroupId: testClassGroupId,
        name: 'Category 1',
        type: Sport.GradeCategoryType.Criteria,
        weight: 30,
        configuration: { type: 'criteria', criteria: [], allowSelfAssessment: false, selfAssessmentViaWOW: false }
      });

      await repository.create({
        classGroupId: testClassGroupId,
        name: 'Category 2',
        type: Sport.GradeCategoryType.Time,
        weight: 20,
        configuration: { type: 'time', bestGrade: 1, worstGrade: 6, linearMapping: true, adjustableAfterwards: true }
      });

      const count = await repository.count();
      expect(count).toBe(2);
    });
  });
});
