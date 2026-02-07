<template>
  <div class="multistop-view">
    <div class="page-header">
      <h2>{{ t('MULTISTOP.bewerte') }}</h2>
      <p class="page-description">{{ t('MULTISTOP.capture-time') }}</p>
    </div>

    <!-- Class Selection -->
    <div class="card">
      <div class="form-group">
        <label>{{ t('KLASSEN.klasse') }}</label>
        <select v-model="selectedClassId" @change="loadStudents" class="form-input">
          <option value="">{{ t('SELECT.ok') }} {{ t('KLASSEN.klasse') }}</option>
          <option v-for="cls in classes" :key="cls.id" :value="cls.id">
            {{ cls.name }}
          </option>
        </select>
      </div>
      
      <div v-if="selectedClassId" class="form-group">
        <label>{{ t('MULTISTOP.schueler-anzahl') }}</label>
        <input 
          type="number" 
          v-model.number="numberOfStopwatches" 
          min="1" 
          :max="students.length"
          class="form-input"
          @change="resetAllTimers"
        />
      </div>
    </div>

    <!-- Stopwatches Grid -->
    <div v-if="selectedClassId && numberOfStopwatches > 0" class="stopwatches-grid">
      <div 
        v-for="(timer, index) in timers" 
        :key="index"
        class="stopwatch-card"
        :class="{ 
          running: timer.isRunning, 
          stopped: timer.isStopped,
          assigned: timer.studentId 
        }"
      >
        <div class="stopwatch-header">
          <span class="stopwatch-number">#{{ index + 1 }}</span>
          <button 
            v-if="timer.studentId"
            @click="unassignStudent(index)"
            class="btn-icon btn-small"
            :title="t('COMMON.delete')"
          >
            ✕
          </button>
        </div>

        <!-- Student Assignment -->
        <div v-if="!timer.studentId" class="student-select">
          <select 
            v-model="timer.studentId" 
            @change="assignStudent(index)"
            class="form-input form-input-small"
          >
            <option value="">{{ t('MULTISTOP.select-student-hint') }}</option>
            <option 
              v-for="student in availableStudents" 
              :key="student.id" 
              :value="student.id"
            >
              {{ student.firstName }} {{ student.lastName }}
            </option>
          </select>
        </div>
        <div v-else class="student-name">
          {{ getStudentName(timer.studentId) }}
        </div>

        <!-- Time Display -->
        <div class="time-display">
          {{ formatTime(timer.time) }}
        </div>

        <!-- Controls -->
        <div class="stopwatch-controls">
          <button 
            v-if="!timer.isRunning && !timer.isStopped"
            @click="startTimer(index)"
            class="btn-primary btn-small"
            :disabled="!timer.studentId"
          >
            ▶️
          </button>
          <button 
            v-if="timer.isRunning"
            @click="stopTimer(index)"
            class="btn-warning btn-small"
          >
            ⏹️ {{ t('COMMON.stop') || 'Stop' }}
          </button>
          <button 
            v-if="timer.isStopped"
            @click="saveTime(index)"
            class="btn-success btn-small"
          >
            💾 {{ t('COMMON.save') }}
          </button>
          <button 
            v-if="timer.time > 0"
            @click="resetTimer(index)"
            class="btn-secondary btn-small"
          >
            🔄
          </button>
        </div>

        <!-- Lap Times for this stopwatch -->
        <div v-if="timer.laps.length > 0" class="lap-times-mini">
          <small>{{ timer.laps.length }} laps</small>
        </div>
      </div>
    </div>

    <!-- Global Controls -->
    <div v-if="selectedClassId && numberOfStopwatches > 0" class="card">
      <div class="global-controls">
        <button 
          @click="startAllTimers"
          class="btn-primary"
          :disabled="allRunning"
        >
          ▶️ {{ t('COMMON.start-all') || 'Start All' }}
        </button>
        <button 
          @click="stopAllTimers"
          class="btn-warning"
          :disabled="noneRunning"
        >
          ⏹️ {{ t('COMMON.stop-all') || 'Stop All' }}
        </button>
        <button 
          @click="resetAllTimers"
          class="btn-secondary"
        >
          🔄 {{ t('COMMON.reset-all') || 'Reset All' }}
        </button>
        <button 
          @click="saveAllTimes"
          class="btn-success"
          :disabled="!hasStoppedTimers"
        >
          💾 {{ t('COMMON.save-all') || 'Save All' }}
        </button>
      </div>
    </div>

    <!-- Captured Times History -->
    <div v-if="capturedTimes.length > 0" class="card">
      <div class="card-header">
        <h3>{{ t('MULTISTOP.captured-times') }}</h3>
        <button @click="exportTimes" class="btn-secondary btn-small">
          📊 {{ t('COMMON.export') || 'Export' }}
        </button>
      </div>
      <div class="captured-times-list">
        <div 
          v-for="(record, index) in capturedTimes" 
          :key="index"
          class="time-record"
        >
          <div class="record-info">
            <strong>{{ record.studentName }}</strong>
            <span class="record-time">{{ formatTime(record.time) }}</span>
          </div>
          <div class="record-meta">
            <small>{{ new Date(record.timestamp).toLocaleTimeString() }}</small>
            <button 
              @click="deleteRecord(index)"
              class="btn-icon btn-danger btn-small"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div v-if="toast.show" class="toast" :class="toast.type">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getSportBridge, initializeSportBridge } from '../composables/useSportBridge'
import { getStudentsBridge, initializeStudentsBridge } from '../composables/useStudentsBridge'
import type { ClassGroup, Student } from '@viccoboard/core'

const { t } = useI18n()

// Initialize bridges
initializeSportBridge()
initializeStudentsBridge()

const sportBridge = getSportBridge()
const studentsBridge = getStudentsBridge()

// State
const classes = ref<ClassGroup[]>([])
const students = ref<Student[]>([])
const selectedClassId = ref('')
const numberOfStopwatches = ref(4)

interface Timer {
  studentId: string
  time: number
  isRunning: boolean
  isStopped: boolean
  intervalId: number | null
  laps: number[]
}

const timers = ref<Timer[]>([])
const capturedTimes = ref<Array<{
  studentId: string
  studentName: string
  time: number
  timestamp: number
  laps: number[]
}>>([])

const toast = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error'
})

// Computed
const availableStudents = computed(() => {
  const assignedIds = timers.value
    .filter(t => t.studentId)
    .map(t => t.studentId)
  return students.value.filter(s => !assignedIds.includes(s.id))
})

const allRunning = computed(() => {
  return timers.value.every(t => t.isRunning || t.isStopped)
})

const noneRunning = computed(() => {
  return timers.value.every(t => !t.isRunning)
})

const hasStoppedTimers = computed(() => {
  return timers.value.some(t => t.isStopped && t.time > 0)
})

// Initialize timers
function initializeTimers() {
  timers.value = Array.from({ length: numberOfStopwatches.value }, () => ({
    studentId: '',
    time: 0,
    isRunning: false,
    isStopped: false,
    intervalId: null,
    laps: []
  }))
}

// Load data
async function loadClasses() {
  try {
    classes.value = await sportBridge.classGroupRepository.findAll()
  } catch (error) {
    showToast('Error loading classes', 'error')
    console.error(error)
  }
}

async function loadStudents() {
  if (!selectedClassId.value) {
    students.value = []
    return
  }
  
  try {
    students.value = await studentsBridge.studentRepository.findByClassGroup(selectedClassId.value)
    initializeTimers()
  } catch (error) {
    showToast('Error loading students', 'error')
    console.error(error)
  }
}

function getStudentName(studentId: string): string {
  const student = students.value.find(s => s.id === studentId)
  return student ? `${student.firstName} ${student.lastName}` : ''
}

// Timer controls
function startTimer(index: number) {
  const timer = timers.value[index]
  if (!timer.studentId) return
  
  timer.isRunning = true
  timer.isStopped = false
  
  timer.intervalId = window.setInterval(() => {
    timer.time += 10
  }, 10)
}

function stopTimer(index: number) {
  const timer = timers.value[index]
  timer.isRunning = false
  timer.isStopped = true
  
  if (timer.intervalId) {
    clearInterval(timer.intervalId)
    timer.intervalId = null
  }
}

function resetTimer(index: number) {
  const timer = timers.value[index]
  stopTimer(index)
  timer.time = 0
  timer.isStopped = false
  timer.laps = []
}

function assignStudent(_index: number) {
  // Student assigned via v-model
}

function unassignStudent(index: number) {
  resetTimer(index)
  timers.value[index].studentId = ''
}

// Global controls
function startAllTimers() {
  timers.value.forEach((timer, index) => {
    if (timer.studentId && !timer.isRunning && !timer.isStopped) {
      startTimer(index)
    }
  })
}

function stopAllTimers() {
  timers.value.forEach((timer, index) => {
    if (timer.isRunning) {
      stopTimer(index)
    }
  })
}

function resetAllTimers() {
  timers.value.forEach((_, index) => {
    resetTimer(index)
  })
}

// Save times
function saveTime(index: number) {
  const timer = timers.value[index]
  if (!timer.studentId || timer.time === 0) return
  
  capturedTimes.value.push({
    studentId: timer.studentId,
    studentName: getStudentName(timer.studentId),
    time: timer.time,
    timestamp: Date.now(),
    laps: [...timer.laps]
  })
  
  showToast(`Time saved: ${getStudentName(timer.studentId)} - ${formatTime(timer.time)}`, 'success')
  resetTimer(index)
}

function saveAllTimes() {
  let saved = 0
  timers.value.forEach((timer, index) => {
    if (timer.isStopped && timer.time > 0) {
      saveTime(index)
      saved++
    }
  })
  
  if (saved > 0) {
    showToast(`${saved} times saved`, 'success')
  }
}

function deleteRecord(index: number) {
  capturedTimes.value.splice(index, 1)
  showToast('Record deleted', 'success')
}

// Format time in MM:SS.ms
function formatTime(ms: number): string {
  const totalSeconds = ms / 1000
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)
  const milliseconds = Math.floor((ms % 1000) / 10)
  
  const pad = (n: number) => n.toString().padStart(2, '0')
  
  return `${pad(minutes)}:${pad(seconds)}.${pad(milliseconds)}`
}

// Export
function exportTimes() {
  if (capturedTimes.value.length === 0) return
  
  const csv = [
    'Student,Time (mm:ss.ms),Timestamp',
    ...capturedTimes.value.map(record => 
      `"${record.studentName}","${formatTime(record.time)}","${new Date(record.timestamp).toLocaleString()}"`
    )
  ].join('\n')
  
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `multistop-times-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  
  showToast('Times exported', 'success')
}

// Toast
function showToast(message: string, type: 'success' | 'error' = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

// Lifecycle
loadClasses()
initializeTimers()

onUnmounted(() => {
  // Clean up all intervals
  timers.value.forEach(timer => {
    if (timer.intervalId) {
      clearInterval(timer.intervalId)
    }
  })
})
</script>

<style scoped>
.multistop-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.stopwatches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.stopwatch-card {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 1rem;
  background: white;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: all 0.2s;
}

.stopwatch-card.running {
  border-color: #4CAF50;
  background: #f1f8f4;
}

.stopwatch-card.stopped {
  border-color: #ff9800;
  background: #fff8f0;
}

.stopwatch-card.assigned {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.stopwatch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stopwatch-number {
  font-weight: bold;
  color: #666;
}

.student-select select {
  width: 100%;
  font-size: 0.875rem;
}

.student-name {
  font-weight: 600;
  color: #333;
  text-align: center;
  padding: 0.25rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.time-display {
  font-size: 1.75rem;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  text-align: center;
  padding: 0.75rem;
  background: #fafafa;
  border-radius: 8px;
  color: #333;
}

.running .time-display {
  background: #4CAF50;
  color: white;
  animation: pulse 1s infinite;
}

.stopped .time-display {
  background: #ff9800;
  color: white;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
}

.stopwatch-controls {
  display: flex;
  gap: 0.25rem;
  justify-content: center;
  flex-wrap: wrap;
}

.lap-times-mini {
  text-align: center;
  color: #666;
  font-size: 0.75rem;
}

.global-controls {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
  padding: 1rem;
}

.captured-times-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
}

.time-record {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
}

.record-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.record-time {
  font-family: 'Courier New', monospace;
  font-size: 1.125rem;
  font-weight: bold;
  color: #4CAF50;
}

.record-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1000;
  animation: slideIn 0.3s;
}

.toast.success {
  background: #4CAF50;
}

.toast.error {
  background: #f44336;
}

@keyframes slideIn {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .stopwatches-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  
  .time-display {
    font-size: 1.5rem;
  }
  
  .global-controls {
    flex-direction: column;
  }
  
  .global-controls button {
    width: 100%;
  }
}
</style>
