import { computed, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import type { ClassGroup, Student, Sport } from '@viccoboard/core'

import { getSportBridge, initializeSportBridge } from './useSportBridge'
import { getStudentsBridge, initializeStudentsBridge } from './useStudentsBridge'

interface Timer {
  studentId: string
  time: number
  isRunning: boolean
  isStopped: boolean
  intervalId: number | null
  laps: number[]
}

interface CapturedTimeRecord {
  studentId: string
  studentName: string
  time: number
  timestamp: number
  laps: number[]
}

function createTimer(): Timer {
  return {
    studentId: '',
    time: 0,
    isRunning: false,
    isStopped: false,
    intervalId: null,
    laps: []
  }
}

export function useMultistopView() {
  const { t } = useI18n()
  const router = useRouter()

  initializeSportBridge()
  initializeStudentsBridge()

  const sportBridge = getSportBridge()
  const studentsBridge = getStudentsBridge()

  const classes = ref<ClassGroup[]>([])
  const students = ref<Student[]>([])
  const selectedClassId = ref('')
  const numberOfStopwatches = ref(4)
  const mittelstreckeCategories = ref<Sport.GradeCategory[]>([])
  const selectedCategoryId = ref('')
  const sending = ref(false)
  const sessionHistory = ref<Sport.ToolSession[]>([])
  const timers = ref<Timer[]>([])
  const capturedTimes = ref<CapturedTimeRecord[]>([])
  const toast = ref({
    show: false,
    message: '',
    type: 'success' as 'success' | 'error'
  })

  const availableStudents = computed(() => {
    const assignedIds = timers.value.filter(timer => timer.studentId).map(timer => timer.studentId)
    return students.value.filter(student => !assignedIds.includes(student.id))
  })

  const allRunning = computed(() =>
    timers.value.every(timer => timer.isRunning || timer.isStopped)
  )

  const noneRunning = computed(() =>
    timers.value.every(timer => !timer.isRunning)
  )

  const hasStoppedTimers = computed(() =>
    timers.value.some(timer => timer.isStopped && timer.time > 0)
  )

  function initializeTimers() {
    timers.value = Array.from({ length: numberOfStopwatches.value }, createTimer)
  }

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
      mittelstreckeCategories.value = []
      sessionHistory.value = []
      return
    }

    try {
      students.value = await studentsBridge.studentRepository.findByClassGroup(selectedClassId.value)
      initializeTimers()
      await loadMittelstreckeCategories()
      await loadSessionHistory()
    } catch (error) {
      showToast('Error loading students', 'error')
      console.error(error)
    }
  }

  async function loadMittelstreckeCategories() {
    if (!selectedClassId.value) return
    try {
      const all = await sportBridge.gradeCategoryRepository.findByClassGroup(selectedClassId.value)
      mittelstreckeCategories.value = all.filter(
        category => category.type === 'time' || category.type === 'mittelstrecke'
      )
    } catch {
      mittelstreckeCategories.value = []
    }
  }

  async function loadSessionHistory() {
    if (!selectedClassId.value) return
    try {
      const all = await sportBridge.toolSessionRepository.findByClassGroup(selectedClassId.value)
      sessionHistory.value = all
        .filter(session => session.toolType === 'multistop')
        .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
        .slice(0, 10)
    } catch {
      sessionHistory.value = []
    }
  }

  function getStudentName(studentId: string): string {
    const student = students.value.find(candidate => candidate.id === studentId)
    return student ? `${student.firstName} ${student.lastName}` : ''
  }

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
    // assignment happens via v-model
  }

  function unassignStudent(index: number) {
    resetTimer(index)
    timers.value[index].studentId = ''
  }

  function startAllTimers() {
    timers.value.forEach((timer, index) => {
      if (timer.studentId && !timer.isRunning && !timer.isStopped) startTimer(index)
    })
  }

  function stopAllTimers() {
    timers.value.forEach((timer, index) => {
      if (timer.isRunning) stopTimer(index)
    })
  }

  function resetAllTimers() {
    timers.value.forEach((_, index) => {
      resetTimer(index)
    })
  }

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

  async function saveAllTimes() {
    let saved = 0
    timers.value.forEach((timer, index) => {
      if (timer.isStopped && timer.time > 0) {
        saveTime(index)
        saved++
      }
    })
    if (saved > 0) {
      showToast(`${saved} times saved`, 'success')
      await persistSession()
    }
  }

  async function persistSession(): Promise<string | null> {
    if (!selectedClassId.value || capturedTimes.value.length === 0) return null
    try {
      const session = await sportBridge.saveMultistopSessionUseCase.execute({
        classGroupId: selectedClassId.value,
        results: capturedTimes.value.map(record => ({
          studentId: record.studentId,
          studentName: record.studentName,
          timeMs: record.time,
          laps: record.laps
        }))
      })
      showToast(t('MULTISTOP.session-saved'), 'success')
      await loadSessionHistory()
      return session.id
    } catch (error) {
      console.error('Failed to persist multistop session', error)
      return null
    }
  }

  async function sendToMittelstrecke() {
    if (!selectedCategoryId.value) return
    sending.value = true
    try {
      const sessionId = await persistSession()
      const query: Record<string, string> = {}
      if (sessionId) query.sessionId = sessionId
      router.push({
        name: 'mittelstrecke-grading',
        params: { id: selectedCategoryId.value },
        query
      })
    } finally {
      sending.value = false
    }
  }

  function deleteRecord(index: number) {
    capturedTimes.value.splice(index, 1)
    showToast('Record deleted', 'success')
  }

  function formatTime(ms: number): string {
    const totalSeconds = ms / 1000
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = Math.floor(totalSeconds % 60)
    const milliseconds = Math.floor((ms % 1000) / 10)
    const pad = (value: number) => value.toString().padStart(2, '0')
    return `${pad(minutes)}:${pad(seconds)}.${pad(milliseconds)}`
  }

  function formatSessionDate(date: Date): string {
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

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
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `multistop-times-${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
    showToast('Times exported', 'success')
  }

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    toast.value = { show: true, message, type }
    setTimeout(() => {
      toast.value.show = false
    }, 3000)
  }

  watch(selectedClassId, async (newId) => {
    if (newId) await loadMittelstreckeCategories()
  })

  loadClasses()
  initializeTimers()

  onUnmounted(() => {
    timers.value.forEach(timer => {
      if (timer.intervalId) clearInterval(timer.intervalId)
    })
  })

  return {
    allRunning,
    assignStudent,
    availableStudents,
    capturedTimes,
    classes,
    deleteRecord,
    exportTimes,
    formatSessionDate,
    formatTime,
    getStudentName,
    hasStoppedTimers,
    loadStudents,
    mittelstreckeCategories,
    noneRunning,
    numberOfStopwatches,
    resetAllTimers,
    resetTimer,
    saveAllTimes,
    saveTime,
    selectedCategoryId,
    selectedClassId,
    sendToMittelstrecke,
    sending,
    sessionHistory,
    startAllTimers,
    startTimer,
    stopAllTimers,
    stopTimer,
    students,
    timers,
    toast,
    unassignStudent
  }
}
