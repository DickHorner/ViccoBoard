import { Exams } from '@viccoboard/core';

function getChildrenMap(tasks: Exams.TaskNode[]): Map<string, Exams.TaskNode[]> {
  const byParent = new Map<string, Exams.TaskNode[]>();

  for (const task of tasks) {
    if (!task.parentId) {
      continue;
    }

    const siblings = byParent.get(task.parentId) ?? [];
    siblings.push(task);
    byParent.set(task.parentId, siblings);
  }

  for (const siblings of byParent.values()) {
    siblings.sort((left, right) => left.order - right.order);
  }

  return byParent;
}

export function getRootTaskNodes(tasks: Exams.TaskNode[]): Exams.TaskNode[] {
  return [...tasks]
    .filter((task) => !task.parentId)
    .sort((left, right) => left.order - right.order);
}

export function getCorrectionRelevantTaskNodes(tasks: Exams.TaskNode[]): Exams.TaskNode[] {
  const childrenByParent = getChildrenMap(tasks);
  const orderedLeaves: Exams.TaskNode[] = [];

  const visit = (task: Exams.TaskNode): void => {
    const children = childrenByParent.get(task.id) ?? [];
    if (children.length === 0) {
      orderedLeaves.push(task);
      return;
    }

    children.forEach(visit);
  };

  getRootTaskNodes(tasks).forEach(visit);
  return orderedLeaves;
}

export function getTotalRootTaskPoints(tasks: Exams.TaskNode[]): number {
  return getRootTaskNodes(tasks).reduce((sum, task) => sum + task.points, 0);
}
