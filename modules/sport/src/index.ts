/**
 * Sport Module Exports
 * Main entry point for Sport domain functionality
 */

// Repositories
export { ClassGroupRepository } from './repositories/class-group.repository.js';
export { LessonRepository } from './repositories/lesson.repository.js';
export { AttendanceRepository } from './repositories/attendance.repository.js';
export { GradeSchemeRepository } from './repositories/grade-scheme.repository.js';
export { GradeCategoryRepository } from './repositories/grade-category.repository.js';
export { PerformanceEntryRepository } from './repositories/performance-entry.repository.js';
export { ToolSessionRepository } from './repositories/tool-session.repository.js';
export { TableDefinitionRepository } from './repositories/table-definition.repository.js';
export { CooperTestConfigRepository } from './repositories/cooper-test-config.repository.js';
export { ShuttleRunConfigRepository } from './repositories/shuttle-run-config.repository.js';
export { SportabzeichenStandardRepository } from './repositories/sportabzeichen-standard.repository.js';
export { SportabzeichenResultRepository } from './repositories/sportabzeichen-result.repository.js';
export { SportClassRepository } from './repositories/sport-class.repository.js';
export { SportCategoryRepository } from './repositories/sport-category.repository.js';
export { SportGradeRepository } from './repositories/sport-grade.repository.js';
export { SportTableRepository } from './repositories/sport-table.repository.js';
export { SportGradeWeightingRepository } from './repositories/sport-grade-weighting.repository.js';
export { SportNewDayDataRepository } from './repositories/sport-new-day-data.repository.js';
export { SportUserDataRepository } from './repositories/sport-user-data.repository.js';

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

export { RecordTimerResultUseCase } from './use-cases/record-timer-result.use-case.js';
export type { RecordTimerResultInput } from './use-cases/record-timer-result.use-case.js';

export { SaveSportClassUseCase } from './use-cases/save-sport-class.use-case.js';
export { SaveSportCategoryUseCase } from './use-cases/save-sport-category.use-case.js';
export { SaveSportGradeUseCase } from './use-cases/save-sport-grade.use-case.js';
export { SaveSportTableUseCase } from './use-cases/save-sport-table.use-case.js';
export { SaveSportGradeWeightingUseCase } from './use-cases/save-sport-grade-weighting.use-case.js';
export { SaveSportNewDayDataUseCase } from './use-cases/save-sport-new-day-data.use-case.js';
export { SaveSportUserDataUseCase } from './use-cases/save-sport-user-data.use-case.js';

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
export { MittelstreckeGradingService } from './services/mittelstrecke-grading.service.js';
export type {
  MittelstreckeGradingInput,
  MittelstreckeGradingResult
} from './services/mittelstrecke-grading.service.js';
export { BJSGradingService } from './services/bjs-grading.service.js';
export type {
  BJSGradingInput,
  BJSGradingResult,
  BJSDisciplineResult
} from './services/bjs-grading.service.js';
export { SportabzeichenService } from './services/sportabzeichen.service.js';
export type {
  SportabzeichenPerformanceInput,
  SportabzeichenReport,
  SportabzeichenReportEntry
} from './services/sportabzeichen.service.js';

// Plugins
export { TimerToolPlugin } from './plugins/timer.plugin.js';

export const SPORT_MODULE_VERSION = '0.1.0';
