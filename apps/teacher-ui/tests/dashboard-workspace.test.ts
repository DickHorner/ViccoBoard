import { getDashboardLessonState } from '../src/utils/dashboard-workspace'

describe('dashboard workspace lesson state', () => {
  it('chooses the next upcoming lesson for today', () => {
    const now = new Date('2026-03-11T09:30:00')
    const firstLesson = { id: '1', classGroupId: 'a', date: new Date('2026-03-11T08:00:00') }
    const nextLesson = { id: '2', classGroupId: 'b', date: new Date('2026-03-11T10:15:00') }
    const laterLesson = { id: '3', classGroupId: 'c', date: new Date('2026-03-11T12:00:00') }

    const result = getDashboardLessonState([laterLesson, nextLesson, firstLesson], now)

    expect(result.todayLessons.map((lesson) => lesson.id)).toEqual(['1', '2', '3'])
    expect(result.currentOrNextLesson?.id).toBe('2')
    expect(result.upcomingLesson?.id).toBe('3')
  })

  it('falls back to the latest lesson today when no future lesson exists', () => {
    const now = new Date('2026-03-11T18:00:00')
    const morningLesson = { id: '1', classGroupId: 'a', date: new Date('2026-03-11T08:00:00') }
    const noonLesson = { id: '2', classGroupId: 'b', date: new Date('2026-03-11T12:00:00') }
    const tomorrowLesson = { id: '3', classGroupId: 'c', date: new Date('2026-03-12T08:00:00') }

    const result = getDashboardLessonState([morningLesson, tomorrowLesson, noonLesson], now)

    expect(result.todayLessons.map((lesson) => lesson.id)).toEqual(['1', '2'])
    expect(result.currentOrNextLesson?.id).toBe('2')
    expect(result.upcomingLesson).toBeNull()
  })
})
