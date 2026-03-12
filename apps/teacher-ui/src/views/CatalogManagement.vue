<template>
  <section class="catalog-management">
    <header class="page-header">
      <button class="back-button" @click="$router.back()">← Zurück</button>
      <div>
        <h1>Katalogverwaltung</h1>
        <p class="subtitle">
          Konfigurieren Sie Status- und Kriterienkataloge für alle Bereiche.
        </p>
      </div>
    </header>

    <div v-if="loadError" class="error-banner" role="alert">
      {{ loadError }}
    </div>

    <!-- Context Tabs -->
    <nav class="context-tabs" aria-label="Katalogkontext">
      <button
        v-for="ctx in contexts"
        :key="ctx.value"
        :class="['tab-btn', { active: activeContext === ctx.value }]"
        @click="switchContext(ctx.value)"
      >
        {{ ctx.label }}
      </button>
    </nav>

    <!-- Class Selector -->
    <div class="class-selector-row">
      <label for="class-select" class="form-label">Klasse</label>
      <select
        id="class-select"
        v-model="selectedClassId"
        class="form-select"
        @change="onClassChange"
      >
        <option value="">Klasse wählen…</option>
        <option v-for="cls in classes" :key="cls.id" :value="cls.id">
          {{ cls.name }} ({{ cls.schoolYear }})
        </option>
      </select>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner" aria-hidden="true"></div>
      <p>Katalog wird geladen…</p>
    </div>

    <template v-else-if="selectedClassId && catalog">
      <!-- Status List -->
      <section class="card catalog-card">
        <header class="card-header">
          <h2>
            {{ activeContextLabel }} — Statusoptionen
            <span class="badge-count">{{ catalog.statuses.length }}</span>
          </h2>
          <button class="btn-primary btn-small" @click="openAddModal">
            + Hinzufügen
          </button>
        </header>

        <p v-if="catalog.statuses.length === 0" class="empty-state-text">
          Noch keine Statusoptionen vorhanden.
        </p>

        <ul v-else class="status-list" role="list">
          <li
            v-for="(status, index) in sortedStatuses"
            :key="status.id"
            :class="['status-row', { inactive: !status.active }]"
          >
            <!-- Color swatch + code -->
            <span
              class="status-swatch"
              :style="{ background: status.color || '#94a3b8' }"
              :title="status.color || 'keine Farbe'"
              aria-hidden="true"
            ></span>
            <span class="status-code">{{ status.code }}</span>

            <!-- Name + description -->
            <span class="status-name">
              {{ status.name }}
              <span v-if="status.description" class="status-desc">
                — {{ status.description }}
              </span>
            </span>

            <!-- Active badge -->
            <span :class="['active-badge', status.active ? 'active' : 'inactive']">
              {{ status.active ? 'Aktiv' : 'Inaktiv' }}
            </span>

            <!-- Actions -->
            <div class="row-actions">
              <button
                class="icon-btn"
                title="Nach oben"
                :disabled="index === 0 || saving"
                @click="moveUp(status.id, index)"
                aria-label="Nach oben verschieben"
              >▲</button>
              <button
                class="icon-btn"
                title="Nach unten"
                :disabled="index === sortedStatuses.length - 1 || saving"
                @click="moveDown(status.id, index)"
                aria-label="Nach unten verschieben"
              >▼</button>
              <button
                class="icon-btn"
                :title="status.active ? 'Deaktivieren' : 'Aktivieren'"
                :disabled="saving"
                @click="toggleActive(status)"
                :aria-label="status.active ? 'Deaktivieren' : 'Aktivieren'"
              >{{ status.active ? '🔕' : '🔔' }}</button>
              <button
                class="icon-btn"
                title="Bearbeiten"
                :disabled="saving"
                @click="openEditModal(status)"
                aria-label="Bearbeiten"
              >✏️</button>
            </div>
          </li>
        </ul>
      </section>
    </template>

    <div v-else-if="selectedClassId && !loading" class="empty-state">
      <p>Katalog konnte nicht geladen werden.</p>
    </div>

    <!-- Add / Edit Modal -->
    <div
      v-if="showModal"
      class="modal-overlay"
      @click.self="closeModal"
      role="dialog"
      :aria-label="editingStatus ? 'Status bearbeiten' : 'Status hinzufügen'"
      aria-modal="true"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editingStatus ? 'Status bearbeiten' : 'Status hinzufügen' }}</h3>
          <button class="close-btn" @click="closeModal" aria-label="Schließen">×</button>
        </div>

        <form class="modal-content" @submit.prevent="saveModal">
          <div class="form-group">
            <label for="modal-name">Name *</label>
            <input
              id="modal-name"
              v-model="form.name"
              type="text"
              maxlength="50"
              required
              class="form-input"
              placeholder="z. B. Entschuldigt"
            />
          </div>

          <div class="form-group">
            <label for="modal-code">Kürzel *</label>
            <input
              id="modal-code"
              v-model="form.code"
              type="text"
              maxlength="10"
              required
              class="form-input"
              placeholder="z. B. E"
            />
          </div>

          <div class="form-group">
            <label for="modal-color">Farbe</label>
            <input
              id="modal-color"
              v-model="form.color"
              type="color"
              class="form-color"
            />
          </div>

          <div class="form-group">
            <label for="modal-icon">Symbol / Emoji</label>
            <input
              id="modal-icon"
              v-model="form.icon"
              type="text"
              maxlength="4"
              class="form-input"
              placeholder="z. B. ✓"
            />
          </div>

          <div class="form-group">
            <label for="modal-description">Beschreibung</label>
            <input
              id="modal-description"
              v-model="form.description"
              type="text"
              maxlength="120"
              class="form-input"
              placeholder="Optionale Beschreibung"
            />
          </div>

          <div v-if="modalError" class="error-banner" role="alert">
            {{ modalError }}
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="closeModal">
              Abbrechen
            </button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'Speichern…' : 'Speichern' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { StatusOption, StatusCatalog, ClassGroup } from '@viccoboard/core'
import { getStudentsBridge } from '../composables/useStudentsBridge'
import { getSportBridge } from '../composables/useSportBridge'

// ── Types ────────────────────────────────────────────────────────────────────

type CatalogContext = 'attendance' | 'participation' | 'behavior'

// ── State ────────────────────────────────────────────────────────────────────

const classes = ref<ClassGroup[]>([])
const selectedClassId = ref('')
const catalog = ref<StatusCatalog | null>(null)
const loading = ref(false)
const saving = ref(false)
const loadError = ref('')
const activeContext = ref<CatalogContext>('attendance')

const showModal = ref(false)
const editingStatus = ref<StatusOption | null>(null)
const modalError = ref('')

const form = ref({
  name: '',
  code: '',
  color: '#94a3b8',
  icon: '',
  description: ''
})

// ── Contexts ─────────────────────────────────────────────────────────────────

const contexts: { value: CatalogContext; label: string }[] = [
  { value: 'attendance', label: 'Anwesenheit' },
  { value: 'participation', label: 'Mitarbeit' },
  { value: 'behavior', label: 'Verhalten' }
]

const activeContextLabel = computed(
  () => contexts.find(c => c.value === activeContext.value)?.label ?? ''
)

// ── Derived ──────────────────────────────────────────────────────────────────

const sortedStatuses = computed<StatusOption[]>(() => {
  if (!catalog.value) return []
  return [...catalog.value.statuses].sort((a, b) => a.order - b.order)
})

// ── Bridge access ─────────────────────────────────────────────────────────────

function bridge() {
  return getStudentsBridge()
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

loadClasses()

async function loadClasses() {
  try {
    const sport = getSportBridge()
    const raw = await sport.classGroupRepository.findAll()
    classes.value = raw as ClassGroup[]
  } catch (e: any) {
    loadError.value = `Klassen konnten nicht geladen werden: ${e?.message ?? 'Unbekannter Fehler'}`
  }
}

// ── Handlers ─────────────────────────────────────────────────────────────────

async function onClassChange() {
  await loadCatalog()
}

async function switchContext(ctx: CatalogContext) {
  activeContext.value = ctx
  if (selectedClassId.value) await loadCatalog()
}

async function loadCatalog() {
  if (!selectedClassId.value) return
  loading.value = true
  loadError.value = ''
  try {
    catalog.value = await bridge().statusCatalogRepository.getOrCreateForClassGroup(
      selectedClassId.value,
      activeContext.value
    )
  } catch (e: any) {
    loadError.value = e?.message ?? 'Fehler beim Laden.'
    catalog.value = null
  } finally {
    loading.value = false
  }
}

async function toggleActive(status: StatusOption) {
  if (!catalog.value) return
  saving.value = true
  try {
    await bridge().updateStatusUseCase.execute({
      catalogId: catalog.value.id,
      statusId: status.id,
      active: !status.active
    })
    await loadCatalog()
  } finally {
    saving.value = false
  }
}

async function moveUp(statusId: string, index: number) {
  if (!catalog.value || index === 0) return
  saving.value = true
  try {
    await bridge().reorderStatusUseCase.execute({
      catalogId: catalog.value.id,
      statusId,
      newOrder: index - 1
    })
    await loadCatalog()
  } finally {
    saving.value = false
  }
}

async function moveDown(statusId: string, index: number) {
  if (!catalog.value) return
  saving.value = true
  try {
    await bridge().reorderStatusUseCase.execute({
      catalogId: catalog.value.id,
      statusId,
      newOrder: index + 1
    })
    await loadCatalog()
  } finally {
    saving.value = false
  }
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function openAddModal() {
  editingStatus.value = null
  form.value = { name: '', code: '', color: '#94a3b8', icon: '', description: '' }
  modalError.value = ''
  showModal.value = true
}

function openEditModal(status: StatusOption) {
  editingStatus.value = status
  form.value = {
    name: status.name,
    code: status.code,
    color: status.color ?? '#94a3b8',
    icon: status.icon ?? '',
    description: status.description ?? ''
  }
  modalError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingStatus.value = null
  modalError.value = ''
}

async function saveModal() {
  if (!catalog.value) return
  saving.value = true
  modalError.value = ''
  try {
    if (editingStatus.value) {
      await bridge().updateStatusUseCase.execute({
        catalogId: catalog.value.id,
        statusId: editingStatus.value.id,
        name: form.value.name,
        code: form.value.code,
        color: form.value.color,
        icon: form.value.icon || undefined,
        description: form.value.description || undefined
      })
    } else {
      await bridge().addStatusUseCase.execute({
        catalogId: catalog.value.id,
        name: form.value.name,
        code: form.value.code,
        color: form.value.color,
        icon: form.value.icon || undefined,
        description: form.value.description || undefined
      })
    }
    closeModal()
    await loadCatalog()
  } catch (e: any) {
    modalError.value = e?.message ?? 'Fehler beim Speichern.'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.catalog-management {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.page-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
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
  cursor: pointer;
  color: #0f766e;
  font-weight: 600;
  padding: 0;
  white-space: nowrap;
}

/* Context tabs */
.context-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 0.4rem 1rem;
  border: 1px solid rgba(15, 23, 42, 0.15);
  border-radius: 99px;
  background: white;
  cursor: pointer;
  font-size: 0.875rem;
  color: #475569;
  transition: background 0.15s, color 0.15s;
}

.tab-btn.active {
  background: #0f766e;
  color: white;
  border-color: #0f766e;
}

/* Class selector */
.class-selector-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.form-label {
  font-weight: 600;
  font-size: 0.875rem;
  white-space: nowrap;
}

.form-select {
  flex: 1;
  max-width: 320px;
  padding: 0.4rem 0.75rem;
  border: 1px solid rgba(15, 23, 42, 0.2);
  border-radius: 8px;
  font-size: 0.9rem;
}

/* Card */
.card {
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  padding: 1.25rem;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.card-header h2 {
  margin: 0;
  font-size: 1rem;
}

.badge-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 1.5rem;
  border-radius: 99px;
  background: #f1f5f9;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 700;
  margin-left: 0.5rem;
  padding: 0 0.35rem;
}

/* Status list */
.status-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.5rem 0.75rem;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.07);
  transition: opacity 0.15s;
}

.status-row.inactive {
  opacity: 0.45;
}

.status-swatch {
  width: 1rem;
  height: 1rem;
  border-radius: 4px;
  flex-shrink: 0;
}

.status-code {
  font-weight: 700;
  font-size: 0.8rem;
  min-width: 2.5rem;
  text-align: center;
  background: #f1f5f9;
  border-radius: 4px;
  padding: 0.1rem 0.4rem;
  letter-spacing: 0.04em;
}

.status-name {
  flex: 1;
  font-size: 0.9rem;
}

.status-desc {
  color: #94a3b8;
  font-size: 0.8rem;
}

.active-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 99px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.active-badge.active {
  background: #d1fae5;
  color: #065f46;
}

.active-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.row-actions {
  display: flex;
  gap: 0.25rem;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.2rem 0.35rem;
  border-radius: 6px;
  font-size: 0.85rem;
  line-height: 1;
  transition: background 0.1s;
}

.icon-btn:hover:not(:disabled) {
  background: #f1f5f9;
}

.icon-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Buttons */
.btn-primary {
  background: #0f766e;
  color: white;
  border: none;
  padding: 0.5rem 1.1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid rgba(15, 23, 42, 0.15);
  padding: 0.5rem 1.1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
}

.btn-small {
  padding: 0.3rem 0.75rem;
  font-size: 0.8rem;
}

/* Loading / empty */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
  color: #64748b;
}

.spinner {
  width: 1.5rem;
  height: 1.5rem;
  border: 2px solid #e2e8f0;
  border-top-color: #0f766e;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state,
.empty-state-text {
  text-align: center;
  color: #94a3b8;
  padding: 1.5rem;
}

.error-banner {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 0.65rem 1rem;
  font-size: 0.875rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.modal-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  color: #64748b;
  padding: 0 0.25rem;
}

.modal-content {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.form-input {
  padding: 0.45rem 0.75rem;
  border: 1px solid rgba(15, 23, 42, 0.2);
  border-radius: 8px;
  font-size: 0.9rem;
}

.form-color {
  width: 4rem;
  height: 2.25rem;
  padding: 0.15rem;
  border: 1px solid rgba(15, 23, 42, 0.2);
  border-radius: 8px;
  cursor: pointer;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}
</style>
