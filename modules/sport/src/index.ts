/**
 * Sport Module Exports
 * Main entry point for SportZens domain functionality
 */

// Repositories
export { ClassGroupRepository } from './repositories/class-group.repository.js';
export { LessonRepository } from './repositories/lesson.repository.js';
export { AttendanceRepository } from './repositories/attendance.repository.js';
export { GradeSchemeRepository } from './repositories/grade-scheme.repository.js';
export { GradeCategoryRepository } from './repositories/grade-category.repository.js';
export { PerformanceEntryRepository } from './repositories/performance-entry.repository.js';
export { TableDefinitionRepository } from './repositories/table-definition.repository.js';
export { CooperTestConfigRepository } from './repositories/cooper-test-config.repository.js';
export { ShuttleRunConfigRepository } from './repositories/shuttle-run-config.repository.js';
export { SportabzeichenStandardRepository } from './repositories/sportabzeichen-standard.repository.js';
export { SportabzeichenResultRepository } from './repositories/sportabzeichen-result.repository.js';

// Use Cases
export { CreateClassUseCase } from './use-cases/create-class.use-case.js';
export type { CreateClassInput } from './use-cases/create-class.use-case.js';

export { CreateLessonUseCase } from './use-cases/create-lesson.use-case.js';
export type { CreateLessonInput } from './use-cases/create-lesson.use-case.js';

export { RecordAttendanceUseCase } from './use-cases/record-attendance.use-case.js';
export type { RecordAttendanceInput } from './use-cases/record-attendance.use-case.js';

export { CreateGradeCategoryUseCase } from './use-cases/create-grade-category.use-case.js';
export type { CreateGradeCategoryInput } from './use-cases/create-grade-category.use-case.js';

export { RecordGradeUseCase } from './use-cases/record-grade.use-case.js';
export type { RecordGradeInput } from './use-cases/record-grade.use-case.js';

// Grading Engine
export { CriteriaGradingEngine } from './grading/criteria-grading.engine.js';
export type {
  CriteriaScore,
  CriteriaGradingInput,
  CriteriaGradingResult,
  CriteriaBreakdown
} from './grading/criteria-grading.engine.js';

// Services
export { TimeGradingService } from './services/time-grading.service.js';
export type {
  TimeToGradeInput,
  TimeToGradeResult,
  AdjustBoundariesInput
} from './services/time-grading.service.js';
export { CooperTestService } from './services/cooper-test.service.js';
export { ShuttleRunService } from './services/shuttle-run.service.js';
export { SportabzeichenService } from './services/sportabzeichen.service.js';
export type {
  SportabzeichenPerformanceInput,
  SportabzeichenReport,
  SportabzeichenReportEntry
} from './services/sportabzeichen.service.js';

// Plugins
export { TimerToolPlugin } from './plugins/timer.plugin.js';

export const SPORT_MODULE_VERSION = '0.1.0';
