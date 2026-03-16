import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import type { ClassGroup, Student, Sport } from '@viccoboard/core'
import type { FinishCameraEvent } from '@viccoboard/sport'

import { getSportBridge, initializeSportBridge } from './useSportBridge'
import { getStudentsBridge, initializeStudentsBridge } from './useStudentsBridge'

const DEBOUNCE_MS = 800
const DETECTION_ZONE_HALF_HEIGHT = 12
const THUMBNAIL_JPEG_QUALITY = 0.5
const CANVAS_W = 640
const CANVAS_H = 360

type EventWithFrame = FinishCameraEvent & { frameDataUrl?: string }

function generateId(): string {
  return `fc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSec / 60)
  const seconds = totalSec % 60
  const hundredths = Math.floor((ms % 1000) / 10)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`
}

function mapSessionEvents(events: EventWithFrame[]) {
  return events.map((event) => ({
    id: event.id,
    elapsedMs: event.elapsedMs,
    recordedAt: event.recordedAt,
    manual: event.manual,
    studentId: event.studentId,
    studentName: event.studentName
  }))
}

export function useFinishCameraView() {
  initializeSportBridge()
  initializeStudentsBridge()

  const { t } = useI18n()
  const router = useRouter()
  const sportBridge = getSportBridge()
  const studentsBridge = getStudentsBridge()

  const classes = ref<ClassGroup[]>([])
  const students = ref<Student[]>([])
  const selectedClassId = ref('')
  const mittelstreckeCategories = ref<Sport.GradeCategory[]>([])
  const selectedCategoryId = ref('')
  const saving = ref(false)
  const sending = ref(false)

  const cameraActive = ref(false)
  const cameraError = ref('')
  const mediaStream = ref<MediaStream | null>(null)

  const liveVideo = ref<HTMLVideoElement | null>(null)
  const displayCanvas = ref<HTMLCanvasElement | null>(null)
  let captureCanvas: HTMLCanvasElement | null = null
  let captureCtx: CanvasRenderingContext2D | null = null
  let prevFrameData: ImageData | null = null
  let rafId: number | null = null

  const finishLineY = ref(Math.round(CANVAS_H / 2))
  const finishLineSet = ref(false)
  const detectionThreshold = ref(25)
  let lastEventAt = 0

  const sessionActive = ref(false)
  let stopwatchStartTime = 0
  let stopwatchAccumulatedMs = 0
  const totalElapsedMs = ref(0)
  let stopwatchTimerId: number | null = null

  const events = ref<EventWithFrame[]>([])
  const toast = ref({ show: false, message: '', type: 'success' as 'success' | 'error' })

  const unassignedCount = computed(() => events.value.filter(event => !event.studentId).length)
  const hasAssignedEvents = computed(() => events.value.some(event => event.studentId))
  const formattedElapsed = computed(() => formatElapsed(totalElapsedMs.value))

  onBeforeUnmount(() => {
    stopCamera()
    stopStopwatch()
  })

  function showToast(message: string, type: 'success' | 'error' = 'success'): void {
    toast.value = { show: true, message, type }
    setTimeout(() => { toast.value.show = false }, 2500)
  }

  async function loadStudents(): Promise<void> {
    if (!selectedClassId.value) {
      students.value = []
      mittelstreckeCategories.value = []
      return
    }
    try {
      students.value = await studentsBridge.studentRepository.findByClassGroup(selectedClassId.value)
      const allCategories = await sportBridge.gradeCategoryRepository.findByClassGroup(selectedClassId.value)
      mittelstreckeCategories.value = allCategories.filter(
        (category: Sport.GradeCategory) => category.type === 'time' || category.type === 'mittelstrecke'
      )
    } catch {
      students.value = []
      mittelstreckeCategories.value = []
    }
  }

  ;(async () => {
    try {
      classes.value = await sportBridge.classGroupRepository.findAll()
    } catch {
      classes.value = []
    }
  })()

  function studentsForEvent(_event: EventWithFrame): Student[] {
    return students.value
  }

  function onAssignStudent(event: EventWithFrame): void {
    const student = students.value.find(item => item.id === event.studentId)
    event.studentName = student ? `${student.firstName} ${student.lastName}` : undefined
  }

  async function startCamera(): Promise<void> {
    cameraError.value = ''
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: CANVAS_W }, height: { ideal: CANVAS_H }, frameRate: { ideal: 30 } },
        audio: false
      })
      mediaStream.value = stream
      const video = liveVideo.value
      if (!video) return
      video.srcObject = stream
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve()
        video.onerror = (event) => reject(event)
      })
      await video.play()

      captureCanvas = document.createElement('canvas')
      captureCanvas.width = CANVAS_W
      captureCanvas.height = CANVAS_H
      captureCtx = captureCanvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D

      cameraActive.value = true
      startRenderLoop()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      cameraError.value = message.toLowerCase().includes('permission') || message.toLowerCase().includes('notallowed')
        ? t('FINISH_CAMERA.no-camera-permission')
        : message
    }
  }

  function stopCamera(): void {
    cameraActive.value = false
    stopRenderLoop()
    if (mediaStream.value) {
      for (const track of mediaStream.value.getTracks()) track.stop()
      mediaStream.value = null
    }
    if (liveVideo.value) liveVideo.value.srcObject = null
    captureCanvas = null
    captureCtx = null
    prevFrameData = null
  }

  function startRenderLoop(): void {
    function loop(): void {
      if (!cameraActive.value) return
      captureAndDetect()
      drawDisplay()
      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)
  }

  function stopRenderLoop(): void {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  function captureAndDetect(): void {
    if (!captureCtx || !captureCanvas || !liveVideo.value) return
    const video = liveVideo.value
    if (video.readyState < 2 || video.paused) return
    captureCtx.drawImage(video, 0, 0, CANVAS_W, CANVAS_H)

    if (sessionActive.value && finishLineSet.value) {
      detectCrossing()
    }
  }

  function drawDisplay(): void {
    const canvas = displayCanvas.value
    if (!canvas || !captureCanvas) return
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null
    if (!ctx) return

    ctx.drawImage(captureCanvas, 0, 0, CANVAS_W, CANVAS_H)

    if (finishLineSet.value) {
      ctx.save()
      ctx.strokeStyle = sessionActive.value ? '#ff3300' : '#ffcc00'
      ctx.lineWidth = 2
      ctx.setLineDash([8, 4])
      ctx.beginPath()
      ctx.moveTo(0, finishLineY.value)
      ctx.lineTo(CANVAS_W, finishLineY.value)
      ctx.stroke()
      ctx.restore()

      ctx.save()
      ctx.fillStyle = 'rgba(255, 100, 0, 0.10)'
      ctx.fillRect(0, finishLineY.value - 12, CANVAS_W, 24)
      ctx.restore()
    }
  }

  function detectCrossing(): void {
    if (!captureCtx) return
    const zoneTop = Math.max(0, finishLineY.value - DETECTION_ZONE_HALF_HEIGHT)
    const zoneHeight = Math.min(DETECTION_ZONE_HALF_HEIGHT * 2, CANVAS_H - zoneTop)
    const current = captureCtx.getImageData(0, zoneTop, CANVAS_W, zoneHeight)

    if (!prevFrameData) {
      prevFrameData = current
      return
    }

    const diff = computeAverageDiff(prevFrameData, current)
    prevFrameData = current

    if (diff > detectionThreshold.value) {
      const now = Date.now()
      if (now - lastEventAt > DEBOUNCE_MS) {
        lastEventAt = now
        recordEvent(false)
      }
    }
  }

  function computeAverageDiff(a: ImageData, b: ImageData): number {
    const len = a.data.length
    let total = 0
    let count = 0
    for (let i = 0; i < len; i += 4) {
      const dr = Math.abs(a.data[i] - b.data[i])
      const dg = Math.abs(a.data[i + 1] - b.data[i + 1])
      const db = Math.abs(a.data[i + 2] - b.data[i + 2])
      total += (dr + dg + db) / 3
      count++
    }
    return count > 0 ? total / count : 0
  }

  function updateFinishLine(clientY: number): void {
    if (!cameraActive.value) return
    const canvas = displayCanvas.value
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleY = CANVAS_H / rect.height
    finishLineY.value = Math.round((clientY - rect.top) * scaleY)
    finishLineSet.value = true
    prevFrameData = null
  }

  function setFinishLineByClick(event: MouseEvent): void {
    updateFinishLine(event.clientY)
  }

  function setFinishLineByTouch(event: TouchEvent): void {
    if (event.touches.length === 0) return
    updateFinishLine(event.touches[0].clientY)
  }

  function resetFinishLine(): void {
    finishLineSet.value = false
    prevFrameData = null
  }

  function startSession(): void {
    if (sessionActive.value) return
    stopwatchStartTime = Date.now()
    sessionActive.value = true
    stopwatchTimerId = window.setInterval(() => {
      totalElapsedMs.value = stopwatchAccumulatedMs + (Date.now() - stopwatchStartTime)
    }, 50)
  }

  function pauseSession(): void {
    if (!sessionActive.value) return
    stopwatchAccumulatedMs += Date.now() - stopwatchStartTime
    sessionActive.value = false
    stopStopwatch()
  }

  function resetSession(): void {
    if (sessionActive.value) return
    stopwatchAccumulatedMs = 0
    totalElapsedMs.value = 0
  }

  function stopStopwatch(): void {
    if (stopwatchTimerId !== null) {
      clearInterval(stopwatchTimerId)
      stopwatchTimerId = null
    }
  }

  function recordEvent(manual: boolean): void {
    const elapsed = stopwatchAccumulatedMs + (sessionActive.value ? Date.now() - stopwatchStartTime : 0)
    events.value.push({
      id: generateId(),
      elapsedMs: elapsed,
      recordedAt: new Date().toISOString(),
      manual,
      frameDataUrl: captureCurrentFrame()
    })
  }

  function addManualEvent(): void {
    recordEvent(true)
  }

  function deleteEvent(id: string): void {
    events.value = events.value.filter(event => event.id !== id)
  }

  function clearAllEvents(): void {
    events.value = []
  }

  function captureCurrentFrame(): string | undefined {
    if (!captureCanvas) return undefined
    try {
      return captureCanvas.toDataURL('image/jpeg', THUMBNAIL_JPEG_QUALITY)
    } catch {
      return undefined
    }
  }

  async function saveSession(): Promise<void> {
    if (!selectedClassId.value) {
      showToast(t('FINISH_CAMERA.select-class-first'), 'error')
      return
    }
    saving.value = true
    try {
      await sportBridge.saveFinishCameraSessionUseCase.execute({
        classGroupId: selectedClassId.value,
        events: mapSessionEvents(events.value),
        totalElapsedMs: totalElapsedMs.value,
        endedAt: new Date()
      })
      showToast(t('FINISH_CAMERA.saved'))
    } catch (error) {
      showToast(t('FINISH_CAMERA.save-error'), 'error')
      console.error('[FinishCamera] save error', error)
    } finally {
      saving.value = false
    }
  }

  async function sendToMittelstrecke(): Promise<void> {
    if (!selectedCategoryId.value) return
    sending.value = true
    try {
      const assigned = events.value.filter(event => event.studentId)
      if (assigned.length === 0) {
        showToast(t('FINISH_CAMERA.no-assigned-events'), 'error')
        return
      }
      const session = await sportBridge.saveFinishCameraSessionUseCase.execute({
        classGroupId: selectedClassId.value,
        events: mapSessionEvents(events.value),
        totalElapsedMs: totalElapsedMs.value,
        endedAt: new Date()
      })
      await router.push({
        name: 'mittelstrecke',
        query: {
          categoryId: selectedCategoryId.value,
          classGroupId: selectedClassId.value,
          finishCameraSessionId: session.id
        }
      })
    } catch (error) {
      showToast(t('FINISH_CAMERA.send-error'), 'error')
      console.error('[FinishCamera] send error', error)
    } finally {
      sending.value = false
    }
  }

  return {
    addManualEvent,
    cameraActive,
    cameraError,
    canvasH: CANVAS_H,
    canvasW: CANVAS_W,
    classes,
    clearAllEvents,
    deleteEvent,
    detectionThreshold,
    displayCanvas,
    events,
    finishLineSet,
    finishLineY,
    formatElapsed,
    formattedElapsed,
    hasAssignedEvents,
    liveVideo,
    loadStudents,
    mittelstreckeCategories,
    onAssignStudent,
    pauseSession,
    resetFinishLine,
    resetSession,
    saveSession,
    saving,
    selectedCategoryId,
    selectedClassId,
    sendToMittelstrecke,
    sending,
    sessionActive,
    setFinishLineByClick,
    setFinishLineByTouch,
    startCamera,
    startSession,
    stopCamera,
    studentsForEvent,
    toast,
    totalElapsedMs,
    unassignedCount
  }
}
