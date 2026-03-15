/**
 * SaveFinishCameraSessionUseCase Tests
 * Verifies finish-line camera session persistence using ToolSessionRepository
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SaveFinishCameraSessionUseCase } from '../src/use-cases/save-finish-camera-session.use-case';
import { ToolSessionRepository } from '../src/repositories/tool-session.repository';
import { SQLiteStorage } from '@viccoboard/storage/node';
import {
  InitialSchemaMigration,
  GradingSchemaMigration,
  ToolSessionsSchemaMigration
} from '@viccoboard/storage/node';
import type { StorageAdapter } from '@viccoboard/storage/node';

describe('SaveFinishCameraSessionUseCase', () => {
  let storage: SQLiteStorage;
  let repository: ToolSessionRepository;
  let useCase: SaveFinishCameraSessionUseCase;
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

  beforeEach(async () => {
    storage = new SQLiteStorage({ databasePath: ':memory:', memory: true });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    storage.registerMigration(new GradingSchemaMigration(storage));
    storage.registerMigration(new ToolSessionsSchemaMigration(storage));
    await storage.migrate();

    adapter = storage.getAdapter();
    repository = new ToolSessionRepository(adapter);
    useCase = new SaveFinishCameraSessionUseCase(repository);
  });

  afterEach(async () => {
    if (storage) await storage.close();
  });

  // --------------------------------------------------------------------------
  // Validation
  // --------------------------------------------------------------------------
  describe('validation', () => {
    it('should throw if classGroupId is empty', async () => {
      await expect(
        useCase.execute({ classGroupId: '', events: [], totalElapsedMs: 1000 })
      ).rejects.toThrow('classGroupId is required');
    });

    it('should throw if events is not an array', async () => {
      await expect(
        useCase.execute({
          classGroupId: 'class-1',
          events: null as unknown as [],
          totalElapsedMs: 1000
        })
      ).rejects.toThrow('events must be an array');
    });

    it('should throw if totalElapsedMs is negative', async () => {
      await expect(
        useCase.execute({ classGroupId: 'class-1', events: [], totalElapsedMs: -1 })
      ).rejects.toThrow('totalElapsedMs must be a non-negative number');
    });

    it('should throw if an event is missing id', async () => {
      await expect(
        useCase.execute({
          classGroupId: 'class-1',
          events: [
            { id: '', elapsedMs: 1000, recordedAt: new Date().toISOString(), manual: false }
          ],
          totalElapsedMs: 2000
        })
      ).rejects.toThrow('Each event must have an id');
    });

    it('should throw if an event has negative elapsedMs', async () => {
      await expect(
        useCase.execute({
          classGroupId: 'class-1',
          events: [
            { id: 'ev-1', elapsedMs: -100, recordedAt: new Date().toISOString(), manual: false }
          ],
          totalElapsedMs: 2000
        })
      ).rejects.toThrow('Invalid elapsedMs for event ev-1');
    });
  });

  // --------------------------------------------------------------------------
  // Empty events
  // --------------------------------------------------------------------------
  describe('empty events list', () => {
    it('should allow saving a session with no events', async () => {
      await createClassGroup(adapter, 'class-empty');
      const result = await useCase.execute({
        classGroupId: 'class-empty',
        events: [],
        totalElapsedMs: 0
      });

      expect(result.id).toBeDefined();
      expect(result.toolType).toBe('finish-camera');
      expect(result.sessionMetadata.events).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // Basic session save
  // --------------------------------------------------------------------------
  describe('basic session', () => {
    it('should persist a session with events', async () => {
      await createClassGroup(adapter, 'class-run');
      const now = new Date().toISOString();
      const result = await useCase.execute({
        classGroupId: 'class-run',
        events: [
          { id: 'ev-1', elapsedMs: 65000, recordedAt: now, manual: false },
          { id: 'ev-2', elapsedMs: 67500, recordedAt: now, manual: false },
          { id: 'ev-3', elapsedMs: 72000, recordedAt: now, manual: true }
        ],
        totalElapsedMs: 80000
      });

      expect(result.toolType).toBe('finish-camera');
      expect(result.classGroupId).toBe('class-run');
      expect(result.sessionMetadata.events).toHaveLength(3);
      expect(result.sessionMetadata.totalElapsedMs).toBe(80000);
    });

    it('should store event fields correctly', async () => {
      await createClassGroup(adapter, 'class-fields');
      const ts = new Date().toISOString();
      const result = await useCase.execute({
        classGroupId: 'class-fields',
        events: [
          {
            id: 'ev-assigned',
            elapsedMs: 55000,
            recordedAt: ts,
            manual: false,
            studentId: 'student-42',
            studentName: 'Max Mustermann'
          }
        ],
        totalElapsedMs: 60000
      });

      const ev = result.sessionMetadata.events[0];
      expect(ev.id).toBe('ev-assigned');
      expect(ev.elapsedMs).toBe(55000);
      expect(ev.manual).toBe(false);
      expect(ev.studentId).toBe('student-42');
      expect(ev.studentName).toBe('Max Mustermann');
    });

    it('should mark manual events correctly', async () => {
      await createClassGroup(adapter, 'class-manual');
      const ts = new Date().toISOString();
      const result = await useCase.execute({
        classGroupId: 'class-manual',
        events: [
          { id: 'ev-m', elapsedMs: 40000, recordedAt: ts, manual: true }
        ],
        totalElapsedMs: 50000
      });

      expect(result.sessionMetadata.events[0].manual).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Persistence & retrieval
  // --------------------------------------------------------------------------
  describe('persistence', () => {
    it('should be retrievable by id', async () => {
      await createClassGroup(adapter, 'class-persist');
      const ts = new Date().toISOString();
      const created = await useCase.execute({
        classGroupId: 'class-persist',
        events: [
          { id: 'ev-p1', elapsedMs: 10000, recordedAt: ts, manual: false }
        ],
        totalElapsedMs: 15000
      });

      const found = await repository.findById(created.id);
      expect(found).not.toBeNull();
      expect(found!.toolType).toBe('finish-camera');
      expect(found!.sessionMetadata.events[0].id).toBe('ev-p1');
    });

    it('should be retrievable by tool type', async () => {
      await createClassGroup(adapter, 'class-typeq');
      const ts = new Date().toISOString();
      await useCase.execute({ classGroupId: 'class-typeq', events: [
        { id: 'a', elapsedMs: 5000, recordedAt: ts, manual: false }
      ], totalElapsedMs: 10000 });
      await useCase.execute({ classGroupId: 'class-typeq', events: [
        { id: 'b', elapsedMs: 6000, recordedAt: ts, manual: true }
      ], totalElapsedMs: 12000 });

      const sessions = await repository.findByToolType('finish-camera');
      expect(sessions.length).toBeGreaterThanOrEqual(2);
    });
  });

  // --------------------------------------------------------------------------
  // Return type
  // --------------------------------------------------------------------------
  describe('return type', () => {
    it('should return Sport.ToolSession (not PerformanceEntry)', async () => {
      await createClassGroup(adapter, 'class-rt');
      const result = await useCase.execute({
        classGroupId: 'class-rt',
        events: [],
        totalElapsedMs: 0
      });

      expect(result).toHaveProperty('toolType');
      expect(result).toHaveProperty('sessionMetadata');
      expect(result.toolType).toBe('finish-camera');
      expect(result).not.toHaveProperty('studentId');
    });
  });

  // --------------------------------------------------------------------------
  // Optional fields
  // --------------------------------------------------------------------------
  describe('optional fields', () => {
    it('should accept optional lessonId', async () => {
      await createClassGroup(adapter, 'class-lesson');
      const now = new Date().toISOString();
      await adapter.insert('lessons', {
        id: 'lesson-fc1',
        class_group_id: 'class-lesson',
        date: '2025-06-01',
        random_student_seed: null,
        created_at: now,
        last_modified: now
      });

      const result = await useCase.execute({
        classGroupId: 'class-lesson',
        lessonId: 'lesson-fc1',
        events: [],
        totalElapsedMs: 0
      });

      expect(result.lessonId).toBe('lesson-fc1');
    });

    it('should accept optional startedAt / endedAt', async () => {
      await createClassGroup(adapter, 'class-dates');
      const start = new Date('2025-06-01T09:00:00Z');
      const end = new Date('2025-06-01T09:20:00Z');
      const result = await useCase.execute({
        classGroupId: 'class-dates',
        events: [],
        totalElapsedMs: 1200000,
        startedAt: start,
        endedAt: end
      });

      expect(result.startedAt).toEqual(start);
      expect(result.endedAt).toEqual(end);
    });
  });
});
