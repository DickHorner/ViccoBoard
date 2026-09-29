<template>
  <section class="game-database">
    <header class="page-header">
      <div>
        <h1>{{ t('UEBUNGEN.spieldatenbank') }}</h1>
        <p class="subtitle">{{ t('UEBUNGEN.spiele') }}</p>
      </div>
      <div class="page-header__actions">
        <span class="summary-pill">{{ t('UEBUNGEN.spiele-anzahl', { count: filteredEntries.length }) }}</span>
        <button class="add-button" type="button" @click="openAddModal">
          + {{ t('UEBUNGEN.uebung-hinzu') }}
        </button>
      </div>
    </header>

    <div v-if="loadError" class="error-banner" role="alert">
      {{ t('UEBUNGEN.laden-fehler') }}
    </div>

    <div v-if="initializing" class="loading-hint">
      {{ t('UEBUNGEN.daten-initialisierung') }}
    </div>

    <!-- Search -->
    <div class="search-row">
      <input
        v-model="searchQuery"
        type="search"
        class="search-input"
        :placeholder="t('UEBUNGEN.spiel-suche')"
        :aria-label="t('UEBUNGEN.spiel-suche')"
      />
    </div>

    <!-- Tag filter chips -->
    <div class="filter-chips" role="group" :aria-label="t('UEBUNGEN.schlagworte')">
      <button
        class="chip"
        :class="{ 'chip--active': selectedTag === null }"
        type="button"
        @click="selectedTag = null"
      >
        {{ t('UEBUNGEN.alle-schlagworte') }}
      </button>
      <button
        v-for="tag in availableTags"
        :key="tag"
        class="chip"
        :class="{ 'chip--active': selectedTag === tag }"
        type="button"
        @click="selectedTag = tag"
      >
        {{ tag }}
      </button>
    </div>

    <!-- Sort / phase filter bar -->
    <div class="filter-bar">
      <div class="filter-group">
        <label class="filter-label" for="phase-select">{{ t('UEBUNGEN.phase') }}</label>
        <select id="phase-select" v-model="selectedPhase" class="filter-select">
          <option value="">{{ t('UEBUNGEN.alle') }}</option>
          <option value="erwaermung">{{ t('UEBUNGEN.phase-erwaermung') }}</option>
          <option value="hauptteil">{{ t('UEBUNGEN.phase-hauptteil') }}</option>
          <option value="schluss">{{ t('UEBUNGEN.phase-schluss') }}</option>
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-label" for="difficulty-select">{{ t('UEBUNGEN.schwierigkeit') }}</label>
        <select id="difficulty-select" v-model="selectedDifficulty" class="filter-select">
          <option value="">{{ t('UEBUNGEN.alle') }}</option>
          <option value="unbekannt">{{ t('UEBUNGEN.schwierigkeit-unbekannt') }}</option>
          <option value="anfaenger">{{ t('UEBUNGEN.schwierigkeit-anfaenger') }}</option>
          <option value="fortgeschrittene">{{ t('UEBUNGEN.schwierigkeit-fortgeschrittene') }}</option>
          <option value="profis">{{ t('UEBUNGEN.schwierigkeit-profis') }}</option>
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-label" for="sort-select">{{ t('UEBUNGEN.sortieren-nach') }}</label>
        <select id="sort-select" v-model="sortBy" class="filter-select">
          <option value="name">{{ t('UEBUNGEN.sortierung-name') }}</option>
          <option value="duration">{{ t('UEBUNGEN.sortierung-dauer') }}</option>
          <option value="difficulty">{{ t('UEBUNGEN.sortierung-schwierigkeit') }}</option>
        </select>
      </div>
    </div>

    <!-- No results -->
    <div v-if="!initializing && !loadError && filteredEntries.length === 0" class="empty-state">
      <p>{{ t('UEBUNGEN.kein-ergebnis') }}</p>
      <p class="empty-hint">{{ t('UEBUNGEN.kein-ergebnis-hint') }}</p>
    </div>

    <!-- Card grid -->
    <div v-else class="cards-grid">
      <article
        v-for="entry in filteredEntries"
        :key="entry.id"
        class="game-card"
        tabindex="0"
        role="button"
        :aria-expanded="expandedId === entry.id"
        @click="toggleExpand(entry.id)"
        @keydown.enter.prevent="toggleExpand(entry.id)"
        @keydown.space.prevent="toggleExpand(entry.id)"
      >
        <div class="game-card__header">
          <div class="game-card__meta">
            <div class="game-card__badges">
              <span v-for="tag in entry.tags" :key="tag" class="badge badge--tag">{{ tag }}</span>
              <span class="badge badge--difficulty" :class="`badge--${entry.difficulty}`">
                {{ difficultyLabel(entry.difficulty) }}
              </span>
            </div>
            <button
              class="edit-button"
              type="button"
              :aria-label="t('UEBUNGEN.bearbeiten')"
              @click.stop="openEditModal(entry)"
            >
              ✏️ {{ t('UEBUNGEN.bearbeiten') }}
            </button>
          </div>
          <h2 class="game-card__title">{{ entry.name }}</h2>
          <div class="game-card__info-row">
            <span v-if="entry.duration > 0" class="info-chip">⏱ {{ entry.duration }} {{ t('UEBUNGEN.min') }}</span>
            <span v-if="entry.ageGroup" class="info-chip">👥 {{ entry.ageGroup }}</span>
            <span v-if="entry.material" class="info-chip">🎒 {{ entry.material }}</span>
          </div>
        </div>

        <p class="game-card__goal">{{ entry.goal }}</p>

        <!-- Expanded detail -->
        <transition name="expand">
          <div v-if="expandedId === entry.id" class="game-card__detail">
            <div class="detail-section">
              <span class="detail-label">{{ t('UEBUNGEN.detail-beschreibung') }}</span>
              <p class="detail-text">{{ entry.description }}</p>
            </div>
            <div v-if="entry.variation" class="detail-section">
              <span class="detail-label">{{ t('UEBUNGEN.detail-variation') }}</span>
              <p class="detail-text">{{ entry.variation }}</p>
            </div>
            <div v-if="entry.notes" class="detail-section">
              <span class="detail-label">{{ t('UEBUNGEN.detail-hinweise') }}</span>
              <p class="detail-text">{{ entry.notes }}</p>
            </div>
            <div v-if="safeVideoUrl(entry.videoUrl)" class="detail-section">
              <span class="detail-label">{{ t('UEBUNGEN.video') }}</span>
              <a
                class="video-link"
                :href="safeVideoUrl(entry.videoUrl) ?? undefined"
                target="_blank"
                rel="noopener noreferrer"
                @click.stop
              >
                ▶ {{ t('UEBUNGEN.video-oeffnen') }}
              </a>
            </div>
          </div>
        </transition>

        <button
          class="game-card__toggle"
          type="button"
          :aria-label="expandedId === entry.id ? 'Details einklappen' : 'Details anzeigen'"
        >
          {{ expandedId === entry.id ? '▲' : '▼' }}
        </button>
      </article>
    </div>

    <!-- Add / Edit Modal -->
    <div
      v-if="showModal"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      :aria-label="editingEntry ? t('UEBUNGEN.formular-bearbeiten') : t('UEBUNGEN.formular-neu')"
      @click.self="closeModal"
    >
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingEntry ? t('UEBUNGEN.formular-bearbeiten') : t('UEBUNGEN.formular-neu') }}</h2>
          <button class="close-button" type="button" :aria-label="t('UEBUNGEN.abbrechen')" @click="closeModal">×</button>
        </div>

        <form class="modal-content" @submit.prevent="saveModal">
          <div class="form-grid">
            <div class="form-group form-group--wide">
              <label for="game-name">{{ t('UEBUNGEN.name') }} *</label>
              <input id="game-name" v-model="form.name" type="text" maxlength="120" required />
            </div>

            <div class="form-group form-group--wide">
              <label for="game-tags">{{ t('UEBUNGEN.schlagworte') }}</label>
              <input
                id="game-tags"
                v-model="form.tagsText"
                type="text"
                :placeholder="t('UEBUNGEN.schlagworte-hinweis')"
              />
            </div>

            <div class="form-group">
              <label for="game-phase">{{ t('UEBUNGEN.phase') }}</label>
              <select id="game-phase" v-model="form.phase">
                <option value="erwaermung">{{ t('UEBUNGEN.phase-erwaermung') }}</option>
                <option value="hauptteil">{{ t('UEBUNGEN.phase-hauptteil') }}</option>
                <option value="schluss">{{ t('UEBUNGEN.phase-schluss') }}</option>
              </select>
            </div>

            <div class="form-group">
              <label for="game-difficulty">{{ t('UEBUNGEN.schwierigkeit') }}</label>
              <select id="game-difficulty" v-model="form.difficulty">
                <option value="unbekannt">{{ t('UEBUNGEN.schwierigkeit-unbekannt') }}</option>
                <option value="anfaenger">{{ t('UEBUNGEN.schwierigkeit-anfaenger') }}</option>
                <option value="fortgeschrittene">{{ t('UEBUNGEN.schwierigkeit-fortgeschrittene') }}</option>
                <option value="profis">{{ t('UEBUNGEN.schwierigkeit-profis') }}</option>
              </select>
            </div>

            <div class="form-group">
              <label for="game-duration">{{ t('UEBUNGEN.dauer') }}</label>
              <input id="game-duration" v-model.number="form.duration" type="number" min="0" step="1" />
            </div>

            <div class="form-group">
              <label for="game-age-group">{{ t('UEBUNGEN.altersgruppe') }}</label>
              <input id="game-age-group" v-model="form.ageGroup" type="text" maxlength="160" />
            </div>

            <div class="form-group">
              <label for="game-material">{{ t('UEBUNGEN.material') }}</label>
              <input id="game-material" v-model="form.material" type="text" maxlength="240" />
            </div>

            <div class="form-group form-group--wide">
              <label for="game-goal">{{ t('UEBUNGEN.ziele') }}</label>
              <textarea id="game-goal" v-model="form.goal" rows="2"></textarea>
            </div>

            <div class="form-group form-group--wide">
              <label for="game-description">{{ t('UEBUNGEN.detail-beschreibung') }}</label>
              <textarea id="game-description" v-model="form.description" rows="5"></textarea>
            </div>

            <div class="form-group form-group--wide">
              <label for="game-variation">{{ t('UEBUNGEN.detail-variation') }}</label>
              <textarea id="game-variation" v-model="form.variation" rows="3"></textarea>
            </div>

            <div class="form-group form-group--wide">
              <label for="game-notes">{{ t('UEBUNGEN.detail-hinweise') }}</label>
              <textarea id="game-notes" v-model="form.notes" rows="3"></textarea>
            </div>

            <div class="form-group form-group--wide">
              <label for="game-video-url">{{ t('UEBUNGEN.video-url') }}</label>
              <input
                id="game-video-url"
                v-model="form.videoUrl"
                type="url"
                inputmode="url"
                placeholder="https://…"
              />
            </div>
          </div>

          <div v-if="modalError" class="error-banner" role="alert">
            {{ modalError }}
          </div>

          <div class="modal-footer">
            <button
              v-if="editingEntry?.isCustom"
              class="cancel-button"
              type="button"
              :disabled="saving"
              @click="deleteEditingEntry"
            >
              {{ t('UEBUNGEN.loeschen') }}
            </button>
            <button class="cancel-button" type="button" :disabled="saving" @click="closeModal">
              {{ t('UEBUNGEN.abbrechen') }}
            </button>
            <button class="save-button" type="submit" :disabled="saving">
              {{ saving ? t('UEBUNGEN.speichern-laeuft') : t('UEBUNGEN.speichern') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Sport } from '@viccoboard/core'
import { getSportBridge } from '../composables/useSportBridge'
import { GAME_SEED_DATA } from '../data/game-seed-data'
import { METHODENFUNDGRUBE_SEED_DATA } from '../data/methodenfundgrube-seed-data'

const { t } = useI18n()
const bridge = getSportBridge()

const allEntries = ref<Sport.GameEntry[]>([])
const loadError = ref<string | null>(null)
const initializing = ref(false)
const expandedId = ref<string | null>(null)
const showModal = ref(false)
const editingEntry = ref<Sport.GameEntry | null>(null)
const modalError = ref('')
const saving = ref(false)

const searchQuery = ref('')
const selectedTag = ref<string | null>(null)
const selectedPhase = ref<Sport.GamePhase | ''>('')
const selectedDifficulty = ref<Sport.GameDifficulty | ''>('')
const sortBy = ref<'name' | 'duration' | 'difficulty'>('name')

interface GameForm {
  name: string
  tagsText: string
  phase: Sport.GamePhase
  difficulty: Sport.GameDifficulty
  duration: number
  ageGroup: string
  material: string
  goal: string
  description: string
  variation: string
  notes: string
  videoUrl: string
}

function emptyGameForm(): GameForm {
  return {
    name: '',
    tagsText: '',
    phase: 'hauptteil',
    difficulty: 'unbekannt',
    duration: 0,
    ageGroup: '',
    material: '',
    goal: '',
    description: '',
    variation: '',
    notes: '',
    videoUrl: ''
  }
}

const form = ref<GameForm>(emptyGameForm())

const CORE_BUILT_IN_GAME_SEED_DATA = GAME_SEED_DATA.map((seed) => ({
  ...seed,
  builtinKey: `core:${seed.name}`
}))
const METHODENFUNDGRUBE_BUILT_IN_GAME_SEED_DATA = METHODENFUNDGRUBE_SEED_DATA.map((seed) => {
  const sourcePage = seed.notes?.match(/S\. (\d+)\./)?.[1]
  return {
    ...seed,
    builtinKey: sourcePage ? `methodenfundgrube:p${sourcePage}` : `methodenfundgrube:${seed.name}`
  }
})
const BUILT_IN_GAME_SEED_DATA = [
  ...CORE_BUILT_IN_GAME_SEED_DATA,
  ...METHODENFUNDGRUBE_BUILT_IN_GAME_SEED_DATA
]
const DIFFICULTY_ORDER: Sport.GameDifficulty[] = ['anfaenger', 'fortgeschrittene', 'profis', 'unbekannt']

const availableTags = computed(() =>
  Array.from(new Set(allEntries.value.flatMap((entry) => entry.tags))).sort((a, b) => a.localeCompare(b))
)

function parseTags(value: string): string[] {
  const tags: string[] = []
  const seen = new Set<string>()

  for (const part of value.split(',')) {
    const tag = part.trim()
    const normalized = tag.toLowerCase()
    if (!tag || seen.has(normalized)) continue
    seen.add(normalized)
    tags.push(tag)
  }

  return tags
}

function difficultyLabel(d: Sport.GameDifficulty): string {
  const map: Record<Sport.GameDifficulty, string> = {
    unbekannt: t('UEBUNGEN.schwierigkeit-unbekannt'),
    anfaenger: t('UEBUNGEN.schwierigkeit-anfaenger'),
    fortgeschrittene: t('UEBUNGEN.schwierigkeit-fortgeschrittene'),
    profis: t('UEBUNGEN.schwierigkeit-profis')
  }
  return map[d] ?? d
}

function safeVideoUrl(value?: string): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    return parsed.toString()
  } catch {
    return null
  }
}

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

const filteredEntries = computed<Sport.GameEntry[]>(() => {
  const q = searchQuery.value.toLowerCase().trim()

  let result = allEntries.value.filter((e) => {
    if (selectedTag.value && !e.tags.includes(selectedTag.value)) return false
    if (selectedPhase.value && e.phase !== selectedPhase.value) return false
    if (selectedDifficulty.value && e.difficulty !== selectedDifficulty.value) return false
    if (q) {
      const haystack = `${e.name} ${e.goal} ${e.description} ${e.tags.join(' ')}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })

  result = [...result].sort((a, b) => {
    if (sortBy.value === 'name') return a.name.localeCompare(b.name)
    if (sortBy.value === 'duration') {
      const durationA = a.duration > 0 ? a.duration : Number.POSITIVE_INFINITY
      const durationB = b.duration > 0 ? b.duration : Number.POSITIVE_INFINITY
      return durationA - durationB
    }
    if (sortBy.value === 'difficulty') {
      return DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty)
    }
    return 0
  })

  return result
})

async function seedBuiltIns(): Promise<void> {
  const existingEntries = await bridge.gameEntryRepository.findAll()
  const existingKeys = new Set(
    existingEntries.flatMap((entry) => entry.builtinKey ? [entry.builtinKey] : [])
  )
  const legacyByName = new Map<string, Sport.GameEntry[]>()

  for (const entry of existingEntries) {
    if (entry.isCustom || entry.builtinKey) continue
    const matches = legacyByName.get(entry.name) ?? []
    matches.push(entry)
    legacyByName.set(entry.name, matches)
  }

  const missingSeeds = BUILT_IN_GAME_SEED_DATA.filter((seed) => !existingKeys.has(seed.builtinKey))
  if (missingSeeds.length === 0) return

  initializing.value = true
  try {
    for (const seed of missingSeeds) {
      const legacyMatches = legacyByName.get(seed.name)
      const legacyEntry = legacyMatches?.shift()

      if (legacyEntry) {
        await bridge.gameEntryRepository.update(legacyEntry.id, { builtinKey: seed.builtinKey })
      } else {
        await bridge.gameEntryRepository.create({
          ...seed,
          isCustom: false
        })
      }

      existingKeys.add(seed.builtinKey)
    }
  } finally {
    initializing.value = false
  }
}

function openAddModal(): void {
  editingEntry.value = null
  form.value = emptyGameForm()
  modalError.value = ''
  showModal.value = true
}

function openEditModal(entry: Sport.GameEntry): void {
  editingEntry.value = entry
  form.value = {
    name: entry.name,
    tagsText: entry.tags.join(', '),
    phase: entry.phase,
    difficulty: entry.difficulty,
    duration: entry.duration,
    ageGroup: entry.ageGroup,
    material: entry.material ?? '',
    goal: entry.goal,
    description: entry.description,
    variation: entry.variation ?? '',
    notes: entry.notes ?? '',
    videoUrl: entry.videoUrl ?? ''
  }
  modalError.value = ''
  showModal.value = true
}

function closeModal(): void {
  showModal.value = false
  editingEntry.value = null
  modalError.value = ''
}

async function deleteEditingEntry(): Promise<void> {
  const entry = editingEntry.value
  if (!entry?.isCustom) return

  const confirmed = window.confirm(
    t('UEBUNGEN.loeschen-bestaetigen', { name: entry.name })
  )
  if (!confirmed) return

  saving.value = true
  modalError.value = ''
  try {
    await bridge.gameEntryRepository.delete(entry.id)
    allEntries.value = await bridge.gameEntryRepository.findAll()
    if (expandedId.value === entry.id) expandedId.value = null
    closeModal()
  } catch (err) {
    modalError.value = err instanceof Error ? err.message : t('UEBUNGEN.loeschen-fehler')
  } finally {
    saving.value = false
  }
}

async function saveModal(): Promise<void> {
  const name = form.value.name.trim()
  if (!name) {
    modalError.value = t('UEBUNGEN.name-erforderlich')
    return
  }

  const videoInput = form.value.videoUrl.trim()
  const videoUrl = safeVideoUrl(videoInput)
  if (videoInput && !videoUrl) {
    modalError.value = t('UEBUNGEN.video-ungueltig')
    return
  }

  const input = {
    name,
    tags: parseTags(form.value.tagsText),
    phase: form.value.phase,
    difficulty: form.value.difficulty,
    duration: Math.max(0, Number(form.value.duration) || 0),
    ageGroup: form.value.ageGroup.trim(),
    material: form.value.material.trim() || undefined,
    goal: form.value.goal.trim(),
    description: form.value.description.trim(),
    variation: form.value.variation.trim() || undefined,
    notes: form.value.notes.trim() || undefined,
    videoUrl: videoUrl ?? undefined
  }

  saving.value = true
  modalError.value = ''
  try {
    if (editingEntry.value) {
      await bridge.gameEntryRepository.update(editingEntry.value.id, input)
    } else {
      await bridge.gameEntryRepository.create({
        ...input,
        isCustom: true
      })
    }

    closeModal()
    allEntries.value = await bridge.gameEntryRepository.findAll()
  } catch (err) {
    modalError.value = err instanceof Error ? err.message : t('UEBUNGEN.speichern-fehler')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    await seedBuiltIns()
    allEntries.value = await bridge.gameEntryRepository.findAll()
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : 'Unknown error'
  }
})
</script>

<style scoped src="./GameDatabaseView.css"></style>
