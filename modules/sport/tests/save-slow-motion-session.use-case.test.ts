import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import {
  GradingSchemaMigration,
  InitialSchemaMigration,
  SQLiteStorage,
  ToolSessionsSchemaMigration,
  type StorageAdapter
} from '@viccoboard/storage/node';
import { ToolSessionRepository } from '../src/repositories/tool-session.repository';
import { SaveSlowMotionSessionUseCase } from '../src/use-cases/save-slow-motion-session.use-case';

describe('SaveSlowMotionSessionUseCase', () => {
  let storage: SQLiteStorage;
  let adapter: StorageAdapter;
  let repository: ToolSessionRepository;
  let useCase: SaveSlowMotionSessionUseCase;

  beforeEach(async () => {
    storage = new SQLiteStorage({ databasePath: ':memory:', memory: true });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    storage.registerMigration(new GradingSchemaMigration(storage));
    storage.registerMigration(new ToolSessionsSchemaMigration(storage));
    await storage.migrate();

    adapter = storage.getAdapter();
    repository = new ToolSessionRepository(adapter);
    useCase = new SaveSlowMotionSessionUseCase(repository);
  });

  afterEach(async () => {
    await storage.close();
  });

  it('rejects a blank session name', async () => {
    await expect(
      useCase.execute({ sessionName: '   ', keyframes: [] })
    ).rejects.toThrow('sessionName is required');
  });

  it('creates a session with toolType slow-motion', async () => {
    const session = await useCase.execute({
      sessionName: 'Weitsprung Analyse',
      studentLabel: 'Max Muster',
      exerciseName: 'Absprung',
      videoDurationSec: 12.5,
      keyframes: [
        {
          id: 'kf-1',
          timeSec: 1.0,
          markers: [
            { bodyPoint: 'knee-left', x: 0.4, y: 0.6 },
            { bodyPoint: 'hip-left', x: 0.42, y: 0.5 }
          ]
        }
      ],
      notes: 'Knie gut gebeugt'
    });

    expect(session.toolType).toBe('slow-motion');
    expect(session.sessionMetadata.sessionName).toBe('Weitsprung Analyse');
    expect(session.sessionMetadata.studentLabel).toBe('Max Muster');
    expect(session.sessionMetadata.exerciseName).toBe('Absprung');
    expect(session.sessionMetadata.videoDurationSec).toBe(12.5);
    expect(session.sessionMetadata.keyframes).toHaveLength(1);
    expect(session.sessionMetadata.keyframes[0].markers).toHaveLength(2);
    expect(session.sessionMetadata.notes).toBe('Knie gut gebeugt');
  });

  it('trims whitespace from session name', async () => {
    const session = await useCase.execute({ sessionName: '  Sprint  ', keyframes: [] });
    expect(session.sessionMetadata.sessionName).toBe('Sprint');
  });

  it('persists reference lines', async () => {
    const session = await useCase.execute({
      sessionName: 'Mit Referenzlinie',
      keyframes: [],
      referenceLines: [{ id: 'rl-1', x1: 0, y1: 0.5, x2: 1, y2: 0.5, color: '#00bcd4' }]
    });

    expect(session.sessionMetadata.referenceLines).toHaveLength(1);
    expect(session.sessionMetadata.referenceLines![0].x2).toBe(1);
  });

  it('updates an existing session', async () => {
    const created = await useCase.execute({ sessionName: 'Test', keyframes: [] });

    const updated = await useCase.execute({
      sessionId: created.id,
      sessionName: 'Test aktualisiert',
      keyframes: [{ id: 'kf-2', timeSec: 2.5, markers: [] }]
    });

    expect(updated.id).toBe(created.id);
    expect(updated.sessionMetadata.sessionName).toBe('Test aktualisiert');
    expect(updated.sessionMetadata.keyframes).toHaveLength(1);

    // Only one session should exist in DB
    const all = await repository.findByToolType('slow-motion');
    expect(all).toHaveLength(1);
  });

  it('stores sessions retrievable by toolType', async () => {
    await useCase.execute({ sessionName: 'A', keyframes: [] });
    await useCase.execute({ sessionName: 'B', keyframes: [] });

    const sessions = await repository.findByToolType('slow-motion');
    expect(sessions).toHaveLength(2);
  });
});
