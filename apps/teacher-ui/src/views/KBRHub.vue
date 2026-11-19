<template>
  <section class="subject-hub">
    <header class="page-header">
      <div>
        <h1>KBR</h1>
        <p class="subtitle">Was möchtest Du tun? Wähle Deinen Arbeitsschritt – Prüfung erstellen, korrigieren, Rückmeldebogen oder Analyse.</p>
      </div>
      <Tag :value="loading ? '… Prüfungen' : `${examCount} Prüfungen`" severity="info" />
    </header>

    <div class="hub-grid">
      <RouterLink v-for="entry in entries" :key="entry.to" class="hub-card app-card" :to="entry.to">
        <p class="eyebrow">{{ entry.eyebrow }}</p>
        <h2>{{ entry.title }}</h2>
        <p>{{ entry.description }}</p>
      </RouterLink>
    </div>

    <section class="metrics-grid">
      <article class="metric-card app-card">
        <strong>{{ examCount }}</strong>
        <span>Prüfungen</span>
      </article>
      <article class="metric-card app-card">
        <strong>{{ countsLoading ? '…' : supportTipCount }}</strong>
        <span>Fördertipps</span>
      </article>
      <article class="metric-card app-card">
        <strong>{{ countsLoading ? '…' : longTermNoteCount }}</strong>
        <span>Langzeitnotizen</span>
      </article>
    </section>

    <Message v-if="countsError" severity="warn" role="status">{{ countsError }}</Message>

    <section class="recent-panel app-card">
      <div class="panel-header">
        <h2>Zuletzt bearbeitet</h2>
      </div>

      <div v-if="loading" class="state-card app-card" role="status">Prüfungen werden geladen...</div>
      <div v-else-if="loadError" class="state-card app-card">
        <Message severity="error" role="alert">{{ loadError }}</Message>
        <Button label="Erneut versuchen" @click="loadData" />
      </div>
      <div v-else-if="recentExams.length === 0" class="state-card app-card">Noch keine Prüfungen vorhanden.</div>

      <div v-else class="exam-list">
        <article v-for="exam in recentExams" :key="exam.id" class="exam-row">
          <div>
            <strong>{{ exam.title }}</strong>
            <p>{{ formatDate(exam.lastModified) }}</p>
          </div>
          <div class="row-actions">
            <RouterLink :to="`/exams/${exam.id}`" class="ghost-link">Öffnen</RouterLink>
            <RouterLink :to="`/exams/${exam.id}/correct`" class="ghost-link">Korrigieren</RouterLink>
            <RouterLink :to="`/exams/${exam.id}/analysis`" class="ghost-link">Analyse</RouterLink>
            <RouterLink :to="`/exams/${exam.id}/export`" class="ghost-link">Rückmeldebogen</RouterLink>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import Button from 'openvue/button'
import Message from 'openvue/message'
import Tag from 'openvue/tag'
import { useExamsBridge } from '../composables/useExamsBridge'
import type { Exams as ExamsTypes } from '@viccoboard/core'
import { formatGermanDate } from '../utils/locale-format'
import { isExamTemplate } from '../utils/exam-school-year'

const { examRepository } = useExamsBridge()
const { supportTipRepository, studentLongTermNoteRepository } = useExamsBridge()

const loading = ref(true)
const loadError = ref('')
const countsError = ref('')
const countsLoading = ref(true)
const exams = ref<ExamsTypes.Exam[]>([])
const supportTipCount = ref(0)
const longTermNoteCount = ref(0)

const examCount = computed(() => exams.value.length)
const recentExams = computed(() =>
  [...exams.value]
    .filter(exam => !isExamTemplate(exam))
    .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
    .slice(0, 5)
)
const entries = [
  {
    to: '/exams/new',
    eyebrow: 'Erstellen',
    title: 'Neue Prüfung',
    description: 'Aufgaben, Erwartungen, Notenschlüssel und Prüflinge anlegen.'
  },
  {
    to: '/exams',
    eyebrow: 'Verwalten',
    title: 'Prüfungen',
    description: 'Prüfungen und Vorlagen finden, bearbeiten und wiederverwenden.'
  },
  {
    to: '/exams?workflow=correct',
    eyebrow: 'Bewerten',
    title: 'Manuelle Korrektur',
    description: 'Prüfung auswählen und direkt nach Prüfling oder Aufgabe korrigieren.'
  },
  {
    to: '/sheet-templates',
    eyebrow: 'Gestaltung',
    title: 'Druckbogenvorlagen',
    description: 'Unabhängig von Prüfungen erstellen, bearbeiten und später für Prüfungen verwenden.'
  },
  {
    to: '/exams?workflow=sheets',
    eyebrow: 'Rückmeldung',
    title: 'Rückmeldebögen',
    description: 'Prüfung auswählen, Druckbögen prüfen und exportieren.'
  },
  {
    to: '/exams?workflow=analysis',
    eyebrow: 'Auswerten',
    title: 'Analyse',
    description: 'Prüfung auswählen und Ergebnisse sowie Aufgabenschwierigkeiten auswerten.'
  },
  {
    to: '/support-tips',
    eyebrow: 'Förderung',
    title: 'Fördertipps',
    description: 'Förderhinweise verwalten und in Rückmeldungen wiederverwenden.'
  }
]

const loadData = async () => {
  loading.value = true
  loadError.value = ''
  try {
    exams.value = await (examRepository?.findAll() ?? Promise.resolve([]))
  } catch (error) {
    console.error('Failed to load KBR exams:', error)
    loadError.value = 'Prüfungen konnten nicht geladen werden.'
  } finally {
    loading.value = false
  }
}

const loadCounts = async () => {
  countsLoading.value = true
  try {
    const [supportTips, longTermNotes] = await Promise.all([
      supportTipRepository?.findAll() ?? Promise.resolve([]),
      studentLongTermNoteRepository?.findAll() ?? Promise.resolve([])
    ])
    supportTipCount.value = supportTips.length
    longTermNoteCount.value = longTermNotes.length
  } catch (error) {
    console.error('Failed to load KBR metrics:', error)
    countsError.value = 'Einige Kennzahlen konnten nicht geladen werden.'
  } finally {
    countsLoading.value = false
  }
}

const formatDate = (date: Date): string =>
  formatGermanDate(date)

onMounted(() => {
  void loadData()
  void loadCounts()
})
</script>

<style scoped>
.subject-hub {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header,
.panel-header,
.row-actions {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  flex-wrap: wrap;
}

.page-header h1,
.hub-card h2,
.recent-panel h2 {
  margin: 0;
}

.subtitle,
.hub-card p,
.exam-row p {
  color: #64748b;
}

.metrics-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
}

.metric-card {
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.metric-card strong {
  font-size: 1.5rem;
}

.metric-card span {
  color: #64748b;
}

.hub-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
}

.hub-card {
  padding: 1.25rem;
  text-decoration: none;
  color: var(--color-ink);
}

.hub-card:focus-visible,
.ghost-link:focus-visible {
  outline: 2px solid var(--accent-strong);
  outline-offset: 2px;
}

.eyebrow {
  margin: 0 0 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  color: #0f766e;
  font-weight: 700;
}

.recent-panel,
.state-card {
  padding: 1.25rem;
}

.state-card :deep(.p-button) {
  min-height: 44px;
  margin-top: 0.75rem;
}

.exam-list {
  display: grid;
  gap: 0.75rem;
}

.exam-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
}

.exam-row:first-child {
  border-top: none;
}

.ghost-link {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1rem;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  text-decoration: none;
  color: #0f172a;
  font-weight: 600;
}

@media (max-width: 720px) {
  .row-actions {
    width: 100%;
  }

  .ghost-link {
    flex: 1;
  }
}
</style>
