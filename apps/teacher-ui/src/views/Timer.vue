<template>
  <div class="timer-view">
    <div class="page-header">
      <h2>{{ t('TIMER.set') }}</h2>
      <p class="page-description">{{ t('TIMER.settings') }}</p>
    </div>

    <!-- Timer Mode Selection -->
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

    <!-- Countdown Timer -->
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
        <div class="time-display" :class="{ warning: timeRemaining < 10000, finished: timeRemaining === 0 }">
          {{ formatTime(timeRemaining) }}
        </div>
        <div class="timer-controls">
          <button class="btn-secondary" @click="pauseTimer" v-if="isRunning && !isPaused">
            ⏸️ {{ t('COMMON.pause') || 'Pause' }}
          </button>
          <button class="btn-primary" @click="resumeTimer" v-if="isPaused">
            ▶️ {{ t('COMMON.resume') || 'Resume' }}
          </button>
          <button class="btn-danger" @click="resetTimer">
            🔄 {{ t('COMMON.reset') || 'Reset' }}
          </button>
        </div>
        <div v-if="timeRemaining === 0" class="timer-finished">
          <h3>{{ t('TIMER.finished') }}</h3>
        </div>
      </div>
    </div>

    <!-- Stopwatch -->
    <div v-if="mode === 'stopwatch'" class="card timer-card">
      <div class="timer-display">
        <div class="time-display">
          {{ formatTime(elapsedTime) }}
        </div>
        <div class="timer-controls">
          <button class="btn-primary btn-large" @click="startStopwatch" v-if="!isRunning">
            ▶️ {{ t('COMMON.start') || 'Start' }}
          </button>
          <button class="btn-secondary" @click="pauseTimer" v-if="isRunning && !isPaused">
            ⏸️ {{ t('COMMON.pause') || 'Pause' }}
          </button>
          <button class="btn-primary" @click="resumeTimer" v-if="isPaused">
            ▶️ {{ t('COMMON.resume') || 'Resume' }}
          </button>
          <button class="btn-warning" @click="recordLap" v-if="isRunning || isPaused">
            ⏱️ Lap
          </button>
          <button class="btn-danger" @click="resetTimer">
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

    <!-- Interval Timer -->
    <div v-if="mode === 'interval'" class="card timer-card">
      <div class="timer-setup" v-if="!isRunning && !isPaused">
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

      <div class="timer-display" v-else>
        <div class="interval-info">
          <div class="current-phase" :class="currentPhase">
            {{ currentPhase === 'work' ? t('TIMER.workout') : t('TIMER.rest') }}
          </div>
          <div class="round-info">
            {{ t('TIMER.round') }} {{ currentRound }} / {{ rounds }}
          </div>
        </div>
        <div class="time-display" :class="{ work: currentPhase === 'work', rest: currentPhase === 'rest' }">
          {{ formatTime(timeRemaining) }}
        </div>
        <div class="timer-controls">
          <button class="btn-secondary" @click="pauseTimer" v-if="isRunning && !isPaused">
            ⏸️ {{ t('COMMON.pause') || 'Pause' }}
          </button>
          <button class="btn-primary" @click="resumeTimer" v-if="isPaused">
            ▶️ {{ t('COMMON.resume') || 'Resume' }}
          </button>
          <button class="btn-danger" @click="resetTimer">
            🔄 {{ t('COMMON.reset') || 'Reset' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Sound Settings -->
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

    <!-- Save Result -->
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
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSportBridge } from '../composables/useSportBridge'
import { useToast } from '../composables/useToast'
import { v4 as uuidv4 } from 'uuid'

const { t } = useI18n()
const { SportBridge } = useSportBridge()
const toast = useToast()

// State
const mode = ref<'countdown' | 'stopwatch' | 'interval'>('countdown')
const isRunning = ref(false)
const isPaused = ref(false)
const soundEnabled = ref(true)
const saving = ref(false)
const sessionId = ref(uuidv4())

// Countdown state
const countdownMinutes = ref(5)
const countdownSeconds = ref(0)
const timeRemaining = ref(0)
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

// Format time in MM:SS or HH:MM:SS
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

// Countdown timer
function startCountdown() {
  const totalMs = (countdownMinutes.value * 60 + countdownSeconds.value) * 1000
  if (totalMs === 0) return

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

// Stopwatch
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
    time: elapsedTime.value
  })
}

// Interval timer
function startInterval() {
  currentRound.value = 1
  currentPhase.value = 'work'
  timeRemaining.value = workTime.value * 1000
  isRunning.value = true
  isPaused.value = false

  intervalId = window.setInterval(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value -= 100
    } else {
      // Phase transition
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

// Timer controls
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
  // Simple beep using Web Audio API
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
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
      elapsedMs = (currentRound.value - 1) * (workTime.value + restTime.value) * 1000 + 
                  (currentPhase.value === 'rest' ? restTime.value * 1000 : workTime.value * 1000)
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
        lapTimes: mode.value === 'stopwatch' ? lapTimes.value : undefined
      }
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

.timer-display {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
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

.time-display.warning {
  color: #ff9800;
  animation: pulse 1s infinite;
}

.time-display.finished {
  color: #4CAF50;
}

.time-display.work {
  background: #4CAF50;
  color: white;
}

.time-display.rest {
  background: #2196F3;
  color: white;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.timer-controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1.25rem;
}

.timer-finished {
  text-align: center;
  color: #4CAF50;
  font-size: 1.5rem;
}

.interval-setup {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 400px;
}

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
}
</style>
