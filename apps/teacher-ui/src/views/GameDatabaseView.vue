<template>
  <section class="game-database sport-ui">
    <header class="page-header">
      <div>
        <h1>{{ t('UEBUNGEN.spieldatenbank') }}</h1>
        <p class="subtitle">{{ t('UEBUNGEN.spiele') }}</p>
      </div>
      <div class="page-header__actions">
        <span class="summary-pill">{{ t('UEBUNGEN.spiele-anzahl', { count: filteredEntries.length }) }}</span>
        <Button :label="t('UEBUNGEN.uebung-hinzu')" icon="pi pi-plus" @click="openAddModal" />
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
      <InputText
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
        <Select inputId="phase-select" v-model="selectedPhase" :options="phaseFilterOptions" optionLabel="label" optionValue="value" class="filter-select" />
      </div>

      <div class="filter-group">
        <label class="filter-label" for="difficulty-select">{{ t('UEBUNGEN.schwierigkeit') }}</label>
        <Select inputId="difficulty-select" v-model="selectedDifficulty" :options="difficultyFilterOptions" optionLabel="label" optionValue="value" class="filter-select" />
      </div>

      <div class="filter-group">
        <label class="filter-label" for="sort-select">{{ t('UEBUNGEN.sortieren-nach') }}</label>
        <Select inputId="sort-select" v-model="sortBy" :options="sortOptions" optionLabel="label" optionValue="value" class="filter-select" />
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
    <Dialog :visible="showModal" modal :closable="!saving"
      :header="editingEntry ? t('UEBUNGEN.formular-bearbeiten') : t('UEBUNGEN.formular-neu')"
      :style="{ width: '48rem', maxWidth: 'calc(100vw - 2rem)' }"
      @update:visible="visible => { if (!visible && !saving) closeModal() }">

        <form class="modal-content" @submit.prevent="saveModal">
          <div class="form-grid">
            <div class="form-group form-group--wide">
              <label for="game-name">{{ t('UEBUNGEN.name') }} *</label>
              <InputText id="game-name" v-model="form.name" maxlength="120" required fluid />
            </div>

            <div class="form-group form-group--wide">
              <label for="game-tags">{{ t('UEBUNGEN.schlagworte') }}</label>
              <InputText
                id="game-tags"
                v-model="form.tagsText"
                type="text"
                :placeholder="t('UEBUNGEN.schlagworte-hinweis')"
              />
            </div>

            <div class="form-group">
              <label for="game-phase">{{ t('UEBUNGEN.phase') }}</label>
              <Select inputId="game-phase" v-model="form.phase" :options="phaseOptions" optionLabel="label" optionValue="value" fluid />
            </div>

            <div class="form-group">
              <label for="game-difficulty">{{ t('UEBUNGEN.schwierigkeit') }}</label>
              <Select inputId="game-difficulty" v-model="form.difficulty" :options="difficultyOptions" optionLabel="label" optionValue="value" fluid />
            </div>

            <div class="form-group">
              <label for="game-duration">{{ t('UEBUNGEN.dauer') }}</label>
              <input id="game-duration" v-model.number="form.duration" type="number" min="0" step="1" />
            </div>

            <div class="form-group">
              <label for="game-age-group">{{ t('UEBUNGEN.altersgruppe') }}</label>
              <InputText id="game-age-group" v-model="form.ageGroup" maxlength="160" fluid />
            </div>

            <div class="form-group">
              <label for="game-material">{{ t('UEBUNGEN.material') }}</label>
              <InputText id="game-material" v-model="form.material" maxlength="240" fluid />
            </div>

            <div class="form-group form-group--wide">
              <label for="game-goal">{{ t('UEBUNGEN.ziele') }}</label>
              <Textarea id="game-goal" v-model="form.goal" rows="2" fluid />
            </div>

            <div class="form-group form-group--wide">
              <label for="game-description">{{ t('UEBUNGEN.detail-beschreibung') }}</label>
              <Textarea id="game-description" v-model="form.description" rows="5" fluid />
            </div>

            <div class="form-group form-group--wide">
              <label for="game-variation">{{ t('UEBUNGEN.detail-variation') }}</label>
              <Textarea id="game-variation" v-model="form.variation" rows="3" fluid />
            </div>

            <div class="form-group form-group--wide">
              <label for="game-notes">{{ t('UEBUNGEN.detail-hinweise') }}</label>
              <Textarea id="game-notes" v-model="form.notes" rows="3" fluid />
            </div>

            <div class="form-group form-group--wide">
              <label for="game-video-url">{{ t('UEBUNGEN.video-url') }}</label>
              <InputText
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
            <Button v-if="editingEntry?.isCustom" severity="danger" outlined
              type="button" :disabled="saving" :label="t('UEBUNGEN.loeschen')" @click="deleteEditingEntry" />
            <Button severity="secondary" type="button" :disabled="saving" :label="t('UEBUNGEN.abbrechen')" @click="closeModal" />
            <Button type="submit" :loading="saving" :disabled="saving"
              :label="saving ? t('UEBUNGEN.speichern-laeuft') : t('UEBUNGEN.speichern')" />
          </div>
        </form>
    </Dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Button from 'openvue/button'
import Dialog from 'openvue/dialog'
import InputText from 'openvue/inputtext'
import Select from 'openvue/select'
import Textarea from 'openvue/textarea'
import { useI18n } from 'vue-i18n'
import type { Sport } from '@viccoboard/core'
import { getSportBridge } from '../composables/useSportBridge'
import { GAME_SEED_DATA } from '../data/game-seed-data'
import { canBackfillBuiltInVideo, CURATED_GAME_VIDEO_URLS } from '../data/curated-game-videos'
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
const phaseOptions = computed(() => [
  { label: t('UEBUNGEN.phase-erwaermung'), value: 'erwaermung' },
  { label: t('UEBUNGEN.phase-hauptteil'), value: 'hauptteil' },
  { label: t('UEBUNGEN.phase-schluss'), value: 'schluss' }
])
const phaseFilterOptions = computed(() => [
  { label: t('UEBUNGEN.alle'), value: '' },
  ...phaseOptions.value
])
const difficultyOptions = computed(() => [
  { label: t('UEBUNGEN.schwierigkeit-unbekannt'), value: 'unbekannt' },
  { label: t('UEBUNGEN.schwierigkeit-anfaenger'), value: 'anfaenger' },
  { label: t('UEBUNGEN.schwierigkeit-fortgeschrittene'), value: 'fortgeschrittene' },
  { label: t('UEBUNGEN.schwierigkeit-profis'), value: 'profis' }
])
const difficultyFilterOptions = computed(() => [
  { label: t('UEBUNGEN.alle'), value: '' },
  ...difficultyOptions.value
])
const sortOptions = computed(() => [
  { label: t('UEBUNGEN.sortierung-name'), value: 'name' },
  { label: t('UEBUNGEN.sortierung-dauer'), value: 'duration' },
  { label: t('UEBUNGEN.sortierung-schwierigkeit'), value: 'difficulty' }
])

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
  const videoBackfills = existingEntries.filter((entry) =>
    entry.builtinKey &&
    CURATED_GAME_VIDEO_URLS[entry.builtinKey] &&
    canBackfillBuiltInVideo(entry)
  )
  if (missingSeeds.length === 0 && videoBackfills.length === 0) return

  initializing.value = true
  try {
    for (const entry of videoBackfills) {
      await bridge.gameEntryRepository.update(entry.id, {
        videoUrl: CURATED_GAME_VIDEO_URLS[entry.builtinKey!]
      })
    }

    for (const seed of missingSeeds) {
      const legacyMatches = legacyByName.get(seed.name)
      const legacyEntry = legacyMatches?.shift()
      const videoUrl = seed.videoUrl ?? CURATED_GAME_VIDEO_URLS[seed.builtinKey]

      if (legacyEntry) {
        await bridge.gameEntryRepository.update(legacyEntry.id, {
          builtinKey: seed.builtinKey,
          ...(videoUrl && canBackfillBuiltInVideo(legacyEntry) ? { videoUrl } : {})
        })
      } else {
        await bridge.gameEntryRepository.create({
          ...seed,
          videoUrl,
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
