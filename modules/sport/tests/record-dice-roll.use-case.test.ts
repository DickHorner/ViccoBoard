/**
 * RecordDiceRollUseCase Tests
 * Verifies dice roll session persistence uses ToolSessionRepository
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { RecordDiceRollUseCase } from '../src/use-cases/record-dice-roll.use-case';
import { ToolSessionRepository } from '../src/repositories/tool-session.repository';
import { SQLiteStorage } from '@viccoboard/storage/node';
import { InitialSchemaMigration, GradingSchemaMigration, ToolSessionsSchemaMigration } from '@viccoboard/storage/node';
import type { StorageAdapter } from '@viccoboard/storage/node';

describe('RecordDiceRollUseCase', () => {
  let storage: SQLiteStorage;
  let repository: ToolSessionRepository;
  let useCase: RecordDiceRollUseCase;
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
    useCase = new RecordDiceRollUseCase(repository);
  });

  afterEach(async () => {
    if (storage) {
      await storage.close();
    }
  });

  describe('validation', () => {
    it('should throw error if sessionId is missing', async () => {
      await expect(
        useCase.execute({ sessionId: '', min: 1, max: 6, result: 3 })
      ).rejects.toThrow('sessionId is required');
    });

    it('should throw error if min is not an integer', async () => {
      await expect(
        useCase.execute({ sessionId: 'dice-1', min: 1.5, max: 6, result: 3 })
      ).rejects.toThrow('min must be an integer');
    });

    it('should throw error if max is not an integer', async () => {
      await expect(
        useCase.execute({ sessionId: 'dice-1', min: 1, max: 6.5, result: 3 })
      ).rejects.toThrow('max must be an integer');
    });

    it('should throw error if min > max', async () => {
      await expect(
        useCase.execute({ sessionId: 'dice-1', min: 10, max: 1, result: 5 })
      ).rejects.toThrow('min must not be greater than max');
    });

    it('should throw error if result is not an integer', async () => {
      await expect(
        useCase.execute({ sessionId: 'dice-1', min: 1, max: 6, result: 2.5 })
      ).rejects.toThrow('result must be an integer');
    });

    it('should throw error if result is below min', async () => {
      await expect(
        useCase.execute({ sessionId: 'dice-1', min: 1, max: 6, result: 0 })
      ).rejects.toThrow('result must be within the configured range');
    });

    it('should throw error if result is above max', async () => {
      await expect(
        useCase.execute({ sessionId: 'dice-1', min: 1, max: 6, result: 7 })
      ).rejects.toThrow('result must be within the configured range');
    });
  });

  describe('basic roll', () => {
    it('should create tool session for a dice roll', async () => {
      const result = await useCase.execute({
        sessionId: 'dice-session-1',
        min: 1,
        max: 6,
        result: 4
      });

      expect(result.id).toBeDefined();
      expect(result.toolType).toBe('dice');
      expect(result.sessionMetadata.sessionId).toBe('dice-session-1');
      expect(result.sessionMetadata.min).toBe(1);
      expect(result.sessionMetadata.max).toBe(6);
      expect(result.sessionMetadata.result).toBe(4);
    });

    it('should accept min === max (single-value range)', async () => {
      const result = await useCase.execute({
        sessionId: 'dice-single',
        min: 5,
        max: 5,
        result: 5
      });

      expect(result.sessionMetadata.result).toBe(5);
    });

    it('should accept result equal to min', async () => {
      const result = await useCase.execute({
        sessionId: 'dice-min',
        min: 1,
        max: 100,
        result: 1
      });

      expect(result.sessionMetadata.result).toBe(1);
    });

    it('should accept result equal to max', async () => {
      const result = await useCase.execute({
        sessionId: 'dice-max',
        min: 1,
        max: 100,
        result: 100
      });

      expect(result.sessionMetadata.result).toBe(100);
    });
  });

  describe('optional context', () => {
    it('should accept optional classGroupId', async () => {
      await createClassGroup(adapter, 'class-abc');
      const result = await useCase.execute({
        sessionId: 'dice-class',
        min: 1,
        max: 6,
        result: 3,
        classGroupId: 'class-abc'
      });

      expect(result.classGroupId).toBe('class-abc');
    });

    it('should accept optional lessonId', async () => {
      await createClassGroup(adapter, 'class-abc');
      await createLesson(adapter, 'lesson-xyz', 'class-abc');
      const result = await useCase.execute({
        sessionId: 'dice-lesson',
        min: 1,
        max: 6,
        result: 3,
        lessonId: 'lesson-xyz'
      });

      expect(result.lessonId).toBe('lesson-xyz');
    });

    it('should work without any context (standalone use)', async () => {
      const result = await useCase.execute({
        sessionId: 'dice-standalone',
        min: 1,
        max: 6,
        result: 2
      });

      expect(result.classGroupId).toBeUndefined();
      expect(result.lessonId).toBeUndefined();
    });
  });

  describe('persistence', () => {
    it('should persist roll and be retrievable by id', async () => {
      const created = await useCase.execute({
        sessionId: 'dice-persist',
        min: 1,
        max: 20,
        result: 15
      });

      const retrieved = await repository.findById(created.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.sessionMetadata.result).toBe(15);
    });

    it('should persist multiple rolls retrievable by tool type', async () => {
      await useCase.execute({ sessionId: 'roll-1', min: 1, max: 6, result: 1 });
      await useCase.execute({ sessionId: 'roll-2', min: 1, max: 6, result: 6 });
      await useCase.execute({ sessionId: 'roll-3', min: 1, max: 6, result: 3 });

      const sessions = await repository.findByToolType('dice');
      expect(sessions).toHaveLength(3);
    });
  });

  describe('return type', () => {
    it('should return Sport.ToolSession (not PerformanceEntry)', async () => {
      const result = await useCase.execute({
        sessionId: 'type-check',
        min: 1,
        max: 6,
        result: 4
      });

      expect(result).toHaveProperty('toolType');
      expect(result).toHaveProperty('sessionMetadata');
      expect(result.toolType).toBe('dice');
      expect(result).not.toHaveProperty('studentId');
    });
  });
});
