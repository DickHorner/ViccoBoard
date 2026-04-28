/**
 * UpdateTaskUseCase
 * Updates mutable fields of an existing TeacherTask.
 */

import type { TeacherTask } from '../types.js';
import { TaskRepository } from '../repositories/task.repository.js';
import { assertValidDate } from '../validators.js';

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  dueDate?: string | null;
  preReminderAt?: string | null;
  done?: boolean;
}

export class UpdateTaskUseCase {
  constructor(private repo: TaskRepository) {}

  async execute(input: UpdateTaskInput): Promise<TeacherTask> {
    const existing = await this.repo.findById(input.id);
    if (!existing) {
      throw new Error(`Task "${input.id}" not found`);
    }

    if (input.title !== undefined) {
      if (!input.title || input.title.trim().length === 0) {
        throw new Error('Task title must not be empty');
      }
    }

    const effectiveDueDate = input.dueDate !== undefined ? input.dueDate ?? undefined : existing.dueDate;
    const effectivePreReminder = input.preReminderAt !== undefined ? input.preReminderAt ?? undefined : existing.preReminderAt;

    if (input.dueDate !== undefined && input.dueDate !== null) {
      assertValidDate(input.dueDate, 'dueDate');
    }

    if (input.preReminderAt !== undefined && input.preReminderAt !== null) {
      assertValidDate(input.preReminderAt, 'preReminderAt');
    }

    if (effectivePreReminder !== undefined && effectiveDueDate !== undefined) {
      if (effectivePreReminder > effectiveDueDate) {
        throw new Error('preReminderAt must not be after dueDate');
      }
    }

    const updates: Partial<TeacherTask> = {};
    if (input.title !== undefined) updates.title = input.title.trim();
    if (input.description !== undefined) updates.description = input.description ?? undefined;
    if (input.dueDate !== undefined) updates.dueDate = input.dueDate ?? undefined;
    if (input.preReminderAt !== undefined) updates.preReminderAt = input.preReminderAt ?? undefined;
    if (input.done !== undefined) updates.done = input.done;

    return this.repo.update(input.id, updates);
  }
}
