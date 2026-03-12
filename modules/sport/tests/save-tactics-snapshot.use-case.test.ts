/**
 * SaveTacticsSnapshotUseCase Tests
 * Verifies tactics snapshot save/update flow and validation
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SaveTacticsSnapshotUseCase } from '../src/use-cases/save-tactics-snapshot.use-case';
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

describe('SaveTacticsSnapshotUseCase', () => {
  let storage: SQLiteStorage;
  let repository: TacticsSnapshotRepository;
  let useCase: SaveTacticsSnapshotUseCase;
  let adapter: StorageAdapter;

  const defaultMarkings: Sport.TacticsMarking[] = [
    {
      id: 'p1',
      type: 'player',
      position: { x: 50, y: 100 },
      properties: { color: '#cc0000' }
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
    useCase = new SaveTacticsSnapshotUseCase(repository);
  });

  afterEach(async () => {
    if (storage) {
      await storage.close();
    }
  });

  describe('validation', () => {
    it('should throw if title is empty', async () => {
      await expect(
        useCase.execute({
          title: '',
          markings: [],
          background: 'field'
        })
      ).rejects.toThrow('title is required');
    });

    it('should throw if title is whitespace', async () => {
      await expect(
        useCase.execute({
          title: '   ',
          markings: [],
          background: 'field'
        })
      ).rejects.toThrow('title is required');
    });

    it('should throw if background is invalid', async () => {
      await expect(
        useCase.execute({
          title: 'Valid title',
          markings: [],
          background: 'invalid' as any
        })
      ).rejects.toThrow('background must be one of: court, field, pitch, custom');
    });

    it('should throw if markings is not an array', async () => {
      await expect(
        useCase.execute({
          title: 'Valid title',
          markings: null as any,
          background: 'field'
        })
      ).rejects.toThrow('markings must be an array');
    });
  });

  describe('create flow', () => {
    it('should create a new snapshot when no id provided', async () => {
      const result = await useCase.execute({
        title: 'New Snapshot',
        markings: defaultMarkings,
        background: 'field'
      });

      expect(result.id).toBeDefined();
      expect(result.title).toBe('New Snapshot');
      expect(result.markings).toHaveLength(1);
      expect(result.background).toBe('field');
      expect(result.version).toBe(1);
    });

    it('should persist snapshot and allow retrieval', async () => {
      const result = await useCase.execute({
        title: 'Persist test',
        markings: defaultMarkings,
        background: 'court'
      });

      const loaded = await repository.findById(result.id);
      expect(loaded).not.toBeNull();
      expect(loaded!.title).toBe('Persist test');
      expect(loaded!.markings).toHaveLength(1);
    });

    it('should accept optional lessonId', async () => {
      await createClassGroup(adapter, 'class-1');
      await createLesson(adapter, 'lesson-xyz', 'class-1');

      const result = await useCase.execute({
        title: 'With lesson',
        lessonId: 'lesson-xyz',
        markings: [],
        background: 'pitch'
      });

      expect(result.lessonId).toBe('lesson-xyz');
    });

    it('should accept optional sport', async () => {
      const result = await useCase.execute({
        title: 'Soccer',
        sport: 'Fußball',
        markings: [],
        background: 'field'
      });

      expect(result.sport).toBe('Fußball');
    });

    it('should allow all valid background values', async () => {
      for (const bg of ['court', 'field', 'pitch', 'custom'] as const) {
        const result = await useCase.execute({
          title: `Board ${bg}`,
          markings: [],
          background: bg
        });
        expect(result.background).toBe(bg);
      }
    });
  });

  describe('update flow', () => {
    it('should update an existing snapshot when id provided', async () => {
      const created = await useCase.execute({
        title: 'Original',
        markings: [],
        background: 'field'
      });

      const updated = await useCase.execute({
        id: created.id,
        title: 'Updated Title',
        markings: defaultMarkings,
        background: 'court'
      });

      expect(updated.id).toBe(created.id);
      expect(updated.title).toBe('Updated Title');
      expect(updated.markings).toHaveLength(1);
      expect(updated.background).toBe('court');
      expect(updated.version).toBe(2);
    });

    it('should increment version on update', async () => {
      const created = await useCase.execute({
        title: 'V1',
        markings: [],
        background: 'field'
      });
      expect(created.version).toBe(1);

      const v2 = await useCase.execute({
        id: created.id,
        title: 'V2',
        markings: [],
        background: 'field'
      });
      expect(v2.version).toBe(2);
    });
  });

  describe('snapshot fidelity', () => {
    it('should preserve all marking properties through save/reload cycle', async () => {
      const complexMarkings: Sport.TacticsMarking[] = [
        { id: 'a', type: 'player',  position: { x: 10, y: 20 }, properties: { color: '#cc0000' } },
        { id: 'b', type: 'arrow',   position: { x: 30, y: 40 }, properties: { color: '#0044cc', endX: 80, endY: 90 } },
        { id: 'c', type: 'circle',  position: { x: 50, y: 60 }, properties: { color: '#cc0000', radius: 25 } },
        { id: 'd', type: 'text',    position: { x: 70, y: 80 }, properties: { color: '#0044cc', label: 'Sprint!' } }
      ];

      const saved = await useCase.execute({
        title: 'Fidelity test',
        markings: complexMarkings,
        background: 'field'
      });

      const loaded = await repository.findById(saved.id);
      expect(loaded!.markings).toHaveLength(4);

      const arrow = loaded!.markings.find((m) => m.type === 'arrow')!;
      expect(arrow.properties.endX).toBe(80);
      expect(arrow.properties.endY).toBe(90);

      const circle = loaded!.markings.find((m) => m.type === 'circle')!;
      expect(circle.properties.radius).toBe(25);

      const text = loaded!.markings.find((m) => m.type === 'text')!;
      expect(text.properties.label).toBe('Sprint!');
    });
  });
});
