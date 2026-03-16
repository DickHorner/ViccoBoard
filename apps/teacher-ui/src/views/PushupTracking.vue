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
      <div class="video-wrapper card">
        <video
          ref="videoEl"
          class="camera-feed"
          autoplay
          muted
          playsinline
        />
        <!-- Hidden canvas used for frame analysis -->
        <canvas ref="analysisCanvas" class="hidden-canvas" :width="captureW" :height="captureH" />
        <!-- Person zone overlays -->
        <div class="person-zones" :style="{ gridTemplateColumns: `repeat(${configMaxPersons}, 1fr)` }">
          <div
            v-for="(person, i) in persons"
            :key="i"
            class="person-zone"
            :class="`quality-${person.quality}`"
          >
            <span class="person-label">P{{ i + 1 }}</span>
            <span class="person-count">{{ person.count }}</span>
            <span class="person-quality quality-badge" :class="`quality-${person.quality}`">
              {{ qualityLabel(person.quality) }}
            </span>
          </div>
        </div>
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
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
const analysisCanvas = ref<HTMLCanvasElement | null>(null)
const cameraActive = ref(false)
const cameraError = ref<string | null>(null)

const captureW = 320
const captureH = 240

/** Cached 2D rendering context – set once on camera init to avoid per-frame getContext calls. */
let analysisCtx: CanvasRenderingContext2D | null = null

let stream: MediaStream | null = null

async function initCamera() {
  cameraError.value = null
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: captureW * 2 },
        height: { ideal: captureH * 2 },
      },
      audio: false,
    })
    if (videoEl.value) {
      videoEl.value.srcObject = stream
      await videoEl.value.play()
    }
    // Cache the canvas context immediately after camera is ready
    if (analysisCanvas.value) {
      analysisCtx = analysisCanvas.value.getContext('2d', { willReadFrequently: true })
    }
    cameraActive.value = true
  } catch (err) {
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

const persons = ref<PersonState[]>([])
const isTracking = ref(false)
const elapsedSeconds = ref(0)
const measuredFps = ref(0)
const sessionSaved = ref(false)
const saveError = ref(false)

let counter: PushupRepetitionCounter | null = null
let captureIntervalId: ReturnType<typeof setInterval> | null = null
let elapsedIntervalId: ReturnType<typeof setInterval> | null = null
let sessionStartedAt: Date | null = null
let prevFrameData: ImageData[] = []
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
      metadata: { startedAt: sessionStartedAt },
    })
    sessionSaved.value = true
  } catch {
    saveError.value = true
  }
}

// ── Frame analysis ────────────────────────────────────────────────────────
function captureAndAnalyse() {
  const video = videoEl.value
  if (!analysisCtx || !counter || !video || video.readyState < 2) return

  analysisCtx.drawImage(video, 0, 0, captureW, captureH)

  // FPS measurement
  frameCount++
  const now = Date.now()
  const elapsed = now - fpsWindowStart
  if (elapsed >= 1000) {
    measuredFps.value = (frameCount * 1000) / elapsed
    frameCount = 0
    fpsWindowStart = now
  }

  const zoneW = Math.floor(captureW / configMaxPersons.value)

  for (let p = 0; p < configMaxPersons.value; p++) {
    const x = p * zoneW
    const currentFrame = analysisCtx.getImageData(x, 0, zoneW, captureH)

    if (prevFrameData[p]) {
      const height = estimateNormalizedHeight(currentFrame, prevFrameData[p], captureH)
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
onMounted(async () => {
  initPersons()
  classes.value = await SportBridge.classGroupRepository.findAll()
})

onBeforeUnmount(() => {
  if (isTracking.value) {
    if (captureIntervalId !== null) clearInterval(captureIntervalId)
    if (elapsedIntervalId !== null) clearInterval(elapsedIntervalId)
  }
  stopCamera()
})
</script>

<style scoped src="./PushupTracking.css"></style>
