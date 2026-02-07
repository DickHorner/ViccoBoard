/**
 * Type guards for runtime type validation
 */

import type { 
  GradeCategoryType, 
  GradeCategory, 
  PerformanceEntry 
} from '../interfaces/sport.types.js'
import type { Student } from '../interfaces/core.types.js'

/**
 * Grade category type guard
 */
export function isValidGradeCategoryType(value: unknown): value is GradeCategoryType {
  return typeof value === 'string' && [
    'criteria',
    'time',
    'cooper',
    'shuttle',
    'sportabzeichen',
    'bjs',
    'verbal'
  ].includes(value)
}

/**
 * Exam mode type guard
 */
export function isValidExamMode(value: unknown): value is 'simple' | 'complex' {
  return value === 'simple' || value === 'complex'
}

/**
 * Attendance status type guard
 */
export function isValidAttendanceStatus(value: unknown): value is 'present' | 'absent' | 'excused' | 'late' | 'passive' {
  return typeof value === 'string' && [
    'present',
    'absent',
    'excused',
    'late',
    'passive'
  ].includes(value)
}

/**
 * Exam status type guard
 */
export function isValidExamStatus(value: unknown): value is 'draft' | 'in-progress' | 'completed' {
  return typeof value === 'string' && [
    'draft',
    'in-progress',
    'completed'
  ].includes(value)
}

/**
 * Correction entry status type guard
 */
export function isValidCorrectionStatus(value: unknown): value is 'not-started' | 'in-progress' | 'completed' {
  return typeof value === 'string' && [
    'not-started',
    'in-progress',
    'completed'
  ].includes(value)
}

/**
 * Generic object type guard
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Check if value is a valid Date or Date string
 */
export function isValidDate(value: unknown): value is Date | string {
  if (value instanceof Date) {
    return !isNaN(value.getTime())
  }
  if (typeof value === 'string') {
    const date = new Date(value)
    return !isNaN(date.getTime())
  }
  return false
}

/**
 * Check if value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Check if value is a positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && value >= 0
}



/**
 * Student entity type guard
 */
export function isStudentEntity(value: unknown): value is { id: string; classGroupId: string; firstName: string; lastName: string; createdAt: Date | string; lastModified: Date | string } {
  return (
    isObject(value) &&
    isNonEmptyString((value as any).id) &&
    isNonEmptyString((value as any).classGroupId) &&
    isNonEmptyString((value as any).firstName) &&
    isNonEmptyString((value as any).lastName) &&
    isValidDate((value as any).createdAt) &&
    isValidDate((value as any).lastModified)
  )
}

/**
 * Grade category entity type guard
 */
export function isGradeCategoryEntity(value: unknown): value is GradeCategory {
  return (
    isObject(value) &&
    isNonEmptyString((value as any).id) &&
    isNonEmptyString((value as any).classGroupId) &&
    isNonEmptyString((value as any).name) &&
    isValidGradeCategoryType((value as any).type) &&
    isPositiveNumber((value as any).weight) &&
    isObject((value as any).configuration) &&
    isValidDate((value as any).createdAt) &&
    isValidDate((value as any).lastModified)
  )
}

/**
 * Performance entry entity type guard
 */
export function isPerformanceEntryEntity(value: unknown): value is PerformanceEntry {
  return (
    isObject(value) &&
    isNonEmptyString((value as any).id) &&
    isNonEmptyString((value as any).studentId) &&
    isNonEmptyString((value as any).categoryId) &&
    isObject((value as any).measurements) &&
    isValidDate((value as any).timestamp)
  )
}
