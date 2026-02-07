/**
 * Sport Module Exports
 * Main entry point for SportZens domain functionality
 */

// Repositories
export { ClassGroupRepository } from './repositories/class-group.repository.js';
export { AttendanceRepository } from './repositories/attendance.repository.js';
export { GradeSchemeRepository } from './repositories/grade-scheme.repository.js';
export { GradeCategoryRepository } from './repositories/grade-category.repository.js';
export { PerformanceEntryRepository } from './repositories/performance-entry.repository.js';
export { SportabzeichenStandardRepository } from './repositories/sportabzeichen-standard.repository.js';
export { SportabzeichenResultRepository } from './repositories/sportabzeichen-result.repository.js';

// Use Cases
export { CreateClassUseCase } from './use-cases/create-class.use-case.js';
export type { CreateClassInput } from './use-cases/create-class.use-case.js';

export { RecordAttendanceUseCase } from './use-cases/record-attendance.use-case.js';
export type { RecordAttendanceInput } from './use-cases/record-attendance.use-case.js';

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
export { SportabzeichenService } from './services/sportabzeichen.service.js';
export type {
  SportabzeichenPerformanceInput,
  SportabzeichenReport,
  SportabzeichenReportEntry
} from './services/sportabzeichen.service.js';

// Plugins
export { TimerToolPlugin } from './plugins/timer.plugin.js';

export const SPORT_MODULE_VERSION = '0.1.0';
