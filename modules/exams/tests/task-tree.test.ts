import { Exams } from '@viccoboard/core';
import {
  getCorrectionRelevantTaskNodes,
  getRootTaskNodes,
  getTotalRootTaskPoints
} from '../src/utils/task-tree';

describe('task tree helpers', () => {
  const tasks: Exams.TaskNode[] = [
    {
      id: 'task-1',
      level: 1,
      order: 1,
      title: 'Aufgabe 1',
      points: 10,
      isChoice: false,
      criteria: [],
      allowComments: true,
      allowSupportTips: false,
      commentBoxEnabled: false,
      subtasks: ['task-1a', 'task-1b']
    },
    {
      id: 'task-1a',
      parentId: 'task-1',
      level: 2,
      order: 1,
      title: 'Aufgabe 1a',
      points: 4,
      isChoice: false,
      criteria: [],
      allowComments: true,
      allowSupportTips: false,
      commentBoxEnabled: false,
      subtasks: []
    },
    {
      id: 'task-1b',
      parentId: 'task-1',
      level: 2,
      order: 2,
      title: 'Aufgabe 1b',
      points: 6,
      isChoice: false,
      criteria: [],
      allowComments: true,
      allowSupportTips: false,
      commentBoxEnabled: false,
      subtasks: []
    },
    {
      id: 'task-2',
      level: 1,
      order: 2,
      title: 'Aufgabe 2',
      points: 8,
      isChoice: false,
      criteria: [],
      allowComments: true,
      allowSupportTips: false,
      commentBoxEnabled: false,
      subtasks: []
    }
  ];

  it('returns only root tasks for total calculations', () => {
    expect(getRootTaskNodes(tasks).map((task) => task.id)).toEqual(['task-1', 'task-2']);
    expect(getTotalRootTaskPoints(tasks)).toBe(18);
  });

  it('returns only leaf tasks for correction-relevant scoring', () => {
    expect(getCorrectionRelevantTaskNodes(tasks).map((task) => task.id)).toEqual([
      'task-1a',
      'task-1b',
      'task-2'
    ]);
  });
});
