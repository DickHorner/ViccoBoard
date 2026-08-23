import { getScheduleCalendarMarkers } from './schedule-calendar-markers'

export interface LessonAutoGenerationInput {
  schoolYear: string
  weekday: number
  states: string[]
  existingLessonDateKeys: Set<string>
}

export function parseSchoolYearRange(schoolYear: string): { start: Date; end: Date } | null {
  const match = /^(\d{4})\/(\d{4})$/.exec(schoolYear.trim())
  if (!match) {
    return null
  }

  const startYear = Number(match[1])
  const endYear = Number(match[2])
  if (endYear !== startYear + 1) {
    return null
  }

  return {
    start: new Date(Date.UTC(startYear, 7, 1)),
    end: new Date(Date.UTC(endYear, 6, 31))
  }
}

export function buildAutoLessonDates(input: LessonAutoGenerationInput): Date[] {
  const range = parseSchoolYearRange(input.schoolYear)
  if (!range) {
    return []
  }

  const dates: Date[] = []
  const cursor = new Date(range.start)
  const normalizedStates = input.states.map(normalizeState).filter((state) => state.length > 0)

  while (cursor <= range.end) {
    const date = new Date(cursor)
    const dateKey = getDateKey(date)

    const blockedByCalendar = getScheduleCalendarMarkers(dateKey, normalizedStates).length > 0
    const alreadyHasLesson = input.existingLessonDateKeys.has(dateKey)

    if (date.getDay() === input.weekday && !blockedByCalendar && !alreadyHasLesson) {
      dates.push(date)
    }

    cursor.setDate(cursor.getDate() + 1)
  }

  return dates
}

export function getDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return year + '-' + month + '-' + day
}

function normalizeState(state: string): string {
  if (!state.trim()) {
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
