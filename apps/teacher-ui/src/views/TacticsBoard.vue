<template>
  <div class="tactics-view">
    <div class="page-header">
      <h2>{{ t('TACTICS.title') }}</h2>
    </div>

    <div class="board-layout">
      <!-- Toolbar -->
      <aside class="toolbar card">
        <h3>{{ t('TACTICS.tools') }}</h3>

        <div class="tool-group">
          <button
            v-for="tool in tools"
            :key="tool.type"
            :class="['tool-btn', { active: activeTool === tool.type }]"
            @click="activeTool = tool.type"
            :title="t(tool.labelKey)"
          >
            <span class="tool-icon">{{ tool.icon }}</span>
            <span class="tool-label">{{ t(tool.labelKey) }}</span>
          </button>
        </div>

        <hr />

        <div class="color-group">
          <label class="form-label">{{ t('TACTICS.teamRed') }}</label>
          <button
            :class="['color-btn red', { active: activeColor === 'red' }]"
            @click="activeColor = 'red'"
          >●</button>
          <label class="form-label">{{ t('TACTICS.teamBlue') }}</label>
          <button
            :class="['color-btn blue', { active: activeColor === 'blue' }]"
            @click="activeColor = 'blue'"
          >●</button>
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

      <!-- Canvas area -->
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

      <!-- Snapshot panel -->
      <aside class="snapshot-panel card">
        <h3>{{ t('TACTICS.newSnapshot') }}</h3>
        <input
          v-model="snapshotTitle"
          class="form-input"
          :placeholder="t('TACTICS.snapshotTitlePlaceholder')"
          maxlength="80"
        />
        <input
          v-model="snapshotSport"
          class="form-input"
          :placeholder="t('TACTICS.sport')"
          maxlength="40"
        />
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
              <button class="btn btn-sm btn-secondary" @click="reopenSnapshot(snap)">
                {{ t('TACTICS.reopen') }}
              </button>
              <button class="btn btn-sm btn-danger" @click="deleteSnapshot(snap.id)">
                {{ t('TACTICS.delete') }}
              </button>
            </div>
          </li>
        </ul>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { getSportBridge, initializeSportBridge } from '../composables/useSportBridge';
import type { Sport } from '@viccoboard/core';

const { t } = useI18n();

// ------------------------------------------------------------------
// Bridge
// ------------------------------------------------------------------
initializeSportBridge();
const bridge = getSportBridge();

// ------------------------------------------------------------------
// Canvas constants
// ------------------------------------------------------------------
const CANVAS_W = 680;
const CANVAS_H = 450;

// ------------------------------------------------------------------
// Reactive state
// ------------------------------------------------------------------
type ToolType = Sport.TacticsMarking['type'];

const tools: Array<{ type: ToolType; labelKey: string; icon: string }> = [
  { type: 'player', labelKey: 'TACTICS.toolPlayer', icon: '👤' },
  { type: 'ball',   labelKey: 'TACTICS.toolBall',   icon: '⚽' },
  { type: 'arrow',  labelKey: 'TACTICS.toolArrow',  icon: '↗' },
  { type: 'line',   labelKey: 'TACTICS.toolLine',   icon: '—' },
  { type: 'circle', labelKey: 'TACTICS.toolCircle', icon: '○' },
  { type: 'text',   labelKey: 'TACTICS.toolText',   icon: 'T' },
];

const activeTool = ref<ToolType>('player');
const activeColor = ref<'red' | 'blue'>('red');
const background = ref<Sport.TacticsBoardSnapshot['background']>('field');

const markings = ref<Sport.TacticsMarking[]>([]);
const boardCanvas = ref<HTMLCanvasElement | null>(null);

// Snapshot persistence
const snapshotTitle = ref('');
const snapshotSport = ref('');
const saving = ref(false);
const saveMessage = ref('');
const snapshots = ref<Sport.TacticsBoardSnapshot[]>([]);

// Drawing state
let isDrawing = false;
let drawStart = { x: 0, y: 0 };

// ------------------------------------------------------------------
// Canvas helpers
// ------------------------------------------------------------------
function getCtx(): CanvasRenderingContext2D | null {
  return boardCanvas.value?.getContext('2d') ?? null;
}

function canvasPoint(
  e: MouseEvent | { clientX: number; clientY: number }
): { x: number; y: number } {
  const rect = boardCanvas.value!.getBoundingClientRect();
  const scaleX = CANVAS_W / rect.width;
  const scaleY = CANVAS_H / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

function drawBackground(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  if (background.value === 'custom') {
    ctx.fillStyle = '#f9f9f9';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    return;
  }

  // Grass-like background
  ctx.fillStyle = '#4a9e4a';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;

  if (background.value === 'field') {
    drawFootballField(ctx);
  } else if (background.value === 'court') {
    drawBasketballCourt(ctx);
  } else if (background.value === 'pitch') {
    drawHandballPitch(ctx);
  }
}

function drawFootballField(ctx: CanvasRenderingContext2D): void {
  // Outer boundary
  ctx.strokeRect(20, 20, CANVAS_W - 40, CANVAS_H - 40);
  // Centre line
  ctx.beginPath();
  ctx.moveTo(CANVAS_W / 2, 20);
  ctx.lineTo(CANVAS_W / 2, CANVAS_H - 20);
  ctx.stroke();
  // Centre circle
  ctx.beginPath();
  ctx.arc(CANVAS_W / 2, CANVAS_H / 2, 50, 0, Math.PI * 2);
  ctx.stroke();
  // Penalty areas
  const paW = 120, paH = 220;
  ctx.strokeRect(20, (CANVAS_H - paH) / 2, paW, paH);
  ctx.strokeRect(CANVAS_W - 20 - paW, (CANVAS_H - paH) / 2, paW, paH);
}

function drawBasketballCourt(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#c8a46e';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.strokeStyle = 'white';
  // Boundary
  ctx.strokeRect(20, 20, CANVAS_W - 40, CANVAS_H - 40);
  // Centre line
  ctx.beginPath();
  ctx.moveTo(CANVAS_W / 2, 20);
  ctx.lineTo(CANVAS_W / 2, CANVAS_H - 20);
  ctx.stroke();
  // Centre circle
  ctx.beginPath();
  ctx.arc(CANVAS_W / 2, CANVAS_H / 2, 40, 0, Math.PI * 2);
  ctx.stroke();
  // Paint areas
  const paintW = 100, paintH = 180;
  ctx.strokeRect(20, (CANVAS_H - paintH) / 2, paintW, paintH);
  ctx.strokeRect(CANVAS_W - 20 - paintW, (CANVAS_H - paintH) / 2, paintW, paintH);
}

function drawHandballPitch(ctx: CanvasRenderingContext2D): void {
  ctx.strokeRect(20, 20, CANVAS_W - 40, CANVAS_H - 40);
  // Centre line
  ctx.beginPath();
  ctx.moveTo(CANVAS_W / 2, 20);
  ctx.lineTo(CANVAS_W / 2, CANVAS_H - 20);
  ctx.stroke();
  // Goal areas (6m arcs)
  ctx.beginPath();
  ctx.arc(20, CANVAS_H / 2, 100, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(CANVAS_W - 20, CANVAS_H / 2, 100, Math.PI / 2, -Math.PI / 2);
  ctx.stroke();
}

function drawMarking(ctx: CanvasRenderingContext2D, m: Sport.TacticsMarking): void {
  const color = (m.properties.color as string) || '#cc0000';
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;

  const { x, y } = m.position;

  switch (m.type) {
    case 'player': {
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      break;
    }
    case 'ball': {
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#f0f0f0';
      ctx.fill();
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      break;
    }
    case 'arrow': {
      const ex = (m.properties.endX as number) ?? x + 40;
      const ey = (m.properties.endY as number) ?? y;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      // Arrowhead
      const angle = Math.atan2(ey - y, ex - x);
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - 12 * Math.cos(angle - 0.4), ey - 12 * Math.sin(angle - 0.4));
      ctx.lineTo(ex - 12 * Math.cos(angle + 0.4), ey - 12 * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'line': {
      const ex = (m.properties.endX as number) ?? x + 40;
      const ey = (m.properties.endY as number) ?? y;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      break;
    }
    case 'circle': {
      const r = (m.properties.radius as number) ?? 30;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'text': {
      const label = (m.properties.label as string) || '?';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(label, x, y);
      break;
    }
  }
}

function redraw(): void {
  const ctx = getCtx();
  if (!ctx) return;
  drawBackground(ctx);
  for (const m of markings.value) {
    drawMarking(ctx, m);
  }
}

// ------------------------------------------------------------------
// Pointer / touch events
// ------------------------------------------------------------------
function onPointerDown(e: MouseEvent): void {
  isDrawing = true;
  drawStart = canvasPoint(e);
  if (['player', 'ball', 'text'].includes(activeTool.value)) {
    placeMarking(drawStart.x, drawStart.y, drawStart.x, drawStart.y);
    isDrawing = false;
  }
}

function onPointerMove(e: MouseEvent): void {
  if (!isDrawing) return;
  if (!['arrow', 'line', 'circle'].includes(activeTool.value)) return;
  const pt = canvasPoint(e);
  // Preview
  redraw();
  const ctx = getCtx();
  if (!ctx) return;
  const preview: Sport.TacticsMarking = {
    id: '__preview__',
    type: activeTool.value,
    position: { x: drawStart.x, y: drawStart.y },
    properties: {
      color: activeColor.value === 'red' ? '#cc0000' : '#0044cc',
      endX: pt.x,
      endY: pt.y,
      radius: Math.hypot(pt.x - drawStart.x, pt.y - drawStart.y)
    }
  };
  drawMarking(ctx, preview);
}

function onPointerUp(e: MouseEvent | Event): void {
  if (!isDrawing) return;
  isDrawing = false;
  const pt = canvasPoint(e as MouseEvent);
  if (['arrow', 'line', 'circle'].includes(activeTool.value)) {
    placeMarking(drawStart.x, drawStart.y, pt.x, pt.y);
  }
}

function onTouchStart(e: TouchEvent): void {
  if (e.touches.length > 0) {
    const touch = e.touches[0];
    onPointerDown({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);
  }
}

function onTouchMove(e: TouchEvent): void {
  if (e.touches.length > 0) {
    const touch = e.touches[0];
    onPointerMove({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);
  }
}

function placeMarking(sx: number, sy: number, ex: number, ey: number): void {
  const color = activeColor.value === 'red' ? '#cc0000' : '#0044cc';
  const id = `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  let props: Record<string, unknown> = { color };
  if (activeTool.value === 'arrow' || activeTool.value === 'line') {
    props = { ...props, endX: ex, endY: ey };
  } else if (activeTool.value === 'circle') {
    props = { ...props, radius: Math.max(10, Math.hypot(ex - sx, ey - sy)) };
  } else if (activeTool.value === 'text') {
    const label = window.prompt('Text eingeben / Enter text:') || '?';
    props = { ...props, label };
  }

  markings.value.push({
    id,
    type: activeTool.value,
    position: { x: sx, y: sy },
    properties: props
  });
  redraw();
}

function clearBoard(): void {
  markings.value = [];
  redraw();
}

// ------------------------------------------------------------------
// Snapshot persistence
// ------------------------------------------------------------------
async function loadSnapshots(): Promise<void> {
  snapshots.value = await bridge.tacticsSnapshotRepository.findAll();
  // Sort newest first
  snapshots.value.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

async function saveSnapshot(): Promise<void> {
  if (!snapshotTitle.value.trim()) {
    snapshotTitle.value = '';
    return;
  }
  saving.value = true;
  saveMessage.value = '';
  try {
    await bridge.saveTacticsSnapshotUseCase.execute({
      title: snapshotTitle.value.trim(),
      sport: snapshotSport.value.trim(),
      markings: markings.value,
      background: background.value
    });
    saveMessage.value = t('TACTICS.saveSuccess');
    snapshotTitle.value = '';
    await loadSnapshots();
  } finally {
    saving.value = false;
  }
}

function reopenSnapshot(snap: Sport.TacticsBoardSnapshot): void {
  markings.value = snap.markings.map((m) => ({ ...m }));
  background.value = snap.background;
  snapshotTitle.value = snap.title;
  snapshotSport.value = snap.sport;
  redraw();
}

async function deleteSnapshot(id: string): Promise<void> {
  await bridge.tacticsSnapshotRepository.delete(id);
  await loadSnapshots();
}

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// ------------------------------------------------------------------
// Watch & lifecycle
// ------------------------------------------------------------------
watch(background, () => redraw());

onMounted(async () => {
  redraw();
  await loadSnapshots();
});
</script>

<style scoped>
.tactics-view {
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header h2 {
  margin: 0.5rem 0;
  font-size: 1.75rem;
  color: #333;
}

.board-layout {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  align-items: flex-start;
  flex-wrap: wrap;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Toolbar */
.toolbar {
  min-width: 130px;
  flex: 0 0 130px;
}

.toolbar h3 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
}

.tool-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.6rem;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.15s;
  min-height: 44px;
}

.tool-btn:hover {
  background: #e0e0e0;
}

.tool-btn.active {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

.tool-icon {
  font-size: 1rem;
}

.color-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
}

.color-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  font-size: 1.4rem;
  line-height: 1;
  background: transparent;
}

.color-btn.red { color: #cc0000; }
.color-btn.blue { color: #0044cc; }
.color-btn.active { border-color: #333; }

.field-group {
  margin-top: 0.5rem;
}

.form-label {
  display: block;
  font-size: 0.8rem;
  color: #555;
  margin-bottom: 0.25rem;
}

.form-select {
  width: 100%;
  padding: 0.35rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.85rem;
}

.clear-btn {
  margin-top: 0.5rem;
  width: 100%;
}

hr {
  border: none;
  border-top: 1px solid #eee;
  margin: 0.75rem 0;
}

/* Canvas */
.canvas-wrapper {
  flex: 1 1 400px;
  min-width: 300px;
  overflow: hidden;
  padding: 0.5rem;
}

.board-canvas {
  display: block;
  width: 100%;
  height: auto;
  cursor: crosshair;
  border-radius: 4px;
  touch-action: none;
}

/* Snapshot panel */
.snapshot-panel {
  min-width: 220px;
  flex: 0 0 220px;
}

.snapshot-panel h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}

.form-input {
  width: 100%;
  padding: 0.4rem 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9rem;
  margin-bottom: 0.4rem;
  box-sizing: border-box;
}

.save-message {
  color: #16a34a;
  font-size: 0.85rem;
  margin-top: 0.3rem;
}

.empty-note {
  color: #888;
  font-size: 0.85rem;
  font-style: italic;
}

.snapshot-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.snapshot-item {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.5rem;
}

.snap-info {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.35rem;
}

.snap-meta {
  font-size: 0.75rem;
  color: #888;
}

.snap-actions {
  display: flex;
  gap: 0.35rem;
}

/* Buttons */
.btn {
  padding: 0.45rem 0.9rem;
  border-radius: 5px;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  transition: opacity 0.15s;
  min-height: 44px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #2563eb;
  color: white;
  width: 100%;
}

.btn-secondary {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-danger {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #dc2626;
}

.btn-sm {
  min-height: 36px;
  padding: 0.25rem 0.6rem;
  font-size: 0.8rem;
}
</style>

