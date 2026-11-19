<template>
  <section class="exam-workspace">
    <div v-if="loading" class="app-status-panel" role="status">
      <p>Prüfung wird geladen…</p>
    </div>
    <div v-else-if="loadError" class="app-status-panel">
      <Message severity="error" role="alert">{{ loadError }}</Message>
      <Button label="Erneut versuchen" @click="loadData" />
      <RouterLink to="/exams">Zur Prüfungsübersicht</RouterLink>
    </div>

    <template v-else-if="exam">
      <header class="workspace-header">
        <div>
          <RouterLink to="/exams" class="back-link">← Alle Prüfungen</RouterLink>
          <p class="eyebrow">Prüfungsarbeitsbereich</p>
          <h1>{{ exam.title }}</h1>
          <p v-if="exam.classGroupId" class="subtitle">{{ className || 'Klassenzuordnung wird geladen…' }}</p>
          <p v-else class="subtitle">Ohne Klassenzuordnung</p>
        </div>
        <Tag :value="statusLabel" :severity="statusSeverity" />
      </header>

      <div class="context-grid">
        <div class="context-item app-card">
          <strong>{{ exam.structure.tasks.length }}</strong>
          <span>Aufgaben</span>
        </div>
        <div class="context-item app-card">
          <strong>{{ exam.structure.totalPoints }}</strong>
          <span>Gesamtpunkte</span>
        </div>
        <div class="context-item app-card">
          <strong>{{ exam.candidates.length }}</strong>
          <span>Prüflinge</span>
        </div>
      </div>

      <h2>Mit dieser Prüfung arbeiten</h2>
      <div class="action-grid">
        <RouterLink :to="`/exams/${exam.id}`" class="workspace-action app-card">
          <strong>Aufgaben bearbeiten</strong>
          <span>Struktur, Kriterien und Notenschlüssel</span>
        </RouterLink>
        <RouterLink v-if="exam.candidates.length" :to="`/exams/${exam.id}/correct`" class="workspace-action app-card">
          <strong>Korrigieren</strong>
          <span>Nach Prüfling oder Aufgabe bewerten</span>
        </RouterLink>
        <div v-else class="workspace-action app-card unavailable" aria-disabled="true">
          <strong>Korrigieren</strong>
          <span>Erst Prüflinge hinzufügen</span>
        </div>
        <RouterLink :to="`/exams/${exam.id}/analysis`" class="workspace-action app-card">
          <strong>Analyse</strong>
          <span>Ergebnisse und Aufgabenschwierigkeit</span>
        </RouterLink>
        <RouterLink :to="`/exams/${exam.id}/sheet-design`" class="workspace-action app-card">
          <strong>Druckbogen gestalten</strong>
          <span>Layout mit PDF-Vorschau bearbeiten</span>
        </RouterLink>
        <RouterLink v-if="exam.candidates.length" :to="`/exams/${exam.id}/export`" class="workspace-action app-card">
          <strong>Rückmeldebögen</strong>
          <span>Abgeschlossene Korrekturen prüfen und exportieren</span>
        </RouterLink>
        <div v-else class="workspace-action app-card unavailable" aria-disabled="true">
          <strong>Rückmeldebögen</strong>
          <span>Erst Prüflinge hinzufügen</span>
        </div>
      </div>
      <Message v-if="!exam.candidates.length" severity="info">
        Diese Prüfung enthält noch keine Prüflinge. Du kannst Aufgaben und Druckbogen bereits bearbeiten.
      </Message>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import Button from 'openvue/button'
import Message from 'openvue/message'
import Tag from 'openvue/tag'
import type { Exams } from '@viccoboard/core'
import { useExamsBridge } from '../composables/useExamsBridge'
import { getSportBridge } from '../composables/useSportBridge'
import { recordRouteContentReady } from '../utils/navigation-performance'

const route = useRoute()
const { getExam } = useExamsBridge()
const exam = ref<Exams.Exam | null>(null)
const className = ref('')
const loading = ref(true)
const loadError = ref('')

const statusLabel = computed(() => {
  if (exam.value?.status === 'completed') return 'Abgeschlossen'
  if (exam.value?.status === 'in-progress') return 'In Bearbeitung'
  return 'Entwurf'
})
const statusSeverity = computed<'secondary' | 'info' | 'success'>(() => {
  if (exam.value?.status === 'completed') return 'success'
  if (exam.value?.status === 'in-progress') return 'info'
  return 'secondary'
})

async function loadClassName(classId: string, examId: string): Promise<void> {
  try {
    const group = await getSportBridge().classGroupRepository.findById(classId)
    if (exam.value?.id === examId) className.value = group?.name ?? 'Klasse nicht gefunden'
  } catch (error) {
    console.error('Failed to load exam class:', error)
    if (exam.value?.id === examId) className.value = 'Klassenname nicht verfügbar'
  }
}

async function loadData(): Promise<void> {
  loading.value = true
  loadError.value = ''
  className.value = ''
  exam.value = null

  try {
    const examId = String(route.params.id)
    const loaded = await getExam(examId)
    if (!loaded || loaded.id !== examId) {
      loadError.value = 'Die angeforderte Prüfung wurde nicht gefunden.'
      return
    }

    exam.value = loaded as Exams.Exam
  } catch (error) {
    console.error('Failed to load exam workspace:', error)
    loadError.value = 'Der Prüfungsarbeitsbereich konnte nicht geladen werden.'
  } finally {
    loading.value = false
  }

  if (exam.value) {
    await nextTick()
    recordRouteContentReady('exam-workspace')
    if (exam.value.classGroupId) void loadClassName(exam.value.classGroupId, exam.value.id)
  }
}

onMounted(() => { void loadData() })
</script>

<style scoped>
.exam-workspace {
  width: min(100%, 1100px);
  margin: 0 auto;
  display: grid;
  gap: 1.25rem;
}

.workspace-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.workspace-header h1,
.exam-workspace h2 {
  margin: 0;
}

.back-link {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  color: var(--accent-strong);
}

.eyebrow {
  margin: 0.4rem 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-muted);
}

.subtitle {
  margin: 0.5rem 0 0;
  color: var(--color-muted);
}

.context-grid,
.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
  gap: 1rem;
}

.context-item,
.workspace-action {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.context-item strong {
  font-size: 1.5rem;
}

.context-item span,
.workspace-action span {
  color: var(--color-muted);
}

.workspace-action {
  min-height: 88px;
  color: var(--color-ink);
  text-decoration: none;
}

.workspace-action:not(.unavailable):hover {
  border-color: var(--accent-strong);
}

.workspace-action:focus-visible,
.back-link:focus-visible {
  outline: 2px solid var(--accent-strong);
  outline-offset: 2px;
}

.unavailable {
  opacity: 0.6;
}
</style>
