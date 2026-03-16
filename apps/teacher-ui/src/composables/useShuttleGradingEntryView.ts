import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

import type { Student, Sport } from '@viccoboard/core'

import { getSportBridge, initializeSportBridge } from './useSportBridge'
import { getStudentsBridge, initializeStudentsBridge } from './useStudentsBridge'
import {
  formatSessionDate,
  formatTime,
  playBeep,
  sessionKey,
  type HistoryGroup,
  type SessionSnapshot,
  type ShuttleResult
} from './shuttle-grading-entry.utils'
import { buildShuttleRunSchedule, getCurrentShuttleSegment } from '../utils/shuttle-run-schedule'

export function useShuttleGradingEntryView() {
  const { t, locale } = useI18n()
  const route = useRoute()

  initializeSportBridge()
  initializeStudentsBridge()

  const sportBridge = getSportBridge()
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
  const results = ref<Record<string, ShuttleResult>>({})
  const savedSession = ref<SessionSnapshot | null>(null)
  const allEntries = ref<Sport.PerformanceEntry[]>([])

  const isRunning = ref(false)
  const isPaused = ref(false)
  const elapsedMs = ref(0)
  const soundEnabled = ref(true)
  let intervalId: number | null = null
  let lastSegmentIndex = -1
  let startEpoch = 0
  let accumulatedMs = 0

  const historyGroups = computed<HistoryGroup[]>(() => {
    if (allEntries.value.length === 0) return []

    const byDate = new Map<string, Sport.PerformanceEntry[]>()
    for (const entry of allEntries.value) {
      const date = new Date(entry.timestamp).toLocaleDateString(locale.value, {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
      if (!byDate.has(date)) byDate.set(date, [])
      byDate.get(date)!.push(entry)
    }

    return Array.from(byDate.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, entries]) => ({ date, entries }))
  })

  const studentMap = computed<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const student of students.value) {
      map[student.id] = `${student.firstName} ${student.lastName}`
    }
    return map
  })

  const currentDate = computed(() =>
    new Date().toLocaleDateString(locale.value, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  )

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
      // localStorage unavailable
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

  function clearStoredSession() {
    if (!category.value) return
    try {
      localStorage.removeItem(sessionKey(category.value.id))
    } catch {
      // ignore
    }
  }

  function reopenSession() {
    if (!savedSession.value) return
    const snapshot = savedSession.value
    selectedTableId.value = snapshot.selectedTableId
    selectedConfigId.value = snapshot.selectedConfigId
    elapsedMs.value = snapshot.elapsedMs
    accumulatedMs = snapshot.elapsedMs
    soundEnabled.value = snapshot.soundEnabled
    results.value = snapshot.results
    savedSession.value = null
    clearStoredSession()
  }

  function discardSession() {
    savedSession.value = null
    clearStoredSession()
  }

  function studentName(id: string): string {
    return studentMap.value[id] ?? id
  }

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
      if (lastSegmentIndex !== -1 && soundEnabled.value) playBeep()
      lastSegmentIndex = index
    }
  }

  function startTest() {
    if (!selectedConfig.value || runSchedule.value.length === 0) return
    resetTimerState()
    isRunning.value = true
    startEpoch = Date.now()
    intervalId = window.setInterval(tick, 100)
    if (soundEnabled.value) playBeep()
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
    if (!selectedTable.value) return
    try {
      entry.grade = sportBridge.shuttleRunService.calculateGradeFromTable(
        selectedTable.value,
        entry.level,
        entry.lane
      )
    } catch {
      entry.grade = undefined
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
        return sportBridge.recordShuttleRunResultUseCase.execute({
          studentId: student.id,
          categoryId: category.value!.id,
          configId: selectedConfigId.value,
          level: Number(entry.level),
          lane: Number(entry.lane),
          calculatedGrade: entry.grade
        })
      }).filter(Boolean) as Promise<unknown>[]

      if (entries.length === 0) {
        errorMessage.value = t('COMMON.error')
        return
      }

      await Promise.all(entries)
      successMessage.value = t('COMMON.success')
      clearStoredSession()
      allEntries.value = await sportBridge.performanceEntryRepository.findByCategory(category.value.id)
    } catch {
      errorMessage.value = t('COMMON.error')
    } finally {
      saving.value = false
    }
  }

  async function handleConfigChange() {
    if (!category.value) return
    const config = category.value.configuration as Sport.ShuttleGradingConfig
    await sportBridge.gradeCategoryRepository.update(category.value.id, {
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
      category.value = await sportBridge.gradeCategoryRepository.findById(categoryId)
      if (!category.value) {
        errorMessage.value = t('COMMON.error')
        loading.value = false
        return
      }

      students.value = await studentsBridge.studentRepository.findByClassGroup(category.value.classGroupId)
      tables.value = await sportBridge.tableDefinitionRepository.findAll()
      configs.value = await sportBridge.shuttleRunConfigRepository.findAll()
      const existingEntries = await sportBridge.performanceEntryRepository.findByCategory(category.value.id)
      allEntries.value = existingEntries

      const config = category.value.configuration as Sport.ShuttleGradingConfig
      selectedTableId.value = config.gradingTable ?? ''
      selectedConfigId.value = config.configId ?? ''
      initResults(existingEntries)

      const stored = loadSessionFromStorage(category.value.id)
      if (stored) savedSession.value = stored
    } catch {
      errorMessage.value = t('COMMON.error')
    } finally {
      loading.value = false
    }
  })

  return {
    availableLanes,
    availableLevels,
    category,
    clearStudent,
    configs,
    currentDate,
    currentLane,
    currentLevel,
    currentSegment,
    discardSession,
    elapsedMs,
    errorMessage,
    formatSessionDate: (iso: string) => formatSessionDate(iso, locale.value),
    formatTime,
    handleConfigChange,
    historyGroups,
    isPaused,
    isRunning,
    loading,
    recalculate,
    reopenSession,
    resetAll,
    resetTimerState,
    results,
    resumeTest,
    saveAll,
    savedSession,
    saveSessionState,
    saving,
    selectedConfig,
    selectedConfigId,
    selectedTableId,
    soundEnabled,
    startTest,
    stopStudent,
    studentName,
    students,
    successMessage,
    tables,
    finishTest,
    pauseTest
  }
}
