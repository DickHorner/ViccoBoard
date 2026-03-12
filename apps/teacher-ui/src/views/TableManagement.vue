<template>
  <div class="table-management-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← Zurück</button>
      <h2>Tabellenverwaltung</h2>
      <p class="page-description">
        Verwalten Sie Bewertungstabellen für den Sportunterricht.
      </p>
    </div>

    <div v-if="loadError" class="error-banner" role="alert">{{ loadError }}</div>

    <div class="toolbar">
      <button class="btn-primary" @click="openCreateModal">+ Neue Tabelle</button>
      <button class="btn-secondary" @click="triggerImport">↑ CSV importieren</button>
      <input
        ref="fileInputRef"
        type="file"
        accept=".csv,.json"
        class="hidden-input"
        aria-label="Tabellendatei importieren"
        @change="handleFileImport"
      />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" aria-hidden="true"></div>
      <p>Tabellen werden geladen…</p>
    </div>

    <!-- Table List -->
    <template v-else>
      <div v-if="tables.length === 0" class="empty-state">
        <p>Noch keine Bewertungstabellen vorhanden.</p>
        <p class="empty-hint">Erstellen Sie eine neue Tabelle oder importieren Sie eine CSV-Datei.</p>
      </div>

      <div v-else class="table-list">
        <div
          v-for="table in tables"
          :key="table.id"
          :class="['table-card', { expanded: previewId === table.id }]"
        >
          <div class="table-card-header">
            <div class="table-info">
              <h3 class="table-name">{{ table.name }}</h3>
              <div class="table-meta">
                <span class="meta-badge" :class="table.type">{{ typeLabel(table.type) }}</span>
                <span class="meta-badge source">{{ sourceLabel(table.source) }}</span>
                <span class="meta-text">{{ table.entries.length }} Einträge</span>
                <span class="meta-text">{{ formatDate(table.lastModified) }}</span>
              </div>
              <p v-if="table.description" class="table-description">{{ table.description }}</p>
            </div>
            <div class="table-actions">
              <button
                class="btn-secondary btn-small"
                @click="togglePreview(table.id)"
                :aria-expanded="previewId === table.id"
              >
                {{ previewId === table.id ? 'Vorschau schließen' : 'Vorschau' }}
              </button>
              <button
                class="btn-text btn-small"
                @click="openEditModal(table)"
              >
                ✏️ Bearbeiten
              </button>
              <button
                class="btn-danger btn-small"
                :disabled="deleting === table.id"
                @click="confirmDelete(table)"
              >
                {{ deleting === table.id ? '…' : '🗑 Löschen' }}
              </button>
            </div>
          </div>

          <!-- Preview -->
          <div v-if="previewId === table.id" class="table-preview">
            <div v-if="table.entries.length === 0" class="preview-empty">
              Keine Einträge vorhanden.
            </div>
            <div v-else class="preview-scroll">
              <table class="preview-table">
                <thead>
                  <tr>
                    <th v-for="dim in table.dimensions" :key="dim.name">{{ dim.name }}</th>
                    <th>Wert</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(entry, idx) in table.entries.slice(0, 20)" :key="idx">
                    <td v-for="dim in table.dimensions" :key="dim.name">
                      {{ entry.key[dim.name] ?? '—' }}
                    </td>
                    <td>{{ formatEntryValue(entry.value) }}</td>
                  </tr>
                </tbody>
              </table>
              <p v-if="table.entries.length > 20" class="preview-truncate">
                … und {{ table.entries.length - 20 }} weitere Einträge
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Create / Edit Modal -->
    <div
      v-if="showModal"
      class="modal-overlay"
      @click.self="closeModal"
      role="dialog"
      aria-modal="true"
      :aria-label="editingTable ? 'Tabelle bearbeiten' : 'Neue Tabelle'"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editingTable ? 'Tabelle bearbeiten' : 'Neue Tabelle' }}</h3>
          <button class="close-btn" @click="closeModal" aria-label="Schließen">×</button>
        </div>

        <form class="modal-content" @submit.prevent="saveModal">
          <div class="form-group">
            <label for="modal-name">Name *</label>
            <input
              id="modal-name"
              v-model="form.name"
              type="text"
              maxlength="80"
              required
              class="form-input"
              placeholder="z. B. Cooper-Tabelle Klasse 9"
            />
          </div>

          <div class="form-group">
            <label for="modal-type">Typ *</label>
            <select id="modal-type" v-model="form.type" required class="form-select">
              <option value="simple">Einfach</option>
              <option value="complex">Komplex</option>
            </select>
          </div>

          <div class="form-group">
            <label for="modal-description">Beschreibung</label>
            <input
              id="modal-description"
              v-model="form.description"
              type="text"
              maxlength="200"
              class="form-input"
              placeholder="Optionale Beschreibung"
            />
          </div>

          <div v-if="modalError" class="error-banner" role="alert">{{ modalError }}</div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="closeModal">Abbrechen</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'Speichern…' : 'Speichern' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <div
      v-if="deleteTarget"
      class="modal-overlay"
      @click.self="deleteTarget = null"
      role="dialog"
      aria-modal="true"
      aria-label="Tabelle löschen"
    >
      <div class="modal modal-sm">
        <div class="modal-header">
          <h3>Tabelle löschen?</h3>
          <button class="close-btn" @click="deleteTarget = null" aria-label="Abbrechen">×</button>
        </div>
        <div class="modal-content">
          <p>Möchten Sie die Tabelle <strong>{{ deleteTarget.name }}</strong> wirklich löschen?</p>
          <p class="warning-text">Diese Aktion kann nicht rückgängig gemacht werden.</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="deleteTarget = null">Abbrechen</button>
          <button class="btn-danger" :disabled="!!deleting" @click="executeDelete">
            {{ deleting ? 'Wird gelöscht…' : 'Löschen' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getSportBridge } from '../composables/useSportBridge';
import { useToast } from '../composables/useToast';
import type { Sport } from '@viccoboard/core';

const toast = useToast();

const loading = ref(false);
const saving = ref(false);
const deleting = ref<string | null>(null);
const loadError = ref('');

const tables = ref<Sport.TableDefinition[]>([]);
const previewId = ref<string | null>(null);
const showModal = ref(false);
const editingTable = ref<Sport.TableDefinition | null>(null);
const deleteTarget = ref<Sport.TableDefinition | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const modalError = ref('');

const form = ref({
  name: '',
  type: 'simple' as 'simple' | 'complex',
  description: ''
});

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  await loadTables();
});

async function loadTables(): Promise<void> {
  loading.value = true;
  loadError.value = '';
  try {
    const bridge = getSportBridge();
    tables.value = await bridge.tableDefinitionRepository.findAll();
  } catch (e: any) {
    loadError.value = e?.message ?? 'Tabellen konnten nicht geladen werden.';
  } finally {
    loading.value = false;
  }
}

// ── Display helpers ────────────────────────────────────────────────────────────

function typeLabel(type: string): string {
  return type === 'complex' ? 'Komplex' : 'Einfach';
}

function sourceLabel(source: string): string {
  const map: Record<string, string> = {
    local: 'Lokal',
    imported: 'Importiert',
    downloaded: 'Heruntergeladen'
  };
  return map[source] ?? source;
}

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString('de-DE');
}

function formatEntryValue(value: any): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

// ── Preview ───────────────────────────────────────────────────────────────────

function togglePreview(id: string): void {
  previewId.value = previewId.value === id ? null : id;
}

// ── Create / Edit ─────────────────────────────────────────────────────────────

function openCreateModal(): void {
  editingTable.value = null;
  form.value = { name: '', type: 'simple', description: '' };
  modalError.value = '';
  showModal.value = true;
}

function openEditModal(table: Sport.TableDefinition): void {
  editingTable.value = table;
  form.value = {
    name: table.name,
    type: table.type,
    description: table.description ?? ''
  };
  modalError.value = '';
  showModal.value = true;
}

function closeModal(): void {
  showModal.value = false;
  editingTable.value = null;
  modalError.value = '';
}

async function saveModal(): Promise<void> {
  saving.value = true;
  modalError.value = '';
  try {
    const bridge = getSportBridge();
    if (editingTable.value) {
      await bridge.saveTableDefinitionUseCase.execute({
        id: editingTable.value.id,
        name: form.value.name,
        type: form.value.type,
        description: form.value.description || undefined,
        source: editingTable.value.source,
        dimensions: editingTable.value.dimensions,
        mappingRules: editingTable.value.mappingRules,
        entries: editingTable.value.entries
      });
      toast.success('Tabelle aktualisiert.');
    } else {
      await bridge.saveTableDefinitionUseCase.execute({
        name: form.value.name,
        type: form.value.type,
        description: form.value.description || undefined,
        source: 'local',
        dimensions: [],
        mappingRules: [],
        entries: []
      });
      toast.success('Tabelle erstellt.');
    }
    closeModal();
    await loadTables();
  } catch (e: any) {
    modalError.value = e?.message ?? 'Fehler beim Speichern.';
  } finally {
    saving.value = false;
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

function confirmDelete(table: Sport.TableDefinition): void {
  deleteTarget.value = table;
}

async function executeDelete(): Promise<void> {
  if (!deleteTarget.value) return;
  deleting.value = deleteTarget.value.id;
  try {
    const bridge = getSportBridge();
    await bridge.deleteTableDefinitionUseCase.execute(deleteTarget.value.id);
    toast.success('Tabelle gelöscht.');
    deleteTarget.value = null;
    await loadTables();
  } catch (e: any) {
    toast.error(e?.message ?? 'Fehler beim Löschen.');
  } finally {
    deleting.value = null;
  }
}

// ── CSV Import ────────────────────────────────────────────────────────────────

function triggerImport(): void {
  fileInputRef.value?.click();
}

async function handleFileImport(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  input.value = '';

  const ext = file.name.split('.').pop()?.toLowerCase();
  try {
    if (ext === 'csv') {
      await importFromCsv(file);
    } else if (ext === 'json') {
      await importFromJson(file);
    } else {
      toast.error('Nur CSV- oder JSON-Dateien werden unterstützt.');
    }
  } catch (e: any) {
    toast.error(e?.message ?? 'Import fehlgeschlagen.');
  }
}

/**
 * Parse a single CSV row, handling double-quoted fields that may contain commas.
 */
function parseCsvRow(line: string): string[] {
  const cols: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cols.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cols.push(current.trim());
  return cols;
}

async function importFromCsv(file: File): Promise<void> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) {
    toast.error('CSV-Datei enthält keine Daten.');
    return;
  }

  const headers = parseCsvRow(lines[0]);
  if (headers.length < 2) {
    toast.error('CSV muss mindestens zwei Spalten haben.');
    return;
  }

  const dimNames = headers.slice(0, headers.length - 1);
  const valueHeader = headers[headers.length - 1];

  const entries: Sport.TableEntry[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvRow(lines[i]);
    if (cols.length !== headers.length) {
      errors.push(`Zeile ${i + 1}: falsche Spaltenanzahl`);
      continue;
    }
    const key: Record<string, any> = {};
    dimNames.forEach((dim, idx) => { key[dim] = cols[idx]; });
    const rawValue = cols[cols.length - 1];
    const value = (rawValue !== '' && !isNaN(Number(rawValue))) ? Number(rawValue) : rawValue;
    entries.push({ key, value });
  }

  if (errors.length > 0) {
    toast.error(`Import mit Fehlern: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? ' …' : ''}`);
    if (entries.length === 0) return;
  }

  const dimensions: Sport.TableDimension[] = dimNames.map(name => {
    const unique = [...new Set(entries.map(e => String(e.key[name])))];
    return { name: name as Sport.TableDimension['name'], values: unique };
  });

  const bridge = getSportBridge();
  await bridge.saveTableDefinitionUseCase.execute({
    name: file.name.replace(/\.[^.]+$/, ''),
    type: 'simple',
    source: 'imported',
    dimensions,
    mappingRules: [],
    entries,
    description: `Importiert aus ${file.name} (${valueHeader})`
  });

  toast.success(`${entries.length} Einträge importiert.`);
  await loadTables();
}

async function importFromJson(file: File): Promise<void> {
  const text = await file.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    toast.error('Ungültige JSON-Datei.');
    return;
  }

  // Accept a TableDefinition-like object or an array of entries
  const name: string = data.name ?? file.name.replace(/\.[^.]+$/, '');
  const type: 'simple' | 'complex' = data.type === 'complex' ? 'complex' : 'simple';
  const entries: Sport.TableEntry[] = Array.isArray(data.entries) ? data.entries : [];
  const dimensions: Sport.TableDimension[] = Array.isArray(data.dimensions) ? data.dimensions : [];

  const bridge = getSportBridge();
  await bridge.saveTableDefinitionUseCase.execute({
    name,
    type,
    source: 'imported',
    description: data.description,
    dimensions,
    mappingRules: data.mappingRules ?? [],
    entries
  });

  toast.success(`Tabelle „${name}" importiert.`);
  await loadTables();
}
</script>

<style scoped>
.table-management-view {
  padding: 1rem;
  max-width: 1100px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-header h2 {
  margin: 0.5rem 0;
  font-size: 1.75rem;
  color: #333;
}

.page-description {
  color: #666;
  margin: 0.25rem 0 0;
}

.back-button {
  background: none;
  border: none;
  color: #0066cc;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem 0;
  margin-bottom: 0.5rem;
  touch-action: manipulation;
}

.back-button:hover { text-decoration: underline; }

.toolbar {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.hidden-input {
  display: none;
}

.loading-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #666;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #0066cc;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #666;
}

.empty-hint {
  font-size: 0.875rem;
  color: #999;
}

.table-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.table-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.table-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem 1.25rem;
  gap: 1rem;
}

.table-info {
  flex: 1;
}

.table-name {
  margin: 0 0 0.4rem 0;
  font-size: 1.1rem;
  color: #222;
}

.table-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
  margin-bottom: 0.3rem;
}

.meta-badge {
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
  border-radius: 99px;
  font-weight: 600;
  background: #e0e0e0;
  color: #333;
}

.meta-badge.simple { background: #dbeafe; color: #1e40af; }
.meta-badge.complex { background: #fce7f3; color: #9d174d; }
.meta-badge.source { background: #d1fae5; color: #065f46; }

.meta-text {
  font-size: 0.8rem;
  color: #666;
}

.table-description {
  font-size: 0.85rem;
  color: #888;
  margin: 0.3rem 0 0;
}

.table-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-shrink: 0;
}

.table-preview {
  padding: 1rem 1.25rem;
  border-top: 1px solid #e0e0e0;
  background: #f9f9f9;
}

.preview-empty {
  color: #999;
  font-size: 0.875rem;
  text-align: center;
  padding: 1rem;
}

.preview-scroll {
  overflow-x: auto;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.preview-table th,
.preview-table td {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e0e0e0;
  text-align: left;
}

.preview-table th {
  background: #f0f0f0;
  font-weight: 600;
}

.preview-truncate {
  color: #999;
  font-size: 0.8rem;
  text-align: center;
  margin-top: 0.5rem;
}

/* Buttons */
.btn-primary, .btn-secondary, .btn-text, .btn-danger {
  padding: 0.6rem 1.1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  touch-action: manipulation;
  min-height: 44px;
  white-space: nowrap;
}

.btn-primary { background: #0066cc; color: white; }
.btn-primary:hover { background: #0052a3; }
.btn-primary:disabled { background: #ccc; cursor: not-allowed; }

.btn-secondary { background: #f0f0f0; color: #333; border: 1px solid #ddd; }
.btn-secondary:hover { background: #e0e0e0; }

.btn-text { background: transparent; color: #0066cc; border: 1px solid #0066cc; }
.btn-text:hover { background: #f0f7ff; }

.btn-danger { background: #dc3545; color: white; }
.btn-danger:hover { background: #b02a37; }
.btn-danger:disabled { background: #ccc; cursor: not-allowed; }

.btn-small {
  padding: 0.4rem 0.75rem;
  font-size: 0.8rem;
  min-height: 36px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 12px;
  padding: 0;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-sm { max-width: 360px; }

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 { margin: 0; }

.close-btn {
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  color: #666;
  padding: 0 0.25rem;
}

.modal-content {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.form-input, .form-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  min-height: 44px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.warning-text {
  color: #c0392b;
  font-size: 0.875rem;
}

.error-banner {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 0.65rem 1rem;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

@media (max-width: 600px) {
  .table-card-header {
    flex-direction: column;
  }

  .table-actions {
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>
