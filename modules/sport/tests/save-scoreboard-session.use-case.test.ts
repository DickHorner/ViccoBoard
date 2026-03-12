import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import {
  GradingSchemaMigration,
  InitialSchemaMigration,
  SQLiteStorage,
  ToolSessionsSchemaMigration,
  type StorageAdapter
} from '@viccoboard/storage/node';
import { ToolSessionRepository } from '../src/repositories/tool-session.repository';
import { SaveScoreboardSessionUseCase } from '../src/use-cases/save-scoreboard-session.use-case';

describe('SaveScoreboardSessionUseCase', () => {
  let storage: SQLiteStorage;
  let adapter: StorageAdapter;
  let repository: ToolSessionRepository;
  let useCase: SaveScoreboardSessionUseCase;

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
    await storage.close();
  });

  it('rejects a blank session name', async () => {
    await expect(
      useCase.execute({
        sessionName: '   ',
        teams: [
          { id: 'team-a', name: 'A' },
          { id: 'team-b', name: 'B' }
        ],
        scores: { 'team-a': 0, 'team-b': 0 },
        history: []
      })
    ).rejects.toThrow('sessionName is required');
  });

  it('rejects sessions with fewer than two teams', async () => {
    await expect(
      useCase.execute({
        sessionName: 'Only one team',
        teams: [{ id: 'team-a', name: 'A' }],
        scores: { 'team-a': 0 },
        history: []
      })
    ).rejects.toThrow('at least 2 teams are required');
  });

  it('persists scoreboard sessions with event log and links', async () => {
    const session = await useCase.execute({
      sessionName: 'Volleyball Finale',
      teams: [
        { id: 'team-a', name: 'Wolves' },
        { id: 'team-b', name: 'Hawks' }
      ],
      scores: { 'team-a': 3, 'team-b': 1 },
      history: [
        { teamId: 'team-a', points: 1, type: 'add', description: 'Serve point' },
        { teamId: 'team-b', points: 1, type: 'add', description: 'Equalizer' }
      ],
      linkedTeamSessionId: 'teams-1',
      linkedTimerSessionId: 'timer-1'
    });

    expect(session.toolType).toBe('scoreboard');
    expect(session.sessionMetadata.sessionName).toBe('Volleyball Finale');
    expect(session.sessionMetadata.linkedTeamSessionId).toBe('teams-1');
    expect(session.sessionMetadata.linkedTimerSessionId).toBe('timer-1');
    expect(session.sessionMetadata.history).toHaveLength(2);
    expect(session.sessionMetadata.history[0].timestamp).toEqual(expect.any(String));
  });

  it('preserves existing history timestamps on update', async () => {
    const created = await useCase.execute({
      sessionName: 'Matchday',
      teams: [
        { id: 'team-a', name: 'A' },
        { id: 'team-b', name: 'B' }
      ],
      scores: { 'team-a': 1, 'team-b': 0 },
      history: [
        {
          teamId: 'team-a',
          points: 1,
          type: 'add',
          timestamp: '2026-03-12T12:00:00.000Z'
        }
      ]
    });

    const updated = await useCase.execute({
      sessionId: created.id,
      sessionName: 'Matchday',
      teams: [
        { id: 'team-a', name: 'A' },
        { id: 'team-b', name: 'B' }
      ],
      scores: { 'team-a': 2, 'team-b': 0 },
      history: [
        {
          teamId: 'team-a',
          points: 1,
          type: 'add',
          timestamp: '2026-03-12T12:00:00.000Z'
        },
        {
          teamId: 'team-a',
          points: 1,
          type: 'add'
        }
      ]
    });

    expect(updated.id).toBe(created.id);
    expect(updated.sessionMetadata.history[0].timestamp).toBe('2026-03-12T12:00:00.000Z');
    expect(updated.sessionMetadata.history[1].timestamp).toEqual(expect.any(String));
    expect((await repository.findByToolType('scoreboard'))).toHaveLength(1);
  });
});
