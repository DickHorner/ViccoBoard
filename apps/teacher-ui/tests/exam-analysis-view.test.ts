import { describe, expect, it, jest } from '@jest/globals';
import type { Exams } from '@viccoboard/core';

jest.mock('@viccoboard/exams', () => ({
  AnalysisUIHelper: {
    formatDifficultyText: () => 'Moderate',
    getDifficultyColor: () => '#ffc107'
  },
  ExamAnalysisService: {
    analyzeExamDifficulty: () => ({
      totalCandidates: 0,
      completedCount: 0,
      averageScore: 0,
      medianScore: 0,
      standardDeviation: 0,
      minScore: 0,
      maxScore: 0,
      gradeDistribution: new Map(),
      taskDifficulties: []
    }),
    identifyOutliers: () => ({ veryDifficult: [], veryEasy: [] }),
    identifyStudentsAtRisk: () => [],
    calculateTaskVariance: () => new Map(),
    suggestPointAdjustments: () => ({
      currentDistribution: {},
      suggestedDistribution: {},
      adjustments: [],
      impactAnalysis: { affectedGrades: [], gradeShift: 0 }
    })
  },
  getCorrectionRelevantTaskNodes: (tasks: Array<{ subtasks?: string[] }>) =>
    tasks.filter((task) => !task.subtasks || task.subtasks.length === 0)
}), { virtual: true });

import { useExamAnalysisView } from '../src/composables/useExamAnalysisView';

function createTask(
  id: string,
  title: string,
  points: number,
  order: number,
  parentId?: string,
  level: 1 | 2 = 1
): Exams.TaskNode {
  return {
    id,
    parentId,
    level,
    order,
    title,
    points,
    isChoice: false,
    criteria: [],
    allowComments: true,
    allowSupportTips: true,
    commentBoxEnabled: true,
    subtasks: []
  };
}

function withMutedVueLifecycleWarning<T>(callback: () => T): T {
  const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  try {
    return callback();
  } finally {
    warnSpy.mockRestore();
  }
}

const exam: Exams.Exam = {
  id: 'exam-1',
  title: 'Analysis Sort Test',
  assessmentFormat: 'test',
  mode: 'complex' as Exams.ExamMode,
  structure: {
    parts: [],
    tasks: [
      { ...createTask('root', 'Teil A', 30, 1), subtasks: ['task-a', 'task-b'] },
      createTask('task-a', 'Analyse', 10, 1, 'root', 2),
      createTask('task-b', 'Transfer', 20, 2, 'root', 2)
    ],
    allowsComments: true,
    allowsSupportTips: true,
    totalPoints: 30
  },
  gradingKey: {
    id: 'grading-key-1',
    name: 'Percentage',
    type: 'percentage' as Exams.GradingKeyType,
    totalPoints: 30,
    gradeBoundaries: [],
    roundingRule: { type: 'nearest', decimalPlaces: 1 },
    errorPointsToGrade: false,
    customizable: true,
    modifiedAfterCorrection: false
  },
  printPresets: [],
  candidates: [
    { id: 'candidate-1', examId: 'exam-1', firstName: 'Bob', lastName: 'Bach' },
    { id: 'candidate-2', examId: 'exam-1', firstName: 'Ada', lastName: 'Albers' },
    { id: 'candidate-3', examId: 'exam-1', firstName: 'Clara', lastName: 'Cohn' }
  ],
  candidateGroups: [],
  status: 'in-progress',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  lastModified: new Date('2026-01-01T00:00:00Z')
};

const corrections: Exams.CorrectionEntry[] = [
  {
    id: 'correction-1',
    examId: 'exam-1',
    candidateId: 'candidate-1',
    taskScores: [
      { taskId: 'task-a', points: 5, maxPoints: 10, timestamp: new Date() },
      { taskId: 'task-b', points: 10, maxPoints: 20, timestamp: new Date() }
    ],
    totalPoints: 15,
    totalGrade: '4',
    percentageScore: 50,
    comments: [],
    supportTips: [],
    status: 'completed',
    lastModified: new Date()
  },
  {
    id: 'correction-2',
    examId: 'exam-1',
    candidateId: 'candidate-2',
    taskScores: [
      { taskId: 'task-a', points: 9, maxPoints: 10, timestamp: new Date() },
      { taskId: 'task-b', points: 16, maxPoints: 20, timestamp: new Date() }
    ],
    totalPoints: 25,
    totalGrade: '2',
    percentageScore: 83.33,
    comments: [],
    supportTips: [],
    status: 'completed',
    lastModified: new Date()
  },
  {
    id: 'correction-3',
    examId: 'exam-1',
    candidateId: 'candidate-3',
    taskScores: [
      { taskId: 'task-a', points: 1, maxPoints: 10, timestamp: new Date() },
      { taskId: 'task-b', points: 9, maxPoints: 20, timestamp: new Date() }
    ],
    totalPoints: 10,
    totalGrade: '5',
    percentageScore: 33.33,
    comments: [],
    supportTips: [],
    status: 'completed',
    lastModified: new Date()
  }
];

describe('useExamAnalysisView result sorting (#326)', () => {
  it('exposes correction-relevant subtasks as result columns', () => {
    withMutedVueLifecycleWarning(() => {
      const view = useExamAnalysisView({ exam, corrections, candidates: exam.candidates });

      expect(view.resultTasks.value.map((task) => task.id)).toEqual(['task-a', 'task-b']);
    });
  });

  it('sorts results by correction order, name, total points and subtask points', () => {
    withMutedVueLifecycleWarning(() => {
      const view = useExamAnalysisView({ exam, corrections, candidates: exam.candidates });

      expect(view.sortedResults.value.map((row) => row.correction.candidateId)).toEqual([
        'candidate-1',
        'candidate-2',
        'candidate-3'
      ]);

      view.sortResultsBy('name');
      expect(view.sortedResults.value.map((row) => row.correction.candidateId)).toEqual([
        'candidate-2',
        'candidate-1',
        'candidate-3'
      ]);

      view.sortResultsBy('totalPoints');
      expect(view.sortedResults.value.map((row) => row.correction.candidateId)).toEqual([
        'candidate-2',
        'candidate-1',
        'candidate-3'
      ]);

      view.sortResultsBy('task-b');
      expect(view.sortedResults.value.map((row) => row.correction.candidateId)).toEqual([
        'candidate-2',
        'candidate-1',
        'candidate-3'
      ]);
    });
  });
});
