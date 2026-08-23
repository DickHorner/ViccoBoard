import { buildAutoLessonDates, parseSchoolYearRange, getDateKey } from '../src/utils/lesson-auto-generation'

describe('lesson auto generation', () => {
  it('parses school year ranges in YYYY/YYYY format', () => {
    const range = parseSchoolYearRange('2026/2027')
    expect(range).not.toBeNull()
    expect(range?.start.toISOString().slice(0, 10)).toBe('2026-08-01')
    expect(range?.end.toISOString().slice(0, 10)).toBe('2027-07-31')
    expect(parseSchoolYearRange('2026-2027')).toBeNull()
  })

  it('skips school-break and holiday marker dates', () => {
    const dates = buildAutoLessonDates({
      schoolYear: '2026/2027',
      weekday: 1,
      states: ['BE'],
      existingLessonDateKeys: new Set<string>()
    }).map(getDateKey)

    expect(dates).toContain('2026-10-12')
    expect(dates).not.toContain('2026-10-19')
  })

  it('skips dates that already have lessons', () => {
    const dates = buildAutoLessonDates({
      schoolYear: '2026/2027',
      weekday: 1,
      states: ['BE'],
      existingLessonDateKeys: new Set<string>(['2026-11-02'])
    }).map(getDateKey)

    expect(dates).not.toContain('2026-11-02')
  })
})
