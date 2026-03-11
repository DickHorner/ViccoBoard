export interface DashboardLesson {
  id: string
  classGroupId: string
  date: Date
}

export interface DashboardLessonState<TLesson extends DashboardLesson> {
  todayLessons: TLesson[]
  currentOrNextLesson: TLesson | null
  upcomingLesson: TLesson | null
}

const isSameDay = (left: Date, right: Date): boolean =>
  left.getFullYear() === right.getFullYear()
  && left.getMonth() === right.getMonth()
  && left.getDate() === right.getDate()

export function getDashboardLessonState<TLesson extends DashboardLesson>(
  lessons: TLesson[],
  now: Date = new Date()
): DashboardLessonState<TLesson> {
  const todayLessons = lessons
    .filter((lesson) => isSameDay(lesson.date, now))
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  const futureLessons = todayLessons.filter((lesson) => lesson.date.getTime() >= now.getTime())
  const pastLessons = todayLessons.filter((lesson) => lesson.date.getTime() < now.getTime())

  const currentOrNextLesson = futureLessons[0] ?? pastLessons[pastLessons.length - 1] ?? null

  const upcomingLesson = futureLessons[1] ?? null
  return {
    todayLessons,
    currentOrNextLesson,
    upcomingLesson
  }
}
