/**
 * SavePushupSessionUseCase Tests
 * Verifies push-up session persistence uses ToolSessionRepository with toolType 'pushup-tracking'.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SavePushupSessionUseCase } from '../src/use-cases/save-pushup-session.use-case';
import { ToolSessionRepository } from '../src/repositories/tool-session.repository';
import {
  SQLiteStorage,
  InitialSchemaMigration,
  GradingSchemaMigration,
  ToolSessionsSchemaMigration,
} from '@viccoboard/storage/node';
import type { StorageAdapter } from '@viccoboard/storage/node';

describe('SavePushupSessionUseCase', () => {
  let storage: SQLiteStorage;
  let repository: ToolSessionRepository;
  let useCase: SavePushupSessionUseCase;
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
      last_modified: now,
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
      last_modified: now,
    });
  };

  const validPersons = [
    { personId: 0, count: 10, quality: 'good' as const },
    { personId: 1, count: 8, quality: 'partial' as const },
  ];

  beforeEach(async () => {
    storage = new SQLiteStorage({ databasePath: ':memory:', memory: true });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    storage.registerMigration(new GradingSchemaMigration(storage));
    storage.registerMigration(new ToolSessionsSchemaMigration(storage));
    await storage.migrate();

    adapter = storage.getAdapter();
    repository = new ToolSessionRepository(adapter);
    useCase = new SavePushupSessionUseCase(repository);
  });

  afterEach(async () => {
    if (storage) await storage.close();
  });

  // ── Validation ──────────────────────────────────────────────────────────
  describe('validation', () => {
    it('throws if fps is zero', async () => {
      await expect(
        useCase.execute({ fps: 0, maxPersons: 2, durationSeconds: 30, persons: validPersons })
      ).rejects.toThrow('fps must be a positive number');
    });

    it('throws if fps is negative', async () => {
      await expect(
        useCase.execute({ fps: -1, maxPersons: 2, durationSeconds: 30, persons: validPersons })
      ).rejects.toThrow('fps must be a positive number');
    });

    it('throws if maxPersons is 0', async () => {
      await expect(
        useCase.execute({ fps: 15, maxPersons: 0, durationSeconds: 30, persons: validPersons })
      ).rejects.toThrow('maxPersons must be an integer between 1 and 4');
    });

    it('throws if maxPersons is 5', async () => {
      await expect(
        useCase.execute({ fps: 15, maxPersons: 5, durationSeconds: 30, persons: validPersons })
      ).rejects.toThrow('maxPersons must be an integer between 1 and 4');
    });

    it('throws if maxPersons is not an integer', async () => {
      await expect(
        useCase.execute({ fps: 15, maxPersons: 1.5, durationSeconds: 30, persons: validPersons })
      ).rejects.toThrow('maxPersons must be an integer between 1 and 4');
    });

    it('throws if durationSeconds is negative', async () => {
      await expect(
        useCase.execute({ fps: 15, maxPersons: 2, durationSeconds: -1, persons: validPersons })
      ).rejects.toThrow('durationSeconds must be a non-negative number');
    });

    it('accepts durationSeconds = 0', async () => {
      const result = await useCase.execute({
        fps: 15,
        maxPersons: 2,
        durationSeconds: 0,
        persons: validPersons,
      });
      expect(result).toBeDefined();
    });

    it('throws if persons array is empty', async () => {
      await expect(
        useCase.execute({ fps: 15, maxPersons: 2, durationSeconds: 30, persons: [] })
      ).rejects.toThrow('persons must be a non-empty array');
    });
  });

  // ── Basic persistence ───────────────────────────────────────────────────
  describe('basic persistence', () => {
    it('creates a tool session with toolType "pushup-tracking"', async () => {
      const result = await useCase.execute({
        fps: 30,
        maxPersons: 2,
        durationSeconds: 60,
        persons: validPersons,
      });

      expect(result.id).toBeDefined();
      expect(result.toolType).toBe('pushup-tracking');
    });

    it('stores fps and maxPersons in sessionMetadata', async () => {
      const result = await useCase.execute({
        fps: 15,
        maxPersons: 4,
        durationSeconds: 45,
        persons: validPersons,
      });

      expect(result.sessionMetadata.fps).toBe(15);
      expect(result.sessionMetadata.maxPersons).toBe(4);
      expect(result.sessionMetadata.durationSeconds).toBe(45);
    });

    it('stores persons array in sessionMetadata', async () => {
      const result = await useCase.execute({
        fps: 30,
        maxPersons: 2,
        durationSeconds: 30,
        persons: validPersons,
      });

      expect(result.sessionMetadata.persons).toHaveLength(2);
      expect(result.sessionMetadata.persons[0].count).toBe(10);
      expect(result.sessionMetadata.persons[1].quality).toBe('partial');
    });

    it('computes and stores totalReps in sessionMetadata', async () => {
      const result = await useCase.execute({
        fps: 30,
        maxPersons: 2,
        durationSeconds: 30,
        persons: validPersons,
      });

      expect(result.sessionMetadata.totalReps).toBe(18); // 10 + 8
    });

    it('sets endedAt on the session', async () => {
      const result = await useCase.execute({
        fps: 30,
        maxPersons: 2,
        durationSeconds: 30,
        persons: validPersons,
      });

      expect(result.endedAt).toBeDefined();
    });
  });

  // ── Optional context ────────────────────────────────────────────────────
  describe('optional context', () => {
    it('accepts optional classGroupId', async () => {
      await createClassGroup(adapter, 'class-99');
      const result = await useCase.execute({
        fps: 15,
        maxPersons: 1,
        durationSeconds: 20,
        persons: [{ personId: 0, count: 5, quality: 'good' }],
        classGroupId: 'class-99',
      });

      expect(result.classGroupId).toBe('class-99');
    });

    it('accepts optional lessonId', async () => {
      await createClassGroup(adapter, 'class-99');
      await createLesson(adapter, 'lesson-11', 'class-99');
      const result = await useCase.execute({
        fps: 15,
        maxPersons: 1,
        durationSeconds: 20,
        persons: [{ personId: 0, count: 5, quality: 'good' }],
        lessonId: 'lesson-11',
      });

      expect(result.lessonId).toBe('lesson-11');
    });

    it('works without any context (standalone use)', async () => {
      const result = await useCase.execute({
        fps: 30,
        maxPersons: 2,
        durationSeconds: 30,
        persons: validPersons,
      });

      expect(result.classGroupId).toBeUndefined();
      expect(result.lessonId).toBeUndefined();
    });
  });

  // ── Retrieval ───────────────────────────────────────────────────────────
  describe('retrieval', () => {
    it('persisted session is retrievable by id', async () => {
      const created = await useCase.execute({
        fps: 30,
        maxPersons: 2,
        durationSeconds: 30,
        persons: validPersons,
      });

      const retrieved = await repository.findById(created.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.sessionMetadata.totalReps).toBe(18);
    });

    it('persisted sessions are retrievable by toolType', async () => {
      await useCase.execute({
        fps: 30,
        maxPersons: 2,
        durationSeconds: 30,
        persons: validPersons,
      });
      await useCase.execute({
        fps: 15,
        maxPersons: 1,
        durationSeconds: 60,
        persons: [{ personId: 0, count: 20, quality: 'good' }],
      });

      const sessions = await repository.findByToolType('pushup-tracking');
      expect(sessions).toHaveLength(2);
    });

    it('returns Sport.ToolSession (not PerformanceEntry)', async () => {
      const result = await useCase.execute({
        fps: 30,
        maxPersons: 2,
        durationSeconds: 30,
        persons: validPersons,
      });

      expect(result).toHaveProperty('toolType');
      expect(result).toHaveProperty('sessionMetadata');
      expect(result).not.toHaveProperty('studentId');
    });
  });

  // ── maxPersons boundary values ──────────────────────────────────────────
  describe('maxPersons boundary values', () => {
    it('accepts maxPersons=1', async () => {
      const result = await useCase.execute({
        fps: 30,
        maxPersons: 1,
        durationSeconds: 10,
        persons: [{ personId: 0, count: 3, quality: 'good' }],
      });
      expect(result.sessionMetadata.maxPersons).toBe(1);
    });

    it('accepts maxPersons=4', async () => {
      const result = await useCase.execute({
        fps: 30,
        maxPersons: 4,
        durationSeconds: 10,
        persons: [
          { personId: 0, count: 3, quality: 'good' },
          { personId: 1, count: 4, quality: 'good' },
          { personId: 2, count: 2, quality: 'partial' },
          { personId: 3, count: 1, quality: 'bad' },
        ],
      });
      expect(result.sessionMetadata.maxPersons).toBe(4);
      expect(result.sessionMetadata.totalReps).toBe(10);
    });
  });
});
