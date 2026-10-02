<template>
  <div class="jump-rope-view">
    <div class="page-header">
      <button class="back-button" type="button" @click="$router.back()">← {{ t('COMMON.back') }}</button>
      <h2>{{ t('TRACKING.jump-rope.title') }}</h2>
    </div>

    <section v-if="!isTracking && !sessionSaved" class="card config-card">
      <h3>
        {{ t('TRACKING.jump-rope.fps-label').replace(':', '') }}
        &amp;
        {{ t('TRACKING.jump-rope.persons-label').replace(':', '') }}
      </h3>

      <div class="form-row">
        <div class="form-group">
          <label for="jrt-fps">{{ t('TRACKING.jump-rope.fps-label') }}</label>
          <select id="jrt-fps" v-model.number="configFps" class="form-input">
            <option :value="15">15</option>
            <option :value="30">30</option>
          </select>
        </div>

        <div class="form-group">
          <label for="jrt-persons">{{ t('TRACKING.jump-rope.persons-label') }}</label>
          <select id="jrt-persons" v-model.number="configMaxPersons" class="form-input">
            <option :value="1">1</option>
            <option :value="2">2</option>
            <option :value="3">3</option>
            <option :value="4">4</option>
          </select>
        </div>

        <div class="form-group">
          <label for="jrt-class">{{ t('DICE.class') }}</label>
          <select id="jrt-class" v-model="selectedClassId" class="form-input">
            <option value="">—</option>
            <option v-for="cls in classes" :key="cls.id" :value="cls.id">
              {{ cls.name }} ({{ cls.schoolYear }})
            </option>
          </select>
        </div>
      </div>
    </section>

    <div v-if="cameraError" class="error-banner card">
      <strong>{{ t('TRACKING.jump-rope.error-title') }}:</strong> {{ cameraError }}
      <button class="btn-retry" type="button" @click="initCamera">
        {{ t('TRACKING.jump-rope.retry') }}
      </button>
    </div>

    <div v-if="!cameraActive && !cameraError" class="idle-hint card">
      <p>{{ t('TRACKING.jump-rope.status.ready') }}</p>
    </div>

    <div v-show="cameraActive" class="tracking-layout">
      <div ref="videoWrapper" class="video-wrapper card">
        <video
          ref="videoEl"
          class="camera-feed"
          autoplay
          muted
          playsinline
        />

        <canvas
          ref="analysisCanvas"
          class="hidden-canvas"
          :width="captureW"
          :height="captureH"
        />

        <div class="person-zones">
          <div
            v-for="(person, i) in persons"
            :key="i"
            class="person-zone"
            :class="{ 'person-zone--editing': editingRegionIndex === i }"
            :style="regionStyle(displayRegion(i))"
          >
            <span class="person-label">P{{ i + 1 }}</span>
            <span class="person-count">{{ person.count }}</span>
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
          <strong>{{ t('TRACKING.jump-rope.regions.title') }}</strong>
          <button class="btn-secondary region-reset" type="button" @click="resetPersonRegions">
            {{ t('TRACKING.jump-rope.regions.reset') }}
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

        <p class="region-hint">{{ t('TRACKING.jump-rope.regions.hint') }}</p>
      </div>

      <div class="stats-bar card">
        <div class="stat-item">
          <span class="stat-label">{{ t('TRACKING.jump-rope.stats.total-reps') }}</span>
          <span class="stat-value">{{ totalReps }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">{{ t('TRACKING.jump-rope.stats.average') }}</span>
          <span class="stat-value">{{ average.toFixed(1) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">{{ t('TRACKING.jump-rope.stats.fps') }}</span>
          <span class="stat-value">{{ measuredFps.toFixed(0) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">⏱</span>
          <span class="stat-value">{{ formatDuration(elapsedSeconds) }}</span>
        </div>
      </div>
    </div>

    <div class="controls-card card">
      <button
        v-if="!cameraActive"
        class="btn-primary"
        type="button"
        @click="initCamera"
      >
        📷 {{ t('TRACKING.jump-rope.controls.start-camera') }}
      </button>

      <template v-else>
        <button
          v-if="!isTracking"
          class="btn-primary"
          type="button"
          @click="startTracking"
        >
          ▶ {{ t('TRACKING.jump-rope.controls.start') }}
        </button>

        <button
          v-else
          class="btn-danger"
          type="button"
          @click="stopTracking"
        >
          ⏹ {{ t('TRACKING.jump-rope.controls.stop') }}
        </button>

        <button
          class="btn-secondary"
          type="button"
          :disabled="isTracking"
          @click="resetAll"
        >
          🔄 {{ t('TRACKING.jump-rope.controls.reset') }}
        </button>
      </template>
    </div>

    <div v-if="sessionSaved" class="success-banner card">
      ✅ {{ t('TRACKING.jump-rope.session-saved') }}
    </div>

    <div v-if="saveError" class="warning-banner card">
      ⚠️ {{ t('TRACKING.jump-rope.session-save-error') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { JumpRopeRepetitionCounter } from '@viccoboard/sport'
import type { ClassGroup } from '@viccoboard/core'
import { getSportBridge } from '../composables/useSportBridge'

interface PersonState {
  count: number
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

const { t } = useI18n()
const route = useRoute()
const SportBridge = getSportBridge()

const configFps = ref<15 | 30>(30)
const configMaxPersons = ref(2)
const selectedClassId = ref(readQueryValue(route.query.classGroupId))
const classes = ref<ClassGroup[]>([])

const videoEl = ref<HTMLVideoElement | null>(null)
const videoWrapper = ref<HTMLDivElement | null>(null)
const analysisCanvas = ref<HTMLCanvasElement | null>(null)
const cameraActive = ref(false)
const cameraError = ref<string | null>(null)

const captureW = 320
const captureH = 240

let analysisCtx: CanvasRenderingContext2D | null = null
let stream: MediaStream | null = null
let cameraRequestId = 0

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

let counter: JumpRopeRepetitionCounter | null = null
let captureIntervalId: ReturnType<typeof setInterval> | null = null
let elapsedIntervalId: ReturnType<typeof setInterval> | null = null
let sessionStartedAt: Date | null = null
let prevFrameData: Array<ImageData | null> = []
let frameCount = 0
let fpsWindowStart = 0

const totalReps = computed(() => persons.value.reduce((sum, person) => sum + person.count, 0))
const average = computed(() =>
  configMaxPersons.value > 0 ? totalReps.value / configMaxPersons.value : 0
)

async function initCamera() {
  cameraError.value = null
  const requestId = ++cameraRequestId

  try {
    const requestedStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: captureW * 2 },
        height: { ideal: captureH * 2 },
      },
      audio: false,
    })

    if (requestId !== cameraRequestId) {
      requestedStream.getTracks().forEach(track => track.stop())
      return
    }

    stream = requestedStream

    if (videoEl.value) {
      videoEl.value.srcObject = requestedStream
      await videoEl.value.play()
    }

    if (requestId !== cameraRequestId) {
      return
    }

    if (analysisCanvas.value) {
      analysisCtx = analysisCanvas.value.getContext('2d', { willReadFrequently: true })
    }

    cameraActive.value = true
  } catch (error) {
    if (requestId !== cameraRequestId) return

    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      cameraError.value = t('TRACKING.jump-rope.noCameraPermission')
    } else if (error instanceof DOMException && error.name === 'NotFoundError') {
      cameraError.value = t('TRACKING.jump-rope.cameraNotFound')
    } else {
      cameraError.value = error instanceof Error ? error.message : String(error)
    }
  }
}

function stopCamera() {
  cameraRequestId += 1
  stream?.getTracks().forEach(track => track.stop())
  stream = null

  if (videoEl.value) {
    videoEl.value.srcObject = null
  }

  analysisCtx = null
  cameraActive.value = false
}

function initPersons() {
  persons.value = Array.from({ length: configMaxPersons.value }, () => ({ count: 0 }))
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
  if (regionOrigin) {
    draftRegion.value = { x: regionOrigin.x, y: regionOrigin.y, w: 0, h: 0 }
  }
}

function onRegionMove(event: MouseEvent) {
  if (editingRegionIndex.value === null || !regionOrigin) return

  const point = getRegionPoint(event)
  if (point) {
    draftRegion.value = buildRegion(regionOrigin, point)
  }
}

function onTouchRegionStart(event: TouchEvent) {
  const touch = event.touches[0]
  if (!touch || editingRegionIndex.value === null) return

  regionOrigin = getRegionPoint(touch)
  if (regionOrigin) {
    draftRegion.value = { x: regionOrigin.x, y: regionOrigin.y, w: 0, h: 0 }
  }
}

function onTouchRegionMove(event: TouchEvent) {
  const touch = event.touches[0]
  if (!touch || editingRegionIndex.value === null || !regionOrigin) return

  const point = getRegionPoint(touch)
  if (point) {
    draftRegion.value = buildRegion(regionOrigin, point)
  }
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

  counter = new JumpRopeRepetitionCounter(configMaxPersons.value)
  sessionStartedAt = new Date()
  elapsedSeconds.value = 0
  frameCount = 0
  fpsWindowStart = Date.now()
  isTracking.value = true

  const intervalMs = Math.round(1000 / configFps.value)

  elapsedIntervalId = setInterval(() => {
    elapsedSeconds.value += 1
  }, 1000)

  captureIntervalId = setInterval(captureAndAnalyse, intervalMs)
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
  counter?.reset()
  elapsedSeconds.value = 0
  measuredFps.value = 0
}

async function saveSession() {
  if (!counter || !sessionStartedAt) return

  try {
    await SportBridge.toolSessionRepository.create({
      toolType: 'jump-rope-tracking',
      classGroupId: selectedClassId.value || undefined,
      lessonId: readQueryValue(route.query.lessonId) || undefined,
      sessionMetadata: {
        fps: configFps.value,
        maxPersons: configMaxPersons.value,
        durationSeconds: elapsedSeconds.value,
        persons: persons.value.map((person, index) => ({
          personId: index,
          count: person.count,
        })),
        totalReps: totalReps.value,
        personRegions: personRegions.value.map(region => ({ ...region })),
      },
      startedAt: sessionStartedAt,
      endedAt: new Date(),
    })

    sessionSaved.value = true
  } catch {
    saveError.value = true
  }
}

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

  frameCount += 1
  const now = Date.now()
  const elapsed = now - fpsWindowStart

  if (elapsed >= 1000) {
    measuredFps.value = (frameCount * 1000) / elapsed
    frameCount = 0
    fpsWindowStart = now
  }

  for (let personIndex = 0; personIndex < configMaxPersons.value; personIndex += 1) {
    const region = personRegions.value[personIndex]
    if (!region) continue

    const x = Math.max(0, Math.min(captureW - 1, Math.floor(region.x * captureW)))
    const y = Math.max(0, Math.min(captureH - 1, Math.floor(region.y * captureH)))
    const right = Math.max(x + 1, Math.min(captureW, Math.ceil((region.x + region.w) * captureW)))
    const bottom = Math.max(y + 1, Math.min(captureH, Math.ceil((region.y + region.h) * captureH)))
    const regionW = right - x
    const regionH = bottom - y
    const currentFrame = analysisCtx.getImageData(x, y, regionW, regionH)
    const previousFrame = prevFrameData[personIndex]

    if (previousFrame) {
      const height = estimateNormalizedJumpHeight(currentFrame, previousFrame, regionH)
      if (height !== null) {
        counter.processFrame(personIndex, height, now)
        persons.value[personIndex].count = counter.getCount(personIndex)
      }
    }

    prevFrameData[personIndex] = currentFrame
  }
}

function estimateNormalizedJumpHeight(
  current: ImageData,
  previous: ImageData,
  frameHeight: number
): number | null {
  const MOTION_THRESHOLD = 20
  const MIN_MOTION_PIXELS = 18
  const MAX_RGB_VALUE = 255
  const horizontalInset = Math.floor(current.width * 0.2)
  const endX = Math.max(horizontalInset + 1, current.width - horizontalInset)

  let totalWeight = 0
  let weightedY = 0

  for (let y = 0; y < current.height; y += 1) {
    for (let x = horizontalInset; x < endX; x += 1) {
      const index = (y * current.width + x) * 4
      const dr = Math.abs(current.data[index] - previous.data[index])
      const dg = Math.abs(current.data[index + 1] - previous.data[index + 1])
      const db = Math.abs(current.data[index + 2] - previous.data[index + 2])
      const motion = (dr + dg + db) / 3

      if (motion < MOTION_THRESHOLD) continue

      totalWeight += motion
      weightedY += motion * y
    }
  }

  if (totalWeight / MAX_RGB_VALUE < MIN_MOTION_PIXELS) {
    return null
  }

  const centroidY = weightedY / totalWeight
  return 1 - centroidY / Math.max(1, frameHeight - 1)
}

function readQueryValue(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  return ''
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

watch(configMaxPersons, () => {
  if (isTracking.value) return

  initPersons()
  resetPersonRegions()
})

onMounted(async () => {
  initPersons()
  resetPersonRegions()
  classes.value = await SportBridge.classGroupRepository.findAll()
})

onBeforeUnmount(() => {
  if (captureIntervalId !== null) clearInterval(captureIntervalId)
  if (elapsedIntervalId !== null) clearInterval(elapsedIntervalId)
  stopCamera()
})
</script>

<style scoped src="./JumpRopeTracking.css"></style>
