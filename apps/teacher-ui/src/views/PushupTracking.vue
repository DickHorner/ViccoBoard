<template>
  <div class="pushup-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← {{ t('COMMON.back') }}</button>
      <h2>{{ t('TRACKING.pushups.title') }}</h2>
    </div>

    <!-- Configuration card (hidden while tracking) -->
    <section v-if="!isTracking && !sessionSaved" class="card config-card">
      <h3>{{ t('TRACKING.pushups.fps-label').replace(':', '') }} &amp; {{ t('TRACKING.pushups.persons-label').replace(':', '') }}</h3>
      <div class="form-row">
        <div class="form-group">
          <label for="pt-fps">{{ t('TRACKING.pushups.fps-label') }}</label>
          <select id="pt-fps" v-model.number="configFps" class="form-input">
            <option :value="15">15</option>
            <option :value="30">30</option>
          </select>
        </div>
        <div class="form-group">
          <label for="pt-persons">{{ t('TRACKING.pushups.persons-label') }}</label>
          <select id="pt-persons" v-model.number="configMaxPersons" class="form-input">
            <option :value="1">1</option>
            <option :value="2">2</option>
            <option :value="3">3</option>
            <option :value="4">4</option>
          </select>
        </div>
        <div class="form-group">
          <label for="pt-class">{{ t('DICE.class') }}</label>
          <select id="pt-class" v-model="selectedClassId" class="form-input">
            <option value="">—</option>
            <option v-for="cls in classes" :key="cls.id" :value="cls.id">
              {{ cls.name }} ({{ cls.schoolYear }})
            </option>
          </select>
        </div>
      </div>
    </section>

    <!-- Camera error -->
    <div v-if="cameraError" class="error-banner card">
      <strong>{{ t('TRACKING.pushups.error-title') }}:</strong> {{ cameraError }}
      <button class="btn-retry" @click="initCamera">{{ t('TRACKING.pushups.retry') }}</button>
    </div>

    <!-- Camera idle hint -->
    <div v-if="!cameraActive && !cameraError" class="idle-hint card">
      <p>{{ t('TRACKING.pushups.status.ready') }}</p>
    </div>

    <!-- Main tracking area -->
    <div v-show="cameraActive" class="tracking-layout">
      <!-- Video + person zones overlay -->
      <div ref="videoWrapper" class="video-wrapper card">
        <video
          ref="videoEl"
          class="camera-feed"
          autoplay
          muted
          playsinline
        />
        <!-- Hidden canvas used for frame analysis -->
        <canvas ref="analysisCanvas" class="hidden-canvas" :width="captureW" :height="captureH" />
        <!-- Person region overlays -->
        <div class="person-zones">
          <div
            v-for="(person, i) in persons"
            :key="i"
            class="person-zone"
            :class="[
              `quality-${person.quality}`,
              { 'person-zone--editing': editingRegionIndex === i }
            ]"
            :style="regionStyle(displayRegion(i))"
          >
            <span class="person-label">P{{ i + 1 }}</span>
            <span class="person-count">{{ person.count }}</span>
            <span class="person-quality quality-badge" :class="`quality-${person.quality}`">
              {{ qualityLabel(person.quality) }}
            </span>
          </div>
        </div>

        <div
          v-if="editingRegionIndex !== null && !isTracking"
          class="person-region-editor"
          @mousedown="onRegionStart"
          @mousemove="onRegionMove"
          @mouseup="onRegionEnd"
          @mouseleave="onRegionEnd"
          @touchstart.prevent="onTouchRegionStart"
          @touchmove.prevent="onTouchRegionMove"
          @touchend.prevent="onRegionEnd"
        ></div>
      </div>

      <div v-if="cameraActive && !isTracking" class="region-controls card">
        <div class="region-controls__header">
          <strong>{{ t('TRACKING.pushups.regions.title') }}</strong>
          <button class="btn-secondary region-reset" type="button" @click="resetPersonRegions">
            {{ t('TRACKING.pushups.regions.reset') }}
          </button>
        </div>
        <div class="region-controls__buttons">
          <button
            v-for="(_person, i) in persons"
            :key="i"
            class="region-button"
            :class="{ 'region-button--active': editingRegionIndex === i }"
            type="button"
            @click="beginRegionEdit(i)"
          >
            P{{ i + 1 }}
          </button>
        </div>
        <p class="region-hint">{{ t('TRACKING.pushups.regions.hint') }}</p>
      </div>

      <!-- Live stats bar -->
      <div class="stats-bar card">
        <div class="stat-item">
          <span class="stat-label">{{ t('TRACKING.pushups.stats.total-reps') }}</span>
          <span class="stat-value">{{ totalReps }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">{{ t('TRACKING.pushups.stats.average') }}</span>
          <span class="stat-value">{{ average.toFixed(1) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">{{ t('TRACKING.pushups.stats.fps') }}</span>
          <span class="stat-value">{{ measuredFps.toFixed(0) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">⏱</span>
          <span class="stat-value">{{ formatDuration(elapsedSeconds) }}</span>
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div class="controls-card card">
      <button
        v-if="!cameraActive"
        class="btn-primary"
        @click="initCamera"
      >
        📷 {{ t('TRACKING.pushups.controls.start') }}
      </button>
      <template v-else>
        <button
          v-if="!isTracking"
          class="btn-primary"
          @click="startTracking"
        >
          ▶ {{ t('TRACKING.pushups.controls.start') }}
        </button>
        <button
          v-else
          class="btn-danger"
          @click="stopTracking"
        >
          ⏹ {{ t('TRACKING.pushups.controls.stop') }}
        </button>
        <button
          class="btn-secondary"
          :disabled="isTracking"
          @click="resetAll"
        >
          🔄 {{ t('TRACKING.pushups.controls.reset') }}
        </button>
      </template>
    </div>

    <!-- Session saved notification -->
    <div v-if="sessionSaved" class="success-banner card">
      ✅ {{ t('DICE.save-success') }}
    </div>
    <div v-if="saveError" class="warning-banner card">
      ⚠️ {{ t('DICE.save-error') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getSportBridge } from '../composables/useSportBridge'
import {
  PushupRepetitionCounter,
  type PushupQuality,
  type PushupPersonData,
} from '@viccoboard/sport'
import type { ClassGroup } from '@viccoboard/core'

const { t } = useI18n()
const SportBridge = getSportBridge()

// ── Configuration ──────────────────────────────────────────────────────────
const configFps = ref<15 | 30>(30)
const configMaxPersons = ref(2)
const selectedClassId = ref('')
const classes = ref<ClassGroup[]>([])

// ── Camera ────────────────────────────────────────────────────────────────
const videoEl = ref<HTMLVideoElement | null>(null)
const videoWrapper = ref<HTMLDivElement | null>(null)
const analysisCanvas = ref<HTMLCanvasElement | null>(null)
const cameraActive = ref(false)
const cameraError = ref<string | null>(null)

const captureW = 320
const captureH = 240

/** Cached 2D rendering context – set once on camera init to avoid per-frame getContext calls. */
let analysisCtx: CanvasRenderingContext2D | null = null

let stream: MediaStream | null = null
let cameraRequestId = 0
let disposed = false

async function initCamera() {
  cameraError.value = null
  const requestId = ++cameraRequestId
  let requestedStream: MediaStream | null = null
  try {
    requestedStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: captureW * 2 },
        height: { ideal: captureH * 2 },
      },
      audio: false,
    })
    if (requestId !== cameraRequestId || disposed) {
      requestedStream.getTracks().forEach(track => track.stop())
      return
    }

    stream = requestedStream

    const video = videoEl.value
    if (!video) throw new Error('Video element not available')
    video.srcObject = requestedStream
    await video.play()

    if (requestId !== cameraRequestId || disposed) {
      requestedStream.getTracks().forEach(track => track.stop())
      if (stream === requestedStream) stream = null
      if (video.srcObject === requestedStream) video.srcObject = null
      return
    }
    // Cache the canvas context immediately after camera is ready
    if (analysisCanvas.value) {
      analysisCtx = analysisCanvas.value.getContext('2d', { willReadFrequently: true })
    }
    cameraActive.value = true
  } catch (err) {
    if (requestId !== cameraRequestId || disposed) {
      requestedStream?.getTracks().forEach(track => track.stop())
      return
    }
    stopCamera()
    // Provide friendly messages for the most common permission errors
    if (err instanceof DOMException && err.name === 'NotAllowedError') {
      cameraError.value = t('DELAY.cameraPermissionDenied') ||
        'Camera access was denied. Please grant camera permission and try again.'
    } else if (err instanceof DOMException && err.name === 'NotFoundError') {
      cameraError.value = t('DELAY.cameraNotFound') ||
        'No camera found on this device.'
    } else {
      cameraError.value = (err instanceof Error) ? err.message : String(err)
    }
  }
}

function stopCamera() {
  cameraRequestId += 1
  stream?.getTracks().forEach(t => t.stop())
  stream = null
  if (videoEl.value) videoEl.value.srcObject = null
  analysisCtx = null
  cameraActive.value = false
}

// ── Tracking state ────────────────────────────────────────────────────────
interface PersonState {
  count: number
  quality: PushupQuality
}

interface PersonRegion {
  x: number
  y: number
  w: number
  h: number
}

interface RegionPoint {
  x: number
  y: number
}

const persons = ref<PersonState[]>([])
const personRegions = ref<PersonRegion[]>([])
const editingRegionIndex = ref<number | null>(null)
const draftRegion = ref<PersonRegion | null>(null)
let regionOrigin: RegionPoint | null = null
const isTracking = ref(false)
const elapsedSeconds = ref(0)
const measuredFps = ref(0)
const sessionSaved = ref(false)
const saveError = ref(false)

let counter: PushupRepetitionCounter | null = null
let captureIntervalId: ReturnType<typeof setInterval> | null = null
let elapsedIntervalId: ReturnType<typeof setInterval> | null = null
let sessionStartedAt: Date | null = null
let prevFrameData: Array<ImageData | null> = []
let frameCount = 0
let fpsWindowStart = 0

const totalReps = computed(() => persons.value.reduce((s, p) => s + p.count, 0))
const average = computed(() =>
  configMaxPersons.value > 0 ? totalReps.value / configMaxPersons.value : 0
)

function initPersons() {
  persons.value = Array.from({ length: configMaxPersons.value }, () => ({
    count: 0,
    quality: 'good' as PushupQuality,
  }))
  prevFrameData = []
}

function createDefaultPersonRegions(): PersonRegion[] {
  const count = configMaxPersons.value
  return Array.from({ length: count }, (_value, index) => ({
    x: index / count,
    y: 0,
    w: 1 / count,
    h: 1,
  }))
}

function resetPersonRegions() {
  personRegions.value = createDefaultPersonRegions()
  editingRegionIndex.value = null
  draftRegion.value = null
  regionOrigin = null
  prevFrameData = []
}

function beginRegionEdit(index: number) {
  if (isTracking.value) return
  editingRegionIndex.value = editingRegionIndex.value === index ? null : index
  draftRegion.value = null
  regionOrigin = null
}

function displayRegion(index: number): PersonRegion {
  if (editingRegionIndex.value === index && draftRegion.value) {
    return draftRegion.value
  }
  const count = Math.max(1, configMaxPersons.value)
  return personRegions.value[index] ?? {
    x: index / count,
    y: 0,
    w: 1 / count,
    h: 1,
  }
}

function regionStyle(region: PersonRegion): Record<string, string> {
  return {
    left: `${region.x * 100}%`,
    top: `${region.y * 100}%`,
    width: `${region.w * 100}%`,
    height: `${region.h * 100}%`,
  }
}

function getRegionPoint(event: MouseEvent | Touch): RegionPoint | null {
  const wrapper = videoWrapper.value
  if (!wrapper) return null

  const rect = wrapper.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return null

  return {
    x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
    y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
  }
}

function buildRegion(a: RegionPoint, b: RegionPoint): PersonRegion {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(b.x - a.x),
    h: Math.abs(b.y - a.y),
  }
}

function onRegionStart(event: MouseEvent) {
  if (editingRegionIndex.value === null) return
  regionOrigin = getRegionPoint(event)
  if (regionOrigin) draftRegion.value = { x: regionOrigin.x, y: regionOrigin.y, w: 0, h: 0 }
}

function onRegionMove(event: MouseEvent) {
  if (editingRegionIndex.value === null || !regionOrigin) return
  const point = getRegionPoint(event)
  if (point) draftRegion.value = buildRegion(regionOrigin, point)
}

function onTouchRegionStart(event: TouchEvent) {
  const touch = event.touches[0]
  if (!touch || editingRegionIndex.value === null) return
  regionOrigin = getRegionPoint(touch)
  if (regionOrigin) draftRegion.value = { x: regionOrigin.x, y: regionOrigin.y, w: 0, h: 0 }
}

function onTouchRegionMove(event: TouchEvent) {
  const touch = event.touches[0]
  if (!touch || editingRegionIndex.value === null || !regionOrigin) return
  const point = getRegionPoint(touch)
  if (point) draftRegion.value = buildRegion(regionOrigin, point)
}

function onRegionEnd() {
  const index = editingRegionIndex.value
  const region = draftRegion.value
  if (index !== null && region && region.w >= 0.08 && region.h >= 0.12) {
    personRegions.value[index] = region
    prevFrameData[index] = null
  }

  editingRegionIndex.value = null
  draftRegion.value = null
  regionOrigin = null
}

function startTracking() {
  sessionSaved.value = false
  saveError.value = false
  initPersons()

  counter = new PushupRepetitionCounter(configMaxPersons.value)
  sessionStartedAt = new Date()
  elapsedSeconds.value = 0
  frameCount = 0
  fpsWindowStart = Date.now()
  isTracking.value = true

  const intervalMs = Math.round(1000 / configFps.value)

  elapsedIntervalId = setInterval(() => {
    elapsedSeconds.value += 1
  }, 1000)

  captureIntervalId = setInterval(() => {
    captureAndAnalyse()
  }, intervalMs)
}

async function stopTracking() {
  isTracking.value = false
  if (captureIntervalId !== null) {
    clearInterval(captureIntervalId)
    captureIntervalId = null
  }
  if (elapsedIntervalId !== null) {
    clearInterval(elapsedIntervalId)
    elapsedIntervalId = null
  }

  await saveSession()
}

function resetAll() {
  sessionSaved.value = false
  saveError.value = false
  initPersons()
  elapsedSeconds.value = 0
  measuredFps.value = 0
}

async function saveSession() {
  if (!counter) return
  try {
    const personData: PushupPersonData[] = persons.value.map((p, i) => ({
      personId: i,
      count: p.count,
      quality: p.quality,
    }))
    await SportBridge.savePushupSessionUseCase.execute({
      fps: configFps.value,
      maxPersons: configMaxPersons.value,
      durationSeconds: elapsedSeconds.value,
      persons: personData,
      classGroupId: selectedClassId.value || undefined,
      metadata: {
        startedAt: sessionStartedAt,
        personRegions: personRegions.value.map(region => ({ ...region })),
      },
    })
    if (!disposed) sessionSaved.value = true
  } catch {
    if (!disposed) saveError.value = true
  }
}

// ── Frame analysis ────────────────────────────────────────────────────────
function captureAndAnalyse() {
  const video = videoEl.value
  if (
    !analysisCtx ||
    !counter ||
    !video ||
    video.readyState < 2 ||
    video.videoWidth <= 0 ||
    video.videoHeight <= 0
  ) return

  const captureAspect = captureW / captureH
  const videoAspect = video.videoWidth / video.videoHeight
  let sourceX = 0
  let sourceY = 0
  let sourceW = video.videoWidth
  let sourceH = video.videoHeight

  if (videoAspect > captureAspect) {
    sourceW = video.videoHeight * captureAspect
    sourceX = (video.videoWidth - sourceW) / 2
  } else {
    sourceH = video.videoWidth / captureAspect
    sourceY = (video.videoHeight - sourceH) / 2
  }

  analysisCtx.drawImage(video, sourceX, sourceY, sourceW, sourceH, 0, 0, captureW, captureH)

  // FPS measurement
  frameCount++
  const now = Date.now()
  const elapsed = now - fpsWindowStart
  if (elapsed >= 1000) {
    measuredFps.value = (frameCount * 1000) / elapsed
    frameCount = 0
    fpsWindowStart = now
  }

  for (let p = 0; p < configMaxPersons.value; p++) {
    const region = personRegions.value[p]
    if (!region) continue

    const x = Math.max(0, Math.min(captureW - 1, Math.floor(region.x * captureW)))
    const y = Math.max(0, Math.min(captureH - 1, Math.floor(region.y * captureH)))
    const right = Math.max(x + 1, Math.min(captureW, Math.ceil((region.x + region.w) * captureW)))
    const bottom = Math.max(y + 1, Math.min(captureH, Math.ceil((region.y + region.h) * captureH)))
    const regionW = right - x
    const regionH = bottom - y
    const currentFrame = analysisCtx.getImageData(x, y, regionW, regionH)

    const previousFrame = prevFrameData[p]
    if (previousFrame) {
      const height = estimateNormalizedHeight(currentFrame, previousFrame, regionH)
      if (height !== null) {
        counter.processFrame(p, height)
        // Sync reactive state
        persons.value[p].count = counter.getCount(p)
        persons.value[p].quality = counter.getQuality(p)
      }
    }

    prevFrameData[p] = currentFrame
  }
}

/**
 * Estimates the normalised body height (0=floor/down, 1=up) from motion
 * between two frames using vertical centre-of-mass of significant pixel
 * differences.  Returns null when there is too little motion to be reliable.
 *
 * MOTION_THRESHOLD (20): minimum mean per-channel pixel difference to
 *   classify a pixel as "in motion".  Empirically chosen to filter out
 *   camera noise while still detecting body movement.
 *
 * MIN_MOTION_PIXELS (30): minimum number of motion pixels (scaled to
 *   [0, 1] by dividing totalWeight by MAX_RGB_VALUE=255) required before
 *   the centroid reading is considered reliable.
 *
 * MAX_RGB_VALUE (255): maximum value of a single RGB channel, used to
 *   convert cumulative motion weights into an approximate pixel count.
 */
function estimateNormalizedHeight(
  current: ImageData,
  prev: ImageData,
  frameHeight: number
): number | null {
  /** Minimum mean per-channel pixel difference to classify a pixel as "in motion". */
  const MOTION_THRESHOLD = 20
  /** Minimum number of motion pixels before the centroid reading is reliable. */
  const MIN_MOTION_PIXELS = 30
  /** Maximum value of a single RGB channel (used for weight normalisation). */
  const MAX_RGB_VALUE = 255

  let totalWeight = 0
  let weightedY = 0

  const len = current.data.length
  const w = current.width

  for (let i = 0; i < len; i += 4) {
    const dr = Math.abs(current.data[i]     - prev.data[i])
    const dg = Math.abs(current.data[i + 1] - prev.data[i + 1])
    const db = Math.abs(current.data[i + 2] - prev.data[i + 2])
    const motion = (dr + dg + db) / 3

    if (motion >= MOTION_THRESHOLD) {
      const pixelIndex = i / 4
      const y = Math.floor(pixelIndex / w)
      totalWeight += motion
      weightedY += motion * y
    }
  }

  const motionPixels = totalWeight / MAX_RGB_VALUE
  if (motionPixels < MIN_MOTION_PIXELS) return null

  // centroidY: 0 = top of frame (high body position), frameHeight-1 = bottom
  const centroidY = weightedY / totalWeight
  // normalizedHeight: 1 = top (UP), 0 = bottom (DOWN)
  return 1 - centroidY / (frameHeight - 1)
}

// ── Helpers ───────────────────────────────────────────────────────────────
function qualityLabel(q: PushupQuality): string {
  return t(`TRACKING.pushups.quality.${q}`)
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ── Lifecycle ─────────────────────────────────────────────────────────────
watch(configMaxPersons, () => {
  if (isTracking.value) return
  initPersons()
  resetPersonRegions()
})

onMounted(async () => {
  initPersons()
  resetPersonRegions()
  const loadedClasses = await SportBridge.classGroupRepository.findAll()
  if (!disposed) classes.value = loadedClasses
})

onBeforeUnmount(() => {
  disposed = true
  if (captureIntervalId !== null) clearInterval(captureIntervalId)
  if (elapsedIntervalId !== null) clearInterval(elapsedIntervalId)
  stopCamera()
})
</script>

<style scoped src="./PushupTracking.css"></style>
