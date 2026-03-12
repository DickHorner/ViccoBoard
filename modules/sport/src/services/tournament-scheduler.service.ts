/**
 * Tournament Scheduler Service
 * Generates match schedules for round-robin and knockout tournament formats.
 */

import { v4 as uuidv4 } from 'uuid';
import type { TournamentData } from '../use-cases/save-tournament.use-case.js';

export type TournamentMatch = TournamentData['matches'][0];
export type TournamentTeam = TournamentData['teams'][0];

export class TournamentSchedulerService {
  /**
   * Generate a round-robin schedule (every team plays every other team once).
   * Uses the "circle method" / round-robin algorithm.
   */
  generateRoundRobin(teams: TournamentTeam[]): TournamentMatch[] {
    if (teams.length < 2) {
      throw new Error('at least 2 teams are required for round-robin');
    }

    const matches: TournamentMatch[] = [];
    const n = teams.length;
    // For odd number of teams we add a "bye" placeholder
    const list = n % 2 === 0 ? [...teams] : [...teams, { id: '__bye__', name: 'Bye' }];
    const total = list.length;
    const rounds = total - 1;
    const matchesPerRound = total / 2;

    for (let round = 0; round < rounds; round++) {
      for (let match = 0; match < matchesPerRound; match++) {
        const team1 = list[match];
        const team2 = list[total - 1 - match];
        // Skip bye matches
        if (team1.id !== '__bye__' && team2.id !== '__bye__') {
          matches.push({
            id: uuidv4(),
            round: round + 1,
            team1Id: team1.id,
            team2Id: team2.id,
            status: 'scheduled'
          });
        }
      }
      // Rotate all except first element
      const last = list.splice(total - 1, 1)[0];
      list.splice(1, 0, last);
    }

    return matches;
  }

  /**
   * Generate a single-elimination knockout bracket.
   * Teams are shuffled randomly for initial seeding.
   */
  generateKnockout(teams: TournamentTeam[]): TournamentMatch[] {
    if (teams.length < 2) {
      throw new Error('at least 2 teams are required for knockout');
    }

    const matches: TournamentMatch[] = [];
    // Pad to next power of 2 with byes
    const targetSize = Math.pow(2, Math.ceil(Math.log2(teams.length)));
    const padded: Array<TournamentTeam | null> = [...teams];
    while (padded.length < targetSize) {
      padded.push(null); // bye
    }

    let round = 1;
    for (let i = 0; i < padded.length; i += 2) {
      const team1 = padded[i];
      const team2 = padded[i + 1];
      if (team1 && team2) {
        matches.push({
          id: uuidv4(),
          round,
          team1Id: team1.id,
          team2Id: team2.id,
          status: 'scheduled'
        });
      }
    }

    return matches;
  }

  /**
   * Compute standings from completed match results (for round-robin).
   * Returns standings sorted by points (desc), then goal difference.
   */
  computeStandings(
    teams: TournamentTeam[],
    matches: TournamentMatch[]
  ): StandingsRow[] {
    const map = new Map<string, StandingsRow>();
    for (const team of teams) {
      map.set(team.id, {
        teamId: team.id,
        teamName: team.name,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0
      });
    }

    for (const match of matches) {
      if (match.status !== 'completed') continue;
      if (match.score1 === undefined || match.score2 === undefined) continue;

      const r1 = map.get(match.team1Id);
      const r2 = map.get(match.team2Id);
      if (!r1 || !r2) continue;

      r1.played++;
      r2.played++;
      r1.goalsFor += match.score1;
      r1.goalsAgainst += match.score2;
      r2.goalsFor += match.score2;
      r2.goalsAgainst += match.score1;

      if (match.score1 > match.score2) {
        r1.won++;
        r1.points += 3;
        r2.lost++;
      } else if (match.score1 < match.score2) {
        r2.won++;
        r2.points += 3;
        r1.lost++;
      } else {
        r1.drawn++;
        r1.points += 1;
        r2.drawn++;
        r2.points += 1;
      }
    }

    const rows = Array.from(map.values());
    rows.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const gdA = a.goalsFor - a.goalsAgainst;
      const gdB = b.goalsFor - b.goalsAgainst;
      if (gdB !== gdA) return gdB - gdA;
      return b.goalsFor - a.goalsFor;
    });

    return rows;
  }
}

export interface StandingsRow {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}
