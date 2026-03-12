/**
 * TeamBuilder Service
 * Encapsulates team generation algorithms – no storage concerns here.
 * 
 * Supported algorithms:
 *   random         – Fisher-Yates shuffle + round-robin assignment
 *   gender-balanced – gender groups are shuffled independently then
 *                    interleaved so that each team receives an even
 *                    distribution of male / female / other students
 */


export interface TeamBuildInput {
  /** Students to distribute (minimal shape required). */
  students: Array<{ id: string; gender?: string | null }>;
  /** Number of teams to create (≥ 2). */
  teamCount: number;
  /** Human-readable label prefix ("Team", "Gruppe", …). */
  teamLabel: string;
  /** Distribution algorithm. Defaults to 'random'. */
  algorithm?: 'random' | 'gender-balanced';
}

export interface BuiltTeam {
  id: string;
  name: string;
  studentIds: string[];
}

export class TeamBuilderService {
  /**
   * Build teams according to the requested algorithm.
   * Returns an array of BuiltTeam objects – no side effects.
   */
  buildTeams(input: TeamBuildInput): BuiltTeam[] {
    const { students, teamCount, teamLabel, algorithm = 'random' } = input;

    if (teamCount < 2) {
      throw new Error('teamCount must be at least 2');
    }
    if (students.length === 0) {
      throw new Error('students must not be empty');
    }

    if (algorithm === 'gender-balanced') {
      return this.buildGenderBalanced(students, teamCount, teamLabel);
    }
    return this.buildRandom(students, teamCount, teamLabel);
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Pure random shuffle + round-robin distribution.
   */
  private buildRandom(
    students: Array<{ id: string; gender?: string | null }>,
    teamCount: number,
    teamLabel: string
  ): BuiltTeam[] {
    const shuffled = this.shuffle(students.map(s => s.id));
    return this.distributeRoundRobin(shuffled, teamCount, teamLabel);
  }

  /**
   * Gender-balanced distribution:
   * shuffle each gender group independently, then interleave one student
   * from each group in turn so that each team gets a proportional mix of
   * males, females, and gender-unspecified students.
   *
   * Example with 2 teams, 4 males, 2 females, 1 other:
   *   males:   m1 m2 m3 m4  → teams [m1, m3] [m2, m4]
   *   females: f1 f2         → teams [f1]     [f2]
   *   others:  o1             → teams [o1]     []
   */
  private buildGenderBalanced(
    students: Array<{ id: string; gender?: string | null }>,
    teamCount: number,
    teamLabel: string
  ): BuiltTeam[] {
    const males   = this.shuffle(this.filterByGender(students, 'male'));
    const females = this.shuffle(this.filterByGender(students, 'female'));
    const others  = this.shuffle(this.filterOtherGender(students));

    // Interleave gender groups: take one element from each non-empty bucket
    // in rotation so the resulting ordering spreads genders evenly before
    // the round-robin assignment.
    const interleaved: string[] = [];
    const buckets = [males, females, others];
    const indices = [0, 0, 0]; // queue pointers for each bucket
    let remaining = males.length + females.length + others.length;
    while (remaining > 0) {
      for (let i = 0; i < buckets.length; i++) {
        const bucket = buckets[i];
        const index = indices[i];
        if (index < bucket.length) {
          interleaved.push(bucket[index]);
          indices[i] = index + 1;
          remaining--;
          if (remaining === 0) {
            break;
          }
        }
      }
    }

    return this.distributeRoundRobin(interleaved, teamCount, teamLabel);
  }

  /**
   * Distribute an ordered list of student IDs to `teamCount` teams
   * using round-robin (index mod teamCount).
   */
  private distributeRoundRobin(
    studentIds: string[],
    teamCount: number,
    teamLabel: string
  ): BuiltTeam[] {
    const teams: BuiltTeam[] = Array.from({ length: teamCount }, (_, i) => ({
      id: `team-${i + 1}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: `${teamLabel} ${i + 1}`,
      studentIds: []
    }));

    studentIds.forEach((id, idx) => {
      teams[idx % teamCount].studentIds.push(id);
    });

    return teams;
  }

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

  /** Extract IDs of students matching a specific gender value. */
  private filterByGender(
    students: Array<{ id: string; gender?: string | null }>,
    gender: string
  ): string[] {
    return students.filter(s => s.gender === gender).map(s => s.id);
  }

  /** Extract IDs of students whose gender is not 'male' or 'female'. */
  private filterOtherGender(
    students: Array<{ id: string; gender?: string | null }>
  ): string[] {
    return students
      .filter(s => !s.gender || (s.gender !== 'male' && s.gender !== 'female'))
      .map(s => s.id);
  }
}
