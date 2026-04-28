/**
 * CreateTaskUseCase
 * Validates and persists a new TeacherTask.
 */

import type { TeacherTask, TeacherTaskChecklistItem, TeacherTaskTarget } from '../types.js';
import { TaskRepository } from '../repositories/task.repository.js';
import { assertValidDate } from '../validators.js';

export interface CreateTaskInput {
  title: string;
  description?: string;
  target: TeacherTaskTarget;
  dueDate?: string;
  preReminderAt?: string;
  checklist?: Array<{ text: string }>;
}

export class CreateTaskUseCase {
  constructor(private repo: TaskRepository) {}

  async execute(input: CreateTaskInput): Promise<TeacherTask> {
    validate(input);

    const checklist: TeacherTaskChecklistItem[] = (input.checklist ?? []).map(item => ({
      id: crypto.randomUUID(),
      text: item.text,
      done: false
    }));

    return this.repo.create({
      title: input.title.trim(),
      description: input.description,
      target: input.target,
      dueDate: input.dueDate,
      preReminderAt: input.preReminderAt,
      checklist,
      participantStates: [],
      done: false
    });
  }
}

function validate(input: CreateTaskInput): void {
  if (!input.title || input.title.trim().length === 0) {
    throw new Error('Task title is required');
  }

  const { target } = input;
  if (!target) {
    throw new Error('Task target is required');
  }
  if (target.kind === 'class') {
    if (!target.classGroupId || target.classGroupId.trim().length === 0) {
      throw new Error('classGroupId is required for class targets');
    }
  } else if (target.kind === 'student') {
    if (!target.studentId || target.studentId.trim().length === 0) {
      throw new Error('studentId is required for student targets');
    }
  } else {
    throw new Error('target.kind must be "class" or "student"');
  }

  if (input.dueDate !== undefined) {
    assertValidDate(input.dueDate, 'dueDate');
  }

  if (input.preReminderAt !== undefined) {
    assertValidDate(input.preReminderAt, 'preReminderAt');
    if (input.dueDate !== undefined && input.preReminderAt > input.dueDate) {
      throw new Error('preReminderAt must not be after dueDate');
    }
  }
}
