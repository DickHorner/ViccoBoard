/**
 * Exam Analysis & Difficulty Service Tests
 */

import {
  ExamAnalysisService,
  AnalysisUIHelper,
  DifficultyAnalysis,
  ExamStatistics,
  PointAdjustmentSuggestion
} from '../src/services/exam-analysis.service';
import { Exams } from '@viccoboard/core';

describe('ExamAnalysisService', () => {
  let mockExam: Exams.Exam;
  let mockCorrections: Exams.CorrectionEntry[];

  beforeEach(() => {
    // Create mock exam with 3 tasks
    mockExam = {
      id: 'exam-1',
      title: 'Math Test',
      gridId: 'grid-1',
      examType: 'simple' as const,
      createdAt: new Date(),
      lastModified: new Date(),
      status: 'active' as const,
      mode: Exams.ExamMode.Simple,
      printPresets: {},
      candidates: [],
      structure: {
        tasks: [
          {
            id: 'task-1',
            title: 'Algebra',
            points: 10,
            order: 1,
            instruction: 'Solve equations',
            parentId: undefined,
            children: [],
            type: 'main' as const
          },
          {
            id: 'task-2',
            title: 'Geometry',
            points: 15,
            order: 2,
            instruction: 'Calculate area',
            parentId: undefined,
            children: [],
            type: 'main' as const
          },
          {
            id: 'task-3',
            title: 'Statistics',
            points: 10,
            order: 3,
            instruction: 'Interpret data',
            parentId: undefined,
            children: [],
            type: 'main' as const
          }
        ]
      },
      gradingKey: {
        id: 'key-1',
        examId: 'exam-1',
        boundaries: [
          { percentage: 85, grade: '1' },
          { percentage: 70, grade: '2' },
          { percentage: 50, grade: '3' },
          { percentage: 20, grade: '4' }
        ],
        type: 'percentage' as const
      }
    } as unknown as Exams.Exam;

    // Create mock corrections for 5 candidates
    mockCorrections = [
      {
        id: 'corr-1',
        candidateId: 'student-1',
        examId: 'exam-1',
        taskScores: [
          { taskId: 'task-1', points: 10 },
          { taskId: 'task-2', points: 15 },
          { taskId: 'task-3', points: 10 }
        ],
        totalPoints: 35,
        percentageScore: 100,
        totalGrade: '1',
        comments: [],
        supportTips: [],
        lastModified: new Date(),
        status: 'completed' as const
      } as unknown as Exams.CorrectionEntry,
      {
        id: 'corr-2',
        candidateId: 'student-2',
        examId: 'exam-1',
        taskScores: [
          { taskId: 'task-1', points: 9 },
          { taskId: 'task-2', points: 13 },
          { taskId: 'task-3', points: 9 }
        ],
        totalPoints: 31,
        percentageScore: 88,
        totalGrade: '1',
        comments: [],
        supportTips: [],
        lastModified: new Date(),
        status: 'completed' as const
      } as unknown as Exams.CorrectionEntry,
      {
        id: 'corr-3',
        candidateId: 'student-3',
        examId: 'exam-1',
        taskScores: [
          { taskId: 'task-1', points: 8 },
          { taskId: 'task-2', points: 10 },
          { taskId: 'task-3', points: 7 }
        ],
        totalPoints: 25,
        percentageScore: 71,
        totalGrade: '2',
        comments: [],
        supportTips: [],
        lastModified: new Date(),
        status: 'completed' as const
      } as unknown as Exams.CorrectionEntry,
      {
        id: 'corr-4',
        candidateId: 'student-4',
        examId: 'exam-1',
        taskScores: [
          { taskId: 'task-1', points: 5 },
          { taskId: 'task-2', points: 8 },
          { taskId: 'task-3', points: 4 }
        ],
        totalPoints: 17,
        percentageScore: 49,
        totalGrade: '4',
        comments: [],
        supportTips: [],
        lastModified: new Date(),
        status: 'completed' as const
      } as unknown as Exams.CorrectionEntry,
      {
        id: 'corr-5',
        candidateId: 'student-5',
        examId: 'exam-1',
        taskScores: [
          { taskId: 'task-1', points: 7 },
          { taskId: 'task-2', points: 11 },
          { taskId: 'task-3', points: 6 }
        ],
        totalPoints: 24,
        percentageScore: 68,
        totalGrade: '2',
        comments: [],
        supportTips: [],
        lastModified: new Date(),
        status: 'completed' as const
      } as unknown as Exams.CorrectionEntry
    ];
  });

  describe('analyzeDifficulty', () => {
    it('should calculate correct difficulty metrics for a task', () => {
      const result = ExamAnalysisService.analyzeDifficulty('task-1', 'Algebra', 10, mockCorrections);

      expect(result.taskId).toBe('task-1');
      expect(result.taskTitle).toBe('Algebra');
      expect(result.maxPoints).toBe(10);
      expect(result.averageScore).toBe((10 + 9 + 8 + 5 + 7) / 5); // 7.8
      expect(result.difficultyIndex).toBeCloseTo(0.78, 1);
    });

    it('should identify critical scores (below 50%)', () => {
      const result = ExamAnalysisService.analyzeDifficulty('task-1', 'Algebra', 10, mockCorrections);
      expect(result.criticalCount).toBe(1); // Only student-4 with 5 points
    });

    it('should identify excellent scores (above 80%)', () => {
      const result = ExamAnalysisService.analyzeDifficulty('task-1', 'Algebra', 10, mockCorrections);
      expect(result.excellentCount).toBe(2); // Students with 10 and 9 points
    });

    it('should handle empty corrections gracefully', () => {
      const result = ExamAnalysisService.analyzeDifficulty('task-1', 'Algebra', 10, []);

      expect(result.averageScore).toBe(0);
      expect(result.medianScore).toBe(0);
      expect(result.difficultyIndex).toBe(0);
    });

    it('should calculate median correctly', () => {
      const result = ExamAnalysisService.analyzeDifficulty('task-2', 'Geometry', 15, mockCorrections);
      // Scores: 15, 13, 10, 8, 11 -> sorted: 8, 10, 11, 13, 15 -> median: 11
      expect(result.medianScore).toBe(11);
    });

    it('should calculate standard deviation', () => {
      const result = ExamAnalysisService.analyzeDifficulty('task-3', 'Statistics', 10, mockCorrections);
      expect(result.standardDeviation).toBeGreaterThan(0);
    });
  });

  describe('analyzeExamDifficulty', () => {
    it('should analyze all tasks in exam', () => {
      const result = ExamAnalysisService.analyzeExamDifficulty(mockExam, mockCorrections);

      expect(result.totalCandidates).toBe(5);
      expect(result.completedCount).toBe(5);
      expect(result.taskDifficulties).toHaveLength(3);
    });

    it('should calculate overall exam statistics', () => {
      const result = ExamAnalysisService.analyzeExamDifficulty(mockExam, mockCorrections);

      expect(result.averageScore).toBeGreaterThan(0);
      expect(result.medianScore).toBeGreaterThan(0);
      expect(result.standardDeviation).toBeGreaterThan(0);
      expect(result.minScore).toBeLessThanOrEqual(result.maxScore);
    });

    it('should build grade distribution', () => {
      const result = ExamAnalysisService.analyzeExamDifficulty(mockExam, mockCorrections);

      expect(result.gradeDistribution.size).toBeGreaterThan(0);
      expect(result.gradeDistribution.get('1')).toBe(2); // Two grade 1's
    });

    it('should filter out uncompleted corrections', () => {
      const inProgressCorrection = {
        id: 'corr-6',
        candidateId: 'student-6',
        examId: 'exam-1',
        taskScores: [],
        totalPoints: 0,
        percentageScore: 0,
        totalGrade: '5',
        comments: [],
        supportTips: [],
        lastModified: new Date(),
        status: 'in_progress' as const
      } as unknown as Exams.CorrectionEntry;

      const mixedCorrections = [...mockCorrections, inProgressCorrection];

      const result = ExamAnalysisService.analyzeExamDifficulty(mockExam, mixedCorrections);
      expect(result.completedCount).toBe(5); // Only completed ones
    });
  });

  describe('identifyOutliers', () => {
    it('should identify very difficult tasks', () => {
      const analysis = ExamAnalysisService.analyzeExamDifficulty(mockExam, mockCorrections);
      const outliers = ExamAnalysisService.identifyOutliers(analysis, 0.2);

      // Depending on the difficulty distribution, there may be outliers
      expect(outliers.veryDifficult).toBeDefined();
      expect(Array.isArray(outliers.veryDifficult)).toBe(true);
    });

    it('should identify very easy tasks', () => {
      const analysis = ExamAnalysisService.analyzeExamDifficulty(mockExam, mockCorrections);
      const outliers = ExamAnalysisService.identifyOutliers(analysis, 0.2);

      expect(outliers.veryEasy).toBeDefined();
      expect(Array.isArray(outliers.veryEasy)).toBe(true);
    });
  });

  describe('suggestPointAdjustments', () => {
    it('should return adjustment suggestions', () => {
      const result = ExamAnalysisService.suggestPointAdjustments(
        mockExam,
        mockCorrections,
        0.6
      );

      expect(result.currentDistribution).toBeDefined();
      expect(result.suggestedDistribution).toBeDefined();
      expect(result.adjustments).toBeDefined();
      expect(result.impactAnalysis).toBeDefined();
    });

    it('should maintain total points across adjustments', () => {
      const result = ExamAnalysisService.suggestPointAdjustments(
        mockExam,
        mockCorrections,
        0.6
      );

      const currentTotal = Object.values(result.currentDistribution).reduce((a, b) => (a as number) + (b as number), 0);
      const suggestedTotal = Object.values(result.suggestedDistribution).reduce((a, b) => (a as number) + (b as number), 0);

      expect(suggestedTotal).toBe(currentTotal);
    });

    it('should track grade impact', () => {
      const result = ExamAnalysisService.suggestPointAdjustments(
        mockExam,
        mockCorrections,
        0.6
      );

      expect(result.impactAnalysis.gradeShift).toBeDefined();
      expect(Array.isArray(result.impactAnalysis.affectedGrades)).toBe(true);
    });

    it('should provide reasons for adjustments', () => {
      const result = ExamAnalysisService.suggestPointAdjustments(
        mockExam,
        mockCorrections,
        0.6
      );

      for (const adjustment of result.adjustments) {
        expect(adjustment.reason).toBeDefined();
        expect(adjustment.reason.length).toBeGreaterThan(0);
      }
    });
  });

  describe('identifyStudentsAtRisk', () => {
    it('should identify students below threshold', () => {
      const result = ExamAnalysisService.identifyStudentsAtRisk(mockCorrections, 50);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should classify risk levels correctly', () => {
      const result = ExamAnalysisService.identifyStudentsAtRisk(mockCorrections, 75);

      for (const student of result) {
        expect(['critical', 'warning', 'ok']).toContain(student.riskLevel);
      }
    });

    it('should sort by percentage ascending', () => {
      const result = ExamAnalysisService.identifyStudentsAtRisk(mockCorrections, 50);

      for (let i = 1; i < result.length; i++) {
        expect(result[i].percentage).toBeGreaterThanOrEqual(result[i - 1].percentage);
      }
    });

    it('should calculate critical threshold as 70% of target', () => {
      const result = ExamAnalysisService.identifyStudentsAtRisk(mockCorrections, 100);

      // Critical = < 70, Warning = 70-100, OK = >= 100
      const critical = result.filter((r: { riskLevel: string }) => r.riskLevel === 'critical');
      const warning = result.filter((r: { riskLevel: string }) => r.riskLevel === 'warning');

      for (const c of critical) {
        expect(c.percentage).toBeLessThan(70);
      }
      for (const w of warning) {
        expect(w.percentage).toBeGreaterThanOrEqual(70);
        expect(w.percentage).toBeLessThan(100);
      }
    });
  });

  describe('calculateTaskVariance', () => {
    it('should calculate variance for each task', () => {
      const result = ExamAnalysisService.calculateTaskVariance(mockCorrections, mockExam);

      expect(result.size).toBe(3);
      expect(result.has('task-1')).toBe(true);
      expect(result.has('task-2')).toBe(true);
      expect(result.has('task-3')).toBe(true);
    });

    it('should return non-negative variance values', () => {
      const result = ExamAnalysisService.calculateTaskVariance(mockCorrections, mockExam);

      for (const [taskId, variance] of result) {
        expect(variance).toBeGreaterThanOrEqual(0);
      }
    });

    it('should return 0 for tasks with no scores', () => {
      const emptyCorrections = mockCorrections.map(c => ({
        ...c,
        taskScores: []
      })) as Exams.CorrectionEntry[];

      const result = ExamAnalysisService.calculateTaskVariance(emptyCorrections, mockExam);

      for (const [taskId, variance] of result) {
        expect(variance).toBe(0);
      }
    });

    it('should calculate higher variance for more dispersed scores', () => {
      // Task with consistent scores should have lower variance
      // Task with spread-out scores should have higher variance
      const result = ExamAnalysisService.calculateTaskVariance(mockCorrections, mockExam);

      expect(result.get('task-2')).toBeGreaterThan(0);
    });
  });
});

describe('AnalysisUIHelper', () => {
  describe('formatDifficultyText', () => {
    it('should format very difficult (< 0.3)', () => {
      expect(AnalysisUIHelper.formatDifficultyText(0.2)).toBe('Very Difficult');
    });

    it('should format difficult (0.3-0.5)', () => {
      expect(AnalysisUIHelper.formatDifficultyText(0.4)).toBe('Difficult');
    });

    it('should format moderate (0.5-0.7)', () => {
      expect(AnalysisUIHelper.formatDifficultyText(0.6)).toBe('Moderate');
    });

    it('should format easy (0.7-0.85)', () => {
      expect(AnalysisUIHelper.formatDifficultyText(0.8)).toBe('Easy');
    });

    it('should format very easy (> 0.85)', () => {
      expect(AnalysisUIHelper.formatDifficultyText(0.9)).toBe('Very Easy');
    });
  });

  describe('getDifficultyColor', () => {
    it('should return red for very difficult', () => {
      expect(AnalysisUIHelper.getDifficultyColor(0.2)).toBe('#dc3545');
    });

    it('should return orange for difficult', () => {
      expect(AnalysisUIHelper.getDifficultyColor(0.4)).toBe('#ff9800');
    });

    it('should return yellow for moderate', () => {
      expect(AnalysisUIHelper.getDifficultyColor(0.6)).toBe('#ffc107');
    });

    it('should return light green for easy', () => {
      expect(AnalysisUIHelper.getDifficultyColor(0.8)).toBe('#90ee90');
    });

    it('should return green for very easy', () => {
      expect(AnalysisUIHelper.getDifficultyColor(0.9)).toBe('#28a745');
    });
  });

  describe('formatRiskLevel', () => {
    it('should format critical risk', () => {
      expect(AnalysisUIHelper.formatRiskLevel('critical')).toContain('Critical');
      expect(AnalysisUIHelper.formatRiskLevel('critical')).toContain('🚨');
    });

    it('should format warning risk', () => {
      expect(AnalysisUIHelper.formatRiskLevel('warning')).toContain('Warning');
      expect(AnalysisUIHelper.formatRiskLevel('warning')).toContain('⚠️');
    });

    it('should format ok risk', () => {
      expect(AnalysisUIHelper.formatRiskLevel('ok')).toContain('OK');
      expect(AnalysisUIHelper.formatRiskLevel('ok')).toContain('✅');
    });

    it('should handle unknown risk level', () => {
      expect(AnalysisUIHelper.formatRiskLevel('unknown')).toContain('Unknown');
    });
  });
});
