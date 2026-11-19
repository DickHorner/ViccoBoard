<template>
  <section class="template-library">
    <header class="page-header">
      <div>
        <h1>Druckbogenvorlagen</h1>
        <p class="subtitle">Gestalte Rückmeldebögen unabhängig von Prüfungen und verwende sie später erneut.</p>
      </div>
      <div class="header-actions">
        <RouterLink to="/subjects/kbr" class="back-link">← KBR</RouterLink>
        <Button label="Neue Vorlage" icon="pi pi-plus" :disabled="loading || saving || deleting" @click="startNew" />
      </div>
    </header>

    <Message v-if="loadError" severity="error" role="alert">{{ loadError }}</Message>
    <div v-if="loading" class="app-status-panel" role="status">Vorlagen werden geladen…</div>

    <div v-else class="library-layout">
      <aside class="library-panel app-card" aria-label="Gespeicherte Druckbogenvorlagen">
        <h2>Meine Vorlagen</h2>
        <p v-if="templates.length === 0" class="hint">Noch keine Vorlagen. Erstelle Deine erste Gestaltung.</p>
        <div v-else class="template-list">
          <button
            v-for="entry in templates"
            :key="entry.id"
            type="button"
            class="template-choice"
            :class="{ active: currentId === entry.id }"
            :aria-current="currentId === entry.id ? 'true' : undefined"
            @click="selectTemplate(entry)"
          >
            <strong>{{ entry.name }}</strong>
            <span>{{ formatDate(entry.lastModified) }}</span>
          </button>
        </div>
      </aside>

      <div class="editor-panel app-card">
        <div class="editor-heading">
          <h2>{{ currentId ? 'Vorlage bearbeiten' : 'Neue Vorlage' }}</h2>
          <div class="editor-actions">
            <Button
              v-if="currentId"
              label="Löschen"
              severity="danger"
              outlined
              :disabled="saving || deleting"
              @click="deleteCurrent"
            />
            <Button
              :label="saving ? 'Speichert…' : 'Vorlage speichern'"
              :loading="saving"
              :disabled="!dirty || saving"
              @click="saveCurrent"
            />
          </div>
        </div>
        <Message v-if="saveMessage" severity="success" role="status">{{ saveMessage }}</Message>
        <Message v-if="saveError" severity="error" role="alert">{{ saveError }}</Message>
        <CorrectionSheetPresetForm v-model="preset" />
      </div>

      <section class="preview-panel app-card" aria-label="PDF-Vorschau der Druckbogenvorlage">
        <div class="preview-heading">
          <h2>Layoutvorschau</h2>
          <a v-if="previewUrl" :href="previewUrl" target="_blank" rel="noopener" class="back-link">PDF öffnen</a>
        </div>
        <p class="hint">Die Vorschau zeigt das Blanko-Layout ohne Prüflinge oder Prüfungsaufgaben. Prüfungen mit dieser Vorlage verwenden beim nächsten PDF-Erzeugen stets die aktuelle Version.</p>
        <Message v-if="previewError" severity="error" role="alert">{{ previewError }}</Message>
        <p v-if="previewPending" role="status">PDF-Vorschau wird erstellt…</p>
        <iframe v-if="previewUrl" :src="previewUrl" class="pdf-frame" title="Druckbogenvorlage als PDF"></iframe>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, RouterLink, useRoute } from 'vue-router'
import Button from 'openvue/button'
import Message from 'openvue/message'
import type { Exams } from '@viccoboard/core'
import {
  createDefaultCorrectionSheetPreset,
  type CorrectionSheetTemplate
} from '@viccoboard/exams'
import { useExamsBridge } from '../composables/useExamsBridge'
import CorrectionSheetPresetForm from '../components/CorrectionSheetPresetForm.vue'
import { formatGermanDate } from '../utils/locale-format'
import { recordRouteContentReady } from '../utils/navigation-performance'

const { correctionSheetTemplateRepository, previewStandaloneSheetDesignPdf } = useExamsBridge()
const route = useRoute()

const templates = ref<CorrectionSheetTemplate[]>([])
const currentId = ref('')
const preset = ref<Exams.CorrectionSheetPreset>(createDefaultCorrectionSheetPreset(''))
const loading = ref(true)
const loadError = ref('')
const saveError = ref('')
const saveMessage = ref('')
const saving = ref(false)
const deleting = ref(false)
const dirty = ref(false)
const previewUrl = ref('')
const previewError = ref('')
const previewPending = ref(false)
let previewTimer: ReturnType<typeof setTimeout> | undefined
let previewRevision = 0
let initializing = true

const formatDate = (date: Date) => formatGermanDate(date)

function schedulePreview(): void {
  clearTimeout(previewTimer)
  const revision = ++previewRevision
  previewPending.value = true
  previewError.value = ''
  previewTimer = setTimeout(() => void renderPreview(revision), 300)
}

async function renderPreview(revision: number): Promise<void> {
  if (!previewStandaloneSheetDesignPdf) {
    if (revision === previewRevision) {
      previewError.value = 'Die PDF-Vorschau ist nicht verfügbar.'
      previewPending.value = false
    }
    return
  }
  try {
    const pdf = await previewStandaloneSheetDesignPdf(preset.value)
    if (!pdf) throw new Error('Die PDF-Vorschau ist nicht verfügbar.')
    if (revision !== previewRevision) return
    const url = URL.createObjectURL(new Blob([new Uint8Array(pdf.bytes)], { type: 'application/pdf' }))
    const oldUrl = previewUrl.value
    previewUrl.value = url
    if (oldUrl) URL.revokeObjectURL(oldUrl)
    previewError.value = ''
  } catch (error) {
    if (revision !== previewRevision) return
    previewError.value = error instanceof Error ? error.message : 'Die Vorschau konnte nicht erstellt werden.'
  } finally {
    if (revision === previewRevision) previewPending.value = false
  }
}

function replaceEditor(value: Exams.CorrectionSheetPreset, id = ''): void {
  initializing = true
  currentId.value = id
  preset.value = { ...value, examId: '' }
  dirty.value = false
  saveError.value = ''
  saveMessage.value = ''
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
  initializing = false
  schedulePreview()
}

function canLeaveEditor(): boolean {
  return !dirty.value || window.confirm('Die Änderungen an der Vorlage sind nicht gespeichert. Verwerfen?')
}

function selectTemplate(entry: CorrectionSheetTemplate): void {
  if (entry.id === currentId.value || !canLeaveEditor()) return
  replaceEditor(entry.preset, entry.id)
}

function startNew(): void {
  if (!canLeaveEditor()) return
  replaceEditor(createDefaultCorrectionSheetPreset(''))
  dirty.value = true
}

async function loadTemplates(): Promise<void> {
  loading.value = true
  loadError.value = ''
  try {
    if (!correctionSheetTemplateRepository) throw new Error('Vorlagenspeicher nicht verfügbar.')
    templates.value = await correctionSheetTemplateRepository.findAll()
    const requestedId = typeof route.query.templateId === 'string' ? route.query.templateId : ''
    const initial = templates.value.find(entry => entry.id === requestedId) ?? templates.value[0]
    replaceEditor(initial?.preset ?? createDefaultCorrectionSheetPreset(''), initial?.id)
    if (!initial) dirty.value = true
    loading.value = false
    await nextTick()
    recordRouteContentReady('sheet-templates')
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Vorlagen konnten nicht geladen werden.'
  } finally {
    loading.value = false
  }
}

async function saveCurrent(): Promise<void> {
  if (saving.value || !dirty.value) return
  saving.value = true
  saveError.value = ''
  saveMessage.value = ''
  const savingRevision = previewRevision
  try {
    if (!correctionSheetTemplateRepository) throw new Error('Vorlagenspeicher nicht verfügbar.')
    const saved = currentId.value
      ? await correctionSheetTemplateRepository.update(currentId.value, preset.value)
      : await correctionSheetTemplateRepository.create(preset.value)
    currentId.value = saved.id
    templates.value = await correctionSheetTemplateRepository.findAll()
    if (savingRevision === previewRevision) dirty.value = false
    saveMessage.value = 'Vorlage gespeichert.'
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : 'Die Vorlage konnte nicht gespeichert werden.'
  } finally {
    saving.value = false
  }
}

async function deleteCurrent(): Promise<void> {
  if (!currentId.value || deleting.value || saving.value) return
  if (!window.confirm('Diese Druckbogenvorlage endgültig löschen?')) return
  deleting.value = true
  saveError.value = ''
  try {
    if (!correctionSheetTemplateRepository) throw new Error('Vorlagenspeicher nicht verfügbar.')
    await correctionSheetTemplateRepository.delete(currentId.value)
    templates.value = await correctionSheetTemplateRepository.findAll()
    const next = templates.value[0]
    replaceEditor(next?.preset ?? createDefaultCorrectionSheetPreset(''), next?.id)
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : 'Die Vorlage konnte nicht gelöscht werden.'
  } finally {
    deleting.value = false
  }
}

watch(preset, () => {
  if (initializing || loading.value) return
  dirty.value = true
  saveMessage.value = ''
  schedulePreview()
}, { flush: 'sync' })

onBeforeRouteLeave(() => canLeaveEditor())
onMounted(() => { void loadTemplates() })
onBeforeUnmount(() => {
  ++previewRevision
  clearTimeout(previewTimer)
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})
</script>

<style scoped>
.template-library {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.page-header,
.header-actions,
.editor-heading,
.preview-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.page-header h1,
.library-panel h2,
.editor-heading h2,
.preview-heading h2 {
  margin: 0;
}

.subtitle,
.hint {
  color: var(--color-muted);
}

.back-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: var(--accent-strong);
}

.library-layout {
  display: grid;
  grid-template-columns: minmax(190px, 250px) minmax(260px, 1fr) minmax(280px, 1fr);
  align-items: start;
  gap: 1rem;
}

.library-panel,
.editor-panel,
.preview-panel {
  padding: 1.25rem;
  min-width: 0;
}

.template-list,
.editor-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.editor-actions {
  flex-direction: row;
  flex-wrap: wrap;
  margin-top: 0;
}

.template-choice {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  width: 100%;
  min-height: 44px;
  padding: 0.8rem;
  text-align: left;
  color: var(--color-ink);
  border: 1px solid var(--surface-border);
  border-radius: 0.75rem;
  background: transparent;
  cursor: pointer;
}

.template-choice span {
  font-size: 0.85rem;
  color: var(--color-muted);
}

.template-choice.active {
  border-color: var(--accent-strong);
}

.editor-panel :deep(.p-button),
.header-actions :deep(.p-button) {
  min-height: 44px;
}

.pdf-frame {
  width: 100%;
  min-height: 680px;
  border: 1px solid var(--surface-border);
  border-radius: 0.5rem;
}

@media (max-width: 1150px) {
  .library-layout {
    grid-template-columns: minmax(180px, 240px) minmax(0, 1fr);
  }
  .preview-panel {
    grid-column: 1 / -1;
  }
}

@media (max-width: 660px) {
  .library-layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .preview-panel {
    grid-column: auto;
  }
}
</style>
