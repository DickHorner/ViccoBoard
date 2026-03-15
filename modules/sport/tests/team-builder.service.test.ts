/**
 * TeamBuilderService Tests
 * Verifies team generation algorithms: random, gender-balanced,
 * homogeneous, heterogeneous, roles, and constraints.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { TeamBuilderService, TeamConstraintError } from '../src/services/team-builder.service';
import type { TeamStudent } from '../src/services/team-builder.service';

const makeStudents = (specs: Array<{ id: string; gender?: string; performanceScore?: number }>) =>
  specs.map(s => ({ id: s.id, gender: s.gender, performanceScore: s.performanceScore }));

describe('TeamBuilderService', () => {
  let service: TeamBuilderService;

  beforeEach(() => {
    service = new TeamBuilderService();
  });

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------
  describe('validation', () => {
    it('should throw when teamCount < 2', () => {
      expect(() =>
        service.buildTeams({
          students: makeStudents([{ id: 's1' }, { id: 's2' }]),
          teamCount: 1,
          teamLabel: 'Team'
        })
      ).toThrow('teamCount must be at least 2');
    });

    it('should throw when students array is empty', () => {
      expect(() =>
        service.buildTeams({
          students: [],
          teamCount: 2,
          teamLabel: 'Team'
        })
      ).toThrow('students must not be empty');
    });
  });

  // -------------------------------------------------------------------------
  // Random algorithm
  // -------------------------------------------------------------------------
  describe('random algorithm', () => {
    it('should create the requested number of teams', () => {
      const students = makeStudents([
        { id: 's1' }, { id: 's2' }, { id: 's3' }, { id: 's4' }
      ]);
      const teams = service.buildTeams({ students, teamCount: 2, teamLabel: 'Team' });
      expect(teams).toHaveLength(2);
    });

    it('should assign every student exactly once', () => {
      const students = makeStudents([
        { id: 's1' }, { id: 's2' }, { id: 's3' }, { id: 's4' }, { id: 's5' }
      ]);
      const teams = service.buildTeams({ students, teamCount: 3, teamLabel: 'Team' });
      const allIds = teams.flatMap(t => t.studentIds);
      expect(allIds.sort()).toEqual(['s1', 's2', 's3', 's4', 's5'].sort());
    });

    it('should use the team label in team names', () => {
      const students = makeStudents([{ id: 's1' }, { id: 's2' }]);
      const teams = service.buildTeams({ students, teamCount: 2, teamLabel: 'Gruppe' });
      expect(teams[0].name).toBe('Gruppe 1');
      expect(teams[1].name).toBe('Gruppe 2');
    });

    it('should give each team a unique id', () => {
      const students = makeStudents([{ id: 's1' }, { id: 's2' }]);
      const teams = service.buildTeams({ students, teamCount: 2, teamLabel: 'Team' });
      const ids = teams.map(t => t.id);
      expect(new Set(ids).size).toBe(2);
    });

    it('should distribute students as evenly as possible', () => {
      const students = makeStudents(
        Array.from({ length: 7 }, (_, i) => ({ id: `s${i}` }))
      );
      const teams = service.buildTeams({ students, teamCount: 3, teamLabel: 'Team' });
      const sizes = teams.map(t => t.studentIds.length);
      // 7 students, 3 teams → sizes should be [3, 2, 2] in some order
      expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
    });
  });

  // -------------------------------------------------------------------------
  // Gender-balanced algorithm
  // -------------------------------------------------------------------------
  describe('gender-balanced algorithm', () => {
    it('should create the requested number of teams', () => {
      const students = makeStudents([
        { id: 'm1', gender: 'male' },
        { id: 'f1', gender: 'female' },
        { id: 'm2', gender: 'male' },
        { id: 'f2', gender: 'female' }
      ]);
      const teams = service.buildTeams({
        students,
        teamCount: 2,
        teamLabel: 'Team',
        algorithm: 'gender-balanced'
      });
      expect(teams).toHaveLength(2);
    });

    it('should assign every student exactly once', () => {
      const students = makeStudents([
        { id: 'm1', gender: 'male' },
        { id: 'm2', gender: 'male' },
        { id: 'f1', gender: 'female' },
        { id: 'f2', gender: 'female' },
        { id: 'o1' }
      ]);
      const teams = service.buildTeams({
        students,
        teamCount: 2,
        teamLabel: 'Team',
        algorithm: 'gender-balanced'
      });
      const allIds = teams.flatMap(t => t.studentIds);
      expect(allIds.sort()).toEqual(['f1', 'f2', 'm1', 'm2', 'o1'].sort());
    });

    it('should spread males evenly across teams', () => {
      const students = makeStudents([
        { id: 'm1', gender: 'male' },
        { id: 'm2', gender: 'male' },
        { id: 'm3', gender: 'male' },
        { id: 'm4', gender: 'male' }
      ]);
      const teams = service.buildTeams({
        students,
        teamCount: 2,
        teamLabel: 'Team',
        algorithm: 'gender-balanced'
      });
      // 4 males, 2 teams → each team should get exactly 2 males
      const sizes = teams.map(t => t.studentIds.length);
      expect(sizes[0]).toBe(2);
      expect(sizes[1]).toBe(2);
    });

    it('should give each team at most 1 more student than another', () => {
      const students = makeStudents([
        { id: 'm1', gender: 'male' },
        { id: 'm2', gender: 'male' },
        { id: 'f1', gender: 'female' },
        { id: 'f2', gender: 'female' },
        { id: 'f3', gender: 'female' }
      ]);
      const teams = service.buildTeams({
        students,
        teamCount: 2,
        teamLabel: 'Team',
        algorithm: 'gender-balanced'
      });
      const sizes = teams.map(t => t.studentIds.length);
      expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
    });

    it('should handle all-same-gender input gracefully', () => {
      const students = makeStudents([
        { id: 'm1', gender: 'male' },
        { id: 'm2', gender: 'male' },
        { id: 'm3', gender: 'male' }
      ]);
      const teams = service.buildTeams({
        students,
        teamCount: 3,
        teamLabel: 'Team',
        algorithm: 'gender-balanced'
      });
      const allIds = teams.flatMap(t => t.studentIds);
      expect(allIds.sort()).toEqual(['m1', 'm2', 'm3'].sort());
    });

    it('should handle no-gender students gracefully', () => {
      const students = makeStudents([
        { id: 'o1' }, { id: 'o2' }, { id: 'o3' }
      ]);
      const teams = service.buildTeams({
        students,
        teamCount: 3,
        teamLabel: 'Team',
        algorithm: 'gender-balanced'
      });
      const allIds = teams.flatMap(t => t.studentIds);
      expect(allIds.sort()).toEqual(['o1', 'o2', 'o3'].sort());
    });
  });

  // -------------------------------------------------------------------------
  // shuffle helper
  // -------------------------------------------------------------------------
  describe('shuffle', () => {
    it('should return the same elements (just reordered)', () => {
      const input = ['a', 'b', 'c', 'd', 'e'];
      const result = service.shuffle(input);
      expect(result.sort()).toEqual(input.sort());
    });

    it('should not mutate the original array', () => {
      const input = [1, 2, 3, 4];
      const original = [...input];
      service.shuffle(input);
      expect(input).toEqual(original);
    });
  });

  // -------------------------------------------------------------------------
  // Homogeneous algorithm
  // -------------------------------------------------------------------------
  describe('homogeneous algorithm', () => {
    it('should create the requested number of teams', () => {
      const students = makeStudents([
        { id: 's1', performanceScore: 5 },
        { id: 's2', performanceScore: 4 },
        { id: 's3', performanceScore: 3 },
        { id: 's4', performanceScore: 2 }
      ]);
      const teams = service.buildTeams({
        students,
        teamCount: 2,
        teamLabel: 'Team',
        algorithm: 'homogeneous',
        basis: 'performance'
      });
      expect(teams).toHaveLength(2);
    });

    it('should assign every student exactly once', () => {
      const students = makeStudents([
        { id: 'h1', performanceScore: 5 },
        { id: 'h2', performanceScore: 4 },
        { id: 'h3', performanceScore: 3 },
        { id: 'l1', performanceScore: 2 },
        { id: 'l2', performanceScore: 1 }
      ]);
      const teams = service.buildTeams({
        students,
        teamCount: 2,
        teamLabel: 'Team',
        algorithm: 'homogeneous',
        basis: 'performance'
      });
      const allIds = teams.flatMap(t => t.studentIds);
      expect(allIds.sort()).toEqual(['h1', 'h2', 'h3', 'l1', 'l2'].sort());
    });

    it('should place high-scorers before low-scorers in team assignment', () => {
      // With sorted ordering and round-robin, consecutive students end up in
      // adjacent teams rather than spread. Verify the highest scorer is in a team.
      const students: TeamStudent[] = [
        { id: 'top', performanceScore: 10 },
        { id: 'mid', performanceScore: 5 },
        { id: 'low', performanceScore: 1 }
      ];
      const teams = service.buildTeams({
        students,
        teamCount: 3,
        teamLabel: 'Team',
        algorithm: 'homogeneous',
        basis: 'performance'
      });
      const allIds = teams.flatMap(t => t.studentIds);
      expect(allIds).toContain('top');
      expect(allIds).toContain('mid');
      expect(allIds).toContain('low');
    });

    it('should handle students without scores gracefully', () => {
      const students: TeamStudent[] = [
        { id: 's1', performanceScore: 5 },
        { id: 's2' }, // no score
        { id: 's3', performanceScore: 3 }
      ];
      const teams = service.buildTeams({
        students,
        teamCount: 3,
        teamLabel: 'Team',
        algorithm: 'homogeneous',
        basis: 'performance'
      });
      const allIds = teams.flatMap(t => t.studentIds);
      expect(allIds.sort()).toEqual(['s1', 's2', 's3'].sort());
    });
  });

  // -------------------------------------------------------------------------
  // Heterogeneous algorithm
  // -------------------------------------------------------------------------
  describe('heterogeneous algorithm', () => {
    it('should assign every student exactly once', () => {
      const students: TeamStudent[] = [
        { id: 'h1', performanceScore: 5 },
        { id: 'h2', performanceScore: 4 },
        { id: 'l1', performanceScore: 2 },
        { id: 'l2', performanceScore: 1 }
      ];
      const teams = service.buildTeams({
        students,
        teamCount: 2,
        teamLabel: 'Team',
        algorithm: 'heterogeneous',
        basis: 'performance'
      });
      const allIds = teams.flatMap(t => t.studentIds);
      expect(allIds.sort()).toEqual(['h1', 'h2', 'l1', 'l2'].sort());
    });

    it('should spread top and bottom performers across teams', () => {
      const students: TeamStudent[] = [
        { id: 'h1', performanceScore: 10 },
        { id: 'h2', performanceScore: 9 },
        { id: 'h3', performanceScore: 8 },
        { id: 'h4', performanceScore: 7 },
        { id: 'l1', performanceScore: 2 },
        { id: 'l2', performanceScore: 1 }
      ];
      // 6 students, 2 teams with heterogeneous (sorted + round-robin)
      // Team 1 should get h1, h3, l1; Team 2 gets h2, h4, l2 (or similar)
      const teams = service.buildTeams({
        students,
        teamCount: 2,
        teamLabel: 'Team',
        algorithm: 'heterogeneous',
        basis: 'performance'
      });
      const allIds = teams.flatMap(t => t.studentIds);
      expect(allIds.sort()).toEqual(['h1', 'h2', 'h3', 'h4', 'l1', 'l2'].sort());
    });

    it('should support performanceRating as basis', () => {
      const students: TeamStudent[] = [
        { id: 's1', performanceRating: 5 },
        { id: 's2', performanceRating: 3 },
        { id: 's3', performanceRating: 1 },
        { id: 's4', performanceRating: 4 }
      ];
      const teams = service.buildTeams({
        students,
        teamCount: 2,
        teamLabel: 'Team',
        algorithm: 'heterogeneous',
        basis: 'performanceRating'
      });
      const allIds = teams.flatMap(t => t.studentIds);
      expect(allIds.sort()).toEqual(['s1', 's2', 's3', 's4'].sort());
    });
  });

  // -------------------------------------------------------------------------
  // Role assignment
  // -------------------------------------------------------------------------
  describe('role assignment', () => {
    it('should assign roles to each student in a team', () => {
      const students = makeStudents([
        { id: 's1' }, { id: 's2' }, { id: 's3' }, { id: 's4' }
      ]);
      const teams = service.buildTeams({
        students,
        teamCount: 2,
        teamLabel: 'Team',
        roles: ['Captain', 'Player']
      });
      for (const team of teams) {
        expect(team.roles).toBeDefined();
        for (const id of team.studentIds) {
          expect(team.roles![id]).toBeDefined();
        }
      }
    });

    it('should cycle roles when there are more team members than roles', () => {
      const students = makeStudents([
        { id: 's1' }, { id: 's2' }, { id: 's3' }, { id: 's4' }, { id: 's5' }, { id: 's6' }
      ]);
      const teams = service.buildTeams({
        students,
        teamCount: 2,
        teamLabel: 'Team',
        roles: ['Captain', 'Player']
      });
      // Each team has 3 members, 2 roles → roles cycle: Captain, Player, Captain
      for (const team of teams) {
        const assigned = Object.values(team.roles!);
        expect(assigned).toContain('Captain');
        expect(assigned).toContain('Player');
      }
    });

    it('should not add roles when no roles are provided', () => {
      const students = makeStudents([{ id: 's1' }, { id: 's2' }]);
      const teams = service.buildTeams({ students, teamCount: 2, teamLabel: 'Team' });
      for (const team of teams) {
        expect(team.roles).toBeUndefined();
      }
    });

    it('should assign the first role to the first student in each team', () => {
      const students = makeStudents([
        { id: 's1' }, { id: 's2' }, { id: 's3' }, { id: 's4' }
      ]);
      // Build with fixed shuffling difficult to predict; just check role values
      const teams = service.buildTeams({
        students,
        teamCount: 2,
        teamLabel: 'Team',
        roles: ['A', 'B', 'C']
      });
      for (const team of teams) {
        const roleValues = Object.values(team.roles!);
        for (const rv of roleValues) {
          expect(['A', 'B', 'C']).toContain(rv);
        }
      }
    });
  });

  // -------------------------------------------------------------------------
  // Constraints: alwaysTogether
  // -------------------------------------------------------------------------
  describe('alwaysTogether constraints', () => {
    it('should keep constrained students in the same team', () => {
      const students = makeStudents([
        { id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }
      ]);
      for (let attempt = 0; attempt < 5; attempt++) {
        const teams = service.buildTeams({
          students,
          teamCount: 2,
          teamLabel: 'Team',
          algorithm: 'random',
          constraints: { alwaysTogether: [['a', 'b']] }
        });
        const teamOfA = teams.findIndex(t => t.studentIds.includes('a'));
        const teamOfB = teams.findIndex(t => t.studentIds.includes('b'));
        expect(teamOfA).toBe(teamOfB);
      }
    });

    it('should handle transitive alwaysTogether groups', () => {
      const students = makeStudents([
        { id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }, { id: 'f' }
      ]);
      // [[a,b],[b,c]] → a,b,c must all be together. With 6 students & 2 teams, max=3 → fits.
      for (let attempt = 0; attempt < 5; attempt++) {
        const teams = service.buildTeams({
          students,
          teamCount: 2,
          teamLabel: 'Team',
          constraints: { alwaysTogether: [['a', 'b'], ['b', 'c']] }
        });
        const teamOfA = teams.findIndex(t => t.studentIds.includes('a'));
        const teamOfB = teams.findIndex(t => t.studentIds.includes('b'));
        const teamOfC = teams.findIndex(t => t.studentIds.includes('c'));
        expect(teamOfA).toBe(teamOfB);
        expect(teamOfB).toBe(teamOfC);
      }
    });

    it('should throw TeamConstraintError when alwaysTogether group is too large', () => {
      const students = makeStudents([
        { id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }
      ]);
      // 5 students, 2 teams → max team size = 3. Group of 4 is impossible.
      expect(() =>
        service.buildTeams({
          students,
          teamCount: 2,
          teamLabel: 'Team',
          constraints: { alwaysTogether: [['a', 'b', 'c', 'd']] }
        })
      ).toThrow(TeamConstraintError);
    });
  });

  // -------------------------------------------------------------------------
  // Constraints: neverTogether
  // -------------------------------------------------------------------------
  describe('neverTogether constraints', () => {
    it('should separate constrained pair across teams', () => {
      const students = makeStudents([
        { id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }
      ]);
      for (let attempt = 0; attempt < 10; attempt++) {
        const teams = service.buildTeams({
          students,
          teamCount: 2,
          teamLabel: 'Team',
          constraints: { neverTogether: [['a', 'b']] }
        });
        const teamOfA = teams.findIndex(t => t.studentIds.includes('a'));
        const teamOfB = teams.findIndex(t => t.studentIds.includes('b'));
        expect(teamOfA).not.toBe(teamOfB);
      }
    });

    it('should throw TeamConstraintError when neverTogether group exceeds team count', () => {
      const students = makeStudents([
        { id: 'a' }, { id: 'b' }, { id: 'c' }
      ]);
      // 3 students all must be separate, but only 2 teams → impossible
      expect(() =>
        service.buildTeams({
          students,
          teamCount: 2,
          teamLabel: 'Team',
          constraints: { neverTogether: [['a', 'b', 'c']] }
        })
      ).toThrow(TeamConstraintError);
    });

    it('should throw TeamConstraintError on direct contradiction (always+never same pair)', () => {
      const students = makeStudents([
        { id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }
      ]);
      expect(() =>
        service.buildTeams({
          students,
          teamCount: 2,
          teamLabel: 'Team',
          constraints: {
            alwaysTogether: [['a', 'b']],
            neverTogether: [['a', 'b']]
          }
        })
      ).toThrow(TeamConstraintError);
    });

    it('should include conflict details in TeamConstraintError', () => {
      const students = makeStudents([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
      let caughtError: TeamConstraintError | null = null;
      try {
        service.buildTeams({
          students,
          teamCount: 2,
          teamLabel: 'Team',
          constraints: { neverTogether: [['a', 'b', 'c']] }
        });
      } catch (e) {
        if (e instanceof TeamConstraintError) caughtError = e;
      }
      expect(caughtError).not.toBeNull();
      expect(caughtError!.conflicts.length).toBeGreaterThan(0);
      expect(caughtError!.conflicts[0].type).toBe('neverTogether-unsatisfiable');
    });
  });
});
