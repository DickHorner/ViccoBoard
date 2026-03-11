<template>
  <section class="schedule-overview">
    <header class="page-header">
      <div>
        <h1>Stundenplan</h1>
        <p class="subtitle">Zentrale Stunden- und Tagesuebersicht. Die volle Stundenplanlogik folgt, vorhandene Stunden sind bereits eingebunden.</p>
      </div>
      <RouterLink class="primary-link" to="/lessons">
        Stunden verwalten
      </RouterLink>
    </header>

    <section class="notice-card">
      <strong>Hinweis zum Ausbaustand</strong>
      <p>Die Stundenplan-Startseite zeigt bereits heutige und anstehende Stunden. Automatische Stundenplanerzeugung und Wochenraster werden im naechsten Schritt ausgebaut.</p>
    </section>

    <div v-if="loading" class="state-card">Stunden werden geladen...</div>
    <div v-else-if="loadError" class="state-card error">{{ loadError }}</div>
    <div v-else class="schedule-grid">
      <section class="panel hero-panel">
        <h2>Jetzt / Als Naechstes</h2>
        <div v-if="currentOrNextLesson" class="lesson-focus">
          <p class="eyebrow">{{ currentOrNextMode }}</p>
          <h3>{{ getClassName(currentOrNextLesson.classGroupId) }}</h3>
          <p>{{ formatLessonDateTime(currentOrNextLesson.date) }}</p>
          <div class="actions">
            <RouterLink :to="`/lessons/${currentOrNextLesson.id}/workspace`" class="ghost-link">
              Workspace oeffnen
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
          <span>{{ formatLessonDateTime(upcomingLesson.date) }}</span>
        </div>
        <p v-else class="empty-text">Keine weitere Stunde fuer heute gefunden.</p>
      </section>

      <section class="panel full-width">
        <div class="panel-header">
          <h2>Heute</h2>
          <span>{{ todayLessons.length }} Eintraege</span>
        </div>

        <div v-if="todayLessons.length === 0" class="empty-text">Heute liegen noch keine Stunden in der Datenbasis.</div>

        <div v-else class="today-list">
          <RouterLink
            v-for="lesson in todayLessons"
            :key="lesson.id"
            :to="`/lessons/${lesson.id}/workspace`"
            class="today-item"
          >
            <div>
              <strong>{{ getClassName(lesson.classGroupId) }}</strong>
              <p>{{ formatLessonTime(lesson.date) }}</p>
            </div>
            <span>oeffnen</span>
          </RouterLink>
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

const classGroups = useClassGroups()
const lessonsRepository = useLessons()

const loading = ref(true)
const loadError = ref('')
const classes = ref<ClassGroup[]>([])
const lessons = ref<Lesson[]>([])
const now = ref(Date.now())

const classesById = computed(() => new Map(classes.value.map((classGroup) => [classGroup.id, classGroup])))

const lessonState = computed(() => getDashboardLessonState(lessons.value, new Date(now.value)))
const todayLessons = computed(() => lessonState.value.todayLessons)
const currentOrNextLesson = computed(() => lessonState.value.currentOrNextLesson)
const upcomingLesson = computed(() => lessonState.value.upcomingLesson)

const currentOrNextMode = computed(() => {
  if (!currentOrNextLesson.value) {
    return 'Heute'
  }

  return currentOrNextLesson.value.date.getTime() >= now.value ? 'Als Naechstes' : 'Zuletzt heute'
})

const loadData = async () => {
  loading.value = true
  loadError.value = ''

  try {
    const loadedClasses = await classGroups.findAll()
    classes.value = loadedClasses

    // Fetch only today's and upcoming lessons to reduce IO and memory
    // instead of loading full lesson histories for each class
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Look ahead 7 days to catch upcoming lessons
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + 7)

    const allLessons = await Promise.all(
      loadedClasses.map((classGroup) => {
        // Try to use date-range fetching if available, otherwise fallback to full fetch
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

const formatLessonTime = (date: Date): string =>
  new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

const formatLessonDateTime = (date: Date): string =>
  new Date(date).toLocaleString([], {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })

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
.notice-card p,
.empty-text,
.mini-lesson span,
.today-item p {
  color: #64748b;
}

.primary-link,
.ghost-link,
.today-item {
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

.notice-card,
.state-card,
.panel {
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  padding: 1.25rem;
}

.notice-card {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.16), rgba(14, 165, 233, 0.08));
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

.lesson-focus {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.today-list {
  display: grid;
  gap: 0.75rem;
}

.today-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  color: #0f172a;
}

.today-item strong,
.mini-lesson strong {
  display: block;
}

@media (max-width: 820px) {
  .schedule-grid {
    grid-template-columns: 1fr;
  }
}
</style>
