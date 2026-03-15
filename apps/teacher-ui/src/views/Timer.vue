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
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSportBridge } from '../composables/useSportBridge'
import { useToast } from '../composables/useToast'
import { v4 as uuidv4 } from 'uuid'
import {
  INTERVAL_PRESETS,
  type IntervalPreset,
  calcRingOffset,
  calcTotalIntervalDurationMs,
  circleCircumference,
} from '../utils/timer-presets'

const { t } = useI18n()
const { SportBridge } = useSportBridge()
const toast = useToast()

// ── SVG ring constants ─────────────────────────────────────────────────────
const SVG_R = 80
const CIRCUMFERENCE = circleCircumference(SVG_R)
const PRESENTER_R = 130
const PRESENTER_CIRCUMFERENCE = circleCircumference(PRESENTER_R)

// ── State ──────────────────────────────────────────────────────────────────
const mode = ref<'countdown' | 'stopwatch' | 'interval'>('countdown')
const isRunning = ref(false)
const isPaused = ref(false)
const soundEnabled = ref(true)
const saving = ref(false)
const sessionId = ref(uuidv4())
const presenterMode = ref(false)

// Countdown state
const countdownMinutes = ref(5)
const countdownSeconds = ref(0)
const timeRemaining = ref(0)
const countdownTotalMs = ref(0)
let intervalId: number | null = null

// Stopwatch state
const elapsedTime = ref(0)
const lapTimes = ref<Array<{ number: number; time: number }>>([])

// Interval timer state
const workTime = ref(30)
const restTime = ref(10)
const rounds = ref(5)
const currentRound = ref(1)
const currentPhase = ref<'work' | 'rest'>('work')
const totalElapsedMs = ref(0)

// ── Computed ───────────────────────────────────────────────────────────────
const phaseDurationMs = computed(() =>
  currentPhase.value === 'work' ? workTime.value * 1000 : restTime.value * 1000,
)

const totalIntervalDurationMs = computed(() =>
  calcTotalIntervalDurationMs(workTime.value * 1000, restTime.value * 1000, rounds.value),
)

const countdownRingOffset = computed(() =>
  calcRingOffset(timeRemaining.value, countdownTotalMs.value, CIRCUMFERENCE),
)

const intervalRingOffset = computed(() =>
  calcRingOffset(timeRemaining.value, phaseDurationMs.value, CIRCUMFERENCE),
)

const presenterIntervalRingOffset = computed(() =>
  calcRingOffset(timeRemaining.value, phaseDurationMs.value, PRESENTER_CIRCUMFERENCE),
)

// ── Formatting ─────────────────────────────────────────────────────────────
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const pad = (n: number) => n.toString().padStart(2, '0')

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  }
  return `${pad(minutes)}:${pad(seconds)}`
}

// ── Countdown timer ────────────────────────────────────────────────────────
function startCountdown() {
  const totalMs = (countdownMinutes.value * 60 + countdownSeconds.value) * 1000
  if (totalMs === 0) return

  countdownTotalMs.value = totalMs
  timeRemaining.value = totalMs
  isRunning.value = true
  isPaused.value = false

  intervalId = window.setInterval(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value -= 100
    } else {
      stopTimer()
      if (soundEnabled.value) {
        playBeep()
      }
    }
  }, 100)
}

// ── Stopwatch ──────────────────────────────────────────────────────────────
function startStopwatch() {
  elapsedTime.value = 0
  lapTimes.value = []
  isRunning.value = true
  isPaused.value = false

  intervalId = window.setInterval(() => {
    elapsedTime.value += 100
  }, 100)
}

function recordLap() {
  lapTimes.value.push({
    number: lapTimes.value.length + 1,
    time: elapsedTime.value,
  })
}

// ── Interval timer ─────────────────────────────────────────────────────────
function startInterval() {
  currentRound.value = 1
  currentPhase.value = 'work'
  timeRemaining.value = workTime.value * 1000
  totalElapsedMs.value = 0
  isRunning.value = true
  isPaused.value = false

  intervalId = window.setInterval(() => {
    totalElapsedMs.value += 100
    if (timeRemaining.value > 0) {
      timeRemaining.value -= 100
    } else {
      if (currentPhase.value === 'work') {
        if (restTime.value > 0) {
          currentPhase.value = 'rest'
          timeRemaining.value = restTime.value * 1000
          if (soundEnabled.value) playBeep()
        } else {
          nextRound()
        }
      } else {
        nextRound()
      }
    }
  }, 100)
}

function nextRound() {
  if (currentRound.value < rounds.value) {
    currentRound.value++
    currentPhase.value = 'work'
    timeRemaining.value = workTime.value * 1000
    if (soundEnabled.value) playBeep()
  } else {
    stopTimer()
    if (soundEnabled.value) playBeep()
  }
}

// ── Preset handling ────────────────────────────────────────────────────────
function applyPreset(preset: IntervalPreset) {
  workTime.value = preset.work
  restTime.value = preset.rest
  rounds.value = preset.rounds
}

// ── Presenter mode ─────────────────────────────────────────────────────────
function togglePresenter() {
  presenterMode.value = !presenterMode.value
}

// ── Timer controls ─────────────────────────────────────────────────────────
function pauseTimer() {
  isPaused.value = true
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
}

function resumeTimer() {
  isPaused.value = false

  if (mode.value === 'countdown') {
    intervalId = window.setInterval(() => {
      if (timeRemaining.value > 0) {
        timeRemaining.value -= 100
      } else {
        stopTimer()
        if (soundEnabled.value) playBeep()
      }
    }, 100)
  } else if (mode.value === 'stopwatch') {
    intervalId = window.setInterval(() => {
      elapsedTime.value += 100
    }, 100)
  } else if (mode.value === 'interval') {
    intervalId = window.setInterval(() => {
      totalElapsedMs.value += 100
      if (timeRemaining.value > 0) {
        timeRemaining.value -= 100
      } else {
        if (currentPhase.value === 'work') {
          if (restTime.value > 0) {
            currentPhase.value = 'rest'
            timeRemaining.value = restTime.value * 1000
            if (soundEnabled.value) playBeep()
          } else {
            nextRound()
          }
        } else {
          nextRound()
        }
      }
    }, 100)
  }
}

function resetTimer() {
  stopTimer()
  timeRemaining.value = 0
  elapsedTime.value = 0
  lapTimes.value = []
  currentRound.value = 1
  currentPhase.value = 'work'
  totalElapsedMs.value = 0
  countdownTotalMs.value = 0
}

function stopTimer() {
  isRunning.value = false
  isPaused.value = false
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
}

function playBeep() {
  try {
    const AudioCtx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const audioContext = new AudioCtx()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    gainNode.gain.value = 0.3

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.2)
  } catch (e) {
    console.warn('Audio not available:', e)
  }
}

// ── Save result ────────────────────────────────────────────────────────────
async function saveTimerResult() {
  saving.value = true
  try {
    const useCase = SportBridge.value?.recordTimerResultUseCase
    if (!useCase) {
      throw new Error('RecordTimerResultUseCase not available')
    }

    let elapsedMs = 0
    let durationMs: number | undefined = undefined
    let intervalMs: number | undefined = undefined
    let intervalCount: number | undefined = undefined

    if (mode.value === 'countdown') {
      elapsedMs = (countdownMinutes.value * 60 + countdownSeconds.value) * 1000 - timeRemaining.value
      durationMs = (countdownMinutes.value * 60 + countdownSeconds.value) * 1000
    } else if (mode.value === 'stopwatch') {
      elapsedMs = elapsedTime.value
    } else if (mode.value === 'interval') {
      elapsedMs = totalElapsedMs.value
      intervalMs = (workTime.value + restTime.value) * 1000
      intervalCount = currentRound.value
    }

    const _result = await useCase.execute({
      sessionId: sessionId.value,
      mode: mode.value,
      elapsedMs,
      durationMs,
      intervalMs,
      intervalCount,
      audioEnabled: soundEnabled.value,
      metadata: {
        timestamp: new Date(),
        lapTimes: mode.value === 'stopwatch' ? lapTimes.value : undefined,
      },
    })

    void _result
    sessionId.value = uuidv4()
  } catch (error) {
    console.error('Failed to save timer result:', error)
    toast.error('Fehler beim Speichern')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.timer-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

/* ─── Page header ─────────────────────────────────────────────────── */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.header-icon-btn {
  padding: 0.5rem 0.75rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.header-icon-btn:hover {
  border-color: #2196F3;
  background: #f5f5f5;
}

.header-icon-btn.active {
  border-color: #2196F3;
  background: #2196F3;
  color: white;
}

.header-icon-btn.muted {
  opacity: 0.6;
}

.total-duration-badge {
  padding: 0.5rem 0.75rem;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #666;
  font-family: 'Courier New', monospace;
  font-weight: 600;
}

/* ─── Mode tabs ──────────────────────────────────────────────────── */
.timer-modes {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
}

.mode-btn {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn:hover {
  border-color: #2196F3;
  background: #f5f5f5;
}

.mode-btn.active {
  border-color: #2196F3;
  background: #2196F3;
  color: white;
  font-weight: 600;
}

.timer-card {
  margin-top: 1rem;
}

/* ─── Setup ──────────────────────────────────────────────────────── */
.timer-setup {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.time-input-group {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 2rem;
}

.time-input {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.time-input label {
  font-size: 0.875rem;
  color: #666;
  font-weight: 500;
}

.time-input input {
  width: 100px;
  font-size: 2rem;
  text-align: center;
  padding: 0.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
}

.time-separator {
  font-size: 3rem;
  font-weight: bold;
  color: #666;
}

/* ─── Preset chips ───────────────────────────────────────────────── */
.presets-section {
  width: 100%;
  max-width: 480px;
}

.presets-label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.presets-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.preset-chip {
  padding: 0.5rem 0.875rem;
  border: 2px solid #2196F3;
  background: white;
  color: #2196F3;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  /* touch-friendly min size */
  min-height: 44px;
  display: flex;
  align-items: center;
}

.preset-chip:hover,
.preset-chip:active {
  background: #2196F3;
  color: white;
}

/* ─── Interval setup ─────────────────────────────────────────────── */
.interval-setup {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 400px;
}

/* ─── Timer display ──────────────────────────────────────────────── */
.timer-display {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.interval-display {
  gap: 1rem;
}

.time-display {
  font-size: 4rem;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  color: #333;
  min-width: 200px;
  text-align: center;
  padding: 1rem;
  border-radius: 12px;
  background: #f5f5f5;
}

/* ─── SVG progress ring ──────────────────────────────────────────── */
.ring-container {
  position: relative;
  width: 200px;
  height: 200px;
  flex-shrink: 0;
}

.progress-ring {
  width: 200px;
  height: 200px;
}

.ring-bg {
  fill: none;
  stroke: #e8e8e8;
  stroke-width: 12;
}

.ring-track {
  fill: none;
  stroke-width: 12;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.15s linear, stroke 0.3s ease;
}

.ring-time-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  color: #333;
  text-align: center;
}

.ring-time-overlay.warning {
  color: #ff9800;
  animation: pulse 1s infinite;
}

.ring-time-overlay.finished {
  color: #4CAF50;
}

.ring-time-overlay.work {
  color: #4CAF50;
}

.ring-time-overlay.rest {
  color: #2196F3;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* ─── Interval info ──────────────────────────────────────────────── */
.interval-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.current-phase {
  font-size: 1.5rem;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  text-transform: uppercase;
}

.current-phase.work {
  background: #4CAF50;
  color: white;
}

.current-phase.rest {
  background: #2196F3;
  color: white;
}

.round-info {
  font-size: 1.25rem;
  color: #666;
}

.total-elapsed {
  font-size: 1rem;
  color: #888;
  font-family: 'Courier New', monospace;
}

/* ─── Timer controls ─────────────────────────────────────────────── */
.timer-controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.btn-touch {
  min-height: 52px;
  min-width: 88px;
  padding: 0.875rem 1.25rem;
  font-size: 1rem;
  border-radius: 10px;
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1.25rem;
}

/* ─── Misc ───────────────────────────────────────────────────────── */
.timer-finished {
  text-align: center;
  color: #4CAF50;
  font-size: 1.5rem;
}

.lap-times {
  width: 100%;
  max-width: 400px;
  margin-top: 1rem;
}

.lap-times h4 {
  margin-bottom: 0.5rem;
  color: #666;
}

.lap-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.lap-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.lap-item:last-child {
  border-bottom: none;
}

.lap-number {
  font-weight: 500;
  color: #666;
}

.lap-time {
  font-family: 'Courier New', monospace;
  font-weight: 600;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
}

.checkbox-label input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

/* ─── Presenter overlay ──────────────────────────────────────────── */
.presenter-overlay {
  position: fixed;
  inset: 0;
  background: #111;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  z-index: 9999;
  padding: 1.5rem 1rem;
  box-sizing: border-box;
  /* Safe-area insets for iPad */
  padding-top: max(1.5rem, env(safe-area-inset-top));
  padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
}

.presenter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 640px;
  gap: 1rem;
}

.presenter-phase-badge {
  font-size: 1.75rem;
  font-weight: 700;
  padding: 0.5rem 1.25rem;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.phase-work {
  background: #4CAF50;
  color: white;
}

.phase-rest {
  background: #2196F3;
  color: white;
}

.presenter-round {
  font-size: 1.5rem;
  font-weight: 600;
  color: #ccc;
}

.presenter-close {
  background: rgba(255,255,255,0.12);
  border: 2px solid rgba(255,255,255,0.25);
  color: white;
  padding: 0.625rem 1rem;
  border-radius: 10px;
  font-size: 1rem;
  cursor: pointer;
  min-height: 52px;
  white-space: nowrap;
  transition: background 0.2s;
}

.presenter-close:hover {
  background: rgba(255,255,255,0.2);
}

/* Big ring in presenter mode */
.presenter-ring-area {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.presenter-ring-container {
  position: relative;
  width: min(70vw, 70vh, 400px);
  height: min(70vw, 70vh, 400px);
}

.presenter-ring {
  width: 100%;
  height: 100%;
}

/* Override ring track width for presenter */
.presenter-ring .ring-bg {
  stroke-width: 16;
}

.presenter-ring .ring-track {
  stroke-width: 16;
}

.presenter-time {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(2.5rem, 10vw, 5rem);
  font-weight: bold;
  font-family: 'Courier New', monospace;
  color: white;
}

.presenter-total {
  font-size: 1.1rem;
  color: #aaa;
  font-family: 'Courier New', monospace;
  text-align: center;
  padding: 0.5rem;
}

.presenter-controls {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
  max-width: 640px;
}

.presenter-btn-action {
  flex: 1;
  min-width: 120px;
  min-height: 64px;
  font-size: 1.25rem;
  font-weight: 700;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
}

.presenter-btn-action:active {
  transform: scale(0.97);
  opacity: 0.85;
}

.presenter-start {
  background: #4CAF50;
  color: white;
}

.presenter-pause {
  background: #ff9800;
  color: white;
}

.presenter-reset {
  background: rgba(255,255,255,0.12);
  border: 2px solid rgba(255,255,255,0.25);
  color: white;
}

/* ─── Responsive ─────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .time-display {
    font-size: 3rem;
  }

  .time-input-group {
    font-size: 1.5rem;
  }

  .time-input input {
    width: 80px;
    font-size: 1.5rem;
  }

  .timer-modes {
    flex-direction: column;
    gap: 0.375rem;
  }
}
</style>
