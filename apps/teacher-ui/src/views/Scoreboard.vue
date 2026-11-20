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
        <span class="ph-timer-display">{{ formatDuration(displayedTimerMs) }}</span>
        <button
          v-if="!timerRunning && (!numberPickerEnabled || roundActive)"
          class="ph-btn ph-btn--sm"
          type="button"
          @click="startTimer"
        >{{ t('SCORES.timerStart') }}</button>
        <button
          v-if="numberPickerEnabled && !roundActive"
          class="ph-btn ph-btn--sm"
          type="button"
          :disabled="pendingNumbers.length !== playersPerRound"
          @click="startRound"
        >{{ t('SCORES.startRound') }}</button>
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

    <div v-if="numberPickerEnabled" class="presenter-round-strip">
      <span>{{ t('SCORES.round') }} {{ roundHistory.length }}:</span>
      <strong>{{ activeNumbers.join(' · ') || '—' }}</strong>
      <span v-if="pendingNumbers.length">{{ t('SCORES.nextRound') }} {{ nextRoundNumber }}: {{ pendingNumbers.join(' · ') }}</span>
      <button v-if="!roundActive && selectionMethod === 'random'" class="ph-btn ph-btn--sm" type="button" @click="prepareNextRound">{{ t('SCORES.draw') }}</button>
      <span v-if="roundMessage" role="status">{{ roundMessage }}</span>
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
          <button class="presenter-score-btn" type="button" @click="adjustScore(team.id, -1)">−1</button>
          <div class="presenter-score-value">{{ scores[team.id] ?? 0 }}</div>
          <button v-for="points in pointOptions" :key="points" class="presenter-score-btn presenter-score-btn--plus"
            type="button" @click="adjustScore(team.id, points)">+{{ points }}</button>
        </div>
      </article>
    </div>
  </div>

  <!-- =========================================================
       MANAGE MODE — setup / save / load
       ========================================================= -->
  <div v-else class="scoreboard-view sport-ui">
    <div class="page-header">
      <Button text severity="secondary" icon="pi pi-arrow-left" type="button" @click="$router.back()">{{ t('COMMON.back') }}</Button>
      <div>
        <h2>{{ t('SCORES.title') }}</h2>
        <p class="page-description">{{ t('SCORES.description') }}</p>
      </div>
      <Button type="button" @click="viewMode = 'presenter'">
        {{ t('SCORES.presenterMode') }}
      </Button>
    </div>

    <!-- Setup card -->
    <section class="card app-card">
      <div class="setup-grid">
        <div class="form-group">
          <label for="scoreboard-sport">{{ t('SCORES.sport') }}</label>
          <select id="scoreboard-sport" v-model="sport" class="form-input">
            <option value="basketball">{{ t('SCORES.basketball') }}</option>
            <option value="standard">{{ t('SCORES.standardPoints') }}</option>
            <option value="custom">{{ t('SCORES.customPoints') }}</option>
          </select>
        </div>
        <div v-if="sport === 'custom'" class="form-group">
          <label for="scoreboard-points">{{ t('SCORES.pointsPerAction') }}</label>
          <input id="scoreboard-points" v-model.number="customPoints" type="number" min="1" max="20" step="1" class="form-input" />
        </div>
        <div class="form-group">
          <label for="scoreboard-class">{{ t('SCORES.classGroup') }}</label>
          <Select inputId="scoreboard-class" v-model="selectedClassId" :options="classOptions"
            optionLabel="label" optionValue="value" fluid />
        </div>

        <div class="form-group">
          <label for="team-session">{{ t('SCORES.importTeams') }}</label>
          <Select inputId="team-session" v-model="selectedTeamSessionId" :options="teamSessionOptions"
            optionLabel="label" optionValue="value" fluid
            :disabled="availableTeamSessions.length === 0" />
        </div>

        <div class="form-group">
          <label for="timer-session">{{ t('SCORES.timerLink') }}</label>
          <Select inputId="timer-session" v-model="linkedTimerSessionId" :options="timerSessionOptions"
            optionLabel="label" optionValue="value" fluid
            :disabled="availableTimerSessions.length === 0" />
        </div>
      </div>
    </section>

    <!-- Layout + Teams card -->
    <section class="card app-card">
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
            <button class="score-btn" type="button" @click="adjustScore(team.id, -1)">−1</button>
            <div class="score-value">{{ scores[team.id] ?? 0 }}</div>
            <button v-if="pointOptions.length === 1" class="score-btn" type="button"
              @click="adjustScore(team.id, pointOptions[0])">+{{ pointOptions[0] }}</button>
          </div>
          <div v-if="pointOptions.length > 1" class="score-actions">
            <Button v-for="points in pointOptions" :key="points" severity="secondary" outlined
              type="button" @click="adjustScore(team.id, points)">+{{ points }}</Button>
          </div>
        </article>
      </div>

      <!-- Inline timer -->
      <div class="inline-timer-bar">
        <span class="timer-label">{{ t('SCORES.inlineTimer') }}:</span>
        <span class="timer-value" :class="{ 'timer-value--running': timerRunning }">{{ formatDuration(displayedTimerMs) }}</span>
        <Button severity="secondary" outlined v-if="!timerRunning && (!numberPickerEnabled || roundActive)" type="button" @click="startTimer">{{ t('SCORES.timerStart') }}</Button>
        <Button severity="secondary" outlined v-else type="button" @click="pauseTimer">{{ t('SCORES.timerPause') }}</Button>
        <Button severity="secondary" outlined type="button" @click="resetTimer">{{ t('SCORES.timerReset') }}</Button>
        <div class="timer-settings">
          <label for="scoreboard-timer-mode">{{ t('SCORES.timerMode') }}</label>
          <select id="scoreboard-timer-mode" v-model="timerMode" class="form-input" :disabled="roundActive || timerRunning">
            <option value="stopwatch">{{ t('SCORES.stopwatch') }}</option>
            <option value="countdown">{{ t('SCORES.countdown') }}</option>
          </select>
          <template v-if="timerMode === 'countdown'">
            <label for="scoreboard-minutes">{{ t('SCORES.minutes') }}</label>
            <input id="scoreboard-minutes" v-model.number="roundMinutes" :disabled="roundActive || timerRunning"
              type="number" min="0" max="99" step="1" class="form-input timer-input" />
            <label for="scoreboard-seconds">{{ t('SCORES.seconds') }}</label>
            <input id="scoreboard-seconds" v-model.number="roundSeconds" :disabled="roundActive || timerRunning"
              type="number" min="0" max="59" step="1" class="form-input timer-input" />
            <span v-if="!timerConfigurationValid" class="info-text" role="alert">{{ t('SCORES.invalidTimer') }}</span>
          </template>
        </div>
      </div>

      <div v-if="linkedTimerSummary" class="info-banner">
        {{ linkedTimerSummary }}
      </div>

      <div class="form-actions">
        <Button severity="secondary" outlined type="button" :disabled="history.length === 0" @click="undoLastScore">
          {{ t('SCORES.undoScore') }}
        </Button>
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
        <Button severity="secondary" outlined type="button" @click="resetBoard">{{ t('SCORES.reset') }}</Button>
      </div>
    </section>

    <section class="card app-card">
      <div class="section-header">
        <h3>{{ t('SCORES.numberPicker') }}</h3>
        <label class="scoreboard-toggle">
          <input v-model="numberPickerEnabled" type="checkbox" />
          {{ t('SCORES.enableNumberPicker') }}
        </label>
      </div>
      <template v-if="numberPickerEnabled">
        <p class="info-text">{{ t('SCORES.sharedNumberHint') }}</p>
        <div class="setup-grid">
          <div class="form-group">
            <label for="number-team-size">{{ t('SCORES.teamSize') }}</label>
            <input id="number-team-size" v-model.number="teamSize" type="number" min="1" max="99" step="1"
              class="form-input" :disabled="roundActive" />
          </div>
          <div class="form-group">
            <label for="number-per-round">{{ t('SCORES.playersPerRound') }}</label>
            <input id="number-per-round" v-model.number="playersPerRound" type="number" min="1" :max="teamSize" step="1"
              class="form-input" :disabled="roundActive" />
          </div>
          <div class="form-group">
            <label for="number-exclusion">{{ t('SCORES.exclusionMode') }}</label>
            <select id="number-exclusion" v-model="exclusionMode" class="form-input" :disabled="roundActive">
              <option value="unused">{{ t('SCORES.unused') }}</option>
              <option value="previous">{{ t('SCORES.previous') }}</option>
              <option value="any">{{ t('SCORES.any') }}</option>
            </select>
          </div>
          <div class="form-group">
            <label for="number-method">{{ t('SCORES.selectionMethod') }}</label>
            <select id="number-method" v-model="selectionMethod" class="form-input" :disabled="roundActive">
              <option value="random">{{ t('SCORES.random') }}</option>
              <option value="manual">{{ t('SCORES.manual') }}</option>
            </select>
          </div>
        </div>
        <p v-if="layout !== 2 || timerMode !== 'countdown'" class="info-text" role="alert">{{ t('SCORES.twoTeamCountdownRequired') }}</p>
        <div class="round-details">
          <div>
            <strong>{{ t('SCORES.round') }} {{ roundHistory.length }}</strong>
            <div class="number-chips">
              <span v-for="number in activeNumbers" :key="number" class="number-chip">{{ number }}</span>
              <span v-if="activeNumbers.length === 0">—</span>
            </div>
          </div>
          <div>
            <strong>{{ t('SCORES.nextRound') }} {{ nextRoundNumber }}</strong>
            <div class="number-chips">
              <span v-for="number in pendingNumbers" :key="number" class="number-chip">{{ number }}</span>
              <span v-if="pendingNumbers.length === 0">—</span>
            </div>
          </div>
        </div>
        <div v-if="selectionMethod === 'manual' && !roundActive" class="number-grid">
          <button v-for="number in selectableNumbers" :key="number" type="button"
            class="number-choice" :class="{ active: pendingNumbers.includes(number) }"
            :aria-pressed="pendingNumbers.includes(number)"
            @click="toggleManualNumber(number)">{{ number }}</button>
        </div>
        <div class="form-actions">
          <Button severity="secondary" outlined type="button" :disabled="roundActive || !roundConfigurationValid"
            @click="prepareNextRound">{{ selectionMethod === 'random' ? t('SCORES.draw') : t('SCORES.clearSelection') }}</Button>
          <Button type="button" :disabled="roundActive || !roundConfigurationValid || !timerConfigurationValid ||
            timerMode !== 'countdown' || pendingNumbers.length !== playersPerRound"
            @click="startRound">{{ t('SCORES.startRound') }}</Button>
          <Button severity="secondary" outlined type="button" :disabled="roundActive" @click="resetRoundCycle">{{ t('SCORES.newCycle') }}</Button>
        </div>
        <p v-if="roundMessage" class="info-text" role="status">{{ roundMessage }}</p>
      </template>
    </section>

    <!-- Tournament handoff -->
    <section class="card app-card">
      <div class="section-header">
        <h3>{{ t('SCORES.sendToTournament') }}</h3>
      </div>
      <p class="info-text">{{ t('SCORES.tournamentHandoffHint') }}</p>
      <div class="form-actions">
        <Button severity="secondary" outlined type="button" @click="handoffToTournament">
          {{ t('SCORES.sendToTournament') }}
        </Button>
      </div>
    </section>

    <!-- Live mode section -->
    <section class="card app-card">
      <div class="section-header">
        <h3>{{ t('SCORES.liveMode') }}</h3>
        <span class="session-badge">{{ t('SCORES.liveModeOff') }}</span>
      </div>
      <p class="info-text">{{ t('SCORES.liveModeHint') }}</p>
    </section>

    <!-- Save session -->
    <section class="card app-card">
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
        <Button type="button" :disabled="!canSave || saving" @click="saveSession">
          {{ saving ? '...' : t('SCORES.save') }}
        </Button>
      </div>
      <p v-if="message" class="info-text">{{ message }}</p>
    </section>

    <!-- Saved sessions -->
    <section class="card app-card">
      <h3>{{ t('SCORES.savedSessions') }}</h3>
      <p v-if="savedSessions.length === 0" class="empty-hint">{{ t('SCORES.noSessions') }}</p>
      <ul v-else class="sessions-list">
        <li v-for="session in savedSessions" :key="session.id" class="session-item">
          <div class="session-info">
            <strong>{{ scoreboardSessionName(session) }}</strong>
            <span class="session-meta">{{ scoreboardSessionSummary(session) }}</span>
          </div>
          <Button severity="secondary" outlined type="button" @click="loadSession(session)">
            {{ t('SCORES.loadSession') }}
          </Button>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import Button from 'openvue/button'
import Select from 'openvue/select'
import { computed } from 'vue'
import { useScoreboardView } from '../composables/useScoreboardView';

const {
  t,
  TEAM_COLORS,
  viewMode,
  layout,
  activeTeams,
  scores,
  history,
  classes,
  selectedClassId,
  selectedTeamSessionId,
  linkedTimerSessionId,
  availableTeamSessions,
  availableTimerSessions,
  savedSessions,
  currentSessionId,
  sessionName,
  saving,
  message,
  timerElapsedMs,
  displayedTimerMs,
  timerRunning,
  timerMode,
  roundMinutes,
  roundSeconds,
  timerConfigurationValid,
  sport,
  customPoints,
  pointOptions,
  numberPickerEnabled,
  teamSize,
  playersPerRound,
  exclusionMode,
  selectionMethod,
  selectableNumbers,
  activeNumbers,
  pendingNumbers,
  roundHistory,
  roundActive,
  roundMessage,
  nextRoundNumber,
  roundConfigurationValid,
  canSave,
  linkedTimerSummary,
  setLayout,
  startTimer,
  pauseTimer,
  resetTimer,
  adjustScore,
  undoLastScore,
  prepareNextRound,
  toggleManualNumber,
  startRound,
  resetRoundCycle,
  resetBoard,
  saveSession,
  loadSession,
  handoffToTournament,
  displayTeamName,
  scoreboardSessionName,
  scoreboardSessionSummary,
  teamSessionLabel,
  timerSessionLabel,
  formatDateTime,
  formatDuration,
} = useScoreboardView();

const classOptions = computed(() => [
  { label: t('SCORES.noClassBinding'), value: '' },
  ...classes.value.map(group => ({ label: `${group.name} (${group.schoolYear})`, value: group.id }))
])
const teamSessionOptions = computed(() => [
  { label: availableTeamSessions.value.length === 0
      ? t('SCORES.noTeamSessions') : t('SCORES.importTeamsPlaceholder'), value: '' },
  ...availableTeamSessions.value.map(session => ({ label: teamSessionLabel(session), value: session.id }))
])
const timerSessionOptions = computed(() => [
  { label: availableTimerSessions.value.length === 0
      ? t('SCORES.noTimerSessions') : t('SCORES.timerLinkPlaceholder'), value: '' },
  ...availableTimerSessions.value.map(session => ({ label: timerSessionLabel(session), value: session.id }))
])
</script>

<style scoped src="./Scoreboard.css"></style>
