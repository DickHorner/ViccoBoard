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

    <div v-show="cameraActive" class="video-layout">
      <div class="video-panel card">
        <h3 class="panel-title">
          🎞 {{ t('DELAY.delayedView') }}
          <span class="delay-badge">{{ delaySeconds }}s</span>
        </h3>
        <div class="canvas-container">
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

      <div class="video-panel card">
        <h3 class="panel-title">🔴 {{ t('DELAY.liveView') }}</h3>
        <div class="canvas-container">
          <video ref="liveVideo" class="live-video" autoplay muted playsinline />
        </div>
      </div>
    </div>

    <div class="controls-panel card">
      <div class="control-group">
        <label class="control-label">
          {{ t('DELAY.delay') }}: <strong>{{ delaySeconds }} {{ t('DELAY.seconds') }}</strong>
        </label>
        <input
          v-model.number="delaySeconds"
          type="range"
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
        <div class="control-group">
          <label class="control-label">{{ t('DELAY.fps') }}</label>
          <select v-model.number="selectedFps" class="form-select" :disabled="cameraActive">
            <option :value="15">15</option>
            <option :value="24">24</option>
            <option :value="30">30</option>
          </select>
        </div>

        <div class="control-group">
          <label class="control-label">{{ t('DELAY.resolution') }}</label>
          <select v-model="selectedResolution" class="form-select" :disabled="cameraActive">
            <option value="sd">SD (640×360)</option>
            <option value="hd">HD (1280×720)</option>
          </select>
        </div>
      </div>

      <div v-if="cameraActive" class="control-group">
        <label class="control-label">{{ t('DELAY.annotate') }}</label>
        <div class="tool-row">
          <button
            v-for="tool in annotTools"
            :key="tool.type"
            :class="['tool-btn', { active: activeTool === tool.type }]"
            :title="t(tool.labelKey)"
            @click="activeTool = tool.type"
          >
            <span>{{ tool.icon }}</span>
            <span class="tool-label">{{ t(tool.labelKey) }}</span>
          </button>

          <button class="tool-btn clear-btn" :title="t('DELAY.clearAnnotations')" @click="clearAnnotations">
            <span>🗑</span>
            <span class="tool-label">{{ t('DELAY.clearAnnotations') }}</span>
          </button>
        </div>
      </div>

      <div v-if="cameraActive" class="control-group">
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
import { useI18n } from 'vue-i18n'

import { useVideoDelayView } from '../composables/useVideoDelayView'

const { t } = useI18n()

const {
  activeColor,
  activeTool,
  annotCanvas,
  annotColors,
  annotToolCursor,
  annotTools,
  cameraActive,
  cameraError,
  captureH,
  captureW,
  clearAnnotations,
  delayCanvas,
  delaySeconds,
  liveVideo,
  onDrawEnd,
  onDrawMove,
  onDrawStart,
  onTouchDrawMove,
  onTouchDrawStart,
  selectedFps,
  selectedResolution,
  startCamera,
  stopCamera
} = useVideoDelayView()

void annotCanvas
void delayCanvas
void liveVideo
</script>

<style scoped src="./VideoDelay.css"></style>
