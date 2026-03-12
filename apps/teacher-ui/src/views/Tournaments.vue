<template>
  <div class="tournaments-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← {{ t('COMMON.back') }}</button>
      <h2>{{ t('TOURNAMENTS.title') }}</h2>
    </div>

    <!-- Saved tournaments list -->
    <section v-if="!activeTournament" class="card">
      <div class="card-header">
        <h3>{{ t('TOURNAMENT.savedTournaments') }}</h3>
        <button class="btn-primary" @click="startNew">+ {{ t('TOURNAMENT.createNew') }}</button>
      </div>
      <p v-if="savedTournaments.length === 0" class="empty-hint">
        {{ t('TOURNAMENT.noTournaments') }}
      </p>
      <ul v-else class="sessions-list">
        <li v-for="session in savedTournaments" :key="session.id" class="session-item">
          <div class="session-info">
            <span class="session-name">{{ session.sessionMetadata.tournament?.name }}</span>
            <span class="session-meta">
              {{ formatDate(session.createdAt) }} ·
              {{ formatType(session.sessionMetadata.tournament?.type) }} ·
              {{ session.sessionMetadata.tournament?.teams?.length }} {{ t('TOURNAMENT.teams') }} ·
              <span :class="`status-badge status-${session.sessionMetadata.tournament?.status}`">
                {{ t(`TOURNAMENT.status.${session.sessionMetadata.tournament?.status}`) }}
              </span>
            </span>
          </div>
          <button class="btn-secondary btn-small" @click="loadTournament(session)">
            {{ t('TOURNAMENT.loadTournament') }}
          </button>
        </li>
      </ul>
    </section>

    <!-- Create new tournament -->
    <section v-if="!activeTournament" class="card">
      <h3>{{ t('TOURNAMENT.createNew') }}</h3>

      <div class="form-row">
        <div class="form-group">
          <label>{{ t('TOURNAMENT.title') }}</label>
          <input v-model="newName" class="form-input" type="text" maxlength="80" :placeholder="t('TOURNAMENT.title')" />
        </div>
        <div class="form-group">
          <label>{{ t('TOURNAMENT.type') }}</label>
          <select v-model="newType" class="form-input">
            <option value="round-robin">{{ t('TOURNAMENT.roundRobin') }}</option>
            <option value="knockout">{{ t('TOURNAMENT.knockout') }}</option>
          </select>
        </div>
      </div>

      <h4>{{ t('TOURNAMENT.teams') }}</h4>
      <div v-for="(team, idx) in newTeams" :key="team.id" class="team-row">
        <input
          v-model="newTeams[idx].name"
          class="form-input team-name-input"
          type="text"
          :placeholder="`${t('TOURNAMENT.team')} ${idx + 1}`"
          maxlength="40"
        />
        <button class="btn-danger btn-small" @click="removeTeam(idx)" :disabled="newTeams.length <= 2">✕</button>
      </div>
      <button class="btn-secondary" @click="addTeam">+ {{ t('TOURNAMENT.addTeam') }}</button>

      <div class="form-actions">
        <button class="btn-primary" @click="createTournament" :disabled="!canCreate">
          {{ t('TOURNAMENT.generate') }}
        </button>
      </div>
      <p v-if="createError" class="error-msg">{{ createError }}</p>
    </section>

    <!-- Active tournament -->
    <template v-if="activeTournament">
      <div class="tournament-header card">
        <div class="tournament-title-row">
          <h3>{{ activeTournament.name }}</h3>
          <span :class="`status-badge status-${activeTournament.status}`">
            {{ t(`TOURNAMENT.status.${activeTournament.status}`) }}
          </span>
        </div>
        <p class="tournament-meta">
          {{ formatType(activeTournament.type) }} · {{ activeTournament.teams.length }} {{ t('TOURNAMENT.teams') }}
        </p>
        <div class="tournament-actions">
          <button class="btn-secondary" @click="closeTournament">← {{ t('COMMON.back') }}</button>
          <button class="btn-primary" :disabled="saving" @click="saveTournament">
            {{ saving ? '…' : t('TOURNAMENT.save') }}
          </button>
        </div>
        <p v-if="saveMessage" class="save-message">{{ saveMessage }}</p>
      </div>

      <!-- Tabs -->
      <div class="tabs-row">
        <button :class="['tab-btn', { active: tab === 'matches' }]" @click="tab = 'matches'">
          {{ t('TOURNAMENT.matches') }}
        </button>
        <button
          v-if="activeTournament.type === 'round-robin'"
          :class="['tab-btn', { active: tab === 'standings' }]"
          @click="tab = 'standings'"
        >
          {{ t('TOURNAMENT.standings') }}
        </button>
      </div>

      <!-- Matches tab -->
      <section v-if="tab === 'matches'" class="card">
        <div v-if="activeTournament.matches.length === 0" class="empty-hint">
          {{ t('TOURNAMENT.no_matches') }}
        </div>
        <div v-else>
          <div
            v-for="round in rounds"
            :key="round"
            class="round-section"
          >
            <h4>{{ t('TOURNAMENT.round') }} {{ round }}</h4>
            <div
              v-for="match in matchesByRound(round)"
              :key="match.id"
              class="match-row"
            >
              <span class="match-team">{{ teamName(match.team1Id) }}</span>
              <div class="match-score-inputs">
                <input
                  v-model.number="match.score1"
                  class="score-input"
                  type="number"
                  min="0"
                  :disabled="match.status === 'completed'"
                />
                <span class="score-sep">:</span>
                <input
                  v-model.number="match.score2"
                  class="score-input"
                  type="number"
                  min="0"
                  :disabled="match.status === 'completed'"
                />
              </div>
              <span class="match-team">{{ teamName(match.team2Id) }}</span>
              <button
                v-if="match.status !== 'completed'"
                class="btn-primary btn-small"
                @click="completeMatch(match)"
                :disabled="match.score1 === undefined || match.score2 === undefined"
              >
                {{ t('TOURNAMENT.complete') }}
              </button>
              <span v-else class="match-done">✓</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Standings tab -->
      <section v-if="tab === 'standings' && activeTournament.type === 'round-robin'" class="card">
        <table class="standings-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{{ t('TOURNAMENT.teams') }}</th>
              <th>{{ t('TOURNAMENT.played') }}</th>
              <th>{{ t('TOURNAMENT.won') }}</th>
              <th>{{ t('TOURNAMENT.drawn') }}</th>
              <th>{{ t('TOURNAMENT.lost') }}</th>
              <th>{{ t('TOURNAMENT.goalsFor') }}</th>
              <th>{{ t('TOURNAMENT.goalsAgainst') }}</th>
              <th>{{ t('TOURNAMENT.pts') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in standings" :key="row.teamId">
              <td>{{ idx + 1 }}</td>
              <td>{{ row.teamName }}</td>
              <td>{{ row.played }}</td>
              <td>{{ row.won }}</td>
              <td>{{ row.drawn }}</td>
              <td>{{ row.lost }}</td>
              <td>{{ row.goalsFor }}</td>
              <td>{{ row.goalsAgainst }}</td>
              <td><strong>{{ row.points }}</strong></td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getSportBridge, initializeSportBridge } from '../composables/useSportBridge'
import { v4 as uuidv4 } from 'uuid'
import type { Sport } from '@viccoboard/core'
import type { TournamentData, StandingsRow } from '@viccoboard/sport'

const { t } = useI18n()

initializeSportBridge()
const bridge = getSportBridge()

// -----------------------------------------------------------------------
// List view state
// -----------------------------------------------------------------------
const savedTournaments = ref<Sport.ToolSession[]>([])
const activeTournament = ref<TournamentData | null>(null)
const activeSessionId = ref<string | undefined>(undefined)

// -----------------------------------------------------------------------
// Create form state
// -----------------------------------------------------------------------
const newName = ref('')
const newType = ref<'round-robin' | 'knockout'>('round-robin')
const newTeams = ref<Array<{ id: string; name: string }>>([
  { id: uuidv4(), name: '' },
  { id: uuidv4(), name: '' },
  { id: uuidv4(), name: '' },
  { id: uuidv4(), name: '' }
])
const createError = ref('')

// -----------------------------------------------------------------------
// Active tournament state
// -----------------------------------------------------------------------
const tab = ref<'matches' | 'standings'>('matches')
const saving = ref(false)
const saveMessage = ref('')

// -----------------------------------------------------------------------
// Computed
// -----------------------------------------------------------------------
const canCreate = computed(() => {
  const namedTeams = newTeams.value.filter(team => team.name.trim().length > 0)
  return newName.value.trim().length > 0 && namedTeams.length >= 2
})

const rounds = computed(() => {
  if (!activeTournament.value) return []
  const rs = [...new Set(activeTournament.value.matches.map(m => m.round))]
  rs.sort((a, b) => a - b)
  return rs
})

const standings = computed<StandingsRow[]>(() => {
  if (!activeTournament.value) return []
  return bridge.tournamentSchedulerService.computeStandings(
    activeTournament.value.teams,
    activeTournament.value.matches
  )
})

// -----------------------------------------------------------------------
// Methods
// -----------------------------------------------------------------------
function addTeam() {
  newTeams.value.push({ id: uuidv4(), name: '' })
}

function removeTeam(idx: number) {
  if (newTeams.value.length <= 2) return
  newTeams.value.splice(idx, 1)
}

function startNew() {
  newName.value = ''
  newType.value = 'round-robin'
  newTeams.value = [
    { id: uuidv4(), name: '' },
    { id: uuidv4(), name: '' },
    { id: uuidv4(), name: '' },
    { id: uuidv4(), name: '' }
  ]
  createError.value = ''
}

function createTournament() {
  createError.value = ''
  const namedTeams = newTeams.value
    .filter(team => team.name.trim().length > 0)
    .map(team => ({ id: team.id, name: team.name.trim() }))

  if (namedTeams.length < 2) {
    createError.value = t('COMMON.error')
    return
  }

  let matches: TournamentData['matches']
  try {
    if (newType.value === 'round-robin') {
      matches = bridge.tournamentSchedulerService.generateRoundRobin(namedTeams)
    } else {
      matches = bridge.tournamentSchedulerService.generateKnockout(namedTeams)
    }
  } catch {
    createError.value = t('COMMON.error')
    return
  }

  activeTournament.value = {
    id: uuidv4(),
    name: newName.value.trim(),
    type: newType.value,
    teams: namedTeams,
    matches,
    status: 'in-progress'
  }
  activeSessionId.value = undefined
  tab.value = 'matches'
  saveMessage.value = ''
}

function loadTournament(session: Sport.ToolSession) {
  activeTournament.value = { ...(session.sessionMetadata.tournament as TournamentData) }
  activeSessionId.value = session.id
  tab.value = 'matches'
  saveMessage.value = ''
}

function closeTournament() {
  activeTournament.value = null
  activeSessionId.value = undefined
  saveMessage.value = ''
}

function matchesByRound(round: number) {
  return activeTournament.value?.matches.filter(m => m.round === round) ?? []
}

function teamName(id: string): string {
  return activeTournament.value?.teams.find(team => team.id === id)?.name ?? id
}

function completeMatch(match: TournamentData['matches'][0]) {
  match.status = 'completed'
  const allDone = activeTournament.value?.matches.every(m => m.status === 'completed')
  if (allDone && activeTournament.value) {
    activeTournament.value.status = 'completed'
  }
}

async function saveTournament() {
  if (!activeTournament.value) return
  saving.value = true
  saveMessage.value = ''
  try {
    const result = await bridge.saveTournamentUseCase.execute({
      sessionId: activeSessionId.value,
      tournament: activeTournament.value
    })
    activeSessionId.value = result.id
    saveMessage.value = t('TOURNAMENT.saveSuccess')
    await loadSavedTournaments()
  } finally {
    saving.value = false
  }
}

async function loadSavedTournaments() {
  const all = await bridge.toolSessionRepository.findByToolType('tournament')
  savedTournaments.value = all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString()
}

function formatType(type?: string): string {
  if (type === 'round-robin') return t('TOURNAMENT.roundRobin')
  if (type === 'knockout') return t('TOURNAMENT.knockout')
  return type ?? ''
}

onMounted(loadSavedTournaments)
</script>

<style scoped>
.tournaments-view {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem;
}

.page-header {
  margin-bottom: 1.5rem;
}

.back-button {
  background: none;
  border: none;
  color: #0066cc;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem 0;
  min-height: 44px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
}

.card h3,
.card h4 {
  margin: 0 0 1rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-header h3 {
  margin: 0;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 500;
}

.form-input {
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #ddd;
  font-size: 1rem;
}

.team-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  align-items: center;
}

.team-name-input {
  flex: 1;
}

.form-actions {
  margin-top: 1rem;
  display: flex;
  gap: 1rem;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  min-height: 44px;
}

.btn-primary { background: #667eea; color: white; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary { background: white; border: 2px solid #ddd; color: #333; }
.btn-danger { background: #fee2e2; border: 1px solid #fca5a5; color: #dc2626; }
.btn-small { padding: 0.4rem 0.9rem; min-height: 36px; font-size: 0.875rem; }

.empty-hint {
  color: #888;
  font-style: italic;
}

.error-msg {
  color: #dc2626;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.save-message {
  color: #16a34a;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.sessions-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  gap: 1rem;
}

.session-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.session-name { font-weight: 600; }
.session-meta { font-size: 0.8rem; color: #666; }

.status-badge {
  display: inline-block;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}
.status-planning { background: #fff3cd; color: #856404; }
.status-in-progress { background: #cce5ff; color: #004085; }
.status-completed { background: #d4edda; color: #155724; }

.tournament-header {
  margin-bottom: 0;
}

.tournament-title-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.25rem;
}

.tournament-title-row h3 {
  margin: 0;
}

.tournament-meta {
  color: #666;
  font-size: 0.9rem;
  margin: 0 0 1rem;
}

.tournament-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.tabs-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.tab-btn {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 8px 8px 0 0;
  background: #f0f0f0;
  cursor: pointer;
  font-size: 0.9rem;
  min-height: 44px;
}

.tab-btn.active {
  background: white;
  font-weight: 700;
  box-shadow: 0 -2px 4px rgba(0,0,0,0.06);
}

.round-section {
  margin-bottom: 1.25rem;
}

.round-section h4 {
  font-size: 0.9rem;
  color: #555;
  margin: 0 0 0.5rem;
}

.match-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid #f0f0f0;
  flex-wrap: wrap;
}

.match-team {
  flex: 1;
  min-width: 80px;
  font-weight: 500;
}

.match-score-inputs {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.score-input {
  width: 52px;
  padding: 0.4rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  text-align: center;
  font-size: 1.1rem;
}

.score-sep {
  font-weight: 700;
  font-size: 1.1rem;
}

.match-done {
  color: #16a34a;
  font-size: 1.2rem;
}

.standings-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.standings-table th,
.standings-table td {
  padding: 0.5rem 0.75rem;
  text-align: center;
  border-bottom: 1px solid #eee;
}

.standings-table th {
  font-weight: 600;
  color: #555;
  background: #f8f9fa;
}

.standings-table td:nth-child(2) {
  text-align: left;
}

@media (max-width: 600px) {
  .session-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .tournament-actions {
    flex-direction: column;
  }
}
</style>
