/**
 * SaveTeamAssignmentUseCase Tests
 * Verifies team session persistence via ToolSessionRepository.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SaveTeamAssignmentUseCase } from '../src/use-cases/save-team-assignment.use-case';
import { ToolSessionRepository } from '../src/repositories/tool-session.repository';
import { SQLiteStorage } from '@viccoboard/storage/node';
import { InitialSchemaMigration, GradingSchemaMigration, ToolSessionsSchemaMigration } from '@viccoboard/storage/node';
import type { StorageAdapter } from '@viccoboard/storage/node';

describe('SaveTeamAssignmentUseCase', () => {
  let storage: SQLiteStorage;
  let repository: ToolSessionRepository;
  let useCase: SaveTeamAssignmentUseCase;
  let adapter: StorageAdapter;

  const createClassGroup = async (adapterInstance: StorageAdapter, id: string) => {
    const now = new Date().toISOString();
    await adapterInstance.insert('class_groups', {
      id,
      name: `Class ${id}`,
      school_year: '2024/25',
      color: null,
      archived: 0,
      state: null,
      holiday_calendar_ref: null,
      grading_scheme: null,
      subject_profile: null,
      created_at: now,
      last_modified: now
    });
  };

  const createLesson = async (
    adapterInstance: StorageAdapter,
    id: string,
    classGroupId: string
  ) => {
    const now = new Date().toISOString();
    await adapterInstance.insert('lessons', {
      id,
      class_group_id: classGroupId,
      date: '2025-01-01',
      random_student_seed: null,
      created_at: now,
      last_modified: now
    });
  };

  beforeEach(async () => {
    storage = new SQLiteStorage({ databasePath: ':memory:', memory: true });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    storage.registerMigration(new GradingSchemaMigration(storage));
    storage.registerMigration(new ToolSessionsSchemaMigration(storage));
    await storage.migrate();

    adapter = storage.getAdapter();
    repository = new ToolSessionRepository(adapter);
    useCase = new SaveTeamAssignmentUseCase(repository);
  });

  afterEach(async () => {
    if (storage) {
      await storage.close();
    }
  });

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------
  describe('validation', () => {
    it('should throw when classGroupId is missing', async () => {
      await expect(
        useCase.execute({
          classGroupId: '',
          sessionName: 'Test',
          algorithm: 'random',
          teamLabel: 'Team',
          teams: [{ id: 'team-1', name: 'Team 1', studentIds: ['s1'] }]
        })
      ).rejects.toThrow('classGroupId is required');
    });

    it('should throw when teams array is empty', async () => {
      await createClassGroup(adapter, 'class-1');
      await expect(
        useCase.execute({
          classGroupId: 'class-1',
          sessionName: 'Test',
          algorithm: 'random',
          teamLabel: 'Team',
          teams: []
        })
      ).rejects.toThrow('teams must not be empty');
    });

    it('should throw when sessionName is blank', async () => {
      await createClassGroup(adapter, 'class-1');
      await expect(
        useCase.execute({
          classGroupId: 'class-1',
          sessionName: '   ',
          algorithm: 'random',
          teamLabel: 'Team',
          teams: [{ id: 'team-1', name: 'Team 1', studentIds: ['s1'] }]
        })
      ).rejects.toThrow('sessionName is required');
    });
  });

  // -------------------------------------------------------------------------
  // Persistence
  // -------------------------------------------------------------------------
  describe('persistence', () => {
    it('should persist a team session with toolType "teams"', async () => {
      await createClassGroup(adapter, 'class-1');

      const result = await useCase.execute({
        classGroupId: 'class-1',
        sessionName: 'Volleyball 14.03.',
        algorithm: 'random',
        teamLabel: 'Team',
        teams: [
          { id: 'team-1', name: 'Team 1', studentIds: ['s1', 's2'] },
          { id: 'team-2', name: 'Team 2', studentIds: ['s3', 's4'] }
        ]
      });

      expect(result.toolType).toBe('teams');
      expect(result.classGroupId).toBe('class-1');
      expect(result.sessionMetadata.sessionName).toBe('Volleyball 14.03.');
      expect(result.sessionMetadata.algorithm).toBe('random');
      expect(result.sessionMetadata.teams).toHaveLength(2);
    });

    it('should store team member IDs in sessionMetadata', async () => {
      await createClassGroup(adapter, 'class-1');

      const result = await useCase.execute({
        classGroupId: 'class-1',
        sessionName: 'Soccer',
        algorithm: 'gender-balanced',
        teamLabel: 'Gruppe',
        teams: [
          { id: 'team-1', name: 'Gruppe 1', studentIds: ['alice', 'bob'] }
        ]
      });

      expect(result.sessionMetadata.teams[0].studentIds).toEqual(['alice', 'bob']);
      expect(result.sessionMetadata.teamLabel).toBe('Gruppe');
    });

    it('should be retrievable via ToolSessionRepository.findByClassGroup', async () => {
      await createClassGroup(adapter, 'class-1');

      await useCase.execute({
        classGroupId: 'class-1',
        sessionName: 'Basketball',
        algorithm: 'random',
        teamLabel: 'Team',
        teams: [{ id: 'team-1', name: 'Team 1', studentIds: ['s1'] }]
      });

      const sessions = await repository.findByClassGroup('class-1');
      const teamSessions = sessions.filter(s => s.toolType === 'teams');
      expect(teamSessions).toHaveLength(1);
      expect(teamSessions[0].sessionMetadata.sessionName).toBe('Basketball');
    });

    it('should accept optional lessonId', async () => {
      await createClassGroup(adapter, 'class-1');
      await createLesson(adapter, 'lesson-1', 'class-1');

      const result = await useCase.execute({
        classGroupId: 'class-1',
        lessonId: 'lesson-1',
        sessionName: 'Handball',
        algorithm: 'random',
        teamLabel: 'Team',
        teams: [{ id: 'team-1', name: 'Team 1', studentIds: ['s1'] }]
      });

      expect(result.lessonId).toBe('lesson-1');
    });

    it('should trim whitespace from sessionName', async () => {
      await createClassGroup(adapter, 'class-1');

      const result = await useCase.execute({
        classGroupId: 'class-1',
        sessionName: '  Badminton  ',
        algorithm: 'random',
        teamLabel: 'Team',
        teams: [{ id: 'team-1', name: 'Team 1', studentIds: ['s1'] }]
      });

      expect(result.sessionMetadata.sessionName).toBe('Badminton');
    });

    it('should persist multiple sessions for the same class', async () => {
      await createClassGroup(adapter, 'class-1');

      await useCase.execute({
        classGroupId: 'class-1',
        sessionName: 'Session A',
        algorithm: 'random',
        teamLabel: 'Team',
        teams: [{ id: 'team-1', name: 'Team 1', studentIds: ['s1'] }]
      });
      await useCase.execute({
        classGroupId: 'class-1',
        sessionName: 'Session B',
        algorithm: 'gender-balanced',
        teamLabel: 'Team',
        teams: [{ id: 'team-1', name: 'Team 1', studentIds: ['s2'] }]
      });

      const sessions = await repository.findByClassGroup('class-1');
      const teamSessions = sessions.filter(s => s.toolType === 'teams');
      expect(teamSessions).toHaveLength(2);
    });
  });
});
