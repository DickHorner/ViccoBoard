/**
 * KURT Module Exports
 * Main entry point for exam builder and correction
 */

// Repositories
export { ExamRepository } from './repositories/exam.repository.js';
export { TaskNodeRepository } from './repositories/task-node.repository.js';
export { CriterionRepository } from './repositories/criterion.repository.js';
export { CorrectionEntryRepository } from './repositories/correction-entry.repository.js';

// Use cases
export * from './use-cases/create-exam.use-case.js';
export * from './use-cases/record-correction.use-case.js';
export * from './use-cases/calculate-grade.use-case.js';
