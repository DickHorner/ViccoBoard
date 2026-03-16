<template>
  <div class="tactics-view">
    <div class="page-header">
      <h2>{{ t('TACTICS.title') }}</h2>
    </div>

    <div class="board-layout">
      <aside class="toolbar card">
        <h3>{{ t('TACTICS.tools') }}</h3>

        <div class="tool-group">
          <button
            v-for="tool in tools"
            :key="tool.type"
            :class="['tool-btn', { active: activeTool === tool.type }]"
            :title="t(tool.labelKey)"
            @click="activeTool = tool.type"
          >
            <span class="tool-icon">{{ tool.icon }}</span>
            <span class="tool-label">{{ t(tool.labelKey) }}</span>
          </button>
        </div>

        <hr />

        <div class="color-group">
          <label class="form-label">{{ t('TACTICS.teamRed') }}</label>
          <button :class="['color-btn red', { active: activeColor === 'red' }]" @click="activeColor = 'red'">●</button>
          <label class="form-label">{{ t('TACTICS.teamBlue') }}</label>
          <button :class="['color-btn blue', { active: activeColor === 'blue' }]" @click="activeColor = 'blue'">●</button>
        </div>

        <hr />

        <div class="field-group">
          <label class="form-label">{{ t('TACTICS.background') }}</label>
          <select v-model="background" class="form-select">
            <option value="field">{{ t('TACTICS.backgroundField') }}</option>
            <option value="court">{{ t('TACTICS.backgroundCourt') }}</option>
            <option value="pitch">{{ t('TACTICS.backgroundPitch') }}</option>
            <option value="custom">{{ t('TACTICS.backgroundCustom') }}</option>
          </select>
        </div>

        <hr />

        <button class="btn btn-secondary clear-btn" @click="clearBoard">
          {{ t('TACTICS.clearBoard') }}
        </button>
      </aside>

      <div class="canvas-wrapper card">
        <canvas
          ref="boardCanvas"
          class="board-canvas"
          :width="CANVAS_W"
          :height="CANVAS_H"
          @mousedown="onPointerDown"
          @mousemove="onPointerMove"
          @mouseup="onPointerUp"
          @mouseleave="onPointerUp"
          @touchstart.prevent="onTouchStart"
          @touchmove.prevent="onTouchMove"
          @touchend.prevent="onPointerUp"
        ></canvas>
      </div>

      <aside class="snapshot-panel card">
        <h3>{{ t('TACTICS.newSnapshot') }}</h3>
        <input v-model="snapshotTitle" class="form-input" :placeholder="t('TACTICS.snapshotTitlePlaceholder')" maxlength="80" />
        <input v-model="snapshotSport" class="form-input" :placeholder="t('TACTICS.sport')" maxlength="40" />
        <button class="btn btn-primary" :disabled="saving" @click="saveSnapshot">
          {{ saving ? '…' : t('TACTICS.save') }}
        </button>
        <p v-if="saveMessage" class="save-message">{{ saveMessage }}</p>

        <hr />

        <h3>{{ t('TACTICS.snapshots') }}</h3>
        <p v-if="snapshots.length === 0" class="empty-note">{{ t('TACTICS.noSnapshots') }}</p>
        <ul v-else class="snapshot-list">
          <li v-for="snap in snapshots" :key="snap.id" class="snapshot-item">
            <div class="snap-info">
              <strong>{{ snap.title }}</strong>
              <span class="snap-meta">{{ formatDate(snap.createdAt) }}</span>
            </div>
            <div class="snap-actions">
              <button class="btn btn-sm btn-secondary" @click="reopenSnapshot(snap)">{{ t('TACTICS.reopen') }}</button>
              <button class="btn btn-sm btn-danger" @click="deleteSnapshot(snap.id)">{{ t('TACTICS.delete') }}</button>
            </div>
          </li>
        </ul>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTacticsBoardView } from '../composables/useTacticsBoardView'

const {
  activeColor,
  activeTool,
  background,
  boardCanvas,
  CANVAS_H,
  CANVAS_W,
  clearBoard,
  deleteSnapshot,
  formatDate,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onTouchMove,
  onTouchStart,
  reopenSnapshot,
  saveMessage,
  saveSnapshot,
  saving,
  snapshotSport,
  snapshots,
  snapshotTitle,
  tools,
  t
} = useTacticsBoardView()

void boardCanvas
</script>

<style scoped src="./TacticsBoard.css"></style>
