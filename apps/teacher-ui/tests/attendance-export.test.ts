import { AttendanceStatus } from '@viccoboard/core'
import { buildAttendanceExportCsv, ATTENDANCE_EXPORT_COLUMNS } from '../src/utils/attendance-export'

describe('attendance export csv', () => {
  it('exports documented header columns', () => {
    const csv = buildAttendanceExportCsv({
      lessonId: 'l1',
      classId: 'c1',
      className: '7a',
      lessonDate: new Date('2026-09-14T08:00:00.000Z'),
      rows: []
    })

    expect(csv.split('\n')[0]).toBe(ATTENDANCE_EXPORT_COLUMNS.join(';'))
  })

  it('escapes semicolons and quotes in text fields', () => {
    const csv = buildAttendanceExportCsv({
      lessonId: 'l1',
      classId: 'c1',
      className: '7a;Nord',
      lessonDate: new Date('2026-09-14T08:00:00.000Z'),
      rows: [
        {
          studentId: 's1',
          firstName: 'Anna',
          lastName: 'Müller "A"',
          status: AttendanceStatus.Absent,
          reason: 'Krank; Attest folgt'
        }
      ]
    })

    expect(csv).toContain('"7a;Nord"')
    expect(csv).toContain('"Müller ""A"""')
    expect(csv).toContain('"Krank; Attest folgt"')
  })
})
