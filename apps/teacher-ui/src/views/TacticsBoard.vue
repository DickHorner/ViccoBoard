<template>
  <div class="tactics-view sport-ui">
    <div class="page-header">
      <h2>{{ t('TACTICS.title') }}</h2>
    </div>

    <div class="board-layout">
      <aside class="toolbar card app-card">
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
          <label class="form-label" for="tactics-background">{{ t('TACTICS.background') }}</label>
          <Select inputId="tactics-background" v-model="background" :options="backgroundOptions"
            optionLabel="label" optionValue="value" fluid />
        </div>

        <hr />

        <Button severity="secondary" outlined class="btn clear-btn" @click="clearBoard">
          {{ t('TACTICS.clearBoard') }}
        </Button>
      </aside>

      <div class="canvas-wrapper card app-card">
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

      <aside class="snapshot-panel card app-card">
        <h3>{{ t('TACTICS.newSnapshot') }}</h3>
        <InputText v-model="snapshotTitle" :placeholder="t('TACTICS.snapshotTitlePlaceholder')" maxlength="80" fluid />
        <InputText v-model="snapshotSport" :placeholder="t('TACTICS.sport')" maxlength="40" fluid />
        <Button class="btn" :disabled="saving" @click="saveSnapshot">
          {{ saving ? '…' : t('TACTICS.save') }}
        </Button>
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
              <Button severity="secondary" outlined class="btn btn-sm" @click="reopenSnapshot(snap)">{{ t('TACTICS.reopen') }}</Button>
              <Button severity="danger" class="btn btn-sm" @click="deleteSnapshot(snap.id)">{{ t('TACTICS.delete') }}</Button>
            </div>
          </li>
        </ul>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from 'openvue/button'
import InputText from 'openvue/inputtext'
import Select from 'openvue/select'
import { computed } from 'vue'
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

const backgroundOptions = computed(() => [
  { label: t('TACTICS.backgroundField'), value: 'field' },
  { label: t('TACTICS.backgroundCourt'), value: 'court' },
  { label: t('TACTICS.backgroundPitch'), value: 'pitch' },
  { label: t('TACTICS.backgroundCustom'), value: 'custom' }
])

void boardCanvas
</script>

<style scoped src="./TacticsBoard.css"></style>
