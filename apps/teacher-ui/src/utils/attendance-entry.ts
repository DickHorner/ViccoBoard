import { AttendanceStatus } from '@viccoboard/core'
import type { RecordAttendanceInput } from '@viccoboard/sport'

export interface AttendanceEntryDraft {
  status: AttendanceStatus
  reason?: string
  lateMinutes?: number
}

export const ATTENDANCE_STATUSES_WITH_REASON = [
  AttendanceStatus.Absent,
  AttendanceStatus.Excused,
  AttendanceStatus.Passive
]

export function statusUsesReason(status: AttendanceStatus): boolean {
  return ATTENDANCE_STATUSES_WITH_REASON.includes(status)
}

export function normalizeAttendanceEntry(entry: AttendanceEntryDraft): AttendanceEntryDraft {
  const reason = statusUsesReason(entry.status) ? entry.reason?.trim() : undefined
  const lateMinutes = entry.status === AttendanceStatus.Late && Number.isFinite(entry.lateMinutes)
    ? Math.max(0, Math.trunc(entry.lateMinutes as number))
    : undefined

  return {
    status: entry.status,
    reason: reason || undefined,
    lateMinutes
  }
}

export function buildAttendanceRecords(
  attendance: Record<string, AttendanceEntryDraft>,
  lessonId: string
): RecordAttendanceInput[] {
  return Object.entries(attendance).map(([studentId, entry]) => {
    const normalized = normalizeAttendanceEntry(entry)

    return {
      studentId,
      lessonId,
      status: normalized.status,
      reason: normalized.reason,
      lateMinutes: normalized.lateMinutes,
      notes: undefined
    }
  })
}

export function shouldClearAttendanceAfterSave(wasEditingExistingLesson: boolean): boolean {
  return !wasEditingExistingLesson
}
