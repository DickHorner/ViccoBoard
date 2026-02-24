/**
 * Students Module Exports
 * Main entry point for centralized student management
 */

// Repositories
export { StudentRepository } from './repositories/student.repository.js';
export { SportStudentRepository } from './repositories/sport-student.repository.js';
export { StatusCatalogRepository } from './repositories/status-catalog.repository.js';

// Use Cases
export { AddStudentUseCase } from './use-cases/add-student.use-case.js';
export type {
  AddStudentInput,
  ClassGroupLookup
} from './use-cases/add-student.use-case.js';
export { SaveSportStudentUseCase } from './use-cases/save-sport-student.use-case.js';
export { AddStatusUseCase } from './use-cases/add-status.use-case.js';
export type { AddStatusInput } from './use-cases/add-status.use-case.js';
export { UpdateStatusUseCase } from './use-cases/update-status.use-case.js';
export type { UpdateStatusInput } from './use-cases/update-status.use-case.js';
export { ReorderStatusUseCase } from './use-cases/reorder-status.use-case.js';
export type { ReorderStatusInput } from './use-cases/reorder-status.use-case.js';

export const STUDENTS_MODULE_VERSION = '0.1.0';
