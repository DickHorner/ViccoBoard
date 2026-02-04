/**
 * Sport Module Exports
 * Main entry point for SportZens domain functionality
 */

// Repositories
export { ClassGroupRepository } from './repositories/class-group.repository';
export { StudentRepository } from './repositories/student.repository';
export { AttendanceRepository } from './repositories/attendance.repository';
export { GradeSchemeRepository } from './repositories/grade-scheme.repository';
export { GradeCategoryRepository } from './repositories/grade-category.repository';
export { PerformanceEntryRepository } from './repositories/performance-entry.repository';
export { SportabzeichenStandardRepository } from './repositories/sportabzeichen-standard.repository';
export { SportabzeichenResultRepository } from './repositories/sportabzeichen-result.repository';

// Use Cases
export { CreateClassUseCase } from './use-cases/create-class.use-case';
export type { CreateClassInput } from './use-cases/create-class.use-case';

export { AddStudentUseCase } from './use-cases/add-student.use-case';
export type { AddStudentInput } from './use-cases/add-student.use-case';

export { RecordAttendanceUseCase } from './use-cases/record-attendance.use-case';
export type { RecordAttendanceInput } from './use-cases/record-attendance.use-case';

// Grading Engine
export { CriteriaGradingEngine } from './grading/criteria-grading.engine';
export type {
  CriteriaScore,
  CriteriaGradingInput,
  CriteriaGradingResult,
  CriteriaBreakdown
} from './grading/criteria-grading.engine';

// Services
export { TimeGradingService } from './services/time-grading.service';
export type {
  TimeToGradeInput,
  TimeToGradeResult,
  AdjustBoundariesInput
} from './services/time-grading.service';
export { SportabzeichenService } from './services/sportabzeichen.service';
export type {
  SportabzeichenPerformanceInput,
  SportabzeichenReport,
  SportabzeichenReportEntry
} from './services/sportabzeichen.service';

export const SPORT_MODULE_VERSION = '0.1.0';