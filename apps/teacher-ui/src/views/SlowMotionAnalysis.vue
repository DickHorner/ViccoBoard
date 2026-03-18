<template>
  <div class="slow-motion-view">
    <!-- ------------------------------------------------------------------ -->
    <!-- Header                                                               -->
    <!-- ------------------------------------------------------------------ -->
    <div class="page-header">
      <h2>{{ t('SLOWMO.title') }}</h2>
      <div class="header-actions">
        <button v-if="activeTab !== 'sessions'" class="btn btn-secondary" @click="goToSessions">
          📋 {{ t('SLOWMO.sessions') }}
        </button>
        <button v-if="activeTab === 'analyze' && videoLoaded" class="btn btn-primary" @click="saveSession">
          💾 {{ t('SLOWMO.save') }}
        </button>
      </div>
    </div>

    <!-- ------------------------------------------------------------------ -->
    <!-- Tab: Sessions list                                                   -->
    <!-- ------------------------------------------------------------------ -->
    <div v-if="activeTab === 'sessions'" class="sessions-panel">
      <div class="sessions-toolbar">
        <button class="btn btn-primary" @click="startNewSession">
          ➕ {{ t('SLOWMO.newSession') }}
        </button>
      </div>

      <div v-if="sessions.length === 0" class="empty-hint card">
        <p>{{ t('SLOWMO.noSessions') }}</p>
      </div>

      <ul v-else class="sessions-list">
        <li
          v-for="s in sessions"
          :key="s.id"
          class="session-card card"
          @click="loadExistingSession(s)"
        >
          <div class="session-info">
            <strong>{{ s.sessionMetadata.sessionName }}</strong>
            <span v-if="s.sessionMetadata.studentLabel" class="meta-tag">
              🧑 {{ s.sessionMetadata.studentLabel }}
            </span>
            <span v-if="s.sessionMetadata.exerciseName" class="meta-tag">
              🏃 {{ s.sessionMetadata.exerciseName }}
            </span>
          </div>
          <div class="session-meta">
            <span class="meta-date">{{ formatDate(s.startedAt) }}</span>
            <span class="meta-keyframes">
              {{ s.sessionMetadata.keyframes.length }} {{ t('SLOWMO.keyframes') }}
            </span>
          </div>
        </li>
      </ul>
    </div>

    <!-- ------------------------------------------------------------------ -->
    <!-- Tab: Session setup (new session form)                                -->
    <!-- ------------------------------------------------------------------ -->
    <div v-if="activeTab === 'setup'" class="setup-panel card">
      <h3>{{ t('SLOWMO.newSession') }}</h3>

      <div class="form-group">
        <label class="form-label">{{ t('SLOWMO.sessionName') }} *</label>
        <input
          v-model="sessionName"
          type="text"
          class="form-input"
          :placeholder="t('SLOWMO.sessionNamePlaceholder')"
        />
      </div>

      <div class="form-group">
        <label class="form-label">{{ t('SLOWMO.studentLabel') }}</label>
        <input
          v-model="studentLabel"
          type="text"
          class="form-input"
          :placeholder="t('SLOWMO.studentLabelPlaceholder')"
        />
      </div>

      <div class="form-group">
        <label class="form-label">{{ t('SLOWMO.exerciseName') }}</label>
        <input
          v-model="exerciseName"
          type="text"
          class="form-input"
          :placeholder="t('SLOWMO.exerciseNamePlaceholder')"
        />
      </div>

      <div class="form-group">
        <label class="form-label">{{ t('SLOWMO.videoFile') }}</label>
        <div class="source-actions">
          <label class="file-pick-btn btn btn-secondary">
            📁 {{ videoFileName || t('SLOWMO.chooseFile') }}
            <input
              ref="fileInputRef"
              type="file"
              accept="video/*"
              class="hidden-file-input"
              @change="onFileSelected"
            />
          </label>
          <button class="btn btn-secondary" type="button" @click="cameraPreviewActive ? stopCapturePreview() : startCapturePreview()">
            {{ cameraPreviewActive ? `🛑 ${t('SLOWMO.closeCamera')}` : `📷 ${t('SLOWMO.openCamera')}` }}
          </button>
        </div>
        <p class="field-hint">{{ t('SLOWMO.fileHint') }}</p>
      </div>

      <div v-if="cameraPreviewActive || downloadableVideoBlob || captureError" class="capture-panel card">
        <div class="capture-header">
          <strong>{{ t('SLOWMO.recordVideo') }}</strong>
          <span v-if="recordingActive" class="recording-badge">
            {{ t('SLOWMO.recording') }} {{ formatTime(recordingElapsedSec) }}
          </span>
          <span v-else-if="downloadableVideoBlob" class="meta-tag">{{ t('SLOWMO.recordingReady') }}</span>
        </div>
        <p class="field-hint">{{ captureError || t('SLOWMO.captureHint') }}</p>
        <div v-if="cameraPreviewActive" class="capture-preview">
          <video ref="captureVideoEl" class="capture-video" autoplay muted playsinline />
        </div>
        <div class="form-actions">
          <button
            v-if="cameraPreviewActive && !recordingActive"
            class="btn btn-primary"
            type="button"
            @click="startRecording"
          >
            ⏺ {{ t('SLOWMO.startRecording') }}
          </button>
          <button
            v-if="recordingActive"
            class="btn btn-danger"
            type="button"
            @click="stopRecording"
          >
            ⏹ {{ t('SLOWMO.stopRecording') }}
          </button>
          <button
            v-if="cameraPreviewActive && !recordingActive"
            class="btn btn-secondary"
            type="button"
            @click="stopCapturePreview"
          >
            {{ t('SLOWMO.closeCamera') }}
          </button>
        </div>
      </div>

      <div class="form-actions">
        <button class="btn btn-secondary" @click="goToSessions">{{ t('SLOWMO.cancel') }}</button>
        <button class="btn btn-primary" :disabled="!sessionName.trim()" @click="startAnalysis">
          {{ t('SLOWMO.startAnalysis') }}
        </button>
      </div>
    </div>

    <!-- ------------------------------------------------------------------ -->
    <!-- Tab: Main analysis view                                              -->
    <!-- ------------------------------------------------------------------ -->
    <div v-if="activeTab === 'analyze'" class="analyze-panel">
      <!-- Mode toggle -->
      <div class="mode-tabs card">
        <button
          class="mode-tab"
          :class="{ active: analysisMode === 'playback' }"
          @click="analysisMode = 'playback'"
        >
          ▶ {{ t('SLOWMO.modePlayback') }}
        </button>
        <button
          class="mode-tab"
          :class="{ active: analysisMode === 'biomechanics' }"
          @click="analysisMode = 'biomechanics'"
        >
          🦴 {{ t('SLOWMO.modeBiomechanics') }}
        </button>
      </div>

      <!-- Session meta bar -->
      <div class="session-meta-bar card">
        <span>📝 <strong>{{ sessionName }}</strong></span>
        <span v-if="studentLabel">🧑 {{ studentLabel }}</span>
        <span v-if="exerciseName">🏃 {{ exerciseName }}</span>
      </div>

      <!-- No video hint -->
      <div v-if="!videoLoaded" class="idle-hint card">
        <p>{{ t('SLOWMO.noVideoHint') }}</p>
        <div class="source-actions source-actions--centered">
          <label class="file-pick-btn btn btn-primary">
            📁 {{ t('SLOWMO.chooseFile') }}
            <input
              ref="fileInputRefInAnalyze"
              type="file"
              accept="video/*"
              class="hidden-file-input"
              @change="onFileSelected"
            />
          </label>
          <button class="btn btn-secondary" type="button" @click="cameraPreviewActive ? stopCapturePreview() : startCapturePreview()">
            {{ cameraPreviewActive ? `🛑 ${t('SLOWMO.closeCamera')}` : `📷 ${t('SLOWMO.openCamera')}` }}
          </button>
        </div>
        <div v-if="cameraPreviewActive || downloadableVideoBlob || captureError" class="capture-panel card">
          <div class="capture-header">
            <strong>{{ t('SLOWMO.recordVideo') }}</strong>
            <span v-if="recordingActive" class="recording-badge">
              {{ t('SLOWMO.recording') }} {{ formatTime(recordingElapsedSec) }}
            </span>
            <span v-else-if="downloadableVideoBlob" class="meta-tag">{{ t('SLOWMO.recordingReady') }}</span>
          </div>
          <p class="field-hint">{{ captureError || t('SLOWMO.captureHint') }}</p>
          <div v-if="cameraPreviewActive" class="capture-preview">
            <video ref="captureVideoEl" class="capture-video" autoplay muted playsinline />
          </div>
          <div class="form-actions">
            <button
              v-if="cameraPreviewActive && !recordingActive"
              class="btn btn-primary"
              type="button"
              @click="startRecording"
            >
              ⏺ {{ t('SLOWMO.startRecording') }}
            </button>
            <button
              v-if="recordingActive"
              class="btn btn-danger"
              type="button"
              @click="stopRecording"
            >
              ⏹ {{ t('SLOWMO.stopRecording') }}
            </button>
            <button
              v-if="cameraPreviewActive && !recordingActive"
              class="btn btn-secondary"
              type="button"
              @click="stopCapturePreview"
            >
              {{ t('SLOWMO.closeCamera') }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="videoLoaded" class="video-source-actions card">
        <button v-if="downloadableVideoBlob" class="btn btn-secondary" type="button" @click="downloadCurrentVideo">
          💾 {{ t('SLOWMO.keepVideoLocal') }}
        </button>
        <button class="btn btn-secondary" type="button" @click="deleteCurrentVideo">
          🗑 {{ t('SLOWMO.deleteVideo') }}
        </button>
      </div>

      <!-- Video + canvas area -->
      <div v-show="videoLoaded" class="video-area">
        <div class="canvas-container" ref="canvasContainerRef">
          <video
            ref="videoEl"
            class="analysis-video"
            playsinline
            preload="auto"
            @loadedmetadata="onVideoLoaded"
            @timeupdate="onTimeUpdate"
            @ended="onVideoEnded"
          />
          <canvas
            ref="overlayCanvas"
            class="overlay-canvas"
            :width="canvasW"
            :height="canvasH"
            @click="onCanvasClick"
            @touchend.prevent="onCanvasTouchEnd"
          />
        </div>
      </div>

      <!-- ---- PLAYBACK controls ---- -->
      <div v-if="videoLoaded" class="controls-panel card">
        <!-- Scrubber -->
        <div class="scrubber-row">
          <span class="time-label">{{ formatTime(currentTime) }}</span>
          <input
            type="range"
            class="scrubber"
            :min="0"
            :max="videoDuration"
            :step="scrubStep"
            :value="currentTime"
            @input="onScrub"
          />
          <span class="time-label">{{ formatTime(videoDuration) }}</span>
        </div>

        <!-- Frame & playback buttons -->
        <div class="btn-row">
          <button class="btn btn-icon" :title="t('SLOWMO.frameBack')" @click="stepFrame(-1)">⏮</button>
          <button class="btn btn-icon" @click="togglePlay">
            {{ isPlaying ? '⏸' : '▶' }}
          </button>
          <button class="btn btn-icon" :title="t('SLOWMO.frameForward')" @click="stepFrame(1)">⏭</button>
        </div>

        <!-- Speed selector -->
        <div class="speed-row">
          <label class="control-label">{{ t('SLOWMO.speed') }}</label>
          <div class="speed-btns">
            <button
              v-for="sp in speedOptions"
              :key="sp"
              class="speed-btn"
              :class="{ active: playbackRate === sp }"
              @click="setSpeed(sp)"
            >{{ sp }}×</button>
          </div>
        </div>
      </div>

      <!-- ---- BIOMECHANICS panel ---- -->
      <div v-if="videoLoaded && analysisMode === 'biomechanics'" class="biomechanics-panel card">
        <!-- Body-point selector -->
        <div class="bp-selector">
          <label class="control-label">{{ t('SLOWMO.bodyPoint') }}</label>
          <select v-model="selectedBodyPoint" class="form-select">
            <option v-for="bp in bodyPoints" :key="bp.value" :value="bp.value">
              {{ bp.label }}
            </option>
          </select>
          <div class="bp-legend">
            <span
              v-for="bp in bodyPoints"
              :key="bp.value"
              class="bp-dot"
              :style="{ background: bp.color }"
              :title="bp.label"
            />
          </div>
        </div>

        <!-- Keyframe management -->
        <div class="keyframe-row">
          <button class="btn btn-secondary" @click="addKeyframe">
            🔑 {{ t('SLOWMO.addKeyframe') }} @ {{ formatTime(currentTime) }}
          </button>
          <button class="btn btn-secondary" @click="clearCurrentMarkers" :disabled="currentFrameMarkers.length === 0">
            🗑 {{ t('SLOWMO.clearMarkers') }}
          </button>
        </div>

        <!-- Keyframes list -->
        <div class="keyframes-list-wrap">
          <p class="control-label">{{ t('SLOWMO.keyframeList') }}</p>
          <ul class="keyframes-list">
            <li
              v-for="kf in keyframes"
              :key="kf.id"
              class="keyframe-item"
              :class="{ active: nearKeyframe(kf) }"
              @click="jumpToKeyframe(kf)"
            >
              <span class="kf-time">{{ formatTime(kf.timeSec) }}</span>
              <span class="kf-markers">{{ kf.markers.length }} {{ t('SLOWMO.markers') }}</span>
              <button class="btn-icon-sm" :title="t('SLOWMO.deleteKeyframe')" @click.stop="deleteKeyframe(kf.id)">×</button>
            </li>
          </ul>
          <p v-if="keyframes.length === 0" class="empty-hint-sm">{{ t('SLOWMO.noKeyframes') }}</p>
        </div>

        <!-- Angle display -->
        <div v-if="calculatedAngles.length > 0" class="angles-panel">
          <p class="control-label">{{ t('SLOWMO.angles') }}</p>
          <ul class="angle-list">
            <li v-for="a in calculatedAngles" :key="a.label">
              <strong>{{ a.label }}</strong>: {{ a.deg.toFixed(1) }}°
            </li>
          </ul>
        </div>

        <!-- Reference lines -->
        <div class="reflines-row">
          <button
            class="btn btn-secondary"
            :class="{ active: drawingRefLine }"
            @click="toggleRefLineMode"
          >
            📏 {{ drawingRefLine ? t('SLOWMO.cancelRefLine') : t('SLOWMO.addRefLine') }}
          </button>
          <button v-if="referenceLines.length > 0" class="btn btn-secondary" @click="clearRefLines">
            🗑 {{ t('SLOWMO.clearRefLines') }}
          </button>
        </div>

        <!-- Notes -->
        <div class="form-group">
          <label class="control-label">{{ t('SLOWMO.notes') }}</label>
          <textarea v-model="notes" class="form-textarea" rows="3" :placeholder="t('SLOWMO.notesPlaceholder')" />
        </div>
      </div>

      <!-- Save button at bottom -->
      <div v-if="videoLoaded" class="save-row">
        <button class="btn btn-primary btn-full" @click="saveSession">
          💾 {{ t('SLOWMO.save') }}
        </button>
      </div>
    </div>

    <!-- Save confirmation -->
    <div v-if="saveMessage" class="save-toast">{{ saveMessage }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { v4 as uuidv4 } from 'uuid'
import { getSportBridge } from '../composables/useSportBridge'
import type { Sport } from '@viccoboard/core'

const { t } = useI18n()
const bridge = getSportBridge()
const route = useRoute()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type BodyPointKey = Sport.BodyPoint

interface LocalKeyframe {
  id: string
  timeSec: number
  markers: Array<{ bodyPoint: BodyPointKey; x: number; y: number; color?: string }>
}

interface ReferenceLine {
  id: string
  x1: number; y1: number
  x2: number; y2: number
  color?: string
}

interface AngleResult {
  label: string
  deg: number
}

// ---------------------------------------------------------------------------
// Body point catalogue
// ---------------------------------------------------------------------------
const bodyPoints: Array<{ value: BodyPointKey; label: string; color: string }> = [
  { value: 'head',           label: 'Kopf',             color: '#e74c3c' },
  { value: 'neck',           label: 'Nacken',            color: '#c0392b' },
  { value: 'shoulder-left',  label: 'Schulter L',        color: '#e67e22' },
  { value: 'shoulder-right', label: 'Schulter R',        color: '#d35400' },
  { value: 'elbow-left',     label: 'Ellenbogen L',      color: '#f1c40f' },
  { value: 'elbow-right',    label: 'Ellenbogen R',      color: '#f39c12' },
  { value: 'wrist-left',     label: 'Handgelenk L',      color: '#2ecc71' },
  { value: 'wrist-right',    label: 'Handgelenk R',      color: '#27ae60' },
  { value: 'hip-left',       label: 'Hüfte L',           color: '#3498db' },
  { value: 'hip-right',      label: 'Hüfte R',           color: '#2980b9' },
  { value: 'knee-left',      label: 'Knie L',            color: '#9b59b6' },
  { value: 'knee-right',     label: 'Knie R',            color: '#8e44ad' },
  { value: 'ankle-left',     label: 'Sprunggelenk L',    color: '#1abc9c' },
  { value: 'ankle-right',    label: 'Sprunggelenk R',    color: '#16a085' },
]

const bodyPointColor = (bp: BodyPointKey): string =>
  bodyPoints.find(p => p.value === bp)?.color ?? '#ffffff'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
/** Tolerance (in seconds) for treating two timestamps as the same keyframe. */
const KEYFRAME_TIME_TOLERANCE_SEC = 0.02
/** Larger tolerance for UI highlighting of the active keyframe in the list. */
const KEYFRAME_HIGHLIGHT_TOLERANCE_SEC = 0.04
/** Assumed frame rate used for frame-stepping when the video does not expose FPS. */
const DEFAULT_FPS = 30

// ---------------------------------------------------------------------------
// State – navigation
// ---------------------------------------------------------------------------
type Tab = 'sessions' | 'setup' | 'analyze'
const activeTab = ref<Tab>('sessions')
const analysisMode = ref<'playback' | 'biomechanics'>('playback')

// ---------------------------------------------------------------------------
// State – sessions list
// ---------------------------------------------------------------------------
type SessionRecord = Sport.ToolSession & { sessionMetadata: { sessionName: string; studentLabel?: string; exerciseName?: string; keyframes: LocalKeyframe[]; notes?: string; referenceLines?: ReferenceLine[] } }
const sessions = ref<SessionRecord[]>([])
const currentSessionId = ref<string | undefined>(undefined)

// ---------------------------------------------------------------------------
// State – setup form
// ---------------------------------------------------------------------------
const sessionName = ref('')
const studentLabel = ref('')
const exerciseName = ref('')
const videoFileName = ref('')
const saveMessage = ref('')
const captureVideoEl = ref<HTMLVideoElement | null>(null)
const captureError = ref('')

// ---------------------------------------------------------------------------
// State – video
// ---------------------------------------------------------------------------
const videoEl = ref<HTMLVideoElement | null>(null)
const videoLoaded = ref(false)
const videoDuration = ref(0)
const currentTime = ref(0)
const isPlaying = ref(false)
const playbackRate = ref(0.5)
const speedOptions = [0.1, 0.25, 0.5, 1.0]
const nominalFps = DEFAULT_FPS
const scrubStep = computed(() => 1 / nominalFps)
const cameraPreviewActive = ref(false)
const recordingActive = ref(false)
const recordingElapsedSec = ref(0)
const currentVideoSourceKind = ref<'upload' | 'recorded' | null>(null)
const downloadableVideoBlob = ref<Blob | null>(null)

let captureStream: MediaStream | null = null
let mediaRecorder: MediaRecorder | null = null
let recordingChunks: Blob[] = []
let recordingTimerHandle: ReturnType<typeof setInterval> | null = null
let recordingStartedAt = 0
let activeVideoUrl: string | null = null
let pendingVideoSource: { url: string; fileName: string; sourceKind: 'upload' | 'recorded'; blob: Blob | null } | null = null

// ---------------------------------------------------------------------------
// State – canvas
// ---------------------------------------------------------------------------
const canvasContainerRef = ref<HTMLDivElement | null>(null)
const overlayCanvas = ref<HTMLCanvasElement | null>(null)
const canvasW = ref(640)
const canvasH = ref(360)

// ---------------------------------------------------------------------------
// State – biomechanics
// ---------------------------------------------------------------------------
const selectedBodyPoint = ref<BodyPointKey>('knee-left')
const keyframes = ref<LocalKeyframe[]>([])
const referenceLines = ref<ReferenceLine[]>([])
const drawingRefLine = ref(false)
const refLineStart = ref<{ x: number; y: number } | null>(null)
const notes = ref('')

// ---------------------------------------------------------------------------
// Computed – current frame markers (interpolated if between keyframes)
// ---------------------------------------------------------------------------
const currentFrameMarkers = computed<Array<{ bodyPoint: BodyPointKey; x: number; y: number; color?: string }>>(() => {
  if (keyframes.value.length === 0) return []
  const t2 = currentTime.value

  // exact match
  const exact = keyframes.value.find(kf => Math.abs(kf.timeSec - t2) < KEYFRAME_TIME_TOLERANCE_SEC)
  if (exact) return exact.markers

  // interpolate between neighbours
  const sorted = [...keyframes.value].sort((a, b) => a.timeSec - b.timeSec)
  const befores = sorted.filter(kf => kf.timeSec < t2)
  const before = befores.length > 0 ? befores[befores.length - 1] : undefined
  const after = sorted.find(kf => kf.timeSec > t2)
  if (!before || !after) {
    // outside range – return nearest
    return (before ?? after)?.markers ?? []
  }

  const alpha = (t2 - before.timeSec) / (after.timeSec - before.timeSec)

  // collect all body points that appear in both keyframes
  const merged: Array<{ bodyPoint: BodyPointKey; x: number; y: number; color?: string }> = []
  for (const bm of before.markers) {
    const am = after.markers.find(m => m.bodyPoint === bm.bodyPoint)
    if (am) {
      merged.push({
        bodyPoint: bm.bodyPoint,
        x: bm.x + (am.x - bm.x) * alpha,
        y: bm.y + (am.y - bm.y) * alpha,
        color: bm.color
      })
    } else {
      merged.push({ ...bm })
    }
  }
  return merged
})

// ---------------------------------------------------------------------------
// Computed – angles (connected chains on left and right sides)
// ---------------------------------------------------------------------------
const ANGLE_CHAINS: Array<{ label: string; points: BodyPointKey[] }> = [
  { label: 'Arm L',   points: ['shoulder-left',  'elbow-left',  'wrist-left'] },
  { label: 'Arm R',   points: ['shoulder-right', 'elbow-right', 'wrist-right'] },
  { label: 'Bein L',  points: ['hip-left',       'knee-left',   'ankle-left'] },
  { label: 'Bein R',  points: ['hip-right',       'knee-right',  'ankle-right'] },
  { label: 'Rumpf L', points: ['shoulder-left',  'hip-left',    'knee-left'] },
  { label: 'Rumpf R', points: ['shoulder-right', 'hip-right',   'knee-right'] },
]

const calculatedAngles = computed<AngleResult[]>(() => {
  const markers = currentFrameMarkers.value
  const result: AngleResult[] = []

  for (const chain of ANGLE_CHAINS) {
    const pts = chain.points.map(bp => markers.find(m => m.bodyPoint === bp)).filter(Boolean) as Array<{ x: number; y: number }>
    if (pts.length < 3) continue
    const [p1, p2, p3] = pts
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y }
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y }
    const dot = v1.x * v2.x + v1.y * v2.y
    const mag = Math.sqrt(v1.x * v1.x + v1.y * v1.y) * Math.sqrt(v2.x * v2.x + v2.y * v2.y)
    if (mag < 1e-9) continue
    const deg = (Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180) / Math.PI
    result.push({ label: chain.label, deg })
  }
  return result
})

const routeClassGroupId = computed(() => {
  const value = route.query.classGroupId
  return typeof value === 'string' && value.length > 0 ? value : undefined
})

const routeLessonId = computed(() => {
  const value = route.query.lessonId
  return typeof value === 'string' && value.length > 0 ? value : undefined
})

// ---------------------------------------------------------------------------
// Canvas drawing
// ---------------------------------------------------------------------------
function drawOverlay() {
  const canvas = overlayCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const w = canvas.width
  const h = canvas.height

  // Draw reference lines
  ctx.lineWidth = 2
  for (const rl of referenceLines.value) {
    ctx.strokeStyle = rl.color ?? '#00bcd4'
    ctx.beginPath()
    ctx.moveTo(rl.x1 * w, rl.y1 * h)
    ctx.lineTo(rl.x2 * w, rl.y2 * h)
    ctx.stroke()
  }

  const markers = currentFrameMarkers.value
  if (markers.length === 0) return

  // Draw chains (lines between connected body points)
  for (const chain of ANGLE_CHAINS) {
    const pts = chain.points
      .map(bp => markers.find(m => m.bodyPoint === bp))
      .filter(Boolean) as Array<{ bodyPoint: BodyPointKey; x: number; y: number }>

    if (pts.length < 2) continue
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(pts[0].x * w, pts[0].y * h)
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x * w, pts[i].y * h)
    }
    ctx.stroke()
  }

  // Draw angle arcs
  for (const chain of ANGLE_CHAINS) {
    const pts = chain.points.map(bp => markers.find(m => m.bodyPoint === bp)).filter(Boolean) as Array<{ x: number; y: number }>
    if (pts.length < 3) continue
    const [p1, p2, p3] = pts
    const v1 = { x: (p1.x - p2.x) * w, y: (p1.y - p2.y) * h }
    const v2 = { x: (p3.x - p2.x) * w, y: (p3.y - p2.y) * h }
    const ang1 = Math.atan2(v1.y, v1.x)
    const ang2 = Math.atan2(v2.y, v2.x)
    ctx.strokeStyle = 'rgba(255, 220, 0, 0.7)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(p2.x * w, p2.y * h, 18, ang1, ang2)
    ctx.stroke()
  }

  // Draw marker circles
  for (const m of markers) {
    const cx = m.x * w
    const cy = m.y * h
    const color = m.color ?? bodyPointColor(m.bodyPoint)
    ctx.beginPath()
    ctx.arc(cx, cy, 7, 0, 2 * Math.PI)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1.5
    ctx.stroke()

    ctx.fillStyle = '#fff'
    ctx.font = 'bold 10px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(m.bodyPoint.slice(0, 2).toUpperCase(), cx, cy)
  }
}

// Redraw whenever relevant state changes
watch([currentFrameMarkers, referenceLines], () => {
  nextTick(drawOverlay)
}, { deep: true })

// ---------------------------------------------------------------------------
// Canvas interaction – place marker / ref line
// ---------------------------------------------------------------------------
function canvasCoords(event: MouseEvent | Touch): { nx: number; ny: number } {
  const canvas = overlayCanvas.value
  if (!canvas) return { nx: 0, ny: 0 }
  const rect = canvas.getBoundingClientRect()
  return {
    nx: (event.clientX - rect.left) / rect.width,
    ny: (event.clientY - rect.top) / rect.height,
  }
}

function onCanvasClick(event: MouseEvent) {
  if (analysisMode.value !== 'biomechanics') return
  handleCanvasInteraction(event)
}

function onCanvasTouchEnd(event: TouchEvent) {
  if (analysisMode.value !== 'biomechanics') return
  const touch = event.changedTouches[0]
  if (touch) handleCanvasInteraction(touch)
}

function handleCanvasInteraction(event: MouseEvent | Touch) {
  const { nx, ny } = canvasCoords(event)

  if (drawingRefLine.value) {
    if (!refLineStart.value) {
      refLineStart.value = { x: nx, y: ny }
    } else {
      referenceLines.value.push({
        id: uuidv4(),
        x1: refLineStart.value.x,
        y1: refLineStart.value.y,
        x2: nx,
        y2: ny,
        color: '#00bcd4'
      })
      refLineStart.value = null
      drawingRefLine.value = false
    }
    nextTick(drawOverlay)
    return
  }

  // Place / update marker in the active keyframe (or nearest)
  placeMarker(nx, ny)
}

function placeMarker(nx: number, ny: number) {
  const bp = selectedBodyPoint.value
  const color = bodyPointColor(bp)

  // Find or create keyframe at current time
  let kf = keyframes.value.find(k => Math.abs(k.timeSec - currentTime.value) < KEYFRAME_TIME_TOLERANCE_SEC)
  if (!kf) {
    kf = { id: uuidv4(), timeSec: currentTime.value, markers: [] }
    keyframes.value.push(kf)
    keyframes.value.sort((a, b) => a.timeSec - b.timeSec)
  }

  // Replace or add marker for this body point
  const idx = kf.markers.findIndex(m => m.bodyPoint === bp)
  if (idx >= 0) {
    kf.markers[idx] = { bodyPoint: bp, x: nx, y: ny, color }
  } else {
    kf.markers.push({ bodyPoint: bp, x: nx, y: ny, color })
  }
  nextTick(drawOverlay)
}

// ---------------------------------------------------------------------------
// Keyframe management
// ---------------------------------------------------------------------------
function addKeyframe() {
  const t2 = currentTime.value
  if (keyframes.value.some(kf => Math.abs(kf.timeSec - t2) < KEYFRAME_TIME_TOLERANCE_SEC)) return
  keyframes.value.push({ id: uuidv4(), timeSec: t2, markers: [] })
  keyframes.value.sort((a, b) => a.timeSec - b.timeSec)
}

function deleteKeyframe(id: string) {
  keyframes.value = keyframes.value.filter(kf => kf.id !== id)
  nextTick(drawOverlay)
}

function jumpToKeyframe(kf: LocalKeyframe) {
  if (!videoEl.value) return
  videoEl.value.currentTime = kf.timeSec
  currentTime.value = kf.timeSec
  nextTick(drawOverlay)
}

function nearKeyframe(kf: LocalKeyframe): boolean {
  return Math.abs(kf.timeSec - currentTime.value) < KEYFRAME_HIGHLIGHT_TOLERANCE_SEC
}

function clearCurrentMarkers() {
  const kf = keyframes.value.find(k => Math.abs(k.timeSec - currentTime.value) < KEYFRAME_TIME_TOLERANCE_SEC)
  if (kf) kf.markers = []
  nextTick(drawOverlay)
}

// ---------------------------------------------------------------------------
// Reference lines
// ---------------------------------------------------------------------------
function toggleRefLineMode() {
  drawingRefLine.value = !drawingRefLine.value
  refLineStart.value = null
}

function clearRefLines() {
  referenceLines.value = []
  nextTick(drawOverlay)
}

// ---------------------------------------------------------------------------
// Video handling
// ---------------------------------------------------------------------------
function pickRecordingMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined

  const preferredTypes = [
    'video/mp4;codecs=h264,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm'
  ]

  return preferredTypes.find(type => MediaRecorder.isTypeSupported(type))
}

function revokeActiveVideoUrl() {
  if (!activeVideoUrl) return
  URL.revokeObjectURL(activeVideoUrl)
  activeVideoUrl = null
}

function resetLoadedVideoState() {
  if (videoEl.value) {
    videoEl.value.pause()
    videoEl.value.removeAttribute('src')
    videoEl.value.load()
  }
  isPlaying.value = false
  videoLoaded.value = false
  videoDuration.value = 0
  currentTime.value = 0
}

function clearSelectedVideo() {
  pendingVideoSource = null
  revokeActiveVideoUrl()
  resetLoadedVideoState()
  videoFileName.value = ''
  downloadableVideoBlob.value = null
  currentVideoSourceKind.value = null
}

function queueVideoSource(
  url: string,
  fileName: string,
  sourceKind: 'upload' | 'recorded',
  blob: Blob | null
) {
  revokeActiveVideoUrl()
  activeVideoUrl = url
  pendingVideoSource = { url, fileName, sourceKind, blob }
  videoFileName.value = fileName
  downloadableVideoBlob.value = blob
  currentVideoSourceKind.value = sourceKind
}

function attachQueuedVideoSource() {
  if (!pendingVideoSource || !videoEl.value) return
  resetLoadedVideoState()
  videoEl.value.src = pendingVideoSource.url
  videoEl.value.load()
  pendingVideoSource = null
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  queueVideoSource(URL.createObjectURL(file), file.name, 'upload', null)
  input.value = ''

  if (activeTab.value === 'analyze') {
    nextTick(attachQueuedVideoSource)
  }
}

function onVideoLoaded() {
  if (!videoEl.value || !canvasContainerRef.value) return
  videoDuration.value = videoEl.value.duration
  videoLoaded.value = true

  // Match canvas to video intrinsic size (capped for performance)
  const vw = videoEl.value.videoWidth  || 640
  const vh = videoEl.value.videoHeight || 360
  const scale = Math.min(1, 960 / vw)
  canvasW.value = Math.round(vw * scale)
  canvasH.value = Math.round(vh * scale)

  videoEl.value.playbackRate = playbackRate.value
  nextTick(drawOverlay)
}

function onTimeUpdate() {
  if (!videoEl.value) return
  currentTime.value = videoEl.value.currentTime
  nextTick(drawOverlay)
}

function onVideoEnded() {
  isPlaying.value = false
}

function togglePlay() {
  const v = videoEl.value
  if (!v) return
  if (isPlaying.value) {
    v.pause()
    isPlaying.value = false
  } else {
    v.playbackRate = playbackRate.value
    v.play().catch(() => { /* ignore */ })
    isPlaying.value = true
  }
}

function setSpeed(sp: number) {
  playbackRate.value = sp
  if (videoEl.value) videoEl.value.playbackRate = sp
}

function stepFrame(dir: 1 | -1) {
  const v = videoEl.value
  if (!v) return
  v.pause()
  isPlaying.value = false
  const step = dir / nominalFps
  v.currentTime = Math.max(0, Math.min(videoDuration.value, v.currentTime + step))
}

function onScrub(event: Event) {
  const v = videoEl.value
  if (!v) return
  const val = parseFloat((event.target as HTMLInputElement).value)
  v.currentTime = val
  currentTime.value = val
}

async function startCapturePreview() {
  if (cameraPreviewActive.value) return

  if (!navigator.mediaDevices?.getUserMedia) {
    captureError.value = t('SLOWMO.captureUnsupported')
    return
  }

  try {
    captureError.value = ''
    captureStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    })
    cameraPreviewActive.value = true
    await nextTick()
    if (captureVideoEl.value) {
      captureVideoEl.value.srcObject = captureStream
      await captureVideoEl.value.play()
    }
  } catch (error) {
    captureError.value = error instanceof Error ? error.message : t('SLOWMO.captureFailed')
    stopCapturePreview()
  }
}

function stopCapturePreview() {
  if (recordingActive.value) {
    stopRecording()
  }

  captureStream?.getTracks().forEach(track => track.stop())
  captureStream = null
  if (captureVideoEl.value) {
    captureVideoEl.value.srcObject = null
  }
  cameraPreviewActive.value = false
}

function startRecordingTimer() {
  recordingStartedAt = Date.now()
  recordingElapsedSec.value = 0
  if (recordingTimerHandle) clearInterval(recordingTimerHandle)
  recordingTimerHandle = setInterval(() => {
    recordingElapsedSec.value = (Date.now() - recordingStartedAt) / 1000
  }, 100)
}

function stopRecordingTimer() {
  if (recordingTimerHandle) {
    clearInterval(recordingTimerHandle)
    recordingTimerHandle = null
  }
}

async function startRecording() {
  if (recordingActive.value) return
  if (!cameraPreviewActive.value || !captureStream) {
    await startCapturePreview()
  }
  if (!captureStream) return
  if (typeof MediaRecorder === 'undefined') {
    captureError.value = t('SLOWMO.captureUnsupported')
    return
  }

  const mimeType = pickRecordingMimeType()

  try {
    recordingChunks = []
    mediaRecorder = mimeType
      ? new MediaRecorder(captureStream, { mimeType })
      : new MediaRecorder(captureStream)
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordingChunks.push(event.data)
      }
    }
    mediaRecorder.onstop = () => {
      stopRecordingTimer()
      recordingActive.value = false
      const finalMimeType = mediaRecorder?.mimeType || mimeType || 'video/webm'
      const blob = new Blob(recordingChunks, { type: finalMimeType })
      const extension = finalMimeType.includes('mp4') ? 'mp4' : 'webm'
      const baseName = (sessionName.value.trim() || studentLabel.value.trim() || exerciseName.value.trim() || 'slowmo-aufnahme')
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'slowmo-aufnahme'
      const fileName = `${baseName}.${extension}`
      queueVideoSource(URL.createObjectURL(blob), fileName, 'recorded', blob)
      if (activeTab.value === 'analyze') {
        nextTick(attachQueuedVideoSource)
      }
    }
    mediaRecorder.start()
    recordingActive.value = true
    startRecordingTimer()
  } catch (error) {
    captureError.value = error instanceof Error ? error.message : t('SLOWMO.captureFailed')
  }
}

function stopRecording() {
  if (!recordingActive.value || !mediaRecorder) return
  mediaRecorder.stop()
}

function downloadCurrentVideo() {
  if (!downloadableVideoBlob.value) return
  const downloadUrl = URL.createObjectURL(downloadableVideoBlob.value)
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = videoFileName.value || 'slowmo-aufnahme.webm'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
}

function deleteCurrentVideo() {
  clearSelectedVideo()
  showSaveMessage(t('SLOWMO.videoDeleted'))
}

// ---------------------------------------------------------------------------
// Session persistence
// ---------------------------------------------------------------------------
async function loadSessions() {
  try {
    const raw = await bridge.toolSessionRepository.findByToolType('slow-motion')
    sessions.value = raw as unknown as SessionRecord[]
  } catch {
    sessions.value = []
  }
}

async function saveSession() {
  try {
    await bridge.saveSlowMotionSessionUseCase.execute({
      sessionId: currentSessionId.value,
      classGroupId: routeClassGroupId.value,
      lessonId: routeLessonId.value,
      sessionName: sessionName.value,
      studentLabel: studentLabel.value || undefined,
      exerciseName: exerciseName.value || undefined,
      videoDurationSec: videoDuration.value || undefined,
      keyframes: keyframes.value,
      notes: notes.value || undefined,
      referenceLines: referenceLines.value
    })
    showSaveMessage(t('SLOWMO.saved'))
    if (!currentSessionId.value) {
      // After first save we get an ID via reload
      await loadSessions()
      const found = sessions.value.find(s => s.sessionMetadata.sessionName === sessionName.value)
      if (found) currentSessionId.value = found.id
    }
  } catch (err) {
    showSaveMessage(`❌ ${err instanceof Error ? err.message : String(err)}`)
  }
}

function loadExistingSession(s: SessionRecord) {
  stopCapturePreview()
  clearSelectedVideo()
  currentSessionId.value = s.id
  sessionName.value = s.sessionMetadata.sessionName
  studentLabel.value = s.sessionMetadata.studentLabel ?? ''
  exerciseName.value = s.sessionMetadata.exerciseName ?? ''
  keyframes.value = (s.sessionMetadata.keyframes ?? []).map(kf => ({ ...kf, markers: [...kf.markers] }))
  referenceLines.value = s.sessionMetadata.referenceLines ?? []
  notes.value = s.sessionMetadata.notes ?? ''
  videoDuration.value = s.sessionMetadata.videoDurationSec ?? 0
  videoLoaded.value = false  // Only analysis metadata is stored; the video file must be re-selected by the user
  activeTab.value = 'analyze'
}

// ---------------------------------------------------------------------------
// Navigation helpers
// ---------------------------------------------------------------------------
function goToSessions() {
  stopCapturePreview()
  activeTab.value = 'sessions'
  loadSessions()
}

function startNewSession() {
  stopCapturePreview()
  clearSelectedVideo()
  currentSessionId.value = undefined
  sessionName.value = ''
  studentLabel.value = ''
  exerciseName.value = ''
  keyframes.value = []
  referenceLines.value = []
  notes.value = ''
  captureError.value = ''
  recordingElapsedSec.value = 0
  activeTab.value = 'setup'
}

function startAnalysis() {
  if (!sessionName.value.trim()) return
  activeTab.value = 'analyze'
  analysisMode.value = 'playback'
  nextTick(attachQueuedVideoSource)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatTime(sec: number): string {
  if (!isFinite(sec) || isNaN(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  const ms = Math.floor((sec % 1) * 100)
  return `${m}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`
}

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

let saveTimer: ReturnType<typeof setTimeout> | null = null
function showSaveMessage(msg: string) {
  saveMessage.value = msg
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => { saveMessage.value = '' }, 2500)
}

onUnmounted(() => {
  if (saveTimer) clearTimeout(saveTimer)
  stopCapturePreview()
  stopRecordingTimer()
  revokeActiveVideoUrl()
})

// Load sessions on mount
loadSessions()
</script>

<style scoped src="./SlowMotionAnalysis.css"></style>
