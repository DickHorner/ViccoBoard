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
        <span class="hub-link-category">{{ entry.eyebrow }}</span>
        <strong>{{ entry.title }}</strong>
        <span class="hub-link-description">{{ entry.description }}</span>
        <i class="pi pi-angle-right" aria-hidden="true"></i>
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
            <RouterLink :to="`/exams/${exam.id}/workspace`" class="ghost-link">Öffnen</RouterLink>
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
  gap: 16px;
}

.page-header,
.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.page-header h1,
.panel-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 650;
}

.subtitle {
  margin: 4px 0 0;
  color: var(--color-muted);
  font-size: 13.5px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(165px, 1fr));
  gap: 12px;
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 14px 16px;
}

.metric-card strong {
  font-size: 24px;
  font-variant-numeric: tabular-nums;
}

.metric-card span {
  order: -1;
  color: var(--color-muted);
  font-size: 11.5px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.hub-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 360px), 1fr));
  gap: 0 24px;
  padding: 4px 16px;
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  background: var(--surface-glass);
}

.hub-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-content: center;
  gap: 3px 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--surface-border);
  background: transparent;
  color: var(--color-ink);
  text-decoration: none;
  box-shadow: none;
  border-radius: 0;
}

.hub-card:hover {
  color: var(--accent-strong);
}

.hub-card:focus-visible,
.ghost-link:focus-visible {
  outline: 2px solid var(--accent-strong);
  outline-offset: -2px;
}

.hub-link-category {
  grid-column: 1 / -1;
  color: var(--color-muted);
  font-size: 10.5px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.hub-card strong {
  font-size: 13.5px;
  font-weight: 600;
}

.hub-link-description {
  grid-column: 1;
  color: var(--color-muted);
  font-size: 12px;
  line-height: 1.4;
}

.hub-card .pi {
  grid-column: 2;
  grid-row: 2 / span 2;
  align-self: center;
  color: var(--color-muted);
  font-size: 12px;
}

.recent-panel,
.state-card {
  padding: 14px 16px;
}

.exam-list {
  display: grid;
}

.exam-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 0;
  border-bottom: 1px solid var(--surface-border);
}

.exam-row:last-child {
  border-bottom: 0;
}

.exam-row p {
  color: var(--color-muted);
  margin: 4px 0 0;
  font-size: 12px;
}

.row-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.ghost-link {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border: 1px solid var(--surface-border);
  border-radius: 4px;
  color: var(--color-ink);
  font-size: 13px;
  text-decoration: none;
}

.ghost-link:hover {
  background: var(--surface-muted);
}

</style>
