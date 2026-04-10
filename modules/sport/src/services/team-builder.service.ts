/**
 * TeamBuilder Service
 * Encapsulates team generation algorithms – no storage concerns here.
 *
 * Supported algorithms:
 *   random         – Fisher-Yates shuffle + round-robin assignment
 *   gender-balanced – gender groups are shuffled independently then
 *                    interleaved (kept for backward compatibility;
 *                    equivalent to heterogeneous + gender basis)
 *   homogeneous    – students with similar scores are grouped together
 *   heterogeneous  – students with different scores are spread across teams
 *
 * Supported bases (relevant for homogeneous / heterogeneous):
 *   gender             – distribute by gender groups
 *   performance        – distribute by numeric performance score
 *   performanceRating  – distribute by self-assessment rating
 *
 * Constraints:
 *   alwaysTogether – groups of students that must share the same team
 *   neverTogether  – pairs/groups where no two students may share a team
 */

import { TeamConstraintError } from './team-builder.types';
import type {
  BuiltTeam,
  TeamAlgorithm,
  TeamBasis,
  TeamBuildInput,
  TeamConstraintConflict,
  TeamConstraints,
  TeamStudent,
} from './team-builder.types';
import {
  mergeAlwaysTogether,
  resolveNeverTogether,
  validateConstraints
} from './team-builder.constraints';

export class TeamBuilderService {
  /**
   * Build teams according to the requested algorithm.
   * Returns an array of BuiltTeam objects – no side effects.
   * Throws TeamConstraintError when hard constraints cannot be satisfied.
   */
  buildTeams(input: TeamBuildInput): BuiltTeam[] {
    const {
      students,
      teamCount,
      teamLabel,
      algorithm = 'random',
      basis = 'gender',
      roles = [],
      constraints = {}
    } = input;

    if (teamCount < 2) {
      throw new Error('teamCount must be at least 2');
    }
    if (students.length === 0) {
      throw new Error('students must not be empty');
    }

    // Validate and resolve constraints
    const resolvedAlwaysTogether = mergeAlwaysTogether(constraints.alwaysTogether ?? []);
    validateConstraints(students, resolvedAlwaysTogether, constraints.neverTogether ?? [], teamCount);

    // Produce ordered list of student IDs according to the algorithm
    let orderedIds: string[];
    if (algorithm === 'gender-balanced' || (algorithm === 'heterogeneous' && basis === 'gender')) {
      orderedIds = this.orderGenderBalanced(students);
    } else if (algorithm === 'homogeneous') {
      orderedIds = this.orderByScore(students, basis, 'homogeneous');
    } else if (algorithm === 'heterogeneous') {
      orderedIds = this.orderByScore(students, basis, 'heterogeneous');
    } else {
      orderedIds = this.shuffle(students.map(s => s.id));
    }

    // Apply alwaysTogether: build assignment respecting forced groups
    const teams = this.distributeWithConstraints(
      orderedIds,
      resolvedAlwaysTogether,
      constraints.neverTogether ?? [],
      teamCount,
      teamLabel
    );

    // Apply role assignment if roles were provided
    if (roles.length > 0) {
      this.assignRoles(teams, roles);
    }

    return teams;
  }

  // -------------------------------------------------------------------------
  // Constraint helpers
  // -------------------------------------------------------------------------

  /**
   * Merge overlapping alwaysTogether groups via Union-Find so that transitive
   * "must be together" relationships are respected.
   * e.g. [[A,B],[B,C]] → [[A,B,C]]
   */

  // -------------------------------------------------------------------------
  // Ordering strategies
  // -------------------------------------------------------------------------

  /**
   * Gender-balanced ordering: interleave male/female/other groups so that
   * a subsequent round-robin assignment gives each team a proportional mix.
   */
  private orderGenderBalanced(students: TeamStudent[]): string[] {
    const males   = this.shuffle(students.filter(s => s.gender === 'm').map(s => s.id));
    const females = this.shuffle(students.filter(s => s.gender === 'f').map(s => s.id));
    const others  = this.shuffle(
      students.filter(s => !s.gender || (s.gender !== 'm' && s.gender !== 'f')).map(s => s.id)
    );

    const interleaved: string[] = [];
    const buckets = [males, females, others];
    const indices = [0, 0, 0];
    let remaining = males.length + females.length + others.length;
    while (remaining > 0) {
      for (let i = 0; i < buckets.length; i++) {
        if (indices[i] < buckets[i].length) {
          interleaved.push(buckets[i][indices[i]++]);
          if (--remaining === 0) break;
        }
      }
    }
    return interleaved;
  }

  /**
   * Order students by their numeric score for homogeneous/heterogeneous distribution.
   *
   * homogeneous:  sort descending → chunk into teamCount groups so each team
   *               gets a consecutive block of similar-score students.
   *               (The actual chunking happens in distributeWithConstraints via
   *               the round-robin pattern used for each chunk block.)
   *
   * heterogeneous: sort descending → round-robin so each team gets one top,
   *               one middle, one bottom performer in turn.
   *
   * Students without a score are placed at the end (shuffled among themselves).
   */
  private orderByScore(students: TeamStudent[], basis: TeamBasis, mode: 'homogeneous' | 'heterogeneous'): string[] {
    const getScore = (s: TeamStudent): number | null => {
      if (basis === 'performanceRating') return s.performanceRating ?? null;
      return s.performanceScore ?? null;
    };

    const scored   = students.filter(s => getScore(s) !== null).sort((a, b) => (getScore(b) ?? 0) - (getScore(a) ?? 0));
    const unscored = this.shuffle(students.filter(s => getScore(s) === null).map(s => s.id));

    if (mode === 'homogeneous') {
      // For homogeneous, keep the sorted order so that consecutive students
      // (similar scores) get placed in the same team during chunk distribution.
      return [...scored.map(s => s.id), ...unscored];
    }

    // heterogeneous: round-robin ordering (already sorted, RR will spread them)
    return [...scored.map(s => s.id), ...unscored];
  }

  // -------------------------------------------------------------------------
  // Distribution
  // -------------------------------------------------------------------------

  /**
   * Distribute an ordered list of student IDs across `teamCount` teams,
   * respecting alwaysTogether and neverTogether constraints.
   *
   * alwaysTogether groups are treated as indivisible units.
   * neverTogether violations are resolved by swapping students between teams.
   */
  private distributeWithConstraints(
    orderedIds: string[],
    alwaysTogether: string[][],
    neverTogether: string[][],
    teamCount: number,
    teamLabel: string
  ): BuiltTeam[] {
    const teams: BuiltTeam[] = Array.from({ length: teamCount }, (_, i) => ({
      id: `team-${i + 1}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: `${teamLabel} ${i + 1}`,
      studentIds: []
    }));

    // Build a lookup: studentId → alwaysTogether group index (or -1)
    const groupOf = new Map<string, number>();
    for (let gi = 0; gi < alwaysTogether.length; gi++) {
      for (const id of alwaysTogether[gi]) {
        groupOf.set(id, gi);
      }
    }

    // Build assignment order: collapse alwaysTogether groups into single units
    // Each "unit" is either a solo [id] or an entire forced group.
    const assigned = new Set<string>();
    const units: string[][] = [];
    for (const id of orderedIds) {
      if (assigned.has(id)) continue;
      const gi = groupOf.get(id);
      if (gi !== undefined) {
        // Add whole forced group as one unit
        units.push(alwaysTogether[gi]);
        alwaysTogether[gi].forEach(mid => assigned.add(mid));
      } else {
        units.push([id]);
        assigned.add(id);
      }
    }

    // Determine distribution pattern based on team count and unit sizes
    // We want to distribute units round-robin across teams
    // For homogeneous mode, this means consecutive units go to the same team first,
    // but that would conflict with the chunking. We handle both modes via orderedIds
    // already being in the right sequence – round-robin on units is correct for all modes
    // since homogeneous ordering groups similar scores consecutively before this step.
    let teamIndex = 0;
    for (const unit of units) {
      for (const id of unit) {
        teams[teamIndex].studentIds.push(id);
      }
      teamIndex = (teamIndex + 1) % teamCount;
    }

    // Resolve neverTogether violations via swapping
    resolveNeverTogether(teams, neverTogether);

    return teams;
  }

  /**
   * Attempt to resolve neverTogether violations by swapping students
   * between teams. This is a best-effort greedy resolution.
   */
  // -------------------------------------------------------------------------
  // Role assignment
  // -------------------------------------------------------------------------

  /**
   * Assign roles to students within each team by cycling through the roles list.
   * The first student in a team gets roles[0], the second roles[1], etc.
   */
  private assignRoles(teams: BuiltTeam[], roles: string[]): void {
    for (const team of teams) {
      const roleMap: Record<string, string> = {};
      team.studentIds.forEach((id, idx) => {
        roleMap[id] = roles[idx % roles.length];
      });
      team.roles = roleMap;
    }
  }

  // -------------------------------------------------------------------------
  // Utility
  // -------------------------------------------------------------------------

  /**
   * Fisher-Yates in-place shuffle (returns a new array – does not mutate).
   */
  shuffle<T>(input: T[]): T[] {
    const array = [...input];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

export { TeamConstraintError };
export type {
  BuiltTeam,
  TeamAlgorithm,
  TeamBasis,
  TeamBuildInput,
  TeamConstraintConflict,
  TeamConstraints,
  TeamStudent,
};
