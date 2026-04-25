<template>
  <section class="schedule-overview">
    <header class="page-header">
      <div>
        <h1>Stundenplan</h1>
        <p class="subtitle">Wochennahe Übersicht der vorhandenen Unterrichtsstunden.</p>
      </div>
      <RouterLink class="primary-link" to="/lessons">
        Stunden verwalten
      </RouterLink>
    </header>

    <div v-if="loading" class="state-card">Stunden werden geladen...</div>
    <div v-else-if="loadError" class="state-card error">{{ loadError }}</div>
    <div v-else class="schedule-grid">
      <section class="panel hero-panel">
        <h2>Jetzt / Als Nächstes</h2>
        <div v-if="currentOrNextLesson" class="lesson-focus">
          <p class="eyebrow">{{ currentOrNextMode }}</p>
          <h3>{{ getLessonTitle(currentOrNextLesson) }}</h3>
          <p>{{ getClassName(currentOrNextLesson.classGroupId) }}</p>
          <p>{{ formatLessonDateTime(currentOrNextLesson) }}</p>
          <div class="actions">
            <RouterLink :to="`/lessons/${currentOrNextLesson.id}/workspace`" class="ghost-link">
              Arbeitsbereich öffnen
            </RouterLink>
            <RouterLink :to="`/attendance?classId=${currentOrNextLesson.classGroupId}&lessonId=${currentOrNextLesson.id}`" class="primary-link">
              Anwesenheit
            </RouterLink>
          </div>
        </div>
        <p v-else class="empty-text">Heute sind noch keine Stunden eingetragen.</p>
      </section>

      <section class="panel">
        <h2>Danach</h2>
        <div v-if="upcomingLesson" class="mini-lesson">
          <strong>{{ getLessonTitle(upcomingLesson) }}</strong>
          <span>{{ getClassName(upcomingLesson.classGroupId) }}</span>
          <span>{{ formatLessonDateTime(upcomingLesson) }}</span>
        </div>
        <p v-else class="empty-text">Keine weitere Stunde für heute gefunden.</p>
      </section>

      <section class="panel full-width">
        <div class="panel-header">
          <div>
            <h2>Nächste 7 Tage</h2>
            <p class="panel-subtitle">Gruppiert nach Kalendertag, sortiert nach Startzeit.</p>
          </div>
          <span>{{ scheduledLessonCount }} Einträge</span>
        </div>

        <div class="week-list">
          <section
            v-for="day in scheduleDays"
            :key="day.key"
            class="day-card"
            :class="{ 'is-today': day.isToday }"
          >
            <header class="day-header">
              <div>
                <strong>{{ day.weekday }}</strong>
                <span>{{ day.label }}</span>
              </div>
              <span>{{ day.lessons.length }} Stunden</span>
            </header>

            <div v-if="day.lessons.length === 0" class="empty-text compact">
              Keine Stunden eingetragen.
            </div>

            <div v-else class="day-lessons">
              <RouterLink
                v-for="lesson in day.lessons"
                :key="lesson.id"
                :to="`/lessons/${lesson.id}/workspace`"
                class="lesson-row"
              >
                <time>{{ formatLessonTime(lesson) }}</time>
                <div>
                  <strong>{{ getLessonTitle(lesson) }}</strong>
                  <p>{{ getClassName(lesson.classGroupId) }}{{ getLessonMeta(lesson) }}</p>
                </div>
                <span>öffnen</span>
              </RouterLink>
            </div>
          </section>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useClassGroups, useLessons } from '../composables/useSportBridge'
import { getDashboardLessonState } from '../utils/dashboard-workspace'
import type { ClassGroup, Lesson } from '@viccoboard/core'
import { formatGermanDateTime, formatGermanTime } from '../utils/locale-format'

interface ScheduleDay {
  key: string
  label: string
  weekday: string
  isToday: boolean
  lessons: Lesson[]
}

const classGroups = useClassGroups()
const lessonsRepository = useLessons()

const loading = ref(true)
const loadError = ref('')
const classes = ref<ClassGroup[]>([])
const lessons = ref<Lesson[]>([])
const now = ref(Date.now())

const classesById = computed(() => new Map(classes.value.map((classGroup) => [classGroup.id, classGroup])))

const lessonState = computed(() => getDashboardLessonState(lessons.value, new Date(now.value)))
const currentOrNextLesson = computed(() => lessonState.value.currentOrNextLesson)
const upcomingLesson = computed(() => lessonState.value.upcomingLesson)

const scheduleDays = computed<ScheduleDay[]>(() => {
  const today = startOfDay(new Date(now.value))
  const grouped = new Map<string, Lesson[]>()

  for (const lesson of lessons.value) {
    const key = getDateKey(lesson.date)
    const dayLessons = grouped.get(key) ?? []
    dayLessons.push(lesson)
    grouped.set(key, dayLessons)
  }

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() + index)
    const key = getDateKey(date)
    const dayLessons = grouped.get(key) ?? []

    return {
      key,
      label: date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
      weekday: date.toLocaleDateString('de-DE', { weekday: 'long' }),
      isToday: index === 0,
      lessons: [...dayLessons].sort(compareLessonsByStartTime)
    }
  })
})

const scheduledLessonCount = computed(() =>
  scheduleDays.value.reduce((count, day) => count + day.lessons.length, 0)
)

const currentOrNextMode = computed(() => {
  if (!currentOrNextLesson.value) {
    return 'Heute'
  }

  return currentOrNextLesson.value.date.getTime() >= now.value ? 'Als Nächstes' : 'Zuletzt heute'
})

const loadData = async () => {
  loading.value = true
  loadError.value = ''

  try {
    const loadedClasses = await classGroups.findAll()
    classes.value = loadedClasses

    const today = startOfDay(new Date())
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + 7)

    const allLessons = await Promise.all(
      loadedClasses.map((classGroup) => {
        if (typeof lessonsRepository.findByDateRange === 'function') {
          return lessonsRepository.findByDateRange(classGroup.id, today, endDate)
        }
        return lessonsRepository.findByClassGroup(classGroup.id)
      })
    )

    lessons.value = allLessons.flat()
  } catch (error) {
    console.error('Failed to load schedule overview:', error)
    loadError.value = 'Die Stundenplanansicht konnte nicht geladen werden.'
  } finally {
    loading.value = false
  }
}

const getClassName = (classGroupId: string): string =>
  classesById.value.get(classGroupId)?.name ?? 'Unbekannte Klasse'

const getLessonTitle = (lesson: Lesson): string =>
  lesson.title?.trim() || 'Unterrichtsstunde'

const getLessonMeta = (lesson: Lesson): string => {
  const meta: string[] = []
  if (lesson.durationMinutes) {
    meta.push(`${lesson.durationMinutes} min`)
  }
  if (lesson.room) {
    meta.push(lesson.room)
  }
  return meta.length > 0 ? ` · ${meta.join(' · ')}` : ''
}

const formatLessonTime = (lesson: Lesson): string =>
  lesson.startTime || formatGermanTime(lesson.date)

const formatLessonDateTime = (lesson: Lesson): string =>
  `${formatGermanDateTime(lesson.date, { weekday: 'short' })} · ${formatLessonTime(lesson)}`

const compareLessonsByStartTime = (left: Lesson, right: Lesson): number =>
  getLessonStartMinutes(left) - getLessonStartMinutes(right)

const getLessonStartMinutes = (lesson: Lesson): number => {
  const parsed = parseTimeToMinutes(lesson.startTime)
  if (parsed !== null) {
    return parsed
  }

  return lesson.date.getHours() * 60 + lesson.date.getMinutes()
}

const parseTimeToMinutes = (time: string | undefined): number | null => {
  if (!time) {
    return null
  }

  const match = /^(\d{2}):(\d{2})$/.exec(time)
  if (!match) {
    return null
  }

  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) {
    return null
  }

  return hours * 60 + minutes
}

const startOfDay = (date: Date): Date => {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

const getDateKey = (date: Date): string => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.schedule-overview {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header,
.panel-header,
.actions,
.day-header,
.lesson-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.page-header,
.panel-header,
.actions {
  flex-wrap: wrap;
}

.day-header,
.lesson-row {
  align-items: center;
}

.page-header h1,
.panel h2,
.panel h3,
.day-header strong,
.lesson-row p {
  margin: 0;
}

.subtitle,
.panel-subtitle,
.empty-text,
.mini-lesson span,
.day-header span,
.lesson-row p {
  color: #64748b;
}

.panel-subtitle {
  margin: 0.25rem 0 0;
}

.primary-link,
.ghost-link,
.lesson-row {
  min-height: 44px;
  border-radius: 16px;
  text-decoration: none;
}

.primary-link,
.ghost-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1rem;
  font-weight: 600;
}

.primary-link {
  background: #0f172a;
  color: white;
}

.ghost-link {
  border: 1px solid rgba(15, 23, 42, 0.12);
  color: #0f172a;
}

.state-card,
.panel,
.day-card {
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  padding: 1.25rem;
}

.state-card.error {
  color: #991b1b;
}

.schedule-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.hero-panel {
  min-height: 220px;
}

.full-width {
  grid-column: 1 / -1;
}

.eyebrow {
  margin: 0 0 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  color: #0f766e;
  font-weight: 700;
}

.lesson-focus,
.week-list,
.day-lessons,
.mini-lesson {
  display: flex;
  flex-direction: column;
}

.lesson-focus {
  gap: 0.75rem;
}

.week-list,
.day-lessons,
.mini-lesson {
  gap: 0.75rem;
}

.day-card.is-today {
  border-color: rgba(15, 118, 110, 0.36);
}

.lesson-row {
  align-items: center;
  padding: 0.875rem 1rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  color: #0f172a;
}

.lesson-row time {
  min-width: 3.25rem;
  font-weight: 700;
  color: #0f766e;
}

.lesson-row div {
  flex: 1;
}

.empty-text.compact {
  margin: 0;
}

@media (max-width: 820px) {
  .schedule-grid {
    grid-template-columns: 1fr;
  }

  .lesson-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .lesson-row time {
    min-width: auto;
  }
}
</style>
