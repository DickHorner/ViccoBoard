<template>
  <div class="tracking-basketball-view">
    <div class="page-header">
      <h2>🏀 {{ t('TRACKING.basketball.title') }}</h2>
      <div class="header-actions">
        <button v-if="!cameraActive" class="btn btn-primary" @click="startCamera">
          📷 {{ t('TRACKING.basketball.start-camera') }}
        </button>
        <button v-else class="btn btn-danger" @click="stopCamera">
          ⏹ {{ t('TRACKING.basketball.stop-camera') }}
        </button>
      </div>
    </div>

    <div v-if="cameraError" class="error-banner card">
      ⚠️ {{ cameraError }}
      <button class="btn btn-secondary retry-btn" @click="retryCamera">
        {{ t('TRACKING.basketball.retry') }}
      </button>
    </div>

    <div v-if="!cameraActive && !cameraError" class="idle-hint card">
      <p>{{ t('TRACKING.basketball.zone-hint') }}</p>
    </div>

    <!-- Live counter display (always visible when camera is active) -->
    <div v-if="cameraActive" class="stats-bar card">
      <div class="stat-item">
        <span class="stat-value">{{ shotCount }}</span>
        <span class="stat-label">{{ t('TRACKING.basketball.stats.shots') }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ formattedTime }}</span>
        <span class="stat-label">{{ t('TRACKING.basketball.stats.session-time') }}</span>
      </div>
      <div class="stat-item status-item">
        <span class="status-pill" :class="statusClass">{{ statusText }}</span>
      </div>
    </div>

    <!-- Video + target overlay -->
    <div v-show="cameraActive" class="video-wrapper card">
      <div class="canvas-container">
        <!-- Offscreen video element, feeds into canvas -->
        <video ref="liveVideo" class="live-video-hidden" autoplay muted playsinline />
        <!-- Main canvas: live feed + target zone overlay -->
        <canvas
          ref="mainCanvas"
          class="main-canvas"
          :width="captureW"
          :height="captureH"
          @mousedown="onZoneStart"
          @mousemove="onZoneMove"
          @mouseup="onZoneEnd"
          @mouseleave="onZoneEnd"
          @touchstart.prevent="onTouchZoneStart"
          @touchmove.prevent="onTouchZoneMove"
          @touchend.prevent="onZoneEnd"
        />
      </div>

      <div class="zone-actions">
        <span v-if="targetZone" class="zone-badge">✅ {{ t('TRACKING.basketball.zone-defined') }}</span>
        <span v-else class="zone-badge zone-badge--empty">{{ t('TRACKING.basketball.define-zone') }}</span>
        <button v-if="targetZone" class="btn btn-secondary" @click="clearZone">
          {{ t('TRACKING.basketball.clear-zone') }}
        </button>
      </div>
    </div>

    <!-- Controls panel -->
    <div v-if="cameraActive" class="controls-panel card">
      <!-- Sensitivity slider -->
      <div class="control-group">
        <label class="control-label">
          {{ t('TRACKING.basketball.sensitivity-label') }}
          <span class="sensitivity-level">{{ sensitivityLabel }}</span>
        </label>
        <input
          type="range"
          v-model.number="sensitivity"
          min="1"
          max="10"
          step="1"
          class="delay-slider"
        />
        <div class="slider-marks">
          <span>{{ t('TRACKING.basketball.sensitivity-low') }}</span>
          <span>{{ t('TRACKING.basketball.sensitivity-high') }}</span>
        </div>
      </div>

      <!-- Start / Stop / Reset buttons -->
      <div class="action-buttons">
        <button
          v-if="!trackingActive"
          class="btn btn-primary btn-large"
          @click="startTracking"
          :disabled="!targetZone"
          :title="!targetZone ? t('TRACKING.basketball.no-zone-warning') : undefined"
        >
          ▶ {{ t('TRACKING.basketball.controls.start') }}
        </button>
        <button
          v-else
          class="btn btn-danger btn-large"
          @click="stopTracking"
        >
          ⏹ {{ t('TRACKING.basketball.controls.stop') }}
        </button>
        <button
          class="btn btn-secondary btn-large"
          @click="resetSession"
          :disabled="trackingActive"
        >
          ↺ {{ t('TRACKING.basketball.controls.reset') }}
        </button>
      </div>

      <p v-if="sessionSaved" class="session-saved-notice">
        ✅ {{ t('TRACKING.basketball.session-saved') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getSportBridge } from '../composables/useSportBridge'

const { t } = useI18n()

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------
interface ZoneRect {
  x: number
  y: number
  w: number
  h: number
}

interface DrawOrigin {
  x: number
  y: number
}

// -------------------------------------------------------------------
// State
// -------------------------------------------------------------------
const cameraActive = ref(false)
const cameraError = ref('')
const mediaStream = ref<MediaStream | null>(null)

/** Target zone in canvas coordinates */
const targetZone = ref<ZoneRect | null>(null)

/** Whether the user is currently dragging to define the zone */
let isDefiningZone = false
let zoneOrigin: DrawOrigin | null = null
let draftZone: ZoneRect | null = null

/** Tracking state */
const trackingActive = ref(false)
const shotCount = ref(0)
const sessionSaved = ref(false)

/** Sensitivity: 1 = low, 10 = high (maps to motion threshold) */
const sensitivity = ref(5)

/** Session timing */
let sessionStartTime = 0
const sessionElapsedMs = ref(0)
let timerHandle: ReturnType<typeof setInterval> | null = null

// Refs
const liveVideo = ref<HTMLVideoElement | null>(null)
const mainCanvas = ref<HTMLCanvasElement | null>(null)

// Internal capture state
let captureCanvas: HTMLCanvasElement | null = null
let captureCtx: CanvasRenderingContext2D | null = null
let prevFrameData: ImageData | null = null
let rafId: number | null = null

// Shot detection state machine
let ballInZone = false
let cooldownUntil = 0

// -------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------
const CAPTURE_W = 640
const CAPTURE_H = 360
const captureW = CAPTURE_W
const captureH = CAPTURE_H

/** Minimum motion pixel fraction to consider "ball in zone" (tuned by sensitivity 1–10) */
function getMotionThreshold(): number {
  // sensitivity 1 → threshold 0.25, sensitivity 10 → threshold 0.04
  return 0.25 - (sensitivity.value - 1) * (0.21 / 9)
}

const SHOT_COOLDOWN_MS = 1000
/** Per-channel luminance delta required to count a pixel as "changed" */
const MOTION_PIXEL_THRESHOLD = 30
/** Multiplier below entry threshold that signals "ball has left the zone" */
const ZONE_EXIT_THRESHOLD_MULTIPLIER = 0.4
/** Minimum drag size (in canvas pixels) to accept as a target zone */
const MIN_ZONE_SIZE = 10

// -------------------------------------------------------------------
// Computed
// -------------------------------------------------------------------
const formattedTime = computed<string>(() => {
  const totalSec = Math.floor(sessionElapsedMs.value / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const sensitivityLabel = computed<string>(() => String(sensitivity.value))

const statusText = computed<string>(() => {
  if (trackingActive.value) return t('TRACKING.basketball.status.running')
  if (shotCount.value > 0) return t('TRACKING.basketball.status.stopped')
  return t('TRACKING.basketball.status.ready')
})

const statusClass = computed<string>(() => {
  if (trackingActive.value) return 'status-pill--running'
  if (shotCount.value > 0) return 'status-pill--stopped'
  return 'status-pill--ready'
})

// -------------------------------------------------------------------
// Camera management
// -------------------------------------------------------------------
async function startCamera(): Promise<void> {
  cameraError.value = ''
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: CAPTURE_W },
        height: { ideal: CAPTURE_H },
        frameRate: { ideal: 30 },
        facingMode: { ideal: 'environment' }
      },
      audio: false
    })

    mediaStream.value = stream
    const video = liveVideo.value
    if (!video) {
      throw new Error('Video element not available')
    }
    video.srcObject = stream
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve()
      video.onerror = (e) => reject(e)
    })
    await video.play()

    captureCanvas = document.createElement('canvas')
    captureCanvas.width = CAPTURE_W
    captureCanvas.height = CAPTURE_H
    const ctx2d = captureCanvas.getContext('2d', { willReadFrequently: true })
    if (!ctx2d) {
      throw new Error('Failed to get 2D canvas context')
    }
    captureCtx = ctx2d

    cameraActive.value = true
    startRenderLoop()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('notallowed')) {
      cameraError.value = t('TRACKING.basketball.noCameraPermission')
    } else {
      cameraError.value = msg
    }
  }
}

function stopCamera(): void {
  stopTracking()
  cameraActive.value = false
  stopRenderLoop()

  if (mediaStream.value) {
    for (const track of mediaStream.value.getTracks()) {
      track.stop()
    }
    mediaStream.value = null
  }
  if (liveVideo.value) {
    liveVideo.value.srcObject = null
  }

  prevFrameData = null
  draftZone = null
  isDefiningZone = false
}

function retryCamera(): void {
  cameraError.value = ''
  void startCamera()
}

// -------------------------------------------------------------------
// Render loop
// -------------------------------------------------------------------
function startRenderLoop(): void {
  if (rafId !== null) return
  function loop(): void {
    if (!cameraActive.value) return
    rafId = requestAnimationFrame(loop)
    renderFrame()
  }
  rafId = requestAnimationFrame(loop)
}

function stopRenderLoop(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

function renderFrame(): void {
  const video = liveVideo.value
  const canvas = mainCanvas.value
  if (!video || !canvas || !captureCtx || !captureCanvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Draw live video frame into capture canvas (off-screen)
  captureCtx.drawImage(video, 0, 0, CAPTURE_W, CAPTURE_H)

  // Copy to main canvas (visible)
  ctx.drawImage(captureCanvas, 0, 0)

  const zone = draftZone ?? targetZone.value
  if (zone) {
    drawZoneOverlay(ctx, zone, !!draftZone)
  }

  // Motion detection
  if (trackingActive.value && targetZone.value) {
    detectShot(captureCtx, targetZone.value)
  }
}

// -------------------------------------------------------------------
// Zone overlay drawing
// -------------------------------------------------------------------
function drawZoneOverlay(ctx: CanvasRenderingContext2D, zone: ZoneRect, isDraft: boolean): void {
  ctx.save()
  ctx.strokeStyle = isDraft ? 'rgba(255, 200, 0, 0.9)' : 'rgba(255, 80, 0, 0.9)'
  ctx.lineWidth = 3
  ctx.setLineDash(isDraft ? [8, 4] : [])
  ctx.strokeRect(zone.x, zone.y, zone.w, zone.h)

  // Semi-transparent fill
  ctx.fillStyle = isDraft ? 'rgba(255, 200, 0, 0.08)' : 'rgba(255, 80, 0, 0.10)'
  ctx.fillRect(zone.x, zone.y, zone.w, zone.h)

  // Label
  ctx.setLineDash([])
  ctx.fillStyle = isDraft ? 'rgba(255, 200, 0, 1)' : 'rgba(255, 80, 0, 1)'
  ctx.font = 'bold 14px system-ui, sans-serif'
  ctx.fillText('🎯', zone.x + 4, zone.y + 18)
  ctx.restore()
}

// -------------------------------------------------------------------
// Motion / shot detection
// -------------------------------------------------------------------
function detectShot(ctx: CanvasRenderingContext2D, zone: ZoneRect): void {
  const x = Math.max(0, Math.round(zone.x))
  const y = Math.max(0, Math.round(zone.y))
  const w = Math.min(Math.round(zone.w), CAPTURE_W - x)
  const h = Math.min(Math.round(zone.h), CAPTURE_H - y)

  if (w <= 0 || h <= 0) return

  const currentFrame = ctx.getImageData(x, y, w, h)

  if (!prevFrameData || prevFrameData.width !== w || prevFrameData.height !== h) {
    prevFrameData = currentFrame
    return
  }

  // Compute fraction of pixels with significant luminance change
  const d1 = currentFrame.data
  const d2 = prevFrameData.data
  let changedPixels = 0
  const totalPixels = w * h

  for (let i = 0; i < d1.length; i += 4) {
    const dr = Math.abs(d1[i] - d2[i])
    const dg = Math.abs(d1[i + 1] - d2[i + 1])
    const db = Math.abs(d1[i + 2] - d2[i + 2])
    const luminanceDelta = (dr + dg + db) / 3
    if (luminanceDelta > MOTION_PIXEL_THRESHOLD) changedPixels++
  }

  const motionFraction = changedPixels / totalPixels
  const threshold = getMotionThreshold()
  const now = Date.now()

  if (!ballInZone && motionFraction > threshold) {
    ballInZone = true
  } else if (ballInZone && motionFraction < threshold * ZONE_EXIT_THRESHOLD_MULTIPLIER) {
    // Ball left the zone
    if (now > cooldownUntil) {
      shotCount.value++
      cooldownUntil = now + SHOT_COOLDOWN_MS
    }
    ballInZone = false
  }

  prevFrameData = currentFrame
}

// -------------------------------------------------------------------
// Target zone definition (drag on canvas)
// -------------------------------------------------------------------
function getCanvasCoords(event: MouseEvent | Touch): { x: number; y: number } {
  const canvas = mainCanvas.value
  if (!canvas) return { x: 0, y: 0 }
  const rect = canvas.getBoundingClientRect()
  const scaleX = CAPTURE_W / rect.width
  const scaleY = CAPTURE_H / rect.height
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  }
}

function onZoneStart(event: MouseEvent): void {
  if (trackingActive.value) return
  isDefiningZone = true
  zoneOrigin = getCanvasCoords(event)
  draftZone = null
}

function onZoneMove(event: MouseEvent): void {
  if (!isDefiningZone || !zoneOrigin) return
  const current = getCanvasCoords(event)
  draftZone = buildRect(zoneOrigin, current)
}

function onZoneEnd(): void {
  if (!isDefiningZone || !draftZone) {
    isDefiningZone = false
    return
  }
  // Only save if zone has meaningful size
  if (Math.abs(draftZone.w) > MIN_ZONE_SIZE && Math.abs(draftZone.h) > MIN_ZONE_SIZE) {
    targetZone.value = normalizeRect(draftZone)
  }
  draftZone = null
  isDefiningZone = false
  zoneOrigin = null
  prevFrameData = null // reset diff baseline
}

function onTouchZoneStart(event: TouchEvent): void {
  if (trackingActive.value) return
  const touch = event.touches[0]
  if (!touch) return
  isDefiningZone = true
  zoneOrigin = getCanvasCoords(touch)
  draftZone = null
}

function onTouchZoneMove(event: TouchEvent): void {
  if (!isDefiningZone || !zoneOrigin) return
  const touch = event.touches[0]
  if (!touch) return
  const current = getCanvasCoords(touch)
  draftZone = buildRect(zoneOrigin, current)
}

function buildRect(origin: DrawOrigin, current: { x: number; y: number }): ZoneRect {
  return {
    x: origin.x,
    y: origin.y,
    w: current.x - origin.x,
    h: current.y - origin.y
  }
}

function normalizeRect(rect: ZoneRect): ZoneRect {
  return {
    x: rect.w >= 0 ? rect.x : rect.x + rect.w,
    y: rect.h >= 0 ? rect.y : rect.y + rect.h,
    w: Math.abs(rect.w),
    h: Math.abs(rect.h)
  }
}

function clearZone(): void {
  targetZone.value = null
  prevFrameData = null
}

// -------------------------------------------------------------------
// Tracking session control
// -------------------------------------------------------------------
function startTracking(): void {
  if (!targetZone.value) return
  trackingActive.value = true
  sessionSaved.value = false
  ballInZone = false
  cooldownUntil = 0
  prevFrameData = null
  sessionElapsedMs.value = 0
  sessionStartTime = Date.now()
  timerHandle = setInterval(() => {
    sessionElapsedMs.value = Date.now() - sessionStartTime
  }, 500)
}

function stopTracking(): void {
  if (!trackingActive.value) return
  trackingActive.value = false
  if (timerHandle !== null) {
    clearInterval(timerHandle)
    timerHandle = null
  }
  void saveSession()
}

function resetSession(): void {
  if (trackingActive.value) return
  shotCount.value = 0
  sessionElapsedMs.value = 0
  ballInZone = false
  cooldownUntil = 0
  prevFrameData = null
  sessionSaved.value = false
}

async function saveSession(): Promise<void> {
  if (shotCount.value === 0) return
  try {
    const bridge = getSportBridge()
    await bridge.toolSessionRepository.create({
      toolType: 'tracking-basketball',
      sessionMetadata: {
        shots: shotCount.value,
        durationMs: sessionElapsedMs.value,
        sensitivity: sensitivity.value
      },
      startedAt: new Date(sessionStartTime),
      endedAt: new Date()
    })
    sessionSaved.value = true
  } catch (error) {
    console.warn('Failed to save basketball tracking session:', error)
  }
}

// -------------------------------------------------------------------
// Cleanup
// -------------------------------------------------------------------
onBeforeUnmount(() => {
  stopRenderLoop()
  if (timerHandle !== null) {
    clearInterval(timerHandle)
  }
  if (mediaStream.value) {
    for (const track of mediaStream.value.getTracks()) {
      track.stop()
    }
  }
})
</script>

<style scoped>
.tracking-basketball-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.page-header h2 {
  margin: 0;
  font-size: 1.35rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */
.card {
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  padding: 1rem 1.25rem;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #fef2f2;
  border-color: #fca5a5;
  color: #991b1b;
}

.idle-hint {
  color: #64748b;
}

/* ------------------------------------------------------------------ */
/* Stats bar                                                           */
/* ------------------------------------------------------------------ */
.stats-bar {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  color: #0f172a;
}

.stat-label {
  font-size: 0.8rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.status-item {
  margin-left: auto;
}

.status-pill {
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-pill--ready {
  background: rgba(14, 116, 144, 0.1);
  color: #155e75;
}

.status-pill--running {
  background: rgba(22, 163, 74, 0.12);
  color: #15803d;
  animation: pulse 1.5s infinite;
}

.status-pill--stopped {
  background: rgba(234, 88, 12, 0.1);
  color: #c2410c;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* ------------------------------------------------------------------ */
/* Video wrapper                                                        */
/* ------------------------------------------------------------------ */
.video-wrapper {
  padding: 0.75rem;
}

.canvas-container {
  position: relative;
  width: 100%;
  line-height: 0;
}

.live-video-hidden {
  display: none;
}

.main-canvas {
  width: 100%;
  height: auto;
  border-radius: 10px;
  cursor: crosshair;
  touch-action: none;
  display: block;
}

.zone-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
}

.zone-badge {
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  background: rgba(22, 163, 74, 0.12);
  color: #15803d;
}

.zone-badge--empty {
  background: rgba(100, 116, 139, 0.1);
  color: #64748b;
}

/* ------------------------------------------------------------------ */
/* Controls panel                                                       */
/* ------------------------------------------------------------------ */
.controls-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.control-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.sensitivity-level {
  font-weight: 700;
  color: #0e7490;
}

.delay-slider {
  width: 100%;
  accent-color: #0e7490;
}

.slider-marks {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #94a3b8;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* ------------------------------------------------------------------ */
/* Buttons                                                              */
/* ------------------------------------------------------------------ */
.btn {
  min-height: 44px;
  padding: 0.5rem 1.25rem;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  transition: opacity 0.15s;
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-primary {
  background: #0e7490;
  color: white;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-secondary {
  background: rgba(15, 23, 42, 0.07);
  color: #0f172a;
}

.btn-large {
  padding: 0.65rem 1.75rem;
  font-size: 1rem;
  min-height: 52px;
}

.retry-btn {
  margin-left: auto;
}

.session-saved-notice {
  margin: 0;
  font-size: 0.875rem;
  color: #15803d;
}
</style>
