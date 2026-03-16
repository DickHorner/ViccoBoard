<template>
  <section class="game-database">
    <header class="page-header">
      <div>
        <h1>{{ t('UEBUNGEN.spieldatenbank') }}</h1>
        <p class="subtitle">{{ t('UEBUNGEN.spiele') }}</p>
      </div>
      <span class="summary-pill">{{ t('UEBUNGEN.spiele-anzahl', { count: filteredEntries.length }) }}</span>
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

    <!-- Category filter chips -->
    <div class="filter-chips" role="group" :aria-label="t('UEBUNGEN.kategorie')">
      <button
        v-for="cat in CATEGORIES"
        :key="cat.value ?? 'all'"
        class="chip"
        :class="{ 'chip--active': selectedCategory === cat.value }"
        type="button"
        @click="selectedCategory = cat.value"
      >
        {{ cat.label }}
      </button>
    </div>

    <!-- Sort / phase filter bar -->
    <div class="filter-bar">
      <div class="filter-group">
        <label class="filter-label" for="phase-select">{{ t('UEBUNGEN.phase') }}</label>
        <select id="phase-select" v-model="selectedPhase" class="filter-select">
          <option value="">{{ t('UEBUNGEN.alle-kategorien') }}</option>
          <option value="erwaermung">{{ t('UEBUNGEN.phase-erwaermung') }}</option>
          <option value="hauptteil">{{ t('UEBUNGEN.phase-hauptteil') }}</option>
          <option value="schluss">{{ t('UEBUNGEN.phase-schluss') }}</option>
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-label" for="difficulty-select">{{ t('UEBUNGEN.schwierigkeit') }}</label>
        <select id="difficulty-select" v-model="selectedDifficulty" class="filter-select">
          <option value="">{{ t('UEBUNGEN.alle-kategorien') }}</option>
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
        :class="`game-card--${entry.category}`"
        tabindex="0"
        role="button"
        :aria-expanded="expandedId === entry.id"
        @click="toggleExpand(entry.id)"
        @keydown.enter.prevent="toggleExpand(entry.id)"
        @keydown.space.prevent="toggleExpand(entry.id)"
      >
        <div class="game-card__header">
          <div class="game-card__meta">
            <span class="badge badge--category">{{ categoryLabel(entry.category) }}</span>
            <span class="badge badge--difficulty" :class="`badge--${entry.difficulty}`">
              {{ difficultyLabel(entry.difficulty) }}
            </span>
          </div>
          <h2 class="game-card__title">{{ entry.name }}</h2>
          <div class="game-card__info-row">
            <span class="info-chip">⏱ {{ entry.duration }} {{ t('UEBUNGEN.min') }}</span>
            <span class="info-chip">👥 {{ entry.ageGroup }}</span>
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
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Sport } from '@viccoboard/core'
import { getSportBridge } from '../composables/useSportBridge'
import { GAME_SEED_DATA } from '../data/game-seed-data'

const { t } = useI18n()
const bridge = getSportBridge()

const allEntries = ref<Sport.GameEntry[]>([])
const loadError = ref<string | null>(null)
const initializing = ref(false)
const expandedId = ref<string | null>(null)

const searchQuery = ref('')
const selectedCategory = ref<Sport.GameCategory | null>(null)
const selectedPhase = ref<Sport.GamePhase | ''>('')
const selectedDifficulty = ref<Sport.GameDifficulty | ''>('')
const sortBy = ref<'name' | 'duration' | 'difficulty'>('name')

const DIFFICULTY_ORDER: Sport.GameDifficulty[] = ['anfaenger', 'fortgeschrittene', 'profis']

interface CategoryOption {
  value: Sport.GameCategory | null
  label: string
}

const CATEGORIES = computed<CategoryOption[]>(() => [
  { value: null, label: t('UEBUNGEN.alle-kategorien') },
  { value: 'erwaermung', label: t('UEBUNGEN.kategorie-erwaermung') },
  { value: 'ballspiel', label: t('UEBUNGEN.kategorie-ballspiel') },
  { value: 'reaktionsspiel', label: t('UEBUNGEN.kategorie-reaktionsspiel') },
  { value: 'laufspiel', label: t('UEBUNGEN.kategorie-laufspiel') },
  { value: 'koordination', label: t('UEBUNGEN.kategorie-koordination') },
  { value: 'kooperation', label: t('UEBUNGEN.kategorie-kooperation') },
  { value: 'entspannung', label: t('UEBUNGEN.kategorie-entspannung') },
  { value: 'kraft', label: t('UEBUNGEN.kategorie-kraft') },
  { value: 'ausdauer', label: t('UEBUNGEN.kategorie-ausdauer') },
  { value: 'sonstiges', label: t('UEBUNGEN.kategorie-sonstiges') }
])

function categoryLabel(cat: Sport.GameCategory): string {
  const found = CATEGORIES.value.find((c) => c.value === cat)
  return found ? found.label : cat
}

function difficultyLabel(d: Sport.GameDifficulty): string {
  const map: Record<Sport.GameDifficulty, string> = {
    anfaenger: t('UEBUNGEN.schwierigkeit-anfaenger'),
    fortgeschrittene: t('UEBUNGEN.schwierigkeit-fortgeschrittene'),
    profis: t('UEBUNGEN.schwierigkeit-profis')
  }
  return map[d] ?? d
}

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

const filteredEntries = computed<Sport.GameEntry[]>(() => {
  const q = searchQuery.value.toLowerCase().trim()

  let result = allEntries.value.filter((e) => {
    if (selectedCategory.value && e.category !== selectedCategory.value) return false
    if (selectedPhase.value && e.phase !== selectedPhase.value) return false
    if (selectedDifficulty.value && e.difficulty !== selectedDifficulty.value) return false
    if (q) {
      const haystack = `${e.name} ${e.goal} ${e.description} ${e.sportType ?? ''}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })

  result = [...result].sort((a, b) => {
    if (sortBy.value === 'name') return a.name.localeCompare(b.name)
    if (sortBy.value === 'duration') return a.duration - b.duration
    if (sortBy.value === 'difficulty') {
      return DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty)
    }
    return 0
  })

  return result
})

async function seedIfEmpty(): Promise<void> {
  const count = await bridge.gameEntryRepository.count()
  if (count > 0) return

  initializing.value = true
  try {
    for (const seed of GAME_SEED_DATA) {
      await bridge.gameEntryRepository.create({
        ...seed,
        isCustom: false
      })
    }
  } finally {
    initializing.value = false
  }
}

onMounted(async () => {
  try {
    await seedIfEmpty()
    allEntries.value = await bridge.gameEntryRepository.findAll()
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : 'Unknown error'
  }
})
</script>

<style scoped src="./GameDatabaseView.css"></style>
