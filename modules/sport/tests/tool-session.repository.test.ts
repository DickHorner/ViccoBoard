/**
 * ToolSessionRepository Tests
 * Verifies tool session persistence without FK violations
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ToolSessionRepository } from '../src/repositories/tool-session.repository';
import { SQLiteStorage } from '@viccoboard/storage/node';
import { InitialSchemaMigration } from '@viccoboard/storage/node';
import { GradingSchemaMigration } from '@viccoboard/storage/node';
import { ToolSessionsSchemaMigration } from '@viccoboard/storage/node';
import type { StorageAdapter } from '@viccoboard/storage/node';
import { Sport } from '@viccoboard/core';
import path from 'path';
import os from 'os';
import fs from 'fs';

describe('ToolSessionRepository', () => {
  let storage: SQLiteStorage;
  let repository: ToolSessionRepository;
  let adapter: StorageAdapter;
  let tempDbPath: string;

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
    // Create temporary database
    tempDbPath = path.join(os.tmpdir(), `test-tool-sessions-${Date.now()}.db`);
    
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
  });

  afterEach(async () => {
    if (storage) {
      await storage.close();
    }
    if (tempDbPath && fs.existsSync(tempDbPath)) {
      fs.unlinkSync(tempDbPath);
    }
  });

  describe('create()', () => {
    it('should create tool session without class/lesson context', async () => {
      const session = await repository.create({
        toolType: 'timer',
        sessionMetadata: {
          sessionId: 'test-123',
          mode: 'stopwatch',
          elapsedMs: 5000
        }
      });

      expect(session.id).toBeDefined();
      expect(session.toolType).toBe('timer');
      expect(session.classGroupId).toBeUndefined();
      expect(session.lessonId).toBeUndefined();
      expect(session.sessionMetadata.sessionId).toBe('test-123');
      expect(session.createdAt).toBeInstanceOf(Date);
    });

    it('should create tool session with optional class context', async () => {
      await createClassGroup(adapter, 'class-1');
      const session = await repository.create({
        toolType: 'scoreboard',
        classGroupId: 'class-1',
        sessionMetadata: {
          teamA: 'Red',
          teamB: 'Blue',
          scoreA: 5,
          scoreB: 3
        }
      });

      expect(session.classGroupId).toBe('class-1');
      expect(session.toolType).toBe('scoreboard');
    });

    it('should create tool session with lesson context', async () => {
      await createClassGroup(adapter, 'class-1');
      await createLesson(adapter, 'lesson-1', 'class-1');
      const session = await repository.create({
        toolType: 'timer',
        classGroupId: 'class-1',
        lessonId: 'lesson-1',
        sessionMetadata: {
          topic: 'Warm-up timer'
        }
      });

      expect(session.classGroupId).toBe('class-1');
      expect(session.lessonId).toBe('lesson-1');
    });

    it('should allow endedAt timestamp', async () => {
      const now = new Date();
      const session = await repository.create({
        toolType: 'timer',
        sessionMetadata: { mode: 'countdown' },
        endedAt: now
      });

      expect(session.endedAt).toEqual(now);
    });
  });

  describe('findById()', () => {
    it('should retrieve session by id', async () => {
      const created = await repository.create({
        toolType: 'timer',
        sessionMetadata: { test: true }
      });

      const found = await repository.findById(created.id);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.toolType).toBe('timer');
    });

    it('should return null for non-existent id', async () => {
      const found = await repository.findById('non-existent');
      expect(found).toBeNull();
    });
  });

  describe('findByToolType()', () => {
    it('should find all sessions of specific tool type', async () => {
      await repository.create({
        toolType: 'timer',
        sessionMetadata: { session: 1 }
      });
      await repository.create({
        toolType: 'timer',
        sessionMetadata: { session: 2 }
      });
      await repository.create({
        toolType: 'scoreboard',
        sessionMetadata: { different: true }
      });

      const timerSessions = await repository.findByToolType('timer');
      expect(timerSessions).toHaveLength(2);
      expect(timerSessions.every(s => s.toolType === 'timer')).toBe(true);
    });

    it('should return empty array for tool type with no sessions', async () => {
      const sessions = await repository.findByToolType('nonexistent');
      expect(sessions).toEqual([]);
    });
  });

  describe('findByClassGroup()', () => {
    it('should find sessions for specific class', async () => {
      await createClassGroup(adapter, 'class-1');
      await createClassGroup(adapter, 'class-2');
      await repository.create({
        toolType: 'timer',
        classGroupId: 'class-1',
        sessionMetadata: {}
      });
      await repository.create({
        toolType: 'scoreboard',
        classGroupId: 'class-1',
        sessionMetadata: {}
      });
      await repository.create({
        toolType: 'timer',
        classGroupId: 'class-2',
        sessionMetadata: {}
      });

      const class1Sessions = await repository.findByClassGroup('class-1');
      expect(class1Sessions).toHaveLength(2);
      expect(class1Sessions.every(s => s.classGroupId === 'class-1')).toBe(true);
    });
  });

  describe('update()', () => {
    it('should update session metadata', async () => {
      const session = await repository.create({
        toolType: 'timer',
        sessionMetadata: { count: 1 }
      });

      const updated = await repository.update(session.id, {
        sessionMetadata: { count: 5, extra: 'data' }
      });

      expect(updated.sessionMetadata.count).toBe(5);
      expect(updated.sessionMetadata.extra).toBe('data');
      expect(updated.lastModified.getTime()).toBeGreaterThanOrEqual(
        session.lastModified.getTime()
      );
    });

    it('should set endedAt timestamp', async () => {
      const session = await repository.create({
        toolType: 'timer',
        sessionMetadata: {}
      });

      const endTime = new Date();
      const updated = await repository.update(session.id, {
        endedAt: endTime
      });

      expect(updated.endedAt).toEqual(endTime);
    });

    it('should throw error for non-existent session', async () => {
      await expect(
        repository.update('non-existent', { sessionMetadata: {} })
      ).rejects.toThrow('ToolSession non-existent not found');
    });
  });

  describe('delete()', () => {
    it('should delete session by id', async () => {
      const session = await repository.create({
        toolType: 'timer',
        sessionMetadata: {}
      });

      await repository.delete(session.id);

      const found = await repository.findById(session.id);
      expect(found).toBeNull();
    });
  });

  describe('deleteByToolType()', () => {
    it('should delete all sessions of specific tool type', async () => {
      await repository.create({ toolType: 'timer', sessionMetadata: {} });
      await repository.create({ toolType: 'timer', sessionMetadata: {} });
      await repository.create({ toolType: 'scoreboard', sessionMetadata: {} });

      await repository.deleteByToolType('timer');

      const timerSessions = await repository.findByToolType('timer');
      const scoreboardSessions = await repository.findByToolType('scoreboard');

      expect(timerSessions).toHaveLength(0);
      expect(scoreboardSessions).toHaveLength(1);
    });
  });

  describe('FK integrity', () => {
    it('should accept null classGroupId without FK violation', async () => {
      const session = await repository.create({
        toolType: 'timer',
        sessionMetadata: {}
        // No classGroupId provided
      });

      expect(session.classGroupId).toBeUndefined();
      
      const retrieved = await repository.findById(session.id);
      expect(retrieved).not.toBeNull();
    });

    it('should accept existing classGroupId (FK enforced)', async () => {
      await createClassGroup(adapter, 'class-1');
      const session = await repository.create({
        toolType: 'timer',
        classGroupId: 'class-1',
        sessionMetadata: {}
      });

      expect(session.classGroupId).toBe('class-1');
    });
  });
});
