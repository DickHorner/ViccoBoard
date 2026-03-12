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

<style scoped>
.sport-tables {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.page-header h1 {
  margin: 0;
}

.subtitle {
  color: #64748b;
  margin: 0.25rem 0 0;
}

.back-button {
  background: none;
  border: none;
  color: #0f766e;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem;
  min-height: 44px;
  white-space: nowrap;
}

.summary-pill {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  padding: 0 1rem;
  border-radius: 999px;
  background: rgba(14, 116, 144, 0.12);
  color: #155e75;
  font-weight: 700;
}

/* Import card */
.import-card {
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  color: #0f766e;
  font-weight: 700;
}

.import-card h2 {
  margin: 0;
}

.hint {
  color: #64748b;
  margin: 0;
  font-size: 0.9rem;
}

.hint code {
  background: #f1f5f9;
  border-radius: 4px;
  padding: 0.1em 0.3em;
  font-family: monospace;
}

.form-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 180px;
}

.label-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
}

.text-input {
  border: 1px solid rgba(15, 23, 42, 0.2);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  min-height: 44px;
  width: 100%;
  box-sizing: border-box;
}

.text-input:disabled {
  opacity: 0.6;
}

.file-row {
  align-items: flex-end;
}

.file-label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.file-input {
  font-size: 1rem;
  min-height: 44px;
}

.file-name {
  font-size: 0.85rem;
  color: #64748b;
  align-self: flex-end;
  padding-bottom: 0.5rem;
}

.error-list {
  margin: 0;
  padding: 0.75rem 1rem;
  background: #fef2f2;
  border: 1px solid #fca5a5;
  border-radius: 8px;
  list-style: disc inside;
}

.error-item {
  color: #b91c1c;
  font-size: 0.9rem;
}

.csv-preview {
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 8px;
  padding: 0.75rem;
}

.preview-label {
  margin: 0 0 0.4rem;
  font-size: 0.8rem;
  color: #64748b;
}

.preview-content {
  margin: 0;
  font-size: 0.8rem;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
  color: #0f172a;
}

.import-button {
  align-self: flex-start;
  background: #0f766e;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.6rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  min-height: 44px;
}

.import-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.success-msg {
  color: #15803d;
  font-weight: 600;
  margin: 0;
}

/* Table list */
.empty-msg,
.error-msg {
  color: #64748b;
  font-size: 0.95rem;
}

.error-msg {
  color: #b91c1c;
}

.table-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.table-card {
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.table-card.inactive {
  opacity: 0.6;
}

.table-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.table-header-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.table-name {
  font-size: 1rem;
}

.badge {
  font-size: 0.7rem;
  font-weight: 700;
  border-radius: 999px;
  padding: 0.15em 0.6em;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.badge-active {
  background: rgba(16, 185, 129, 0.12);
  color: #065f46;
}

.badge-inactive {
  background: rgba(100, 116, 139, 0.12);
  color: #475569;
}

.badge-source {
  background: rgba(14, 116, 144, 0.1);
  color: #0e7490;
}

.table-desc {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

.table-meta {
  font-size: 0.8rem;
  color: #94a3b8;
  margin: 0;
}

.table-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-shrink: 0;
}

.action-btn {
  background: none;
  border: 1px solid rgba(15, 23, 42, 0.2);
  border-radius: 8px;
  padding: 0.4rem 0.9rem;
  font-size: 0.875rem;
  cursor: pointer;
  min-height: 44px;
  color: #334155;
}

.action-btn:hover {
  background: rgba(15, 23, 42, 0.04);
}

.action-btn.danger {
  border-color: #fca5a5;
  color: #b91c1c;
}

.action-btn.danger:hover {
  background: #fef2f2;
}
</style>
