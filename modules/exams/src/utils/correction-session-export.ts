import { Exams } from '@viccoboard/core';

import { getCorrectionRelevantTaskNodes, getRootTaskNodes } from './task-tree.js';

export interface CorrectionSessionReferenceMaps {
  examRef: string;
  partRefById: Record<string, string>;
  partIdByRef: Record<string, string>;
  taskRefById: Record<string, string>;
  taskIdByRef: Record<string, string>;
  scoringUnitRefByInternalKey: Record<string, string>;
  scoringUnitKeyByRef: Record<string, string>;
}

type ScoringTaskSelection = Exams.CorrectionSessionRules['taskSelection'];

function sanitizeReferenceToken(value: string, fallback: string): string {
  const normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || fallback;
}

function buildChildrenMap(tasks: Exams.TaskNode[]): Map<string, Exams.TaskNode[]> {
  const childrenByParent = new Map<string, Exams.TaskNode[]>();

  for (const task of tasks) {
    if (!task.parentId) {
      continue;
    }

    const siblings = childrenByParent.get(task.parentId) ?? [];
    siblings.push(task);
    childrenByParent.set(task.parentId, siblings);
  }

  for (const siblings of childrenByParent.values()) {
    siblings.sort((left, right) => left.order - right.order);
  }

  return childrenByParent;
}

function resolveScoringTasks(
  tasks: Exams.TaskNode[],
  selection: ScoringTaskSelection
): Exams.TaskNode[] {
  switch (selection) {
    case 'all-nodes':
      return [...tasks].sort((left, right) => {
        if (left.level !== right.level) {
          return left.level - right.level;
        }

        return left.order - right.order;
      });
    case 'mapped-only':
    case 'leaf-only':
    default:
      return getCorrectionRelevantTaskNodes(tasks);
  }
}

function stripFormattingWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function resolveTaskPartId(
  task: Exams.TaskNode,
  tasksById: Map<string, Exams.TaskNode>,
  rootPartByTaskId: Map<string, string>
): string | undefined {
  let current: Exams.TaskNode | undefined = task;

  while (current) {
    const partId = rootPartByTaskId.get(current.id);
    if (partId) {
      return partId;
    }

    current = current.parentId ? tasksById.get(current.parentId) : undefined;
  }

  return undefined;
}

function buildTaskReferenceMaps(tasks: Exams.TaskNode[]): Pick<CorrectionSessionReferenceMaps, 'taskRefById' | 'taskIdByRef'> {
  const childrenByParent = buildChildrenMap(tasks);
  const taskRefById: Record<string, string> = {};
  const taskIdByRef: Record<string, string> = {};

  const visit = (task: Exams.TaskNode, lineage: number[]): void => {
    const taskRef = `task-${lineage.join('.')}`;
    taskRefById[task.id] = taskRef;
    taskIdByRef[taskRef] = task.id;

    const children = childrenByParent.get(task.id) ?? [];
    children.forEach((child, index) => visit(child, [...lineage, index + 1]));
  };

  getRootTaskNodes(tasks).forEach((task, index) => visit(task, [index + 1]));

  return {
    taskRefById,
    taskIdByRef
  };
}

function renderFormattingMetadata(formatting: Exams.TextFormatting | undefined): Record<string, unknown> | undefined {
  if (!formatting) {
    return undefined;
  }

  const metadata = Object.entries(formatting).filter(([, value]) => value !== undefined);
  if (metadata.length === 0) {
    return undefined;
  }

  return Object.fromEntries(metadata);
}

export function buildExamReference(exam: Exams.Exam): string {
  return `exam-${sanitizeReferenceToken(exam.title, 'pruefung')}`;
}

export function buildCandidateReference(candidate: Exams.Candidate, index: number): string {
  const name = `${candidate.firstName} ${candidate.lastName}`.trim();
  const nameToken = sanitizeReferenceToken(name, `candidate-${index + 1}`);
  return `candidate-${String(index + 1).padStart(2, '0')}-${nameToken}`;
}

export function buildCorrectionSessionReferenceMaps(exam: Exams.Exam): CorrectionSessionReferenceMaps {
  const examRef = buildExamReference(exam);
  const partRefById: Record<string, string> = {};
  const partIdByRef: Record<string, string> = {};

  exam.structure.parts
    .slice()
    .sort((left, right) => left.order - right.order)
    .forEach((part, index) => {
      const partRef = `part-${index + 1}`;
      partRefById[part.id] = partRef;
      partIdByRef[partRef] = part.id;
    });

  return {
    examRef,
    partRefById,
    partIdByRef,
    ...buildTaskReferenceMaps(exam.structure.tasks),
    scoringUnitRefByInternalKey: {},
    scoringUnitKeyByRef: {}
  };
}

export function buildCorrectionSessionParts(
  exam: Exams.Exam,
  references: CorrectionSessionReferenceMaps,
  rules: Exams.CorrectionSessionRules
): Exams.KbrCorrectionSessionPart[] {
  const tasksById = new Map(exam.structure.tasks.map((task) => [task.id, task]));
  const rootPartByTaskId = new Map<string, string>();

  for (const part of exam.structure.parts) {
    for (const taskId of part.taskIds) {
      rootPartByTaskId.set(taskId, part.id);
    }
  }

  const scoringTasks = resolveScoringTasks(exam.structure.tasks, rules.taskSelection);
  const scoringTaskIds = new Set(scoringTasks.map((task) => task.id));

  return exam.structure.parts
    .slice()
    .sort((left, right) => left.order - right.order)
    .map((part) => {
      const publicTaskIds = part.taskIds
        .map((taskId) => references.taskRefById[taskId])
        .filter((taskRef): taskRef is string => Boolean(taskRef));

      const maxPoints = exam.structure.tasks
        .filter((task) => scoringTaskIds.has(task.id))
        .filter((task) => resolveTaskPartId(task, tasksById, rootPartByTaskId) === part.id)
        .reduce((sum, task) => sum + task.points, 0);

      return {
        id: references.partRefById[part.id],
        name: part.name,
        description: part.description,
        taskIds: publicTaskIds,
        printable: part.printable,
        order: part.order,
        maxPoints,
        metadata: {
          scoreType: part.scoreType,
          calculateSubScore: part.calculateSubScore
        }
      } satisfies Exams.KbrCorrectionSessionPart;
    });
}

export function buildCorrectionSessionScoringUnits(
  exam: Exams.Exam,
  references: CorrectionSessionReferenceMaps,
  rules: Exams.CorrectionSessionRules
): Exams.KbrCorrectionScoringUnit[] {
  const scoringUnits: Exams.KbrCorrectionScoringUnit[] = [];
  const scoringTasks = resolveScoringTasks(exam.structure.tasks, rules.taskSelection);

  for (const task of scoringTasks) {
    const taskRef = references.taskRefById[task.id];
    const scoringUnitRef = `${taskRef}.score`;
    const internalKey = `${task.id}::task`;

    references.scoringUnitRefByInternalKey[internalKey] = scoringUnitRef;
    references.scoringUnitKeyByRef[scoringUnitRef] = internalKey;

    scoringUnits.push({
      id: scoringUnitRef,
      taskId: taskRef,
      kind: 'task',
      label: task.title,
      maxPoints: task.points,
      metadata: {
        source: 'task-points',
        criteria: task.criteria.map((criterion, criterionIndex) => ({
          id: `criterion-${criterionIndex + 1}`,
          criterionId: criterion.id,
          text: stripFormattingWhitespace(criterion.text) || `Criterion ${criterionIndex + 1}`,
          points: criterion.points,
          aspectBased: criterion.aspectBased,
          formatting: renderFormattingMetadata(criterion.formatting),
          subCriteria: criterion.subCriteria?.map((subCriterion, subCriterionIndex) => ({
            id: `sub-${criterionIndex + 1}.${subCriterionIndex + 1}`,
            subCriterionId: subCriterion.id,
            text: stripFormattingWhitespace(subCriterion.text),
            weight: subCriterion.weight,
            formatting: renderFormattingMetadata(subCriterion.formatting)
          }))
        }))
      }
    });
  }

  return scoringUnits;
}

export function buildCorrectionSessionTaskTree(
  exam: Exams.Exam,
  references: CorrectionSessionReferenceMaps,
  scoringUnits: Exams.KbrCorrectionScoringUnit[]
): Exams.KbrCorrectionTaskTreeNode[] {
  const tasksById = new Map(exam.structure.tasks.map((task) => [task.id, task]));
  const rootPartByTaskId = new Map<string, string>();

  for (const part of exam.structure.parts) {
    for (const taskId of part.taskIds) {
      rootPartByTaskId.set(taskId, part.id);
    }
  }

  const scoringUnitIdsByTaskRef = scoringUnits.reduce<Record<string, string[]>>((accumulator, scoringUnit) => {
    const entries = accumulator[scoringUnit.taskId] ?? [];
    entries.push(scoringUnit.id);
    accumulator[scoringUnit.taskId] = entries;
    return accumulator;
  }, {});

  return exam.structure.tasks
    .slice()
    .sort((left, right) => {
      if (left.level !== right.level) {
        return left.level - right.level;
      }

      return left.order - right.order;
    })
    .map((task) => {
      const partId = resolveTaskPartId(task, tasksById, rootPartByTaskId);

      return {
        id: references.taskRefById[task.id],
        parentId: task.parentId ? references.taskRefById[task.parentId] : undefined,
        partId: partId ? references.partRefById[partId] : undefined,
        level: task.level,
        order: task.order,
        title: task.title,
        description: task.description,
        points: task.points,
        bonusPoints: task.bonusPoints,
        isChoice: task.isChoice,
        choiceGroup: task.choiceGroup,
        childTaskIds: task.subtasks.map((subtaskId) => references.taskRefById[subtaskId]),
        scoringUnitIds: scoringUnitIdsByTaskRef[references.taskRefById[task.id]] ?? [],
        metadata: {
          allowComments: task.allowComments,
          allowSupportTips: task.allowSupportTips,
          commentBoxEnabled: task.commentBoxEnabled,
          criteriaCount: task.criteria.length
        }
      } satisfies Exams.KbrCorrectionTaskTreeNode;
    });
}

function renderMetadataBlock(metadata: Record<string, unknown> | undefined, indent: string): string[] {
  if (!metadata) {
    return [];
  }

  const entries = Object.entries(metadata).filter(([, value]) => value !== undefined);
  if (entries.length === 0) {
    return [];
  }

  const lines = [`${indent}- metadata:`];

  for (const [key, value] of entries) {
    if (Array.isArray(value)) {
      lines.push(`${indent}  - ${key}:`);
      value.forEach((entry) => {
        lines.push(`${indent}    - ${JSON.stringify(entry)}`);
      });
      continue;
    }

    if (typeof value === 'object' && value !== null) {
      lines.push(`${indent}  - ${key}: ${JSON.stringify(value)}`);
      continue;
    }

    lines.push(`${indent}  - ${key}: ${String(value)}`);
  }

  return lines;
}

export function renderCorrectionSessionParts(parts: Exams.KbrCorrectionSessionPart[]): string {
  if (parts.length === 0) {
    return '_No exam parts defined._';
  }

  return parts
    .map((part) => {
      const lines = [
        `- ${part.id}: ${part.name}`,
        `  - order: ${part.order}`,
        `  - printable: ${part.printable ? 'yes' : 'no'}`,
        `  - maxPoints: ${part.maxPoints ?? 0}`
      ];

      if (part.description) {
        lines.push(`  - description: ${part.description}`);
      }

      if (part.taskIds.length > 0) {
        lines.push(`  - taskRefs: ${part.taskIds.join(', ')}`);
      }

      lines.push(...renderMetadataBlock(part.metadata, '  '));
      return lines.join('\n');
    })
    .join('\n\n');
}

export function renderCorrectionSessionTaskTree(taskTree: Exams.KbrCorrectionTaskTreeNode[]): string {
  if (taskTree.length === 0) {
    return '_No tasks defined._';
  }

  const tasksByParent = taskTree.reduce<Record<string, Exams.KbrCorrectionTaskTreeNode[]>>((accumulator, task) => {
    const parentKey = task.parentId ?? '__root__';
    const siblings = accumulator[parentKey] ?? [];
    siblings.push(task);
    accumulator[parentKey] = siblings;
    return accumulator;
  }, {});

  for (const siblings of Object.values(tasksByParent)) {
    siblings.sort((left, right) => left.order - right.order);
  }

  const renderNode = (task: Exams.KbrCorrectionTaskTreeNode, depth: number): string[] => {
    const indent = '  '.repeat(depth);
    const lines = [
      `${indent}- ${task.id}: ${task.title}`,
      `${indent}  - level: ${task.level}`,
      `${indent}  - points: ${task.points}`
    ];

    if (task.partId) {
      lines.push(`${indent}  - partRef: ${task.partId}`);
    }

    if (task.description) {
      lines.push(`${indent}  - description: ${task.description}`);
    }

    if (task.bonusPoints !== undefined) {
      lines.push(`${indent}  - bonusPoints: ${task.bonusPoints}`);
    }

    if (task.isChoice) {
      lines.push(`${indent}  - choiceGroup: ${task.choiceGroup ?? 'unassigned'}`);
    }

    if (task.scoringUnitIds.length > 0) {
      lines.push(`${indent}  - scoringUnits: ${task.scoringUnitIds.join(', ')}`);
    }

    lines.push(...renderMetadataBlock(task.metadata, `${indent}  `));

    const children = tasksByParent[task.id] ?? [];
    for (const child of children) {
      lines.push(...renderNode(child, depth + 1));
    }

    return lines;
  };

  return (tasksByParent.__root__ ?? []).flatMap((task) => renderNode(task, 0)).join('\n');
}

export function renderCorrectionSessionScoringUnits(
  scoringUnits: Exams.KbrCorrectionScoringUnit[]
): string {
  if (scoringUnits.length === 0) {
    return '_No scoring units derived._';
  }

  return scoringUnits
    .map((scoringUnit) => {
      const lines = [
        `- ${scoringUnit.id}: ${scoringUnit.label}`,
        `  - taskRef: ${scoringUnit.taskId}`,
        `  - kind: ${scoringUnit.kind}`,
        `  - maxPoints: ${scoringUnit.maxPoints}`
      ];

      if (scoringUnit.weight !== undefined) {
        lines.push(`  - weight: ${scoringUnit.weight}`);
      }

      lines.push(...renderMetadataBlock(scoringUnit.metadata, '  '));
      return lines.join('\n');
    })
    .join('\n\n');
}

export function renderCorrectionSessionRules(rules: Exams.CorrectionSessionRules): string {
  return [
    `- taskSelection: ${rules.taskSelection}`,
    `- scoringAggregation: ${rules.scoring.aggregation}`,
    `- allowPartialPoints: ${rules.scoring.allowPartialPoints ? 'yes' : 'no'}`,
    `- allowAlternativeGrading: ${rules.scoring.allowAlternativeGrading ? 'yes' : 'no'}`,
    `- allowManualScoringUnits: ${rules.scoring.allowManualScoringUnits ? 'yes' : 'no'}`,
    `- evidenceRequired: ${rules.evidence.required ? 'yes' : 'no'}`,
    `- supportedEvidenceKinds: ${rules.evidence.supportedKinds.join(', ')}`,
    `- allowMultipleEvidenceItems: ${rules.evidence.allowMultipleEvidenceItems ? 'yes' : 'no'}`,
    `- importMergeStrategy: ${rules.imports.mergeStrategy}`,
    `- allowUnmappedScores: ${rules.imports.allowUnmappedScores ? 'yes' : 'no'}`,
    `- preserveManualComments: ${rules.imports.preserveManualComments ? 'yes' : 'no'}`,
    `- preserveExistingEvidence: ${rules.imports.preserveExistingEvidence ? 'yes' : 'no'}`
  ].join('\n');
}

export function renderCorrectionSessionChatRefs(chatRefs: string[]): string {
  if (chatRefs.length === 0) {
    return '_No chat references available._';
  }

  return chatRefs.map((chatRef) => `- ${chatRef}`).join('\n');
}