/**
 * Task Repository
 * Persists TeacherTask entities via the shared StorageAdapter.
 */

import { AdapterRepository } from '@viccoboard/storage';
import type { StorageAdapter } from '@viccoboard/storage';
import type { TeacherTask, TeacherTaskTarget, TeacherTaskChecklistItem, TeacherTaskParticipantState } from '../types.js';

export class TaskRepository extends AdapterRepository<TeacherTask> {
  constructor(adapter: StorageAdapter) {
    super(adapter, 'tasks');
  }

  mapToEntity(row: any): TeacherTask {
    return {
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      target: JSON.parse(row.target) as TeacherTaskTarget,
      dueDate: row.due_date ?? undefined,
      preReminderAt: row.pre_reminder_at ?? undefined,
      checklist: JSON.parse(row.checklist) as TeacherTaskChecklistItem[],
      participantStates: JSON.parse(row.participant_states) as TeacherTaskParticipantState[],
      done: row.done === 1 || row.done === true,
      createdAt: new Date(row.created_at),
      lastModified: new Date(row.last_modified)
    };
  }

  mapToRow(entity: Partial<TeacherTask>): any {
    const row: any = {};
    if (entity.id !== undefined) row.id = entity.id;
    if (entity.title !== undefined) row.title = entity.title;
    if (entity.description !== undefined) row.description = entity.description;
    if (entity.target !== undefined) row.target = JSON.stringify(entity.target);
    if (entity.dueDate !== undefined) row.due_date = entity.dueDate;
    if (entity.preReminderAt !== undefined) row.pre_reminder_at = entity.preReminderAt;
    if (entity.checklist !== undefined) row.checklist = JSON.stringify(entity.checklist);
    if (entity.participantStates !== undefined) row.participant_states = JSON.stringify(entity.participantStates);
    if (entity.done !== undefined) row.done = entity.done ? 1 : 0;
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt.toISOString();
    if (entity.lastModified !== undefined) row.last_modified = entity.lastModified.toISOString();
    return row;
  }

  /** All tasks targeting a specific class */
  async findByClassGroup(classGroupId: string): Promise<TeacherTask[]> {
    const all = await this.findAll();
    return all.filter(
      t => t.target.kind === 'class' && t.target.classGroupId === classGroupId
    );
  }

  /** All tasks targeting a specific student (direct or via class) */
  async findByStudent(studentId: string): Promise<TeacherTask[]> {
    const all = await this.findAll();
    return all.filter(
      t => t.target.kind === 'student' && t.target.studentId === studentId
    );
  }
}
