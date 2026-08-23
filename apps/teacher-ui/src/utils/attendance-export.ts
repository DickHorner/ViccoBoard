import type { AttendanceStatus } from '@viccoboard/core'

export const ATTENDANCE_EXPORT_COLUMNS = [
  'lesson_id',
  'class_id',
  'class_name',
  'lesson_date',
  'student_id',
  'last_name',
  'first_name',
  'status',
  'reason',
  'late_minutes'
]

export interface AttendanceExportRow {
  studentId: string
  firstName: string
  lastName: string
  status: AttendanceStatus
  reason?: string
  lateMinutes?: number
}

export interface AttendanceExportInput {
  lessonId: string
  classId: string
  className: string
  lessonDate: Date
  rows: AttendanceExportRow[]
}

export function buildAttendanceExportCsv(input: AttendanceExportInput): string {
  const lessonDate = input.lessonDate.toISOString().slice(0, 10)
  const lines = [
    ATTENDANCE_EXPORT_COLUMNS.join(';'),
    ...input.rows.map((row) =>
      [
        input.lessonId,
        input.classId,
        input.className,
        lessonDate,
        row.studentId,
        row.lastName,
        row.firstName,
        row.status,
        row.reason ?? '',
        row.lateMinutes === undefined ? '' : String(row.lateMinutes)
      ].map(escapeCsvValue).join(';')
    )
  ]

  return lines.join('\n')
}

function escapeCsvValue(value: string): string {
  if (!value.includes(';') && !value.includes('"') && !value.includes('\n')) {
    return value
  }

  return `"${value.replace(/"/g, '""')}"`
}
