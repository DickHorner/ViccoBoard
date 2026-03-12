/**
 * TeamBuilderService Tests
 * Verifies team generation algorithms: random and gender-balanced.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { TeamBuilderService } from '../src/services/team-builder.service';

const makeStudents = (specs: Array<{ id: string; gender?: string }>) =>
  specs.map(s => ({ id: s.id, gender: s.gender }));

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
});
