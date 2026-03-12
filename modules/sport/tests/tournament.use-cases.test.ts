/**
 * CreateTournamentUseCase + UpdateTournamentMatchUseCase Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { CreateTournamentUseCase } from '../src/use-cases/create-tournament.use-case';
import { UpdateTournamentMatchUseCase } from '../src/use-cases/update-tournament-match.use-case';
import { TournamentRepository } from '../src/repositories/tournament.repository';
import { TournamentService } from '../src/services/tournament.service';
import { SQLiteStorage, InitialSchemaMigration, GradingSchemaMigration, TournamentSchemaMigration } from '@viccoboard/storage/node';
import type { StorageAdapter } from '@viccoboard/storage/node';

const TEAM_A = { id: 'team-a', name: 'Team A', studentIds: [] };
const TEAM_B = { id: 'team-b', name: 'Team B', studentIds: [] };
const TEAM_C = { id: 'team-c', name: 'Team C', studentIds: [] };
const TEAM_D = { id: 'team-d', name: 'Team D', studentIds: [] };

const DEFAULT_CLASS_ID = 'class-default';

const createClassGroup = async (adapter: StorageAdapter, id = DEFAULT_CLASS_ID) => {
  const now = new Date().toISOString();
  await adapter.insert('class_groups', {
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

describe('CreateTournamentUseCase', () => {
  let storage: SQLiteStorage;
  let adapter: StorageAdapter;
  let repository: TournamentRepository;
  let service: TournamentService;
  let useCase: CreateTournamentUseCase;

  beforeEach(async () => {
    storage = new SQLiteStorage({ databasePath: ':memory:', memory: true });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    storage.registerMigration(new GradingSchemaMigration(storage));
    storage.registerMigration(new TournamentSchemaMigration(storage));
    await storage.migrate();

    adapter = storage.getAdapter();
    repository = new TournamentRepository(adapter);
    service = new TournamentService();
    useCase = new CreateTournamentUseCase(repository, service);
    await createClassGroup(adapter);
  });

  afterEach(async () => {
    if (storage) await storage.close();
  });

  describe('validation', () => {
    it('should throw when classGroupId is empty', async () => {
      await expect(
        useCase.execute({ classGroupId: '', name: 'Test', type: 'round-robin', teams: [TEAM_A, TEAM_B] })
      ).rejects.toThrow('classGroupId is required');
    });

    it('should throw when name is empty', async () => {
      await expect(
        useCase.execute({ classGroupId: 'c1', name: '', type: 'round-robin', teams: [TEAM_A, TEAM_B] })
      ).rejects.toThrow('Tournament name is required');
    });

    it('should throw for invalid type', async () => {
      await expect(
        useCase.execute({ classGroupId: 'c1', name: 'T', type: 'swiss' as any, teams: [TEAM_A, TEAM_B] })
      ).rejects.toThrow('type must be one of');
    });

    it('should throw when fewer than 2 teams', async () => {
      await expect(
        useCase.execute({ classGroupId: 'c1', name: 'T', type: 'round-robin', teams: [TEAM_A] })
      ).rejects.toThrow('At least 2 teams');
    });
  });

  describe('round-robin creation', () => {
    it('should create a persisted round-robin tournament', async () => {
      const tournament = await useCase.execute({
        classGroupId: DEFAULT_CLASS_ID,
        name: 'Volleyball RR',
        type: 'round-robin',
        teams: [TEAM_A, TEAM_B, TEAM_C, TEAM_D]
      });

      expect(tournament.name).toBe('Volleyball RR');
      expect(tournament.type).toBe('round-robin');
      expect(tournament.status).toBe('planning');
      // 4 teams → 6 round-robin matches
      expect(tournament.matches).toHaveLength(6);
      expect(tournament.teams).toHaveLength(4);
    });

    it('should persist and be retrievable by id', async () => {
      const created = await useCase.execute({
        classGroupId: DEFAULT_CLASS_ID,
        name: 'Test RR',
        type: 'round-robin',
        teams: [TEAM_A, TEAM_B]
      });

      const loaded = await repository.findById(created.id);
      expect(loaded).not.toBeNull();
      expect(loaded!.name).toBe('Test RR');
      expect(loaded!.matches).toHaveLength(1);
    });

    it('should have all matches referencing the tournament id', async () => {
      const tournament = await useCase.execute({
        classGroupId: DEFAULT_CLASS_ID,
        name: 'ID Check',
        type: 'round-robin',
        teams: [TEAM_A, TEAM_B, TEAM_C]
      });

      expect(tournament.matches.every(m => m.tournamentId === tournament.id)).toBe(true);
    });
  });

  describe('knockout creation', () => {
    it('should create a persisted knockout tournament', async () => {
      const tournament = await useCase.execute({
        classGroupId: DEFAULT_CLASS_ID,
        name: 'Cup',
        type: 'knockout',
        teams: [TEAM_A, TEAM_B, TEAM_C, TEAM_D]
      });

      expect(tournament.type).toBe('knockout');
      // 4 teams → 2 SF + 1 Final = 3 matches
      expect(tournament.matches).toHaveLength(3);
    });
  });
});

describe('UpdateTournamentMatchUseCase', () => {
  let storage: SQLiteStorage;
  let adapter: StorageAdapter;
  let repository: TournamentRepository;
  let service: TournamentService;
  let createUseCase: CreateTournamentUseCase;
  let updateUseCase: UpdateTournamentMatchUseCase;

  beforeEach(async () => {
    storage = new SQLiteStorage({ databasePath: ':memory:', memory: true });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    storage.registerMigration(new GradingSchemaMigration(storage));
    storage.registerMigration(new TournamentSchemaMigration(storage));
    await storage.migrate();

    adapter = storage.getAdapter();
    repository = new TournamentRepository(adapter);
    service = new TournamentService();
    createUseCase = new CreateTournamentUseCase(repository, service);
    updateUseCase = new UpdateTournamentMatchUseCase(repository, service);
    await createClassGroup(adapter);
  });

  afterEach(async () => {
    if (storage) await storage.close();
  });

  describe('validation', () => {
    it('should throw when tournamentId is empty', async () => {
      await expect(
        updateUseCase.execute({ tournamentId: '', matchId: 'm1', score1: 1, score2: 0 })
      ).rejects.toThrow('tournamentId is required');
    });

    it('should throw when matchId is empty', async () => {
      await expect(
        updateUseCase.execute({ tournamentId: 't1', matchId: '', score1: 1, score2: 0 })
      ).rejects.toThrow('matchId is required');
    });

    it('should throw for negative scores', async () => {
      const t = await createUseCase.execute({
        classGroupId: DEFAULT_CLASS_ID,
        name: 'T',
        type: 'round-robin',
        teams: [TEAM_A, TEAM_B]
      });
      await expect(
        updateUseCase.execute({ tournamentId: t.id, matchId: t.matches[0].id, score1: -1, score2: 0 })
      ).rejects.toThrow('non-negative');
    });

    it('should throw when tournament not found', async () => {
      await expect(
        updateUseCase.execute({ tournamentId: 'ghost', matchId: 'm1', score1: 1, score2: 0 })
      ).rejects.toThrow('not found');
    });

    it('should throw for a draw in a knockout tournament', async () => {
      const t = await createUseCase.execute({
        classGroupId: DEFAULT_CLASS_ID,
        name: 'KO Draw',
        type: 'knockout',
        teams: [TEAM_A, TEAM_B]
      });
      const firstMatch = t.matches.find(m => m.team1Id && m.team2Id && m.round === 1)!;
      await expect(
        updateUseCase.execute({ tournamentId: t.id, matchId: firstMatch.id, score1: 1, score2: 1 })
      ).rejects.toThrow('Knockout matches must have a winner');
    });
  });

  describe('round-robin match update', () => {
    it('should mark match as completed and update status to in-progress', async () => {
      const tournament = await createUseCase.execute({
        classGroupId: DEFAULT_CLASS_ID,
        name: 'RR Update',
        type: 'round-robin',
        teams: [TEAM_A, TEAM_B, TEAM_C]
      });

      const matchToUpdate = tournament.matches[0];
      const updated = await updateUseCase.execute({
        tournamentId: tournament.id,
        matchId: matchToUpdate.id,
        score1: 2,
        score2: 1
      });

      const updatedMatch = updated.matches.find(m => m.id === matchToUpdate.id)!;
      expect(updatedMatch.status).toBe('completed');
      expect(updatedMatch.score1).toBe(2);
      expect(updatedMatch.score2).toBe(1);
      expect(updated.status).toBe('in-progress');
    });

    it('should mark tournament as completed when all matches done', async () => {
      const tournament = await createUseCase.execute({
        classGroupId: DEFAULT_CLASS_ID,
        name: 'Finish',
        type: 'round-robin',
        teams: [TEAM_A, TEAM_B]
      });

      // Only 1 match for 2 teams
      const updated = await updateUseCase.execute({
        tournamentId: tournament.id,
        matchId: tournament.matches[0].id,
        score1: 1,
        score2: 0
      });

      expect(updated.status).toBe('completed');
    });

    it('should persist result across reload', async () => {
      const tournament = await createUseCase.execute({
        classGroupId: DEFAULT_CLASS_ID,
        name: 'Persist',
        type: 'round-robin',
        teams: [TEAM_A, TEAM_B]
      });

      await updateUseCase.execute({
        tournamentId: tournament.id,
        matchId: tournament.matches[0].id,
        score1: 3,
        score2: 2
      });

      const reloaded = await repository.findById(tournament.id);
      expect(reloaded!.matches[0].score1).toBe(3);
      expect(reloaded!.matches[0].score2).toBe(2);
    });
  });

  describe('knockout winner advancement', () => {
    it('should advance winner to next round after R1 match', async () => {
      const tournament = await createUseCase.execute({
        classGroupId: DEFAULT_CLASS_ID,
        name: 'Knockout Test',
        type: 'knockout',
        teams: [TEAM_A, TEAM_B, TEAM_C, TEAM_D]
      });

      const r1m1 = tournament.matches.find(m => m.round === 1 && m.sequence === 1)!;
      const updated = await updateUseCase.execute({
        tournamentId: tournament.id,
        matchId: r1m1.id,
        score1: 2,
        score2: 0
      });

      // Winner (team1Id of r1m1) should be in the semifinal
      const sf = updated.matches.find(m => m.round === 2 && m.sequence === 1)!;
      expect(sf.team1Id).toBe(r1m1.team1Id);
    });
  });
});
