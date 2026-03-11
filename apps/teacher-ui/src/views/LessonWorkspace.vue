<template>
  <section class="lesson-workspace">
    <div
      v-if="loading"
      class="state-card"
      role="status"
      aria-live="polite"
    >
      Arbeitsbereich wird geladen...
    </div>
    <div
      v-else-if="loadError"
      class="state-card error"
      role="alert"
      aria-live="assertive"
    >
      {{ loadError }}
    </div>

    <template v-else-if="lesson && classGroup">
      <header class="page-header">
        <div>
          <p class="eyebrow">Stunden-Workspace</p>
          <h1>{{ classGroup.name }}</h1>
          <p class="subtitle">{{ formatLessonDateTime(lesson.date) }}</p>
        </div>
        <RouterLink :to="`/attendance?classId=${classGroup.id}&lessonId=${lesson.id}`" class="primary-link">
          Anwesenheit erfassen
        </RouterLink>
      </header>

      <section v-if="workspaceSubject === 'generic'" class="notice-card">
        <strong>Fachprofil offen</strong>
        <p>Fuer diese Klasse ist noch kein eindeutiges Fachprofil hinterlegt. Der Workspace bietet deshalb sowohl fachneutrale als auch fachbezogene Einstiege an.</p>
      </section>

      <div class="workspace-grid">
        <section class="panel">
          <h2>Organisation</h2>
          <div class="link-grid">
            <RouterLink :to="`/lessons?classId=${classGroup.id}`" class="workspace-link">
              <strong>Stundenliste</strong>
              <span>Diese Klasse im Stundenkontext oeffnen</span>
            </RouterLink>
            <RouterLink :to="`/classes/${classGroup.id}`" class="workspace-link">
              <strong>Klasse</strong>
              <span>Klasseninformationen, Schueler und Statistiken</span>
            </RouterLink>
            <RouterLink :to="`/students`" class="workspace-link">
              <strong>Schueler</strong>
              <span>Zentrale Verwaltung und Profile</span>
            </RouterLink>
          </div>
        </section>

        <section class="panel">
          <h2>Fachkontext</h2>
          <div class="link-grid">
            <RouterLink
              v-for="entry in subjectEntries"
              :key="entry.to"
              :to="entry.to"
              class="workspace-link"
            >
              <strong>{{ entry.title }}</strong>
              <span>{{ entry.description }}</span>
            </RouterLink>
          </div>
        </section>

        <section class="panel full-width">
          <h2>Stundendetails</h2>
          <div class="details-grid">
            <div>
              <strong>Klasse</strong>
              <span>{{ classGroup.name }} ({{ classGroup.schoolYear }})</span>
            </div>
            <div>
              <strong>Fachprofil</strong>
              <span>{{ classGroup.subjectProfile || 'nicht gesetzt' }}</span>
            </div>
            <div>
              <strong>Datum</strong>
              <span>{{ formatLessonDateTime(lesson.date) }}</span>
            </div>
            <div>
              <strong>Stundenteile</strong>
              <span>{{ lesson.lessonParts?.length || 0 }}</span>
            </div>
          </div>

          <div v-if="lesson.lessonParts?.length" class="parts-list">
            <article v-for="part in lesson.lessonParts" :key="part.id" class="part-card">
              <strong>{{ part.description }}</strong>
              <span>{{ part.type || 'Teil' }}</span>
            </article>
          </div>
        </section>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { getSportBridge } from '../composables/useSportBridge'
import { resolveLessonWorkspaceSubject } from '../utils/lesson-workspace'
import type { ClassGroup, Lesson } from '@viccoboard/core'

const route = useRoute()
const SportBridge = getSportBridge()

const loading = ref(true)
const loadError = ref('')
const lesson = ref<Lesson | null>(null)
const classGroup = ref<ClassGroup | null>(null)

const workspaceSubject = computed(() =>
  resolveLessonWorkspaceSubject(classGroup.value?.subjectProfile)
)

const subjectEntries = computed(() => {
  if (workspaceSubject.value === 'sport') {
    return [
      { to: '/subjects/sport', title: 'Sport-Hub', description: 'Bewertung, Tests und Tools fuer diese Stunde.' },
      { to: '/grading', title: 'Sport-Bewertung', description: 'Kategorien und Leistungserfassung oeffnen.' },
      { to: '/tools/timer', title: 'Live-Tools', description: 'Timer, Teams, Scoreboard und weitere Unterrichtstools.' }
    ]
  }

  if (workspaceSubject.value === 'kbr') {
    return [
      { to: '/subjects/kbr', title: 'KBR-Hub', description: 'Pruefungen, Korrektur und Analyse ansteuern.' },
      { to: '/exams', title: 'Pruefungen', description: 'Bestehende Pruefungen oeffnen oder neue erstellen.' },
      { to: '/settings', title: 'Vorbereitung', description: 'Einstellungen und KBR-nahe Konfiguration im Blick behalten.' }
    ]
  }

  return [
    { to: '/subjects/sport', title: 'Sport', description: 'Sport-Workspace fuer Bewertung, Tests und Tools.' },
    { to: '/subjects/kbr', title: 'KBR', description: 'KBR-Workspace fuer Pruefungen und Korrektur.' },
    { to: '/schedule', title: 'Organisation', description: 'Fachneutral im Stundenplan und bei der Stunde bleiben.' }
  ]
})

const loadData = async () => {
  loading.value = true
  loadError.value = ''

  try {
    const lessonId = String(route.params.id)
    const loadedLesson = await SportBridge.lessonRepository.findById(lessonId)

    if (!loadedLesson) {
      loadError.value = 'Die angeforderte Stunde wurde nicht gefunden.'
      return
    }

    const loadedClassGroup = await SportBridge.classGroupRepository.findById(loadedLesson.classGroupId)

    if (!loadedClassGroup) {
      loadError.value = 'Die zugehoerige Klasse konnte nicht geladen werden.'
      return
    }

    lesson.value = loadedLesson
    classGroup.value = loadedClassGroup
  } catch (error) {
    console.error('Failed to load lesson workspace:', error)
    loadError.value = 'Der Stunden-Workspace konnte nicht geladen werden.'
  } finally {
    loading.value = false
  }
}

const formatLessonDateTime = (date: Date): string =>
  new Date(date).toLocaleString([], {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.lesson-workspace {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: flex-start;
}

.page-header h1,
.panel h2 {
  margin: 0;
}

.eyebrow {
  margin: 0 0 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.78rem;
  color: #0f766e;
  font-weight: 700;
}

.subtitle,
.workspace-link span,
.notice-card p,
.details-grid span,
.part-card span {
  color: #64748b;
}

.primary-link,
.workspace-link {
  text-decoration: none;
}

.primary-link {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1rem;
  border-radius: 999px;
  background: #0f172a;
  color: white;
  font-weight: 600;
}

.state-card,
.notice-card,
.panel {
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  padding: 1.25rem;
}

.state-card.error {
  color: #991b1b;
}

.notice-card {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.16), rgba(14, 165, 233, 0.08));
}

.workspace-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.full-width {
  grid-column: 1 / -1;
}

.link-grid {
  display: grid;
  gap: 0.75rem;
}

.workspace-link,
.part-card {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  color: #0f172a;
  background: rgba(248, 250, 252, 0.9);
}

.details-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.details-grid div {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.parts-list {
  display: grid;
  gap: 0.75rem;
  margin-top: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

@media (max-width: 820px) {
  .workspace-grid {
    grid-template-columns: 1fr;
  }
}
</style>

