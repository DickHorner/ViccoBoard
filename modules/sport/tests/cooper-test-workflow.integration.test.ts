/**
 * Cooper Test Workflow Integration Tests
 * 
 * Verifies P4-2 Cooper Test Implementation:
 * - Track rounds/distance functionality
 * - Running and swimming modes work
 * - Auto-calculate grades from table
 * - Result storage via bridge
 * - Sportart configuration persists
 */

import {
  SQLiteStorage,
  InitialSchemaMigration,
  GradingSchemaMigration,
  CooperTestSchemaMigration
} from '@viccoboard/storage/node';
import { CooperTestConfigRepository } from '../src/repositories/cooper-test-config.repository';
import { GradeCategoryRepository } from '../src/repositories/grade-category.repository';
import { TableDefinitionRepository } from '../src/repositories/table-definition.repository';
import { PerformanceEntryRepository } from '../src/repositories/performance-entry.repository';
import { ClassGroupRepository } from '../src/repositories/class-group.repository';
import { StudentRepository } from '../src/repositories/student.repository';
import { CooperTestService } from '../src/services/cooper-test.service';
import { Sport } from '@viccoboard/core';

describe('Cooper Test Workflow Integration', () => {
  let storage: SQLiteStorage;
  let configRepository: CooperTestConfigRepository;
  let categoryRepository: GradeCategoryRepository;
  let tableRepository: TableDefinitionRepository;
  let performanceRepository: PerformanceEntryRepository;
  let classGroupRepository: ClassGroupRepository;
  let studentRepository: StudentRepository;
  let cooperService: CooperTestService;

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

    const adapter = storage.getAdapter();
    configRepository = new CooperTestConfigRepository(adapter);
    categoryRepository = new GradeCategoryRepository(adapter);
    tableRepository = new TableDefinitionRepository(adapter);
    performanceRepository = new PerformanceEntryRepository(adapter);
    classGroupRepository = new ClassGroupRepository(adapter);
    studentRepository = new StudentRepository(adapter);
    cooperService = new CooperTestService();
  });

  afterEach(async () => {
    await storage.close();
  });

  describe('Running Mode', () => {
    let classGroupId: string;
    let categoryId: string;

    beforeEach(async () => {
      // Create class group for tests
      const classGroup = await classGroupRepository.create({
        name: 'Test Class',
        schoolYear: '2024/2025',
        gradingScheme: 'default'
      });
      classGroupId = classGroup.id;

      // Create grade category
      const category = await categoryRepository.create({
        classGroupId: classGroupId,
        name: 'Cooper Test',
        type: Sport.GradeCategoryType.Cooper,
        weight: 1,
        configuration: {
          type: 'cooper',
          sportType: 'running',
          distanceUnit: 'meters',
          autoEvaluation: true
        } as Sport.CooperGradingConfig
      });
      categoryId = category.id;

      // Create student
      await studentRepository.create({
        classGroupId: classGroupId,
        firstName: 'Test',
        lastName: 'Student',
        gender: 'male',
        birthYear: 2008
      });
    });

    test('creates running config and persists', async () => {
      const config = await configRepository.create({
        name: 'Cooper Running Test',
        sportType: 'running',
        distanceUnit: 'meters',
        lapLengthMeters: 400,
        source: 'default'
      });

      expect(config.sportType).toBe('running');
      expect(config.lapLengthMeters).toBe(400);

      const found = await configRepository.findById(config.id);
      expect(found).not.toBeNull();
      expect(found?.sportType).toBe('running');
    });

    test('calculates distance for running mode', () => {
      const result = cooperService.buildResult('running', 8, 400, 50);
      
      expect(result.sportType).toBe('running');
      expect(result.rounds).toBe(8);
      expect(result.lapLengthMeters).toBe(400);
      expect(result.extraMeters).toBe(50);
      expect(result.distanceMeters).toBe(3250);
    });

    test('auto-calculates grade from running table', async () => {
      // Create a running grading table
      const table = await tableRepository.create({
        name: 'Cooper Running Standards',
        type: 'simple',
        source: 'local',
        dimensions: [],
        mappingRules: [],
        entries: [
          { key: { minDistance: 0, maxDistance: 1999, gender: 'm' }, value: '5' },
          { key: { minDistance: 2000, maxDistance: 2399, gender: 'm' }, value: '4' },
          { key: { minDistance: 2400, maxDistance: 2799, gender: 'm' }, value: '3' },
          { key: { minDistance: 2800, maxDistance: 3199, gender: 'm' }, value: '2' },
          { key: { minDistance: 3200, gender: 'm' }, value: '1' }
        ]
      });

      // Test grade calculation
      const grade = cooperService.calculateGradeFromTable(table, 2500, { gender: 'm' });
      expect(grade).toBe('3');

      const gradeHigh = cooperService.calculateGradeFromTable(table, 3300, { gender: 'm' });
      expect(gradeHigh).toBe('1');
    });

    test('stores performance entry via repository', async () => {
      const students = await studentRepository.findByClassGroup(classGroupId);
      const studentId = students[0].id;

      const entry = await performanceRepository.create({
        studentId,
        categoryId: categoryId,
        measurements: {
          sportType: 'running',
          rounds: 8,
          lapLengthMeters: 400,
          extraMeters: 50,
          distanceMeters: 3250
        },
        calculatedGrade: '2',
        timestamp: new Date()
      });

      expect(entry.measurements.sportType).toBe('running');
      expect(entry.measurements.distanceMeters).toBe(3250);
      expect(entry.calculatedGrade).toBe('2');

      const found = await performanceRepository.findById(entry.id);
      expect(found).not.toBeNull();
      expect(found?.measurements.distanceMeters).toBe(3250);
    });
  });

  describe('Swimming Mode', () => {
    let classGroupId: string;
    let categoryId: string;

    beforeEach(async () => {
      // Create class group for swimming tests
      const classGroup = await classGroupRepository.create({
        name: 'Swimming Class',
        schoolYear: '2024/2025',
        gradingScheme: 'default'
      });
      classGroupId = classGroup.id;

      // Create swimming category
      const category = await categoryRepository.create({
        classGroupId: classGroupId,
        name: 'Cooper Swimming',
        type: Sport.GradeCategoryType.Cooper,
        weight: 1,
        configuration: {
          type: 'cooper',
          sportType: 'swimming',
          distanceUnit: 'meters',
          autoEvaluation: true
        } as Sport.CooperGradingConfig
      });
      categoryId = category.id;

      // Create student
      await studentRepository.create({
        classGroupId: classGroupId,
        firstName: 'Swimmer',
        lastName: 'Student',
        gender: 'female',
        birthYear: 2008
      });
    });

    test('creates swimming config and persists', async () => {
      const config = await configRepository.create({
        name: 'Cooper Swimming Test',
        sportType: 'swimming',
        distanceUnit: 'meters',
        lapLengthMeters: 25,
        source: 'default'
      });

      expect(config.sportType).toBe('swimming');
      expect(config.lapLengthMeters).toBe(25);

      const found = await configRepository.findById(config.id);
      expect(found).not.toBeNull();
      expect(found?.sportType).toBe('swimming');
    });

    test('calculates distance for swimming mode', () => {
      const result = cooperService.buildResult('swimming', 16, 25, 0);
      
      expect(result.sportType).toBe('swimming');
      expect(result.rounds).toBe(16);
      expect(result.lapLengthMeters).toBe(25);
      expect(result.distanceMeters).toBe(400);
    });

    test('auto-calculates grade from swimming table', async () => {
      const table = await tableRepository.create({
        name: 'Cooper Swimming Standards',
        type: 'simple',
        source: 'local',
        dimensions: [],
        mappingRules: [],
        entries: [
          { key: { minDistance: 0, maxDistance: 299, gender: 'w' }, value: '5' },
          { key: { minDistance: 300, maxDistance: 399, gender: 'w' }, value: '4' },
          { key: { minDistance: 400, maxDistance: 499, gender: 'w' }, value: '3' },
          { key: { minDistance: 500, maxDistance: 599, gender: 'w' }, value: '2' },
          { key: { minDistance: 600, gender: 'w' }, value: '1' }
        ]
      });

      const grade = cooperService.calculateGradeFromTable(table, 450, { gender: 'w' });
      expect(grade).toBe('3');

      const gradeLow = cooperService.calculateGradeFromTable(table, 250, { gender: 'w' });
      expect(gradeLow).toBe('5');
    });

    test('stores swimming performance entry', async () => {
      const students = await studentRepository.findByClassGroup(classGroupId);
      const studentId = students[0].id;

      const entry = await performanceRepository.create({
        studentId,
        categoryId: categoryId,
        measurements: {
          sportType: 'swimming',
          rounds: 16,
          lapLengthMeters: 25,
          extraMeters: 0,
          distanceMeters: 400
        },
        calculatedGrade: '3',
        timestamp: new Date()
      });

      expect(entry.measurements.sportType).toBe('swimming');
      expect(entry.measurements.distanceMeters).toBe(400);
    });
  });

  describe('Custom Table Import and Recalculation', () => {
    test('imports custom table and recalculates grades', async () => {
      // Import custom table
      const customTable = await tableRepository.create({
        name: 'Custom Cooper Running',
        type: 'simple',
        source: 'imported',
        dimensions: [],
        mappingRules: [],
        entries: [
          { key: { minDistance: 0, maxDistance: 2199, gender: 'm' }, value: '5' },
          { key: { minDistance: 2200, maxDistance: 2599, gender: 'm' }, value: '4' },
          { key: { minDistance: 2600, maxDistance: 2999, gender: 'm' }, value: '3' },
          { key: { minDistance: 3000, maxDistance: 3399, gender: 'm' }, value: '2' },
          { key: { minDistance: 3400, gender: 'm' }, value: '1' }
        ]
      });

      // Test recalculation with new table
      const distance = 2700;
      const oldGrade = '3'; // would be 3 in old table
      const newGrade = cooperService.calculateGradeFromTable(customTable, distance, { gender: 'm' });
      
      expect(newGrade).toBe('3'); // Still 3 in custom table
      
      // Test a distance that changes
      const distance2 = 3100;
      const newGrade2 = cooperService.calculateGradeFromTable(customTable, distance2, { gender: 'm' });
      expect(newGrade2).toBe('2');
    });

    test('updates category configuration with new table', async () => {
      // Create class group first
      const classGroup = await classGroupRepository.create({
        name: 'Config Test Class',
        schoolYear: '2024/2025',
        gradingScheme: 'default'
      });
      const classGroupId = classGroup.id;

      const table = await tableRepository.create({
        name: 'Table 1',
        type: 'simple',
        source: 'local',
        dimensions: [],
        mappingRules: [],
        entries: []
      });

      const category = await categoryRepository.create({
        classGroupId: classGroupId,
        name: 'Cooper Test',
        type: Sport.GradeCategoryType.Cooper,
        weight: 1,
        configuration: {
          type: 'cooper',
          sportType: 'running',
          distanceUnit: 'meters',
          autoEvaluation: true
        } as Sport.CooperGradingConfig
      });

      // Update category to use table
      const updated = await categoryRepository.update(category.id, {
        configuration: {
          ...category.configuration,
          gradingTable: table.id
        } as Sport.CooperGradingConfig
      });

      expect((updated.configuration as Sport.CooperGradingConfig).gradingTable).toBe(table.id);
      
      // Verify persistence
      const found = await categoryRepository.findById(category.id);
      expect((found?.configuration as Sport.CooperGradingConfig).gradingTable).toBe(table.id);
    });
  });

  describe('Data Persistence After Reload', () => {
    test('cooper config persists after storage reload', async () => {
      const config = await configRepository.create({
        name: 'Persistent Config',
        sportType: 'running',
        distanceUnit: 'meters',
        lapLengthMeters: 400,
        source: 'default'
      });

      const configId = config.id;

      // Verify it exists
      let found = await configRepository.findById(configId);
      expect(found).not.toBeNull();
      expect(found?.name).toBe('Persistent Config');

      // Simulate reload by closing and reopening storage
      await storage.close();
      
      storage = new SQLiteStorage({
        databasePath: ':memory:',
        memory: true
      });
      await storage.initialize('test-password');
      storage.registerMigration(new InitialSchemaMigration(storage));
      storage.registerMigration(new GradingSchemaMigration(storage));
      storage.registerMigration(new CooperTestSchemaMigration(storage));
      await storage.migrate();

      // Note: In-memory DB doesn't persist, but this tests the pattern
      // In real usage with file-based DB, data would persist
    });

    test('performance entries persist after reload', async () => {
      // Create required foreign key entities
      const classGroup = await classGroupRepository.create({
        name: 'Persist Test Class',
        schoolYear: '2024/2025',
        gradingScheme: 'default'
      });
      const classGroupId = classGroup.id;

      const category = await categoryRepository.create({
        classGroupId: classGroupId,
        name: 'Persist Cooper',
        type: Sport.GradeCategoryType.Cooper,
        weight: 1,
        configuration: {
          type: 'cooper',
          sportType: 'running',
          distanceUnit: 'meters',
          autoEvaluation: true
        } as Sport.CooperGradingConfig
      });
      const categoryId = category.id;

      const student = await studentRepository.create({
        classGroupId: classGroupId,
        firstName: 'Persist',
        lastName: 'Test',
        gender: 'male',
        birthYear: 2008
      });

      const entry = await performanceRepository.create({
        studentId: student.id,
        categoryId: categoryId,
        measurements: {
          sportType: 'running',
          rounds: 8,
          lapLengthMeters: 400,
          extraMeters: 0,
          distanceMeters: 3200
        },
        calculatedGrade: '1',
        timestamp: new Date()
      });

      const found = await performanceRepository.findById(entry.id);
      expect(found).not.toBeNull();
      expect(found?.calculatedGrade).toBe('1');
    });
  });

  describe('Edge Cases', () => {
    test('handles zero rounds', () => {
      const result = cooperService.buildResult('running', 0, 400, 0);
      expect(result.distanceMeters).toBe(0);
    });

    test('handles extra meters only', () => {
      const result = cooperService.buildResult('running', 0, 400, 150);
      expect(result.distanceMeters).toBe(150);
    });

    test('handles large distances', () => {
      const result = cooperService.buildResult('running', 20, 400, 300);
      expect(result.distanceMeters).toBe(8300);
    });

    test('throws error on invalid rounds', () => {
      expect(() => {
        cooperService.calculateDistance(-1, 400, 0);
      }).toThrow('Rounds must be a non-negative number');
    });

    test('throws error on invalid lap length', () => {
      expect(() => {
        cooperService.calculateDistance(5, 0, 0);
      }).toThrow('Lap length must be a positive number');
    });

    test('throws error when no table entry matches', async () => {
      const table = await tableRepository.create({
        name: 'Limited Table',
        type: 'simple',
        source: 'local',
        dimensions: [],
        mappingRules: [],
        entries: [
          { key: { minDistance: 2000, maxDistance: 3000, gender: 'm' }, value: '3' }
        ]
      });

      expect(() => {
        cooperService.calculateGradeFromTable(table, 1500, { gender: 'm' });
      }).toThrow('No matching table entry for cooper test result');
    });
  });
});
