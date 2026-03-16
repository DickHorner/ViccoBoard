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

<style scoped src="./CatalogManagement.css"></style>
