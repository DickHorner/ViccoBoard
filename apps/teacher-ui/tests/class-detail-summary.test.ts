import { buildClassSportSummary, buildSportWorkAreas } from '../src/utils/class-detail-summary'

describe('buildClassSportSummary', () => {
  it('maps raw counts to a summary object', () => {
    const summary = buildClassSportSummary(25, 12, 3, 47)
    expect(summary.studentCount).toBe(25)
    expect(summary.lessonCount).toBe(12)
    expect(summary.gradeCategoryCount).toBe(3)
    expect(summary.assessmentCount).toBe(47)
  })

  it('clamps negative inputs to zero', () => {
    const summary = buildClassSportSummary(-1, -5, -2, -10)
    expect(summary.studentCount).toBe(0)
    expect(summary.lessonCount).toBe(0)
    expect(summary.gradeCategoryCount).toBe(0)
    expect(summary.assessmentCount).toBe(0)
  })

  it('handles an empty class', () => {
    const summary = buildClassSportSummary(0, 0, 0, 0)
    expect(summary.studentCount).toBe(0)
    expect(summary.lessonCount).toBe(0)
    expect(summary.gradeCategoryCount).toBe(0)
    expect(summary.assessmentCount).toBe(0)
  })
})

describe('buildSportWorkAreas', () => {
  const classId = 'class-42'
  const areas = buildSportWorkAreas(classId)

  it('returns exactly five work areas', () => {
    expect(areas).toHaveLength(5)
  })

  it('pre-filters attendance and lessons links with the classId', () => {
    const attendance = areas.find((a) => a.label === 'Anwesenheit')
    const lessons = areas.find((a) => a.label === 'Stunden')
    expect(attendance?.to).toBe(`/attendance?classId=${classId}`)
    expect(lessons?.to).toBe(`/lessons?classId=${classId}`)
  })

  it('includes grading, statistics and tools as global links', () => {
    const targets = areas.map((a) => a.to)
    expect(targets).toContain('/grading')
    expect(targets).toContain('/subjects/sport/statistics')
    expect(targets).toContain('/tools/timer')
  })

  it('every area has a non-empty label, description and icon', () => {
    for (const area of areas) {
      expect(area.label.length).toBeGreaterThan(0)
      expect(area.description.length).toBeGreaterThan(0)
      expect(area.icon.length).toBeGreaterThan(0)
    }
  })
})
