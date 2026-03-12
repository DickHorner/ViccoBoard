/**
 * SaveTournamentUseCase Tests
 * Verifies tournament persistence via ToolSessionRepository.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SaveTournamentUseCase } from '../src/use-cases/save-tournament.use-case';
import { ToolSessionRepository } from '../src/repositories/tool-session.repository';
import { SQLiteStorage } from '@viccoboard/storage/node';
import { InitialSchemaMigration, GradingSchemaMigration, ToolSessionsSchemaMigration } from '@viccoboard/storage/node';
import type { StorageAdapter } from '@viccoboard/storage/node';
import type { TournamentData } from '../src/use-cases/save-tournament.use-case';

const makeTournament = (overrides: Partial<TournamentData> = {}): TournamentData => ({
  id: 'tournament-1',
  name: 'Class Cup',
  type: 'round-robin',
  teams: [
    { id: 'team-1', name: 'Wolves' },
    { id: 'team-2', name: 'Hawks' },
    { id: 'team-3', name: 'Eagles' }
  ],
  matches: [
    { id: 'm1', round: 1, team1Id: 'team-1', team2Id: 'team-2', status: 'scheduled' },
    { id: 'm2', round: 1, team1Id: 'team-1', team2Id: 'team-3', status: 'scheduled' },
    { id: 'm3', round: 2, team1Id: 'team-2', team2Id: 'team-3', status: 'scheduled' }
  ],
  status: 'in-progress',
  ...overrides
});

describe('SaveTournamentUseCase', () => {
  let storage: SQLiteStorage;
  let repository: ToolSessionRepository;
  let useCase: SaveTournamentUseCase;
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
    useCase = new SaveTournamentUseCase(repository);
  });

  afterEach(async () => {
    if (storage) await storage.close();
  });

  describe('validation', () => {
    it('should throw when tournament name is blank', async () => {
      await expect(
        useCase.execute({ tournament: makeTournament({ name: '   ' }) })
      ).rejects.toThrow('tournament name is required');
    });

    it('should throw when fewer than 2 teams', async () => {
      await expect(
        useCase.execute({ tournament: makeTournament({ teams: [{ id: 'team-1', name: 'Only One' }] }) })
      ).rejects.toThrow('at least 2 teams are required');
    });

    it('should throw when type is invalid', async () => {
      await expect(
        useCase.execute({ tournament: makeTournament({ type: 'invalid' as any }) })
      ).rejects.toThrow('tournament type must be one of: knockout, round-robin');
    });
  });

  describe('persistence', () => {
    it('should persist with toolType "tournament"', async () => {
      const result = await useCase.execute({ tournament: makeTournament() });

      expect(result.toolType).toBe('tournament');
      expect(result.sessionMetadata.tournament.name).toBe('Class Cup');
      expect(result.sessionMetadata.tournament.type).toBe('round-robin');
      expect(result.sessionMetadata.tournament.teams).toHaveLength(3);
      expect(result.sessionMetadata.tournament.matches).toHaveLength(3);
    });

    it('should be retrievable via findByToolType', async () => {
      await useCase.execute({ tournament: makeTournament() });

      const sessions = await repository.findByToolType('tournament');
      expect(sessions).toHaveLength(1);
      expect(sessions[0].sessionMetadata.tournament.name).toBe('Class Cup');
    });

    it('should update an existing session when sessionId is provided', async () => {
      const initial = await useCase.execute({ tournament: makeTournament({ status: 'planning' }) });

      const updated = await useCase.execute({
        sessionId: initial.id,
        tournament: makeTournament({ status: 'completed' })
      });

      expect(updated.id).toBe(initial.id);
      expect(updated.sessionMetadata.tournament.status).toBe('completed');
      const sessions = await repository.findByToolType('tournament');
      expect(sessions).toHaveLength(1);
    });

    it('should support knockout format', async () => {
      const result = await useCase.execute({
        tournament: makeTournament({ type: 'knockout' })
      });
      expect(result.sessionMetadata.tournament.type).toBe('knockout');
    });

    it('should persist match results', async () => {
      const t = makeTournament();
      t.matches[0].score1 = 3;
      t.matches[0].score2 = 1;
      t.matches[0].status = 'completed';

      const result = await useCase.execute({ tournament: t });
      expect(result.sessionMetadata.tournament.matches[0].score1).toBe(3);
      expect(result.sessionMetadata.tournament.matches[0].score2).toBe(1);
      expect(result.sessionMetadata.tournament.matches[0].status).toBe('completed');
    });
  });
});
