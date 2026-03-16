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
  timerRunning,
  canSave,
  linkedTimerSummary,
  setLayout,
  startTimer,
  pauseTimer,
  resetTimer,
  adjustScore,
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
</script>

<style scoped src="./Scoreboard.css"></style>
