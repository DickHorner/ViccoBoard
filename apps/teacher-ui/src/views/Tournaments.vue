<template>
  <div class="tournaments-view">
    <!-- LIST VIEW -->
    <template v-if="view === 'list'">
      <div class="page-header">
        <h2>{{ t('TOURNAMENTS.title') }}</h2>
        <button class="btn-primary" type="button" @click="startCreate">
          + {{ t('TOURNAMENTS.new') }}
        </button>
      </div>

      <div v-if="loading" class="loading">…</div>
      <div v-else-if="tournaments.length === 0" class="empty-state">
        {{ t('TOURNAMENTS.empty') }}
      </div>
      <ul v-else class="tournament-list">
        <li
          v-for="tournament in tournaments"
          :key="tournament.id"
          class="tournament-card"
          @click="openTournament(tournament)"
        >
          <div class="tournament-card-header">
            <span class="tournament-name">{{ tournament.name }}</span>
            <span :class="['status-badge', tournament.status]">
              {{ t(`TOURNAMENTS.status.${tournament.status}`) }}
            </span>
          </div>
          <div class="tournament-meta">
            <span>{{ formatType(tournament.type) }}</span>
            <span>{{ tournament.teams.length }} {{ t('TOURNAMENT.teams') }}</span>
          </div>
        </li>
      </ul>
    </template>

    <!-- CREATE FORM -->
    <template v-else-if="view === 'create'">
      <div class="page-header">
        <button class="btn-back" type="button" @click="cancelCreate">← {{ t('TOURNAMENTS.back') }}</button>
        <h2>{{ t('TOURNAMENTS.create') }}</h2>
      </div>

      <form class="create-form card" @submit.prevent="submitCreate">
        <div class="form-group">
          <label>{{ t('TOURNAMENTS.name_label') }}</label>
          <input
            v-model="form.name"
            class="form-input"
            type="text"
            :placeholder="t('TOURNAMENTS.name_placeholder')"
            required
          />
        </div>

        <div class="form-group">
          <label>{{ t('TOURNAMENTS.format_label') }}</label>
          <select v-model="form.type" class="form-select">
            <option value="round-robin">{{ t('TOURNAMENTS.mode.round_robin') }}</option>
            <option value="knockout">{{ t('TOURNAMENTS.mode.knockout') }}</option>
          </select>
        </div>

        <div class="form-group">
          <label>{{ t('TOURNAMENTS.teams_label') }}</label>
          <ul class="team-list-editor">
            <li v-for="(_, idx) in form.teams" :key="idx" class="team-list-row">
              <input
                v-model="form.teams[idx]"
                class="form-input team-input"
                type="text"
                :placeholder="`${t('TOURNAMENT.team')} ${idx + 1}`"
              />
              <button
                v-if="form.teams.length > 2"
                class="btn-icon"
                type="button"
                @click="removeTeam(idx)"
              >✕</button>
            </li>
          </ul>
          <button class="btn-secondary" type="button" @click="addTeam">
            + {{ t('TOURNAMENTS.add_team') }}
          </button>
          <p v-if="createError" class="error-text">{{ createError }}</p>
        </div>

        <div class="form-actions">
          <button class="btn-secondary" type="button" @click="cancelCreate">
            {{ t('TOURNAMENTS.cancel') }}
          </button>
          <button class="btn-primary" type="submit" :disabled="saving">
            {{ t('TOURNAMENTS.create') }}
          </button>
        </div>
      </form>
    </template>

    <!-- TOURNAMENT DETAIL -->
    <template v-else-if="view === 'detail' && activeTournament">
      <div class="page-header">
        <button class="btn-back" type="button" @click="backToList">← {{ t('TOURNAMENTS.back') }}</button>
        <h2>{{ activeTournament.name }}</h2>
        <span :class="['status-badge', activeTournament.status]">
          {{ t(`TOURNAMENTS.status.${activeTournament.status}`) }}
        </span>
        <button class="btn-danger" type="button" @click="deleteTournament">
          {{ t('TOURNAMENTS.delete') }}
        </button>
      </div>

      <!-- Tab bar -->
      <div class="tab-bar">
        <button
          :class="['tab-btn', { active: detailTab === 'matches' }]"
          type="button"
          @click="detailTab = 'matches'"
        >{{ t('TOURNAMENT.matches') }}</button>
        <button
          v-if="activeTournament.type === 'round-robin'"
          :class="['tab-btn', { active: detailTab === 'standings' }]"
          type="button"
          @click="detailTab = 'standings'"
        >{{ t('TOURNAMENTS.standings') }}</button>
        <button
          v-if="activeTournament.type === 'knockout'"
          :class="['tab-btn', { active: detailTab === 'bracket' }]"
          type="button"
          @click="detailTab = 'bracket'"
        >{{ t('TOURNAMENTS.bracket') }}</button>
      </div>

      <!-- Matches tab -->
      <div v-if="detailTab === 'matches'" class="matches-section">
        <div
          v-for="round in matchesByRound"
          :key="round.round"
          class="round-section"
        >
          <h3 class="round-header">{{ t('TOURNAMENT.round') }} {{ round.round }}</h3>
          <ul class="match-list">
            <li
              v-for="match in round.matches"
              :key="match.id"
              class="match-row"
            >
              <span class="team-name">{{ teamName(match.team1Id) }}</span>
              <span class="vs-label">{{ t('TOURNAMENTS.vs') }}</span>
              <span class="team-name">{{ teamName(match.team2Id) }}</span>
              <template v-if="match.status === 'completed'">
                <span class="score-display">{{ match.score1 }} : {{ match.score2 }}</span>
              </template>
              <button
                v-if="match.team1Id && match.team2Id && match.status !== 'completed'"
                class="btn-secondary btn-sm"
                type="button"
                @click="openScoreEntry(match)"
              >{{ t('TOURNAMENTS.enter_result') }}</button>
            </li>
          </ul>
        </div>
      </div>

      <!-- Standings tab (round-robin) -->
      <div v-if="detailTab === 'standings'" class="standings-section">
        <table class="standings-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{{ t('TOURNAMENT.table_cols.team') }}</th>
              <th>{{ t('TOURNAMENT.table_cols.played') }}</th>
              <th>{{ t('TOURNAMENT.table_cols.wins') }}</th>
              <th>{{ t('TOURNAMENT.table_cols.draws') }}</th>
              <th>{{ t('TOURNAMENT.table_cols.losses') }}</th>
              <th>{{ t('TOURNAMENT.table_cols.goals') }}</th>
              <th>{{ t('TOURNAMENT.table_cols.points') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in standings" :key="row.teamId">
              <td>{{ index + 1 }}</td>
              <td>{{ row.teamName }}</td>
              <td>{{ row.played }}</td>
              <td>{{ row.wins }}</td>
              <td>{{ row.draws }}</td>
              <td>{{ row.losses }}</td>
              <td>{{ row.goalsFor }}:{{ row.goalsAgainst }}</td>
              <td class="points-cell">{{ row.points }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Bracket tab (knockout) -->
      <div v-if="detailTab === 'bracket'" class="bracket-section">
        <div
          v-for="bracketRound in knockoutBracket.rounds"
          :key="bracketRound.round"
          class="bracket-round"
        >
          <h3 class="round-header">{{ bracketRound.label }}</h3>
          <ul class="match-list">
            <li
              v-for="match in bracketRound.matches"
              :key="match.id"
              class="match-row"
            >
              <span class="team-name">{{ teamName(match.team1Id) || '?' }}</span>
              <span class="vs-label">{{ t('TOURNAMENTS.vs') }}</span>
              <span class="team-name">{{ teamName(match.team2Id) || '?' }}</span>
              <template v-if="match.status === 'completed'">
                <span class="score-display">{{ match.score1 }} : {{ match.score2 }}</span>
              </template>
              <button
                v-if="match.team1Id && match.team2Id && match.status !== 'completed'"
                class="btn-secondary btn-sm"
                type="button"
                @click="openScoreEntry(match)"
              >{{ t('TOURNAMENTS.enter_result') }}</button>
            </li>
          </ul>
        </div>
      </div>
    </template>

    <!-- Score Entry Modal -->
    <div v-if="scoreEntry.open" class="modal-overlay" @click.self="closeScoreEntry">
      <div class="modal-card">
        <h3>{{ t('TOURNAMENTS.enter_result') }}</h3>

        <!-- Scoreboard session import -->
        <div v-if="scoreboardSessions.length > 0" class="form-group scoreboard-import-group">
          <label class="form-label">{{ t('TOURNAMENTS.import_from_scoreboard') }}</label>
          <select
            v-model="selectedScoreboardSessionId"
            class="form-select"
            @change="applyScoreboardSession(selectedScoreboardSessionId)"
          >
            <option value="">{{ t('TOURNAMENTS.select_scoreboard_session') }}</option>
            <option
              v-for="session in scoreboardSessions"
              :key="session.id"
              :value="session.id"
            >
              {{ scoreboardSessionLabel(session) }}
            </option>
          </select>
          <p v-if="scoreboardImportHint" class="import-hint">
            {{ t('TOURNAMENTS.scoreboard_imported') }}
          </p>
        </div>

        <div class="score-entry-row">
          <span class="team-name">{{ teamName(scoreEntry.match!.team1Id) }}</span>
          <input
            v-model.number="scoreEntry.score1"
            class="score-input"
            type="number"
            min="0"
          />
          <span class="vs-label">:</span>
          <input
            v-model.number="scoreEntry.score2"
            class="score-input"
            type="number"
            min="0"
          />
          <span class="team-name">{{ teamName(scoreEntry.match!.team2Id) }}</span>
        </div>
        <p v-if="scoreError" class="error-text">{{ scoreError }}</p>
        <div class="modal-actions">
          <button class="btn-secondary" type="button" @click="closeScoreEntry">
            {{ t('TOURNAMENTS.cancel') }}
          </button>
          <button class="btn-primary" type="button" :disabled="saving" @click="saveScore">
            {{ t('TOURNAMENTS.save_result') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getSportBridge } from '../composables/useSportBridge'
import { TournamentService } from '@viccoboard/sport'
import type { ScoreboardSessionMetadata } from '@viccoboard/sport'
import type { Sport } from '@viccoboard/core'

const { t } = useI18n()

// -------------------------------------------------------------------------
// State
// -------------------------------------------------------------------------
type View = 'list' | 'create' | 'detail'

const view = ref<View>('list')
const detailTab = ref<'matches' | 'standings' | 'bracket'>('matches')

const loading = ref(false)
const saving = ref(false)
const tournaments = ref<Sport.Tournament[]>([])
const activeTournament = ref<Sport.Tournament | null>(null)

const createError = ref('')
const scoreError = ref('')

const form = ref({
  name: '',
  type: 'round-robin' as 'round-robin' | 'knockout',
  teams: ['', '']
})

const scoreEntry = ref<{
  open: boolean
  match: Sport.Match | null
  score1: number
  score2: number
}>({
  open: false,
  match: null,
  score1: 0,
  score2: 0
})

/** Available scoreboard sessions loaded when the score entry modal opens. */
const scoreboardSessions = ref<Sport.ToolSession[]>([])
/** Currently selected scoreboard session id (for auto-fill). */
const selectedScoreboardSessionId = ref('')
/** Hint shown after a successful scoreboard import. */
const scoreboardImportHint = ref(false)

// -------------------------------------------------------------------------
// Bridge
// -------------------------------------------------------------------------
let bridge: ReturnType<typeof getSportBridge>
const tournamentService = new TournamentService()

try {
  bridge = getSportBridge()
} catch {
  // Bridge not yet initialized (e.g. during SSR/test)
  bridge = null as any
}

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------
function teamName(teamId: string): string {
  if (!activeTournament.value || !teamId) return ''
  const team = activeTournament.value.teams.find(t => t.id === teamId)
  return team?.name ?? teamId
}

function formatType(type: string): string {
  if (type === 'round-robin') return t('TOURNAMENTS.mode.round_robin')
  if (type === 'knockout') return t('TOURNAMENTS.mode.knockout')
  return type
}

// -------------------------------------------------------------------------
// Computed
// -------------------------------------------------------------------------
const matchesByRound = computed(() => {
  if (!activeTournament.value) return []
  const rounds: { round: number; matches: Sport.Match[] }[] = []
  const sorted = [...activeTournament.value.matches].sort(
    (a, b) => a.round - b.round || a.sequence - b.sequence
  )
  for (const match of sorted) {
    let bucket = rounds.find(r => r.round === match.round)
    if (!bucket) {
      bucket = { round: match.round, matches: [] }
      rounds.push(bucket)
    }
    bucket.matches.push(match)
  }
  return rounds
})

const standings = computed(() => {
  if (!activeTournament.value || activeTournament.value.type !== 'round-robin') return []
  return tournamentService.computeRoundRobinStandings(
    activeTournament.value.teams,
    activeTournament.value.matches
  )
})

const knockoutBracket = computed(() => {
  if (!activeTournament.value || activeTournament.value.type !== 'knockout') {
    return { rounds: [] }
  }
  return tournamentService.buildKnockoutBracket(
    activeTournament.value.teams,
    activeTournament.value.matches
  )
})

// -------------------------------------------------------------------------
// Data loading
// -------------------------------------------------------------------------
async function loadTournaments() {
  if (!bridge) return
  loading.value = true
  try {
    tournaments.value = await bridge.tournamentRepository.findAll()
  } finally {
    loading.value = false
  }
}

// -------------------------------------------------------------------------
// Navigation
// -------------------------------------------------------------------------
function startCreate() {
  form.value = { name: '', type: 'round-robin', teams: ['', ''] }
  createError.value = ''
  view.value = 'create'
}

function cancelCreate() {
  view.value = 'list'
}

function openTournament(tournament: Sport.Tournament) {
  activeTournament.value = tournament
  detailTab.value = 'matches'
  view.value = 'detail'
}

async function backToList() {
  await loadTournaments()
  activeTournament.value = null
  view.value = 'list'
}

// -------------------------------------------------------------------------
// Create tournament
// -------------------------------------------------------------------------
function addTeam() {
  form.value.teams.push('')
}

function removeTeam(idx: number) {
  form.value.teams.splice(idx, 1)
}

async function submitCreate() {
  createError.value = ''
  const filledTeams = form.value.teams.map(n => n.trim()).filter(n => n.length > 0)
  if (filledTeams.length < 2) {
    createError.value = t('TOURNAMENTS.min_teams')
    return
  }
  if (!form.value.name.trim()) return

  saving.value = true
  try {
    const { v4: uuidv4 } = await import('uuid')
    const teams = filledTeams.map(name => ({
      id: uuidv4(),
      name,
      studentIds: [] as string[]
    }))

    const created = await bridge.createTournamentUseCase.execute({
      classGroupId: 'default',
      name: form.value.name.trim(),
      type: form.value.type,
      teams
    })

    tournaments.value = [created, ...tournaments.value]
    openTournament(created)
  } catch (err) {
    createError.value = (err as Error).message
  } finally {
    saving.value = false
  }
}

// -------------------------------------------------------------------------
// Score entry
// -------------------------------------------------------------------------
async function openScoreEntry(match: Sport.Match): Promise<void> {
  selectedScoreboardSessionId.value = ''
  scoreboardImportHint.value = false
  scoreEntry.value = { open: true, match, score1: 0, score2: 0 }
  scoreError.value = ''
  await loadScoreboardSessions()
}

function closeScoreEntry() {
  scoreEntry.value = { open: false, match: null, score1: 0, score2: 0 }
  scoreError.value = ''
  scoreboardSessions.value = []
  selectedScoreboardSessionId.value = ''
  scoreboardImportHint.value = false
}

// -------------------------------------------------------------------------
// Scoreboard handoff
// -------------------------------------------------------------------------
async function loadScoreboardSessions(): Promise<void> {
  if (!bridge) return
  const classGroupId = activeTournament.value?.classGroupId
  // 'default' is the sentinel used when no real class group was selected at
  // tournament creation time — fall back to loading all sessions in that case.
  const all = classGroupId && classGroupId !== 'default'
    ? await bridge.toolSessionRepository.findByClassGroup(classGroupId)
    : await bridge.toolSessionRepository.findAll()
  scoreboardSessions.value = [...all]
    .filter(s => s.toolType === 'scoreboard')
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

function applyScoreboardSession(sessionId: string): void {
  if (!sessionId || !scoreEntry.value.match || !activeTournament.value) return
  const session = scoreboardSessions.value.find(s => s.id === sessionId)
  if (!session) return
  const metadata = session.sessionMetadata as ScoreboardSessionMetadata
  const result = tournamentService.mapScoreboardResultToMatch(
    activeTournament.value.teams,
    scoreEntry.value.match,
    { teams: metadata.teams ?? [], scores: metadata.scores ?? {} }
  )
  scoreEntry.value.score1 = result.score1
  scoreEntry.value.score2 = result.score2
  scoreboardImportHint.value = true
}

function scoreboardSessionLabel(session: Sport.ToolSession): string {
  const metadata = session.sessionMetadata as ScoreboardSessionMetadata
  const teams = (metadata.teams ?? []).slice(0, 2)
  const names = teams.map(t => t.name).join(' vs ')
  const scores = teams.map(t => (metadata.scores ?? {})[t.id] ?? 0).join(':')
  const date = session.createdAt.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  return `${metadata.sessionName ?? names} · ${scores} · ${date}`
}

async function saveScore() {
  if (!scoreEntry.value.match || !activeTournament.value) return
  scoreError.value = ''
  saving.value = true
  try {
    const updated = await bridge.updateTournamentMatchUseCase.execute({
      tournamentId: activeTournament.value.id,
      matchId: scoreEntry.value.match.id,
      score1: scoreEntry.value.score1,
      score2: scoreEntry.value.score2
    })
    activeTournament.value = updated
    closeScoreEntry()
  } catch (err) {
    scoreError.value = (err as Error).message
  } finally {
    saving.value = false
  }
}

// -------------------------------------------------------------------------
// Delete tournament
// -------------------------------------------------------------------------
async function deleteTournament() {
  if (!activeTournament.value) return
  if (!confirm(t('TOURNAMENTS.confirm_delete'))) return
  await bridge.tournamentRepository.delete(activeTournament.value.id)
  await backToList()
}

// -------------------------------------------------------------------------
// Lifecycle
// -------------------------------------------------------------------------
onMounted(loadTournaments)
</script>

<style scoped>
.tournaments-view {
  padding: 1rem;
  max-width: 900px;
  margin: 0 auto;
  position: relative;
}

/* Page header */
.page-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.page-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
  flex: 1;
}

/* Buttons */
.btn-primary {
  background: #4a6fa5;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1.1rem;
  cursor: pointer;
  font-size: 0.95rem;
}
.btn-primary:hover {
  background: #3a5f95;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #4a6fa5;
  border: 1px solid #4a6fa5;
  border-radius: 6px;
  padding: 0.45rem 0.9rem;
  cursor: pointer;
  font-size: 0.9rem;
}
.btn-secondary:hover {
  background: #eef2f8;
}

.btn-sm {
  padding: 0.25rem 0.6rem;
  font-size: 0.8rem;
}

.btn-back {
  background: none;
  border: none;
  color: #4a6fa5;
  cursor: pointer;
  font-size: 0.95rem;
  padding: 0.25rem 0;
}

.btn-danger {
  background: white;
  color: #c0392b;
  border: 1px solid #c0392b;
  border-radius: 6px;
  padding: 0.45rem 0.9rem;
  cursor: pointer;
  font-size: 0.9rem;
  margin-left: auto;
}
.btn-danger:hover {
  background: #fdf0ef;
}

.btn-icon {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.2rem 0.4rem;
}

/* Status badge */
.status-badge {
  font-size: 0.78rem;
  padding: 0.2rem 0.5rem;
  border-radius: 10px;
  font-weight: 600;
}
.status-badge.planning {
  background: #e8f4fd;
  color: #2980b9;
}
.status-badge.in-progress {
  background: #fef9e7;
  color: #d68910;
}
.status-badge.completed {
  background: #eafaf1;
  color: #1e8449;
}

/* Tournament list */
.tournament-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tournament-card {
  background: white;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: box-shadow 0.15s;
}
.tournament-card:hover {
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.12);
}

.tournament-card-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.3rem;
}

.tournament-name {
  font-weight: 600;
  font-size: 1.05rem;
  color: #222;
}

.tournament-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: #666;
}

/* Empty state */
.empty-state {
  text-align: center;
  color: #888;
  padding: 3rem 1rem;
  font-size: 1rem;
}

.loading {
  text-align: center;
  color: #aaa;
  padding: 2rem;
}

/* Card */
.card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

/* Form */
.create-form {
  max-width: 540px;
}

.form-group {
  margin-bottom: 1.2rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.35rem;
  font-weight: 500;
  color: #444;
  font-size: 0.9rem;
}

.form-input,
.form-select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #4a6fa5;
}

.team-list-editor {
  list-style: none;
  margin: 0 0 0.5rem 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.team-list-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.team-input {
  width: auto;
  flex: 1;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.error-text {
  color: #c0392b;
  font-size: 0.85rem;
  margin-top: 0.4rem;
}

/* Tabs */
.tab-bar {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #e0e0e0;
  margin-bottom: 1.25rem;
}

.tab-btn {
  background: none;
  border: none;
  padding: 0.5rem 1.1rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: #666;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  transition: color 0.15s, border-color 0.15s;
}
.tab-btn.active {
  color: #4a6fa5;
  border-bottom-color: #4a6fa5;
  font-weight: 600;
}

/* Round sections */
.round-section {
  margin-bottom: 1.5rem;
}

.round-header {
  font-size: 0.9rem;
  font-weight: 700;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 0 0 0.6rem 0;
}

/* Match list */
.match-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.match-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: white;
  border-radius: 6px;
  padding: 0.55rem 0.9rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  flex-wrap: wrap;
}

.vs-label {
  color: #aaa;
  font-size: 0.85rem;
}

.team-name {
  font-size: 0.95rem;
  color: #333;
  min-width: 80px;
}

.score-display {
  font-weight: 700;
  font-size: 1rem;
  color: #333;
  margin-left: auto;
  background: #f3f6fb;
  border-radius: 4px;
  padding: 0.15rem 0.5rem;
}

/* Standings table */
.standings-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.standings-table th,
.standings-table td {
  text-align: center;
  padding: 0.45rem 0.5rem;
  border-bottom: 1px solid #eee;
}

.standings-table th:nth-child(2),
.standings-table td:nth-child(2) {
  text-align: left;
}

.standings-table thead th {
  font-weight: 600;
  color: #555;
  background: #f8f9fa;
}

.points-cell {
  font-weight: 700;
  color: #4a6fa5;
}

/* Bracket */
.bracket-section {
  display: flex;
  gap: 1.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.bracket-round {
  min-width: 200px;
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
}

.modal-card {
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  min-width: 320px;
  max-width: 480px;
  width: 90%;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.18);
}

.modal-card h3 {
  margin: 0 0 1.2rem 0;
  font-size: 1.1rem;
  color: #333;
}

.score-entry-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1rem;
}

.score-input {
  width: 64px;
  text-align: center;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1.3rem;
  font-weight: 700;
}

.score-input:focus {
  outline: none;
  border-color: #4a6fa5;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.scoreboard-import-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-muted);
  margin-bottom: 0.4rem;
}

.form-select {
  width: 100%;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.15);
  padding: 0.7rem 0.9rem;
  font-size: 1rem;
}

.import-hint {
  margin-top: 0.4rem;
  font-size: 0.85rem;
  color: #15803d;
}
</style>
