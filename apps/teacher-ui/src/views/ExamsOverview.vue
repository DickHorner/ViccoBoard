<template>
  <section class="exams-overview">
    <header class="overview-header">
      <div>
        <h1>Prüfungen</h1>
        <p class="subtitle">Prüfungen für KBR erstellen und verwalten.</p>
      </div>
      <button class="primary" type="button" @click="createNew">
        Neue Prüfung
      </button>
    </header>

    <div v-if="loading" class="state-card">Prüfungen werden geladen…</div>

    <div v-else-if="exams.length === 0" class="state-card">
      <h2>Noch keine Prüfungen</h2>
      <p>Starten Sie mit einer einfachen Struktur aus Aufgaben, Punkten und Kriterien.</p>
      <button class="primary" type="button" @click="createNew">Erste Prüfung erstellen</button>
    </div>

    <div v-else class="exam-sections">
      <section class="exam-section" aria-labelledby="exam-templates-heading">
        <h2 id="exam-templates-heading">Vorlagen</h2>
        <div v-if="templateExams.length === 0" class="state-card compact">
          Noch keine Vorlagen.
        </div>
        <div v-else class="exam-grid">
          <article v-for="exam in templateExams" :key="exam.id" class="exam-card">
            <div class="exam-header">
              <h3>{{ exam.title }}</h3>
              <span class="status" :class="`status-${exam.status}`">{{ formatStatus(exam.status) }}</span>
            </div>
            <p class="exam-desc" v-if="exam.description">{{ exam.description }}</p>
            <div class="exam-meta">
              <span>{{ exam.structure.tasks.length }} Aufgaben</span>
              <span>{{ exam.structure.totalPoints }} Punkte</span>
              <span>Vorlage</span>
              <span class="meta-date">Aktualisiert {{ formatDate(exam.lastModified) }}</span>
            </div>
            <div class="exam-actions">
              <button class="ghost" type="button" @click="editExam(exam.id)">Öffnen</button>
              <button class="ghost" type="button" @click="copyExam(exam)">Aus Vorlage erstellen</button>
              <button class="ghost" type="button" @click="openExport(exam.id)">Exportieren</button>
            </div>
          </article>
        </div>
      </section>

      <section class="exam-section" aria-labelledby="concrete-exams-heading">
        <h2 id="concrete-exams-heading">Konkrete Prüfungen</h2>
        <div v-if="concreteExams.length === 0" class="state-card compact">
          Noch keine konkreten Prüfungen.
        </div>
        <div v-else class="exam-grid">
          <article v-for="exam in concreteExams" :key="exam.id" class="exam-card">
            <div class="exam-header">
              <h3>{{ exam.title }}</h3>
              <span class="status" :class="`status-${exam.status}`">{{ formatStatus(exam.status) }}</span>
            </div>
            <p class="exam-desc" v-if="exam.description">{{ exam.description }}</p>
            <div class="exam-meta">
              <span>{{ exam.structure.tasks.length }} Aufgaben</span>
              <span>{{ exam.structure.totalPoints }} Punkte</span>
              <span class="meta-date">Aktualisiert {{ formatDate(exam.lastModified) }}</span>
            </div>
            <div class="exam-actions">
              <button class="ghost" type="button" @click="editExam(exam.id)">Öffnen</button>
              <button class="ghost" type="button" @click="copyExam(exam)">Als Kopie verwenden</button>
              <button class="ghost" type="button" @click="openCorrection(exam.id)">Korrigieren</button>
              <button class="ghost" type="button" @click="openAnalysis(exam.id)">Analysieren</button>
              <button class="ghost" type="button" @click="openExport(exam.id)">Exportieren</button>
            </div>
          </article>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useExamsBridge } from '../composables/useExamsBridge'
import type { Exams as ExamsTypes } from '@viccoboard/core'
import { formatGermanDate } from '../utils/locale-format'

const router = useRouter()
const { examRepository } = useExamsBridge()
const exams = ref<ExamsTypes.Exam[]>([])
const loading = ref(true)

const isTemplateExam = (exam: ExamsTypes.Exam) => {
  return exam.kind === 'template' || (
    exam.candidates.length === 0 &&
    !exam.date &&
    !exam.classGroupId
  )
}

const templateExams = computed(() => exams.value.filter(isTemplateExam))
const concreteExams = computed(() => exams.value.filter((exam) => !isTemplateExam(exam)))

const clonePrintPresetsForExam = (
  printPresets: ExamsTypes.Exam['printPresets'],
  examId: string
): ExamsTypes.Exam['printPresets'] => {
  return printPresets.map((preset) => {
    if (preset.metadata?.kind !== 'correction-sheet-preset') {
      return { ...preset, metadata: preset.metadata ? { ...preset.metadata } : undefined }
    }

    const correctionSheetPreset = preset.metadata.correctionSheetPreset
    const nextCorrectionSheetPreset = correctionSheetPreset && typeof correctionSheetPreset === 'object'
      ? {
          ...(correctionSheetPreset as Record<string, unknown>),
          id: `correction-sheet-preset:${examId}`,
          examId
        }
      : correctionSheetPreset

    return {
      ...preset,
      id: `correction-sheet-preset:${examId}`,
      metadata: {
        ...preset.metadata,
        correctionSheetPreset: nextCorrectionSheetPreset
      }
    }
  })
}

const loadExams = async () => {
  loading.value = true
  const result = await examRepository?.findAll() ?? []
  exams.value = result
  loading.value = false
}

const createNew = () => {
  router.push('/exams/new')
}

const editExam = (id: string) => {
  router.push(`/exams/${id}`)
}

const copyExam = async (exam: ExamsTypes.Exam) => {
  if (!examRepository) return

  const { id: _id, createdAt: _createdAt, lastModified: _lastModified, ...copyInput } = exam
  const isTemplate = isTemplateExam(exam)
  const copy = await examRepository.create({
    ...copyInput,
    title: isTemplate ? exam.title : `${exam.title} (Kopie)`,
    date: undefined,
    classGroupId: undefined,
    kind: 'exam',
    sourceTemplateId: isTemplate ? (exam.sourceTemplateId ?? exam.id) : exam.sourceTemplateId,
    candidates: [],
    candidateGroups: [],
    status: 'draft'
  })

  if (copy.printPresets.length > 0) {
    await examRepository.update(copy.id, {
      printPresets: clonePrintPresetsForExam(copy.printPresets, copy.id)
    })
  }

  router.push(`/exams/${copy.id}`)
}

const openCorrection = (id: string) => {
  router.push(`/exams/${id}/correct`)
}

const openAnalysis = (id: string) => {
  router.push(`/exams/${id}/analysis`)
}

const openExport = (id: string) => {
  router.push(`/exams/${id}/export`)
}

const formatStatus = (status: ExamsTypes.Exam['status']) => {
  switch (status) {
    case 'in-progress':
      return 'In Bearbeitung'
    case 'completed':
      return 'Abgeschlossen'
    default:
      return 'Entwurf'
  }
}

const formatDate = (date: Date) => formatGermanDate(date)

onMounted(() => {
  loadExams()
})
</script>

<style scoped>
.exams-overview {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.overview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;
}

.subtitle {
  color: #64748b;
  margin-top: 0.5rem;
}

.primary {
  border: none;
  background: #0f172a;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 999px;
  font-weight: 600;
  min-height: 44px;
  cursor: pointer;
}

.state-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.state-card.compact {
  padding: 1rem 1.25rem;
  color: #64748b;
}

.exam-sections,
.exam-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.exam-section h2 {
  margin: 0;
  font-size: 1.25rem;
}

.exam-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.exam-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.exam-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.exam-header h3 {
  margin: 0;
}

.status {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-draft {
  background: rgba(15, 23, 42, 0.08);
  color: #0f172a;
}

.status-in-progress {
  background: rgba(14, 116, 144, 0.15);
  color: #0e7490;
}

.status-completed {
  background: rgba(22, 163, 74, 0.15);
  color: #166534;
}

.exam-desc {
  margin: 0;
  color: #64748b;
}

.exam-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  color: #475569;
  font-size: 0.85rem;
}

.meta-date {
  color: #94a3b8;
}

.exam-actions {
  margin-top: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.ghost {
  background: transparent;
  border: 1px solid rgba(15, 23, 42, 0.2);
  border-radius: 999px;
  padding: 0.5rem 1.25rem;
  cursor: pointer;
  min-height: 44px;
}
</style>
