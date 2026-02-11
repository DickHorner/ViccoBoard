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
export { SportZensClassRepository } from './repositories/sportzens-class.repository.js';
export { SportZensCategoryRepository } from './repositories/sportzens-category.repository.js';
export { SportZensGradeRepository } from './repositories/sportzens-grade.repository.js';
export { SportZensTableRepository } from './repositories/sportzens-table.repository.js';
export { SportZensGradeWeightingRepository } from './repositories/sportzens-grade-weighting.repository.js';
export { SportZensNewDayDataRepository } from './repositories/sportzens-new-day-data.repository.js';
export { SportZensUserDataRepository } from './repositories/sportzens-user-data.repository.js';

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

export { RecordShuttleRunResultUseCase } from './use-cases/record-shuttle-run-result.use-case.js';
export type { RecordShuttleRunResultInput } from './use-cases/record-shuttle-run-result.use-case.js';

export { RecordCooperTestResultUseCase } from './use-cases/record-cooper-test-result.use-case.js';
export type { RecordCooperTestResultInput } from './use-cases/record-cooper-test-result.use-case.js';

export { RecordSportabzeichenResultUseCase } from './use-cases/record-sportabzeichen-result.use-case.js';
export type { RecordSportabzeichenResultInput } from './use-cases/record-sportabzeichen-result.use-case.js';

export { SaveSportZensClassUseCase } from './use-cases/save-sportzens-class.use-case.js';
export { SaveSportZensCategoryUseCase } from './use-cases/save-sportzens-category.use-case.js';
export { SaveSportZensGradeUseCase } from './use-cases/save-sportzens-grade.use-case.js';
export { SaveSportZensTableUseCase } from './use-cases/save-sportzens-table.use-case.js';
export { SaveSportZensGradeWeightingUseCase } from './use-cases/save-sportzens-grade-weighting.use-case.js';
export { SaveSportZensNewDayDataUseCase } from './use-cases/save-sportzens-new-day-data.use-case.js';
export { SaveSportZensUserDataUseCase } from './use-cases/save-sportzens-user-data.use-case.js';

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
