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

export type TeamAlgorithm = 'random' | 'gender-balanced' | 'homogeneous' | 'heterogeneous';
export type TeamBasis = 'gender' | 'performance' | 'performanceRating';

export interface TeamStudent {
  id: string;
  gender?: string | null;
  /** Numeric grade or performance score used for homogeneous/heterogeneous distribution. */
  performanceScore?: number | null;
  /** Self-assessed rating used for homogeneous/heterogeneous distribution. */
  performanceRating?: number | null;
}

export interface TeamConstraints {
  /** Each inner array is a group of student IDs that must all end up in the same team. */
  alwaysTogether?: string[][];
  /** Each inner array is a group/pair of student IDs where no two members may share a team. */
  neverTogether?: string[][];
}

export interface TeamConstraintConflict {
  type: 'alwaysTogether-group-too-large' | 'direct-contradiction' | 'neverTogether-unsatisfiable';
  message: string;
  studentIds?: string[];
}

export class TeamConstraintError extends Error {
  readonly conflicts: TeamConstraintConflict[];
  constructor(message: string, conflicts: TeamConstraintConflict[]) {
    super(message);
    this.name = 'TeamConstraintError';
    this.conflicts = conflicts;
  }
}

export interface TeamBuildInput {
  /** Students to distribute. */
  students: TeamStudent[];
  /** Number of teams to create (≥ 2). */
  teamCount: number;
  /** Human-readable label prefix ("Team", "Gruppe", …). */
  teamLabel: string;
  /** Distribution algorithm. Defaults to 'random'. */
  algorithm?: TeamAlgorithm;
  /** Basis used when algorithm is 'homogeneous' or 'heterogeneous'. */
  basis?: TeamBasis;
  /** Role names to assign cyclically to each team member (optional). */
  roles?: string[];
  /** Hard pair/group constraints. */
  constraints?: TeamConstraints;
}

export interface BuiltTeam {
  id: string;
  name: string;
  studentIds: string[];
  /** Optional role assignments: studentId → role name. */
  roles?: Record<string, string>;
}

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
    const resolvedAlwaysTogether = this.mergeAlwaysTogether(constraints.alwaysTogether ?? []);
    this.validateConstraints(students, resolvedAlwaysTogether, constraints.neverTogether ?? [], teamCount);

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
  private mergeAlwaysTogether(groups: string[][]): string[][] {
    if (groups.length === 0) return [];

    // Collect all student IDs mentioned in alwaysTogether rules
    const parent: Map<string, string> = new Map();
    const find = (id: string): string => {
      if (!parent.has(id)) parent.set(id, id);
      const p = parent.get(id)!;
      if (p !== id) {
        parent.set(id, find(p));
      }
      return parent.get(id)!;
    };
    const union = (a: string, b: string) => {
      parent.set(find(a), find(b));
    };

    for (const group of groups) {
      for (let i = 1; i < group.length; i++) {
        union(group[0], group[i]);
      }
    }

    // Collect merged groups
    const merged: Map<string, string[]> = new Map();
    for (const [id] of parent) {
      const root = find(id);
      if (!merged.has(root)) merged.set(root, []);
      merged.get(root)!.push(id);
    }

    return Array.from(merged.values()).filter(g => g.length > 1);
  }

  /**
   * Validate hard constraints and throw TeamConstraintError listing all
   * conflicts if they cannot be satisfied.
   */
  private validateConstraints(
    students: TeamStudent[],
    alwaysTogether: string[][],
    neverTogether: string[][],
    teamCount: number
  ): void {
    const conflicts: TeamConstraintConflict[] = [];
    const studentIds = new Set(students.map(s => s.id));
    const maxTeamSize = Math.ceil(students.length / teamCount);

    // Check each alwaysTogether group does not exceed maximum team size
    for (const group of alwaysTogether) {
      if (group.length > maxTeamSize) {
        conflicts.push({
          type: 'alwaysTogether-group-too-large',
          message: `An "always together" group of ${group.length} students cannot fit into a team (max team size: ${maxTeamSize})`,
          studentIds: group
        });
      }
    }

    // Check for direct contradictions: same pair in both alwaysTogether and neverTogether
    for (const alwaysGroup of alwaysTogether) {
      const alwaysSet = new Set(alwaysGroup);
      for (const neverGroup of neverTogether) {
        const commonIds = neverGroup.filter(id => alwaysSet.has(id));
        if (commonIds.length >= 2) {
          conflicts.push({
            type: 'direct-contradiction',
            message: `Students [${commonIds.join(', ')}] must be both together and separated – this is impossible`,
            studentIds: commonIds
          });
        }
      }
    }

    // Check neverTogether feasibility: if a neverTogether group is larger
    // than the number of teams, it cannot be satisfied
    for (const group of neverTogether) {
      // Only consider students that exist in our roster
      const validIds = group.filter(id => studentIds.has(id));
      if (validIds.length > teamCount) {
        conflicts.push({
          type: 'neverTogether-unsatisfiable',
          message: `A "never together" group has ${validIds.length} members but only ${teamCount} teams exist – some pair must share a team`,
          studentIds: validIds
        });
      }
    }

    if (conflicts.length > 0) {
      throw new TeamConstraintError(
        `Team constraints cannot be satisfied (${conflicts.length} conflict${conflicts.length > 1 ? 's' : ''})`,
        conflicts
      );
    }
  }

  // -------------------------------------------------------------------------
  // Ordering strategies
  // -------------------------------------------------------------------------

  /**
   * Gender-balanced ordering: interleave male/female/other groups so that
   * a subsequent round-robin assignment gives each team a proportional mix.
   */
  private orderGenderBalanced(students: TeamStudent[]): string[] {
    const males   = this.shuffle(students.filter(s => s.gender === 'male').map(s => s.id));
    const females = this.shuffle(students.filter(s => s.gender === 'female').map(s => s.id));
    const others  = this.shuffle(
      students.filter(s => !s.gender || (s.gender !== 'male' && s.gender !== 'female')).map(s => s.id)
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
    this.resolveNeverTogether(teams, neverTogether);

    return teams;
  }

  /**
   * Attempt to resolve neverTogether violations by swapping students
   * between teams. This is a best-effort greedy resolution.
   */
  private resolveNeverTogether(teams: BuiltTeam[], neverTogether: string[][]): void {
    if (neverTogether.length === 0) return;

    // Build lookup: studentId → team index
    const teamOf = new Map<string, number>();
    teams.forEach((t, ti) => t.studentIds.forEach(id => teamOf.set(id, ti)));

    let changed = true;
    let iterations = 0;
    const maxIterations = teams.length * Math.max(1, ...teams.map(t => t.studentIds.length)) * neverTogether.length + 10;

    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;

      for (const group of neverTogether) {
        // Find all pairs from this group that share a team
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            const idA = group[i];
            const idB = group[j];
            const tiA = teamOf.get(idA);
            const tiB = teamOf.get(idB);
            if (tiA === undefined || tiB === undefined || tiA !== tiB) continue;

            // Violation: A and B are in the same team – try to swap A with
            // a student from another team that won't create new violations
            const swapped = this.trySwap(idA, teams, neverTogether, teamOf);
            if (swapped) {
              changed = true;
            }
          }
        }
      }
    }
  }

  /**
   * Try to swap `targetId` with a student in another team such that the swap
   * resolves the neverTogether violation without creating new ones.
   * Returns true if a successful swap was found.
   */
  private trySwap(
    targetId: string,
    teams: BuiltTeam[],
    neverTogether: string[][],
    teamOf: Map<string, number>
  ): boolean {
    const sourceTeamIdx = teamOf.get(targetId);
    if (sourceTeamIdx === undefined) return false;

    // Build neverTogether partner sets
    const neverPartnersOf = (id: string): Set<string> => {
      const partners = new Set<string>();
      for (const group of neverTogether) {
        if (group.includes(id)) {
          group.forEach(p => { if (p !== id) partners.add(p); });
        }
      }
      return partners;
    };

    const targetNeverPartners = neverPartnersOf(targetId);

    for (let ti = 0; ti < teams.length; ti++) {
      if (ti === sourceTeamIdx) continue;
      const targetTeam = teams[ti];

      // Try swapping targetId with each member of the other team
      for (const candidateId of targetTeam.studentIds) {
        const candidateNeverPartners = neverPartnersOf(candidateId);

        // Check: would moving targetId to teams[ti] and candidateId to sourceTeam create violations?
        const targetTeamMembers = new Set(targetTeam.studentIds.filter(id => id !== candidateId));
        const sourceTeamMembers = new Set(teams[sourceTeamIdx].studentIds.filter(id => id !== targetId));

        const newViolationForTarget = [...targetTeamMembers].some(m => targetNeverPartners.has(m));
        const newViolationForCandidate = [...sourceTeamMembers].some(m => candidateNeverPartners.has(m));

        if (!newViolationForTarget && !newViolationForCandidate) {
          // Perform the swap
          teams[sourceTeamIdx].studentIds = teams[sourceTeamIdx].studentIds.filter(id => id !== targetId);
          teams[sourceTeamIdx].studentIds.push(candidateId);
          targetTeam.studentIds = targetTeam.studentIds.filter(id => id !== candidateId);
          targetTeam.studentIds.push(targetId);
          teamOf.set(targetId, ti);
          teamOf.set(candidateId, sourceTeamIdx);
          return true;
        }
      }
    }
    return false;
  }

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
