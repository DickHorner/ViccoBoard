/**
 * SaveScoreboardSessionUseCase Tests
 * Verifies scoreboard session persistence via ToolSessionRepository.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SaveScoreboardSessionUseCase } from '../src/use-cases/save-scoreboard-session.use-case';
import { ToolSessionRepository } from '../src/repositories/tool-session.repository';
import { SQLiteStorage } from '@viccoboard/storage/node';
import { InitialSchemaMigration, GradingSchemaMigration, ToolSessionsSchemaMigration } from '@viccoboard/storage/node';
import type { StorageAdapter } from '@viccoboard/storage/node';

describe('SaveScoreboardSessionUseCase', () => {
  let storage: SQLiteStorage;
  let repository: ToolSessionRepository;
  let useCase: SaveScoreboardSessionUseCase;
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
    useCase = new SaveScoreboardSessionUseCase(repository);
  });

  afterEach(async () => {
    if (storage) await storage.close();
  });

  describe('validation', () => {
    it('should throw when sessionName is blank', async () => {
      await expect(
        useCase.execute({
          sessionName: '   ',
          teams: [{ id: 'A', name: 'Team A' }, { id: 'B', name: 'Team B' }],
          scores: { A: 0, B: 0 },
          history: []
        })
      ).rejects.toThrow('sessionName is required');
    });

    it('should throw when fewer than 2 teams', async () => {
      await expect(
        useCase.execute({
          sessionName: 'Match',
          teams: [{ id: 'A', name: 'Team A' }],
          scores: { A: 0 },
          history: []
        })
      ).rejects.toThrow('at least 2 teams are required');
    });
  });

  describe('persistence', () => {
    it('should persist a scoreboard session with toolType "scoreboard"', async () => {
      const result = await useCase.execute({
        sessionName: 'Volleyball Final',
        teams: [{ id: 'A', name: 'Wolves' }, { id: 'B', name: 'Hawks' }],
        scores: { A: 3, B: 1 },
        history: [
          { teamId: 'A', points: 1, type: 'add' },
          { teamId: 'B', points: 1, type: 'add' },
          { teamId: 'A', points: 2, type: 'add' }
        ]
      });

      expect(result.toolType).toBe('scoreboard');
      expect(result.sessionMetadata.sessionName).toBe('Volleyball Final');
      expect(result.sessionMetadata.teams).toHaveLength(2);
      expect(result.sessionMetadata.scores.A).toBe(3);
      expect(result.sessionMetadata.scores.B).toBe(1);
      expect(result.sessionMetadata.history).toHaveLength(3);
    });

    it('should be retrievable via findByToolType', async () => {
      await useCase.execute({
        sessionName: 'Basketball',
        teams: [{ id: 'A', name: 'Team A' }, { id: 'B', name: 'Team B' }],
        scores: { A: 21, B: 18 },
        history: []
      });

      const sessions = await repository.findByToolType('scoreboard');
      expect(sessions).toHaveLength(1);
      expect(sessions[0].sessionMetadata.sessionName).toBe('Basketball');
    });

    it('should update an existing session when sessionId is provided', async () => {
      const initial = await useCase.execute({
        sessionName: 'Match 1',
        teams: [{ id: 'A', name: 'Team A' }, { id: 'B', name: 'Team B' }],
        scores: { A: 0, B: 0 },
        history: []
      });

      const updated = await useCase.execute({
        sessionId: initial.id,
        sessionName: 'Match 1',
        teams: [{ id: 'A', name: 'Team A' }, { id: 'B', name: 'Team B' }],
        scores: { A: 5, B: 3 },
        history: [{ teamId: 'A', points: 5, type: 'add' }, { teamId: 'B', points: 3, type: 'add' }]
      });

      expect(updated.id).toBe(initial.id);
      expect(updated.sessionMetadata.scores.A).toBe(5);
      const sessions = await repository.findByToolType('scoreboard');
      expect(sessions).toHaveLength(1);
    });

    it('should trim whitespace from sessionName', async () => {
      const result = await useCase.execute({
        sessionName: '  Final  ',
        teams: [{ id: 'A', name: 'A' }, { id: 'B', name: 'B' }],
        scores: {},
        history: []
      });
      expect(result.sessionMetadata.sessionName).toBe('Final');
    });
  });
});
