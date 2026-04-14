<template>
  <section class="preset-section">
    <div class="section-header">
      <div>
        <h2>Rückmeldebogen</h2>
        <p class="section-copy">
          Steuert die Darstellung des Korrektur- und Exportbogens, ohne die Prüfungslogik zu duplizieren.
        </p>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="preset-name">Preset-Name</label>
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
          <option value="standard">Standard</option>
          <option value="compact">Kompakt</option>
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
import { Exams } from '@viccoboard/core';

const props = defineProps<{
  modelValue: Exams.CorrectionSheetPreset;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: Exams.CorrectionSheetPreset): void;
}>();

const toggles: Array<{ key: keyof Exams.CorrectionSheetPreset; label: string }> = [
  { key: 'showHeader', label: 'Kopfbereich anzeigen' },
  { key: 'showOverallPoints', label: 'Gesamtpunkte anzeigen' },
  { key: 'showGrade', label: 'Note anzeigen' },
  { key: 'showTaskPoints', label: 'Aufgabenpunkte anzeigen' },
  { key: 'showTaskComments', label: 'Aufgabenkommentare anzeigen' },
  { key: 'showGeneralComment', label: 'Gesamtkommentar anzeigen' },
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
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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

textarea {
  resize: vertical;
}
</style>
