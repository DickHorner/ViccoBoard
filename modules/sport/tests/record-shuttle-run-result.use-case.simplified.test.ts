/**
 * Record Shuttle Run Result Use Case Tests (Simplified)
 * Uses mock repositories to avoid database foreign key constraints
 */

import { RecordShuttleRunResultUseCase } from '../src/use-cases/record-shuttle-run-result.use-case.js';
import { Sport} from '@viccoboard/core';

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

class MockShuttleRunConfigRepository {
  private configs = new Map<string, Sport.ShuttleRunConfig>();
  private nextId = 0;

  async create(config: Partial<Sport.ShuttleRunConfig>): Promise<Sport.ShuttleRunConfig> {
    const now = new Date();
    const result: Sport.ShuttleRunConfig = {
      id: `config-${++this.nextId}`,
      name: config.name!,
      levels: config.levels || [],
      audioSignalsEnabled: config.audioSignalsEnabled ?? false,
      source: config.source || 'default',
      createdAt: now,
      lastModified: now
    };
    this.configs.set(result.id, result);
    return result;
  }

  async findById(id: string): Promise<Sport.ShuttleRunConfig | null> {
    return this.configs.get(id) || null;
  }
}

describe('RecordShuttleRunResultUseCase', () => {
  let useCase: RecordShuttleRunResultUseCase;
  let performanceEntryRepository: MockPerformanceEntryRepository;
  let shuttleRunConfigRepository: MockShuttleRunConfigRepository;
  let testStudentId: string;
  let testCategoryId: string;
  let testConfigId: string;

  beforeEach(async () => {
    performanceEntryRepository = new MockPerformanceEntryRepository();
    shuttleRunConfigRepository = new MockShuttleRunConfigRepository();

    useCase = new RecordShuttleRunResultUseCase(
      performanceEntryRepository as any,
      shuttleRunConfigRepository as any
    );

    // Create test config
    const config = await shuttleRunConfigRepository.create({
      name: 'Test Shuttle Run Config',
      levels: [
        { level: 1, lane: 1, speed: 8.0, duration: 1 },
        { level: 1, lane: 2, speed: 8.5, duration: 1 },
        { level: 2, lane: 1, speed: 9.0, duration: 1 },
        { level: 2, lane: 2, speed: 9.5, duration: 1 }
      ],
      audioSignalsEnabled: true,
      source: 'default'
    });
    testConfigId = config.id;

    testStudentId = 'test-student-1';
    testCategoryId = 'test-category-1';
  });

  describe('execute', () => {
    test('records a shuttle run result successfully', async () => {
      const result = await useCase.execute({
        studentId: testStudentId,
        categoryId: testCategoryId,
        configId: testConfigId,
        level: 1,
        lane: 1,
        calculatedGrade: '1',
        comment: 'Good effort'
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.studentId).toBe(testStudentId);
      expect(result.categoryId).toBe(testCategoryId);
      expect(result.measurements.level).toBe(1);
      expect(result.measurements.lane).toBe(1);
      expect(result.calculatedGrade).toBe('1');
      expect(result.comment).toBe('Good effort');
      expect(result.metadata?.testType).toBe('shuttle-run');
      expect(result.metadata?.configId).toBe(testConfigId);
    });

    test('records a result with metadata', async () => {
      const customMetadata = {
        weather: 'sunny',
        temperature: 22,
        location: 'outdoor track'
      };

      const result = await useCase.execute({
        studentId: testStudentId,
        categoryId: testCategoryId,
        configId: testConfigId,
        level: 2,
        lane: 2,
        metadata: customMetadata
      });

      expect(result.metadata?.weather).toBe('sunny');
      expect(result.metadata?.temperature).toBe(22);
      expect(result.metadata?.location).toBe('outdoor track');
      expect(result.metadata?.testType).toBe('shuttle-run');
    });

    test('validates that student ID is required', async () => {
      await expect(
        useCase.execute({
          studentId: '',
          categoryId: testCategoryId,
          configId: testConfigId,
          level: 1,
          lane: 1
        })
      ).rejects.toThrow('Student ID is required');
    });

    test('validates that category ID is required', async () => {
      await expect(
        useCase.execute({
          studentId: testStudentId,
          categoryId: '',
          configId: testConfigId,
          level: 1,
          lane: 1
        })
      ).rejects.toThrow('Category ID is required');
    });

    test('validates that level is required', async () => {
      await expect(
        useCase.execute({
          studentId: testStudentId,
          categoryId: testCategoryId,
          configId: testConfigId,
          level: null as any,
          lane: 1
        })
      ).rejects.toThrow('Level is required');
    });

    test('validates that lane is required', async () => {
      await expect(
        useCase.execute({
          studentId: testStudentId,
          categoryId: testCategoryId,
          configId: testConfigId,
          level: 1,
          lane: null as any
        })
      ).rejects.toThrow('Lane is required');
    });

    test('validates that config exists', async () => {
      await expect(
        useCase.execute({
          studentId: testStudentId,
          categoryId: testCategoryId,
          configId: 'non-existent-config',
          level: 1,
          lane: 1
        })
      ).rejects.toThrow('Shuttle Run Config not found');
    });

    test('validates that level/lane combination exists in config', async () => {
      await expect(
        useCase.execute({
          studentId: testStudentId,
          categoryId: testCategoryId,
          configId: testConfigId,
          level: 99,
          lane: 99
        })
      ).rejects.toThrow('Invalid shuttle run result');
    });

    test('saves results to repository correctly', async () => {
      await useCase.execute({
        studentId: testStudentId,
        categoryId: testCategoryId,
        configId: testConfigId,
        level: 1,
        lane: 2
      });

      const savedResults = await performanceEntryRepository.findByStudentAndCategory(
        testStudentId,
        testCategoryId
      );

      expect(savedResults).toHaveLength(1);
      expect(savedResults[0].measurements.level).toBe(1);
      expect(savedResults[0].measurements.lane).toBe(2);
    });

    test('records multiple results without interference', async () => {
      await useCase.execute({
        studentId: testStudentId,
        categoryId: testCategoryId,
        configId: testConfigId,
        level: 1,
        lane: 1,
        calculatedGrade: '2'
      });

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      await useCase.execute({
        studentId: testStudentId,
        categoryId: testCategoryId,
        configId: testConfigId,
        level: 2,
        lane: 2,
        calculatedGrade: '1'
      });

      const results = await performanceEntryRepository.findByStudentAndCategory(
        testStudentId,
        testCategoryId
      );

      expect(results).toHaveLength(2);
      expect(results[0].measurements.level).toBe(2);
      expect(results[0].measurements.lane).toBe(2);
      expect(results[1].measurements.level).toBe(1);
      expect(results[1].measurements.lane).toBe(1);
    });
  });
});
