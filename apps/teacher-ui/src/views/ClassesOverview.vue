<template>
  <section class="classes-overview">
    <header class="page-header">
      <div>
        <h1>Klassen</h1>
        <p class="subtitle">Fächerübergreifende Klassenverwaltung mit Direktzugriff auf Stunden, Schüler und Anwesenheit.</p>
      </div>
      <RouterLink class="primary-link" to="/">
        Neue Klasse auf der Startseite
      </RouterLink>
    </header>

    <section class="filter-card">
      <input
        v-model="searchQuery"
        class="search-input"
        type="search"
        placeholder="Klasse oder Schuljahr suchen"
      />
      <label class="archive-toggle">
        <input v-model="showArchived" type="checkbox" />
        Archivierte Klassen anzeigen
      </label>
      <p class="filter-note">{{ visibleClasses.length }} Klassen sichtbar</p>
    </section>

    <div v-if="loading" class="state-card">Klassen werden geladen...</div>
    <div v-else-if="loadError" class="state-card error">{{ loadError }}</div>
    <div v-else-if="visibleClasses.length === 0" class="state-card">
      Noch keine Klassen gefunden.
    </div>

    <div v-else class="class-grid">
      <article v-for="entry in visibleClasses" :key="entry.classGroup.id" class="class-card">
        <div class="class-card-header">
          <div class="class-title">
            <span class="class-color" :style="getClassColorStyle(entry.classGroup.color)"></span>
            <div>
              <h2>{{ entry.classGroup.name }}</h2>
              <p>{{ entry.classGroup.schoolYear }}</p>
            </div>
          </div>
          <span class="status-badge" :class="{ archived: entry.classGroup.archived }">
            {{ entry.classGroup.archived ? 'Archiviert' : 'Aktiv' }}
          </span>
        </div>

        <div class="class-metrics">
          <div>
            <strong>{{ entry.studentCount === null ? '…' : entry.studentCount ?? '–' }}</strong>
            <span>Schüler</span>
          </div>
          <div>
            <strong>{{ entry.lessonCount === null ? '…' : entry.lessonCount ?? '–' }}</strong>
            <span>Stunden</span>
          </div>
        </div>

        <div class="class-actions">
          <RouterLink
            :to="`/classes/${entry.classGroup.id}`"
            class="ghost-link"
            @pointerenter="prefetchClassStudents(entry.classGroup.id)"
            @pointerdown="prefetchClassStudents(entry.classGroup.id)"
            @focus="prefetchClassStudents(entry.classGroup.id)"
            @click="rememberClassForNavigation(entry.classGroup)"
          >Details</RouterLink>
          <RouterLink :to="`/lessons?classId=${entry.classGroup.id}`" class="ghost-link">Stunden</RouterLink>
          <RouterLink :to="`/attendance?classId=${entry.classGroup.id}`" class="ghost-link">Anwesenheit</RouterLink>
        </div>
      </article>
    </div>
    <p v-if="metricsError" class="state-card error">{{ metricsError }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useClassGroups, useLessons } from '../composables/useSportBridge'
import { useStudents } from '../composables/useStudentsBridge'
import type { ClassGroup } from '@viccoboard/core'
import { prefetchClassStudents, rememberClassForNavigation, scheduleViewPrefetch } from '../services/navigation-prefetch'
import { recordRouteContentReady } from '../utils/navigation-performance'

interface ClassOverviewEntry {
  classGroup: ClassGroup
  studentCount: number | null | undefined
  lessonCount: number | null | undefined
}

const classGroups = useClassGroups()
const lessonsRepository = useLessons()
const { repository: studentRepository } = useStudents()

const loading = ref(true)
const loadError = ref('')
const metricsError = ref('')
let cancelViewPrefetch: (() => void) | null = null
const searchQuery = ref('')
const showArchived = ref(false)
const classes = ref<ClassOverviewEntry[]>([])

const visibleClasses = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return classes.value.filter((entry) => {
    if (entry.classGroup.archived && !showArchived.value) return false
    if (!query) {
      return true
    }

    return entry.classGroup.name.toLowerCase().includes(query)
      || entry.classGroup.schoolYear.toLowerCase().includes(query)
  })
})

const loadData = async () => {
  loading.value = true
  loadError.value = ''
  metricsError.value = ''

  try {
    const allClasses = await classGroups.findAll()
    classes.value = allClasses.map(classGroup => ({
      classGroup,
      studentCount: null,
      lessonCount: null
    }))
  } catch (error) {
    console.error('Failed to load class overview:', error)
    loadError.value = 'Die Klassenübersicht konnte nicht geladen werden.'
  } finally {
    loading.value = false
  }

  if (loadError.value) return

  await nextTick()
  recordRouteContentReady('classes')
  cancelViewPrefetch = scheduleViewPrefetch(() => import('./ClassDetail.vue'))

  void Promise.all(classes.value.map(async entry => {
    const classId = entry.classGroup.id
    const [students, lessons] = await Promise.allSettled([
      studentRepository.value?.countByClassGroup(classId) ?? Promise.resolve(0),
      lessonsRepository.count({ class_group_id: classId })
    ])

    entry.studentCount = students.status === 'fulfilled' ? students.value : undefined
    entry.lessonCount = lessons.status === 'fulfilled' ? lessons.value : undefined

    if (students.status === 'rejected' || lessons.status === 'rejected') {
      metricsError.value = 'Einige Klassenzahlen konnten nicht geladen werden.'
      console.error('Failed to load class counts:', classId, students, lessons)
    }
  }))
}

const getClassColorStyle = (color?: string) => {
  const colorMap: Record<string, string> = {
    white: '#f8f9fa',
    green: '#7ed957',
    red: '#ff6b6b',
    blue: '#4dabf7',
    orange: '#ffa94d',
    yellow: '#ffd43b',
    grey: '#adb5bd'
  }

  return { backgroundColor: color ? colorMap[color] || '#e0e0e0' : '#e0e0e0' }
}

onMounted(() => {
  void loadData()
})

onUnmounted(() => {
  cancelViewPrefetch?.()
})
</script>

<style scoped>
.classes-overview {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.page-header h1,
.class-title h2 {
  margin: 0;
}

.subtitle,
.class-title p,
.filter-note {
  margin: 0.35rem 0 0;
  color: #64748b;
}

.primary-link,
.ghost-link {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1rem;
  border-radius: 999px;
  text-decoration: none;
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

.filter-card,
.state-card,
.class-card {
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
}

.filter-card {
  padding: 1rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
}
.archive-toggle { display: inline-flex; align-items: center; gap: .5rem; }

.search-input {
  width: 100%;
  min-height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  padding: 0.75rem 1rem;
  font: inherit;
}

.state-card {
  padding: 1.5rem;
}

.state-card.error {
  color: #991b1b;
}

.class-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.class-card {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.class-card-header,
.class-actions,
.class-metrics {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.class-title {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.class-color {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.status-badge {
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  background: rgba(22, 163, 74, 0.14);
  color: #166534;
  font-size: 0.8rem;
  font-weight: 700;
}

.status-badge.archived {
  background: rgba(148, 163, 184, 0.18);
  color: #475569;
}

.class-metrics div {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  color: #334155;
}

.class-metrics strong {
  font-size: 1.15rem;
}

@media (max-width: 720px) {
  .class-actions {
    flex-direction: column;
  }

  .ghost-link,
  .primary-link {
    width: 100%;
  }
}
</style>

