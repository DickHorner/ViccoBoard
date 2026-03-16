<template>
  <div class="timer-view">
    <!-- ─── Page header ───────────────────────────────────────────── -->
    <div class="page-header">
      <h2>{{ t('TIMER.set') }}</h2>
      <div class="header-actions">
        <!-- sound quick-toggle -->
        <button
          class="header-icon-btn"
          :class="{ muted: !soundEnabled }"
          :title="t('TIMER.enable-sounds')"
          @click="soundEnabled = !soundEnabled"
          type="button"
        >
          {{ soundEnabled ? '🔔' : '🔕' }}
        </button>
        <!-- total duration badge (interval only) -->
        <span
          v-if="mode === 'interval'"
          class="total-duration-badge"
          :title="t('TIMER.gesamtlaenge')"
        >
          ⏱ {{ formatTime(totalIntervalDurationMs) }}
        </span>
        <!-- presenter-mode toggle (interval only) -->
        <button
          v-if="mode === 'interval'"
          class="header-icon-btn presenter-btn"
          :class="{ active: presenterMode }"
          :title="t('TIMER.presenter')"
          @click="togglePresenter"
          type="button"
        >
          📺 {{ t('TIMER.presenter') }}
        </button>
      </div>
    </div>

    <!-- ─── Mode tabs ─────────────────────────────────────────────── -->
    <div class="card">
      <div class="timer-modes">
        <button
          class="mode-btn"
          :class="{ active: mode === 'countdown' }"
          @click="mode = 'countdown'"
        >
          ⏱️ {{ t('TIMER.set') }}
        </button>
        <button
          class="mode-btn"
          :class="{ active: mode === 'stopwatch' }"
          @click="mode = 'stopwatch'"
        >
          ⏲️ Stopwatch
        </button>
        <button
          class="mode-btn"
          :class="{ active: mode === 'interval' }"
          @click="mode = 'interval'"
        >
          🔄 {{ t('TIMER.workout') }} / {{ t('TIMER.rest') }}
        </button>
      </div>
    </div>

    <!-- ─── Countdown Timer ───────────────────────────────────────── -->
    <div v-if="mode === 'countdown'" class="card timer-card">
      <div class="timer-setup" v-if="!isRunning && !isPaused">
        <div class="time-input-group">
          <div class="time-input">
            <label>{{ t('TIMER.minutes') }}</label>
            <input
              type="number"
              v-model.number="countdownMinutes"
              min="0"
              max="99"
              class="form-input"
            />
          </div>
          <div class="time-separator">:</div>
          <div class="time-input">
            <label>{{ t('TIMER.seconds') }}</label>
            <input
              type="number"
              v-model.number="countdownSeconds"
              min="0"
              max="59"
              class="form-input"
            />
          </div>
        </div>
        <button class="btn-primary btn-large" @click="startCountdown">
          ▶️ {{ t('COMMON.start') || 'Start' }}
        </button>
      </div>

      <div class="timer-display" v-else>
        <!-- SVG progress ring -->
        <div class="ring-container">
          <svg viewBox="0 0 200 200" class="progress-ring" aria-hidden="true">
            <circle class="ring-bg" cx="100" cy="100" r="80" />
            <circle
              class="ring-track"
              cx="100" cy="100" r="80"
              :stroke="timeRemaining < 10000 ? '#ff9800' : '#2196F3'"
              :stroke-dasharray="CIRCUMFERENCE"
              :stroke-dashoffset="countdownRingOffset"
              transform="rotate(-90 100 100)"
            />
          </svg>
          <div
            class="ring-time-overlay"
            :class="{ warning: timeRemaining < 10000, finished: timeRemaining === 0 }"
          >
            {{ formatTime(timeRemaining) }}
          </div>
        </div>

        <div class="timer-controls">
          <button class="btn-secondary btn-touch" @click="pauseTimer" v-if="isRunning && !isPaused">
            ⏸️ {{ t('COMMON.pause') || 'Pause' }}
          </button>
          <button class="btn-primary btn-touch" @click="resumeTimer" v-if="isPaused">
            ▶️ {{ t('COMMON.resume') || 'Resume' }}
          </button>
          <button class="btn-danger btn-touch" @click="resetTimer">
            🔄 {{ t('COMMON.reset') || 'Reset' }}
          </button>
        </div>
        <div v-if="timeRemaining === 0" class="timer-finished">
          <h3>{{ t('TIMER.finished') }}</h3>
        </div>
      </div>
    </div>

    <!-- ─── Stopwatch ─────────────────────────────────────────────── -->
    <div v-if="mode === 'stopwatch'" class="card timer-card">
      <div class="timer-display">
        <div class="time-display">
          {{ formatTime(elapsedTime) }}
        </div>
        <div class="timer-controls">
          <button class="btn-primary btn-touch btn-large" @click="startStopwatch" v-if="!isRunning">
            ▶️ {{ t('COMMON.start') || 'Start' }}
          </button>
          <button class="btn-secondary btn-touch" @click="pauseTimer" v-if="isRunning && !isPaused">
            ⏸️ {{ t('COMMON.pause') || 'Pause' }}
          </button>
          <button class="btn-primary btn-touch" @click="resumeTimer" v-if="isPaused">
            ▶️ {{ t('COMMON.resume') || 'Resume' }}
          </button>
          <button class="btn-warning btn-touch" @click="recordLap" v-if="isRunning || isPaused">
            ⏱️ Lap
          </button>
          <button class="btn-danger btn-touch" @click="resetTimer">
            🔄 {{ t('COMMON.reset') || 'Reset' }}
          </button>
        </div>

        <!-- Lap Times -->
        <div v-if="lapTimes.length > 0" class="lap-times">
          <h4>Lap {{ t('MULTISTOP.times') }}</h4>
          <div class="lap-list">
            <div v-for="(lap, index) in lapTimes" :key="index" class="lap-item">
              <span class="lap-number">Lap {{ lap.number }}</span>
              <span class="lap-time">{{ formatTime(lap.time) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Interval Timer ────────────────────────────────────────── -->
    <div v-if="mode === 'interval'" class="card timer-card">
      <!-- Setup screen -->
      <div class="timer-setup" v-if="!isRunning && !isPaused">
        <!-- Preset chips -->
        <div class="presets-section">
          <p class="presets-label">{{ t('TIMER.presets') }}</p>
          <div class="presets-chips">
            <button
              v-for="preset in INTERVAL_PRESETS"
              :key="preset.label"
              class="preset-chip"
              @click="applyPreset(preset)"
              type="button"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>

        <div class="interval-setup">
          <div class="form-group">
            <label>{{ t('TIMER.workout-time') }} ({{ t('TIMER.seconds') }})</label>
            <input
              type="number"
              v-model.number="workTime"
              min="1"
              max="999"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>{{ t('TIMER.pause-time') }} ({{ t('TIMER.seconds') }})</label>
            <input
              type="number"
              v-model.number="restTime"
              min="0"
              max="999"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>{{ t('TIMER.rounds') }}</label>
            <input
              type="number"
              v-model.number="rounds"
              min="1"
              max="50"
              class="form-input"
            />
          </div>
        </div>
        <button class="btn-primary btn-large" @click="startInterval">
          ▶️ {{ t('COMMON.start') || 'Start' }}
        </button>
      </div>

      <!-- Running screen -->
      <div class="timer-display interval-display" v-else>
        <!-- Phase + round info -->
        <div class="interval-info">
          <div class="current-phase" :class="currentPhase">
            {{ currentPhase === 'work' ? t('TIMER.workout') : t('TIMER.rest') }}
          </div>
          <div class="round-info">
            {{ t('TIMER.round') }} {{ currentRound }} / {{ rounds }}
          </div>
        </div>

        <!-- SVG progress ring -->
        <div class="ring-container">
          <svg viewBox="0 0 200 200" class="progress-ring" aria-hidden="true">
            <circle class="ring-bg" cx="100" cy="100" r="80" />
            <circle
              class="ring-track"
              cx="100" cy="100" r="80"
              :stroke="currentPhase === 'work' ? '#4CAF50' : '#2196F3'"
              :stroke-dasharray="CIRCUMFERENCE"
              :stroke-dashoffset="intervalRingOffset"
              transform="rotate(-90 100 100)"
            />
          </svg>
          <div
            class="ring-time-overlay"
            :class="{ work: currentPhase === 'work', rest: currentPhase === 'rest' }"
          >
            {{ formatTime(timeRemaining) }}
          </div>
        </div>

        <!-- Total elapsed -->
        <div class="total-elapsed">
          {{ t('TIMER.total-elapsed') }}: {{ formatTime(totalElapsedMs) }}
        </div>

        <div class="timer-controls">
          <button class="btn-secondary btn-touch" @click="pauseTimer" v-if="isRunning && !isPaused">
            ⏸️ {{ t('COMMON.pause') || 'Pause' }}
          </button>
          <button class="btn-primary btn-touch" @click="resumeTimer" v-if="isPaused">
            ▶️ {{ t('COMMON.resume') || 'Resume' }}
          </button>
          <button class="btn-danger btn-touch" @click="resetTimer">
            🔄 {{ t('COMMON.reset') || 'Reset' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ─── Sound Settings ────────────────────────────────────────── -->
    <div class="card">
      <div class="card-header">
        <h3>{{ t('TIMER.sound-settings') }}</h3>
      </div>
      <div class="card-content">
        <label class="checkbox-label">
          <input type="checkbox" v-model="soundEnabled" />
          {{ t('TIMER.enable-sounds') }}
        </label>
      </div>
    </div>

    <!-- ─── Save Result ────────────────────────────────────────────── -->
    <div class="card">
      <button
        class="btn-primary btn-large"
        @click="saveTimerResult"
        :disabled="saving || (!isRunning && elapsedTime === 0 && timeRemaining === 0)"
      >
        {{ saving ? t('COMMON.syncing') : '💾 ' + t('COMMON.save') }}
      </button>
    </div>
  </div>

  <!-- ─── Presenter Overlay ─────────────────────────────────────── -->
  <Teleport to="body">
    <div
      v-if="presenterMode"
      class="presenter-overlay"
      role="dialog"
      aria-modal="true"
    >
      <!-- Header bar -->
      <div class="presenter-header">
        <div
          class="presenter-phase-badge"
          :class="currentPhase === 'work' ? 'phase-work' : 'phase-rest'"
        >
          {{ currentPhase === 'work' ? t('TIMER.workout') : t('TIMER.rest') }}
        </div>
        <div class="presenter-round">
          {{ t('TIMER.round') }} {{ currentRound }} / {{ rounds }}
        </div>
        <button
          class="presenter-close"
          @click="presenterMode = false"
          type="button"
          :title="t('TIMER.close-presenter')"
        >
          ✕ {{ t('TIMER.close-presenter') }}
        </button>
      </div>

      <!-- Big ring + time -->
      <div class="presenter-ring-area">
        <div class="presenter-ring-container">
          <svg viewBox="0 0 300 300" class="presenter-ring" aria-hidden="true">
            <circle class="ring-bg" cx="150" cy="150" r="130" />
            <circle
              class="ring-track"
              cx="150" cy="150" r="130"
              :stroke="currentPhase === 'work' ? '#4CAF50' : '#2196F3'"
              :stroke-dasharray="PRESENTER_CIRCUMFERENCE"
              :stroke-dashoffset="presenterIntervalRingOffset"
              transform="rotate(-90 150 150)"
            />
          </svg>
          <div
            class="presenter-time"
            :class="currentPhase === 'work' ? 'phase-work' : 'phase-rest'"
          >
            {{ formatTime(timeRemaining) }}
          </div>
        </div>
      </div>

      <!-- Total elapsed -->
      <div class="presenter-total">
        {{ t('TIMER.total-elapsed') }}: {{ formatTime(totalElapsedMs) }}
        &nbsp;/&nbsp;
        {{ t('TIMER.gesamtlaenge') }}: {{ formatTime(totalIntervalDurationMs) }}
      </div>

      <!-- Controls -->
      <div class="presenter-controls">
        <button
          v-if="!isRunning && !isPaused"
          class="presenter-btn-action presenter-start"
          @click="startInterval"
          type="button"
        >
          ▶ Start
        </button>
        <button
          v-if="isRunning && !isPaused"
          class="presenter-btn-action presenter-pause"
          @click="pauseTimer"
          type="button"
        >
          ⏸ {{ t('COMMON.pause') || 'Pause' }}
        </button>
        <button
          v-if="isPaused"
          class="presenter-btn-action presenter-start"
          @click="resumeTimer"
          type="button"
        >
          ▶ {{ t('COMMON.resume') || 'Resume' }}
        </button>
        <button
          class="presenter-btn-action presenter-reset"
          @click="resetTimer"
          type="button"
        >
          🔄 {{ t('COMMON.reset') || 'Reset' }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useTimerView } from '../composables/useTimerView'

const {
  t,
  INTERVAL_PRESETS,
  CIRCUMFERENCE,
  PRESENTER_CIRCUMFERENCE,
  mode,
  isRunning,
  isPaused,
  soundEnabled,
  saving,
  presenterMode,
  countdownMinutes,
  countdownSeconds,
  timeRemaining,
  elapsedTime,
  lapTimes,
  workTime,
  restTime,
  rounds,
  currentRound,
  currentPhase,
  totalElapsedMs,
  totalIntervalDurationMs,
  countdownRingOffset,
  intervalRingOffset,
  presenterIntervalRingOffset,
  formatTime,
  startCountdown,
  startStopwatch,
  recordLap,
  startInterval,
  applyPreset,
  togglePresenter,
  pauseTimer,
  resumeTimer,
  resetTimer,
  saveTimerResult
} = useTimerView()
</script>

<style scoped src="./Timer.css"></style>
