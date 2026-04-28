/**
 * MarkChecklistItemDoneUseCase
 * Toggles the `done` flag on a single checklist item.
 */

import type { TeacherTask } from '../types.js';
import { TaskRepository } from '../repositories/task.repository.js';

export class MarkChecklistItemDoneUseCase {
  constructor(private repo: TaskRepository) {}

  async execute(taskId: string, itemId: string, done: boolean): Promise<TeacherTask> {
    const task = await this.repo.findById(taskId);
    if (!task) {
      throw new Error(`Task "${taskId}" not found`);
    }

    const item = task.checklist.find(i => i.id === itemId);
    if (!item) {
      throw new Error(`Checklist item "${itemId}" not found in task "${taskId}"`);
    }

    const updatedChecklist = task.checklist.map(i =>
      i.id === itemId ? { ...i, done } : i
    );

    return this.repo.update(taskId, { checklist: updatedChecklist });
  }
}
