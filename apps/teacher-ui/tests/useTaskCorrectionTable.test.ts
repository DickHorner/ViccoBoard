import { describe, expect, it } from '@jest/globals';
import { ref } from 'vue';
import type { Exams } from '@viccoboard/core';

import { useTaskCorrectionTable } from '../src/composables/useTaskCorrectionTable';

function createCandidate(id: string, firstName: string, lastName: string): Exams.Candidate {
  return { id, examId: 'exam-1', firstName, lastName };
}

function createTask(id: string, title: string, points: number, order: number): Exams.TaskNode {
  return {
    id,
    level: 1,
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

function createCorrection(
  candidateId: string,
  taskScores: Exams.TaskScore[],
  status: Exams.CorrectionEntry['status'] = 'in-progress'
): Exams.CorrectionEntry {
  return {
    id: `correction-${candidateId}`,
    examId: 'exam-1',
    candidateId,
    taskScores,
    totalPoints: taskScores.reduce((sum, score) => sum + score.points, 0),
    totalGrade: '4',
    percentageScore: 50,
    comments: [],
    supportTips: [],
    status,
    lastModified: new Date('2026-01-01T00:00:00Z')
  };
}

const candidates = [
  createCandidate('candidate-b', 'Bob', 'Bach'),
  createCandidate('candidate-a', 'Ada', 'Albers'),
  createCandidate('candidate-c', 'Clara', 'Cohn')
];

const tasks = [
  createTask('task-a', 'Analyse', 10, 1),
  createTask('task-b', 'Transfer', 20, 2)
];

describe('useTaskCorrectionTable (#20)', () => {
  it('hydrates task rows and sorts by candidate and points', () => {
    const corrections = ref(new Map<string, Exams.CorrectionEntry>([
      ['candidate-b', createCorrection('candidate-b', [
        { taskId: 'task-a', points: 5, maxPoints: 10, comment: 'solide', timestamp: new Date('2026-01-02T10:00:00Z') }
      ])],
      ['candidate-a', createCorrection('candidate-a', [
        { taskId: 'task-a', points: 9, maxPoints: 10, comment: 'präzise', timestamp: new Date('2026-01-03T10:00:00Z') }
      ], 'completed')]
    ]));

    const table = useTaskCorrectionTable({
      candidates: ref(candidates),
      corrections,
      tasks: ref(tasks)
    });

    table.ensureSelectedTask();

    expect(table.selectedTaskId.value).toBe('task-a');
    expect(table.rows.value.map((row) => row.candidate.id)).toEqual([
      'candidate-a',
      'candidate-b',
      'candidate-c'
    ]);
    expect(table.rows.value.map((row) => row.draft.points)).toEqual([9, 5, 0]);
    expect(table.rows.value.map((row) => row.status)).toEqual(['completed', 'in-progress', 'not-started']);

    table.sortBy('points');

    expect(table.rows.value.map((row) => row.candidate.id)).toEqual([
      'candidate-a',
      'candidate-b',
      'candidate-c'
    ]);
  });

  it('offers reusable task comments only from other candidates', () => {
    const corrections = ref(new Map<string, Exams.CorrectionEntry>([
      ['candidate-b', createCorrection('candidate-b', [
        { taskId: 'task-a', points: 5, maxPoints: 10, comment: 'Ansatz stimmt', timestamp: new Date('2026-01-02T10:00:00Z') }
      ])],
      ['candidate-a', createCorrection('candidate-a', [
        { taskId: 'task-a', points: 9, maxPoints: 10, comment: 'Saubere Begründung', timestamp: new Date('2026-01-03T10:00:00Z') }
      ])]
    ]));

    const table = useTaskCorrectionTable({
      candidates: ref(candidates),
      corrections,
      tasks: ref(tasks)
    });

    table.ensureSelectedTask();

    expect(table.commentSuggestionsForCandidate('candidate-a').map((comment) => comment.text)).toEqual([
      'Ansatz stimmt'
    ]);
    expect(table.commentSuggestionsForCandidate('candidate-c').map((comment) => comment.text)).toEqual([
      'Saubere Begründung',
      'Ansatz stimmt'
    ]);

    table.applyReusableComment('candidate-c', 'Ansatz stimmt');

    expect(table.drafts.value['candidate-c'].comment).toBe('Ansatz stimmt');
  });
});
