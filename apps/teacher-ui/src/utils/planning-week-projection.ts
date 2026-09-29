import type { ClassGroup, Lesson, PlanningBlock } from '@viccoboard/core'
import { getDateKey, parseSchoolYearRange } from './lesson-auto-generation'
import {
  getScheduleCalendarMarkers,
  type ResolvedScheduleCalendarMarker
} from './schedule-calendar-markers'

export interface PlanningWeek {
  key: string
  startDate: string
  endDate: string
  label: string
  markers: ResolvedScheduleCalendarMarker[]
  blocks: PlanningBlock[]
  lessons: Lesson[]
}

export interface PlanningWeekProjectionInput {
  classGroup: ClassGroup
  subjectId: string
  blocks: PlanningBlock[]
  lessons: Lesson[]
}

export function buildPlanningWeeks(input: PlanningWeekProjectionInput): PlanningWeek[] {
  const range = parseSchoolYearRange(input.classGroup.schoolYear)
  if (!range) {
    return []
  }

  const state = normalizeState(input.classGroup.state)
  const states = state ? [state] : []
  const classLessons = input.lessons.filter((lesson) =>
    lesson.classGroupId === input.classGroup.id && lesson.subjectId === input.subjectId
  )
  const lessonWeekdays = new Set(classLessons.map((lesson) => lesson.date.getDay()))
  const weeks: PlanningWeek[] = []
  const cursor = startOfWeek(range.start)
  const end = endOfWeek(range.end)

  while (cursor <= end) {
    const weekStart = new Date(cursor)
    const weekEnd = endOfWeek(weekStart)
    const startDate = getDateKey(weekStart)
    const endDate = getDateKey(weekEnd)

    const weekLessons = classLessons
      .filter((lesson) => doesDateRangeOverlap(getDateKey(lesson.date), getDateKey(lesson.date), startDate, endDate))
      .filter((lesson) => getScheduleCalendarMarkers(getDateKey(lesson.date), states).length === 0)
      .sort(compareLessonsByDateAndStartTime)

    const weekBlocks = input.blocks
      .filter((block) => block.classGroupId === input.classGroup.id && block.subjectId === input.subjectId)
      .filter((block) => doesDateRangeOverlap(block.startDate, block.endDate, startDate, endDate))
      .filter((block) => weekLessons.some((lesson) => {
        const lessonDate = getDateKey(lesson.date)
        return lessonDate >= block.startDate && lessonDate <= block.endDate
      }))

    weeks.push({
      key: startDate,
      startDate,
      endDate,
      label: formatWeekLabel(weekStart, weekEnd),
      markers: getWeekMarkers(weekStart, states, lessonWeekdays),
      blocks: weekBlocks,
      lessons: weekLessons
    })

    cursor.setDate(cursor.getDate() + 7)
  }

  return weeks
}

export function doesDateRangeOverlap(
  leftStart: string,
  leftEnd: string,
  rightStart: string,
  rightEnd: string
): boolean {
  return leftStart <= rightEnd && rightStart <= leftEnd
}

const getWeekMarkers = (
  weekStart: Date,
  states: string[],
  lessonWeekdays: Set<number>
): ResolvedScheduleCalendarMarker[] => {
  const markers = new Map<string, ResolvedScheduleCalendarMarker>()

  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + offset)
    if (!lessonWeekdays.has(date.getDay())) {
      continue
    }

    const dateKey = getDateKey(date)
    for (const marker of getScheduleCalendarMarkers(dateKey, states)) {
      markers.set(marker.type + ':' + marker.label, marker)
    }
  }

  return Array.from(markers.values())
}

const startOfWeek = (date: Date): Date => {
  const copy = startOfDay(date)
  const day = copy.getDay()
  const offset = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + offset)
  return copy
}

const endOfWeek = (date: Date): Date => {
  const copy = startOfWeek(date)
  copy.setDate(copy.getDate() + 6)
  return copy
}

const startOfDay = (date: Date): Date => {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

const formatWeekLabel = (start: Date, end: Date): string => {
  const startLabel = start.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
  const endLabel = end.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
  return startLabel + '–' + endLabel
}

const compareLessonsByDateAndStartTime = (left: Lesson, right: Lesson): number => {
  const dateComparison = left.date.getTime() - right.date.getTime()
  if (dateComparison !== 0) {
    return dateComparison
  }

  return left.startTime.localeCompare(right.startTime)
}

const normalizeState = (state: string | undefined): string => {
  if (!state) {
    return ''
  }

  const normalized = state.trim().toUpperCase()
  if (normalized === 'BERLIN') {
    return 'BE'
  }
  if (normalized === 'BRANDENBURG') {
    return 'BB'
  }
  return normalized
}
