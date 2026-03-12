<template>
  <div class="scoreboard-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← {{ t('COMMON.back') }}</button>
      <h2>{{ t('SCORES.title') }}</h2>
    </div>

    <!-- Active match -->
    <section class="card">
      <div class="scoreboard-grid">
        <div class="team-card">
          <div class="team-header">
            <label class="team-label">{{ t('TOURNAMENT.team') }} A</label>
            <input v-model="teamA.name" class="team-input" type="text" :placeholder="`${t('TOURNAMENT.team')} A`" />
          </div>
          <div class="team-score">
            <button class="score-btn" type="button" @click="adjustScore('A', -1)">-1</button>
            <div class="score-value">{{ teamA.score }}</div>
            <button class="score-btn" type="button" @click="adjustScore('A', 1)">+1</button>
          </div>
          <div class="score-actions">
            <button class="btn-secondary" type="button" @click="adjustScore('A', 2)">+2</button>
            <button class="btn-secondary" type="button" @click="adjustScore('A', 3)">+3</button>
          </div>
        </div>

        <div class="team-card">
          <div class="team-header">
            <label class="team-label">{{ t('TOURNAMENT.team') }} B</label>
            <input v-model="teamB.name" class="team-input" type="text" :placeholder="`${t('TOURNAMENT.team')} B`" />
          </div>
          <div class="team-score">
            <button class="score-btn" type="button" @click="adjustScore('B', -1)">-1</button>
            <div class="score-value">{{ teamB.score }}</div>
            <button class="score-btn" type="button" @click="adjustScore('B', 1)">+1</button>
          </div>
          <div class="score-actions">
            <button class="btn-secondary" type="button" @click="adjustScore('B', 2)">+2</button>
            <button class="btn-secondary" type="button" @click="adjustScore('B', 3)">+3</button>
          </div>
        </div>
      </div>

      <!-- Score history -->
      <div v-if="history.length > 0" class="history-section">
        <h4>{{ t('SCORES.scoreHistory') }}</h4>
        <ul class="history-list">
          <li v-for="(entry, idx) in history" :key="idx" class="history-item">
            <span class="history-team">{{ entry.teamId === 'A' ? teamA.name || 'Team A' : teamB.name || 'Team B' }}</span>
            <span :class="['history-points', entry.points > 0 ? 'positive' : 'negative']">
              {{ entry.points > 0 ? '+' : '' }}{{ entry.points }}
            </span>
          </li>
        </ul>
      </div>

      <!-- Controls -->
      <div class="form-actions">
        <button class="btn-secondary" type="button" @click="resetScores">
          {{ t('SCORES.reset') }}
        </button>
      </div>
    </section>

    <!-- Save session -->
    <section class="card">
      <h3>{{ t('SCORES.save') }}</h3>
      <div class="form-group">
        <label>{{ t('SCORES.sessionName') }}</label>
        <input
          v-model="sessionName"
          class="form-input"
          type="text"
          :placeholder="t('SCORES.sessionNamePlaceholder')"
          maxlength="80"
        />
      </div>
      <div class="form-actions">
        <button class="btn-primary" :disabled="!canSave || saving" @click="saveSession">
          {{ saving ? '…' : t('SCORES.save') }}
        </button>
      </div>
      <p v-if="saveMessage" class="save-message">{{ saveMessage }}</p>
    </section>

    <!-- Saved sessions -->
    <section class="card">
      <h3>{{ t('SCORES.savedSessions') }}</h3>
      <p v-if="savedSessions.length === 0" class="empty-hint">{{ t('SCORES.noSessions') }}</p>
      <ul v-else class="sessions-list">
        <li v-for="session in savedSessions" :key="session.id" class="session-item">
          <div class="session-info">
            <span class="session-name">{{ session.sessionMetadata.sessionName }}</span>
            <span class="session-meta">
              {{ formatDate(session.createdAt) }}
              · {{ session.sessionMetadata.teams?.[0]?.name || 'A' }}
              {{ session.sessionMetadata.scores?.['A'] ?? 0 }}
              :
              {{ session.sessionMetadata.scores?.['B'] ?? 0 }}
              {{ session.sessionMetadata.teams?.[1]?.name || 'B' }}
            </span>
          </div>
          <button class="btn-secondary btn-small" @click="loadSession(session)">
            {{ t('SCORES.loadSession') }}
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getSportBridge, initializeSportBridge } from '../composables/useSportBridge'
import type { Sport } from '@viccoboard/core'
import type { ScoreboardSessionMetadata } from '@viccoboard/sport'

const { t } = useI18n()

initializeSportBridge()
const bridge = getSportBridge()

interface TeamState {
  id: string
  name: string
  score: number
}

interface HistoryEntry {
  teamId: 'A' | 'B'
  points: number
  type: 'add' | 'subtract' | 'set'
}

const teamA = ref<TeamState>({ id: 'A', name: '', score: 0 })
const teamB = ref<TeamState>({ id: 'B', name: '', score: 0 })
const history = ref<HistoryEntry[]>([])
const sessionName = ref('')
const saving = ref(false)
const saveMessage = ref('')
const savedSessions = ref<Sport.ToolSession[]>([])
const currentSessionId = ref<string | undefined>(undefined)

const canSave = computed(() => Boolean(sessionName.value.trim()))

function adjustScore(team: 'A' | 'B', delta: number) {
  const target = team === 'A' ? teamA.value : teamB.value
  target.score = Math.max(0, target.score + delta)
  history.value.push({
    teamId: team,
    points: delta,
    type: delta >= 0 ? 'add' : 'subtract'
  })
}

function resetScores() {
  teamA.value.score = 0
  teamB.value.score = 0
  history.value = []
  currentSessionId.value = undefined
  saveMessage.value = ''
}

async function saveSession() {
  if (!canSave.value) return
  saving.value = true
  saveMessage.value = ''
  try {
    const result = await bridge.saveScoreboardSessionUseCase.execute({
      sessionId: currentSessionId.value,
      sessionName: sessionName.value,
      teams: [
        { id: 'A', name: teamA.value.name || 'Team A' },
        { id: 'B', name: teamB.value.name || 'Team B' }
      ],
      scores: { A: teamA.value.score, B: teamB.value.score },
      history: history.value.map(h => ({ teamId: h.teamId, points: h.points, type: h.type }))
    })
    currentSessionId.value = result.id
    saveMessage.value = t('SCORES.saveSuccess')
    await loadSavedSessions()
  } finally {
    saving.value = false
  }
}

function loadSession(session: Sport.ToolSession) {
  const meta = session.sessionMetadata as ScoreboardSessionMetadata
  currentSessionId.value = session.id
  sessionName.value = meta.sessionName ?? ''
  const ta = meta.teams?.[0]
  const tb = meta.teams?.[1]
  teamA.value = { id: 'A', name: ta?.name ?? '', score: meta.scores?.['A'] ?? 0 }
  teamB.value = { id: 'B', name: tb?.name ?? '', score: meta.scores?.['B'] ?? 0 }
  history.value = (meta.history ?? []).map(h => ({
    teamId: h.teamId as 'A' | 'B',
    points: h.points,
    type: h.type
  }))
  saveMessage.value = ''
}

async function loadSavedSessions() {
  const all = await bridge.toolSessionRepository.findByToolType('scoreboard')
  savedSessions.value = all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString()
}

onMounted(loadSavedSessions)
</script>

<style scoped>
.scoreboard-view {
  max-width: 900px;
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

.card h3 {
  margin: 0 0 1rem;
}

.scoreboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.team-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.team-header {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.team-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #666;
}

.team-input {
  border-radius: 8px;
  border: 1px solid #ddd;
  padding: 0.6rem 0.8rem;
  font-size: 1rem;
}

.team-score {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1rem;
}

.score-value {
  font-size: 3rem;
  font-weight: 700;
  text-align: center;
}

.score-btn {
  border-radius: 50%;
  border: 1px solid #ccc;
  padding: 0.5rem 0.8rem;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;
}

.score-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.history-section {
  margin-top: 1.25rem;
  border-top: 1px solid #eee;
  padding-top: 1rem;
}

.history-section h4 {
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
  color: #555;
}

.history-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-height: 120px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  gap: 0.5rem;
  font-size: 0.85rem;
  padding: 0.2rem 0;
}

.history-team {
  font-weight: 600;
  flex: 1;
}

.positive { color: #16a34a; }
.negative { color: #dc2626; }

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  min-height: 44px;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  border: 2px solid #ddd;
  color: #333;
}

.btn-small {
  padding: 0.4rem 0.9rem;
  min-height: 36px;
  font-size: 0.875rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
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

.session-name {
  font-weight: 600;
}

.session-meta {
  font-size: 0.8rem;
  color: #666;
}

.empty-hint {
  color: #888;
  font-style: italic;
}

@media (max-width: 600px) {
  .session-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
