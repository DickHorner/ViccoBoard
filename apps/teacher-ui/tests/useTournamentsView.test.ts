const mockFindTournaments = jest.fn().mockResolvedValue([]);
const mockFindToolSessions = jest.fn().mockResolvedValue([]);
const mockCreateTournament = jest.fn();

jest.mock('vue', () => {
  const actual = jest.requireActual('vue');
  return {
    ...actual,
    onMounted: (callback: () => void | Promise<void>) => {
      void callback();
    }
  };
});

jest.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key
  })
}));

jest.mock('@viccoboard/sport', () => ({
  TournamentService: class TournamentService {
    computeAdaptiveStandings() { return []; }

    computeRoundRobinStandings() {
      return [];
    }

    buildKnockoutBracket() {
      return { rounds: [] };
    }

    mapScoreboardResultToMatch(
      teams: Array<{ id: string; name: string }>,
      match: { team1Id: string; team2Id: string },
      scoreboard: {
        teams: Array<{ id: string; name: string }>;
        scores: Record<string, number>;
      }
    ) {
      const resolveScore = (teamId: string, fallbackIndex: number) => {
        const tournamentTeam = teams.find(team => team.id === teamId);
        const direct = scoreboard.teams.find(team =>
          tournamentTeam && team.name.toLowerCase() === tournamentTeam.name.toLowerCase()
        );
        const fallback = scoreboard.teams[fallbackIndex];
        const source = direct ?? fallback;
        return source ? scoreboard.scores[source.id] ?? 0 : 0;
      };

      return {
        score1: resolveScore(match.team1Id, 0),
        score2: resolveScore(match.team2Id, 1)
      };
    }
  }
}), { virtual: true });

jest.mock('../src/composables/useSportBridge', () => ({
  getSportBridge: () => ({
    tournamentRepository: {
      findAll: mockFindTournaments
    },
    toolSessionRepository: {
      findAll: mockFindToolSessions,
      findByClassGroup: jest.fn().mockResolvedValue([])
    },
    classGroupRepository: { findAll: jest.fn().mockResolvedValue([]) },
    drawAdaptiveRoundUseCase: { execute: jest.fn(), cancelMatch: jest.fn() },
    createTournamentUseCase: {
      execute: mockCreateTournament
    },
    updateTournamentMatchUseCase: {
      execute: jest.fn()
    }
  })
}));

jest.mock('../src/composables/useStudentsBridge', () => ({
  initializeStudentsBridge: jest.fn(),
  getStudentsBridge: () => ({ studentRepository: { findByClassGroup: jest.fn().mockResolvedValue([]) } })
}));

import { useTournamentsView } from '../src/composables/useTournamentsView';

describe('useTournamentsView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    mockCreateTournament.mockReset();
  });

  it('opens the create flow from scoreboard handoff data and clears the session payload', async () => {
    sessionStorage.setItem('scoreboard_handoff_teams', JSON.stringify(['Lions', 'Tigers', 'Bears']));

    const view = useTournamentsView();

    await Promise.resolve();

    expect(view.view.value).toBe('create');
    expect(view.form.value).toEqual({
      name: '',
      type: 'round-robin',
      teams: ['Lions', 'Tigers', 'Bears'],
      teamSize: 1
    });
    expect(sessionStorage.getItem('scoreboard_handoff_teams')).toBeNull();
  });

  it('preserves fixed teams, their students and the class when creating a round-robin tournament', async () => {
    const handoff = {
      classGroupId: 'class-1',
      teams: [
        { id: 'team-a', name: 'Red', studentIds: ['s1', 's2'] },
        { id: 'team-b', name: 'Blue', studentIds: ['s3', 's4'] }
      ]
    };
    sessionStorage.setItem('team_builder_handoff', JSON.stringify(handoff));
    mockCreateTournament.mockResolvedValue({
      id: 'created',
      classGroupId: handoff.classGroupId,
      name: 'Cup',
      type: 'round-robin',
      teams: handoff.teams,
      matches: [],
      status: 'planning'
    });

    const view = useTournamentsView();
    expect(view.view.value).toBe('create');
    expect(view.form.value.teams).toEqual(['Red', 'Blue']);
    expect(view.importedTeamHandoff.value).toEqual(handoff);
    expect(sessionStorage.getItem('team_builder_handoff')).toBeNull();

    view.form.value.name = 'Cup';
    await view.submitCreate();

    expect(mockCreateTournament).toHaveBeenCalledWith(expect.objectContaining({
      classGroupId: 'class-1',
      name: 'Cup',
      type: 'round-robin',
      teams: handoff.teams
    }));
  });

  it('keeps team memberships when switching imported fixed teams to knockout', async () => {
    const handoff = {
      classGroupId: 'class-2',
      teams: [
        { id: 'team-a', name: 'A', studentIds: ['s1'] },
        { id: 'team-b', name: 'B', studentIds: ['s2'] }
      ]
    };
    sessionStorage.setItem('team_builder_handoff', JSON.stringify(handoff));
    mockCreateTournament.mockResolvedValue({
      id: 'created', classGroupId: handoff.classGroupId, type: 'knockout',
      teams: handoff.teams, matches: []
    });

    const view = useTournamentsView();
    view.form.value.name = 'Cup';
    view.form.value.type = 'knockout';
    await view.submitCreate();

    expect(mockCreateTournament).toHaveBeenCalledWith(expect.objectContaining({
      classGroupId: 'class-2',
      type: 'knockout',
      teams: handoff.teams
    }));
  });

  it('ignores a handoff that lists a student twice', () => {
    sessionStorage.setItem('team_builder_handoff', JSON.stringify({
      classGroupId: 'class-1',
      teams: [
        { id: 'a', name: 'A', studentIds: ['s1'] },
        { id: 'b', name: 'B', studentIds: ['s1'] }
      ]
    }));
    const view = useTournamentsView();
    expect(view.view.value).toBe('list');
    expect(view.importedTeamHandoff.value).toBeNull();
    expect(sessionStorage.getItem('team_builder_handoff')).toBeNull();
  });

  it('imports a scoreboard session into match result entry', async () => {
    const view = useTournamentsView();
    const tournament = {
      id: 'tournament-1',
      classGroupId: 'default',
      name: 'Volleyball Cup',
      type: 'round-robin',
      status: 'planning',
      teams: [
        { id: 'team-a', name: 'Lions', studentIds: [] },
        { id: 'team-b', name: 'Tigers', studentIds: [] }
      ],
      matches: [
        {
          id: 'match-1',
          tournamentId: 'tournament-1',
          round: 1,
          sequence: 1,
          team1Id: 'team-a',
          team2Id: 'team-b',
          status: 'pending',
          score1: 0,
          score2: 0
        }
      ]
    } as any;
    const scoreboardSession = {
      id: 'scoreboard-1',
      toolType: 'scoreboard',
      createdAt: new Date('2026-03-15T12:00:00Z'),
      sessionMetadata: {
        sessionName: 'Court 1',
        teams: [
          { id: 'sb-a', name: 'Lions' },
          { id: 'sb-b', name: 'Tigers' }
        ],
        scores: {
          'sb-a': 21,
          'sb-b': 18
        }
      }
    };

    mockFindToolSessions.mockResolvedValue([scoreboardSession]);

    view.activeTournament.value = tournament;
    await view.openScoreEntry(tournament.matches[0]);
    view.applyScoreboardSession('scoreboard-1');

    expect(view.scoreboardSessions.value).toEqual([scoreboardSession]);
    expect(view.scoreEntry.value.score1).toBe(21);
    expect(view.scoreEntry.value.score2).toBe(18);
    expect(view.scoreboardImportHint.value).toBe(true);
  });
});
