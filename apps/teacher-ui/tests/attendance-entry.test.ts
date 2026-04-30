import { AttendanceStatus } from '@viccoboard/core'
import {
  buildAttendanceRecords,
  normalizeAttendanceEntry,
  shouldClearAttendanceAfterSave,
  statusUsesReason
} from '../src/utils/attendance-entry'

describe('attendance entry UI save rules', () => {
  it('keeps saved attendance editable for existing lessons', () => {
    expect(shouldClearAttendanceAfterSave(true)).toBe(false)
    expect(shouldClearAttendanceAfterSave(false)).toBe(true)
  })

  it('keeps reason for passive attendance', () => {
    expect(statusUsesReason(AttendanceStatus.Passive)).toBe(true)
    expect(normalizeAttendanceEntry({
      status: AttendanceStatus.Passive,
      reason: 'Schonung nach Verletzung'
    })).toEqual({
      status: AttendanceStatus.Passive,
      reason: 'Schonung nach Verletzung',
      lateMinutes: undefined
    })
  })

  it('stores late minutes only for late attendance', () => {
    expect(normalizeAttendanceEntry({
      status: AttendanceStatus.Late,
      lateMinutes: 8.7,
      reason: 'Bus'
    })).toEqual({
      status: AttendanceStatus.Late,
      reason: undefined,
      lateMinutes: 8
    })

    expect(normalizeAttendanceEntry({
      status: AttendanceStatus.Present,
      lateMinutes: 8,
      reason: 'Bus'
    })).toEqual({
      status: AttendanceStatus.Present,
      reason: undefined,
      lateMinutes: undefined
    })
  })

  it('builds update records without duplicating lesson and student identity', () => {
    const records = buildAttendanceRecords({
      student1: {
        status: AttendanceStatus.Late,
        lateMinutes: 5
      },
      student2: {
        status: AttendanceStatus.Passive,
        reason: 'Materialdienst'
      }
    }, 'lesson1')

    expect(records).toEqual([
      {
        studentId: 'student1',
        lessonId: 'lesson1',
        status: AttendanceStatus.Late,
        reason: undefined,
        lateMinutes: 5,
        notes: undefined
      },
      {
        studentId: 'student2',
        lessonId: 'lesson1',
        status: AttendanceStatus.Passive,
        reason: 'Materialdienst',
        lateMinutes: undefined,
        notes: undefined
      }
    ])
  })
})
