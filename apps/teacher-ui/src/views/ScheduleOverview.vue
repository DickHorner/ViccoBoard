<template>
  <section class="schedule-overview">
    <header class="page-header">
      <div>
        <h1>Stundenplan</h1>
        <p class="subtitle">Stunden nach Kalendertag gruppiert, sortiert nach Startzeit.</p>
      </div>
      <RouterLink class="primary-link" to="/lessons">
        Stunden verwalten
      </RouterLink>
    </header>

    <div v-if="loading" class="state-card">Stunden werden geladen...</div>
    <div v-else-if="loadError" class="state-card error">{{ loadError }}</div>

    <template v-else>
      <div class="schedule-grid">
        <section class="panel hero-panel">
          <h2>Jetzt / Als Nächstes</h2>
          <div v-if="currentOrNextLesson" class="lesson-focus">
            <p class="eyebrow">{{ currentOrNextMode }}</p>
            <h3>{{ getClassName(currentOrNextLesson.classGroupId) }}</h3>
            <p v-if="currentOrNextLesson.title" class="lesson-title">{{ currentOrNextLesson.title }}</p>
            <div class="lesson-meta-row">
              <span>{{ currentOrNextLesson.startTime }}</span>
              <span>{{ currentOrNextLesson.durationMinutes }}&nbsp;min</span>
              <span v-if="currentOrNextLesson.room">{{ currentOrNextLesson.room }}</span>
            </div>
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
            <strong>{{ getClassName(upcomingLesson.classGroupId) }}</strong>
            <span v-if="upcomingLesson.title">{{ upcomingLesson.title }}</span>
            <span>{{ upcomingLesson.startTime }} · {{ upcomingLesson.durationMinutes }}&nbsp;min</span>
            <span v-if="upcomingLesson.room">{{ upcomingLesson.room }}</span>
          </div>
          <p v-else class="empty-text">Keine weitere Stunde für heute gefunden.</p>
        </section>
      </div>

      <section class="panel">
        <div class="panel-header">
          <h2>Kalenderansicht</h2>
          <span>{{ totalLessons }} Einträge</span>
        </div>

        <div v-if="lessonsByDay.length === 0" class="empty-text">
          Keine Stunden in der Datenbasis.
        </div>

        <div v-else class="calendar-days">
          <div
            v-for="dayGroup in lessonsByDay"
            :key="dayGroup.key"
            class="day-group"
            :class="{ 'day-today': dayGroup.isToday }"
          >
            <div class="day-label">
              <strong>{{ dayGroup.label }}</strong>
              <span class="day-count">{{ dayGroup.lessons.length }}</span>
            </div>
            <div class="day-lessons">
              <RouterLink
                v-for="lesson in dayGroup.lessons"
                :key="lesson.id"
                :to="`/lessons/${lesson.id}/workspace`"
                class="lesson-row"
              >
                <span class="lesson-time">{{ lesson.startTime }}</span>
                <div class="lesson-body">
                  <span class="lesson-class">{{ getClassName(lesson.classGroupId) }}</span>
                  <span v-if="lesson.title" class="lesson-title-small">{{ lesson.title }}</span>
                </div>
                <div class="lesson-details">
                  <span>{{ lesson.durationMinutes }}&nbsp;min</span>
                  <span v-if="lesson.room" class="lesson-room">{{ lesson.room }}</span>
                </div>
              </RouterLink>
            </div>
          </div>
        </div>
      </section>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useClassGroups, useLessons } from '../composables/useSportBridge'
import { getDashboardLessonState } from '../utils/dashboard-workspace'
import type { ClassGroup, Lesson } from '@viccoboard/core'
import { formatGermanDateTime } from '../utils/locale-format'

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

const currentOrNextMode = computed(() => {
  if (!currentOrNextLesson.value) {
    return 'Heute'
  }
  return currentOrNextLesson.value.date.getTime() >= now.value ? 'Als Nächstes' : 'Zuletzt heute'
})

const toDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const todayKey = computed(() => toDateKey(new Date(now.value)))

const lessonsByDay = computed(() => {
  const groups = new Map<string, Lesson[]>()
  for (const lesson of lessons.value) {
    const key = toDateKey(lesson.date)
    const group = groups.get(key)
    if (group) {
      group.push(lesson)
    } else {
      groups.set(key, [lesson])
    }
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, dayLessons]) => {
      const date = dayLessons[0].date
      return {
        key,
        isToday: key === todayKey.value,
        label: formatGermanDateTime(date, { weekday: 'long', day: 'numeric', month: 'long' }),
        lessons: [...dayLessons].sort((a, b) => a.startTime.localeCompare(b.startTime))
      }
    })
})

const totalLessons = computed(() => lessons.value.length)

const loadData = async () => {
  loading.value = true
  loadError.value = ''

  try {
    const loadedClasses = await classGroups.findAll()
    classes.value = loadedClasses

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 7)

    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + 14)

    const allLessons = await Promise.all(
      loadedClasses.map((classGroup) => {
        if (typeof lessonsRepository.findByDateRange === 'function') {
          return lessonsRepository.findByDateRange(classGroup.id, startDate, endDate)
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
.actions {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.page-header h1,
.panel h2,
.panel h3 {
  margin: 0;
}

.subtitle,
.empty-text,
.mini-lesson span,
.lesson-title-small,
.lesson-room {
  color: #64748b;
}

.primary-link,
.ghost-link {
  min-height: 44px;
  border-radius: 16px;
  text-decoration: none;
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
.panel {
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

.eyebrow {
  margin: 0 0 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  color: #0f766e;
  font-weight: 700;
}

.lesson-focus {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.lesson-title {
  color: #475569;
  margin: 0;
}

.lesson-meta-row {
  display: flex;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: #475569;
}

.mini-lesson {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.mini-lesson strong {
  display: block;
}

/* Calendar grouped view */
.calendar-days {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 0.75rem;
}

.day-group {
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  overflow: hidden;
}

.day-today {
  border-color: #0f766e;
}

.day-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background: rgba(15, 23, 42, 0.03);
  font-size: 0.875rem;
}

.day-today .day-label {
  background: rgba(13, 148, 136, 0.08);
  color: #0f766e;
}

.day-count {
  font-size: 0.75rem;
  color: #94a3b8;
  background: rgba(15, 23, 42, 0.06);
  border-radius: 99px;
  padding: 0.1rem 0.5rem;
}

.day-lessons {
  display: flex;
  flex-direction: column;
}

.lesson-row {
  display: grid;
  grid-template-columns: 3.5rem 1fr auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  border-top: 1px solid rgba(15, 23, 42, 0.05);
  text-decoration: none;
  color: #0f172a;
  transition: background 0.1s;
}

.lesson-row:hover {
  background: rgba(15, 23, 42, 0.03);
}

.lesson-time {
  font-variant-numeric: tabular-nums;
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f766e;
}

.lesson-body {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.lesson-class {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lesson-title-small {
  font-size: 0.8125rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lesson-details {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.1rem;
  font-size: 0.8125rem;
  white-space: nowrap;
}

@media (max-width: 820px) {
  .schedule-grid {
    grid-template-columns: 1fr;
  }

  .lesson-row {
    grid-template-columns: 3rem 1fr;
  }

  .lesson-details {
    display: none;
  }
}
</style>
