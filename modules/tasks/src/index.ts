/**
 * Tasks Module Exports
 */

// Types
export type {
  TeacherTask,
  TeacherTaskTarget,
  TeacherTaskTargetKind,
  TeacherTaskChecklistItem,
  TeacherTaskParticipantState
} from './types.js';

// Repository
export { TaskRepository } from './repositories/task.repository.js';

// Use Cases
export { CreateTaskUseCase } from './use-cases/create-task.use-case.js';
export type { CreateTaskInput } from './use-cases/create-task.use-case.js';

export { UpdateTaskUseCase } from './use-cases/update-task.use-case.js';
export type { UpdateTaskInput } from './use-cases/update-task.use-case.js';

export { MarkChecklistItemDoneUseCase } from './use-cases/mark-checklist-item-done.use-case.js';

export { UpdateParticipantStateUseCase } from './use-cases/update-participant-state.use-case.js';
export type { UpdateParticipantStateInput } from './use-cases/update-participant-state.use-case.js';

export { ListTasksUseCase } from './use-cases/list-tasks.use-case.js';
export type { TaskListFilter } from './use-cases/list-tasks.use-case.js';

export const TASKS_MODULE_VERSION = '0.1.0';
