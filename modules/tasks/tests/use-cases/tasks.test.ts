/**
 * Tasks Module Tests
 * Covers all 5 scenarios from the problem statement plus edge cases.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { InMemoryStorageAdapter } from '@viccoboard/storage';
import { TaskRepository } from '../../src/repositories/task.repository';
import { CreateTaskUseCase } from '../../src/use-cases/create-task.use-case';
import { UpdateTaskUseCase } from '../../src/use-cases/update-task.use-case';
import { MarkChecklistItemDoneUseCase } from '../../src/use-cases/mark-checklist-item-done.use-case';
import { UpdateParticipantStateUseCase } from '../../src/use-cases/update-participant-state.use-case';
import { ListTasksUseCase } from '../../src/use-cases/list-tasks.use-case';

describe('Tasks Module', () => {
  let adapter: InMemoryStorageAdapter;
  let repo: TaskRepository;
  let createTask: CreateTaskUseCase;
  let updateTask: UpdateTaskUseCase;
  let markDone: MarkChecklistItemDoneUseCase;
  let updateParticipant: UpdateParticipantStateUseCase;
  let listTasks: ListTasksUseCase;

  beforeEach(async () => {
    adapter = new InMemoryStorageAdapter();
    await adapter.initialize();
    repo = new TaskRepository(adapter);
    createTask = new CreateTaskUseCase(repo);
    updateTask = new UpdateTaskUseCase(repo);
    markDone = new MarkChecklistItemDoneUseCase(repo);
    updateParticipant = new UpdateParticipantStateUseCase(repo);
    listTasks = new ListTasksUseCase(repo);
  });

  // ─── Scenario 1: Task for a class ───────────────────────────────────────────
  describe('class task creation', () => {
    it('creates a task for a ClassGroup with dueDate and checklist', async () => {
      const task = await createTask.execute({
        title: 'Klasse 7c: 5 € p. P. einsammeln für Ausflug',
        target: { kind: 'class', classGroupId: 'class-7c' },
        dueDate: '2025-06-15',
        checklist: [
          { text: 'Liste mit Schülernamen vorbereiten' },
          { text: 'Geld einsammeln' }
        ]
      });

      expect(task.id).toBeDefined();
      expect(task.title).toBe('Klasse 7c: 5 € p. P. einsammeln für Ausflug');
      expect(task.target.kind).toBe('class');
      expect(task.target.classGroupId).toBe('class-7c');
      expect(task.dueDate).toBe('2025-06-15');
      expect(task.checklist).toHaveLength(2);
      expect(task.checklist[0].done).toBe(false);
      expect(task.done).toBe(false);
    });
  });

  // ─── Scenario 2: Task for an individual student ──────────────────────────────
  describe('student task creation', () => {
    it('creates a task for a single student', async () => {
      const task = await createTask.execute({
        title: 'Entschuldigungszettel abgeben',
        target: { kind: 'student', studentId: 'student-42' },
        dueDate: '2025-05-30'
      });

      expect(task.target.kind).toBe('student');
      expect(task.target.studentId).toBe('student-42');
      expect(task.checklist).toHaveLength(0);
    });
  });

  // ─── Scenario 3: Class task with participant states ──────────────────────────
  describe('participant state tracking', () => {
    it('records per-student done state on a class task', async () => {
      const task = await createTask.execute({
        title: 'Formulare einsammeln',
        target: { kind: 'class', classGroupId: 'class-8a' }
      });

      const updated = await updateParticipant.execute({
        taskId: task.id,
        studentId: 'student-1',
        done: true,
        note: 'abgegeben'
      });

      expect(updated.participantStates).toHaveLength(1);
      expect(updated.participantStates[0].studentId).toBe('student-1');
      expect(updated.participantStates[0].done).toBe(true);
      expect(updated.participantStates[0].note).toBe('abgegeben');
    });

    it('updates existing participant state', async () => {
      const task = await createTask.execute({
        title: 'Formulare einsammeln',
        target: { kind: 'class', classGroupId: 'class-8a' }
      });
      await updateParticipant.execute({ taskId: task.id, studentId: 'student-1', done: false });
      const updated = await updateParticipant.execute({ taskId: task.id, studentId: 'student-1', done: true });

      expect(updated.participantStates).toHaveLength(1);
      expect(updated.participantStates[0].done).toBe(true);
    });

    it('rejects participant state update on student tasks', async () => {
      const task = await createTask.execute({
        title: 'Einzelaufgabe',
        target: { kind: 'student', studentId: 'student-5' }
      });

      await expect(
        updateParticipant.execute({ taskId: task.id, studentId: 'student-5', done: true })
      ).rejects.toThrow('class tasks');
    });
  });

  // ─── Scenario 4: Invalid date is rejected ────────────────────────────────────
  describe('date validation', () => {
    it('rejects a logically impossible date (31 February)', async () => {
      await expect(
        createTask.execute({
          title: 'Test',
          target: { kind: 'class', classGroupId: 'class-x' },
          dueDate: '1999-02-31'
        })
      ).rejects.toThrow('valid calendar date');
    });

    it('rejects a date in wrong format', async () => {
      await expect(
        createTask.execute({
          title: 'Test',
          target: { kind: 'class', classGroupId: 'class-x' },
          dueDate: '15.06.2025'
        })
      ).rejects.toThrow('YYYY-MM-DD');
    });

    it('rejects preReminderAt after dueDate', async () => {
      await expect(
        createTask.execute({
          title: 'Test',
          target: { kind: 'class', classGroupId: 'class-x' },
          dueDate: '2025-06-01',
          preReminderAt: '2025-06-15'
        })
      ).rejects.toThrow('preReminderAt');
    });

    it('accepts a valid dueDate', async () => {
      const task = await createTask.execute({
        title: 'Valid date task',
        target: { kind: 'class', classGroupId: 'class-x' },
        dueDate: '2025-03-15'
      });
      expect(task.dueDate).toBe('2025-03-15');
    });
  });

  // ─── Scenario 5: Overdue task detection ──────────────────────────────────────
  describe('overdue detection', () => {
    it('correctly identifies an overdue task', async () => {
      await createTask.execute({
        title: 'Abgelaufene Aufgabe',
        target: { kind: 'class', classGroupId: 'class-y' },
        dueDate: '2024-01-01'
      });

      const referenceDate = new Date('2025-06-01T12:00:00Z');
      const overdue = await listTasks.execute('overdue', referenceDate);
      expect(overdue).toHaveLength(1);
      expect(overdue[0].title).toBe('Abgelaufene Aufgabe');
    });

    it('does not include a task due today in overdue list', async () => {
      await createTask.execute({
        title: 'Heute fällig',
        target: { kind: 'class', classGroupId: 'class-y' },
        dueDate: '2025-06-01'
      });

      const referenceDate = new Date('2025-06-01T12:00:00Z');
      const overdue = await listTasks.execute('overdue', referenceDate);
      expect(overdue).toHaveLength(0);
    });

    it('includes a task due today in "due" list', async () => {
      await createTask.execute({
        title: 'Heute fällig',
        target: { kind: 'class', classGroupId: 'class-y' },
        dueDate: '2025-06-01'
      });

      const referenceDate = new Date('2025-06-01T12:00:00Z');
      const due = await listTasks.execute('due', referenceDate);
      expect(due).toHaveLength(1);
    });

    it('does not include done tasks in overdue list', async () => {
      const task = await createTask.execute({
        title: 'Erledigt',
        target: { kind: 'class', classGroupId: 'class-y' },
        dueDate: '2024-01-01'
      });
      await updateTask.execute({ id: task.id, done: true });

      const referenceDate = new Date('2025-06-01T12:00:00Z');
      const overdue = await listTasks.execute('overdue', referenceDate);
      expect(overdue).toHaveLength(0);
    });
  });

  // ─── Checklist item management ───────────────────────────────────────────────
  describe('checklist item done', () => {
    it('marks a checklist item as done', async () => {
      const task = await createTask.execute({
        title: 'Aufgabe mit Checkliste',
        target: { kind: 'class', classGroupId: 'class-z' },
        checklist: [{ text: 'Schritt 1' }, { text: 'Schritt 2' }]
      });

      const itemId = task.checklist[0].id;
      const updated = await markDone.execute(task.id, itemId, true);
      expect(updated.checklist.find(i => i.id === itemId)?.done).toBe(true);
      expect(updated.checklist[1].done).toBe(false);
    });

    it('throws when checklist item does not exist', async () => {
      const task = await createTask.execute({
        title: 'Aufgabe',
        target: { kind: 'class', classGroupId: 'class-z' }
      });

      await expect(
        markDone.execute(task.id, 'nonexistent-item', true)
      ).rejects.toThrow('not found');
    });
  });

  // ─── Validation edge cases ───────────────────────────────────────────────────
  describe('validation', () => {
    it('rejects a task without a title', async () => {
      await expect(
        createTask.execute({
          title: '  ',
          target: { kind: 'class', classGroupId: 'class-x' }
        })
      ).rejects.toThrow('title is required');
    });

    it('rejects a class target with missing classGroupId', async () => {
      await expect(
        createTask.execute({
          title: 'Test',
          target: { kind: 'class' }
        })
      ).rejects.toThrow('classGroupId');
    });

    it('rejects a student target with missing studentId', async () => {
      await expect(
        createTask.execute({
          title: 'Test',
          target: { kind: 'student' }
        })
      ).rejects.toThrow('studentId');
    });

    it('rejects a target with unknown kind', async () => {
      await expect(
        createTask.execute({
          title: 'Test',
          target: { kind: 'unknown' as any }
        })
      ).rejects.toThrow('target.kind');
    });

    it('lists only open tasks', async () => {
      const t1 = await createTask.execute({
        title: 'Open',
        target: { kind: 'class', classGroupId: 'c1' }
      });
      const t2 = await createTask.execute({
        title: 'Done',
        target: { kind: 'class', classGroupId: 'c1' }
      });
      await updateTask.execute({ id: t2.id, done: true });

      const open = await listTasks.execute('open');
      expect(open.map(t => t.id)).toContain(t1.id);
      expect(open.map(t => t.id)).not.toContain(t2.id);
    });
  });
});
