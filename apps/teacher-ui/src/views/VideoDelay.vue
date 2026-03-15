<template>
  <div class="video-delay-view">
    <div class="page-header">
      <h2>{{ t('DELAY.title') }}</h2>
      <div class="header-actions">
        <button v-if="!cameraActive" class="btn btn-primary" @click="startCamera">
          📷 {{ t('DELAY.startCamera') }}
        </button>
        <button v-else class="btn btn-danger" @click="stopCamera">
          ⏹ {{ t('DELAY.stopCamera') }}
        </button>
      </div>
    </div>

    <div v-if="cameraError" class="error-banner card">
      ⚠️ {{ cameraError }}
    </div>

    <div v-if="!cameraActive && !cameraError" class="idle-hint card">
      <p>{{ t('DELAY.hint') }}</p>
    </div>

    <!-- Main video area -->
    <div v-show="cameraActive" class="video-layout">
      <!-- Delay view (with annotation overlay) -->
      <div class="video-panel card">
        <h3 class="panel-title">
          🎞 {{ t('DELAY.delayedView') }}
          <span class="delay-badge">{{ delaySeconds }}s</span>
        </h3>
        <div class="canvas-container" ref="delayPanelEl">
          <canvas ref="delayCanvas" class="video-canvas" :width="captureW" :height="captureH" />
          <canvas
            ref="annotCanvas"
            class="annot-canvas"
            :width="captureW"
            :height="captureH"
            :style="{ cursor: annotToolCursor }"
            @mousedown="onDrawStart"
            @mousemove="onDrawMove"
            @mouseup="onDrawEnd"
            @mouseleave="onDrawEnd"
            @touchstart.prevent="onTouchDrawStart"
            @touchmove.prevent="onTouchDrawMove"
            @touchend.prevent="onDrawEnd"
          />
        </div>
      </div>

      <!-- Live view -->
      <div class="video-panel card">
        <h3 class="panel-title">🔴 {{ t('DELAY.liveView') }}</h3>
        <div class="canvas-container">
          <video
            ref="liveVideo"
            class="live-video"
            autoplay
            muted
            playsinline
          />
        </div>
      </div>
    </div>

    <!-- Controls panel -->
    <div class="controls-panel card">
      <!-- Delay slider -->
      <div class="control-group">
        <label class="control-label">
          {{ t('DELAY.delay') }}: <strong>{{ delaySeconds }} {{ t('DELAY.seconds') }}</strong>
        </label>
        <input
          type="range"
          v-model.number="delaySeconds"
          min="0"
          max="10"
          step="0.5"
          class="delay-slider"
          :disabled="!cameraActive"
        />
        <div class="slider-marks">
          <span>0s</span>
          <span>5s</span>
          <span>10s</span>
        </div>
      </div>

      <div class="control-row">
        <!-- FPS selector -->
        <div class="control-group">
          <label class="control-label">{{ t('DELAY.fps') }}</label>
          <select v-model.number="selectedFps" class="form-select" :disabled="cameraActive">
            <option :value="15">15</option>
            <option :value="24">24</option>
            <option :value="30">30</option>
          </select>
        </div>

        <!-- Resolution selector -->
        <div class="control-group">
          <label class="control-label">{{ t('DELAY.resolution') }}</label>
          <select v-model="selectedResolution" class="form-select" :disabled="cameraActive">
            <option value="sd">SD (640×360)</option>
            <option value="hd">HD (1280×720)</option>
          </select>
        </div>
      </div>

      <!-- Annotation tools -->
      <div class="control-group" v-if="cameraActive">
        <label class="control-label">{{ t('DELAY.annotate') }}</label>
        <div class="tool-row">
          <button
            v-for="tool in annotTools"
            :key="tool.type"
            :class="['tool-btn', { active: activeTool === tool.type }]"
            @click="activeTool = tool.type"
            :title="t(tool.labelKey)"
          >
            <span>{{ tool.icon }}</span>
            <span class="tool-label">{{ t(tool.labelKey) }}</span>
          </button>

          <button class="tool-btn clear-btn" @click="clearAnnotations" :title="t('DELAY.clearAnnotations')">
            <span>🗑</span>
            <span class="tool-label">{{ t('DELAY.clearAnnotations') }}</span>
          </button>
        </div>
      </div>

      <!-- Color picker -->
      <div class="control-group" v-if="cameraActive">
        <label class="control-label">{{ t('DELAY.color') }}</label>
        <div class="color-row">
          <button
            v-for="col in annotColors"
            :key="col.value"
            :class="['color-dot', { active: activeColor === col.value }]"
            :style="{ background: col.value }"
            :title="col.label"
            @click="activeColor = col.value"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------
type AnnotTool = 'pen' | 'arrow' | 'circle' | 'line'
type Resolution = 'sd' | 'hd'

interface DrawPoint {
  x: number
  y: number
}

interface Annotation {
  type: AnnotTool
  color: string
  points: DrawPoint[]
}

interface BufferFrame {
  t: number
  bmp: ImageBitmap
}

// -------------------------------------------------------------------
// State
// -------------------------------------------------------------------
const cameraActive = ref(false)
const cameraError = ref('')
const mediaStream = ref<MediaStream | null>(null)
const delaySeconds = ref(3)
const selectedFps = ref(30)
const selectedResolution = ref<Resolution>('sd')

// Annotation state
const activeTool = ref<AnnotTool>('pen')
const activeColor = ref('#ff0000')
const annotations = ref<Annotation[]>([])
let currentAnnotation: Annotation | null = null
let isDrawing = false

// Refs
const liveVideo = ref<HTMLVideoElement | null>(null)
const delayCanvas = ref<HTMLCanvasElement | null>(null)
const annotCanvas = ref<HTMLCanvasElement | null>(null)

// Internal capture state
let captureCanvas: HTMLCanvasElement | null = null
let captureCtx: CanvasRenderingContext2D | null = null
const frameBuffer: BufferFrame[] = []
let rafId: number | null = null
let lastCaptureTs = 0

// -------------------------------------------------------------------
// Constants / computed
// -------------------------------------------------------------------
const RESOLUTION_MAP: Record<Resolution, { w: number; h: number }> = {
  sd: { w: 640, h: 360 },
  hd: { w: 1280, h: 720 }
}

const captureW = computed(() => RESOLUTION_MAP[selectedResolution.value].w)
const captureH = computed(() => RESOLUTION_MAP[selectedResolution.value].h)

const annotTools: Array<{ type: AnnotTool; icon: string; labelKey: string }> = [
  { type: 'pen', icon: '✏️', labelKey: 'DELAY.toolPen' },
  { type: 'arrow', icon: '➡️', labelKey: 'DELAY.toolArrow' },
  { type: 'circle', icon: '⭕', labelKey: 'DELAY.toolCircle' },
  { type: 'line', icon: '📏', labelKey: 'DELAY.toolLine' }
]

const annotColors = [
  { value: '#ff0000', label: 'Red' },
  { value: '#ffcc00', label: 'Yellow' },
  { value: '#00cc44', label: 'Green' },
  { value: '#0044ff', label: 'Blue' },
  { value: '#ffffff', label: 'White' }
]

const annotToolCursor = 'crosshair'

// -------------------------------------------------------------------
// Camera management
// -------------------------------------------------------------------
async function startCamera(): Promise<void> {
  cameraError.value = ''
  const { w, h } = RESOLUTION_MAP[selectedResolution.value]
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: w },
        height: { ideal: h },
        frameRate: { ideal: selectedFps.value }
      },
      audio: false
    })

    mediaStream.value = stream
    const video = liveVideo.value!
    video.srcObject = stream
    // wait until metadata is available before playing
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve()
      video.onerror = (e) => reject(e)
    })
    await video.play()

    // Create offscreen capture canvas
    captureCanvas = document.createElement('canvas')
    captureCanvas.width = w
    captureCanvas.height = h
    captureCtx = captureCanvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D

    cameraActive.value = true
    startRenderLoop()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('notallowed')) {
      cameraError.value = t('DELAY.noCameraPermission')
    } else {
      cameraError.value = msg
    }
  }
}

function stopCamera(): void {
  cameraActive.value = false
  stopRenderLoop()

  // Release media stream
  if (mediaStream.value) {
    for (const track of mediaStream.value.getTracks()) {
      track.stop()
    }
    mediaStream.value = null
  }
  if (liveVideo.value) {
    liveVideo.value.srcObject = null
  }

  // Release ImageBitmaps
  for (const frame of frameBuffer) {
    frame.bmp.close()
  }
  frameBuffer.length = 0

  // Clear canvases
  clearDelayCanvas()
  captureCanvas = null
  captureCtx = null
}

// -------------------------------------------------------------------
// Render loop
// -------------------------------------------------------------------
function startRenderLoop(): void {
  lastCaptureTs = 0
  const captureIntervalMs = 1000 / selectedFps.value

  function loop(ts: number): void {
    if (!cameraActive.value) return

    if (ts - lastCaptureTs >= captureIntervalMs) {
      lastCaptureTs = ts
      captureFrameAsync()
    }

    renderDelayedFrame()
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

// -------------------------------------------------------------------
// Frame capture (async, fire-and-forget in RAF loop)
// -------------------------------------------------------------------
function captureFrameAsync(): void {
  if (!captureCtx || !captureCanvas || !liveVideo.value) return
  const video = liveVideo.value
  if (video.readyState < 2 || video.paused) return

  captureCtx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height)

  // createImageBitmap is supported in Safari 15+ / iOS 15+
  createImageBitmap(captureCanvas).then((bmp) => {
    frameBuffer.push({ t: Date.now(), bmp })
    trimBuffer()
  }).catch(() => {
    // ignore capture errors (e.g. empty frame)
  })
}

function trimBuffer(): void {
  // Keep at most (maxDelay + 2s padding) * fps frames
  const maxKeepMs = (10 + 2) * 1000
  const now = Date.now()
  while (frameBuffer.length > 0 && now - frameBuffer[0].t > maxKeepMs) {
    frameBuffer.shift()!.bmp.close()
  }
}

// -------------------------------------------------------------------
// Render delayed frame
// -------------------------------------------------------------------
function renderDelayedFrame(): void {
  const ctx = delayCanvas.value?.getContext('2d') as CanvasRenderingContext2D | null
  if (!ctx) return

  const targetTime = Date.now() - delaySeconds.value * 1000

  // Find the most recent frame that was captured at or before targetTime
  let best: BufferFrame | null = null
  for (let i = frameBuffer.length - 1; i >= 0; i--) {
    if (frameBuffer[i].t <= targetTime) {
      best = frameBuffer[i]
      break
    }
  }

  if (best) {
    ctx.drawImage(best.bmp, 0, 0, captureW.value, captureH.value)
  } else if (delaySeconds.value === 0 && frameBuffer.length > 0) {
    // Delay=0: show most recent frame
    ctx.drawImage(frameBuffer[frameBuffer.length - 1].bmp, 0, 0, captureW.value, captureH.value)
  }
}

function clearDelayCanvas(): void {
  const ctx = delayCanvas.value?.getContext('2d') as CanvasRenderingContext2D | null
  if (!ctx) return
  ctx.clearRect(0, 0, captureW.value, captureH.value)
}

// -------------------------------------------------------------------
// Annotation drawing
// -------------------------------------------------------------------
function getAnnotCtx(): CanvasRenderingContext2D | null {
  return (annotCanvas.value?.getContext('2d') as CanvasRenderingContext2D | null) ?? null
}

function canvasPoint(e: { clientX: number; clientY: number }): DrawPoint {
  const canvas = annotCanvas.value!
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  }
}

function onDrawStart(e: MouseEvent): void {
  const pt = canvasPoint(e)
  isDrawing = true
  currentAnnotation = {
    type: activeTool.value,
    color: activeColor.value,
    points: [pt]
  }
}

function onDrawMove(e: MouseEvent): void {
  if (!isDrawing || !currentAnnotation) return
  const pt = canvasPoint(e)
  if (activeTool.value === 'pen') {
    currentAnnotation.points.push(pt)
    redrawAnnotations()
  } else {
    // For arrow/circle/line: show preview (replace last preview)
    redrawAnnotations({ preview: { ...currentAnnotation, points: [currentAnnotation.points[0], pt] } })
  }
}

function onDrawEnd(e: MouseEvent | Event): void {
  if (!isDrawing || !currentAnnotation) return
  isDrawing = false

  const finalPt = e instanceof MouseEvent ? canvasPoint(e) : currentAnnotation.points[currentAnnotation.points.length - 1]

  if (activeTool.value === 'pen') {
    annotations.value.push({ ...currentAnnotation })
  } else {
    annotations.value.push({
      type: currentAnnotation.type,
      color: currentAnnotation.color,
      points: [currentAnnotation.points[0], finalPt]
    })
  }
  currentAnnotation = null
  redrawAnnotations()
}

function touchToPoint(t: Touch): DrawPoint {
  return canvasPoint({ clientX: t.clientX, clientY: t.clientY })
}

function onTouchDrawStart(e: TouchEvent): void {
  if (e.touches.length > 0) {
    const pt = touchToPoint(e.touches[0])
    isDrawing = true
    currentAnnotation = {
      type: activeTool.value,
      color: activeColor.value,
      points: [pt]
    }
  }
}

function onTouchDrawMove(e: TouchEvent): void {
  if (!isDrawing || !currentAnnotation || e.touches.length === 0) return
  const pt = touchToPoint(e.touches[0])
  if (activeTool.value === 'pen') {
    currentAnnotation.points.push(pt)
    redrawAnnotations()
  } else {
    redrawAnnotations({ preview: { ...currentAnnotation, points: [currentAnnotation.points[0], pt] } })
  }
}

function clearAnnotations(): void {
  annotations.value = []
  currentAnnotation = null
  isDrawing = false
  const ctx = getAnnotCtx()
  if (ctx) ctx.clearRect(0, 0, captureW.value, captureH.value)
}

function redrawAnnotations(opts?: { preview?: Annotation }): void {
  const ctx = getAnnotCtx()
  if (!ctx) return

  ctx.clearRect(0, 0, captureW.value, captureH.value)

  for (const ann of annotations.value) {
    drawAnnotation(ctx, ann)
  }

  if (opts?.preview) {
    drawAnnotation(ctx, opts.preview)
  }
}

function drawAnnotation(ctx: CanvasRenderingContext2D, ann: Annotation): void {
  if (ann.points.length === 0) return

  ctx.strokeStyle = ann.color
  ctx.fillStyle = ann.color
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const [start] = ann.points
  const end = ann.points[ann.points.length - 1]

  switch (ann.type) {
    case 'pen': {
      if (ann.points.length < 2) return
      ctx.beginPath()
      ctx.moveTo(ann.points[0].x, ann.points[0].y)
      for (let i = 1; i < ann.points.length; i++) {
        ctx.lineTo(ann.points[i].x, ann.points[i].y)
      }
      ctx.stroke()
      break
    }
    case 'line': {
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()
      break
    }
    case 'arrow': {
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()
      // Arrowhead
      const angle = Math.atan2(end.y - start.y, end.x - start.x)
      const headLen = 18
      ctx.beginPath()
      ctx.moveTo(end.x, end.y)
      ctx.lineTo(end.x - headLen * Math.cos(angle - 0.4), end.y - headLen * Math.sin(angle - 0.4))
      ctx.lineTo(end.x - headLen * Math.cos(angle + 0.4), end.y - headLen * Math.sin(angle + 0.4))
      ctx.closePath()
      ctx.fill()
      break
    }
    case 'circle': {
      const r = Math.max(4, Math.hypot(end.x - start.x, end.y - start.y))
      ctx.beginPath()
      ctx.arc(start.x, start.y, r, 0, Math.PI * 2)
      ctx.stroke()
      break
    }
  }
}

// -------------------------------------------------------------------
// Lifecycle
// -------------------------------------------------------------------
onBeforeUnmount(() => {
  if (cameraActive.value) stopCamera()
})
</script>

<style scoped>
.video-delay-view {
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
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
}

.error-banner {
  padding: 0.75rem 1rem;
  background: #fff3f3;
  border-left: 4px solid #e53935;
  color: #b71c1c;
}

.idle-hint {
  padding: 1.25rem;
  color: var(--color-text-muted, #666);
  text-align: center;
}

/* ---- Video layout ---- */
.video-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 768px) {
  .video-layout {
    grid-template-columns: 1fr;
  }
}

.video-panel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  overflow: hidden;
}

.panel-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.delay-badge {
  background: var(--color-primary, #2196f3);
  color: #fff;
  border-radius: 999px;
  padding: 0.1rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
}

/* ---- Canvas container ---- */
.canvas-container {
  position: relative;
  width: 100%;
  line-height: 0;
}

.video-canvas,
.annot-canvas,
.live-video {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 4px;
}

.annot-canvas {
  position: absolute;
  top: 0;
  left: 0;
}

.live-video {
  background: #000;
}

/* ---- Controls panel ---- */
.controls-panel {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.control-row {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  flex: 1;
  min-width: 140px;
}

.control-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-muted, #555);
}

/* Delay slider */
.delay-slider {
  width: 100%;
  accent-color: var(--color-primary, #2196f3);
  cursor: pointer;
}

.slider-marks {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  color: var(--color-text-muted, #888);
}

/* Annotation tools */
.tool-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.tool-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.4rem 0.6rem;
  border: 2px solid var(--color-border, #e0e0e0);
  border-radius: 6px;
  background: var(--color-surface, #fff);
  cursor: pointer;
  font-size: 0.8rem;
  gap: 0.125rem;
  min-width: 52px;
  transition: background 0.15s, border-color 0.15s;
}

.tool-btn.active {
  border-color: var(--color-primary, #2196f3);
  background: color-mix(in srgb, var(--color-primary, #2196f3) 12%, transparent);
}

.tool-btn:hover:not(.active) {
  border-color: var(--color-border-hover, #bbb);
}

.clear-btn {
  border-color: #e53935;
  color: #e53935;
}

.clear-btn:hover {
  background: #fff3f3;
}

.tool-label {
  font-size: 0.7rem;
  white-space: nowrap;
}

/* Color row */
.color-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.color-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 3px solid transparent;
  cursor: pointer;
  outline: none;
  transition: transform 0.1s, border-color 0.15s;
}

.color-dot.active {
  border-color: var(--color-text, #333);
  transform: scale(1.15);
}

.color-dot:hover:not(.active) {
  transform: scale(1.08);
}

/* Form elements */
.form-select {
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--color-border, #ccc);
  border-radius: 4px;
  background: var(--color-surface, #fff);
  font-size: 0.875rem;
  width: 100%;
}

.form-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: opacity 0.15s;
}

.btn:hover {
  opacity: 0.88;
}

.btn-primary {
  background: var(--color-primary, #2196f3);
  color: #fff;
}

.btn-danger {
  background: #e53935;
  color: #fff;
}

/* Card utility */
.card {
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e0e0e0);
  border-radius: 8px;
}
</style>
