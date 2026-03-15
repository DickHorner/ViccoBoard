/**
 * TournamentService Tests
 * Verifies round-robin scheduling, knockout bracket generation, and standings.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { TournamentService } from '../src/services/tournament.service';
import type { Sport } from '@viccoboard/core';

const makeTeams = (names: string[]): Sport.Team[] =>
  names.map((name, i) => ({ id: `t${i + 1}`, name, studentIds: [] }));

describe('TournamentService', () => {
  let service: TournamentService;

  beforeEach(() => {
    service = new TournamentService();
  });

  // -------------------------------------------------------------------------
  // Round-robin scheduling
  // -------------------------------------------------------------------------
  describe('generateRoundRobinSchedule', () => {
    it('should throw for fewer than 2 teams', () => {
      expect(() =>
        service.generateRoundRobinSchedule('t1', makeTeams(['A']))
      ).toThrow('Round-robin requires at least 2 teams');
    });

    it('should generate n*(n-1)/2 matches for n teams', () => {
      const teams = makeTeams(['A', 'B', 'C', 'D']);
      const matches = service.generateRoundRobinSchedule('tour-1', teams);
      // 4 teams → 4*3/2 = 6 matches
      expect(matches).toHaveLength(6);
    });

    it('should generate correct round count for even number of teams', () => {
      const teams = makeTeams(['A', 'B', 'C', 'D']);
      const matches = service.generateRoundRobinSchedule('tour-1', teams);
      const rounds = new Set(matches.map(m => m.round));
      // n-1 rounds for n teams
      expect(rounds.size).toBe(3);
    });

    it('should have each team appear exactly once per round', () => {
      const teams = makeTeams(['A', 'B', 'C', 'D']);
      const matches = service.generateRoundRobinSchedule('tour-1', teams);
      for (let round = 1; round <= 3; round++) {
        const roundMatches = matches.filter(m => m.round === round);
        const teamIds = new Set<string>();
        for (const m of roundMatches) {
          expect(teamIds.has(m.team1Id)).toBe(false);
          expect(teamIds.has(m.team2Id)).toBe(false);
          teamIds.add(m.team1Id);
          teamIds.add(m.team2Id);
        }
      }
    });

    it('should cover all unique pairings exactly once', () => {
      const teams = makeTeams(['A', 'B', 'C', 'D']);
      const matches = service.generateRoundRobinSchedule('tour-1', teams);
      const pairings = new Set<string>();
      for (const m of matches) {
        const key = [m.team1Id, m.team2Id].sort().join('-');
        expect(pairings.has(key)).toBe(false);
        pairings.add(key);
      }
      // All 6 unique pairings covered
      expect(pairings.size).toBe(6);
    });

    it('should handle odd number of teams with byes', () => {
      const teams = makeTeams(['A', 'B', 'C']);
      const matches = service.generateRoundRobinSchedule('tour-1', teams);
      // 3 teams → 3 matches
      expect(matches).toHaveLength(3);
    });

    it('should set all matches to scheduled status', () => {
      const teams = makeTeams(['A', 'B']);
      const matches = service.generateRoundRobinSchedule('tour-1', teams);
      expect(matches.every(m => m.status === 'scheduled')).toBe(true);
    });

    it('should attach correct tournamentId to all matches', () => {
      const teams = makeTeams(['A', 'B', 'C']);
      const matches = service.generateRoundRobinSchedule('my-tour', teams);
      expect(matches.every(m => m.tournamentId === 'my-tour')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Knockout bracket
  // -------------------------------------------------------------------------
  describe('generateKnockoutBracket', () => {
    it('should throw for fewer than 2 teams', () => {
      expect(() =>
        service.generateKnockoutBracket('t1', makeTeams(['A']))
      ).toThrow('Knockout requires at least 2 teams');
    });

    it('should generate final match for 2 teams', () => {
      const teams = makeTeams(['A', 'B']);
      const matches = service.generateKnockoutBracket('tour-1', teams);
      expect(matches.filter(m => m.round === 1)).toHaveLength(1);
    });

    it('should generate QF + SF + Final for 8 teams', () => {
      const teams = makeTeams(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
      const matches = service.generateKnockoutBracket('tour-1', teams);
      const r1 = matches.filter(m => m.round === 1);
      const r2 = matches.filter(m => m.round === 2);
      const r3 = matches.filter(m => m.round === 3);
      expect(r1).toHaveLength(4);
      expect(r2).toHaveLength(2);
      expect(r3).toHaveLength(1);
    });

    it('should pad to next power of two when teams is not power-of-2', () => {
      const teams = makeTeams(['A', 'B', 'C']); // padded to 4 slots
      const matches = service.generateKnockoutBracket('tour-1', teams);
      // 4 slots → 1 QF round + 1 Final = 3 matches total (1+1 R1 + 1 Final)
      const r1 = matches.filter(m => m.round === 1);
      expect(r1).toHaveLength(2);
    });
  });

  // -------------------------------------------------------------------------
  // Round-robin standings
  // -------------------------------------------------------------------------
  describe('computeRoundRobinStandings', () => {
    it('should return all teams even with no completed matches', () => {
      const teams = makeTeams(['A', 'B', 'C']);
      const standings = service.computeRoundRobinStandings(teams, []);
      expect(standings).toHaveLength(3);
      expect(standings.every(s => s.points === 0)).toBe(true);
    });

    it('should award 3 points for a win', () => {
      const teams = makeTeams(['A', 'B']);
      const match: Sport.Match = {
        id: 'm1',
        tournamentId: 't1',
        team1Id: 't1',
        team2Id: 't2',
        score1: 2,
        score2: 0,
        round: 1,
        sequence: 1,
        status: 'completed'
      };
      const standings = service.computeRoundRobinStandings(teams, [match]);
      const a = standings.find(s => s.teamId === 't1')!;
      const b = standings.find(s => s.teamId === 't2')!;
      expect(a.points).toBe(3);
      expect(a.wins).toBe(1);
      expect(b.points).toBe(0);
      expect(b.losses).toBe(1);
    });

    it('should award 1 point each for a draw', () => {
      const teams = makeTeams(['A', 'B']);
      const match: Sport.Match = {
        id: 'm1',
        tournamentId: 't1',
        team1Id: 't1',
        team2Id: 't2',
        score1: 1,
        score2: 1,
        round: 1,
        sequence: 1,
        status: 'completed'
      };
      const standings = service.computeRoundRobinStandings(teams, [match]);
      expect(standings.every(s => s.points === 1 && s.draws === 1)).toBe(true);
    });

    it('should sort by points then goal difference then goals for', () => {
      const teams = makeTeams(['A', 'B', 'C']);
      const matches: Sport.Match[] = [
        {
          id: 'm1', tournamentId: 't1', team1Id: 't1', team2Id: 't2',
          score1: 3, score2: 0, round: 1, sequence: 1, status: 'completed'
        },
        {
          id: 'm2', tournamentId: 't1', team1Id: 't1', team2Id: 't3',
          score1: 2, score2: 1, round: 2, sequence: 1, status: 'completed'
        },
        {
          id: 'm3', tournamentId: 't1', team1Id: 't2', team2Id: 't3',
          score1: 0, score2: 0, round: 3, sequence: 1, status: 'completed'
        }
      ];
      const standings = service.computeRoundRobinStandings(teams, matches);
      expect(standings[0].teamId).toBe('t1'); // 6 pts
      expect(standings[1].teamId).toBe('t3'); // 1 pt, +0 GD
      expect(standings[2].teamId).toBe('t2'); // 1 pt, -3 GD
    });

    it('should ignore scheduled matches', () => {
      const teams = makeTeams(['A', 'B']);
      const match: Sport.Match = {
        id: 'm1',
        tournamentId: 't1',
        team1Id: 't1',
        team2Id: 't2',
        round: 1,
        sequence: 1,
        status: 'scheduled'
      };
      const standings = service.computeRoundRobinStandings(teams, [match]);
      expect(standings.every(s => s.points === 0)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Knockout winner advancement
  // -------------------------------------------------------------------------
  describe('advanceKnockoutWinner', () => {
    it('should not modify matches when the match is not completed', () => {
      const teams = makeTeams(['A', 'B', 'C', 'D']);
      const matches = service.generateKnockoutBracket('tour-1', teams);
      const scheduledMatch = matches.find(m => m.round === 1 && m.sequence === 1)!;
      const result = service.advanceKnockoutWinner(matches, scheduledMatch);
      expect(result).toEqual(matches);
    });

    it('should set winner as team1 in next round if sequence is odd', () => {
      const teams = makeTeams(['A', 'B', 'C', 'D']);
      let matches = service.generateKnockoutBracket('tour-1', teams);
      // Complete match R1 S1 → team t1 wins
      const m = matches.find(m => m.round === 1 && m.sequence === 1)!;
      const completed: Sport.Match = {
        ...m,
        score1: 3,
        score2: 1,
        status: 'completed'
      };
      matches = service.advanceKnockoutWinner(
        matches.map(x => (x.id === completed.id ? completed : x)),
        completed
      );
      const next = matches.find(m => m.round === 2 && m.sequence === 1)!;
      expect(next.team1Id).toBe(completed.team1Id); // winner fills slot 1
    });
  });

  // -------------------------------------------------------------------------
  // Tournament completion
  // -------------------------------------------------------------------------
  describe('isTournamentComplete', () => {
    it('should return false for empty match list', () => {
      expect(service.isTournamentComplete([])).toBe(false);
    });

    it('should return false if any match is not completed', () => {
      const teams = makeTeams(['A', 'B']);
      const matches = service.generateRoundRobinSchedule('t', teams);
      expect(service.isTournamentComplete(matches)).toBe(false);
    });

    it('should return true when all matches are completed', () => {
      const teams = makeTeams(['A', 'B']);
      const matches = service.generateRoundRobinSchedule('t', teams);
      const done = matches.map(m => ({ ...m, status: 'completed' as const }));
      expect(service.isTournamentComplete(done)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Scoreboard result mapping
  // -------------------------------------------------------------------------
  describe('mapScoreboardResultToMatch', () => {
    const makeMatch = (team1Id: string, team2Id: string): Sport.Match => ({
      id: 'm1',
      tournamentId: 't1',
      team1Id,
      team2Id,
      round: 1,
      sequence: 1,
      status: 'scheduled'
    });

    it('should map scores by team name when names match exactly', () => {
      const teams = makeTeams(['Alpha', 'Beta']);
      const match = makeMatch('t1', 't2');
      const result = service.mapScoreboardResultToMatch(teams, match, {
        teams: [
          { id: 'sb-a', name: 'Alpha' },
          { id: 'sb-b', name: 'Beta' }
        ],
        scores: { 'sb-a': 3, 'sb-b': 1 }
      });
      expect(result.score1).toBe(3);
      expect(result.score2).toBe(1);
    });

    it('should match names case-insensitively', () => {
      const teams = makeTeams(['alpha', 'BETA']);
      const match = makeMatch('t1', 't2');
      const result = service.mapScoreboardResultToMatch(teams, match, {
        teams: [
          { id: 'sb-a', name: 'ALPHA' },
          { id: 'sb-b', name: 'beta' }
        ],
        scores: { 'sb-a': 5, 'sb-b': 2 }
      });
      expect(result.score1).toBe(5);
      expect(result.score2).toBe(2);
    });

    it('should use positional fallback when names do not match', () => {
      const teams = makeTeams(['Gamma', 'Delta']);
      const match = makeMatch('t1', 't2');
      const result = service.mapScoreboardResultToMatch(teams, match, {
        teams: [
          { id: 'sb-x', name: 'Unrelated' },
          { id: 'sb-y', name: 'Other' }
        ],
        scores: { 'sb-x': 4, 'sb-y': 0 }
      });
      // Positional: first scoreboard team → score1
      expect(result.score1).toBe(4);
      expect(result.score2).toBe(0);
    });

    it('should fall back to positional when only one name matches', () => {
      const teams = makeTeams(['Alpha', 'Delta']);
      const match = makeMatch('t1', 't2');
      const result = service.mapScoreboardResultToMatch(teams, match, {
        teams: [
          { id: 'sb-a', name: 'Alpha' }, // matches team1
          { id: 'sb-b', name: 'NoMatch' }
        ],
        scores: { 'sb-a': 3, 'sb-b': 2 }
      });
      // Partial match → positional fallback
      expect(result.score1).toBe(3);
      expect(result.score2).toBe(2);
    });

    it('should return zeros when the scoreboard has no teams', () => {
      const teams = makeTeams(['A', 'B']);
      const match = makeMatch('t1', 't2');
      const result = service.mapScoreboardResultToMatch(teams, match, {
        teams: [],
        scores: {}
      });
      expect(result.score1).toBe(0);
      expect(result.score2).toBe(0);
    });

    it('should return zeros for missing score entries', () => {
      const teams = makeTeams(['A', 'B']);
      const match = makeMatch('t1', 't2');
      const result = service.mapScoreboardResultToMatch(teams, match, {
        teams: [{ id: 'sb-a', name: 'A' }, { id: 'sb-b', name: 'B' }],
        scores: {} // scores missing
      });
      expect(result.score1).toBe(0);
      expect(result.score2).toBe(0);
    });
  });
});
