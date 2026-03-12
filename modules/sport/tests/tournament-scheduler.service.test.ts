/**
 * TournamentSchedulerService Tests
 * Verifies round-robin and knockout schedule generation, and standings computation.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { TournamentSchedulerService } from '../src/services/tournament-scheduler.service';
import type { TournamentTeam } from '../src/services/tournament-scheduler.service';

const makeTeams = (n: number): TournamentTeam[] =>
  Array.from({ length: n }, (_, i) => ({ id: `team-${i + 1}`, name: `Team ${i + 1}` }));

describe('TournamentSchedulerService', () => {
  let service: TournamentSchedulerService;

  beforeEach(() => {
    service = new TournamentSchedulerService();
  });

  // ---------------------------------------------------------------------------
  // Round Robin
  // ---------------------------------------------------------------------------
  describe('generateRoundRobin', () => {
    it('should throw with fewer than 2 teams', () => {
      expect(() => service.generateRoundRobin([makeTeams(1)[0]])).toThrow('at least 2 teams');
    });

    it('should generate correct number of matches for even number of teams', () => {
      // n teams → n*(n-1)/2 matches
      const teams4 = makeTeams(4);
      const matches4 = service.generateRoundRobin(teams4);
      expect(matches4).toHaveLength(6); // 4*3/2

      const teams6 = makeTeams(6);
      const matches6 = service.generateRoundRobin(teams6);
      expect(matches6).toHaveLength(15); // 6*5/2
    });

    it('should generate correct number of matches for odd number of teams', () => {
      // With bye: 3 teams → 3 matches (one bye per round, 3 rounds total)
      const teams3 = makeTeams(3);
      const matches3 = service.generateRoundRobin(teams3);
      expect(matches3).toHaveLength(3); // 3*2/2

      const teams5 = makeTeams(5);
      const matches5 = service.generateRoundRobin(teams5);
      expect(matches5).toHaveLength(10); // 5*4/2
    });

    it('each pair of teams should play exactly once', () => {
      const teams = makeTeams(4);
      const matches = service.generateRoundRobin(teams);

      const pairs = matches.map(m => [m.team1Id, m.team2Id].sort().join('-'));
      const uniquePairs = new Set(pairs);
      expect(pairs.length).toBe(uniquePairs.size);
    });

    it('all matches should have status "scheduled"', () => {
      const matches = service.generateRoundRobin(makeTeams(4));
      expect(matches.every(m => m.status === 'scheduled')).toBe(true);
    });

    it('should assign round numbers starting from 1', () => {
      const matches = service.generateRoundRobin(makeTeams(4));
      const rounds = [...new Set(matches.map(m => m.round))];
      expect(Math.min(...rounds)).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Knockout
  // ---------------------------------------------------------------------------
  describe('generateKnockout', () => {
    it('should throw with fewer than 2 teams', () => {
      expect(() => service.generateKnockout([makeTeams(1)[0]])).toThrow('at least 2 teams');
    });

    it('should generate matches for 4 teams (2 matches in round 1)', () => {
      const matches = service.generateKnockout(makeTeams(4));
      expect(matches).toHaveLength(2);
    });

    it('should generate matches for 2 teams (1 match)', () => {
      const matches = service.generateKnockout(makeTeams(2));
      expect(matches).toHaveLength(1);
    });

    it('all matches should have status "scheduled"', () => {
      const matches = service.generateKnockout(makeTeams(4));
      expect(matches.every(m => m.status === 'scheduled')).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Standings
  // ---------------------------------------------------------------------------
  describe('computeStandings', () => {
    it('should return a row for each team', () => {
      const teams = makeTeams(3);
      const standings = service.computeStandings(teams, []);
      expect(standings).toHaveLength(3);
    });

    it('should correctly compute points for win/draw/loss', () => {
      const teams = makeTeams(2);
      const matches = [
        {
          id: 'm1',
          round: 1,
          team1Id: 'team-1',
          team2Id: 'team-2',
          score1: 3,
          score2: 1,
          status: 'completed' as const
        }
      ];
      const standings = service.computeStandings(teams, matches);
      const winner = standings.find(r => r.teamId === 'team-1')!;
      const loser = standings.find(r => r.teamId === 'team-2')!;

      expect(winner.points).toBe(3);
      expect(winner.won).toBe(1);
      expect(loser.points).toBe(0);
      expect(loser.lost).toBe(1);
    });

    it('should award 1 point each for a draw', () => {
      const teams = makeTeams(2);
      const matches = [
        {
          id: 'm1',
          round: 1,
          team1Id: 'team-1',
          team2Id: 'team-2',
          score1: 2,
          score2: 2,
          status: 'completed' as const
        }
      ];
      const standings = service.computeStandings(teams, matches);
      expect(standings[0].points).toBe(1);
      expect(standings[1].points).toBe(1);
    });

    it('should sort by points descending', () => {
      const teams = makeTeams(3);
      const matches = [
        { id: 'm1', round: 1, team1Id: 'team-1', team2Id: 'team-2', score1: 2, score2: 0, status: 'completed' as const },
        { id: 'm2', round: 1, team1Id: 'team-2', team2Id: 'team-3', score1: 1, score2: 0, status: 'completed' as const },
        { id: 'm3', round: 2, team1Id: 'team-1', team2Id: 'team-3', score1: 1, score2: 0, status: 'completed' as const }
      ];
      const standings = service.computeStandings(teams, matches);
      // team-1: 6 pts, team-2: 3 pts, team-3: 0 pts
      expect(standings[0].teamId).toBe('team-1');
      expect(standings[0].points).toBe(6);
      expect(standings[1].points).toBe(3);
      expect(standings[2].points).toBe(0);
    });

    it('should skip non-completed matches', () => {
      const teams = makeTeams(2);
      const matches = [
        { id: 'm1', round: 1, team1Id: 'team-1', team2Id: 'team-2', status: 'scheduled' as const }
      ];
      const standings = service.computeStandings(teams, matches);
      expect(standings[0].points).toBe(0);
      expect(standings[1].points).toBe(0);
    });
  });
});
