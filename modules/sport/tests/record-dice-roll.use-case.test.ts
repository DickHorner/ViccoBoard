/**
 * RecordDiceRollUseCase Tests
 * Verifies dice roll persistence via ToolSessionRepository.
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

  beforeEach(async () => {
    storage = new SQLiteStorage({ databasePath: ':memory:', memory: true });
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
    if (storage) await storage.close();
  });

  describe('validation', () => {
    it('should throw when minValue > maxValue', async () => {
      await expect(
        useCase.execute({ minValue: 6, maxValue: 1, result: 3 })
      ).rejects.toThrow('minValue must be less than or equal to maxValue');
    });

    it('should throw when result is below minValue', async () => {
      await expect(
        useCase.execute({ minValue: 1, maxValue: 6, result: 0 })
      ).rejects.toThrow('result must be between minValue and maxValue');
    });

    it('should throw when result is above maxValue', async () => {
      await expect(
        useCase.execute({ minValue: 1, maxValue: 6, result: 7 })
      ).rejects.toThrow('result must be between minValue and maxValue');
    });
  });

  describe('persistence', () => {
    it('should persist a dice roll with toolType "dice"', async () => {
      const result = await useCase.execute({ minValue: 1, maxValue: 6, result: 4 });

      expect(result.toolType).toBe('dice');
      expect(result.sessionMetadata.minValue).toBe(1);
      expect(result.sessionMetadata.maxValue).toBe(6);
      expect(result.sessionMetadata.result).toBe(4);
    });

    it('should allow minValue equal to maxValue', async () => {
      const result = await useCase.execute({ minValue: 5, maxValue: 5, result: 5 });
      expect(result.sessionMetadata.result).toBe(5);
    });

    it('should persist multiple rolls independently', async () => {
      await useCase.execute({ minValue: 1, maxValue: 6, result: 3 });
      await useCase.execute({ minValue: 1, maxValue: 100, result: 42 });

      const sessions = await repository.findByToolType('dice');
      expect(sessions).toHaveLength(2);
    });

    it('should store timestamp in metadata', async () => {
      const result = await useCase.execute({ minValue: 1, maxValue: 20, result: 15 });
      expect(result.sessionMetadata.timestamp).toBeDefined();
    });

    it('should accept optional classGroupId', async () => {
      // Create the class group first to satisfy FK constraint
      await adapter.insert('class_groups', {
        id: 'class-xyz',
        name: 'Test Class',
        school_year: '2024/25',
        color: null,
        archived: 0,
        state: null,
        holiday_calendar_ref: null,
        grading_scheme: null,
        subject_profile: null,
        created_at: new Date().toISOString(),
        last_modified: new Date().toISOString()
      });

      const result = await useCase.execute({
        minValue: 1,
        maxValue: 6,
        result: 2,
        classGroupId: 'class-xyz'
      });
      expect(result.classGroupId).toBe('class-xyz');
    });
  });
});
