/**
 * Tournament Service
 *
 * Handles scheduling and standings logic for tournaments.
 * Supports two formats:
 *  - round-robin:  every team plays every other team once
 *  - knockout:     single-elimination bracket
 *
 * Pure domain logic — no persistence dependencies.
 */

import { Sport } from '@viccoboard/core';
import { v4 as uuidv4 } from 'uuid';

// ---------------------------------------------------------------------------
// Standings types
// ---------------------------------------------------------------------------

/**
 * Minimal representation of a saved scoreboard session needed for score mapping.
 * Callers (e.g. the UI) cast their concrete metadata type to this interface.
 */
export interface ScoreboardLookup {
  teams: Array<{ id: string; name: string }>;
  scores: Record<string, number>;
}

export interface RoundRobinStanding {
  teamId: string;
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

export interface KnockoutBracket {
  rounds: KnockoutRound[];
}

export interface KnockoutRound {
  round: number;
  label: string;
  matches: Sport.Match[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

function roundLabel(totalRounds: number, round: number): string {
  const remaining = totalRounds - round + 1;
  if (remaining === 1) return 'Final';
  if (remaining === 2) return 'Semifinal';
  if (remaining === 3) return 'Quarterfinal';
  return `Round ${round}`;
}

// ---------------------------------------------------------------------------
// TournamentService
// ---------------------------------------------------------------------------

export class TournamentService {
  /**
   * Generate a full round-robin schedule for the supplied teams.
   * Uses the "circle algorithm" for an even number of participants.
   * For an odd number, a bye (null team) is implicitly included.
   */
  generateRoundRobinSchedule(
    tournamentId: string,
    teams: Sport.Team[]
  ): Sport.Match[] {
    if (teams.length < 2) {
      throw new Error('Round-robin requires at least 2 teams');
    }

    const ids = teams.map(t => t.id);
    // If odd number, add a bye slot represented by the special sentinel
    const hasBye = ids.length % 2 !== 0;
    const participants = hasBye ? [...ids, '__BYE__'] : [...ids];
    const n = participants.length;
    const numRounds = n - 1;
    const matchesPerRound = n / 2;

    // Rotate using the "polygon / circle" method:
    // Fix the first element, rotate the rest
    const fixed = participants[0];
    const rotating = participants.slice(1);

    const matches: Sport.Match[] = [];
    for (let round = 0; round < numRounds; round++) {
      const roundParticipants = [fixed, ...rotating];
      for (let i = 0; i < matchesPerRound; i++) {
        const a = roundParticipants[i];
        const b = roundParticipants[n - 1 - i];
        if (a === '__BYE__' || b === '__BYE__') {
          // bye — skip creating a match
          continue;
        }
        matches.push({
          id: uuidv4(),
          tournamentId,
          team1Id: a,
          team2Id: b,
          round: round + 1,
          sequence: i + 1,
          status: 'scheduled'
        });
      }
      // Rotate: move first element of rotating to end
      rotating.push(rotating.shift()!);
    }
    return matches;
  }

  /**
   * Generate an empty single-elimination knockout bracket.
   * Only the first round has concrete team assignments; later rounds are
   * populated as results are entered.
   */
  generateKnockoutBracket(
    tournamentId: string,
    teams: Sport.Team[]
  ): Sport.Match[] {
    if (teams.length < 2) {
      throw new Error('Knockout requires at least 2 teams');
    }

    const slotCount = nextPowerOfTwo(teams.length);
    const totalRounds = Math.log2(slotCount);

    // Seed the first round
    const matches: Sport.Match[] = [];
    const seeds = [...teams.map(t => t.id)];
    // Pad with byes if not a perfect power of 2
    while (seeds.length < slotCount) seeds.push('__BYE__');

    // First round: pair top seed vs bottom seed, etc.
    const firstRoundMatchCount = slotCount / 2;
    for (let i = 0; i < firstRoundMatchCount; i++) {
      const a = seeds[i];
      const b = seeds[slotCount - 1 - i];
      matches.push({
        id: uuidv4(),
        tournamentId,
        team1Id: a === '__BYE__' ? '' : a,
        team2Id: b === '__BYE__' ? '' : b,
        round: 1,
        sequence: i + 1,
        status: a === '__BYE__' || b === '__BYE__' ? 'completed' : 'scheduled',
        // If one side is a bye, give the other side a walkover
        score1: a === '__BYE__' ? undefined : (b === '__BYE__' ? 1 : undefined),
        score2: b === '__BYE__' ? undefined : (a === '__BYE__' ? 1 : undefined)
      });
    }

    // Create placeholder matches for subsequent rounds
    for (let round = 2; round <= totalRounds; round++) {
      const count = slotCount / Math.pow(2, round);
      for (let seq = 1; seq <= count; seq++) {
        matches.push({
          id: uuidv4(),
          tournamentId,
          team1Id: '',
          team2Id: '',
          round,
          sequence: seq,
          status: 'scheduled'
        });
      }
    }

    return matches;
  }

  /**
   * Compute round-robin standings from completed matches.
   * Win = 3 pts, Draw = 1 pt, Loss = 0 pts.
   */
  computeRoundRobinStandings(
    teams: Sport.Team[],
    matches: Sport.Match[]
  ): RoundRobinStanding[] {
    const standingsMap = new Map<string, RoundRobinStanding>();
    for (const team of teams) {
      standingsMap.set(team.id, {
        teamId: team.id,
        teamName: team.name,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
        points: 0
      });
    }

    for (const match of matches) {
      if (match.status !== 'completed') continue;
      if (match.score1 == null || match.score2 == null) continue;

      const s1 = standingsMap.get(match.team1Id);
      const s2 = standingsMap.get(match.team2Id);
      if (!s1 || !s2) continue;

      s1.played++;
      s2.played++;
      s1.goalsFor += match.score1;
      s1.goalsAgainst += match.score2;
      s2.goalsFor += match.score2;
      s2.goalsAgainst += match.score1;

      if (match.score1 > match.score2) {
        s1.wins++;
        s1.points += 3;
        s2.losses++;
      } else if (match.score1 < match.score2) {
        s2.wins++;
        s2.points += 3;
        s1.losses++;
      } else {
        s1.draws++;
        s1.points += 1;
        s2.draws++;
        s2.points += 1;
      }
    }

    for (const s of standingsMap.values()) {
      s.goalDiff = s.goalsFor - s.goalsAgainst;
    }

    return Array.from(standingsMap.values()).sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDiff - a.goalDiff ||
        b.goalsFor - a.goalsFor
    );
  }

  /**
   * Build a structured knockout bracket view from a flat match list.
   */
  buildKnockoutBracket(
    teams: Sport.Team[],
    matches: Sport.Match[]
  ): KnockoutBracket {
    const sortedMatches = [...matches].sort(
      (a, b) => a.round - b.round || a.sequence - b.sequence
    );
    const maxRound = sortedMatches.reduce(
      (acc, m) => Math.max(acc, m.round),
      0
    );
    const rounds: KnockoutRound[] = [];
    for (let r = 1; r <= maxRound; r++) {
      rounds.push({
        round: r,
        label: roundLabel(maxRound, r),
        matches: sortedMatches.filter(m => m.round === r)
      });
    }
    return { rounds };
  }

  /**
   * After a knockout match is completed, propagate the winner to the next round.
   * Returns the updated matches array (immutably).
   */
  advanceKnockoutWinner(
    matches: Sport.Match[],
    completedMatch: Sport.Match
  ): Sport.Match[] {
    if (completedMatch.status !== 'completed') return matches;
    if (completedMatch.score1 == null || completedMatch.score2 == null) return matches;

    const winner =
      completedMatch.score1 >= completedMatch.score2
        ? completedMatch.team1Id
        : completedMatch.team2Id;

    const nextRound = completedMatch.round + 1;
    // The next match sequence is ceil(sequence / 2)
    const nextSequence = Math.ceil(completedMatch.sequence / 2);
    // Does the winner go to slot 1 or 2 in the next match?
    const isSlot1 = completedMatch.sequence % 2 === 1;

    return matches.map(m => {
      if (m.round !== nextRound || m.sequence !== nextSequence) return m;
      return {
        ...m,
        team1Id: isSlot1 ? winner : m.team1Id,
        team2Id: isSlot1 ? m.team2Id : winner
      };
    });
  }

  /**
   * Determine if all matches in a tournament are completed.
   */
  isTournamentComplete(matches: Sport.Match[]): boolean {
    return matches.length > 0 && matches.every(m => m.status === 'completed');
  }

  /**
   * Derive match scores from a saved scoreboard session.
   *
   * Matching strategy (applied in order):
   * 1. **Name-based** (case-insensitive): if both tournament match teams can be
   *    found by name in the scoreboard session, their individual scores are used.
   * 2. **Positional fallback**: used when either team name has no match in the
   *    scoreboard session (including partial matches where only one name is
   *    found). The first scoreboard team maps to `score1` and the second to
   *    `score2`.
   *
   * Returns `{ score1: 0, score2: 0 }` when the lookup has no teams.
   */
  mapScoreboardResultToMatch(
    tournamentTeams: Sport.Team[],
    match: Sport.Match,
    scoreboard: ScoreboardLookup
  ): { score1: number; score2: number } {
    const team1 = tournamentTeams.find(t => t.id === match.team1Id);
    const team2 = tournamentTeams.find(t => t.id === match.team2Id);

    const team1Name = team1?.name.toLowerCase() ?? '';
    const team2Name = team2?.name.toLowerCase() ?? '';

    const sbTeam1 = scoreboard.teams.find(t => t.name.toLowerCase() === team1Name);
    const sbTeam2 = scoreboard.teams.find(t => t.name.toLowerCase() === team2Name);

    if (sbTeam1 && sbTeam2) {
      return {
        score1: scoreboard.scores[sbTeam1.id] ?? 0,
        score2: scoreboard.scores[sbTeam2.id] ?? 0
      };
    }

    // Positional fallback
    const firstTeam = scoreboard.teams[0];
    const secondTeam = scoreboard.teams[1];
    return {
      score1: firstTeam ? (scoreboard.scores[firstTeam.id] ?? 0) : 0,
      score2: secondTeam ? (scoreboard.scores[secondTeam.id] ?? 0) : 0
    };
  }
}
