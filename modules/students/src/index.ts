/**
 * Students Module Exports
 * Main entry point for centralized student management
 */

// Repositories
export { StudentRepository } from './repositories/student.repository.js';
export { SportStudentProfileRepository } from './repositories/sport-student-profile.repository.js';
export { StatusCatalogRepository } from './repositories/status-catalog.repository.js';
export { ImportBatchRepository } from './repositories/import-batch.repository.js';
export { ImportBatchItemRepository } from './repositories/import-batch-item.repository.js';

// Use Cases
export { AddStudentUseCase } from './use-cases/add-student.use-case.js';
export type {
  AddStudentInput,
  ClassGroupLookup
} from './use-cases/add-student.use-case.js';
export { SaveSportStudentProfileUseCase } from './use-cases/save-sport-student-profile.use-case.js';
export { AddStatusUseCase } from './use-cases/add-status.use-case.js';
export type { AddStatusInput } from './use-cases/add-status.use-case.js';
export { UpdateStatusUseCase } from './use-cases/update-status.use-case.js';
export type { UpdateStatusInput } from './use-cases/update-status.use-case.js';
export { ReorderStatusUseCase } from './use-cases/reorder-status.use-case.js';
export type { ReorderStatusInput } from './use-cases/reorder-status.use-case.js';
export { StudentCsvImportUseCase } from './use-cases/student-csv-import.use-case.js';
export type {
  ClassGroupGateway,
  StudentCsvFile,
  StudentImportIssue,
  StudentImportCandidate,
  StudentImportPreview,
  StudentImportExecutionResult
} from './use-cases/student-csv-import.use-case.js';

export const STUDENTS_MODULE_VERSION = '0.1.0';
