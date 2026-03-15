<template>
  <div class="finish-camera-view">
    <div class="page-header">
      <h2>{{ t('FINISH_CAMERA.title') }}</h2>
      <p class="page-description">{{ t('FINISH_CAMERA.description') }}</p>
    </div>

    <div v-if="cameraError" class="error-banner card">
      ⚠️ {{ cameraError }}
    </div>

    <!-- Class selection -->
    <div class="card setup-card">
      <div class="form-row">
        <div class="form-group">
          <label>{{ t('KLASSEN.klasse') }}</label>
          <select v-model="selectedClassId" @change="loadStudents" class="form-input">
            <option value="">{{ t('FINISH_CAMERA.select-class') }}</option>
            <option v-for="cls in classes" :key="cls.id" :value="cls.id">
              {{ cls.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ t('FINISH_CAMERA.detection-threshold') }}</label>
          <input
            type="range"
            v-model.number="detectionThreshold"
            min="5"
            max="80"
            step="5"
            class="delay-slider"
            :disabled="sessionActive"
          />
          <small>{{ detectionThreshold }}</small>
        </div>
      </div>
    </div>

    <!-- Camera + stopwatch area -->
    <div class="camera-section">
      <!-- Camera panel -->
      <div class="card camera-panel">
        <div class="panel-header">
          <h3>📷 {{ t('FINISH_CAMERA.camera') }}</h3>
          <div class="camera-actions">
            <button v-if="!cameraActive" class="btn btn-primary" @click="startCamera">
              {{ t('FINISH_CAMERA.start-camera') }}
            </button>
            <button v-else class="btn btn-danger" @click="stopCamera">
              {{ t('FINISH_CAMERA.stop-camera') }}
            </button>
          </div>
        </div>

        <div v-if="!cameraActive && !cameraError" class="idle-hint">
          <p>{{ t('FINISH_CAMERA.camera-hint') }}</p>
        </div>

        <div v-show="cameraActive" class="canvas-wrapper">
          <!-- Hidden live video element -->
          <video ref="liveVideo" autoplay muted playsinline class="hidden-video" />
          <!-- Visible canvas with finish line overlay -->
          <canvas
            ref="displayCanvas"
            class="display-canvas"
            :width="canvasW"
            :height="canvasH"
            @click="setFinishLineByClick"
            @touchstart.prevent="setFinishLineByTouch"
          />
          <div class="canvas-hint" v-if="cameraActive && !finishLineSet">
            {{ t('FINISH_CAMERA.set-line-hint') }}
          </div>
        </div>

        <div v-if="cameraActive" class="finish-line-info">
          <span v-if="finishLineSet">
            🏁 {{ t('FINISH_CAMERA.line-at') }} y={{ finishLineY }}px
            <button class="btn-icon btn-small" @click="resetFinishLine" :title="t('FINISH_CAMERA.reset-line')">✕</button>
          </span>
          <span v-else class="muted">{{ t('FINISH_CAMERA.no-line') }}</span>
        </div>
      </div>

      <!-- Stopwatch panel -->
      <div class="card stopwatch-panel">
        <h3>⏱ {{ t('FINISH_CAMERA.stopwatch') }}</h3>
        <div class="stopwatch-display" :class="{ running: sessionActive }">
          {{ formattedElapsed }}
        </div>
        <div class="stopwatch-controls">
          <button
            class="btn btn-primary"
            :disabled="sessionActive || !finishLineSet"
            @click="startSession"
          >
            ▶ {{ t('FINISH_CAMERA.start') }}
          </button>
          <button
            class="btn btn-warning"
            :disabled="!sessionActive"
            @click="pauseSession"
          >
            ⏸ {{ t('FINISH_CAMERA.pause') }}
          </button>
          <button
            class="btn btn-secondary"
            :disabled="sessionActive"
            @click="resetSession"
          >
            🔄 {{ t('FINISH_CAMERA.reset') }}
          </button>
          <button
            class="btn btn-icon"
            :title="t('FINISH_CAMERA.manual-event')"
            :disabled="!sessionActive"
            @click="addManualEvent"
          >
            ➕
          </button>
        </div>
        <div class="event-count">
          <strong>{{ events.length }}</strong> {{ t('FINISH_CAMERA.events') }}
          <span v-if="unassignedCount > 0" class="badge-warning">
            {{ unassignedCount }} {{ t('FINISH_CAMERA.unassigned') }}
          </span>
        </div>
      </div>
    </div>

    <!-- Events list -->
    <div v-if="events.length > 0" class="card events-card">
      <div class="card-header">
        <h3>🏁 {{ t('FINISH_CAMERA.events-title') }}</h3>
        <div class="header-actions">
          <button class="btn-secondary btn-small" @click="clearAllEvents">
            🗑 {{ t('FINISH_CAMERA.clear-events') }}
          </button>
        </div>
      </div>

      <div class="events-list">
        <div
          v-for="(event, idx) in events"
          :key="event.id"
          class="event-row"
          :class="{ assigned: event.studentId, unassigned: !event.studentId, manual: event.manual }"
        >
          <div class="event-rank">{{ idx + 1 }}</div>

          <!-- Frame preview thumbnail -->
          <div class="event-thumbnail">
            <img
              v-if="event.frameDataUrl"
              :src="event.frameDataUrl"
              class="thumbnail-img"
              :alt="t('FINISH_CAMERA.frame-preview')"
            />
            <div v-else class="thumbnail-placeholder">🏁</div>
          </div>

          <div class="event-time">
            <strong>{{ formatElapsed(event.elapsedMs) }}</strong>
            <small v-if="event.manual" class="manual-tag">{{ t('FINISH_CAMERA.manual') }}</small>
          </div>

          <!-- Student assignment -->
          <div class="event-assignment">
            <select
              v-model="event.studentId"
              @change="onAssignStudent(event)"
              class="form-input form-input-small"
            >
              <option value="">{{ t('FINISH_CAMERA.assign-student') }}</option>
              <option
                v-for="student in studentsForEvent(event)"
                :key="student.id"
                :value="student.id"
              >
                {{ student.firstName }} {{ student.lastName }}
              </option>
            </select>
          </div>

          <button
            class="btn-icon btn-danger btn-small"
            :title="t('COMMON.delete')"
            @click="deleteEvent(event.id)"
          >
            🗑
          </button>
        </div>
      </div>
    </div>

    <!-- No events yet hint -->
    <div v-else-if="sessionActive || totalElapsedMs > 0" class="card empty-state">
      {{ t('FINISH_CAMERA.no-events-yet') }}
    </div>

    <!-- Save + Handoff section -->
    <div v-if="events.length > 0 && selectedClassId" class="card save-card">
      <div class="card-header">
        <h3>💾 {{ t('FINISH_CAMERA.save-section') }}</h3>
      </div>
      <div class="save-actions">
        <button
          class="btn btn-success"
          :disabled="saving"
          @click="saveSession"
        >
          {{ saving ? '…' : '💾' }} {{ t('FINISH_CAMERA.save') }}
        </button>

        <div v-if="mittelstreckeCategories.length > 0" class="handoff-row">
          <select v-model="selectedCategoryId" class="form-input">
            <option value="">{{ t('MULTISTOP.select-category') }}…</option>
            <option v-for="cat in mittelstreckeCategories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
          <button
            class="btn btn-primary"
            :disabled="!selectedCategoryId || !hasAssignedEvents || sending"
            @click="sendToMittelstrecke"
          >
            {{ sending ? '…' : '→' }} {{ t('FINISH_CAMERA.send-to-mittelstrecke') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast notification -->
    <div v-if="toast.show" class="toast" :class="toast.type">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { getSportBridge, initializeSportBridge } from '../composables/useSportBridge'
import { getStudentsBridge, initializeStudentsBridge } from '../composables/useStudentsBridge'
import type { ClassGroup, Student } from '@viccoboard/core'
import type { Sport } from '@viccoboard/core'
import type { FinishCameraEvent } from '@viccoboard/sport'

const { t } = useI18n()
const router = useRouter()

// --------------------------------------------------------------------------
// Constants
// --------------------------------------------------------------------------
/** Milliseconds between two consecutive auto-detected crossing events (prevents double-fire). */
const DEBOUNCE_MS = 800
/** Half-height of the detection zone around the finish line in pixels. */
const DETECTION_ZONE_HALF_HEIGHT = 12
/** JPEG quality for thumbnail snapshots: 0.5 balances file size vs. visual clarity. */
const THUMBNAIL_JPEG_QUALITY = 0.5

// --------------------------------------------------------------------------
// Named types
// --------------------------------------------------------------------------
/** Finish-camera event enriched with an optional frame preview (local to this view). */
type EventWithFrame = FinishCameraEvent & { frameDataUrl?: string }

// --------------------------------------------------------------------------
// Bridges
// --------------------------------------------------------------------------
initializeSportBridge()
initializeStudentsBridge()

const sportBridge = getSportBridge()
const studentsBridge = getStudentsBridge()

// --------------------------------------------------------------------------
// State
// --------------------------------------------------------------------------
const classes = ref<ClassGroup[]>([])
const students = ref<Student[]>([])
const selectedClassId = ref('')
const mittelstreckeCategories = ref<Sport.GradeCategory[]>([])
const selectedCategoryId = ref('')
const saving = ref(false)
const sending = ref(false)

// Camera state
const cameraActive = ref(false)
const cameraError = ref('')
const mediaStream = ref<MediaStream | null>(null)

// Canvas
// These are intentionally non-reactive `let` variables because they are imperative
// handles to DOM APIs (canvas, RAF) that are managed manually and do not need
// to trigger Vue reactivity.
const liveVideo = ref<HTMLVideoElement | null>(null)
const displayCanvas = ref<HTMLCanvasElement | null>(null)
let captureCanvas: HTMLCanvasElement | null = null
let captureCtx: CanvasRenderingContext2D | null = null
let prevFrameData: ImageData | null = null
let rafId: number | null = null

const canvasW = 640
const canvasH = 360

// Finish line
const finishLineY = ref(Math.round(canvasH / 2))
const finishLineSet = ref(false)

// Detection
const detectionThreshold = ref(25)
let lastEventAt = 0

// Stopwatch
const sessionActive = ref(false)
let stopwatchStartTime = 0
let stopwatchAccumulatedMs = 0
const totalElapsedMs = ref(0)
let stopwatchTimerId: number | null = null

// Events
const events = ref<EventWithFrame[]>([])

const toast = ref({ show: false, message: '', type: 'success' as 'success' | 'error' })

// --------------------------------------------------------------------------
// Computed
// --------------------------------------------------------------------------
const unassignedCount = computed(() => events.value.filter(e => !e.studentId).length)
const hasAssignedEvents = computed(() => events.value.some(e => e.studentId))

const formattedElapsed = computed(() => formatElapsed(totalElapsedMs.value))

// --------------------------------------------------------------------------
// Lifecycle
// --------------------------------------------------------------------------
onBeforeUnmount(() => {
  stopCamera()
  stopStopwatch()
})

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------
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

function showToast(message: string, type: 'success' | 'error' = 'success'): void {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 2500)
}

// --------------------------------------------------------------------------
// Load data
// --------------------------------------------------------------------------
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
      (c: Sport.GradeCategory) => c.type === 'time' || c.type === 'mittelstrecke'
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

// --------------------------------------------------------------------------
// Student helpers
// --------------------------------------------------------------------------
function studentsForEvent(_event: EventWithFrame): Student[] {
  // Parameter kept for future extensibility (e.g., filtering already-assigned students by event).
  // Show all students — allow free re-assignment.
  return students.value
}

function onAssignStudent(event: EventWithFrame): void {
  // Update student name for display
  const student = students.value.find(s => s.id === event.studentId)
  event.studentName = student ? `${student.firstName} ${student.lastName}` : undefined
}

// --------------------------------------------------------------------------
// Camera management
// --------------------------------------------------------------------------
async function startCamera(): Promise<void> {
  cameraError.value = ''
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: canvasW }, height: { ideal: canvasH }, frameRate: { ideal: 30 } },
      audio: false
    })
    mediaStream.value = stream
    const video = liveVideo.value!
    video.srcObject = stream
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve()
      video.onerror = (e) => reject(e)
    })
    await video.play()

    captureCanvas = document.createElement('canvas')
    captureCanvas.width = canvasW
    captureCanvas.height = canvasH
    captureCtx = captureCanvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D

    cameraActive.value = true
    startRenderLoop()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    cameraError.value = msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('notallowed')
      ? t('FINISH_CAMERA.no-camera-permission')
      : msg
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

// --------------------------------------------------------------------------
// Render loop
// --------------------------------------------------------------------------
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
  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null }
}

function captureAndDetect(): void {
  if (!captureCtx || !captureCanvas || !liveVideo.value) return
  const video = liveVideo.value
  if (video.readyState < 2 || video.paused) return
  captureCtx.drawImage(video, 0, 0, canvasW, canvasH)

  if (sessionActive.value && finishLineSet.value) {
    detectCrossing()
  }
}

function drawDisplay(): void {
  const canvas = displayCanvas.value
  if (!canvas || !captureCanvas) return
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null
  if (!ctx) return

  // Draw current frame
  ctx.drawImage(captureCanvas, 0, 0, canvasW, canvasH)

  // Draw finish line overlay
  if (finishLineSet.value) {
    ctx.save()
    ctx.strokeStyle = sessionActive.value ? '#ff3300' : '#ffcc00'
    ctx.lineWidth = 2
    ctx.setLineDash([8, 4])
    ctx.beginPath()
    ctx.moveTo(0, finishLineY.value)
    ctx.lineTo(canvasW, finishLineY.value)
    ctx.stroke()
    ctx.restore()
    // Detection zone shading
    ctx.save()
    ctx.fillStyle = 'rgba(255, 100, 0, 0.10)'
    ctx.fillRect(0, finishLineY.value - 12, canvasW, 24)
    ctx.restore()
  }
}

// --------------------------------------------------------------------------
// Motion detection
// --------------------------------------------------------------------------
function detectCrossing(): void {
  if (!captureCtx) return
  const y = finishLineY.value
  const zoneTop = Math.max(0, y - DETECTION_ZONE_HALF_HEIGHT)
  const zoneHeight = Math.min(DETECTION_ZONE_HALF_HEIGHT * 2, canvasH - zoneTop)

  const current = captureCtx.getImageData(0, zoneTop, canvasW, zoneHeight)

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

// --------------------------------------------------------------------------
// Finish line placement
// --------------------------------------------------------------------------
function setFinishLineByClick(e: MouseEvent): void {
  if (!cameraActive.value) return
  const canvas = displayCanvas.value!
  const rect = canvas.getBoundingClientRect()
  const scaleY = canvasH / rect.height
  finishLineY.value = Math.round((e.clientY - rect.top) * scaleY)
  finishLineSet.value = true
  prevFrameData = null
}

function setFinishLineByTouch(e: TouchEvent): void {
  if (!cameraActive.value || e.touches.length === 0) return
  const canvas = displayCanvas.value!
  const rect = canvas.getBoundingClientRect()
  const scaleY = canvasH / rect.height
  finishLineY.value = Math.round((e.touches[0].clientY - rect.top) * scaleY)
  finishLineSet.value = true
  prevFrameData = null
}

function resetFinishLine(): void {
  finishLineSet.value = false
  prevFrameData = null
}

// --------------------------------------------------------------------------
// Stopwatch
// --------------------------------------------------------------------------
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
  if (stopwatchTimerId !== null) { clearInterval(stopwatchTimerId); stopwatchTimerId = null }
}

// --------------------------------------------------------------------------
// Event management
// --------------------------------------------------------------------------
function recordEvent(manual: boolean): void {
  const elapsed = stopwatchAccumulatedMs + (sessionActive.value ? Date.now() - stopwatchStartTime : 0)
  const frameDataUrl = captureCurrentFrame()
  events.value.push({
    id: generateId(),
    elapsedMs: elapsed,
    recordedAt: new Date().toISOString(),
    manual,
    frameDataUrl
  })
}

function addManualEvent(): void {
  recordEvent(true)
}

function deleteEvent(id: string): void {
  events.value = events.value.filter(e => e.id !== id)
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

// --------------------------------------------------------------------------
// Save & export
// --------------------------------------------------------------------------
async function saveSession(): Promise<void> {
  if (!selectedClassId.value) {
    showToast(t('FINISH_CAMERA.select-class-first'), 'error')
    return
  }
  saving.value = true
  try {
    const payload = events.value.map((e) => ({
      id: e.id,
      elapsedMs: e.elapsedMs,
      recordedAt: e.recordedAt,
      manual: e.manual,
      studentId: e.studentId,
      studentName: e.studentName
    }))
    await sportBridge.saveFinishCameraSessionUseCase.execute({
      classGroupId: selectedClassId.value,
      events: payload,
      totalElapsedMs: totalElapsedMs.value,
      endedAt: new Date()
    })
    showToast(t('FINISH_CAMERA.saved'))
  } catch (err) {
    showToast(t('FINISH_CAMERA.save-error'), 'error')
    console.error('[FinishCamera] save error', err)
  } finally {
    saving.value = false
  }
}

async function sendToMittelstrecke(): Promise<void> {
  if (!selectedCategoryId.value) return
  sending.value = true
  try {
    const assigned = events.value.filter(e => e.studentId)
    if (assigned.length === 0) {
      showToast(t('FINISH_CAMERA.no-assigned-events'), 'error')
      return
    }
    // Save session first
    const payload = events.value.map((e) => ({
      id: e.id,
      elapsedMs: e.elapsedMs,
      recordedAt: e.recordedAt,
      manual: e.manual,
      studentId: e.studentId,
      studentName: e.studentName
    }))
    const session = await sportBridge.saveFinishCameraSessionUseCase.execute({
      classGroupId: selectedClassId.value,
      events: payload,
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
  } catch (err) {
    showToast(t('FINISH_CAMERA.send-error'), 'error')
    console.error('[FinishCamera] send error', err)
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
.finish-camera-view {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 1rem;
}

.page-description {
  color: var(--color-text-muted, #666);
  margin: 0;
  font-size: 0.9rem;
}

.setup-card .form-row {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.form-group {
  flex: 1;
  min-width: 200px;
}

.form-group label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 600;
  font-size: 0.85rem;
}

.camera-section {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .camera-section {
    grid-template-columns: 1fr;
  }
}

.camera-panel {
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.panel-header h3 {
  margin: 0;
}

.hidden-video {
  display: none;
}

.canvas-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
}

.display-canvas {
  width: 100%;
  height: auto;
  border-radius: 4px;
  cursor: crosshair;
  background: #000;
  display: block;
}

.canvas-hint {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.6);
  color: #fff;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.8rem;
  pointer-events: none;
  white-space: nowrap;
}

.idle-hint {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--color-text-muted, #888);
}

.finish-line-info {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.muted { color: var(--color-text-muted, #999); }

.stopwatch-panel {
  width: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
}

.stopwatch-panel h3 { margin: 0; }

.stopwatch-display {
  font-size: 2.2rem;
  font-variant-numeric: tabular-nums;
  font-family: monospace;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: var(--color-surface-2, #f5f5f5);
  min-width: 9ch;
  text-align: center;
  transition: background 0.2s;
}

.stopwatch-display.running {
  background: #fff3e0;
  color: #e65100;
}

.stopwatch-controls {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  width: 100%;
}

.stopwatch-controls .btn {
  width: 100%;
}

.event-count {
  font-size: 0.85rem;
  text-align: center;
}

.badge-warning {
  display: inline-block;
  background: #ff9800;
  color: #fff;
  border-radius: 4px;
  padding: 1px 6px;
  font-size: 0.75rem;
  margin-left: 4px;
}

.events-card .card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.events-card .card-header h3 { margin: 0; }

.events-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.event-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  background: var(--color-surface-2, #f5f5f5);
  border-left: 3px solid transparent;
}

.event-row.unassigned { border-left-color: #ff9800; }
.event-row.assigned { border-left-color: #4caf50; }
.event-row.manual { border-left-color: #9c27b0; }

.event-rank {
  font-weight: 700;
  font-size: 0.9rem;
  width: 1.5rem;
  text-align: center;
  color: var(--color-text-muted, #666);
}

.event-thumbnail {
  width: 64px;
  height: 36px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
  background: #222;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumbnail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-placeholder {
  font-size: 1.2rem;
}

.event-time {
  min-width: 7ch;
  font-variant-numeric: tabular-nums;
  font-family: monospace;
  font-size: 1rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.manual-tag {
  font-size: 0.7rem;
  color: #9c27b0;
}

.event-assignment {
  flex: 1;
}

.save-card .save-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.handoff-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.handoff-row .form-input {
  flex: 1;
  min-width: 180px;
}

.error-banner {
  background: #fff3f3;
  border-left: 4px solid #e53935;
  color: #c62828;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
}

.empty-state {
  text-align: center;
  color: var(--color-text-muted, #888);
  padding: 2rem;
}

.delay-slider {
  width: 100%;
}

.toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  color: #fff;
  font-weight: 600;
  z-index: 9999;
  animation: fadeInUp 0.2s ease;
}

.toast.success { background: #43a047; }
.toast.error   { background: #e53935; }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateX(-50%) translateY(12px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0);    }
}

.btn-icon { background: none; border: none; cursor: pointer; font-size: 1rem; padding: 0.2rem 0.4rem; }
.btn-small { font-size: 0.8rem; padding: 0.2rem 0.5rem; }
.form-input-small { font-size: 0.85rem; }
</style>
