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

<style scoped>
.game-database {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  flex-wrap: wrap;
}

.page-header h1 {
  margin: 0;
}

.subtitle {
  color: #64748b;
  margin: 0.25rem 0 0;
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
  white-space: nowrap;
}

.error-banner {
  background: #fef2f2;
  border: 1px solid #fca5a5;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  color: #991b1b;
}

.loading-hint {
  color: #64748b;
  font-style: italic;
}

/* Search */
.search-row {
  width: 100%;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: 12px;
  font-size: 1rem;
  background: white;
  box-sizing: border-box;
  min-height: 44px;
}

.search-input:focus {
  outline: 2px solid #0e7490;
  outline-offset: 1px;
}

/* Filter chips */
.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip {
  min-height: 36px;
  padding: 0.25rem 0.875rem;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  background: white;
  cursor: pointer;
  font-size: 0.875rem;
  color: #374151;
  transition: background 0.15s, color 0.15s;
}

.chip:hover {
  background: #f1f5f9;
}

.chip--active {
  background: #0e7490;
  color: white;
  border-color: #0e7490;
}

/* Filter bar */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 160px;
}

.filter-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.filter-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: 10px;
  background: white;
  font-size: 0.9rem;
  min-height: 40px;
  cursor: pointer;
}

.filter-select:focus {
  outline: 2px solid #0e7490;
  outline-offset: 1px;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #64748b;
}

.empty-hint {
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

/* Cards grid */
.cards-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.game-card {
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  padding: 1.25rem;
  cursor: pointer;
  transition: box-shadow 0.15s;
  outline: none;
  position: relative;
}

.game-card:hover,
.game-card:focus-visible {
  box-shadow: 0 4px 16px rgba(14, 116, 144, 0.12);
}

.game-card--erwaermung  { border-left: 4px solid #f97316; }
.game-card--ballspiel   { border-left: 4px solid #3b82f6; }
.game-card--reaktionsspiel { border-left: 4px solid #a855f7; }
.game-card--laufspiel   { border-left: 4px solid #10b981; }
.game-card--koordination { border-left: 4px solid #f59e0b; }
.game-card--kooperation { border-left: 4px solid #ec4899; }
.game-card--entspannung { border-left: 4px solid #6366f1; }
.game-card--kraft       { border-left: 4px solid #ef4444; }
.game-card--ausdauer    { border-left: 4px solid #14b8a6; }
.game-card--sonstiges   { border-left: 4px solid #8b5cf6; }

.game-card__header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.game-card__meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badge {
  display: inline-block;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge--category {
  background: rgba(14, 116, 144, 0.1);
  color: #155e75;
}

.badge--anfaenger     { background: #dcfce7; color: #166534; }
.badge--fortgeschrittene { background: #fef3c7; color: #92400e; }
.badge--profis        { background: #fee2e2; color: #991b1b; }

.game-card__title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
}

.game-card__info-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.info-chip {
  font-size: 0.8rem;
  color: #475569;
  background: #f1f5f9;
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
}

.game-card__goal {
  font-size: 0.875rem;
  color: #475569;
  margin: 0.25rem 0 0.5rem;
  line-height: 1.5;
}

/* Detail section */
.game-card__detail {
  margin-top: 0.75rem;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
  padding-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #0f766e;
}

.detail-text {
  margin: 0;
  font-size: 0.875rem;
  color: #1e293b;
  line-height: 1.5;
}

.game-card__toggle {
  position: absolute;
  bottom: 0.75rem;
  right: 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
  color: #94a3b8;
  padding: 0.25rem;
  min-height: 32px;
  min-width: 32px;
}

/* Expand transition */
.expand-enter-active,
.expand-leave-active {
  transition: opacity 0.2s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
}
</style>
