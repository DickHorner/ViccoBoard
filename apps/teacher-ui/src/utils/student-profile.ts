/**
 * Utility functions for the StudentProfile view.
 * Pure functions to keep data mapping testable independently of Vue.
 */

import type { AttendanceRecord, Student } from '@viccoboard/core'
import type { Sport } from '@viccoboard/core'
import {
  formatGermanDate,
  formatGermanDateTime
} from './locale-format'

// ---------------------------------------------------------------------------
// Attendance summary
// ---------------------------------------------------------------------------

export interface AttendanceSummary {
  total: number
  present: number
  absent: number
  excused: number
  late: number
  passive: number
  percentage: number
}

export function buildAttendanceSummary(records: AttendanceRecord[]): AttendanceSummary {
  const total = records.length
  const present = records.filter((r) => r.status === 'present').length
  const absent = records.filter((r) => r.status === 'absent').length
  const excused = records.filter((r) => r.status === 'excused').length
  const late = records.filter((r) => r.status === 'late').length
  const passive = records.filter((r) => r.status === 'passive').length
  const percentage = total > 0 ? (present / total) * 100 : 100

  return { total, present, absent, excused, late, passive, percentage }
}

// ---------------------------------------------------------------------------
// Performance summary
// ---------------------------------------------------------------------------

export interface PerformanceSummary {
  totalEntries: number
  gradedEntries: number
  averageGrade: number | null
  bestGrade: number | null
  lastActivity: Date | null
}

export function buildPerformanceSummary(
  entries: Sport.PerformanceEntry[]
): PerformanceSummary {
  const totalEntries = entries.length
  const graded = entries.filter(
    (e) => e.calculatedGrade !== undefined && e.calculatedGrade !== null
  )
  const gradedValues = graded.map((e) => Number(e.calculatedGrade))

  const averageGrade =
    gradedValues.length > 0
      ? gradedValues.reduce((sum, g) => sum + g, 0) / gradedValues.length
      : null

  // Lower grade is better in German grading (1 is best)
  const bestGrade = gradedValues.length > 0 ? Math.min(...gradedValues) : null

  const sorted = [...entries].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  )
  const lastActivity = sorted.length > 0 ? sorted[0].timestamp : null

  return { totalEntries, gradedEntries: graded.length, averageGrade, bestGrade, lastActivity }
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

export function formatDateDe(date: Date | string): string {
  return formatGermanDate(date)
}

export function formatDateTimeDe(date: Date): string {
  return formatGermanDateTime(date)
}

export function getStudentInitials(student: Pick<Student, 'firstName' | 'lastName'>): string {
  return `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`.toUpperCase()
}

export function attendanceStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    present: 'Anwesend',
    absent: 'Abwesend',
    excused: 'Entschuldigt',
    late: 'Verspätet',
    passive: 'Passiv'
  }
  return labels[status] ?? status
}

export function attendanceStatusClass(status: string): string {
  return `status-${status}`
}
