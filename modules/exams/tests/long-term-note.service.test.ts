/**
 * Long-Term Note Management Service Tests
 */

import {
  LongTermNoteManagementService,
  LongTermNoteUIHelper,
  CompetencyProgress,
  StudentGrowthAnalysis
} from '../src/services/long-term-note.service';
import type { StudentLongTermNote, DevelopmentNote, CompetencyArea } from '../repositories/student-long-term-note.repository';

describe('LongTermNoteManagementService', () => {
  let mockNote: StudentLongTermNote;

  beforeEach(() => {
    mockNote = {
      id: 'note-1',
      studentId: 'student-1',
      classGroupId: 'class-1',
      schoolYear: '2024-2025',
      competencyAreas: [
        {
          id: 'comp-1',
          name: 'Mathematical Problem Solving',
          description: 'Ability to solve complex math problems',
          assessmentCount: 2,
          trend: 'improving'
        }
      ],
      developmentNotes: [
        {
          id: 'dev-1',
          date: new Date('2024-01-15'),
          content: 'Great progress in algebra',
          category: 'achievement',
          relatedExamId: 'exam-1'
        }
      ],
      internalNotes: 'Student is progressing well',
      strengths: ['Logical thinking', 'Perseverance'],
      focusAreas: ['Geometry', 'Statistics'],
      lastReviewDate: new Date('2024-01-15'),
      createdAt: new Date('2024-01-01'),
      lastModified: new Date('2024-01-15')
    };
  });

  describe('createLongTermNote', () => {
    it('should create a new long-term note', () => {
      const result = LongTermNoteManagementService.createLongTermNote(
        'student-1',
        'class-1',
        '2024-2025'
      );

      expect(result.studentId).toBe('student-1');
      expect(result.classGroupId).toBe('class-1');
      expect(result.schoolYear).toBe('2024-2025');
      expect(result.competencyAreas).toEqual([]);
      expect(result.developmentNotes).toEqual([]);
      expect(result.createdAt).toBeDefined();
    });

    it('should initialize with provided options', () => {
      const result = LongTermNoteManagementService.createLongTermNote(
        'student-1',
        'class-1',
        '2024-2025',
        {
          strengths: ['Reading', 'Writing'],
          focusAreas: ['Math'],
          internalNotes: 'Test notes'
        }
      );

      expect(result.strengths).toEqual(['Reading', 'Writing']);
      expect(result.focusAreas).toEqual(['Math']);
      expect(result.internalNotes).toBe('Test notes');
    });
  });

  describe('addCompetency', () => {
    it('should add a new competency', () => {
      const result = LongTermNoteManagementService.addCompetency(
        mockNote,
        'Writing Skills',
        'Ability to write clear, coherent text'
      );

      expect(result.competencyAreas).toHaveLength(2);
      expect(result.competencyAreas[1].name).toBe('Writing Skills');
      expect(result.competencyAreas[1].trend).toBe('new');
      expect(result.competencyAreas[1].assessmentCount).toBe(0);
    });

    it('should update lastModified', () => {
      const before = mockNote.lastModified;
      const result = LongTermNoteManagementService.addCompetency(
        mockNote,
        'Writing Skills',
        'Ability to write clear text'
      );

      expect(result.lastModified.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });

  describe('recordCompetencyAssessment', () => {
    it('should record a competency assessment', () => {
      const result = LongTermNoteManagementService.recordCompetencyAssessment(
        mockNote,
        'comp-1',
        85,
        'exam-2'
      );

      const updatedComp = result.competencyAreas.find(c => c.id === 'comp-1');
      expect(updatedComp?.assessmentCount).toBe(3);
      expect(updatedComp?.lastAssessmentDate).toBeDefined();
    });

    it('should not affect other competencies', () => {
      const result = LongTermNoteManagementService.recordCompetencyAssessment(
        mockNote,
        'nonexistent',
        85
      );

      expect(result.competencyAreas).toHaveLength(1);
      expect(result.competencyAreas[0].assessmentCount).toBe(2);
    });
  });

  describe('addDevelopmentNote', () => {
    it('should add a new development note', () => {
      const result = LongTermNoteManagementService.addDevelopmentNote(
        mockNote,
        'Struggled with geometry concepts',
        'challenge'
      );

      expect(result.developmentNotes).toHaveLength(2);
      expect(result.developmentNotes[1].content).toBe('Struggled with geometry concepts');
      expect(result.developmentNotes[1].category).toBe('challenge');
    });

    it('should preserve existing notes', () => {
      const result = LongTermNoteManagementService.addDevelopmentNote(
        mockNote,
        'New achievement note',
        'achievement'
      );

      expect(result.developmentNotes[0]).toEqual(mockNote.developmentNotes[0]);
    });

    it('should handle different categories', () => {
      const achievement = LongTermNoteManagementService.addDevelopmentNote(
        mockNote,
        'Great test score',
        'achievement'
      );
      expect(achievement.developmentNotes[1].category).toBe('achievement');

      const observation = LongTermNoteManagementService.addDevelopmentNote(
        mockNote,
        'Student participates actively',
        'observation'
      );
      expect(observation.developmentNotes[1].category).toBe('observation');
    });
  });

  describe('updateDevelopmentNote', () => {
    it('should update an existing note', () => {
      const result = LongTermNoteManagementService.updateDevelopmentNote(
        mockNote,
        'dev-1',
        'Updated content'
      );

      const updated = result.developmentNotes.find(n => n.id === 'dev-1');
      expect(updated?.content).toBe('Updated content');
    });

    it('should change category if provided', () => {
      const result = LongTermNoteManagementService.updateDevelopmentNote(
        mockNote,
        'dev-1',
        'Same content',
        'challenge'
      );

      const updated = result.developmentNotes.find(n => n.id === 'dev-1');
      expect(updated?.category).toBe('challenge');
    });

    it('should not affect non-matching notes', () => {
      const result = LongTermNoteManagementService.updateDevelopmentNote(
        mockNote,
        'nonexistent',
        'New content'
      );

      expect(result.developmentNotes[0]).toEqual(mockNote.developmentNotes[0]);
    });
  });

  describe('removeDevelopmentNote', () => {
    it('should remove a development note', () => {
      const result = LongTermNoteManagementService.removeDevelopmentNote(
        mockNote,
        'dev-1'
      );

      expect(result.developmentNotes).toHaveLength(0);
    });

    it('should not affect other notes', () => {
      const withTwo = LongTermNoteManagementService.addDevelopmentNote(
        mockNote,
        'Second note',
        'observation'
      );

      const result = LongTermNoteManagementService.removeDevelopmentNote(
        withTwo,
        'dev-1'
      );

      expect(result.developmentNotes).toHaveLength(1);
      expect(result.developmentNotes[0].content).toBe('Second note');
    });
  });

  describe('getNotesByCategory', () => {
    it('should filter notes by category', () => {
      const withMore = [
        ...mockNote.developmentNotes,
        {
          id: 'dev-2',
          date: new Date(),
          content: 'Challenge note',
          category: 'challenge' as const
        },
        {
          id: 'dev-3',
          date: new Date(),
          content: 'Another achievement',
          category: 'achievement' as const
        }
      ];

      const note = { ...mockNote, developmentNotes: withMore };
      const achievements = LongTermNoteManagementService.getNotesByCategory(note, 'achievement');

      expect(achievements).toHaveLength(2);
      expect(achievements.every(n => n.category === 'achievement')).toBe(true);
    });

    it('should return empty array for missing category', () => {
      const result = LongTermNoteManagementService.getNotesByCategory(mockNote, 'support');

      expect(result).toHaveLength(0);
    });
  });

  describe('getRecentNotes', () => {
    it('should get notes from last N days', () => {
      const withMore = [
        mockNote.developmentNotes[0],
        {
          id: 'dev-2',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          content: 'Recent note',
          category: 'observation' as const
        },
        {
          id: 'dev-3',
          date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
          content: 'Old note',
          category: 'observation' as const
        }
      ];

      const note = { ...mockNote, developmentNotes: withMore };
      const recent = LongTermNoteManagementService.getRecentNotes(note, 30);

      expect(recent.length).toBe(1);
      expect(recent[0].content).toBe('Recent note');
    });
  });

  describe('updateStrengths', () => {
    it('should replace strengths', () => {
      const result = LongTermNoteManagementService.updateStrengths(
        mockNote,
        ['New Strength', 'Another One']
      );

      expect(result.strengths).toEqual(['New Strength', 'Another One']);
    });
  });

  describe('addStrength', () => {
    it('should add a new strength', () => {
      const result = LongTermNoteManagementService.addStrength(
        mockNote,
        'Creativity'
      );

      expect(result.strengths).toContain('Creativity');
      expect(result.strengths).toHaveLength(3);
    });

    it('should not add duplicate strengths', () => {
      const result = LongTermNoteManagementService.addStrength(
        mockNote,
        'Logical thinking'
      );

      expect(result.strengths).toEqual(mockNote.strengths);
    });
  });

  describe('calculateCompetencyProgress', () => {
    it('should calculate progress with multiple assessments', () => {
      const assessments = [
        { date: new Date('2024-01-01'), score: 70 },
        { date: new Date('2024-01-15'), score: 75 },
        { date: new Date('2024-02-01'), score: 82 }
      ];

      const result = LongTermNoteManagementService.calculateCompetencyProgress(
        mockNote.competencyAreas[0],
        assessments
      );

      expect(result.averageScore).toBeCloseTo((70 + 75 + 82) / 3, 1);
      expect(result.latestScore).toBe(82);
      expect(result.previousScore).toBe(75);
      expect(result.trendPercentage).toBeGreaterThan(0); // Improving
    });

    it('should identify improving trend', () => {
      const assessments = [
        { date: new Date('2024-01-01'), score: 60 },
        { date: new Date('2024-02-01'), score: 72 }
      ];

      const result = LongTermNoteManagementService.calculateCompetencyProgress(
        mockNote.competencyAreas[0],
        assessments
      );

      expect(result.trend).toBe('improving');
      expect(result.trendPercentage).toBeGreaterThan(5);
    });

    it('should identify declining trend', () => {
      const assessments = [
        { date: new Date('2024-01-01'), score: 80 },
        { date: new Date('2024-02-01'), score: 70 }
      ];

      const result = LongTermNoteManagementService.calculateCompetencyProgress(
        mockNote.competencyAreas[0],
        assessments
      );

      expect(result.trend).toBe('declining');
      expect(result.trendPercentage).toBeLessThan(-5);
    });

    it('should identify stable trend', () => {
      const assessments = [
        { date: new Date('2024-01-01'), score: 75 },
        { date: new Date('2024-02-01'), score: 76 }
      ];

      const result = LongTermNoteManagementService.calculateCompetencyProgress(
        mockNote.competencyAreas[0],
        assessments
      );

      expect(result.trend).toBe('stable');
    });

    it('should handle empty assessments', () => {
      const result = LongTermNoteManagementService.calculateCompetencyProgress(
        mockNote.competencyAreas[0],
        []
      );

      expect(result.averageScore).toBe(0);
      expect(result.latestScore).toBe(0);
      expect(result.trendPercentage).toBe(0);
    });
  });

  describe('identifyStudentsNeedingSupport', () => {
    it('should identify students with multiple focus areas', () => {
      const notes = [mockNote]; // Has 2 focus areas

      const result = LongTermNoteManagementService.identifyStudentsNeedingSupport(
        notes,
        { minFocusAreas: 2 }
      );

      expect(result).toHaveLength(1);
    });

    it('should identify students with challenges', () => {
      const withChallenge = {
        ...mockNote,
        developmentNotes: [
          ...mockNote.developmentNotes,
          {
            id: 'dev-challenge',
            date: new Date(),
            content: 'Struggles with retention',
            category: 'challenge' as const
          }
        ]
      };

      const result = LongTermNoteManagementService.identifyStudentsNeedingSupport(
        [withChallenge],
        { hasChallenges: true }
      );

      expect(result).toHaveLength(1);
    });

    it('should use default criteria if not provided', () => {
      const result = LongTermNoteManagementService.identifyStudentsNeedingSupport([mockNote]);

      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('generateProgressSummary', () => {
    it('should generate a text summary', () => {
      const growth: StudentGrowthAnalysis = {
        studentId: 'student-1',
        totalNotes: 1,
        competenciesTracked: 1,
        improvingCount: 1,
        stableCount: 0,
        decliningCount: 0,
        averageTrend: 5.5,
        strengths: ['Logical thinking'],
        focusAreas: ['Geometry'],
        recentAchievements: [{ achievement: 'Solved complex problem', date: new Date() }],
        recentChallenges: []
      };

      const result = LongTermNoteManagementService.generateProgressSummary(
        mockNote,
        growth
      );

      expect(result).toContain('Long-Term Development Summary');
      expect(result).toContain('2024-2025');
      expect(result).toContain('Logical thinking');
      expect(result).toContain('Geometry');
    });
  });
});

describe('LongTermNoteUIHelper', () => {
  describe('formatTrend', () => {
    it('should format improving trend', () => {
      const result = LongTermNoteUIHelper.formatTrend('improving');

      expect(result.icon).toBe('📈');
      expect(result.text).toBe('Improving');
      expect(result.color).toBe('#28a745');
    });

    it('should format declining trend', () => {
      const result = LongTermNoteUIHelper.formatTrend('declining');

      expect(result.icon).toBe('📉');
      expect(result.text).toBe('Declining');
      expect(result.color).toBe('#dc3545');
    });

    it('should format stable trend', () => {
      const result = LongTermNoteUIHelper.formatTrend('stable');

      expect(result.icon).toBe('➡️');
      expect(result.text).toBe('Stable');
      expect(result.color).toBe('#ffc107');
    });

    it('should format new trend', () => {
      const result = LongTermNoteUIHelper.formatTrend('new');

      expect(result.icon).toBe('🆕');
      expect(result.text).toBe('New');
      expect(result.color).toBe('#17a2b8');
    });
  });

  describe('getTrendColor', () => {
    it('should return green for positive trend', () => {
      expect(LongTermNoteUIHelper.getTrendColor(15)).toBe('#28a745');
    });

    it('should return light green for small positive', () => {
      expect(LongTermNoteUIHelper.getTrendColor(5)).toBe('#90ee90');
    });

    it('should return yellow for near zero', () => {
      expect(LongTermNoteUIHelper.getTrendColor(-5)).toBe('#ffc107');
    });

    it('should return red for negative trend', () => {
      expect(LongTermNoteUIHelper.getTrendColor(-15)).toBe('#dc3545');
    });
  });

  describe('formatCategory', () => {
    it('should format achievement category', () => {
      const result = LongTermNoteUIHelper.formatCategory('achievement');

      expect(result.icon).toBe('⭐');
      expect(result.label).toBe('Achievement');
    });

    it('should format challenge category', () => {
      const result = LongTermNoteUIHelper.formatCategory('challenge');

      expect(result.icon).toBe('⚠️');
      expect(result.label).toBe('Challenge');
    });

    it('should format support category', () => {
      const result = LongTermNoteUIHelper.formatCategory('support');

      expect(result.icon).toBe('🤝');
      expect(result.label).toBe('Support');
    });

    it('should format observation category', () => {
      const result = LongTermNoteUIHelper.formatCategory('observation');

      expect(result.icon).toBe('👀');
      expect(result.label).toBe('Observation');
    });
  });
});
