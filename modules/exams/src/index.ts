/**
 * KURT Module Exports
 * Main entry point for exam builder and correction
 */

// Repositories
export { ExamRepository } from './repositories/exam.repository.js';
export { TaskNodeRepository } from './repositories/task-node.repository.js';
export { CriterionRepository } from './repositories/criterion.repository.js';
export { CorrectionEntryRepository } from './repositories/correction-entry.repository.js';
export { SupportTipRepository } from './repositories/support-tip.repository.js';
export { StudentLongTermNoteRepository } from './repositories/student-long-term-note.repository.js';
export type { StudentLongTermNote, CompetencyArea, DevelopmentNote } from './repositories/student-long-term-note.repository.js';

// Services
export { GradingKeyService, GERMAN_1_6_PRESET, GERMAN_0_15_PRESET } from './services/grading-key.service.js';

// Use cases
export * from './use-cases/create-exam.use-case.js';
export * from './use-cases/record-correction.use-case.js';
export * from './use-cases/calculate-grade.use-case.js';
export { RecordCorrectionUseCase } from './use-cases/record-correction.use-case-v2.js';
export type { RecordCorrectionInput } from './use-cases/record-correction.use-case-v2.js';
