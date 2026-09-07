import { buildAutoLessonDates, parseSchoolYearRange, getDateKey } from '../src/utils/lesson-auto-generation'

describe('lesson auto generation', () => {
  it('parses school year ranges in YYYY/YYYY format', () => {
    const range = parseSchoolYearRange('2026/2027')
    expect(range).not.toBeNull()
    expect(range?.start.toISOString().slice(0, 10)).toBe('2026-08-01')
    expect(range?.end.toISOString().slice(0, 10)).toBe('2027-07-31')

    const nextRange = parseSchoolYearRange('2027/2028')
    expect(nextRange).not.toBeNull()
    expect(nextRange?.start.toISOString().slice(0, 10)).toBe('2027-08-01')
    expect(nextRange?.end.toISOString().slice(0, 10)).toBe('2028-07-31')

    expect(parseSchoolYearRange('2026-2027')).toBeNull()
    expect(parseSchoolYearRange('2026/2026')).toBeNull()
    expect(parseSchoolYearRange('2026/2028')).toBeNull()
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

  it('skips 2027/2028 Berlin school-break marker dates', () => {
    const dates = buildAutoLessonDates({
      schoolYear: '2027/2028',
      weekday: 1,
      states: ['BE'],
      existingLessonDateKeys: new Set<string>()
    }).map(getDateKey)

    expect(dates).toContain('2027-10-25')
    expect(dates).not.toContain('2027-10-11')
    expect(dates).not.toContain('2028-01-31')
    expect(dates).not.toContain('2028-04-10')
  })

  it('skips 2027/2028 Brandenburg school-break marker dates', () => {
    const dates = buildAutoLessonDates({
      schoolYear: '2027/2028',
      weekday: 4,
      states: ['BB'],
      existingLessonDateKeys: new Set<string>()
    }).map(getDateKey)

    expect(dates).toContain('2028-06-22')
    expect(dates).not.toContain('2028-06-29')
  })

  it('skips 2027/2028 public holidays by state', () => {
    const berlinDates = buildAutoLessonDates({
      schoolYear: '2027/2028',
      weekday: 5,
      states: ['BE'],
      existingLessonDateKeys: new Set<string>()
    }).map(getDateKey)

    expect(berlinDates).toContain('2028-04-07')
    expect(berlinDates).not.toContain('2028-04-14')
    expect(berlinDates).not.toContain('2028-05-26')

    const brandenburgDates = buildAutoLessonDates({
      schoolYear: '2027/2028',
      weekday: 0,
      states: ['BB'],
      existingLessonDateKeys: new Set<string>()
    }).map(getDateKey)

    expect(brandenburgDates).not.toContain('2028-04-16')
    expect(brandenburgDates).not.toContain('2028-06-04')
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
