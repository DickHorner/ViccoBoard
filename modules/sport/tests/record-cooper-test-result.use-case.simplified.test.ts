/**
 * Record Cooper Test Result Use Case Tests (Simplified)
 * Uses mock repositories to avoid database foreign key constraints
 */

import { RecordCooperTestResultUseCase } from '../src/use-cases/record-cooper-test-result.use-case.js';
import { Sport } from '@viccoboard/core';

// Mock repositories
class MockPerformanceEntryRepository {
  private entries: Sport.PerformanceEntry[] = [];
  private nextId = 0;

  async create(entry: Partial<Sport.PerformanceEntry>): Promise<Sport.PerformanceEntry> {
    const now = new Date();
    const result: Sport.PerformanceEntry = {
      id: `perf-${++this.nextId}`,
      studentId: entry.studentId!,
      categoryId: entry.categoryId!,
      measurements: entry.measurements!,
      timestamp: entry.timestamp || now,
      calculatedGrade: entry.calculatedGrade,
      comment: entry.comment,
      metadata: entry.metadata,
      createdAt: entry.createdAt || now,
      lastModified: entry.lastModified || now
    };
    this.entries.push(result);
    return result;
  }

  async findByStudentAndCategory(studentId: string, categoryId: string): Promise<Sport.PerformanceEntry[]> {
    return this.entries
      .filter(e => e.studentId === studentId && e.categoryId === categoryId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

class MockCooperTestConfigRepository {
  private configs = new Map<string, Sport.CooperTestConfig>();
  private nextId = 0;

  async create(config: Partial<Sport.CooperTestConfig>): Promise<Sport.CooperTestConfig> {
    const now = new Date();
    const result: Sport.CooperTestConfig = {
      id: `config-${++this.nextId}`,
      name: config.name!,
      sportType: config.sportType || 'running',
      distanceUnit: config.distanceUnit || 'meters',
      lapLengthMeters: config.lapLengthMeters || 400,
      source: config.source || 'default',
      createdAt: now,
      lastModified: now
    };
    this.configs.set(result.id, result);
    return result;
  }

  async findById(id: string): Promise<Sport.CooperTestConfig | null> {
    return this.configs.get(id) || null;
  }
}

class MockTableDefinitionRepository {
  private tables = new Map<string, Sport.TableDefinition>();
  private nextId = 0;

  async create(table: Partial<Sport.TableDefinition>): Promise<Sport.TableDefinition> {
    const now = new Date();
    const result: Sport.TableDefinition = {
      id: `table-${++this.nextId}`,
      name: table.name!,
      type: table.type || 'complex',
      description: table.description,
      source: table.source || 'local',
      dimensions: table.dimensions || [],
      mappingRules: table.mappingRules || [],
      entries: table.entries || [],
      createdAt: now,
      lastModified: now
    };
    this.tables.set(result.id, result);
    return result;
  }

  async findById(id: string): Promise<Sport.TableDefinition | null> {
    return this.tables.get(id) || null;
  }
}

describe('RecordCooperTestResultUseCase', () => {
  let useCase: RecordCooperTestResultUseCase;
  let performanceEntryRepository: MockPerformanceEntryRepository;
  let cooperTestConfigRepository: MockCooperTestConfigRepository;
  let tableDefinitionRepository: MockTableDefinitionRepository;
  let testStudentId: string;
  let testCategoryId: string;
  let testConfigId: string;
  let testTableId: string;

  beforeEach(async () => {
    performanceEntryRepository = new MockPerformanceEntryRepository();
    cooperTestConfigRepository = new MockCooperTestConfigRepository();
    tableDefinitionRepository = new MockTableDefinitionRepository();

    useCase = new RecordCooperTestResultUseCase(
      performanceEntryRepository as any,
      cooperTestConfigRepository as any,
      tableDefinitionRepository as any
    );

    // Create test config
    const config = await cooperTestConfigRepository.create({
      name: 'Test Cooper Config',
      sportType: 'running',
      distanceUnit: 'meters',
      lapLengthMeters: 400,
      source: 'default'
    });
    testConfigId = config.id;

    // Create test table with ranges
    const table = await tableDefinitionRepository.create({
      name: 'Cooper Running Table',
      type: 'complex',
      description: 'Cooper test grading for running',
      source: 'local',
      dimensions: [{ name: 'custom', values: ['distance'] }],
      mappingRules: [],
      entries: [
        { key: { minDistance: 0, maxDistance: 1999 }, value: '6' },
        { key: { minDistance: 2000, maxDistance: 2399 }, value: '5' },
        { key: { minDistance: 2400, maxDistance: 2799 }, value: '4' },
        { key: { minDistance: 2800, maxDistance: 3200 }, value: '3' },
        { key: { minDistance: 3201, maxDistance: 3600 }, value: '2' },
        { key: { minDistance: 3601 }, value: '1' }
      ]
    });
    testTableId = table.id;

    testStudentId = 'test-student-1';
    testCategoryId = 'test-category-1';
  });

  describe('execute', () => {
    test('records a cooper test result successfully', async () => {
      const result = await useCase.execute({
        studentId: testStudentId,
        categoryId: testCategoryId,
        configId: testConfigId,
        sportType: 'running',
        rounds: 7,
        lapLengthMeters: 400,
        extraMeters: 0,
        calculatedGrade: '2'
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.studentId).toBe(testStudentId);
      expect(result.categoryId).toBe(testCategoryId);
      expect(result.measurements.sportType).toBe('running');
      expect(result.measurements.rounds).toBe(7);
      expect(result.measurements.lapLengthMeters).toBe(400);
      expect(result.measurements.distanceMeters).toBe(2800);
      expect(result.calculatedGrade).toBe('2');
      expect(result.metadata?.testType).toBe('cooper-test');
      expect(result.metadata?.configId).toBe(testConfigId);
    });

    test('calculates distance correctly with extra meters', async () => {
      const result = await useCase.execute({
        studentId: testStudentId,
        categoryId: testCategoryId,
        configId: testConfigId,
        sportType: 'running',
        rounds: 8,
        lapLengthMeters: 400,
        extraMeters: 50
      });

      expect(result.measurements.distanceMeters).toBe(3250); // (8 * 400) + 50
    });

    test('auto-calculates grade from table', async () => {
      const result = await useCase.execute({
        studentId: testStudentId,
        categoryId: testCategoryId,
        configId: testConfigId,
        sportType: 'running',
        rounds: 7,
        lapLengthMeters: 400,
        extraMeters: 0,
        tableId: testTableId
      });

      expect(result.measurements.distanceMeters).toBe(2800);
      expect(result.calculatedGrade).toBe('3'); // 2800 falls in 2800-3200 range = grade 3
    });

    test('handles swimming sport type', async () => {
      const swimConfig = await cooperTestConfigRepository.create({
        name: 'Test Cooper Swimming Config',
        sportType: 'swimming',
        distanceUnit: 'meters',
        lapLengthMeters: 50,
        source: 'default'
      });

      const result = await useCase.execute({
        studentId: testStudentId,
        categoryId: testCategoryId,
        configId: swimConfig.id,
        sportType: 'swimming',
        rounds: 100,
        lapLengthMeters: 50,
        extraMeters: 25
      });

      expect(result.measurements.sportType).toBe('swimming');
      expect(result.measurements.distanceMeters).toBe(5025); // (100 * 50) + 25
    });

    test('validates that student ID is required', async () => {
      await expect(
        useCase.execute({
          studentId: '',
          categoryId: testCategoryId,
          configId: testConfigId,
          sportType: 'running',
          rounds: 7,
          lapLengthMeters: 400
        })
      ).rejects.toThrow('Student ID is required');
    });

    test('validates that category ID is required', async () => {
      await expect(
        useCase.execute({
          studentId: testStudentId,
          categoryId: '',
          configId: testConfigId,
          sportType: 'running',
          rounds: 7,
          lapLengthMeters: 400
        })
      ).rejects.toThrow('Category ID is required');
    });

    test('validates that sport type is required', async () => {
      await expect(
        useCase.execute({
          studentId: testStudentId,
          categoryId: testCategoryId,
          configId: testConfigId,
          sportType: null as any,
          rounds: 7,
          lapLengthMeters: 400
        })
      ).rejects.toThrow('Sport type is required');
    });

    test('validates that rounds is required', async () => {
      await expect(
        useCase.execute({
          studentId: testStudentId,
          categoryId: testCategoryId,
          configId: testConfigId,
          sportType: 'running',
          rounds: null as any,
          lapLengthMeters: 400
        })
      ).rejects.toThrow('Rounds are required');
    });

    test('validates that lap length is required', async () => {
      await expect(
        useCase.execute({
          studentId: testStudentId,
          categoryId: testCategoryId,
          configId: testConfigId,
          sportType: 'running',
          rounds: 7,
          lapLengthMeters: null as any
        })
      ).rejects.toThrow('Lap length is required');
    });

    test('validates that config exists', async () => {
      await expect(
        useCase.execute({
          studentId: testStudentId,
          categoryId: testCategoryId,
          configId: 'non-existent-config',
          sportType: 'running',
          rounds: 7,
          lapLengthMeters: 400
        })
      ).rejects.toThrow('Cooper Test Config not found');
    });

    test('validates that sport type matches config', async () => {
      await expect(
        useCase.execute({
          studentId: testStudentId,
          categoryId: testCategoryId,
          configId: testConfigId,
          sportType: 'swimming', // Config is for running
          rounds: 7,
          lapLengthMeters: 400
        })
      ).rejects.toThrow('Sport type mismatch');
    });

    test('saves results to repository correctly', async () => {
      await useCase.execute({
        studentId: testStudentId,
        categoryId: testCategoryId,
        configId: testConfigId,
        sportType: 'running',
        rounds: 7,
        lapLengthMeters: 400
      });

      const savedResults = await performanceEntryRepository.findByStudentAndCategory(
        testStudentId,
        testCategoryId
      );

      expect(savedResults).toHaveLength(1);
      expect(savedResults[0].measurements.rounds).toBe(7);
    });

    test('records multiple results without interference', async () => {
      await useCase.execute({
        studentId: testStudentId,
        categoryId: testCategoryId,
        configId: testConfigId,
        sportType: 'running',
        rounds: 6,
        lapLengthMeters: 400,
        calculatedGrade: '4'
      });

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      await useCase.execute({
        studentId: testStudentId,
        categoryId: testCategoryId,
        configId: testConfigId,
        sportType: 'running',
        rounds: 8,
        lapLengthMeters: 400,
        calculatedGrade: '2'
      });

      const results = await performanceEntryRepository.findByStudentAndCategory(
        testStudentId,
        testCategoryId
      );

      expect(results).toHaveLength(2);
      expect(results[0].measurements.rounds).toBe(8);
      expect(results[1].measurements.rounds).toBe(6);
    });

    test('allows custom metadata alongside test type', async () => {
      const customMetadata = {
        weather: 'sunny',
        humidity: 65
      };

      const result = await useCase.execute({
        studentId: testStudentId,
        categoryId: testCategoryId,
        configId: testConfigId,
        sportType: 'running',
        rounds: 7,
        lapLengthMeters: 400,
        metadata: customMetadata
      });

      expect(result.metadata?.weather).toBe('sunny');
      expect(result.metadata?.humidity).toBe(65);
      expect(result.metadata?.testType).toBe('cooper-test');
    });
  });
});
