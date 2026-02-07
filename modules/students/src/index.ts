/**
 * Students Module Exports
 * Main entry point for centralized student management
 */

// Repositories
export { StudentRepository } from './repositories/student.repository.js';

// Use Cases
export { AddStudentUseCase } from './use-cases/add-student.use-case.js';
export type {
  AddStudentInput,
  ClassGroupLookup
} from './use-cases/add-student.use-case.js';

export const STUDENTS_MODULE_VERSION = '0.1.0';
