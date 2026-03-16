<template>
  <div class="table-management-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← Zurück</button>
      <h2>Tabellenverwaltung</h2>
      <p class="page-description">Verwalten Sie Bewertungstabellen für den Sportunterricht.</p>
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

    <div v-if="loading" class="loading-state">
      <div class="spinner" aria-hidden="true"></div>
      <p>Tabellen werden geladen…</p>
    </div>

    <template v-else>
      <div v-if="tables.length === 0" class="empty-state">
        <p>Noch keine Bewertungstabellen vorhanden.</p>
        <p class="empty-hint">Erstellen Sie eine neue Tabelle oder importieren Sie eine CSV-Datei.</p>
      </div>

      <div v-else class="table-list">
        <div v-for="table in tables" :key="table.id" :class="['table-card', { expanded: previewId === table.id }]">
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
              <button class="btn-secondary btn-small" :aria-expanded="previewId === table.id" @click="togglePreview(table.id)">
                {{ previewId === table.id ? 'Vorschau schließen' : 'Vorschau' }}
              </button>
              <button class="btn-text btn-small" @click="openEditModal(table)">✏️ Bearbeiten</button>
              <button class="btn-danger btn-small" :disabled="deleting === table.id" @click="confirmDelete(table)">
                {{ deleting === table.id ? '…' : '🗑 Löschen' }}
              </button>
            </div>
          </div>

          <div v-if="previewId === table.id" class="table-preview">
            <div v-if="table.entries.length === 0" class="preview-empty">Keine Einträge vorhanden.</div>
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
                    <td v-for="dim in table.dimensions" :key="dim.name">{{ entry.key[dim.name] ?? '—' }}</td>
                    <td>{{ formatEntryValue(entry.value) }}</td>
                  </tr>
                </tbody>
              </table>
              <p v-if="table.entries.length > 20" class="preview-truncate">… und {{ table.entries.length - 20 }} weitere Einträge</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div
      v-if="showModal"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      :aria-label="editingTable ? 'Tabelle bearbeiten' : 'Neue Tabelle'"
      @click.self="closeModal"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editingTable ? 'Tabelle bearbeiten' : 'Neue Tabelle' }}</h3>
          <button class="close-btn" aria-label="Schließen" @click="closeModal">×</button>
        </div>

        <form class="modal-content" @submit.prevent="saveModal">
          <div class="form-group">
            <label for="modal-name">Name *</label>
            <input id="modal-name" v-model="form.name" type="text" maxlength="80" required class="form-input" placeholder="z. B. Cooper-Tabelle Klasse 9" />
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
            <input id="modal-description" v-model="form.description" type="text" maxlength="200" class="form-input" placeholder="Optionale Beschreibung" />
          </div>

          <div v-if="modalError" class="error-banner" role="alert">{{ modalError }}</div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="closeModal">Abbrechen</button>
            <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Speichern…' : 'Speichern' }}</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="deleteTarget" class="modal-overlay" role="dialog" aria-modal="true" aria-label="Tabelle löschen" @click.self="deleteTarget = null">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h3>Tabelle löschen?</h3>
          <button class="close-btn" aria-label="Abbrechen" @click="deleteTarget = null">×</button>
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
import { useTableManagementView } from '../composables/useTableManagementView'

const {
  closeModal,
  confirmDelete,
  deleteTarget,
  deleting,
  editingTable,
  executeDelete,
  fileInputRef,
  formatDate,
  formatEntryValue,
  form,
  handleFileImport,
  loadError,
  loading,
  modalError,
  openCreateModal,
  openEditModal,
  previewId,
  saveModal,
  saving,
  showModal,
  sourceLabel,
  tables,
  togglePreview,
  triggerImport,
  typeLabel
} = useTableManagementView()

void fileInputRef
</script>

<style scoped src="./TableManagement.css"></style>
