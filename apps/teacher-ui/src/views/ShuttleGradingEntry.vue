<template>
  <div class="shuttle-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← {{ t('COMMON.back') }}</button>
      <h2>{{ t('SHUTTLE.bewerte-shuttle') }} {{ currentDate }}</h2>
      <p class="page-description">{{ t('SHUTTLE.tabelle') }}</p>
    </div>

    <section class="card" v-if="loading">
      <div class="loading-state">
        <div class="spinner"></div>
        <p>{{ t('COMMON.loading') }}</p>
      </div>
    </section>

    <section v-else-if="category" class="card">
      <div class="config-row">
        <div class="form-group">
          <label>{{ t('SHUTTLE.tabelle') }}</label>
          <select v-model="selectedTableId" class="form-input" @change="handleConfigChange">
            <option value="">{{ t('SHUTTLE.tabelle') }}...</option>
            <option v-for="table in tables" :key="table.id" :value="table.id">
              {{ table.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ t('SHUTTLE.stufe') }}</label>
          <select v-model="selectedConfigId" class="form-input" @change="handleConfigChange">
            <option value="">{{ t('SHUTTLE.level') }}...</option>
            <option v-for="config in configs" :key="config.id" :value="config.id">
              {{ config.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Session reopen banner -->
      <div v-if="savedSession" class="session-banner">
        <span>{{ t('SHUTTLE.session-saved-at') }} {{ formatSessionDate(savedSession.savedAt) }}</span>
        <div class="session-banner-actions">
          <button class="btn-session-reopen" @click="reopenSession">{{ t('SHUTTLE.session-reopen') }}</button>
          <button class="btn-session-discard" @click="discardSession">{{ t('SHUTTLE.session-discard') }}</button>
        </div>
      </div>

      <div class="timer-panel" v-if="selectedConfig">
        <div class="timer-status">
          <div class="status-item">
            <span class="status-label">{{ t('SHUTTLE.elapsed') }}</span>
            <span class="status-value">{{ formatTime(elapsedMs) }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">{{ t('SHUTTLE.current-level') }}</span>
            <span class="status-value">{{ currentLevel || '—' }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">{{ t('SHUTTLE.current-lane') }}</span>
            <span class="status-value">{{ currentLane || '—' }}</span>
          </div>
        </div>
        <div class="timer-controls">
          <button class="btn-primary" @click="startTest" :disabled="isRunning || !selectedConfig">
            {{ t('SHUTTLE.start') }}
          </button>
          <button class="btn-secondary" @click="pauseTest" :disabled="!isRunning">
            {{ t('SHUTTLE.pause') }}
          </button>
          <button class="btn-secondary" @click="resumeTest" :disabled="!isPaused">
            {{ t('SHUTTLE.resume') }}
          </button>
          <button class="btn-secondary" @click="finishTest" :disabled="!isRunning && !isPaused">
            {{ t('SHUTTLE.finish') }}
          </button>
          <button class="btn-secondary" @click="resetTimerState" :disabled="isRunning">
            {{ t('SHUTTLE.reset') }}
          </button>
        </div>
        <label class="sound-toggle">
          <input type="checkbox" v-model="soundEnabled" />
          {{ t('SHUTTLE.sound-enabled') }}
        </label>
      </div>

      <div v-if="!selectedTableId || !selectedConfigId" class="warning-banner">
        {{ t('COMMON.error') }}
      </div>

      <div class="table-wrapper" v-if="students.length > 0">
        <table class="shuttle-table">
          <thead>
            <tr>
              <th>{{ t('SCHUELER.schueler') }}</th>
              <th>{{ t('SHUTTLE.level') }}</th>
              <th>{{ t('SHUTTLE.bahn') }}</th>
              <th>{{ t('SHUTTLE.note') }}</th>
              <th>{{ t('SHUTTLE.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in students" :key="student.id">
              <td class="student-name">{{ student.firstName }} {{ student.lastName }}</td>
              <td>
                <select
                  v-model.number="results[student.id].level"
                  class="table-input"
                  :disabled="!selectedConfig"
                  @change="recalculate(student.id)"
                >
                  <option value="">{{ t('SHUTTLE.level') }}</option>
                  <option v-for="level in availableLevels" :key="level" :value="level">
                    {{ level }}
                  </option>
                </select>
              </td>
              <td>
                <select
                  v-model.number="results[student.id].lane"
                  class="table-input"
                  :disabled="!selectedConfig || !results[student.id].level"
                  @change="recalculate(student.id)"
                >
                  <option value="">{{ t('SHUTTLE.bahn') }}</option>
                  <option v-for="lane in availableLanes(results[student.id].level)" :key="lane" :value="lane">
                    {{ lane }}
                  </option>
                </select>
              </td>
              <td class="grade-cell">{{ results[student.id].grade ?? '—' }}</td>
              <td class="action-cell">
                <button
                  class="btn-secondary btn-stop"
                  @click="stopStudent(student.id)"
                  :disabled="!isRunning || !currentSegment"
                >
                  {{ t('SHUTTLE.stop') }}
                </button>
                <button
                  class="btn-secondary btn-clear"
                  @click="clearStudent(student.id)"
                  :disabled="isRunning"
                >
                  {{ t('SHUTTLE.clear') }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="form-actions">
        <button class="btn-secondary" @click="resetAll" :disabled="saving">
          {{ t('SHUTTLE.noten-neu') }}
        </button>
        <button class="btn-secondary" @click="saveSessionState" :disabled="isRunning">
          {{ t('SHUTTLE.session-save') }}
        </button>
        <button class="btn-primary" @click="saveAll" :disabled="saving || !selectedTableId || !selectedConfigId">
          {{ saving ? t('COMMON.loading') : t('COMMON.save') }}
        </button>
      </div>

      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
      <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
    </section>

    <section v-else class="card">
      <p class="empty-state">{{ t('COMMON.error') }}</p>
    </section>

    <!-- Session History -->
    <section v-if="historyGroups.length > 0" class="card history-card">
      <h3 class="history-title">{{ t('SHUTTLE.history-title') }}</h3>
      <div v-for="group in historyGroups" :key="group.date" class="history-group">
        <p class="history-date">{{ group.date }}</p>
        <table class="history-table">
          <thead>
            <tr>
              <th>{{ t('SCHUELER.schueler') }}</th>
              <th>{{ t('SHUTTLE.level') }}</th>
              <th>{{ t('SHUTTLE.bahn') }}</th>
              <th>{{ t('SHUTTLE.note') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in group.entries" :key="entry.id">
              <td>{{ studentName(entry.studentId) }}</td>
              <td>{{ entry.measurements.level ?? '—' }}</td>
              <td>{{ entry.measurements.lane ?? '—' }}</td>
              <td>{{ entry.calculatedGrade ?? '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getSportBridge, initializeSportBridge } from '../composables/useSportBridge'
import { getStudentsBridge, initializeStudentsBridge } from '../composables/useStudentsBridge'
import type { Student, Sport } from '@viccoboard/core'
import { buildShuttleRunSchedule, getCurrentShuttleSegment } from '../utils/shuttle-run-schedule'

const { t, locale } = useI18n()
const route = useRoute()

initializeSportBridge()
initializeStudentsBridge()

const SportBridge = getSportBridge()
const studentsBridge = getStudentsBridge()

const category = ref<Sport.GradeCategory | null>(null)
const students = ref<Student[]>([])
const tables = ref<Sport.TableDefinition[]>([])
const configs = ref<Sport.ShuttleRunConfig[]>([])
const selectedTableId = ref('')
const selectedConfigId = ref('')
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

interface ShuttleResult {
  level: number | ''
  lane: number | ''
  grade?: string | number
  stopped?: boolean
}

const results = ref<Record<string, ShuttleResult>>({})

// ─── Session persistence ────────────────────────────────────────────────────

interface SessionSnapshot {
  categoryId: string
  selectedTableId: string
  selectedConfigId: string
  elapsedMs: number
  soundEnabled: boolean
  results: Record<string, ShuttleResult>
  savedAt: string
}

const savedSession = ref<SessionSnapshot | null>(null)

function sessionKey(categoryId: string): string {
  return `shuttle-session:${categoryId}`
}

function saveSessionState() {
  if (!category.value) return
  const snapshot: SessionSnapshot = {
    categoryId: category.value.id,
    selectedTableId: selectedTableId.value,
    selectedConfigId: selectedConfigId.value,
    elapsedMs: elapsedMs.value,
    soundEnabled: soundEnabled.value,
    results: structuredClone(results.value),
    savedAt: new Date().toISOString()
  }
  try {
    localStorage.setItem(sessionKey(category.value.id), JSON.stringify(snapshot))
    savedSession.value = null
    successMessage.value = t('SHUTTLE.session-saved')
    setTimeout(() => { successMessage.value = '' }, 3000)
  } catch {
    // localStorage unavailable – silently skip
  }
}

function loadSessionFromStorage(categoryId: string): SessionSnapshot | null {
  try {
    const raw = localStorage.getItem(sessionKey(categoryId))
    if (!raw) return null
    return JSON.parse(raw) as SessionSnapshot
  } catch {
    return null
  }
}

function reopenSession() {
  if (!savedSession.value) return
  const s = savedSession.value
  selectedTableId.value = s.selectedTableId
  selectedConfigId.value = s.selectedConfigId
  elapsedMs.value = s.elapsedMs
  accumulatedMs = s.elapsedMs
  soundEnabled.value = s.soundEnabled
  results.value = s.results
  savedSession.value = null
  clearStoredSession()
}

function discardSession() {
  savedSession.value = null
  clearStoredSession()
}

function clearStoredSession() {
  if (!category.value) return
  try {
    localStorage.removeItem(sessionKey(category.value.id))
  } catch {
    // ignore
  }
}

// ─── History ─────────────────────────────────────────────────────────────────

interface HistoryGroup {
  date: string
  entries: Sport.PerformanceEntry[]
}

const allEntries = ref<Sport.PerformanceEntry[]>([])

const historyGroups = computed<HistoryGroup[]>(() => {
  if (allEntries.value.length === 0) return []

  const byDate = new Map<string, Sport.PerformanceEntry[]>()
  for (const entry of allEntries.value) {
    const d = new Date(entry.timestamp).toLocaleDateString(locale.value, {
      weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
    })
    if (!byDate.has(d)) byDate.set(d, [])
    byDate.get(d)!.push(entry)
  }

  return Array.from(byDate.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, entries]) => ({ date, entries }))
})

const studentMap = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  for (const s of students.value) {
    map[s.id] = `${s.firstName} ${s.lastName}`
  }
  return map
})

function studentName(id: string): string {
  return studentMap.value[id] ?? id
}

// ─── Timer ───────────────────────────────────────────────────────────────────

const currentDate = computed(() => {
  return new Date().toLocaleDateString(locale.value, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const isRunning = ref(false)
const isPaused = ref(false)
const elapsedMs = ref(0)
const soundEnabled = ref(true)
let intervalId: number | null = null
let lastSegmentIndex = -1
let startEpoch = 0
let accumulatedMs = 0

const selectedTable = computed(() =>
  tables.value.find(table => table.id === selectedTableId.value) || null
)

const selectedConfig = computed(() =>
  configs.value.find(config => config.id === selectedConfigId.value) || null
)

const runSchedule = computed(() => {
  if (!selectedConfig.value) return []
  return buildShuttleRunSchedule(selectedConfig.value.levels)
})

const totalDurationMs = computed(() => {
  if (runSchedule.value.length === 0) return 0
  return runSchedule.value[runSchedule.value.length - 1].endMs
})

const currentSegment = computed(() =>
  getCurrentShuttleSegment(runSchedule.value, elapsedMs.value)
)

const currentLevel = computed(() => currentSegment.value?.level ?? '')
const currentLane = computed(() => currentSegment.value?.lane ?? '')

const availableLevels = computed(() => {
  if (!selectedConfig.value) return []
  const levels = selectedConfig.value.levels.map(level => level.level)
  return Array.from(new Set(levels)).sort((a, b) => a - b)
})

function availableLanes(level: number | ''): number[] {
  if (!selectedConfig.value || level === '') return []
  return selectedConfig.value.levels
    .filter(entry => entry.level === level)
    .map(entry => entry.lane)
    .sort((a, b) => a - b)
}

function initResults(existingEntries: Sport.PerformanceEntry[] = []) {
  const initial: Record<string, ShuttleResult> = {}
  students.value.forEach(student => {
    const entry = existingEntries.find(item => item.studentId === student.id)
    const measurements = entry?.measurements || {}

    initial[student.id] = {
      level: Number(measurements.level) || '',
      lane: Number(measurements.lane) || '',
      grade: entry?.calculatedGrade,
      stopped: false
    }
  })
  results.value = initial
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const pad = (value: number) => value.toString().padStart(2, '0')
  return `${pad(minutes)}:${pad(seconds)}`
}

function formatSessionDate(iso: string): string {
  return new Date(iso).toLocaleString(locale.value, {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

function playBeep() {
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
  } catch (error) {
    console.warn('Audio not available:', error)
  }
}

function tick() {
  if (!isRunning.value) return
  elapsedMs.value = accumulatedMs + (Date.now() - startEpoch)

  if (totalDurationMs.value > 0 && elapsedMs.value >= totalDurationMs.value) {
    elapsedMs.value = totalDurationMs.value
    finishTest()
    return
  }

  const segment = getCurrentShuttleSegment(runSchedule.value, elapsedMs.value)
  const index = segment ? runSchedule.value.indexOf(segment) : -1
  if (index !== lastSegmentIndex && index !== -1) {
    if (lastSegmentIndex !== -1 && soundEnabled.value) {
      playBeep()
    }
    lastSegmentIndex = index
  }
}

function startTest() {
  if (!selectedConfig.value || runSchedule.value.length === 0) return
  resetTimerState()
  isRunning.value = true
  startEpoch = Date.now()
  intervalId = window.setInterval(tick, 100)
  if (soundEnabled.value) {
    playBeep()
  }
}

function pauseTest() {
  if (!isRunning.value) return
  isRunning.value = false
  isPaused.value = true
  accumulatedMs = elapsedMs.value
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
}

function resumeTest() {
  if (!isPaused.value) return
  isPaused.value = false
  isRunning.value = true
  startEpoch = Date.now()
  intervalId = window.setInterval(tick, 100)
}

function finishTest() {
  isRunning.value = false
  isPaused.value = false
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
  if (soundEnabled.value && elapsedMs.value >= totalDurationMs.value) {
    playBeep()
  }
}

function resetTimerState() {
  isRunning.value = false
  isPaused.value = false
  elapsedMs.value = 0
  accumulatedMs = 0
  startEpoch = 0
  lastSegmentIndex = -1
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
}

function recalculate(studentId: string) {
  const entry = results.value[studentId]
  if (!entry || entry.level === '' || entry.lane === '') {
    entry.grade = undefined
    return
  }

  if (selectedTable.value) {
    try {
      entry.grade = SportBridge.shuttleRunService.calculateGradeFromTable(
        selectedTable.value,
        entry.level,
        entry.lane
      )
    } catch (error) {
      entry.grade = undefined
    }
  }
}

function resetAll() {
  students.value.forEach(student => {
    results.value[student.id].level = ''
    results.value[student.id].lane = ''
    results.value[student.id].grade = undefined
    results.value[student.id].stopped = false
  })
}

function stopStudent(studentId: string) {
  const segment = currentSegment.value
  if (!segment) return

  results.value[studentId].level = segment.level
  results.value[studentId].lane = segment.lane
  results.value[studentId].stopped = true
  recalculate(studentId)
}

function clearStudent(studentId: string) {
  results.value[studentId].level = ''
  results.value[studentId].lane = ''
  results.value[studentId].grade = undefined
  results.value[studentId].stopped = false
}

async function saveAll() {
  if (!category.value || !selectedTableId.value || !selectedConfigId.value) return

  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const entries = students.value.map(student => {
      const entry = results.value[student.id]
      if (!entry || entry.level === '' || entry.lane === '') return null

      return SportBridge.recordShuttleRunResultUseCase.execute({
        studentId: student.id,
        categoryId: category.value!.id,
        configId: selectedConfigId.value,
        level: Number(entry.level),
        lane: Number(entry.lane),
        calculatedGrade: entry.grade
      })
    }).filter(Boolean) as Promise<any>[]

    if (entries.length === 0) {
      errorMessage.value = t('COMMON.error')
      return
    }

    await Promise.all(entries)
    successMessage.value = t('COMMON.success')
    clearStoredSession()
    allEntries.value = await SportBridge.performanceEntryRepository.findByCategory(category.value.id)
  } catch (error) {
    errorMessage.value = t('COMMON.error')
  } finally {
    saving.value = false
  }
}

async function handleConfigChange() {
  if (!category.value) return
  const config = category.value.configuration as Sport.ShuttleGradingConfig

  await SportBridge.gradeCategoryRepository.update(category.value.id, {
    configuration: {
      ...config,
      gradingTable: selectedTableId.value || undefined,
      configId: selectedConfigId.value || undefined
    }
  })

  resetTimerState()
  students.value.forEach(student => recalculate(student.id))
}

watch(selectedConfig, (config) => {
  resetTimerState()
  soundEnabled.value = config?.audioSignalsEnabled ?? true
})

onMounted(async () => {
  try {
    const categoryId = route.params.id as string
    category.value = await SportBridge.gradeCategoryRepository.findById(categoryId)

    if (!category.value) {
      errorMessage.value = t('COMMON.error')
      loading.value = false
      return
    }

    students.value = await studentsBridge.studentRepository.findByClassGroup(category.value.classGroupId)
    tables.value = await SportBridge.tableDefinitionRepository.findAll()
    configs.value = await SportBridge.shuttleRunConfigRepository.findAll()
    const existingEntries = await SportBridge.performanceEntryRepository.findByCategory(category.value.id)
    allEntries.value = existingEntries

    const config = category.value.configuration as Sport.ShuttleGradingConfig
    selectedTableId.value = config.gradingTable ?? ''
    selectedConfigId.value = config.configId ?? ''

    initResults(existingEntries)

    // Offer to reopen a saved (paused) session if one exists
    const stored = loadSessionFromStorage(category.value.id)
    if (stored) {
      savedSession.value = stored
    }
  } catch (error) {
    errorMessage.value = t('COMMON.error')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.shuttle-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  margin-bottom: 0;
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
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.config-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-input {
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #ddd;
}

/* Session banner */
.session-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: #e0f2fe;
  border: 1px solid #7dd3fc;
  color: #0c4a6e;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.session-banner-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-session-reopen {
  padding: 0.4rem 0.9rem;
  border-radius: 6px;
  border: none;
  background: #0284c7;
  color: white;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  min-height: 36px;
}

.btn-session-discard {
  padding: 0.4rem 0.9rem;
  border-radius: 6px;
  border: 1px solid #7dd3fc;
  background: white;
  color: #0c4a6e;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  min-height: 36px;
}

.warning-banner {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  background: #fff3cd;
  color: #856404;
  margin-bottom: 1rem;
}

.timer-panel {
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #eee;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.timer-status {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem;
}

.status-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.status-label {
  font-size: 0.85rem;
  color: #666;
}

.status-value {
  font-size: 1.1rem;
  font-weight: 700;
}

.timer-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.sound-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.table-wrapper {
  overflow-x: auto;
}

.shuttle-table {
  width: 100%;
  border-collapse: collapse;
}

.shuttle-table th,
.shuttle-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
  text-align: left;
}

.student-name {
  font-weight: 600;
}

.table-input {
  width: 100%;
  min-width: 90px;
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid #ddd;
}

.grade-cell {
  font-weight: 700;
}

.action-cell {
  display: flex;
  gap: 0.5rem;
}

.btn-stop,
.btn-clear {
  padding: 0.5rem 0.75rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
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

.btn-secondary {
  background: white;
  border: 2px solid #ddd;
  color: #333;
}

.loading-state {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 6px;
  background: #ffebee;
  color: #c62828;
}

.success-message {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 6px;
  background: #e8f5e9;
  color: #2e7d32;
}

/* History */
.history-card {
  padding: 1.5rem;
}

.history-title {
  margin: 0 0 1rem;
  font-size: 1rem;
  color: #0f172a;
}

.history-group {
  margin-bottom: 1.5rem;
}

.history-date {
  font-size: 0.875rem;
  font-weight: 700;
  color: #0f766e;
  margin: 0 0 0.5rem;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.history-table th {
  text-align: left;
  padding: 0.4rem 0.6rem;
  border-bottom: 2px solid #e2e8f0;
  color: #475569;
  font-weight: 600;
}

.history-table td {
  padding: 0.4rem 0.6rem;
  border-bottom: 1px solid #f1f5f9;
}

@media (max-width: 768px) {
  .form-actions {
    flex-direction: column;
  }
}
</style>
