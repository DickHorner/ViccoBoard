<template>
  <section class="sheet-designer">
    <header class="page-header">
      <div>
        <h1>Druckbogeneditor</h1>
        <p v-if="exam" class="subtitle">{{ exam.title }}</p>
      </div>
      <div class="header-actions">
        <RouterLink :to="exam ? `/exams/${exam.id}/workspace` : '/exams?workflow=design'" class="secondary-button">
          {{ exam ? 'Zur Prüfung' : 'Zur Prüfungsauswahl' }}
        </RouterLink>
        <button class="primary-button" type="button" :disabled="!exam || saving || !dirty" @click="savePreset">
          {{ saving ? 'Speichert…' : dirty ? 'Gestaltung speichern' : 'Alles gespeichert' }}
        </button>
      </div>
    </header>

    <p v-if="loadError" class="notice error" role="alert">{{ loadError }}</p>
    <p v-else-if="loading" class="notice">Druckbogen wird geladen…</p>

    <div v-else-if="exam" class="designer-layout">
      <div class="editor-panel">
        <CorrectionSheetPresetForm v-model="preset" />
        <p v-if="dirty" class="notice">Die Gestaltung ist noch nicht gespeichert.</p>
        <p v-if="saveMessage" class="notice" role="status">{{ saveMessage }}</p>
        <p v-if="saveError" class="notice error" role="alert">{{ saveError }}</p>
      </div>

      <section class="preview-panel" aria-label="PDF-Druckbogenvorschau">
        <div class="preview-header">
          <div>
            <h2>PDF-Vorschau</h2>
            <p>Original-PDF-Layout mit den Aufgaben dieser Prüfung. Nicht vorhandene Bewertungen sind mit -- gekennzeichnet.</p>
          </div>
          <a v-if="previewUrl" class="secondary-button" :href="previewUrl" target="_blank" rel="noopener">
            PDF öffnen
          </a>
        </div>
        <p v-if="previewError" class="notice error" role="alert">{{ previewError }}</p>
        <p v-if="previewPending" class="preview-status" role="status">Vorschau wird aktualisiert…</p>
        <iframe
          v-if="previewUrl"
          :src="previewUrl"
          title="PDF-Vorschau des Druckbogens"
          class="pdf-frame"
        ></iframe>
        <p v-else-if="!previewError" class="notice">Vorschau wird erstellt…</p>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, RouterLink, useRoute } from 'vue-router'
import type { Exams } from '@viccoboard/core'
import { createDefaultCorrectionSheetPreset } from '@viccoboard/exams'
import { useExamsBridge } from '../composables/useExamsBridge'
import CorrectionSheetPresetForm from '../components/CorrectionSheetPresetForm.vue'

const route = useRoute()
const {
  getExam,
  getCorrectionSheetPreset,
  saveCorrectionSheetPreset,
  previewCorrectionSheetDesignPdf
} = useExamsBridge()

const exam = ref<Exams.Exam | null>(null)
const preset = ref<Exams.CorrectionSheetPreset>(createDefaultCorrectionSheetPreset(''))
const loading = ref(true)
const loadError = ref('')
const dirty = ref(false)
const saving = ref(false)
const saveMessage = ref('')
const saveError = ref('')
const previewUrl = ref('')
const previewError = ref('')
const previewPending = ref(false)
let previewTimer: ReturnType<typeof setTimeout> | undefined
let previewRevision = 0

function schedulePreview(): void {
  if (!exam.value) return
  clearTimeout(previewTimer)
  const revision = ++previewRevision
  previewPending.value = true
  previewTimer = setTimeout(() => void renderPreview(revision), 300)
}

async function renderPreview(revision: number): Promise<void> {
  if (!exam.value || !previewCorrectionSheetDesignPdf) {
    previewPending.value = false
    previewError.value = 'Die Vorschaufunktion ist nicht verfügbar.'
    return
  }
  try {
    const pdf = await previewCorrectionSheetDesignPdf(exam.value.id, preset.value)
    if (!pdf) throw new Error('Die PDF-Vorschau ist noch nicht verfügbar.')
    if (revision !== previewRevision) return
    const url = URL.createObjectURL(new Blob([new Uint8Array(pdf.bytes)], { type: 'application/pdf' }))
    const oldUrl = previewUrl.value
    previewUrl.value = url
    if (oldUrl) URL.revokeObjectURL(oldUrl)
    previewError.value = ''
  } catch (error) {
    if (revision !== previewRevision) return
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
    previewError.value = error instanceof Error ? error.message : 'Die PDF-Vorschau konnte nicht erstellt werden.'
  } finally {
    if (revision === previewRevision) previewPending.value = false
  }
}

watch(preset, () => {
  if (loading.value) return
  dirty.value = true
  saveMessage.value = ''
  schedulePreview()
}, { flush: 'sync' })

async function savePreset(): Promise<void> {
  if (!exam.value || !saveCorrectionSheetPreset || saving.value) return
  saving.value = true
  saveError.value = ''
  const savingRevision = previewRevision
  try {
    const saved = await saveCorrectionSheetPreset({ ...preset.value, examId: exam.value.id })
    if (!saved) throw new Error('Der Druckbogenspeicher ist nicht verfügbar.')
    if (savingRevision === previewRevision) {
      dirty.value = false
      saveMessage.value = 'Druckbogengestaltung gespeichert.'
    }
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : 'Die Gestaltung konnte nicht gespeichert werden.'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const examId = String(route.params.id)
    const loadedExam = await getExam(examId)
    if (!loadedExam) throw new Error('Die ausgewählte Prüfung wurde nicht gefunden.')
    const saved = await getCorrectionSheetPreset?.(examId)
    exam.value = loadedExam
    preset.value = saved ?? createDefaultCorrectionSheetPreset(examId)
    loading.value = false
    schedulePreview()
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Druckbogen konnte nicht geladen werden.'
    loading.value = false
  }
})

onBeforeRouteLeave(() => {
  if (!dirty.value) return true
  return window.confirm('Die Druckbogengestaltung ist noch nicht gespeichert. Trotzdem verlassen?')
})

onBeforeUnmount(() => {
  ++previewRevision
  clearTimeout(previewTimer)
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})
</script>

<style scoped>
.sheet-designer {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.page-header,
.header-actions,
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.page-header h1,
.preview-header h2 {
  margin: 0;
}

.subtitle,
.preview-header p {
  margin: 0.4rem 0 0;
  color: #64748b;
}

.header-actions {
  align-items: center;
}

.primary-button,
.secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0.65rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  background: #fff;
  color: #0f172a;
  text-decoration: none;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.primary-button {
  background: #0f172a;
  color: #fff;
  border-color: #0f172a;
}

.primary-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.designer-layout {
  display: grid;
  grid-template-columns: minmax(300px, 420px) minmax(0, 1fr);
  align-items: start;
  gap: 1rem;
}

.editor-panel,
.preview-panel {
  min-width: 0;
  padding: 1.25rem;
  background: #fff;
  border: 1px solid #dbe3ed;
  border-radius: 16px;
}

.preview-panel {
  position: sticky;
  top: 1rem;
}

.preview-header {
  margin-bottom: 1rem;
}

.preview-header p {
  max-width: 38rem;
  font-size: 0.875rem;
}

.pdf-frame {
  display: block;
  width: 100%;
  min-height: 740px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 8px;
}

.notice,
.preview-status {
  margin: 0.75rem 0;
  color: #475569;
}

.error {
  color: #b42318;
}

@media (max-width: 940px) {
  .designer-layout {
    grid-template-columns: 1fr;
  }

  .preview-panel {
    position: static;
  }
}
</style>
