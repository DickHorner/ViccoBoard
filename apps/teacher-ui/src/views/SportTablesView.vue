<template>
  <section class="sport-tables sport-ui">
    <header class="page-header">
      <Button text severity="secondary" icon="pi pi-arrow-left" @click="$router.back()">Zurück</Button>
      <div>
        <h1>Tabellenverwaltung</h1>
        <p class="subtitle">Leistungstabellen importieren, aktivieren und verwalten.</p>
      </div>
      <Tag :value="tables.length + ' Tabellen'" severity="info" />
    </header>

    <section class="template-card app-card" aria-label="CSV-Vorlage herunterladen">
      <div>
        <p class="eyebrow">Vorlage</p>
        <h2>Cooper-Normen als CSV</h2>
        <p class="hint">
          Vorlage herunterladen, in Excel oder einer Tabellen-App anpassen und wieder als CSV importieren.
        </p>
      </div>
      <Button label="CSV-Vorlage herunterladen" icon="pi pi-download" severity="secondary" outlined @click="downloadCooperTemplate" />
    </section>

    <!-- Import section -->
    <section class="import-card app-card" aria-label="Tabelle importieren">
      <p class="eyebrow">Import</p>
      <h2>Tabelle importieren</h2>
      <div class="import-guidance">
        <p class="hint">
          Erste Zeile = Spaltennamen; die letzte Spalte muss <code>value</code> heißen.
          Spaltenreihenfolge und Anzahl der Spalten nicht ändern. Zeilen mit <code>#</code> werden ignoriert.
        </p>
        <ol class="workflow-steps">
          <li>Vorlage herunterladen und in Excel oder einer Tabellen-App bearbeiten.</li>
          <li>Als <strong>CSV (kommagetrennt)</strong> speichern.</li>
          <li>Datei auswählen, Vorschau prüfen und importieren.</li>
        </ol>
        <p class="android-hint">
          <strong>Android:</strong> Speichere die CSV in <em>Downloads</em> oder <em>Dateien</em> und wähle sie hier über den Dateiauswahldialog aus.
        </p>
      </div>

      <div class="form-row">
        <label class="field">
          <span class="label-text">Name *</span>
          <InputText v-model="importName" placeholder="z. B. Cooper-Normen Sek 1" :disabled="importing" fluid />
        </label>
        <label class="field">
          <span class="label-text">Beschreibung</span>
          <InputText v-model="importDescription" placeholder="Optional" :disabled="importing" fluid />
        </label>
      </div>

      <div class="form-row file-row">
        <label class="file-label">
          <span class="label-text">CSV-Datei *</span>
          <input
            ref="fileInputRef"
            type="file"
            accept=".csv,text/csv"
            class="file-input"
            :disabled="importing"
            @change="onFileSelected"
          />
        </label>
        <span v-if="selectedFileName" class="file-name">{{ selectedFileName }}</span>
      </div>

      <!-- Validation errors -->
      <ul v-if="importErrors.length > 0" class="error-list" role="alert">
        <li v-for="err in importErrors" :key="err" class="error-item">{{ err }}</li>
      </ul>

      <!-- CSV preview (first few lines) -->
      <div v-if="csvPreviewLines.length > 0" class="csv-preview" aria-label="CSV Vorschau">
        <p class="preview-label">Vorschau (erste {{ csvPreviewLines.length }} Zeilen)</p>
        <pre class="preview-content">{{ csvPreviewLines.join('\n') }}</pre>
      </div>

      <Button :label="importing ? 'Wird importiert …' : 'Importieren'" icon="pi pi-upload" :loading="importing" :disabled="!canImport || importing" @click="doImport" />

      <Message v-if="importSuccess" severity="success" role="status">
        Tabelle „{{ lastImportedName }}" erfolgreich importiert.
      </Message>
    </section>

    <!-- Table list -->
    <section aria-label="Vorhandene Tabellen">
      <p v-if="loadError" class="error-msg" role="alert">{{ loadError }}</p>

      <p v-else-if="tables.length === 0 && !loading" class="empty-msg">
        Noch keine Tabellen vorhanden. Importiere eine CSV-Datei, um zu beginnen.
      </p>

      <div v-else class="table-list">
        <article
          v-for="table in tables"
          :key="table.id"
          class="table-card app-card"
          :class="{ inactive: table.active === false }"
        >
          <div class="table-info">
            <div class="table-header-row">
              <strong class="table-name">{{ table.name }}</strong>
              <Tag :value="table.active !== false ? 'Aktiv' : 'Inaktiv'" :severity="table.active !== false ? 'success' : 'secondary'" />
              <Tag :value="sourceLabelMap[table.source] ?? table.source" severity="secondary" />
            </div>
            <p v-if="table.description" class="table-desc">{{ table.description }}</p>
            <p class="table-meta">
              {{ table.entries.length }} Einträge ·
              {{ table.type === 'complex' ? 'Komplex' : 'Einfach' }} ·
              Erstellt: {{ formatDate(table.createdAt) }}
            </p>
          </div>

          <div class="table-actions">
            <Button
              :label="table.active !== false ? 'Deaktivieren' : 'Aktivieren'"
              severity="secondary" outlined @click="toggleActive(table)"
            />
            <Button label="Löschen" :aria-label="`Tabelle ${table.name} löschen`"
              severity="danger" text @click="deleteTable(table.id)" />
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import Button from 'openvue/button'
import { ref, computed, onMounted } from 'vue'
import Button from 'openvue/button'
import InputText from 'openvue/inputtext'
import Message from 'openvue/message'
import Tag from 'openvue/tag'
import { getSportBridge } from '../composables/useSportBridge'
import type { Sport } from '@viccoboard/core'
import {
  COOPER_TABLE_CSV_TEMPLATE,
  COOPER_TABLE_TEMPLATE_FILE_NAME
} from '@viccoboard/sport'
import { downloadText } from '../utils/download'

const bridge = getSportBridge()

const tables = ref<Sport.TableDefinition[]>([])
const loading = ref(false)
const loadError = ref<string | null>(null)

const importName = ref('')
const importDescription = ref('')
const selectedFileName = ref<string | null>(null)
const csvContent = ref<string | null>(null)
const csvPreviewLines = ref<string[]>([])
const importErrors = ref<string[]>([])
const importing = ref(false)
const importSuccess = ref(false)
const lastImportedName = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

const sourceLabelMap: Record<string, string> = {
  local: 'Lokal',
  imported: 'Importiert',
  downloaded: 'Heruntergeladen'
}

const canImport = computed(
  () => importName.value.trim().length > 0 && csvContent.value !== null
)

function downloadCooperTemplate(): void {
  downloadText(
    COOPER_TABLE_CSV_TEMPLATE,
    COOPER_TABLE_TEMPLATE_FILE_NAME,
    'text/csv;charset=utf-8'
  )
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(date))
}

async function loadTables(): Promise<void> {
  loading.value = true
  loadError.value = null
  try {
    tables.value = await bridge.tableDefinitionRepository.findAll()
  } catch (error) {
    loadError.value =
      error instanceof Error ? error.message : 'Fehler beim Laden der Tabellen.'
  } finally {
    loading.value = false
  }
}

function onFileSelected(event: Event): void {
  importErrors.value = []
  importSuccess.value = false
  csvContent.value = null
  csvPreviewLines.value = []
  selectedFileName.value = null

  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  selectedFileName.value = file.name

  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result as string
    csvContent.value = text
    // Build a brief preview of non-comment, non-empty lines
    const previewLines = text
      .split(/\r?\n/)
      .filter((l) => l.trim().length > 0 && !l.trim().startsWith('#'))
      .slice(0, 5)
    csvPreviewLines.value = previewLines
  }
  reader.readAsText(file)
}

async function doImport(): Promise<void> {
  if (!canImport.value || !csvContent.value) return

  importing.value = true
  importErrors.value = []
  importSuccess.value = false

  try {
    const result = await bridge.importTableDefinitionUseCase.execute({
      name: importName.value.trim(),
      csvContent: csvContent.value,
      description: importDescription.value.trim() || undefined
    })

    if (!result.success) {
      importErrors.value = result.errors ?? ['Unbekannter Fehler beim Import.']
    } else {
      lastImportedName.value = result.definition?.name ?? importName.value
      importSuccess.value = true
      importName.value = ''
      importDescription.value = ''
      csvContent.value = null
      csvPreviewLines.value = []
      selectedFileName.value = null
      if (fileInputRef.value) {
        fileInputRef.value.value = ''
      }
      await loadTables()
    }
  } finally {
    importing.value = false
  }
}

async function toggleActive(table: Sport.TableDefinition): Promise<void> {
  try {
    await bridge.tableDefinitionRepository.update(table.id, {
      active: !(table.active ?? true)
    })
    await loadTables()
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Fehler beim Aktualisieren der Tabelle.'
  }
}

async function deleteTable(id: string): Promise<void> {
  if (!confirm('Tabelle wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) return
  try {
    await bridge.tableDefinitionRepository.delete(id)
    await loadTables()
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Fehler beim Löschen der Tabelle.'
  }
}

onMounted(loadTables)
</script>

<style scoped src="./SportTablesView.css"></style>
