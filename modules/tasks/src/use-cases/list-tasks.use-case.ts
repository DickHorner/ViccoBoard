/**
 * ListTasksUseCase
 * Returns filtered task lists: open, due today, or overdue.
 */

import type { TeacherTask } from '../types.js';
import { TaskRepository } from '../repositories/task.repository.js';

export type TaskListFilter = 'open' | 'due' | 'overdue';

export class ListTasksUseCase {
  constructor(private repo: TaskRepository) {}

  async execute(filter: TaskListFilter, referenceDate?: Date): Promise<TeacherTask[]> {
    const all = await this.repo.findAll();
    const ref = referenceDate ?? new Date();
    const today = ref.toISOString().slice(0, 10);

    switch (filter) {
      case 'open':
        return all.filter(t => !t.done);

      case 'due':
        return all.filter(t => !t.done && t.dueDate !== undefined && t.dueDate <= today);

      case 'overdue':
        return all.filter(t => !t.done && t.dueDate !== undefined && t.dueDate < today);

      default: {
        const exhaustive: never = filter;
        throw new Error(`Unknown filter: ${exhaustive}`);
      }
    }
  }
}
