/**
 * RecordTimerResultUseCase Tests
 * Verifies timer session persistence uses ToolSessionRepository (no FK violations)
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { RecordTimerResultUseCase } from '../src/use-cases/record-timer-result.use-case';
import { ToolSessionRepository } from '../src/repositories/tool-session.repository';
import { SQLiteStorage } from '@viccoboard/storage/node';
import { InitialSchemaMigration, GradingSchemaMigration, ToolSessionsSchemaMigration } from '@viccoboard/storage/node';
import type { StorageAdapter } from '@viccoboard/storage/node';

describe('RecordTimerResultUseCase', () => {
  let storage: SQLiteStorage;
  let repository: ToolSessionRepository;
  let useCase: RecordTimerResultUseCase;
  let adapter: StorageAdapter;

  const createClassGroup = async (adapterInstance: StorageAdapter, id: string) => {
    const now = new Date().toISOString();
    await adapterInstance.insert('class_groups', {
      id,
      name: `Class ${id}`,
      school_year: '2024/25',
      color: null,
      archived: 0,
      state: null,
      holiday_calendar_ref: null,
      grading_scheme: null,
      subject_profile: null,
      created_at: now,
      last_modified: now
    });
  };

  const createLesson = async (
    adapterInstance: StorageAdapter,
    id: string,
    classGroupId: string
  ) => {
    const now = new Date().toISOString();
    await adapterInstance.insert('lessons', {
      id,
      class_group_id: classGroupId,
      date: '2025-01-01',
      random_student_seed: null,
      created_at: now,
      last_modified: now
    });
  };

  beforeEach(async () => {
    storage = new SQLiteStorage({
      databasePath: ':memory:',
      memory: true
    });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    storage.registerMigration(new GradingSchemaMigration(storage));
    storage.registerMigration(new ToolSessionsSchemaMigration(storage));
    await storage.migrate();

    adapter = storage.getAdapter();
    repository = new ToolSessionRepository(adapter);
    useCase = new RecordTimerResultUseCase(repository);
  });

  afterEach(async () => {
    if (storage) {
      await storage.close();
    }
  });

  describe('validation', () => {
    it('should throw error if sessionId is missing', async () => {
      await expect(
        useCase.execute({
          sessionId: '',
          mode: 'stopwatch',
          elapsedMs: 5000,
          audioEnabled: false
        })
      ).rejects.toThrow('sessionId is required');
    });

    it('should throw error if mode is invalid', async () => {
      await expect(
        useCase.execute({
          sessionId: 'test-123',
          mode: 'invalid' as any,
          elapsedMs: 5000,
          audioEnabled: false
        })
      ).rejects.toThrow('mode must be one of: stopwatch, countdown, interval');
    });

    it('should throw error if elapsedMs is negative', async () => {
      await expect(
        useCase.execute({
          sessionId: 'test-123',
          mode: 'stopwatch',
          elapsedMs: -100,
          audioEnabled: false
        })
      ).rejects.toThrow('elapsedMs must be non-negative');
    });

    it('should throw error if audioEnabled is not boolean', async () => {
      await expect(
        useCase.execute({
          sessionId: 'test-123',
          mode: 'stopwatch',
          elapsedMs: 5000,
          audioEnabled: 'yes' as any
        })
      ).rejects.toThrow('audioEnabled must be a boolean');
    });
  });

  describe('stopwatch mode', () => {
    it('should create tool session for stopwatch', async () => {
      const result = await useCase.execute({
        sessionId: 'stopwatch-1',
        mode: 'stopwatch',
        elapsedMs: 12345,
        audioEnabled: true
      });

      expect(result.id).toBeDefined();
      expect(result.toolType).toBe('timer');
      expect(result.sessionMetadata.sessionId).toBe('stopwatch-1');
      expect(result.sessionMetadata.mode).toBe('stopwatch');
      expect(result.sessionMetadata.elapsedMs).toBe(12345);
      expect(result.sessionMetadata.audioEnabled).toBe(true);
    });

    it('should store custom metadata for stopwatch', async () => {
      const result = await useCase.execute({
        sessionId: 'stopwatch-2',
        mode: 'stopwatch',
        elapsedMs: 5000,
        audioEnabled: false,
        metadata: {
          lapTimes: [1000, 2000, 2000],
          notes: 'Sprint test'
        }
      });

      expect(result.sessionMetadata.lapTimes).toEqual([1000, 2000, 2000]);
      expect(result.sessionMetadata.notes).toBe('Sprint test');
    });
  });

  describe('countdown mode', () => {
    it('should create tool session for countdown', async () => {
      const result = await useCase.execute({
        sessionId: 'countdown-1',
        mode: 'countdown',
        elapsedMs: 58000,
        durationMs: 60000,
        audioEnabled: true
      });

      expect(result.sessionMetadata.mode).toBe('countdown');
      expect(result.sessionMetadata.durationMs).toBe(60000);
      expect(result.sessionMetadata.elapsedMs).toBe(58000);
    });
  });

  describe('interval mode', () => {
    it('should create tool session for interval timer', async () => {
      const result = await useCase.execute({
        sessionId: 'interval-1',
        mode: 'interval',
        elapsedMs: 30000,
        intervalMs: 10000,
        intervalCount: 3,
        audioEnabled: true
      });

      expect(result.sessionMetadata.mode).toBe('interval');
      expect(result.sessionMetadata.intervalMs).toBe(10000);
      expect(result.sessionMetadata.intervalCount).toBe(3);
    });
  });

  describe('optional context', () => {
    it('should accept optional classGroupId', async () => {
      await createClassGroup(adapter, 'class-123');
      const result = await useCase.execute({
        sessionId: 'test-class',
        mode: 'stopwatch',
        elapsedMs: 5000,
        audioEnabled: false,
        classGroupId: 'class-123'
      });

      expect(result.classGroupId).toBe('class-123');
    });

    it('should accept optional lessonId', async () => {
      await createClassGroup(adapter, 'class-123');
      await createLesson(adapter, 'lesson-456', 'class-123');
      const result = await useCase.execute({
        sessionId: 'test-lesson',
        mode: 'stopwatch',
        elapsedMs: 5000,
        audioEnabled: false,
        lessonId: 'lesson-456'
      });

      expect(result.lessonId).toBe('lesson-456');
    });

    it('should accept both classGroupId and lessonId', async () => {
      await createClassGroup(adapter, 'class-123');
      await createLesson(adapter, 'lesson-456', 'class-123');
      const result = await useCase.execute({
        sessionId: 'test-full-context',
        mode: 'stopwatch',
        elapsedMs: 5000,
        audioEnabled: false,
        classGroupId: 'class-123',
        lessonId: 'lesson-456'
      });

      expect(result.classGroupId).toBe('class-123');
      expect(result.lessonId).toBe('lesson-456');
    });
  });

  describe('FK integrity verification', () => {
    it('should allow valid classGroupId (FK enforced)', async () => {
      await createClassGroup(adapter, 'class-1');
      const result = await useCase.execute({
        sessionId: 'test-valid-class',
        mode: 'stopwatch',
        elapsedMs: 5000,
        audioEnabled: false,
        classGroupId: 'class-1'
      });

      expect(result.classGroupId).toBe('class-1');
      
      // Verify it's actually persisted
      const retrieved = await repository.findById(result.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.classGroupId).toBe('class-1');
    });

    it('should NOT fail without any context (no FK required)', async () => {
      const result = await useCase.execute({
        sessionId: 'standalone-timer',
        mode: 'stopwatch',
        elapsedMs: 5000,
        audioEnabled: false
        // No classGroupId or lessonId
      });

      expect(result.classGroupId).toBeUndefined();
      expect(result.lessonId).toBeUndefined();
      
      // Verify persistence
      const retrieved = await repository.findById(result.id);
      expect(retrieved).not.toBeNull();
    });
  });

  describe('return type', () => {
    it('should return Sport.ToolSession (not PerformanceEntry)', async () => {
      const result = await useCase.execute({
        sessionId: 'type-check',
        mode: 'stopwatch',
        elapsedMs: 5000,
        audioEnabled: false
      });

      // ToolSession has these properties
      expect(result).toHaveProperty('toolType');
      expect(result).toHaveProperty('sessionMetadata');
      expect(result.toolType).toBe('timer');

      // PerformanceEntry would have different properties like studentId, categoryId
      // This ensures we're returning the correct type
      expect(result).not.toHaveProperty('studentId');
    });
  });
});
