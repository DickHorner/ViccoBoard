<template>
  <section class="preset-section">
    <div class="section-header">
      <div>
        <h2>Druckbogengestaltung</h2>
        <p class="section-copy">
          Das wiederverwendbare Blanko-Layout für Rückmeldebögen. Prüfungsinhalte und Bewertungen werden erst beim PDF-Erzeugen eingesetzt.
        </p>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="preset-name">Vorlagenname</label>
        <input
          id="preset-name"
          :value="modelValue.name"
          type="text"
          @input="updateField('name', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="form-group">
        <label for="preset-layout">Layout</label>
        <select
          id="preset-layout"
          :value="modelValue.layoutMode"
          @change="updateField('layoutMode', ($event.target as HTMLSelectElement).value as Exams.CorrectionSheetLayoutMode)"
        >
          <option value="compact">Kompakt</option>
          <option value="standard">Standard</option>
          <option value="detailed">Detailliert</option>
          <option value="minimal">Minimal</option>
        </select>
      </div>
    </div>

    <div class="toggle-grid">
      <label v-for="toggle in toggles" :key="toggle.key" class="toggle-card">
        <input
          :checked="Boolean(modelValue[toggle.key])"
          type="checkbox"
          @change="updateField(toggle.key, ($event.target as HTMLInputElement).checked)"
        />
        <span>{{ toggle.label }}</span>
      </label>
    </div>

    <div class="form-group">
      <label for="preset-header-text">Header-Text</label>
      <textarea
        id="preset-header-text"
        :value="modelValue.headerText ?? ''"
        rows="2"
        @input="updateField('headerText', ($event.target as HTMLTextAreaElement).value)"
      ></textarea>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="preset-school-logo">Schullogo</label>
        <input
          id="preset-school-logo"
          type="file"
          accept="image/png,image/jpeg"
          @change="uploadImage('schoolLogo', $event)"
        />
        <div v-if="modelValue.schoolLogo" class="image-preview-row">
          <span>{{ modelValue.schoolLogo.fileName ?? 'Logo hochgeladen' }}</span>
          <button type="button" class="small-button" @click="clearImage('schoolLogo')">Entfernen</button>
        </div>
      </div>

      <div class="form-group">
        <label for="preset-teacher-signature">Gescannte Unterschrift</label>
        <input
          id="preset-teacher-signature"
          type="file"
          accept="image/png,image/jpeg"
          @change="uploadImage('teacherSignature', $event)"
        />
        <div v-if="modelValue.teacherSignature" class="image-preview-row">
          <span>{{ modelValue.teacherSignature.fileName ?? 'Unterschrift hochgeladen' }}</span>
          <button type="button" class="small-button" @click="clearImage('teacherSignature')">Entfernen</button>
        </div>
        <label for="signature-canvas">Oder Unterschrift zeichnen</label>
        <canvas id="signature-canvas" ref="signatureCanvas" width="360" height="100" class="signature-canvas" @pointerdown="startDrawing" @pointermove="draw" @pointerup="stopDrawing" @pointerleave="stopDrawing"></canvas>
        <div class="image-preview-row"><button type="button" class="small-button" @click="clearDrawing">Leeren</button><button type="button" class="small-button" @click="saveDrawing">Zeichnung verwenden</button></div>
      </div>
    </div>

    <div v-if="modelValue.showSignatureArea" class="signature-position-section">
      <h3>Unterschrift und Datum</h3>
      <label class="signature-date-toggle">
        <input
          type="checkbox"
          :checked="modelValue.showSignatureDate !== false"
          @change="updateField('showSignatureDate', ($event.target as HTMLInputElement).checked)"
        />
        Datum neben der Unterschrift beim PDF-Erzeugen einsetzen
      </label>
      <p class="section-copy">
        Verschiebe die Unterschrift per Finger, Maus oder Pfeiltasten. Die horizontale Position und der zusätzliche Abstand zum vorherigen Inhalt werden auch im PDF übernommen.
      </p>
      <div ref="signaturePositionArea" class="signature-position-preview" aria-label="Positionierungsfeld für die Unterschrift">
        <button
          ref="signaturePositionMarker"
          type="button"
          class="signature-position-marker"
          :style="{ left: `${signaturePositionX * 0.55}%`, top: `${signaturePositionY * 0.625}%` }"
          aria-label="Unterschrift verschieben. Mit den Pfeiltasten bewegen, mit Umschalt schneller."
          @pointerdown="startSignatureDrag"
          @pointermove="moveSignatureDrag"
          @pointerup="endSignatureDrag"
          @pointercancel="endSignatureDrag"
          @keydown="nudgeSignature"
        >
          <img v-if="modelValue.teacherSignature?.src" :src="modelValue.teacherSignature.src" alt="Unterschrift" />
          <span v-else>Unterschrift</span>
          <small v-if="modelValue.showSignatureDate !== false">Datum beim PDF-Erzeugen</small>
        </button>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="signature-position-x">Waagerechte Position (0–100)</label>
          <input id="signature-position-x" type="number" min="0" max="100" step="1"
            :value="signaturePositionX"
            @change="updateSignaturePosition(Number(($event.target as HTMLInputElement).value), signaturePositionY)"
          />
        </div>
        <div class="form-group">
          <label for="signature-position-y">Zusätzlicher Abstand nach unten (0–100)</label>
          <input id="signature-position-y" type="number" min="0" max="100" step="1"
            :value="signaturePositionY"
            @change="updateSignaturePosition(signaturePositionX, Number(($event.target as HTMLInputElement).value))"
          />
        </div>
      </div>
    </div>

    <div class="form-group">
      <label for="preset-footer-text">Footer-Text</label>
      <textarea
        id="preset-footer-text"
        :value="modelValue.footerText ?? ''"
        rows="2"
        @input="updateField('footerText', ($event.target as HTMLTextAreaElement).value)"
      ></textarea>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Exams } from '@viccoboard/core';

const props = defineProps<{
  modelValue: Exams.CorrectionSheetPreset;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: Exams.CorrectionSheetPreset): void;
}>();
const signatureCanvas = ref<HTMLCanvasElement | null>(null);
const signaturePositionArea = ref<HTMLElement | null>(null);
const signaturePositionMarker = ref<HTMLButtonElement | null>(null);
const signaturePositionX = computed(() => clampPosition(props.modelValue.signaturePositionX));
const signaturePositionY = computed(() => clampPosition(props.modelValue.signaturePositionY));
let drawing = false;
let signatureDrag: { pointerId: number; clientX: number; clientY: number; x: number; y: number } | null = null;

function clampPosition(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function updateSignaturePosition(x: number, y: number): void {
  emit('update:modelValue', {
    ...props.modelValue,
    signaturePositionX: clampPosition(x),
    signaturePositionY: clampPosition(y),
    updatedAt: new Date()
  });
}

function startSignatureDrag(event: PointerEvent): void {
  if (!signaturePositionArea.value || !signaturePositionMarker.value) return;
  event.preventDefault();
  signatureDrag = {
    pointerId: event.pointerId,
    clientX: event.clientX,
    clientY: event.clientY,
    x: signaturePositionX.value,
    y: signaturePositionY.value
  };
  signaturePositionMarker.value.setPointerCapture(event.pointerId);
}

function moveSignatureDrag(event: PointerEvent): void {
  if (!signatureDrag || event.pointerId !== signatureDrag.pointerId) return;
  const area = signaturePositionArea.value;
  const marker = signaturePositionMarker.value;
  if (!area || !marker) return;
  const travelX = Math.max(1, area.clientWidth - marker.offsetWidth);
  const travelY = Math.max(1, area.clientHeight - marker.offsetHeight);
  updateSignaturePosition(
    signatureDrag.x + (event.clientX - signatureDrag.clientX) * 100 / travelX,
    signatureDrag.y + (event.clientY - signatureDrag.clientY) * 100 / travelY
  );
}

function endSignatureDrag(event: PointerEvent): void {
  if (!signatureDrag || signatureDrag.pointerId !== event.pointerId) return;
  const marker = signaturePositionMarker.value;
  if (marker?.hasPointerCapture(event.pointerId)) marker.releasePointerCapture(event.pointerId);
  signatureDrag = null;
}

function nudgeSignature(event: KeyboardEvent): void {
  const step = event.shiftKey ? 10 : 2;
  const deltaX = event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0;
  const deltaY = event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0;
  if (!deltaX && !deltaY) return;
  event.preventDefault();
  updateSignaturePosition(signaturePositionX.value + deltaX, signaturePositionY.value + deltaY);
}

const toggles: Array<{ key: keyof Exams.CorrectionSheetPreset; label: string }> = [
  { key: 'showHeader', label: 'Kopfbereich anzeigen' },
  { key: 'showOverallPoints', label: 'Gesamtpunkte anzeigen' },
  { key: 'showGrade', label: 'Note anzeigen' },
  { key: 'showTaskPoints', label: 'Aufgabenpunkte anzeigen' },
  { key: 'showTaskComments', label: 'Aufgabenkommentare anzeigen' },
  { key: 'showGeneralComment', label: 'Gesamtkommentar anzeigen' },
  { key: 'showSupportTips', label: 'Fördertipps anzeigen' },
  { key: 'showTaskPercentages', label: 'Aufgabenprozente anzeigen' },
  { key: 'italicizeFeedback', label: 'Kommentare und Tipps kursiv' },
  { key: 'showPointDeductions', label: 'Punktabzüge anzeigen' },
  { key: 'showExamParts', label: 'Prüfungsteile anzeigen' },
  { key: 'showSignatureArea', label: 'Unterschriftsbereich anzeigen' }
];

function updateField<Key extends keyof Exams.CorrectionSheetPreset>(
  key: Key,
  value: Exams.CorrectionSheetPreset[Key]
) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value,
    updatedAt: new Date()
  });
}

function readImageFile(file: File): Promise<Exams.CorrectionSheetImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Bild konnte nicht gelesen werden.'));
        return;
      }

      resolve({
        src: reader.result,
        fileName: file.name
      });
    };
    reader.onerror = () => reject(reader.error ?? new Error('Bild konnte nicht gelesen werden.'));
    reader.readAsDataURL(file);
  });
}

async function uploadImage(
  key: 'schoolLogo' | 'teacherSignature',
  event: Event
): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) {
    return;
  }

  if (!['image/png', 'image/jpeg'].includes(file.type)) {
    input.value = '';
    return;
  }

  const image = await readImageFile(file);
  if (key === 'teacherSignature') {
    emit('update:modelValue', {
      ...props.modelValue,
      teacherSignature: image,
      showSignatureArea: true,
      updatedAt: new Date()
    });
  } else {
    updateField(key, image);
  }
  input.value = '';
}

function clearImage(key: 'schoolLogo' | 'teacherSignature'): void {
  updateField(key, undefined);
}

function point(event: PointerEvent) { const canvas = signatureCanvas.value!; const rect = canvas.getBoundingClientRect(); return { x: (event.clientX - rect.left) * (canvas.width / rect.width), y: (event.clientY - rect.top) * (canvas.height / rect.height) }; }
function startDrawing(event: PointerEvent): void { const canvas = signatureCanvas.value; if (!canvas) return; drawing = true; canvas.setPointerCapture(event.pointerId); const ctx = canvas.getContext('2d')!; const p = point(event); ctx.beginPath(); ctx.moveTo(p.x, p.y); }
function draw(event: PointerEvent): void { if (!drawing || !signatureCanvas.value) return; const ctx = signatureCanvas.value.getContext('2d')!; const p = point(event); ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#111'; ctx.lineTo(p.x, p.y); ctx.stroke(); }
function stopDrawing(): void { drawing = false; }
function clearDrawing(): void { const canvas = signatureCanvas.value; if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height); }
function saveDrawing(): void {
  const canvas = signatureCanvas.value;
  if (!canvas) return;
  emit('update:modelValue', {
    ...props.modelValue,
    teacherSignature: { src: canvas.toDataURL('image/png'), fileName: 'unterschrift-zeichnung.png' },
    showSignatureArea: true,
    updatedAt: new Date()
  });
}
</script>

<style scoped>
.preset-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-header h2 {
  margin: 0 0 0.25rem;
}

.section-copy {
  margin: 0;
  color: #64748b;
}

.form-row {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: 12px;
  padding: 0.75rem;
  font: inherit;
}

.toggle-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
}

.toggle-card {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-height: 44px;
  padding: 0.8rem 0.9rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  background: #f8fafc;
}

.image-preview-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  color: #475569;
  font-size: 0.9rem;
}

.small-button {
  min-height: 44px;
  border: 1px solid rgba(15, 23, 42, 0.2);
  border-radius: 999px;
  background: transparent;
  padding: 0.35rem 0.75rem;
  cursor: pointer;
}

textarea {
  resize: vertical;
}
.signature-canvas { width: 100%; max-width: 360px; height: 100px; border: 1px dashed rgba(15, 23, 42, 0.28); background: #fff; touch-action: none; }

.signature-position-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.signature-position-section h3 {
  margin: 0;
}

.signature-date-toggle {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-height: 44px;
}

.signature-position-preview {
  position: relative;
  height: 160px;
  border: 1px dashed var(--surface-border);
  border-radius: 0.75rem;
  background: #fff;
}

.signature-position-marker {
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 0.15rem;
  width: 45%;
  height: 60px;
  min-height: 44px;
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--accent-strong);
  border-radius: 0.5rem;
  background: #f8fafc;
  color: var(--color-ink);
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.signature-position-marker:active {
  cursor: grabbing;
}

.signature-position-marker:focus-visible {
  outline: 2px solid var(--accent-strong);
  outline-offset: 2px;
}

.signature-position-marker img {
  max-width: 100%;
  max-height: 30px;
  object-fit: contain;
  pointer-events: none;
}

.signature-position-marker small {
  font-size: 0.65rem;
  color: var(--color-muted);
}

</style>
