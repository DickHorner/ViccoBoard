<template>
  <section class="exams-overview">
    <header class="overview-header">
      <div>
        <h1>{{ workflow?.title ?? 'Prüfungen' }}</h1>
        <p class="subtitle">{{ workflow?.description ?? 'Prüfungen für KBR erstellen und verwalten.' }}</p>
      </div>
      <div class="header-actions">
        <button v-if="workflow" class="ghost" type="button" @click="router.push('/subjects/kbr')">← KBR</button>
        <input ref="examImportInput" type="file" accept=".json,application/json" hidden @change="importExamFile" />
        <button v-if="!workflow" class="ghost" type="button" :disabled="importing" @click="examImportInput?.click()">
          {{ importing ? 'Import läuft…' : 'Prüfung aus ChatGPT importieren' }}
        </button>
        <button class="primary" type="button" @click="createNew">Neue Prüfung</button>
      </div>
    </header>

    <p v-if="importError" class="state-card import-error" role="alert">{{ importError }}</p>

    <div v-if="loading" class="state-card" role="status">Prüfungen werden geladen…</div>
    <div v-else-if="loadError" class="state-card" role="alert">
      <p>{{ loadError }}</p>
      <Button label="Erneut versuchen" @click="loadExams" />
    </div>

    <Message v-if="contextError" severity="warn" role="status">{{ contextError }}</Message>

    <div v-else-if="exams.length === 0" class="state-card">
      <h2>Noch keine Prüfungen</h2>
      <p>Starten Sie mit einer einfachen Struktur aus Aufgaben, Punkten und Kriterien.</p>
      <button class="primary" type="button" @click="createNew">Erste Prüfung erstellen</button>
    </div>

    <div v-else class="exam-sections">
      <section v-if="!workflow || workflow.destination === 'sheet-design'" class="exam-section" aria-labelledby="exam-templates-heading">
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
              <button v-if="workflow" class="primary" type="button" @click="openWorkflow(exam.id)">{{ workflow.action }}</button>
              <template v-else>
                <button class="ghost" type="button" @click="openExamWorkspace(exam.id)">Öffnen</button>
                <button class="ghost" type="button" @click="copyExam(exam)">Aus Vorlage erstellen</button>
                <button class="ghost" type="button" @click="openExport(exam.id)">Exportieren</button>
              </template>
            </div>
          </article>
        </div>
      </section>

      <section class="exam-section" aria-labelledby="concrete-exams-heading">
        <h2 id="concrete-exams-heading">{{ workflow ? 'Prüfung auswählen' : activeYear ? `Prüfungen · ${activeYear}` : 'Prüfungen' }}</h2>
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
              <button v-if="workflow" class="primary" type="button" @click="openWorkflow(exam.id)">{{ workflow.action }}</button>
              <template v-else>
                <button class="ghost" type="button" @click="openExamWorkspace(exam.id)">Öffnen</button>
                <button class="ghost" type="button" @click="copyExam(exam)">Als Kopie verwenden</button>
                <button class="ghost" type="button" @click="openCorrection(exam.id)">Korrigieren</button>
                <button class="ghost" type="button" @click="openAnalysis(exam.id)">Analysieren</button>
                <button class="ghost" type="button" @click="openExport(exam.id)">Exportieren</button>
              </template>
            </div>
          </article>
        </div>
      </section>

      <section v-if="archivedExams.length" class="exam-section">
        <details class="archive-details">
          <summary>Prüfungsarchiv ({{ archivedExams.length }})</summary>
          <p>Abgeschlossene Schuljahre. Prüfungen, Ergebnisse und Korrekturen bleiben unverändert verfügbar.</p>
          <div class="exam-grid">
            <article v-for="exam in archivedExams" :key="exam.id" class="exam-card">
              <div class="exam-header">
                <h3>{{ exam.title }}</h3>
                <span class="status">{{ examSchoolYear(exam, classYears) }}</span>
              </div>
              <p v-if="exam.description" class="exam-desc">{{ exam.description }}</p>
              <div class="exam-meta">
                <span>{{ exam.structure.tasks.length }} Aufgaben</span>
                <span>{{ exam.structure.totalPoints }} Punkte</span>
                <span>{{ formatStatus(exam.status) }}</span>
              </div>
              <div class="exam-actions">
                <button v-if="workflow" class="primary" type="button" @click="openWorkflow(exam.id)">{{ workflow.action }}</button>
                <template v-else>
                  <button class="ghost" type="button" @click="openExamWorkspace(exam.id)">Öffnen</button>
                  <button class="ghost" type="button" @click="copyExam(exam)">Als Kopie verwenden</button>
                  <button class="ghost" type="button" @click="openCorrection(exam.id)">Korrigieren</button>
                  <button class="ghost" type="button" @click="openAnalysis(exam.id)">Analysieren</button>
                  <button class="ghost" type="button" @click="openExport(exam.id)">Exportieren</button>
                </template>
              </div>
            </article>
          </div>
        </details>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useExamsBridge } from '../composables/useExamsBridge'
import { parseExamDefinition } from '@viccoboard/exams'
import type { Exams as ExamsTypes, ClassGroup } from '@viccoboard/core'
import { getSportBridge } from '../composables/useSportBridge'
import { getStorageAdapter } from '../services/storage.service'
import { loadActiveSchoolYear } from '../services/school-year.service'
import { examSchoolYear, isExamTemplate } from '../utils/exam-school-year'
import { formatGermanDate } from '../utils/locale-format'
import { recordRouteContentReady } from '../utils/navigation-performance'
import Button from 'openvue/button'
import Message from 'openvue/message'

const router = useRouter()
const route = useRoute()
const workflow = computed(() => {
  switch (route.query.workflow) {
    case 'correct':
      return {
        title: 'Manuelle Korrektur',
        description: 'Wähle die Prüfung, die Du korrigieren möchtest.',
        action: 'Korrektur öffnen',
        destination: 'correct'
      }
    case 'design':
      return {
        title: 'Druckbogeneditor',
        description: 'Wähle eine Prüfung oder Vorlage, deren Druckbogen Du gestalten möchtest.',
        action: 'Druckbogen gestalten',
        destination: 'sheet-design'
      }
    case 'sheets':
      return {
        title: 'Rückmeldebögen',
        description: 'Wähle die Prüfung, deren Druckbögen Du ansehen oder exportieren möchtest.',
        action: 'Rückmeldebögen öffnen',
        destination: 'export'
      }
    case 'analysis':
      return {
        title: 'Prüfungsanalyse',
        description: 'Wähle die Prüfung, deren Ergebnisse Du auswerten möchtest.',
        action: 'Analyse öffnen',
        destination: 'analysis'
      }
    default:
      return null
  }
})
const openWorkflow = (examId: string) => {
  if (!workflow.value) return
  router.push(`/exams/${examId}/${workflow.value.destination}`)
}
const { examRepository } = useExamsBridge()
const exams = ref<ExamsTypes.Exam[]>([])
const classes = ref<ClassGroup[]>([])
const activeYear = ref('')
const loading = ref(true)
const loadError = ref('')
const contextError = ref('')
const importing = ref(false)
const importError = ref('')
const examImportInput = ref<HTMLInputElement | null>(null)

const classYears = computed(() => new Map(classes.value.map(group => [group.id, group.schoolYear])))
const templateExams = computed(() => exams.value.filter(isExamTemplate))
const concreteExams = computed(() => exams.value.filter(exam =>
  !isExamTemplate(exam) &&
  (!activeYear.value || !examSchoolYear(exam, classYears.value) || examSchoolYear(exam, classYears.value) === activeYear.value)
))
const archivedExams = computed(() => exams.value.filter(exam => {
  if (!activeYear.value) return false
  const year = examSchoolYear(exam, classYears.value)
  return !isExamTemplate(exam) && year !== null && year !== activeYear.value
}))

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
  loadError.value = ''
  try {
    if (!examRepository) throw new Error('Prüfungsspeicher nicht verfügbar.')
    exams.value = await examRepository.findAll()
  } catch (error) {
    console.error('Failed to load exams:', error)
    loadError.value = 'Die Prüfungen konnten nicht geladen werden.'
  } finally {
    loading.value = false
  }
  if (!loadError.value) {
    await nextTick()
    recordRouteContentReady('exams')
  }
}

const loadContext = async () => {
  contextError.value = ''
  const groupRepository = getSportBridge().classGroupRepository
  const [groups, year] = await Promise.allSettled([
    groupRepository.findAll(),
    loadActiveSchoolYear(getStorageAdapter(), groupRepository)
  ])
  if (groups.status === 'fulfilled') classes.value = groups.value
  if (year.status === 'fulfilled') activeYear.value = year.value
  if (groups.status === 'rejected' || year.status === 'rejected') {
    console.error('Failed to load exam school year context:',
      groups.status === 'rejected' ? groups.reason : null,
      year.status === 'rejected' ? year.reason : null)
    contextError.value = 'Schuljahres- oder Klassenzuordnung konnte nicht vollständig geladen werden.'
  }
}

const importExamFile = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  importError.value = ''
  importing.value = true
  try {
    if (!examRepository) throw new Error('Prüfungsspeicher nicht verfügbar.')
    if (file.size > 1024 * 1024) throw new Error('Importdatei überschreitet 1 MiB.')
    const exam = parseExamDefinition(JSON.parse(await file.text()))
    const { id: _id, createdAt: _createdAt, lastModified: _lastModified, ...payload } = exam
    const created = await examRepository.create(payload)
    router.push(`/exams/${created.id}`)
  } catch (error) {
    importError.value = error instanceof Error ? error.message : 'Prüfung konnte nicht importiert werden.'
  } finally {
    importing.value = false
  }
}

const createNew = () => {
  router.push('/exams/new')
}

const openExamWorkspace = (id: string) => {
  router.push(`/exams/${id}/workspace`)
}

const copyExam = async (exam: ExamsTypes.Exam) => {
  if (!examRepository) return

  const { id: _id, createdAt: _createdAt, lastModified: _lastModified, ...copyInput } = exam
  const isTemplate = isExamTemplate(exam)
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
  void loadExams()
  void loadContext()
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

.header-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.import-error {
  color: #991b1b;
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

.archive-details { padding: 1rem; border: 1px solid #dbe3ed; border-radius: 14px; }
.archive-details summary { cursor: pointer; font-weight: 700; padding: .4rem 0; }
.archive-details > p { color: #64748b; }
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
