/**
 * Sport Module Exports
 * Main entry point for SportZens domain functionality
 */

// Repositories
export { ClassGroupRepository } from './repositories/class-group.repository';
export { StudentRepository } from './repositories/student.repository';
export { AttendanceRepository } from './repositories/attendance.repository';

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

export const SPORT_MODULE_VERSION = '0.1.0';
