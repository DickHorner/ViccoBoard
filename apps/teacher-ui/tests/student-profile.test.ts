import {
  buildAttendanceSummary,
  buildPerformanceSummary,
  formatDateDe,
  getStudentInitials,
  attendanceStatusLabel
} from '../src/utils/student-profile'
import type { AttendanceRecord } from '@viccoboard/core'
import type { Sport } from '@viccoboard/core'

// ---------------------------------------------------------------------------
// buildAttendanceSummary
// ---------------------------------------------------------------------------

describe('buildAttendanceSummary', () => {
  const makeRecord = (status: string, id: string): AttendanceRecord =>
    ({
      id,
      studentId: 's1',
      lessonId: 'l1',
      status: status as any,
      timestamp: new Date('2026-01-10T08:00:00Z'),
      createdAt: new Date('2026-01-10T08:00:00Z'),
      lastModified: new Date('2026-01-10T08:00:00Z')
    } as AttendanceRecord)

  it('returns 100% for an empty record list', () => {
    const summary = buildAttendanceSummary([])
    expect(summary.total).toBe(0)
    expect(summary.percentage).toBe(100)
  })

  it('counts statuses correctly', () => {
    const records: AttendanceRecord[] = [
      makeRecord('present', '1'),
      makeRecord('present', '2'),
      makeRecord('absent', '3'),
      makeRecord('excused', '4'),
      makeRecord('late', '5'),
      makeRecord('passive', '6')
    ]
    const summary = buildAttendanceSummary(records)
    expect(summary.total).toBe(6)
    expect(summary.present).toBe(2)
    expect(summary.absent).toBe(1)
    expect(summary.excused).toBe(1)
    expect(summary.late).toBe(1)
    expect(summary.passive).toBe(1)
  })

  it('calculates percentage based on present count', () => {
    const records: AttendanceRecord[] = [
      makeRecord('present', '1'),
      makeRecord('present', '2'),
      makeRecord('absent', '3'),
      makeRecord('absent', '4')
    ]
    const summary = buildAttendanceSummary(records)
    expect(summary.percentage).toBeCloseTo(50)
  })
})

// ---------------------------------------------------------------------------
// buildPerformanceSummary
// ---------------------------------------------------------------------------

describe('buildPerformanceSummary', () => {
  const makeEntry = (grade: number | undefined, date: string, id: string): Sport.PerformanceEntry =>
    ({
      id,
      studentId: 's1',
      categoryId: 'c1',
      measurements: {},
      calculatedGrade: grade,
      timestamp: new Date(date),
      createdAt: new Date(date),
      lastModified: new Date(date)
    } as Sport.PerformanceEntry)

  it('returns nulls for an empty entry list', () => {
    const summary = buildPerformanceSummary([])
    expect(summary.totalEntries).toBe(0)
    expect(summary.averageGrade).toBeNull()
    expect(summary.bestGrade).toBeNull()
    expect(summary.lastActivity).toBeNull()
  })

  it('computes averageGrade and bestGrade (lower = better)', () => {
    const entries = [
      makeEntry(2, '2026-01-01T08:00:00Z', '1'),
      makeEntry(4, '2026-01-02T08:00:00Z', '2'),
      makeEntry(3, '2026-01-03T08:00:00Z', '3')
    ]
    const summary = buildPerformanceSummary(entries)
    expect(summary.totalEntries).toBe(3)
    expect(summary.gradedEntries).toBe(3)
    expect(summary.averageGrade).toBeCloseTo(3)
    expect(summary.bestGrade).toBe(2)
  })

  it('ignores entries without calculatedGrade when computing averages', () => {
    const entries = [
      makeEntry(undefined, '2026-01-01T08:00:00Z', '1'),
      makeEntry(2, '2026-01-02T08:00:00Z', '2')
    ]
    const summary = buildPerformanceSummary(entries)
    expect(summary.totalEntries).toBe(2)
    expect(summary.gradedEntries).toBe(1)
    expect(summary.averageGrade).toBe(2)
    expect(summary.bestGrade).toBe(2)
  })

  it('sets lastActivity to the most recent timestamp', () => {
    const entries = [
      makeEntry(1, '2026-01-01T08:00:00Z', '1'),
      makeEntry(2, '2026-03-10T08:00:00Z', '2'),
      makeEntry(3, '2026-02-01T08:00:00Z', '3')
    ]
    const summary = buildPerformanceSummary(entries)
    expect(summary.lastActivity?.toISOString()).toBe('2026-03-10T08:00:00.000Z')
  })
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

describe('getStudentInitials', () => {
  it('returns uppercase initials', () => {
    expect(getStudentInitials({ firstName: 'Anna', lastName: 'Becker' })).toBe('AB')
  })

  it('handles single-character names', () => {
    expect(getStudentInitials({ firstName: 'X', lastName: 'Y' })).toBe('XY')
  })
})

describe('formatDateDe', () => {
  it('formats a Date object in German locale', () => {
    const result = formatDateDe(new Date('2026-03-12T12:00:00Z'))
    // German locale gives dd.mm.yyyy
    expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}/)
  })

  it('accepts a string date', () => {
    const result = formatDateDe('2026-03-12')
    expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}/)
  })
})

describe('formatDateTimeDe', () => {
  it('formats a Date object with both date and time in German locale', () => {
    const { formatDateTimeDe } = require('../src/utils/student-profile')
    const result = formatDateTimeDe(new Date('2026-03-12T08:30:00Z'))
    // German locale gives dd.mm.yyyy, hh:mm
    expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}/)
    expect(result).toMatch(/\d{2}:\d{2}/)
  })
})

describe('attendanceStatusLabel', () => {
  it('translates known statuses to German', () => {
    expect(attendanceStatusLabel('present')).toBe('Anwesend')
    expect(attendanceStatusLabel('absent')).toBe('Abwesend')
    expect(attendanceStatusLabel('excused')).toBe('Entschuldigt')
    expect(attendanceStatusLabel('late')).toBe('Verspätet')
    expect(attendanceStatusLabel('passive')).toBe('Passiv')
  })

  it('returns the raw value for unknown statuses', () => {
    expect(attendanceStatusLabel('unknown')).toBe('unknown')
  })
})
