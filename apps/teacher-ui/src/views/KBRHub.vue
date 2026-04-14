<template>
  <section class="subject-hub">
    <header class="page-header">
      <div>
        <h1>KBR</h1>
        <p class="subtitle">Arbeitsbereich für Prüfungen, Korrektur und Auswertung. Von hier aus sollen später alle KBR-Teilbereiche konsistent erreichbar sein.</p>
      </div>
      <span class="summary-pill">{{ examCount }} Prüfungen</span>
    </header>

    <section class="metrics-grid">
      <article class="metric-card">
        <strong>{{ examCount }}</strong>
        <span>Prüfungen</span>
      </article>
      <article class="metric-card">
        <strong>{{ supportTipCount }}</strong>
        <span>Fördertipps</span>
      </article>
      <article class="metric-card">
        <strong>{{ longTermNoteCount }}</strong>
        <span>Langzeitnotizen</span>
      </article>
    </section>

    <div class="hub-grid">
      <RouterLink class="hub-card" to="/exams">
        <p class="eyebrow">Übersicht</p>
        <h2>Prüfungen</h2>
        <p>Bestehende Prüfungen ansehen, bearbeiten und in die Korrektur wechseln.</p>
      </RouterLink>

      <RouterLink class="hub-card" to="/exams/new">
        <p class="eyebrow">Editor</p>
        <h2>Neue Prüfung</h2>
        <p>Direkter Einstieg in den KBR-Editor für einfache und komplexe Strukturen.</p>
      </RouterLink>

      <RouterLink class="hub-card" :to="analysisEntry.to">
        <p class="eyebrow">Analyse</p>
        <h2>{{ analysisEntry.title }}</h2>
        <p>{{ analysisEntry.description }}</p>
      </RouterLink>
    </div>

    <section class="recent-panel">
      <div class="panel-header">
        <h2>Zuletzt bearbeitet</h2>
      </div>

      <div v-if="loading" class="state-card">Prüfungen werden geladen...</div>
      <div v-else-if="recentExams.length === 0" class="state-card">Noch keine Prüfungen vorhanden.</div>

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
            <RouterLink :to="`/exams/${exam.id}/export`" class="ghost-link">Export</RouterLink>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useExamsBridge } from '../composables/useExamsBridge'
import type { Exams as ExamsTypes } from '@viccoboard/core'
import { formatGermanDate } from '../utils/locale-format'

const { examRepository } = useExamsBridge()
const { supportTipRepository, studentLongTermNoteRepository } = useExamsBridge()

const loading = ref(true)
const exams = ref<ExamsTypes.Exam[]>([])
const supportTipCount = ref(0)
const longTermNoteCount = ref(0)

const examCount = computed(() => exams.value.length)
const recentExams = computed(() =>
  [...exams.value]
    .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
    .slice(0, 5)
)
const analysisEntry = computed(() => {
  const exam = recentExams.value[0]

  if (!exam) {
    return {
      to: '/exams',
      title: 'Analyse vorbereiten',
      description: 'Sobald Prüfungen vorhanden sind, öffnet sich hier der direkte Weg in Statistik und Schwierigkeit.'
    }
  }

  return {
    to: `/exams/${exam.id}/analysis`,
    title: 'Letzte Analyse',
    description: `Direkt in die Analyse von ${exam.title} springen.`
  }
})

const loadData = async () => {
  loading.value = true
  const [loadedExams, supportTips, longTermNotes] = await Promise.all([
    examRepository?.findAll() ?? [],
    supportTipRepository?.findAll() ?? [],
    studentLongTermNoteRepository?.findAll() ?? []
  ])

  exams.value = loadedExams
  supportTipCount.value = supportTips.length
  longTermNoteCount.value = longTermNotes.length
  loading.value = false
}

const formatDate = (date: Date): string =>
  formatGermanDate(date)

onMounted(() => {
  loadData()
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

.summary-pill {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  padding: 0 1rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
  color: #0f172a;
  font-weight: 700;
}

.metrics-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.metric-card {
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
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
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.hub-card,
.recent-panel,
.state-card {
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
}

.hub-card {
  padding: 1.25rem;
  text-decoration: none;
  color: #0f172a;
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
