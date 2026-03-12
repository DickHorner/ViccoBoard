<template>
  <div class="scoreboard-view">
    <div class="page-header">
      <button class="back-button" type="button" @click="$router.back()">← {{ t('COMMON.back') }}</button>
      <div>
        <h2>{{ t('SCORES.title') }}</h2>
        <p class="page-description">{{ t('SCORES.description') }}</p>
      </div>
    </div>

    <section class="card setup-card">
      <div class="setup-grid">
        <div class="form-group">
          <label for="scoreboard-class">{{ t('SCORES.classGroup') }}</label>
          <select id="scoreboard-class" v-model="selectedClassId" class="form-input">
            <option value="">{{ t('SCORES.noClassBinding') }}</option>
            <option v-for="classGroup in classes" :key="classGroup.id" :value="classGroup.id">
              {{ classGroup.name }} ({{ classGroup.schoolYear }})
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="team-session">{{ t('SCORES.importTeams') }}</label>
          <select
            id="team-session"
            v-model="selectedTeamSessionId"
            class="form-input"
            :disabled="availableTeamSessions.length === 0"
          >
            <option value="">{{ availableTeamSessions.length === 0 ? t('SCORES.noTeamSessions') : t('SCORES.importTeamsPlaceholder') }}</option>
            <option v-for="session in availableTeamSessions" :key="session.id" :value="session.id">
              {{ teamSessionLabel(session) }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="timer-session">{{ t('SCORES.timerLink') }}</label>
          <select
            id="timer-session"
            v-model="linkedTimerSessionId"
            class="form-input"
            :disabled="availableTimerSessions.length === 0"
          >
            <option value="">{{ availableTimerSessions.length === 0 ? t('SCORES.noTimerSessions') : t('SCORES.timerLinkPlaceholder') }}</option>
            <option v-for="session in availableTimerSessions" :key="session.id" :value="session.id">
              {{ timerSessionLabel(session) }}
            </option>
          </select>
        </div>
      </div>
    </section>

    <section class="card">
      <div class="scoreboard-grid">
        <article class="team-card">
          <div class="team-header">
            <label class="team-label" for="team-a">{{ t('TOURNAMENT.team') }} A</label>
            <input
              id="team-a"
              v-model="teamA.name"
              class="team-input"
              type="text"
              :placeholder="`${t('TOURNAMENT.team')} A`"
            />
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
        </article>

        <article class="team-card">
          <div class="team-header">
            <label class="team-label" for="team-b">{{ t('TOURNAMENT.team') }} B</label>
            <input
              id="team-b"
              v-model="teamB.name"
              class="team-input"
              type="text"
              :placeholder="`${t('TOURNAMENT.team')} B`"
            />
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
        </article>
      </div>

      <div v-if="linkedTimerSummary" class="info-banner">
        {{ linkedTimerSummary }}
      </div>

      <div v-if="history.length > 0" class="history-section">
        <div class="section-header">
          <h3>{{ t('SCORES.scoreHistory') }}</h3>
          <span class="history-count">{{ history.length }}</span>
        </div>
        <ul class="history-list">
          <li v-for="entry in history" :key="entry.timestamp + entry.teamId + entry.points" class="history-item">
            <div>
              <strong>{{ displayTeamName(entry.teamId) }}</strong>
              <span class="history-description">{{ entry.description }}</span>
            </div>
            <div class="history-meta">
              <span :class="['history-points', entry.points >= 0 ? 'positive' : 'negative']">
                {{ entry.points >= 0 ? '+' : '' }}{{ entry.points }}
              </span>
              <span>{{ formatDateTime(entry.timestamp) }}</span>
            </div>
          </li>
        </ul>
      </div>

      <div class="form-actions">
        <button class="btn-secondary" type="button" @click="resetBoard">{{ t('SCORES.reset') }}</button>
      </div>
    </section>

    <section class="card">
      <div class="section-header">
        <h3>{{ t('SCORES.saveSession') }}</h3>
        <span v-if="currentSessionId" class="session-badge">{{ t('SCORES.existingSession') }}</span>
      </div>
      <div class="form-group">
        <label for="session-name">{{ t('SCORES.sessionName') }}</label>
        <input
          id="session-name"
          v-model="sessionName"
          class="form-input"
          type="text"
          :placeholder="t('SCORES.sessionNamePlaceholder')"
          maxlength="80"
        />
      </div>
      <div class="form-actions">
        <button class="btn-primary" type="button" :disabled="!canSave || saving" @click="saveSession">
          {{ saving ? '…' : t('SCORES.save') }}
        </button>
      </div>
      <p v-if="message" class="info-text">{{ message }}</p>
    </section>

    <section class="card">
      <h3>{{ t('SCORES.savedSessions') }}</h3>
      <p v-if="savedSessions.length === 0" class="empty-hint">{{ t('SCORES.noSessions') }}</p>
      <ul v-else class="sessions-list">
        <li v-for="session in savedSessions" :key="session.id" class="session-item">
          <div class="session-info">
            <strong>{{ scoreboardSessionName(session) }}</strong>
            <span class="session-meta">{{ scoreboardSessionSummary(session) }}</span>
          </div>
          <button class="btn-secondary btn-small" type="button" @click="loadSession(session)">
            {{ t('SCORES.loadSession') }}
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ClassGroup, Sport } from '@viccoboard/core';
import type { ScoreboardSessionMetadata, TeamSessionMetadata } from '@viccoboard/sport';
import { getSportBridge, initializeSportBridge } from '../composables/useSportBridge';

initializeSportBridge();

const { t } = useI18n();
const bridge = getSportBridge();

interface TeamState {
  id: string;
  name: string;
  score: number;
}

interface ScoreHistoryEntry {
  teamId: string;
  points: number;
  type: 'add' | 'subtract' | 'set';
  description: string;
  timestamp: string;
}

const classes = ref<ClassGroup[]>([]);
const selectedClassId = ref('');
const selectedTeamSessionId = ref('');
const linkedTimerSessionId = ref('');
const availableTeamSessions = ref<Sport.ToolSession[]>([]);
const availableTimerSessions = ref<Sport.ToolSession[]>([]);
const savedSessions = ref<Sport.ToolSession[]>([]);
const currentSessionId = ref<string>();
const sessionName = ref('');
const saving = ref(false);
const message = ref('');

const teamA = ref<TeamState>({ id: 'team-a', name: '', score: 0 });
const teamB = ref<TeamState>({ id: 'team-b', name: '', score: 0 });
const history = ref<ScoreHistoryEntry[]>([]);

const canSave = computed(() => {
  return Boolean(
    sessionName.value.trim() &&
      (teamA.value.name.trim() || teamB.value.name.trim() || history.value.length > 0)
  );
});

const linkedTimerSummary = computed(() => {
  if (!linkedTimerSessionId.value) {
    return '';
  }

  const session = availableTimerSessions.value.find(item => item.id === linkedTimerSessionId.value);
  if (!session) {
    return '';
  }

  const mode = String(session.sessionMetadata.mode ?? 'timer');
  return t('SCORES.timerLinkedSummary', { timer: timerSessionLabel(session), mode });
});

watch(selectedClassId, async () => {
  await refreshContextSessions();
}, { immediate: false });

watch(selectedTeamSessionId, () => {
  if (selectedTeamSessionId.value) {
    importTeamSession(selectedTeamSessionId.value);
  }
});

async function loadClasses(): Promise<void> {
  classes.value = await bridge.classGroupRepository.findAll();
}

async function refreshContextSessions(): Promise<void> {
  const sessions = selectedClassId.value
    ? await bridge.toolSessionRepository.findByClassGroup(selectedClassId.value)
    : await bridge.toolSessionRepository.findAll();

  const sorted = [...sessions].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  availableTeamSessions.value = sorted.filter(session => session.toolType === 'teams');
  availableTimerSessions.value = sorted.filter(session => session.toolType === 'timer');
  savedSessions.value = sorted.filter(session => session.toolType === 'scoreboard');

  if (
    linkedTimerSessionId.value &&
    !availableTimerSessions.value.some(session => session.id === linkedTimerSessionId.value)
  ) {
    linkedTimerSessionId.value = '';
  }

  if (
    selectedTeamSessionId.value &&
    !availableTeamSessions.value.some(session => session.id === selectedTeamSessionId.value)
  ) {
    selectedTeamSessionId.value = '';
  }
}

function adjustScore(side: 'A' | 'B', delta: number): void {
  const team = side === 'A' ? teamA.value : teamB.value;
  const nextScore = Math.max(0, team.score + delta);
  const appliedDelta = nextScore - team.score;

  if (appliedDelta === 0) {
    return;
  }

  team.score = nextScore;
  history.value.unshift({
    teamId: team.id,
    points: appliedDelta,
    type: appliedDelta >= 0 ? 'add' : 'subtract',
    description: appliedDelta >= 0 ? t('SCORES.eventAdded') : t('SCORES.eventRemoved'),
    timestamp: new Date().toISOString()
  });
  message.value = '';
}

function resetBoard(): void {
  teamA.value.score = 0;
  teamB.value.score = 0;
  history.value = [];
  currentSessionId.value = undefined;
  message.value = '';
}

async function saveSession(): Promise<void> {
  if (!canSave.value) {
    return;
  }

  saving.value = true;

  try {
    const result = await bridge.saveScoreboardSessionUseCase.execute({
      sessionId: currentSessionId.value,
      classGroupId: selectedClassId.value || undefined,
      sessionName: sessionName.value,
      teams: [
        { id: teamA.value.id, name: displayTeamName(teamA.value.id) },
        { id: teamB.value.id, name: displayTeamName(teamB.value.id) }
      ],
      scores: {
        [teamA.value.id]: teamA.value.score,
        [teamB.value.id]: teamB.value.score
      },
      history: history.value,
      linkedTeamSessionId: selectedTeamSessionId.value || undefined,
      linkedTimerSessionId: linkedTimerSessionId.value || undefined
    });

    currentSessionId.value = result.id;
    sessionName.value = String(result.sessionMetadata.sessionName ?? sessionName.value);
    message.value = t('SCORES.saveSuccess');

    if (!selectedClassId.value && result.classGroupId) {
      selectedClassId.value = result.classGroupId;
    }

    await refreshContextSessions();
  } finally {
    saving.value = false;
  }
}

function loadSession(session: Sport.ToolSession): void {
  const metadata = session.sessionMetadata as ScoreboardSessionMetadata;
  const savedTeams = metadata.teams ?? [];
  const firstTeam = savedTeams[0];
  const secondTeam = savedTeams[1];

  currentSessionId.value = session.id;
  selectedClassId.value = session.classGroupId ?? '';
  sessionName.value = metadata.sessionName ?? '';
  selectedTeamSessionId.value = metadata.linkedTeamSessionId ?? '';
  linkedTimerSessionId.value = metadata.linkedTimerSessionId ?? '';
  teamA.value = {
    id: firstTeam?.id ?? 'team-a',
    name: firstTeam?.name ?? '',
    score: metadata.scores?.[firstTeam?.id ?? 'team-a'] ?? 0
  };
  teamB.value = {
    id: secondTeam?.id ?? 'team-b',
    name: secondTeam?.name ?? '',
    score: metadata.scores?.[secondTeam?.id ?? 'team-b'] ?? 0
  };
  history.value = (metadata.history ?? []).map(entry => ({
    teamId: entry.teamId,
    points: entry.points,
    type: entry.type,
    description: entry.description ?? '',
    timestamp: entry.timestamp
  }));
  message.value = '';
}

function importTeamSession(sessionId: string): void {
  const session = availableTeamSessions.value.find(item => item.id === sessionId);

  if (!session) {
    return;
  }

  const metadata = session.sessionMetadata as TeamSessionMetadata;
  const importedTeams = metadata.teams ?? [];

  if (importedTeams.length < 2) {
    message.value = t('SCORES.noTeamSessions');
    return;
  }

  teamA.value = {
    id: importedTeams[0].id,
    name: importedTeams[0].name,
    score: 0
  };
  teamB.value = {
    id: importedTeams[1].id,
    name: importedTeams[1].name,
    score: 0
  };
  currentSessionId.value = undefined;
  history.value = [];
  sessionName.value = sessionName.value || metadata.sessionName || `${importedTeams[0].name} vs ${importedTeams[1].name}`;
  message.value = importedTeams.length > 2 ? t('SCORES.importedTeamsNotice') : '';
}

function displayTeamName(teamId: string): string {
  if (teamA.value.id === teamId) {
    return teamA.value.name.trim() || `${t('TOURNAMENT.team')} A`;
  }

  if (teamB.value.id === teamId) {
    return teamB.value.name.trim() || `${t('TOURNAMENT.team')} B`;
  }

  return teamId;
}

function scoreboardSessionName(session: Sport.ToolSession): string {
  const metadata = session.sessionMetadata as ScoreboardSessionMetadata;
  return String(metadata.sessionName ?? t('SCORES.title'));
}

function scoreboardSessionSummary(session: Sport.ToolSession): string {
  const metadata = session.sessionMetadata as ScoreboardSessionMetadata;
  const firstTeam = metadata.teams?.[0];
  const secondTeam = metadata.teams?.[1];
  const firstName = firstTeam?.name ?? `${t('TOURNAMENT.team')} A`;
  const secondName = secondTeam?.name ?? `${t('TOURNAMENT.team')} B`;
  const firstScore = metadata.scores?.[firstTeam?.id ?? 'team-a'] ?? 0;
  const secondScore = metadata.scores?.[secondTeam?.id ?? 'team-b'] ?? 0;
  return `${formatDateTime(session.createdAt)} · ${firstName} ${firstScore}:${secondScore} ${secondName}`;
}

function teamSessionLabel(session: Sport.ToolSession): string {
  const metadata = session.sessionMetadata as TeamSessionMetadata;
  const teamNames = (metadata.teams ?? []).slice(0, 3).map(team => team.name).join(', ');
  return `${metadata.sessionName ?? t('TEAM.session-name')} · ${teamNames}`;
}

function timerSessionLabel(session: Sport.ToolSession): string {
  const mode = String(session.sessionMetadata.mode ?? 'timer');
  const elapsedMs = Number(session.sessionMetadata.elapsedMs ?? 0);
  return `${mode} · ${formatDuration(elapsedMs)} · ${formatDateTime(session.createdAt)}`;
}

function formatDateTime(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

onMounted(async () => {
  await loadClasses();
  await refreshContextSessions();
});
</script>

<style scoped>
.scoreboard-view {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.page-header h2 {
  margin: 0;
}

.page-description {
  margin: 0.25rem 0 0;
  color: var(--color-muted);
}

.back-button {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: 1rem;
  cursor: pointer;
  padding: 0.75rem 0;
  min-height: 44px;
}

.card {
  background: white;
  border-radius: 18px;
  padding: 1.5rem;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.setup-grid,
.scoreboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.team-card {
  background: var(--surface-soft);
  border-radius: 18px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.team-header,
.form-group,
.session-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.team-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-muted);
}

.team-input,
.form-input {
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.15);
  padding: 0.7rem 0.9rem;
  font-size: 1rem;
  width: 100%;
}

.team-score {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1rem;
}

.score-value {
  font-size: 3.5rem;
  font-weight: 700;
  text-align: center;
}

.score-btn {
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.2);
  min-width: 48px;
  min-height: 48px;
  background: white;
  cursor: pointer;
}

.score-actions,
.form-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
  min-height: 44px;
  padding: 0.75rem 1.2rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  border: none;
  background: var(--color-primary);
  color: white;
}

.btn-secondary {
  border: 1px solid rgba(15, 23, 42, 0.15);
  background: white;
  color: inherit;
}

.btn-small {
  min-height: 38px;
  padding: 0.55rem 0.9rem;
}

.info-banner,
.info-text {
  margin-top: 1rem;
  color: var(--color-muted);
}

.history-section {
  margin-top: 1.5rem;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
  padding-top: 1rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.history-count,
.session-badge {
  background: var(--surface-soft);
  border-radius: 999px;
  padding: 0.3rem 0.7rem;
  font-size: 0.85rem;
}

.history-list,
.sessions-list {
  list-style: none;
  padding: 0;
  margin: 1rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.history-item,
.session-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1rem;
  border-radius: 14px;
  background: var(--surface-soft);
}

.history-description,
.session-meta,
.empty-hint {
  color: var(--color-muted);
  font-size: 0.9rem;
}

.history-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
  white-space: nowrap;
}

.history-points {
  font-weight: 700;
}

.positive {
  color: #15803d;
}

.negative {
  color: #b91c1c;
}

@media (max-width: 720px) {
  .page-header,
  .history-item,
  .session-item,
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .history-meta {
    align-items: flex-start;
  }
}
</style>
