/**
 * TacticsSnapshotRepository Tests
 * Verifies tactics board snapshot persistence and retrieval
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { TacticsSnapshotRepository } from '../src/repositories/tactics-snapshot.repository';
import { SQLiteStorage } from '@viccoboard/storage/node';
import {
  InitialSchemaMigration,
  GradingSchemaMigration,
  ToolSessionsSchemaMigration,
  TacticsSnapshotsSchemaMigration
} from '@viccoboard/storage/node';
import type { StorageAdapter } from '@viccoboard/storage/node';
import { Sport } from '@viccoboard/core';

describe('TacticsSnapshotRepository', () => {
  let storage: SQLiteStorage;
  let repository: TacticsSnapshotRepository;
  let adapter: StorageAdapter;

  const sampleMarkings: Sport.TacticsMarking[] = [
    {
      id: 'm1',
      type: 'player',
      position: { x: 100, y: 200 },
      properties: { color: '#cc0000' }
    },
    {
      id: 'm2',
      type: 'arrow',
      position: { x: 100, y: 200 },
      properties: { color: '#0044cc', endX: 200, endY: 300 }
    }
  ];

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
    storage.registerMigration(new TacticsSnapshotsSchemaMigration(storage));
    await storage.migrate();

    adapter = storage.getAdapter();
    repository = new TacticsSnapshotRepository(adapter);
  });

  afterEach(async () => {
    if (storage) {
      await storage.close();
    }
  });

  describe('create', () => {
    it('should create a snapshot with required fields', async () => {
      const result = await repository.create({
        title: 'Attack Phase 1',
        markings: sampleMarkings,
        background: 'field'
      });

      expect(result.id).toBeDefined();
      expect(result.title).toBe('Attack Phase 1');
      expect(result.markings).toHaveLength(2);
      expect(result.background).toBe('field');
      expect(result.version).toBe(1);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.lastModified).toBeInstanceOf(Date);
    });

    it('should persist markings as JSON and restore them', async () => {
      const result = await repository.create({
        title: 'Test markings',
        markings: sampleMarkings,
        background: 'court'
      });

      const loaded = await repository.findById(result.id);
      expect(loaded).not.toBeNull();
      expect(loaded!.markings).toHaveLength(2);
      expect(loaded!.markings[0].type).toBe('player');
      expect(loaded!.markings[1].type).toBe('arrow');
      expect(loaded!.markings[1].properties.endX).toBe(200);
    });

    it('should store optional lessonId', async () => {
      await createClassGroup(adapter, 'class-1');
      await createLesson(adapter, 'lesson-abc', 'class-1');

      const result = await repository.create({
        title: 'With lesson',
        lessonId: 'lesson-abc',
        markings: [],
        background: 'pitch'
      });

      expect(result.lessonId).toBe('lesson-abc');
      const loaded = await repository.findById(result.id);
      expect(loaded!.lessonId).toBe('lesson-abc');
    });

    it('should store optional sport', async () => {
      const result = await repository.create({
        title: 'Soccer tactics',
        sport: 'Fußball',
        markings: [],
        background: 'field'
      });

      expect(result.sport).toBe('Fußball');
    });

    it('should allow empty markings array', async () => {
      const result = await repository.create({
        title: 'Empty board',
        markings: [],
        background: 'custom'
      });

      expect(result.markings).toHaveLength(0);
      const loaded = await repository.findById(result.id);
      expect(loaded!.markings).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('should return null for unknown id', async () => {
      const result = await repository.findById('non-existent');
      expect(result).toBeNull();
    });

    it('should return snapshot for existing id', async () => {
      const created = await repository.create({
        title: 'Fetch test',
        markings: [],
        background: 'field'
      });

      const found = await repository.findById(created.id);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.title).toBe('Fetch test');
    });
  });

  describe('findAll', () => {
    it('should return empty array when no snapshots', async () => {
      const all = await repository.findAll();
      expect(all).toHaveLength(0);
    });

    it('should return all created snapshots', async () => {
      await repository.create({ title: 'Snap A', markings: [], background: 'field' });
      await repository.create({ title: 'Snap B', markings: [], background: 'court' });

      const all = await repository.findAll();
      expect(all).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('should update title and markings', async () => {
      const created = await repository.create({
        title: 'Original',
        markings: [],
        background: 'field'
      });

      const updated = await repository.update(created.id, {
        title: 'Updated',
        markings: sampleMarkings
      });

      expect(updated.title).toBe('Updated');
      expect(updated.markings).toHaveLength(2);
      expect(updated.version).toBe(2);
    });

    it('should increment version on each update', async () => {
      const created = await repository.create({
        title: 'V1',
        markings: [],
        background: 'field'
      });

      const v2 = await repository.update(created.id, { title: 'V2' });
      expect(v2.version).toBe(2);

      const v3 = await repository.update(created.id, { title: 'V3' });
      expect(v3.version).toBe(3);
    });

    it('should throw if snapshot not found', async () => {
      await expect(
        repository.update('no-such-id', { title: 'x' })
      ).rejects.toThrow('TacticsSnapshot no-such-id not found');
    });
  });

  describe('delete', () => {
    it('should remove snapshot', async () => {
      const created = await repository.create({
        title: 'Delete me',
        markings: [],
        background: 'field'
      });

      await repository.delete(created.id);
      const found = await repository.findById(created.id);
      expect(found).toBeNull();
    });
  });

  describe('findByLesson', () => {
    it('should return snapshots for a given lessonId', async () => {
      await createClassGroup(adapter, 'class-1');
      await createLesson(adapter, 'lesson-1', 'class-1');
      await createLesson(adapter, 'lesson-2', 'class-1');

      await repository.create({
        title: 'Snap L1',
        lessonId: 'lesson-1',
        markings: [],
        background: 'field'
      });
      await repository.create({
        title: 'Snap L2',
        lessonId: 'lesson-1',
        markings: [],
        background: 'court'
      });
      await repository.create({
        title: 'Snap Other',
        lessonId: 'lesson-2',
        markings: [],
        background: 'field'
      });

      const results = await repository.findByLesson('lesson-1');
      expect(results).toHaveLength(2);
      expect(results.every((s) => s.lessonId === 'lesson-1')).toBe(true);
    });
  });
});
