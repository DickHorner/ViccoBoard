<template>
  <div class="finish-camera-view">
    <div class="page-header">
      <h2>{{ t('FINISH_CAMERA.title') }}</h2>
      <p class="page-description">{{ t('FINISH_CAMERA.description') }}</p>
    </div>

    <div v-if="cameraError" class="error-banner card">
      ⚠️ {{ cameraError }}
    </div>

    <div class="card setup-card">
      <div class="form-row">
        <div class="form-group">
          <label>{{ t('KLASSEN.klasse') }}</label>
          <select v-model="selectedClassId" class="form-input" @change="loadStudents">
            <option value="">{{ t('FINISH_CAMERA.select-class') }}</option>
            <option v-for="cls in classes" :key="cls.id" :value="cls.id">
              {{ cls.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ t('FINISH_CAMERA.detection-threshold') }}</label>
          <input
            v-model.number="detectionThreshold"
            type="range"
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

    <div class="camera-section">
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
          <video ref="liveVideo" autoplay muted playsinline class="hidden-video" />
          <canvas
            ref="displayCanvas"
            class="display-canvas"
            :width="canvasW"
            :height="canvasH"
            @click="setFinishLineByClick"
            @touchstart.prevent="setFinishLineByTouch"
          />
          <div v-if="cameraActive && !finishLineSet" class="canvas-hint">
            {{ t('FINISH_CAMERA.set-line-hint') }}
          </div>
        </div>

        <div v-if="cameraActive" class="finish-line-info">
          <span v-if="finishLineSet">
            🏁 {{ t('FINISH_CAMERA.line-at') }} y={{ finishLineY }}px
            <button class="btn-icon btn-small" :title="t('FINISH_CAMERA.reset-line')" @click="resetFinishLine">✕</button>
          </span>
          <span v-else class="muted">{{ t('FINISH_CAMERA.no-line') }}</span>
        </div>
      </div>

      <div class="card stopwatch-panel">
        <h3>⏱ {{ t('FINISH_CAMERA.stopwatch') }}</h3>
        <div class="stopwatch-display" :class="{ running: sessionActive }">
          {{ formattedElapsed }}
        </div>
        <div class="stopwatch-controls">
          <button class="btn btn-primary" :disabled="sessionActive || !finishLineSet" @click="startSession">
            ▶ {{ t('FINISH_CAMERA.start') }}
          </button>
          <button class="btn btn-warning" :disabled="!sessionActive" @click="pauseSession">
            ⏸ {{ t('FINISH_CAMERA.pause') }}
          </button>
          <button class="btn btn-secondary" :disabled="sessionActive" @click="resetSession">
            🔄 {{ t('FINISH_CAMERA.reset') }}
          </button>
          <button class="btn btn-icon" :title="t('FINISH_CAMERA.manual-event')" :disabled="!sessionActive" @click="addManualEvent">
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

          <div class="event-assignment">
            <select
              v-model="event.studentId"
              class="form-input form-input-small"
              @change="onAssignStudent(event)"
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

          <button class="btn-icon btn-danger btn-small" :title="t('COMMON.delete')" @click="deleteEvent(event.id)">
            🗑
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="sessionActive || totalElapsedMs > 0" class="card empty-state">
      {{ t('FINISH_CAMERA.no-events-yet') }}
    </div>

    <div v-if="events.length > 0 && selectedClassId" class="card save-card">
      <div class="card-header">
        <h3>💾 {{ t('FINISH_CAMERA.save-section') }}</h3>
      </div>
      <div class="save-actions">
        <button class="btn btn-success" :disabled="saving" @click="saveSession">
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

    <div v-if="toast.show" class="toast" :class="toast.type">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { useFinishCameraView } from '../composables/useFinishCameraView'

const { t } = useI18n()

const {
  addManualEvent,
  cameraActive,
  cameraError,
  canvasH,
  canvasW,
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
} = useFinishCameraView()

void displayCanvas
void liveVideo
</script>

<style scoped src="./FinishCamera.css"></style>
