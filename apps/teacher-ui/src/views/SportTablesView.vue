<template>
  <section class="sport-tables">
    <header class="page-header">
      <button class="back-button" @click="$router.back()">← Zurück</button>
      <div>
        <h1>Tabellenverwaltung</h1>
        <p class="subtitle">Leistungstabellen importieren, aktivieren und verwalten.</p>
      </div>
      <span class="summary-pill">{{ tables.length }} Tabellen</span>
    </header>

    <!-- Import section -->
    <section class="import-card" aria-label="Tabelle importieren">
      <p class="eyebrow">Import</p>
      <h2>Tabelle importieren</h2>
      <p class="hint">
        CSV-Datei hochladen. Erste Zeile = Spaltennamen, letzte Spalte muss
        <code>value</code> heißen. Zeilen mit <code>#</code> werden ignoriert.
      </p>

      <div class="form-row">
        <label class="field">
          <span class="label-text">Name *</span>
          <input
            v-model="importName"
            type="text"
            placeholder="z. B. Cooper-Normen Sek 1"
            class="text-input"
            :disabled="importing"
          />
        </label>
        <label class="field">
          <span class="label-text">Beschreibung</span>
          <input
            v-model="importDescription"
            type="text"
            placeholder="Optional"
            class="text-input"
            :disabled="importing"
          />
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

      <button
        class="import-button"
        :disabled="!canImport || importing"
        @click="doImport"
      >
        {{ importing ? 'Wird importiert …' : 'Importieren' }}
      </button>

      <p v-if="importSuccess" class="success-msg" role="status">
        Tabelle „{{ lastImportedName }}" erfolgreich importiert.
      </p>
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
          class="table-card"
          :class="{ inactive: table.active === false }"
        >
          <div class="table-info">
            <div class="table-header-row">
              <strong class="table-name">{{ table.name }}</strong>
              <span class="badge" :class="table.active !== false ? 'badge-active' : 'badge-inactive'">
                {{ table.active !== false ? 'Aktiv' : 'Inaktiv' }}
              </span>
              <span class="badge badge-source">{{ sourceLabelMap[table.source] ?? table.source }}</span>
            </div>
            <p v-if="table.description" class="table-desc">{{ table.description }}</p>
            <p class="table-meta">
              {{ table.entries.length }} Einträge ·
              {{ table.type === 'complex' ? 'Komplex' : 'Einfach' }} ·
              Erstellt: {{ formatDate(table.createdAt) }}
            </p>
          </div>

          <div class="table-actions">
            <button
              class="action-btn"
              :aria-label="table.active !== false ? 'Deaktivieren' : 'Aktivieren'"
              @click="toggleActive(table)"
            >
              {{ table.active !== false ? 'Deaktivieren' : 'Aktivieren' }}
            </button>
            <button
              class="action-btn danger"
              aria-label="Tabelle löschen"
              @click="deleteTable(table.id)"
            >
              Löschen
            </button>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getSportBridge } from '../composables/useSportBridge'
import type { Sport } from '@viccoboard/core'

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
