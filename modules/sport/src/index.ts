/**
 * Sport Module Exports
 * Main entry point for SportZens domain functionality
 */

// Repositories
export { ClassGroupRepository } from './repositories/class-group.repository';
export { StudentRepository } from './repositories/student.repository';
export { AttendanceRepository } from './repositories/attendance.repository';
export { GradeCategoryRepository } from './repositories/grade-category.repository';
export { PerformanceEntryRepository } from './repositories/performance-entry.repository';

// Use Cases
export { CreateClassUseCase } from './use-cases/create-class.use-case';
export type { CreateClassInput } from './use-cases/create-class.use-case';

export { AddStudentUseCase } from './use-cases/add-student.use-case';
export type { AddStudentInput } from './use-cases/add-student.use-case';

export { RecordAttendanceUseCase } from './use-cases/record-attendance.use-case';
export type { RecordAttendanceInput } from './use-cases/record-attendance.use-case';

export { CreateGradeCategoryUseCase } from './use-cases/create-grade-category.use-case';
export type { CreateGradeCategoryInput } from './use-cases/create-grade-category.use-case';

export { RecordGradeUseCase } from './use-cases/record-grade.use-case';
export type { RecordGradeInput } from './use-cases/record-grade.use-case';

export const SPORT_MODULE_VERSION = '0.1.0';
