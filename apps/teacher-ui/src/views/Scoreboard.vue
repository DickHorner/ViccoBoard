<template>
  <!-- =========================================================
       PRESENTER MODE — full-screen large display
       ========================================================= -->
  <div v-if="viewMode === 'presenter'" class="presenter-overlay">
    <!-- Presenter header: timer + controls -->
    <div class="presenter-header">
      <button class="ph-btn ph-btn--back" type="button" @click="viewMode = 'manage'">
        ← {{ t('SCORES.manageMode') }}
      </button>

      <div class="ph-timer" :class="{ 'ph-timer--running': timerRunning }">
        <span class="ph-timer-display">{{ formatDuration(timerElapsedMs) }}</span>
        <button
          v-if="!timerRunning"
          class="ph-btn ph-btn--sm"
          type="button"
          @click="startTimer"
        >{{ t('SCORES.timerStart') }}</button>
        <button
          v-else
          class="ph-btn ph-btn--sm"
          type="button"
          @click="pauseTimer"
        >{{ t('SCORES.timerPause') }}</button>
        <button class="ph-btn ph-btn--sm" type="button" @click="resetTimer">
          {{ t('SCORES.timerReset') }}
        </button>
      </div>

      <div class="ph-layout-toggle">
        <button
          :class="['ph-btn ph-btn--sm', { active: layout === 2 }]"
          type="button"
          @click="setLayout(2)"
        >{{ t('SCORES.layout2') }}</button>
        <button
          :class="['ph-btn ph-btn--sm', { active: layout === 4 }]"
          type="button"
          @click="setLayout(4)"
        >{{ t('SCORES.layout4') }}</button>
      </div>
    </div>

    <!-- Presenter board -->
    <div :class="['presenter-board', `presenter-board--${layout}`]">
      <article
        v-for="team in activeTeams"
        :key="team.id"
        class="presenter-team"
        :style="{ background: team.color }"
      >
        <div class="presenter-team-name">{{ team.name || `Team ${team.slot}` }}</div>
        <div class="presenter-score-row">
          <button
            class="presenter-score-btn"
            type="button"
            @click="adjustScore(team.id, -1)"
          >&#x2212;1</button>
          <div class="presenter-score-value">{{ scores[team.id] ?? 0 }}</div>
          <button
            class="presenter-score-btn presenter-score-btn--plus"
            type="button"
            @click="adjustScore(team.id, 1)"
          >+1</button>
        </div>
        <div class="presenter-extra-btns">
          <button class="presenter-extra-btn" type="button" @click="adjustScore(team.id, 2)">+2</button>
          <button class="presenter-extra-btn" type="button" @click="adjustScore(team.id, 3)">+3</button>
        </div>
      </article>
    </div>
  </div>

  <!-- =========================================================
       MANAGE MODE — setup / save / load
       ========================================================= -->
  <div v-else class="scoreboard-view">
    <div class="page-header">
      <button class="back-button" type="button" @click="$router.back()">{{ '\u2190' }} {{ t('COMMON.back') }}</button>
      <div>
        <h2>{{ t('SCORES.title') }}</h2>
        <p class="page-description">{{ t('SCORES.description') }}</p>
      </div>
      <button class="btn-primary" type="button" @click="viewMode = 'presenter'">
        {{ t('SCORES.presenterMode') }}
      </button>
    </div>

    <!-- Setup card -->
    <section class="card">
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

    <!-- Layout + Teams card -->
    <section class="card">
      <div class="section-header">
        <h3>{{ t('SCORES.layoutToggle') }}</h3>
        <div class="layout-toggle-group">
          <button
            :class="['btn-toggle', { active: layout === 2 }]"
            type="button"
            @click="setLayout(2)"
          >{{ t('SCORES.layout2') }}</button>
          <button
            :class="['btn-toggle', { active: layout === 4 }]"
            type="button"
            @click="setLayout(4)"
          >{{ t('SCORES.layout4') }}</button>
        </div>
      </div>

      <div :class="['scoreboard-grid', layout === 4 ? 'scoreboard-grid--4' : '']">
        <article
          v-for="team in activeTeams"
          :key="team.id"
          class="team-card"
          :style="{ borderTop: `4px solid ${team.color}` }"
        >
          <div class="team-header">
            <input
              v-model="team.name"
              class="team-input"
              type="text"
              :placeholder="`${t('SCORES.teamNamePlaceholder')} ${team.slot}`"
            />
            <div class="color-picker-row">
              <button
                v-for="col in TEAM_COLORS"
                :key="col.value"
                class="color-swatch"
                :style="{ background: col.value, outline: team.color === col.value ? '3px solid #0f172a' : 'none' }"
                :title="col.label"
                type="button"
                @click="team.color = col.value"
              />
            </div>
          </div>
          <div class="team-score">
            <button class="score-btn" type="button" @click="adjustScore(team.id, -1)">&#x2212;1</button>
            <div class="score-value">{{ scores[team.id] ?? 0 }}</div>
            <button class="score-btn" type="button" @click="adjustScore(team.id, 1)">+1</button>
          </div>
          <div class="score-actions">
            <button class="btn-secondary" type="button" @click="adjustScore(team.id, 2)">+2</button>
            <button class="btn-secondary" type="button" @click="adjustScore(team.id, 3)">+3</button>
          </div>
        </article>
      </div>

      <!-- Inline timer -->
      <div class="inline-timer-bar">
        <span class="timer-label">{{ t('SCORES.inlineTimer') }}:</span>
        <span class="timer-value" :class="{ 'timer-value--running': timerRunning }">{{ formatDuration(timerElapsedMs) }}</span>
        <button v-if="!timerRunning" class="btn-secondary btn-small" type="button" @click="startTimer">{{ t('SCORES.timerStart') }}</button>
        <button v-else class="btn-secondary btn-small" type="button" @click="pauseTimer">{{ t('SCORES.timerPause') }}</button>
        <button class="btn-secondary btn-small" type="button" @click="resetTimer">{{ t('SCORES.timerReset') }}</button>
      </div>

      <div v-if="linkedTimerSummary" class="info-banner">
        {{ linkedTimerSummary }}
      </div>

      <!-- Event log -->
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

    <!-- Tournament handoff -->
    <section class="card">
      <div class="section-header">
        <h3>{{ t('SCORES.sendToTournament') }}</h3>
      </div>
      <p class="info-text">{{ t('SCORES.tournamentHandoffHint') }}</p>
      <div class="form-actions">
        <button class="btn-secondary" type="button" @click="handoffToTournament">
          {{ t('SCORES.sendToTournament') }}
        </button>
      </div>
    </section>

    <!-- Live mode section -->
    <section class="card">
      <div class="section-header">
        <h3>{{ t('SCORES.liveMode') }}</h3>
        <span class="session-badge">{{ t('SCORES.liveModeOff') }}</span>
      </div>
      <p class="info-text">{{ t('SCORES.liveModeHint') }}</p>
    </section>

    <!-- Save session -->
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
          {{ saving ? '...' : t('SCORES.save') }}
        </button>
      </div>
      <p v-if="message" class="info-text">{{ message }}</p>
    </section>

    <!-- Saved sessions -->
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
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import type { ClassGroup, Sport } from '@viccoboard/core';
import type { ScoreboardSessionMetadata, TeamSessionMetadata } from '@viccoboard/sport';
import { getSportBridge, initializeSportBridge } from '../composables/useSportBridge';

initializeSportBridge();

const { t } = useI18n();
const router = useRouter();
const bridge = getSportBridge();

// ─── Constants ────────────────────────────────────────────────────────────────

const TEAM_COLORS = [
  { value: '#3b82f6', label: 'Blau' },
  { value: '#ef4444', label: 'Rot' },
  { value: '#22c55e', label: 'Grün' },
  { value: '#f59e0b', label: 'Gelb' },
  { value: '#a855f7', label: 'Lila' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#f97316', label: 'Orange' },
];

const DEFAULT_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b'];

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamState {
  id: string;
  slot: number;
  name: string;
  color: string;
}

interface ScoreHistoryEntry {
  teamId: string;
  points: number;
  type: 'add' | 'subtract' | 'set';
  description: string;
  timestamp: string;
}

// ─── UI state ─────────────────────────────────────────────────────────────────

const viewMode = ref<'manage' | 'presenter'>('manage');
const layout = ref<2 | 4>(2);

// ─── Teams ────────────────────────────────────────────────────────────────────

function makeTeam(slot: number): TeamState {
  return {
    id: `team-${slot}`,
    slot,
    name: '',
    color: DEFAULT_COLORS[(slot - 1) % DEFAULT_COLORS.length],
  };
}

const allTeams = ref<TeamState[]>([makeTeam(1), makeTeam(2), makeTeam(3), makeTeam(4)]);

const activeTeams = computed(() => allTeams.value.slice(0, layout.value));

// ─── Scores ───────────────────────────────────────────────────────────────────

const scores = ref<Record<string, number>>({
  'team-1': 0,
  'team-2': 0,
  'team-3': 0,
  'team-4': 0,
});

function setLayout(n: 2 | 4): void {
  layout.value = n;
}

// ─── History ──────────────────────────────────────────────────────────────────

const history = ref<ScoreHistoryEntry[]>([]);

// ─── Context state ────────────────────────────────────────────────────────────

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

// ─── Inline timer ─────────────────────────────────────────────────────────────

const timerElapsedMs = ref(0);
const timerRunning = ref(false);
// In browser environments setInterval returns a number; avoid NodeJS.Timeout confusion.
let timerIntervalHandle: number | undefined;
let timerLastTick: number | undefined;

function startTimer(): void {
  if (timerRunning.value) return;
  timerRunning.value = true;
  timerLastTick = Date.now();
  timerIntervalHandle = window.setInterval(() => {
    const now = Date.now();
    timerElapsedMs.value += now - (timerLastTick ?? now);
    timerLastTick = now;
  }, 200);
}

function pauseTimer(): void {
  timerRunning.value = false;
  window.clearInterval(timerIntervalHandle);
  timerIntervalHandle = undefined;
}

function resetTimer(): void {
  pauseTimer();
  timerElapsedMs.value = 0;
}

// ─── Computed ─────────────────────────────────────────────────────────────────

const canSave = computed(() => {
  const hasAnyTeamName = allTeams.value.slice(0, layout.value).some(team => team.name.trim());
  return Boolean(sessionName.value.trim() && (hasAnyTeamName || history.value.length > 0));
});

const linkedTimerSummary = computed(() => {
  if (!linkedTimerSessionId.value) return '';
  const session = availableTimerSessions.value.find(item => item.id === linkedTimerSessionId.value);
  if (!session) return '';
  const mode = String(session.sessionMetadata.mode ?? 'timer');
  return t('SCORES.timerLinkedSummary', { timer: timerSessionLabel(session), mode });
});

// ─── Watchers ─────────────────────────────────────────────────────────────────

watch(selectedClassId, async () => { await refreshContextSessions(); }, { immediate: false });

watch(selectedTeamSessionId, () => {
  if (selectedTeamSessionId.value) importTeamSession(selectedTeamSessionId.value);
});

// ─── Data loading ─────────────────────────────────────────────────────────────

async function loadClasses(): Promise<void> {
  classes.value = await bridge.classGroupRepository.findAll();
}

async function refreshContextSessions(): Promise<void> {
  const sessions = selectedClassId.value
    ? await bridge.toolSessionRepository.findByClassGroup(selectedClassId.value)
    : await bridge.toolSessionRepository.findAll();

  const sorted = [...sessions].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  availableTeamSessions.value = sorted.filter(s => s.toolType === 'teams');
  availableTimerSessions.value = sorted.filter(s => s.toolType === 'timer');
  savedSessions.value = sorted.filter(s => s.toolType === 'scoreboard');

  if (linkedTimerSessionId.value && !availableTimerSessions.value.some(s => s.id === linkedTimerSessionId.value)) {
    linkedTimerSessionId.value = '';
  }
  if (selectedTeamSessionId.value && !availableTeamSessions.value.some(s => s.id === selectedTeamSessionId.value)) {
    selectedTeamSessionId.value = '';
  }
}

// ─── Score manipulation ───────────────────────────────────────────────────────

function adjustScore(teamId: string, delta: number): void {
  const current = scores.value[teamId] ?? 0;
  const next = Math.max(0, current + delta);
  const applied = next - current;
  if (applied === 0) return;

  scores.value = { ...scores.value, [teamId]: next };
  history.value.unshift({
    teamId,
    points: applied,
    type: applied >= 0 ? 'add' : 'subtract',
    description: applied >= 0 ? t('SCORES.eventAdded') : t('SCORES.eventRemoved'),
    timestamp: new Date().toISOString(),
  });
  message.value = '';
}

function resetBoard(): void {
  scores.value = { 'team-1': 0, 'team-2': 0, 'team-3': 0, 'team-4': 0 };
  history.value = [];
  currentSessionId.value = undefined;
  resetTimer();
  message.value = '';
}

// ─── Save / Load ──────────────────────────────────────────────────────────────

async function saveSession(): Promise<void> {
  if (!canSave.value) return;
  saving.value = true;
  try {
    const teamsForSave = allTeams.value.slice(0, layout.value).map(team => ({
      id: team.id,
      name: team.name.trim() || `${t('SCORES.teamNamePlaceholder')} ${team.slot}`,
      color: team.color,
    }));
    const scoresForSave: Record<string, number> = {};
    for (const team of teamsForSave) scoresForSave[team.id] = scores.value[team.id] ?? 0;

    const result = await bridge.saveScoreboardSessionUseCase.execute({
      sessionId: currentSessionId.value,
      classGroupId: selectedClassId.value || undefined,
      sessionName: sessionName.value,
      teams: teamsForSave,
      scores: scoresForSave,
      history: history.value,
      linkedTeamSessionId: selectedTeamSessionId.value || undefined,
      linkedTimerSessionId: linkedTimerSessionId.value || undefined,
      layout: layout.value,
      inlineTimer: { elapsedMs: timerElapsedMs.value, running: false },
    });

    currentSessionId.value = result.id;
    sessionName.value = String(result.sessionMetadata.sessionName ?? sessionName.value);
    message.value = t('SCORES.saveSuccess');
    if (!selectedClassId.value && result.classGroupId) selectedClassId.value = result.classGroupId;
    await refreshContextSessions();
  } finally {
    saving.value = false;
  }
}

function loadSession(session: Sport.ToolSession): void {
  const metadata = session.sessionMetadata as ScoreboardSessionMetadata;
  const savedTeams = metadata.teams ?? [];

  currentSessionId.value = session.id;
  selectedClassId.value = session.classGroupId ?? '';
  sessionName.value = metadata.sessionName ?? '';
  selectedTeamSessionId.value = metadata.linkedTeamSessionId ?? '';
  linkedTimerSessionId.value = metadata.linkedTimerSessionId ?? '';

  const savedLayout = (metadata.layout === 4 ? 4 : 2) as 2 | 4;
  layout.value = savedLayout;

  const rebuilt: TeamState[] = [];
  for (let i = 0; i < 4; i++) {
    const saved = savedTeams[i];
    rebuilt.push({
      id: saved?.id ?? `team-${i + 1}`,
      slot: i + 1,
      name: saved?.name ?? '',
      color: saved?.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    });
  }
  allTeams.value = rebuilt;

  const newScores: Record<string, number> = {};
  for (const team of rebuilt) {
    newScores[team.id] = metadata.scores?.[team.id] ?? 0;
  }
  scores.value = newScores;

  history.value = (metadata.history ?? []).map(entry => ({
    teamId: entry.teamId,
    points: entry.points,
    type: entry.type,
    description: entry.description ?? '',
    timestamp: entry.timestamp,
  }));

  resetTimer();
  if (metadata.inlineTimer) {
    timerElapsedMs.value = metadata.inlineTimer.elapsedMs;
  }

  message.value = '';
}

// ─── Team import from TeamBuilder session ─────────────────────────────────────

function importTeamSession(sessionId: string): void {
  const session = availableTeamSessions.value.find(item => item.id === sessionId);
  if (!session) return;

  const metadata = session.sessionMetadata as TeamSessionMetadata;
  const importedTeams = metadata.teams ?? [];
  if (importedTeams.length < 2) {
    message.value = t('SCORES.noTeamSessions');
    return;
  }

  // Use 4-slot layout for ≥4 teams, 2-slot layout for 2–3 teams.
  // Teams beyond the active layout count are excluded from display but
  // allTeams keeps all 4 slots so switching layouts restores them.
  const useCount = (importedTeams.length >= 4 ? 4 : 2) as 2 | 4;
  layout.value = useCount;

  const rebuilt: TeamState[] = [];
  for (let i = 0; i < 4; i++) {
    const src = importedTeams[i];
    rebuilt.push({
      id: src?.id ?? `team-${i + 1}`,
      slot: i + 1,
      name: src?.name ?? '',
      color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    });
  }
  allTeams.value = rebuilt;
  scores.value = { 'team-1': 0, 'team-2': 0, 'team-3': 0, 'team-4': 0 };
  currentSessionId.value = undefined;
  history.value = [];
  resetTimer();
  sessionName.value = sessionName.value || metadata.sessionName || '';
  message.value = importedTeams.length > useCount ? t('SCORES.importedTeamsNotice') : '';
}

// ─── Tournament handoff ───────────────────────────────────────────────────────

function handoffToTournament(): void {
  const teamNames = activeTeams.value.map(team => team.name.trim() || `${t('SCORES.teamNamePlaceholder')} ${team.slot}`);
  sessionStorage.setItem('scoreboard_handoff_teams', JSON.stringify(teamNames));
  router.push({ name: 'tournaments' });
}

// ─── Display helpers ──────────────────────────────────────────────────────────

function displayTeamName(teamId: string): string {
  const team = allTeams.value.find(t => t.id === teamId);
  return team?.name.trim() || `${t('SCORES.teamNamePlaceholder')} ${team?.slot ?? teamId}`;
}

function scoreboardSessionName(session: Sport.ToolSession): string {
  const metadata = session.sessionMetadata as ScoreboardSessionMetadata;
  return String(metadata.sessionName ?? t('SCORES.title'));
}

function scoreboardSessionSummary(session: Sport.ToolSession): string {
  const metadata = session.sessionMetadata as ScoreboardSessionMetadata;
  const teams = metadata.teams ?? [];
  const parts = teams.map(team => `${team.name} ${metadata.scores?.[team.id] ?? 0}`).join(' | ');
  return `${formatDateTime(session.createdAt)} \u00b7 ${parts}`;
}

function teamSessionLabel(session: Sport.ToolSession): string {
  const metadata = session.sessionMetadata as TeamSessionMetadata;
  const teamNames = (metadata.teams ?? []).slice(0, 3).map(team => team.name).join(', ');
  return `${metadata.sessionName ?? t('TEAM.session-name')} \u00b7 ${teamNames}`;
}

function timerSessionLabel(session: Sport.ToolSession): string {
  const mode = String(session.sessionMetadata.mode ?? 'timer');
  const elapsedMs = Number(session.sessionMetadata.elapsedMs ?? 0);
  return `${mode} \u00b7 ${formatDuration(elapsedMs)} \u00b7 ${formatDateTime(session.createdAt)}`;
}

function formatDateTime(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(async () => {
  await loadClasses();
  await refreshContextSessions();
});

onUnmounted(() => {
  window.clearInterval(timerIntervalHandle);
});
</script>

<style scoped>
/* ─── Shared ──────────────────────────────────────────────────────────────── */
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
  flex-wrap: wrap;
}

.page-header h2 { margin: 0; }
.page-description { margin: 0.25rem 0 0; color: var(--color-muted); }

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

.form-group { display: flex; flex-direction: column; gap: 0.5rem; }
.form-input, .team-input {
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.15);
  padding: 0.7rem 0.9rem;
  font-size: 1rem;
  width: 100%;
  box-sizing: border-box;
}

.form-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1rem; }

.btn-primary,
.btn-secondary {
  min-height: 44px;
  padding: 0.75rem 1.2rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
}
.btn-primary { border: none; background: var(--color-primary); color: white; }
.btn-secondary { border: 1px solid rgba(15, 23, 42, 0.15); background: white; color: inherit; }
.btn-small { min-height: 38px; padding: 0.55rem 0.9rem; }

.btn-toggle {
  min-height: 38px;
  padding: 0.5rem 1rem;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.2);
  background: white;
  cursor: pointer;
  font-weight: 600;
}
.btn-toggle.active { background: var(--color-primary); color: white; border-color: var(--color-primary); }

.info-banner,
.info-text { color: var(--color-muted); }
.empty-hint { color: var(--color-muted); font-size: 0.9rem; }

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.session-badge,
.history-count {
  background: var(--surface-soft);
  border-radius: 999px;
  padding: 0.3rem 0.7rem;
  font-size: 0.85rem;
}

.setup-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; }

/* ─── Layout toggle ─────────────────────────────────────────────────────────── */
.layout-toggle-group { display: flex; gap: 0.5rem; }

/* ─── Team card grid ─────────────────────────────────────────────────────────── */
.scoreboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-top: 1rem;
}
.scoreboard-grid--4 { grid-template-columns: repeat(2, 1fr); }
@media (min-width: 900px) {
  .scoreboard-grid--4 { grid-template-columns: repeat(4, 1fr); }
}

.team-card {
  background: var(--surface-soft);
  border-radius: 18px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border-top: 4px solid transparent;
}

.team-header { display: flex; flex-direction: column; gap: 0.5rem; }

.color-picker-row { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 0.25rem; }
.color-swatch {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
}

.team-score {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1rem;
}
.score-value { font-size: 3.5rem; font-weight: 700; text-align: center; }
.score-btn {
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.2);
  min-width: 48px;
  min-height: 48px;
  background: white;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 700;
}

.score-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }

/* ─── Inline timer bar ─────────────────────────────────────────────────────── */
.inline-timer-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 1.25rem;
  padding: 0.75rem 1rem;
  background: var(--surface-soft);
  border-radius: 12px;
}
.timer-label { font-weight: 600; color: var(--color-muted); }
.timer-value {
  font-size: 1.3rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  min-width: 4rem;
}
.timer-value--running { color: var(--color-primary); }

/* ─── History ─────────────────────────────────────────────────────────────── */
.history-section { margin-top: 1.5rem; border-top: 1px solid rgba(15, 23, 42, 0.08); padding-top: 1rem; }

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
.session-meta { color: var(--color-muted); font-size: 0.9rem; }
.history-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
  white-space: nowrap;
}
.history-points { font-weight: 700; }
.positive { color: #15803d; }
.negative { color: #b91c1c; }
.session-info { display: flex; flex-direction: column; gap: 0.25rem; }

/* ─── Presenter overlay ─────────────────────────────────────────────────────── */
.presenter-overlay {
  position: fixed;
  inset: 0;
  background: #0f172a;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Presenter header */
.presenter-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.ph-btn {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: white;
  border-radius: 10px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-weight: 600;
  min-height: 44px;
}
.ph-btn.active { background: white; color: #0f172a; }
.ph-btn--back { font-size: 0.95rem; }
.ph-btn--sm { min-height: 38px; padding: 0.4rem 0.9rem; font-size: 0.9rem; }

.ph-timer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
  flex-wrap: wrap;
}
.ph-timer--running .ph-timer-display { color: #4ade80; }

.ph-timer-display {
  font-size: 1.6rem;
  font-weight: 700;
  color: white;
  font-variant-numeric: tabular-nums;
  min-width: 5rem;
  text-align: center;
}

.ph-layout-toggle { display: flex; gap: 0.4rem; }

/* Presenter board */
.presenter-board {
  display: grid;
  flex: 1;
  gap: 0.5rem;
  padding: 0.75rem;
  min-height: 0;
}
.presenter-board--2 { grid-template-columns: 1fr 1fr; }
.presenter-board--4 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }

.presenter-team {
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 1rem;
  gap: 1rem;
  min-height: 0;
}

.presenter-team-name {
  font-size: clamp(1.2rem, 3vw, 2.2rem);
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  text-align: center;
}

.presenter-score-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.presenter-score-value {
  font-size: clamp(4rem, 12vw, 9rem);
  font-weight: 900;
  color: white;
  text-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  line-height: 1;
  min-width: 3ch;
  text-align: center;
}

.presenter-score-btn {
  background: rgba(255, 255, 255, 0.18);
  border: 2px solid rgba(255, 255, 255, 0.4);
  color: white;
  border-radius: 50%;
  width: clamp(56px, 8vw, 88px);
  height: clamp(56px, 8vw, 88px);
  font-size: clamp(1.3rem, 3vw, 2rem);
  font-weight: 700;
  cursor: pointer;
}
.presenter-score-btn--plus {
  background: rgba(255, 255, 255, 0.28);
}

.presenter-extra-btns { display: flex; gap: 0.75rem; }
.presenter-extra-btn {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  border-radius: 10px;
  padding: 0.4rem 1rem;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  min-height: 44px;
}

/* ─── Responsive ─────────────────────────────────────────────────────────── */
@media (max-width: 720px) {
  .page-header,
  .history-item,
  .session-item,
  .section-header { flex-direction: column; align-items: flex-start; }
  .history-meta { align-items: flex-start; }
  .scoreboard-grid--4 { grid-template-columns: 1fr 1fr; }
  .presenter-board--4 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
}
</style>
