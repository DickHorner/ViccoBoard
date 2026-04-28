/**
 * UpdateParticipantStateUseCase
 * Sets the per-student completion state on a class task.
 */

import type { TeacherTask, TeacherTaskParticipantState } from '../types.js';
import { TaskRepository } from '../repositories/task.repository.js';

export interface UpdateParticipantStateInput {
  taskId: string;
  studentId: string;
  done: boolean;
  note?: string;
}

export class UpdateParticipantStateUseCase {
  constructor(private repo: TaskRepository) {}

  async execute(input: UpdateParticipantStateInput): Promise<TeacherTask> {
    const task = await this.repo.findById(input.taskId);
    if (!task) {
      throw new Error(`Task "${input.taskId}" not found`);
    }
    if (task.target.kind !== 'class') {
      throw new Error('Participant states are only supported on class tasks');
    }

    const existing = task.participantStates.find(s => s.studentId === input.studentId);
    let updatedStates: TeacherTaskParticipantState[];

    if (existing) {
      updatedStates = task.participantStates.map(s =>
        s.studentId === input.studentId
          ? { ...s, done: input.done, note: input.note }
          : s
      );
    } else {
      updatedStates = [
        ...task.participantStates,
        { studentId: input.studentId, done: input.done, note: input.note }
      ];
    }

    return this.repo.update(input.taskId, { participantStates: updatedStates });
  }
}
