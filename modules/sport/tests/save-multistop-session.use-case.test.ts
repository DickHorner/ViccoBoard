/**
 * SaveMultistopSessionUseCase Tests
 * Verifies multistop session persistence and metadata mapping.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SaveMultistopSessionUseCase } from '../src/use-cases/save-multistop-session.use-case';
import { ToolSessionRepository } from '../src/repositories/tool-session.repository';
import {
  SQLiteStorage,
  InitialSchemaMigration,
  GradingSchemaMigration,
  ToolSessionsSchemaMigration
} from '@viccoboard/storage/node';
import type { StorageAdapter } from '@viccoboard/storage/node';

describe('SaveMultistopSessionUseCase', () => {
  let storage: SQLiteStorage;
  let repository: ToolSessionRepository;
  let useCase: SaveMultistopSessionUseCase;
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
    useCase = new SaveMultistopSessionUseCase(repository);
  });

  afterEach(async () => {
    if (storage) {
      await storage.close();
    }
  });

  describe('validation', () => {
    it('should throw if classGroupId is missing', async () => {
      await expect(
        useCase.execute({
          classGroupId: '',
          sessionName: 'Session 1',
          capturedTimes: [
            { studentId: 's1', studentName: 'Alice', timeMs: 185000, capturedAt: Date.now(), laps: [] }
          ]
        })
      ).rejects.toThrow('classGroupId is required');
    });

    it('should throw if sessionName is missing', async () => {
      await createClassGroup(adapter, 'class-1');
      await expect(
        useCase.execute({
          classGroupId: 'class-1',
          sessionName: '   ',
          capturedTimes: [
            { studentId: 's1', studentName: 'Alice', timeMs: 185000, capturedAt: Date.now(), laps: [] }
          ]
        })
      ).rejects.toThrow('sessionName is required');
    });

    it('should throw if capturedTimes is empty', async () => {
      await createClassGroup(adapter, 'class-1');
      await expect(
        useCase.execute({
          classGroupId: 'class-1',
          sessionName: 'Session 1',
          capturedTimes: []
        })
      ).rejects.toThrow('capturedTimes must not be empty');
    });
  });

  describe('session creation', () => {
    it('should persist session with toolType multistop', async () => {
      await createClassGroup(adapter, 'class-1');

      const capturedAt = Date.now();
      const result = await useCase.execute({
        classGroupId: 'class-1',
        sessionName: '3000m 14.03.',
        capturedTimes: [
          { studentId: 's1', studentName: 'Alice Meyer', timeMs: 750000, capturedAt, laps: [] },
          { studentId: 's2', studentName: 'Bob Schmidt', timeMs: 800000, capturedAt, laps: [] }
        ]
      });

      expect(result.id).toBeDefined();
      expect(result.toolType).toBe('multistop');
      expect(result.classGroupId).toBe('class-1');
      expect(result.lessonId).toBeUndefined();
      expect(result.sessionMetadata.sessionName).toBe('3000m 14.03.');
      expect(result.sessionMetadata.capturedTimes).toHaveLength(2);
    });

    it('should map captured times correctly', async () => {
      await createClassGroup(adapter, 'class-1');

      const capturedAt = 1700000000000;
      const result = await useCase.execute({
        classGroupId: 'class-1',
        sessionName: 'Mittelstrecke',
        capturedTimes: [
          {
            studentId: 'student-abc',
            studentName: 'Lisa Müller',
            timeMs: 185000,
            capturedAt,
            laps: [60000, 65000, 60000]
          }
        ]
      });

      const ct = result.sessionMetadata.capturedTimes[0];
      expect(ct.studentId).toBe('student-abc');
      expect(ct.studentName).toBe('Lisa Müller');
      expect(ct.timeMs).toBe(185000);
      expect(ct.capturedAt).toBe(capturedAt);
      expect(ct.laps).toEqual([60000, 65000, 60000]);
    });

    it('should trim sessionName whitespace', async () => {
      await createClassGroup(adapter, 'class-1');

      const result = await useCase.execute({
        classGroupId: 'class-1',
        sessionName: '  800m Sprint  ',
        capturedTimes: [
          { studentId: 's1', studentName: 'Tom', timeMs: 130000, capturedAt: Date.now(), laps: [] }
        ]
      });

      expect(result.sessionMetadata.sessionName).toBe('800m Sprint');
    });

    it('should persist with optional lessonId', async () => {
      await createClassGroup(adapter, 'class-1');
      await createLesson(adapter, 'lesson-1', 'class-1');

      const result = await useCase.execute({
        classGroupId: 'class-1',
        lessonId: 'lesson-1',
        sessionName: 'Mittelstrecke Stunde',
        capturedTimes: [
          { studentId: 's1', studentName: 'Anna', timeMs: 200000, capturedAt: Date.now(), laps: [] }
        ]
      });

      expect(result.classGroupId).toBe('class-1');
      expect(result.lessonId).toBe('lesson-1');
    });

    it('should be retrievable by toolType', async () => {
      await createClassGroup(adapter, 'class-1');

      await useCase.execute({
        classGroupId: 'class-1',
        sessionName: 'Session A',
        capturedTimes: [
          { studentId: 's1', studentName: 'Alice', timeMs: 185000, capturedAt: Date.now(), laps: [] }
        ]
      });

      const sessions = await repository.findByToolType('multistop');
      expect(sessions).toHaveLength(1);
      expect(sessions[0].sessionMetadata.sessionName).toBe('Session A');
    });

    it('should be retrievable by classGroup', async () => {
      await createClassGroup(adapter, 'class-1');
      await createClassGroup(adapter, 'class-2');

      await useCase.execute({
        classGroupId: 'class-1',
        sessionName: 'Session class-1',
        capturedTimes: [
          { studentId: 's1', studentName: 'Alice', timeMs: 185000, capturedAt: Date.now(), laps: [] }
        ]
      });
      await useCase.execute({
        classGroupId: 'class-2',
        sessionName: 'Session class-2',
        capturedTimes: [
          { studentId: 's2', studentName: 'Bob', timeMs: 195000, capturedAt: Date.now(), laps: [] }
        ]
      });

      const class1Sessions = await repository.findByClassGroup('class-1');
      expect(class1Sessions.filter(s => s.toolType === 'multistop')).toHaveLength(1);
      expect(class1Sessions[0].sessionMetadata.sessionName).toBe('Session class-1');
    });
  });
});
