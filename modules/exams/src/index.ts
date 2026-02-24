/**
 * KBR Module Exports
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
export {
  GradingKeyEngine,
  GradingKeyUIHelper,
  type GradingKeyChange,
  type GradingKeyModificationResult
} from './services/grading-key-engine.service.js';
export {
  AlternativeGradingService,
  AlternativeGradingUIHelper,
  STANDARD_ALTERNATIVE_SCALE,
  SIMPLIFIED_ALTERNATIVE_SCALE,
  type AlternativeGradeType,
  type AlternativeGradingConfig,
  type AlternativeGradingScale
} from './services/alternative-grading.service.js';
export {
  CommentManagementService,
  CorrectionCommentUseCase,
  type CommentTemplate
} from './services/comment-management.service.js';
export {
  SupportTipManagementService,
  SupportTipUIHelper
} from './services/support-tip-management.service.js';
export {
  ExamAnalysisService,
  AnalysisUIHelper,
  type DifficultyAnalysis,
  type ExamStatistics,
  type PointAdjustmentSuggestion
} from './services/exam-analysis.service.js';
export {
  LongTermNoteManagementService,
  LongTermNoteUIHelper,
  type CompetencyProgress,
  type StudentGrowthAnalysis
} from './services/long-term-note.service.js';

// Use cases
export * from './use-cases/create-exam.use-case.js';
export * from './use-cases/record-correction.use-case.js';
export * from './use-cases/calculate-grade.use-case.js';
export { RecordCorrectionUseCase } from './use-cases/record-correction.use-case-v2.js';
export type { RecordCorrectionInput } from './use-cases/record-correction.use-case-v2.js';
