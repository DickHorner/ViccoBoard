import type { ClassGroup, Lesson, PlanningBlock } from '@viccoboard/core'
import { buildPlanningWeeks, doesDateRangeOverlap } from '../src/utils/planning-week-projection'

describe('planning week projection', () => {
  const now = new Date('2026-09-01T08:00:00.000Z')
  const classGroup: ClassGroup = {
    id: 'class-1',
    name: '9a',
    schoolYear: '2026/2027',
    state: 'BE',
    createdAt: now,
    lastModified: now
  }

  it('projects blocks and lessons into school year weeks', () => {
    const blocks: PlanningBlock[] = [
      {
        id: 'block-1',
        classGroupId: 'class-1',
        title: 'Basketball',
        startDate: '2026-09-14',
        endDate: '2026-10-09',
        color: 'blue',
        createdAt: now,
        lastModified: now
      }
    ]
    const lessons: Lesson[] = [
      {
        id: 'lesson-1',
        classGroupId: 'class-1',
        date: new Date('2026-09-14T08:00:00.000Z'),
        startTime: '08:00',
        durationMinutes: 45,
        title: 'Dribbling',
        attendance: [],
        createdAt: now,
        lastModified: now
      }
    ]

    const weeks = buildPlanningWeeks({ classGroup, blocks, lessons })
    const projectedWeek = weeks.find((week) => week.startDate === '2026-09-14')

    expect(projectedWeek?.blocks.map((block) => block.title)).toEqual(['Basketball'])
    expect(projectedWeek?.lessons.map((lesson) => lesson.title)).toEqual(['Dribbling'])
  })

  it('keeps school-break markers visible when they affect a regular lesson weekday', () => {
    const lessons: Lesson[] = [
      {
        id: 'lesson-monday',
        classGroupId: 'class-1',
        date: new Date('2026-10-12T08:00:00.000Z'),
        startTime: '08:00',
        durationMinutes: 45,
        attendance: [],
        createdAt: now,
        lastModified: now
      }
    ]

    const weeks = buildPlanningWeeks({ classGroup, blocks: [], lessons })
    const autumnBreakWeek = weeks.find((week) => week.startDate === '2026-10-19')

    expect(autumnBreakWeek?.markers.map((marker) => marker.label)).toContain('Herbstferien')
  })

  it('does not show a weekend holiday when the class has no lesson on that weekday', () => {
    const lessons: Lesson[] = [
      {
        id: 'lesson-monday',
        classGroupId: 'class-1',
        date: new Date('2026-09-28T08:00:00.000Z'),
        startTime: '08:00',
        durationMinutes: 45,
        attendance: [],
        createdAt: now,
        lastModified: now
      }
    ]

    const weeks = buildPlanningWeeks({ classGroup, blocks: [], lessons })
    const unityDayWeek = weeks.find((week) => week.startDate === '2026-09-28')

    expect(unityDayWeek?.markers.map((marker) => marker.label)).not.toContain('Tag der Deutschen Einheit')
  })

  it('shows a holiday on a lesson weekday but omits a lesson scheduled on that holiday', () => {
    const lessons: Lesson[] = [
      {
        id: 'lesson-before-holiday',
        classGroupId: 'class-1',
        date: new Date('2027-03-01T08:00:00.000Z'),
        startTime: '08:00',
        durationMinutes: 45,
        attendance: [],
        createdAt: now,
        lastModified: now
      },
      {
        id: 'lesson-on-holiday',
        classGroupId: 'class-1',
        date: new Date('2027-03-08T08:00:00.000Z'),
        startTime: '08:00',
        durationMinutes: 45,
        title: 'Soll nicht geplant werden',
        attendance: [],
        createdAt: now,
        lastModified: now
      }
    ]

    const weeks = buildPlanningWeeks({ classGroup, blocks: [], lessons })
    const holidayWeek = weeks.find((week) => week.startDate === '2027-03-08')

    expect(holidayWeek?.markers.map((marker) => marker.label)).toContain('Internationaler Frauentag')
    expect(holidayWeek?.lessons).toHaveLength(0)
  })

  it('rejects non-overlapping date ranges', () => {
    expect(doesDateRangeOverlap('2026-09-01', '2026-09-10', '2026-09-11', '2026-09-20')).toBe(false)
    expect(doesDateRangeOverlap('2026-09-01', '2026-09-10', '2026-09-10', '2026-09-20')).toBe(true)
  })
})
