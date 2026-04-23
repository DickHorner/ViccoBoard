<template>
  <section class="export-page">
    <header class="page-header">
      <div>
        <h1>Rückmeldebögen exportieren</h1>
        <p v-if="exam" class="subtitle">
          {{ exam.title }} · {{ exam.candidates.length }} Prüflinge ·
          {{ completedCandidateCount }} abgeschlossen
        </p>
      </div>
      <div class="header-actions">
        <button class="ghost-button" type="button" @click="goToCorrection" :disabled="!exam">
          Zur Korrektur
        </button>
        <button class="primary-button" type="button" @click="exportAll" :disabled="!canExportAll">
          Alle Bögen exportieren
        </button>
      </div>
    </header>

    <div v-if="loading" class="state-card">Exportansicht wird geladen…</div>
    <div v-else-if="loadError" class="state-card error">{{ loadError }}</div>

    <div v-else-if="exam" class="export-layout">
      <aside class="candidate-panel">
        <div class="panel-header">
          <h2>Prüflinge</h2>
          <p class="panel-copy">
            Einzelbögen können nur für abgeschlossene Korrekturen exportiert werden. Der Sammel-Export
            wird aktiv, sobald mindestens eine Korrektur abgeschlossen ist.
          </p>
        </div>

        <div class="candidate-list">
          <button
            v-for="candidate in exam.candidates"
            :key="candidate.id"
            :class="['candidate-card', { active: selectedCandidateId === candidate.id }]"
            type="button"
            @click="selectCandidate(candidate.id)"
          >
            <div>
              <strong>{{ candidate.firstName }} {{ candidate.lastName }}</strong>
              <p v-if="candidate.externalId" class="candidate-meta">{{ candidate.externalId }}</p>
            </div>
            <span :class="['candidate-status', candidateStatusClass(candidate.id)]">
              {{ candidateStatusLabel(candidate.id) }}
            </span>
          </button>
        </div>
      </aside>

      <div class="preview-panel">
        <div class="preview-actions">
          <div>
            <h2>Vorschau</h2>
            <p v-if="selectedCandidate" class="preview-copy">
              {{ selectedCandidate.firstName }} {{ selectedCandidate.lastName }}
            </p>
          </div>
          <button
            class="ghost-button"
            type="button"
            @click="exportCurrent"
            :disabled="!canExportCurrent"
          >
            Aktuellen Bogen exportieren
          </button>
        </div>

        <div v-if="previewError" class="state-card warning">
          {{ previewError }}
        </div>

        <div v-else-if="projection" class="preview-sheet">
          <section v-if="projection.showHeader" class="sheet-section">
            <div class="sheet-header">
              <div>
                <h3>{{ projection.examTitle }}</h3>
                <p class="sheet-subtitle">{{ projection.candidateName }}</p>
              </div>
              <div class="sheet-meta">
                <span v-if="formattedExamDate">{{ formattedExamDate }}</span>
                <span>{{ projection.layoutMode === 'compact' ? 'Kompakt' : 'Standard' }}</span>
              </div>
            </div>
            <p v-if="projection.headerText" class="sheet-copy">{{ projection.headerText }}</p>
          </section>

          <section class="sheet-section summary-grid">
            <article v-if="projection.showOverallPoints" class="summary-card">
              <span class="summary-label">Punkte</span>
              <strong>{{ projection.totalPoints }} / {{ projection.maxPoints }}</strong>
            </article>
            <article v-if="projection.showGrade" class="summary-card">
              <span class="summary-label">Note</span>
              <strong>{{ projection.grade ?? 'k. A.' }}</strong>
            </article>
            <article class="summary-card">
              <span class="summary-label">Aufgaben</span>
              <strong>{{ projection.taskRows.length }}</strong>
            </article>
          </section>

          <section class="sheet-section">
            <h3>Aufgabenübersicht</h3>
            <div class="task-table">
              <div class="task-table-row task-table-head">
                <span>Aufgabe</span>
                <span v-if="projection.showTaskPoints">Punkte</span>
                <span v-if="projection.showTaskComments">Kommentar</span>
              </div>
              <div
                v-for="row in projection.taskRows"
                :key="row.taskId"
                class="task-table-row"
              >
                <div>
                  <strong>{{ row.label }}</strong>
                  <p v-if="row.partLabel" class="task-part">{{ row.partLabel }}</p>
                </div>
                <span v-if="projection.showTaskPoints">{{ row.awardedPoints }} / {{ row.maxPoints }}</span>
                <span v-if="projection.showTaskComments">{{ row.comment || '—' }}</span>
              </div>
            </div>
          </section>

          <section v-if="projection.showGeneralComment" class="sheet-section">
            <h3>Gesamtkommentar</h3>
            <p class="sheet-copy">{{ projection.generalComment || 'Kein allgemeiner Kommentar hinterlegt.' }}</p>
          </section>

          <section v-if="projection.footerText || projection.showSignatureArea" class="sheet-section footer-section">
            <p v-if="projection.footerText" class="sheet-copy">{{ projection.footerText }}</p>
            <div v-if="projection.showSignatureArea" class="signature-line">
              <span>Unterschrift</span>
            </div>
          </section>
        </div>

        <div v-else class="state-card">
          Wählen Sie einen Prüfling aus, um die Rückmeldebogen-Vorschau zu sehen.
        </div>

        <section class="sheet-section ai-correction-section">
          <header class="section-header">
            <h3>Externe KI-Korrektur</h3>
            <p class="sheet-copy">Exportieren Sie die Prüfungsdaten für eine externe KI-Unterstützung (z.B. ChatGPT) und importieren Sie die Ergebnisse zurück.</p>
          </header>

          <div class="ai-actions">
            <div class="ai-action-group">
              <h4>1. Export</h4>
              <p class="panel-copy">Der Export liefert drei getrennte Dateien: Contract, Prompt und Session-Map (intern).</p>
              <button 
                class="ghost-button" 
                type="button" 
                @click="exportAISession" 
                :disabled="!exam || aiExporting"
              >
                {{ aiExporting ? 'Exportiert...' : 'KI-Sitzung exportieren' }}
              </button>
            </div>

            <div class="ai-action-group">
              <h4>2. Import</h4>
              <p class="panel-copy">Laden Sie die Ergebnis-JSON-Datei des KI-Bundles hoch.</p>
              <div class="import-controls">
                <input
                  type="file"
                  id="ai-import-file"
                  accept=".json"
                  class="hidden-input"
                  @change="handleAIImport"
                  :disabled="aiImporting"
                />
                <label for="ai-import-file" class="primary-button" :class="{ disabled: aiImporting }">
                  {{ aiImporting ? 'Importiert...' : 'KI-Ergebnisse importieren' }}
                </label>
              </div>
            </div>
          </div>

          <div v-if="aiError" class="state-card error mt-4">
            {{ aiError }}
          </div>
          <div v-if="aiSuccess" class="state-card success mt-4">
            {{ aiSuccess }}
          </div>
          <div v-if="aiExportArtifacts.length" class="state-card mt-4">
            <h4>Zuletzt exportierte Dateien</h4>
            <div class="export-artifact-list">
              <article
                v-for="artifact in aiExportArtifacts"
                :key="artifact.fileName"
                class="export-artifact-card"
              >
                <div>
                  <p class="export-artifact-label">{{ artifact.label }}</p>
                  <p class="panel-copy">{{ artifact.description }}</p>
                </div>
                <p class="export-artifact-name">{{ artifact.fileName }}</p>
              </article>
            </div>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Exams } from '@viccoboard/core'
import { useExamsBridge } from '../composables/useExamsBridge'
import { downloadBytes, downloadText } from '../utils/download'
import {
  buildCorrectionSessionDownloads,
  type CorrectionSessionDownloadArtifact
} from '../utils/kbr-correction-export'

const route = useRoute()
const router = useRouter()
const {
  getExam,
  findCorrectionsByExam,
  buildCorrectionSheetPreview,
  exportCurrentCorrectionSheetPdf,
  exportAllCorrectionSheetsPdf,
  exportCorrectionSession,
  importCorrectionBundle
} = useExamsBridge()

const loading = ref(true)
const loadError = ref('')
const previewError = ref('')
const exam = ref<Exams.Exam | null>(null)
const corrections = ref<Map<string, Exams.CorrectionEntry>>(new Map())
const projection = ref<Exams.CorrectionSheetProjection | null>(null)
const selectedCandidateId = ref('')

// AI Correction State
const aiExporting = ref(false)
const aiImporting = ref(false)
const aiError = ref('')
const aiSuccess = ref('')
const aiExportArtifacts = ref<CorrectionSessionDownloadArtifact[]>([])

async function exportAISession(): Promise<void> {
  if (!exam.value || !exportCorrectionSession) return
  
  aiError.value = ''
  aiSuccess.value = ''
  aiExportArtifacts.value = []
  aiExporting.value = true
  
  try {
    const result = await exportCorrectionSession({ exam: exam.value })

    const downloads = buildCorrectionSessionDownloads(result, exam.value.id)
    downloads.forEach((artifact) => {
      downloadText(artifact.content, artifact.fileName)
    })

    aiExportArtifacts.value = downloads

    const sessionMapArtifact = downloads.find((artifact) => artifact.audience === 'internal')
    if (!sessionMapArtifact) {
      throw new Error('Session-Map konnte fur den Re-Import nicht erstellt werden.')
    }

    aiSuccess.value = 'KI-Sitzungsdateien erfolgreich exportiert. ChatGPT-Dateien: Contract und Prompt. Session-Map wird getrennt als internes Hilfsartefakt gespeichert.'

    localStorage.setItem(`viccoboard_session_map_${exam.value.id}`, sessionMapArtifact.content)
  } catch (error: any) {
    console.error('AI Export failed:', error)
    aiError.value = `Export fehlgeschlagen: ${error.message}`
  } finally {
    aiExporting.value = false
  }
}

async function handleAIImport(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || !exam.value || !importCorrectionBundle) return

  aiError.value = ''
  aiSuccess.value = ''
  aiImporting.value = true

  try {
    const content = await file.text()
    const bundle = JSON.parse(content)
    
    // Retrieve session map
    const storedMap = localStorage.getItem(`viccoboard_session_map_${exam.value.id}`)
    if (!storedMap) {
      throw new Error('Keine zugehörige Sitzungs-Map gefunden. Bitte exportieren Sie die Sitzung zuerst erneut.')
    }
    
    const sessionMap = JSON.parse(storedMap)
    
    await importCorrectionBundle({
      examId: exam.value.id,
      sessionId: sessionMap.sessionId,
      sessionMap,
      bundle
    })
    
    aiSuccess.value = 'KI-Ergebnisse erfolgreich importiert.'
    
    // Reload corrections and preview
    const loadedCorrections = await findCorrectionsByExam(exam.value.id)
    corrections.value = new Map(loadedCorrections.map((entry) => [entry.candidateId, entry]))
    if (selectedCandidateId.value) {
      await loadPreview(selectedCandidateId.value)
    }
  } catch (error: any) {
    console.error('AI Import failed:', error)
    aiError.value = `Import fehlgeschlagen: ${error.message}`
  } finally {
    aiImporting.value = false
    target.value = '' // Reset input
  }
}

type ExamCandidate = Exams.Exam['candidates'][number]

const selectedCandidate = computed(() =>
  exam.value?.candidates.find((candidate) => candidate.id === selectedCandidateId.value) ?? null
)

const completedCandidateCount = computed(() =>
  [...corrections.value.values()].filter((c) => c.status === 'completed').length
)
const canExportCurrent = computed(() => {
  if (!exam.value || !selectedCandidate.value) return false
  const correction = corrections.value.get(selectedCandidate.value.id)
  return correction?.status === 'completed'
})
const canExportAll = computed(() => {
  return Boolean(
    exam.value &&
    exam.value.candidates.length > 0 &&
    [...corrections.value.values()].some((c) => c.status === 'completed')
  )
})

const formattedExamDate = computed(() => {
  if (!projection.value?.examDate) {
    return ''
  }

  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(projection.value.examDate))
})

function correctionStatus(candidateId: string): Exams.CorrectionEntry['status'] | null {
  return corrections.value.get(candidateId)?.status ?? null
}

function candidateStatusClass(candidateId: string): string {
  const status = correctionStatus(candidateId)
  if (status === 'completed') return 'completed'
  if (status === 'in-progress') return 'in-progress'
  return 'missing'
}

function candidateStatusLabel(candidateId: string): string {
  const status = correctionStatus(candidateId)
  if (status === 'completed') return 'abgeschlossen'
  if (status === 'in-progress') return 'in Bearbeitung'
  return 'offen'
}

async function loadPreview(candidateId: string): Promise<void> {
  previewError.value = ''
  projection.value = null

  if (!exam.value) {
    return
  }

  const correction = corrections.value.get(candidateId)
  if (!correction) {
    previewError.value = 'Für diesen Prüfling gibt es noch keine Korrektur.'
    return
  }

  if (correction.status !== 'completed') {
    previewError.value =
      correction.status === 'in-progress'
        ? 'Die Korrektur dieses Prüflings ist noch nicht abgeschlossen. Erst nach dem Abschluss kann ein Druckbogen exportiert werden.'
        : 'Für diesen Prüfling wurde noch keine Korrektur begonnen.'
    return
  }

  try {
    projection.value = await buildCorrectionSheetPreview?.(exam.value.id, candidateId) ?? null
  } catch (error) {
    console.error('Failed to build correction sheet preview:', error)
    previewError.value = 'Die Vorschau konnte nicht erstellt werden.'
  }
}

async function selectCandidate(candidateId: string): Promise<void> {
  selectedCandidateId.value = candidateId
  await router.replace({
    path: route.path,
    query: candidateId ? { candidateId } : {}
  })
  await loadPreview(candidateId)
}

async function loadPage(): Promise<void> {
  loading.value = true
  loadError.value = ''

  try {
    const examId = String(route.params.id)
    const loadedExam = await getExam(examId)

    if (!loadedExam) {
      loadError.value = 'Die angeforderte Prüfung wurde nicht gefunden.'
      return
    }

    exam.value = loadedExam
    const loadedCorrections = await findCorrectionsByExam(examId)
    corrections.value = new Map(loadedCorrections.map((entry) => [entry.candidateId, entry]))

    if (loadedExam.candidates.length === 0) {
      loadError.value = 'Diese Prüfung enthält noch keine Prüflinge.'
      return
    }

    const requestedCandidateId = typeof route.query.candidateId === 'string'
      ? route.query.candidateId
      : ''
    const fallbackCandidate =
      loadedExam.candidates.find((candidate: ExamCandidate) => candidate.id === requestedCandidateId) ??
      loadedExam.candidates.find((candidate: ExamCandidate) => corrections.value.get(candidate.id)?.status === 'completed') ??
      loadedExam.candidates[0]

    if (fallbackCandidate) {
      await selectCandidate(fallbackCandidate.id)
    }
  } catch (error) {
    console.error('Failed to load export page:', error)
    loadError.value = 'Die Exportansicht konnte nicht geladen werden.'
  } finally {
    loading.value = false
  }
}

async function exportCurrent(): Promise<void> {
  if (!exam.value || !selectedCandidate.value || !exportCurrentCorrectionSheetPdf) {
    return
  }

  const pdfDocument = await exportCurrentCorrectionSheetPdf(exam.value.id, selectedCandidate.value.id)
  downloadBytes(pdfDocument.bytes, pdfDocument.fileName, 'application/pdf')
}

async function exportAll(): Promise<void> {
  if (!exam.value || !canExportAll.value || !exportAllCorrectionSheetsPdf) {
    return
  }

  const pdfDocument = await exportAllCorrectionSheetsPdf(exam.value.id)
  downloadBytes(pdfDocument.bytes, pdfDocument.fileName, 'application/pdf')
}

function goToCorrection(): void {
  if (!exam.value) {
    return
  }

  router.push(`/exams/${exam.value.id}/correct`)
}

onMounted(() => {
  void loadPage()
})
</script>

<style scoped>
.export-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header,
.header-actions,
.preview-actions,
.sheet-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  flex-wrap: wrap;
}

.page-header h1,
.panel-header h2,
.preview-actions h2,
.sheet-section h3 {
  margin: 0;
}

.subtitle,
.panel-copy,
.preview-copy,
.sheet-copy,
.candidate-meta,
.task-part {
  color: #64748b;
}

.header-actions {
  align-items: center;
}

.primary-button,
.ghost-button,
.candidate-card {
  min-height: 44px;
  border-radius: 16px;
}

.primary-button,
.ghost-button {
  border: 1px solid rgba(15, 23, 42, 0.12);
  padding: 0.75rem 1.1rem;
  font-weight: 600;
  cursor: pointer;
}

.primary-button {
  background: #0f172a;
  color: #fff;
}

.ghost-button {
  background: #fff;
  color: #0f172a;
}

.primary-button:disabled,
.ghost-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.state-card,
.candidate-panel,
.preview-panel,
.summary-card {
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
}

.state-card {
  padding: 1.25rem;
}

.state-card.error {
  color: #991b1b;
}

.state-card.warning {
  color: #92400e;
  background: #fff7ed;
}

.export-layout {
  display: grid;
  grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
  gap: 1.5rem;
}

.candidate-panel,
.preview-panel {
  padding: 1.25rem;
}

.candidate-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.candidate-card {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  width: 100%;
  padding: 0.85rem 1rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #f8fafc;
  text-align: left;
  cursor: pointer;
}

.candidate-card.active {
  border-color: #0f766e;
  background: #ecfeff;
}

.candidate-status {
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
}

.candidate-status.completed {
  background: rgba(22, 163, 74, 0.16);
  color: #166534;
}

.candidate-status.in-progress {
  background: rgba(234, 179, 8, 0.16);
  color: #854d0e;
}

.candidate-status.missing {
  background: rgba(148, 163, 184, 0.16);
  color: #475569;
}

.preview-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.preview-sheet {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sheet-section {
  padding: 1rem 1.1rem;
  border-radius: 16px;
  background: #f8fafc;
}

.sheet-subtitle,
.sheet-meta {
  margin: 0.35rem 0 0;
}

.sheet-meta {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  color: #475569;
  font-weight: 600;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem;
}

.summary-card {
  padding: 0.9rem 1rem;
}

.summary-label {
  display: block;
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 0.4rem;
}

.task-table {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.task-table-row {
  display: grid;
  grid-template-columns: minmax(0, 2fr) repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.task-table-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.task-table-head {
  font-size: 0.85rem;
  font-weight: 700;
  color: #475569;
}

.footer-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.signature-line {
  display: flex;
  align-items: flex-end;
  min-height: 3rem;
  border-bottom: 1px solid rgba(15, 23, 42, 0.3);
  width: min(280px, 100%);
  color: #475569;
}

.ai-correction-section {
  margin-top: 2rem;
  border: 2px dashed rgba(15, 23, 42, 0.1);
}

.section-header {
  margin-bottom: 1.5rem;
}

.ai-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.ai-action-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ai-action-group h4 {
  margin: 0;
  font-size: 1rem;
}

.export-artifact-list {
  display: grid;
  gap: 0.75rem;
  margin-top: 1rem;
}

.export-artifact-card {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  padding: 0.9rem 1rem;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.export-artifact-label,
.export-artifact-name {
  margin: 0;
}

.export-artifact-label {
  font-weight: 700;
  color: #0f172a;
}

.export-artifact-name {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.85rem;
  color: #334155;
  text-align: right;
}

.import-controls {
  margin-top: 0.5rem;
}

.hidden-input {
  display: none;
}

.primary-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mt-4 {
  margin-top: 1rem;
}

.state-card.success {
  color: #166534;
  background: #f0fdf4;
  border-color: rgba(22, 163, 74, 0.2);
}

@media (max-width: 900px) {
  .export-layout {
    grid-template-columns: 1fr;
  }

  .export-artifact-card {
    flex-direction: column;
  }

  .export-artifact-name {
    text-align: left;
  }
  
  .ai-actions {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

@media (max-width: 640px) {
  .task-table-row {
    grid-template-columns: 1fr;
  }
}
</style>
