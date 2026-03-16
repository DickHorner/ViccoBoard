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

    <div v-show="cameraActive" class="video-wrapper card">
      <div class="canvas-container">
        <video ref="liveVideo" class="live-video-hidden" autoplay muted playsinline />
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

    <div v-if="cameraActive" class="controls-panel card">
      <div class="control-group">
        <label class="control-label">
          {{ t('TRACKING.basketball.sensitivity-label') }}
          <span class="sensitivity-level">{{ sensitivityLabel }}</span>
        </label>
        <input v-model.number="sensitivity" type="range" min="1" max="10" step="1" class="delay-slider" />
        <div class="slider-marks">
          <span>{{ t('TRACKING.basketball.sensitivity-low') }}</span>
          <span>{{ t('TRACKING.basketball.sensitivity-high') }}</span>
        </div>
      </div>

      <div class="action-buttons">
        <button
          v-if="!trackingActive"
          class="btn btn-primary btn-large"
          :disabled="!targetZone"
          :title="!targetZone ? t('TRACKING.basketball.no-zone-warning') : undefined"
          @click="startTracking"
        >
          ▶ {{ t('TRACKING.basketball.controls.start') }}
        </button>
        <button v-else class="btn btn-danger btn-large" @click="stopTracking">
          ⏹ {{ t('TRACKING.basketball.controls.stop') }}
        </button>
        <button class="btn btn-secondary btn-large" :disabled="trackingActive" @click="resetSession">
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
import { useI18n } from 'vue-i18n'

import { useTrackingBasketballView } from '../composables/useTrackingBasketballView'

const { t } = useI18n()

const {
  cameraActive,
  cameraError,
  captureH,
  captureW,
  clearZone,
  formattedTime,
  liveVideo,
  mainCanvas,
  onTouchZoneMove,
  onTouchZoneStart,
  onZoneEnd,
  onZoneMove,
  onZoneStart,
  resetSession,
  retryCamera,
  sensitivity,
  sensitivityLabel,
  sessionSaved,
  shotCount,
  startCamera,
  startTracking,
  statusClass,
  statusText,
  stopCamera,
  stopTracking,
  targetZone,
  trackingActive
} = useTrackingBasketballView()

void liveVideo
void mainCanvas
</script>

<style scoped src="./TrackingBasketball.css"></style>
