import { Exams } from '@viccoboard/core';

import { createExamPayload } from './create-exam.use-case.js';

const ASSESSMENT_FORMATS: Exams.ExamAssessmentFormat[] = [
  'klausur', 'test', 'mappenkorrektur', 'portfolio', 'referat',
  'referatsrueckmeldung', 'facharbeit', 'muendliche-pruefung', 'gruppenarbeit'
];

function asObject(value: unknown, path: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${path}: Objekt erwartet.`);
  }
  return value as Record<string, unknown>;
}

function assertFields(value: Record<string, unknown>, fields: string[], path: string): void {
  const unsupported = Object.keys(value).find((key) => !fields.includes(key));
  if (unsupported) {
    throw new Error(`${path}: Unbekanntes Feld "${unsupported}".`);
  }
}

function readText(value: unknown, path: string, maxLength: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > maxLength) {
    throw new Error(`${path}: Nichtleerer Text mit höchstens ${maxLength} Zeichen erforderlich.`);
  }
  return value.trim();
}

function readOptionalText(value: unknown, path: string, maxLength: number): string | undefined {
  return value === undefined ? undefined : readText(value, path, maxLength);
}

/** Converts an untrusted, versioned Teacher Workbench JSON export to a new ViccoBoard exam template. */
export function parseExamDefinition(input: unknown): Exams.Exam {
  const source = asObject(input, 'Prüfung');
  assertFields(source, ['format', 'version', 'title', 'description', 'assessmentFormat', 'tasks'], 'Prüfung');

  if (source.format !== 'viccoboard-exam' || source.version !== 1) {
    throw new Error('Unbekanntes Prüfungsformat oder nicht unterstützte Version (erwartet: viccoboard-exam v1).');
  }

  const title = readText(source.title, 'Prüfung.title', 500);
  const description = readOptionalText(source.description, 'Prüfung.description', 5000);
  if (!ASSESSMENT_FORMATS.includes(source.assessmentFormat as Exams.ExamAssessmentFormat)) {
    throw new Error('Prüfung.assessmentFormat: Ungültiges Prüfungsformat.');
  }
  if (!Array.isArray(source.tasks) || source.tasks.length === 0) {
    throw new Error('Prüfung.tasks: Mindestens eine Aufgabe erforderlich.');
  }

  const tasks: Exams.TaskNode[] = [];
  let criteriaCount = 0;
  let hasSubtasks = false;

  function addTask(value: unknown, level: 1 | 2 | 3, order: number, parentId?: string): Exams.TaskNode {
    const path = `Aufgabe ${tasks.length + 1}`;
    const task = asObject(value, path);
    assertFields(task, ['title', 'description', 'criteria', 'subtasks'], path);
    const taskTitle = readText(task.title, `${path}.title`, 500);
    const taskDescription = readOptionalText(task.description, `${path}.description`, 5000);

    if (tasks.length >= 100) {
      throw new Error('Maximal 100 Aufgaben einschließlich Teilaufgaben erlaubt.');
    }

    const hasChildren = Array.isArray(task.subtasks) && task.subtasks.length > 0;
    const hasCriteria = Array.isArray(task.criteria) && task.criteria.length > 0;
    if (hasChildren === hasCriteria || (task.criteria !== undefined && !hasCriteria) ||
        (task.subtasks !== undefined && !hasChildren)) {
      throw new Error(`${path}: Entweder Kriterien oder Teilaufgaben erforderlich, nicht beides.`);
    }
    if (hasChildren && level === 3) {
      throw new Error(`${path}: Maximal drei Aufgabenebenen erlaubt.`);
    }

    const node: Exams.TaskNode = {
      id: crypto.randomUUID(),
      parentId,
      level,
      order,
      title: taskTitle,
      description: taskDescription,
      points: 0,
      isChoice: false,
      criteria: [],
      allowComments: false,
      allowSupportTips: false,
      commentBoxEnabled: false,
      subtasks: []
    };
    tasks.push(node);

    if (hasChildren) {
      hasSubtasks = true;
      const children = task.subtasks as unknown[];
      for (const [index, child] of children.entries()) {
        const added = addTask(child, (level + 1) as 2 | 3, index + 1, node.id);
        node.subtasks.push(added.id);
        node.points += added.points;
      }
    } else {
      const entries = task.criteria as unknown[];
      for (const [index, entry] of entries.entries()) {
        const criterionPath = `${path}.criteria[${index}]`;
        const criterion = asObject(entry, criterionPath);
        assertFields(criterion, ['text', 'points'], criterionPath);
        const text = readText(criterion.text, `${criterionPath}.text`, 2000);
        const points = criterion.points;
        if (typeof points !== 'number' || !Number.isFinite(points) || points < 0 || points > 10000 || points * 2 % 1 !== 0) {
          throw new Error(`${criterionPath}.points: Nichtnegative Zahl in 0,5er-Schritten erforderlich.`);
        }
        if (++criteriaCount > 1000) {
          throw new Error('Maximal 1000 Bewertungskriterien erlaubt.');
        }
        node.criteria.push({
          id: crypto.randomUUID(),
          text,
          points,
          formatting: {},
          aspectBased: false
        });
        node.points += points;
      }
      if (node.points === 0) {
        throw new Error(`${path}: Mindestens ein bewertbarer Punkt erforderlich.`);
      }
    }
    return node;
  }

  let totalPoints = 0;
  for (const [index, task] of source.tasks.entries()) {
    totalPoints += addTask(task, 1, index + 1).points;
  }
  if (totalPoints > 10000) {
    throw new Error('Die Prüfung darf höchstens 10000 Punkte umfassen.');
  }

  const exam = createExamPayload(title);
  return {
    ...exam,
    description,
    assessmentFormat: source.assessmentFormat as Exams.ExamAssessmentFormat,
    mode: hasSubtasks ? Exams.ExamMode.Complex : Exams.ExamMode.Simple,
    kind: 'template',
    structure: { ...exam.structure, tasks, totalPoints },
    gradingKey: { ...exam.gradingKey, totalPoints }
  };
}