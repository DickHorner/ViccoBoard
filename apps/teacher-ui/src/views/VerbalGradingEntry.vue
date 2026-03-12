<template>
  <div class="verbal-grading-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← Zurück</button>
      <h2>{{ category?.name || 'Verbalbeurteilung' }}</h2>
      <p class="page-description">
        Erfassen Sie individuelle Verbalbeurteilungen für jeden Schüler.
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Daten werden geladen...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-primary" @click="loadData">Erneut versuchen</button>
    </div>

    <!-- Content -->
    <div v-else-if="category" class="grading-content">
      <!-- Category Info -->
      <section class="card category-info-card">
        <div class="info-grid">
          <div class="info-item">
            <label>Typ:</label>
            <span>Verbalbeurteilung</span>
          </div>
          <div class="info-item">
            <label>Gewicht:</label>
            <span>{{ category.weight }}%</span>
          </div>
          <div class="info-item">
            <label>Schüler:</label>
            <span>{{ students.length }}</span>
          <div class="info-item" v-if="category.description">
            <label>Beschreibung:</label>
            <span>{{ category.description }}</span>
          </div>
        </div>
      </section>

      <!-- Save All Button -->
      <div v-if="students.length > 0" class="bulk-save-bar">
        <p class="info-note">
          💡 Beurteilungen werden automatisch gespeichert, wenn Sie das Textfeld verlassen.
        </p>
        <button
          class="btn-primary"
          @click="saveAllEntries"
          :disabled="saving || !hasUnsavedChanges"
        >
          {{ saving ? 'Speichern...' : 'Alle speichern' }}
        </button>
      </div>

      <!-- Student Entries -->
      <section
        v-for="student in students"
        :key="student.id"
        :class="['card', 'student-card', { 'card-unsaved': hasUnsavedChangesForStudent(student.id), 'card-saved': isSaved(student.id) && !hasUnsavedChangesForStudent(student.id) }]"
      >
        <div class="student-header">
          <h4>{{ student.firstName }} {{ student.lastName }}</h4>
          <span v-if="isSaved(student.id) && !hasUnsavedChangesForStudent(student.id)" class="badge-saved">
            ✓ Gespeichert
          </span>
          <span v-else-if="hasUnsavedChangesForStudent(student.id)" class="badge-unsaved">
            ● Nicht gespeichert
          </span>
          <span v-else class="badge-empty">
            Noch keine Beurteilung
          </span>
        </div>
        <div class="form-group">
          <label :for="`verbal-${student.id}`">Beurteilung</label>
          <textarea
            :id="`verbal-${student.id}`"
            :value="verbalEntries.get(student.id) ?? ''"
            @input="onEntryChange(student.id, ($event.target as HTMLTextAreaElement).value)"
            @blur="saveStudentEntry(student.id)"
            class="verbal-textarea"
            placeholder="Verbalbeurteilung eingeben..."
            rows="4"
            :disabled="saving"
          />
        </div>
      </section>

      <!-- No Students -->
      <section class="card" v-if="students.length === 0">
        <div class="empty-state">
          <p>Keine Schüler in dieser Klasse gefunden.</p>
        </div>
      </section>
    </div>
      <!-- Student Assessment List -->
      <section class="card">
        <div class="card-header">
          <h3>Schülerbeurteilungen</h3>
          <span class="count-badge">{{ assessedCount }}/{{ students.length }}</span>
        </div>

        <div v-if="students.length === 0" class="empty-state">
          <p>Keine Schüler in dieser Klasse gefunden.</p>
        </div>

        <div v-else class="student-list">
          <div
            v-for="student in students"
            :key="student.id"
            :class="['student-entry', { assessed: hasAssessment(student.id) }]"
          >
            <div class="student-header" @click="toggleExpand(student.id)">
              <div class="student-name-row">
                <span class="assessment-indicator" :class="{ filled: hasAssessment(student.id) }">
                  {{ hasAssessment(student.id) ? '✓' : '○' }}
                </span>
                <span class="student-name">{{ student.firstName }} {{ student.lastName }}</span>
              </div>
              <div class="student-preview" v-if="hasAssessment(student.id) && !isExpanded(student.id)">
                <span class="preview-text">{{ getAssessmentPreview(student.id) }}</span>
              </div>
              <button class="expand-btn" :aria-label="isExpanded(student.id) ? 'Einklappen' : 'Ausklappen'">
                {{ isExpanded(student.id) ? '▲' : '▼' }}
              </button>
            </div>

            <!-- Assessment Form (expanded) -->
            <div v-if="isExpanded(student.id)" class="assessment-form">
              <!-- Text fields from configuration -->
              <div
                v-for="field in assessmentFields"
                :key="field.id"
                class="form-group"
              >
                <label :for="`${student.id}-${field.id}`">
                  {{ field.label }}
                  <span v-if="field.required" class="required-marker">*</span>
                </label>
                <textarea
                  v-if="field.type === 'text'"
                  :id="`${student.id}-${field.id}`"
                  v-model="getOrInitDraft(student.id)[field.id]"
                  rows="3"
                  :placeholder="`${field.label} eingeben…`"
                  class="form-textarea"
                ></textarea>
                <div v-else-if="field.type === 'scale' && getScale(field.id)" class="scale-options">
                  <label
                    v-for="level in getScale(field.id)!.levels"
                    :key="level.value"
                    class="scale-option"
                  >
                    <input
                      type="radio"
                      :name="`${student.id}-${field.id}`"
                      :value="String(level.value)"
                      v-model="getOrInitDraft(student.id)[field.id]"
                    />
                    <span class="scale-label">{{ level.label }}</span>
                    <span v-if="level.description" class="scale-desc">{{ level.description }}</span>
                  </label>
                </div>
                <label v-else-if="field.type === 'checkbox'" class="checkbox-label">
                  <input
                    type="checkbox"
                    :id="`${student.id}-${field.id}`"
                    v-model="getOrInitDraft(student.id)[field.id]"
                  />
                  <span>{{ field.label }}</span>
                </label>
              </div>

              <!-- Fallback text area if no fields configured -->
              <div v-if="assessmentFields.length === 0" class="form-group">
                <label :for="`${student.id}-text`">Beurteilungstext</label>
                <textarea
                  :id="`${student.id}-text`"
                  v-model="getOrInitDraft(student.id)['text']"
                  rows="4"
                  placeholder="Verbalbeurteilung eingeben…"
                  class="form-textarea"
                ></textarea>
              </div>

              <div class="form-actions">
                <button
                  class="btn-primary btn-small"
                  :disabled="saving"
                  @click="saveAssessment(student.id)"
                >
                  {{ saving ? 'Wird gespeichert…' : 'Speichern' }}
                </button>
                <button
                  class="btn-text btn-small"
                  @click="collapseStudent(student.id)"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Category Not Found -->
    <div v-else class="error-state">
      <p>Bewertungskategorie nicht gefunden.</p>
      <button class="btn-primary" @click="$router.push('/grading')">
        Zur Bewertungsübersicht
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useSportBridge } from '../composables/useSportBridge';
import { useStudents } from '../composables/useStudentsBridge';
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getSportBridge } from '../composables/useSportBridge';
import { getStudentsBridge } from '../composables/useStudentsBridge';
import { useToast } from '../composables/useToast';
import type { Sport } from '@viccoboard/core';

const route = useRoute();
const { SportBridge, gradeCategories, performanceEntries } = useSportBridge();
const { repository: studentRepository } = useStudents();
const toast = useToast();

const categoryId = route.params.id as string;
const category = ref<Sport.GradeCategory | null>(null);
const students = ref<any[]>([]);
/** Current (possibly unsaved) text per studentId */
const verbalEntries = ref<Map<string, string>>(new Map());
/** Which student IDs have a saved entry in the DB */
const savedStudents = ref<Set<string>>(new Set());
const unsavedStudents = ref<Set<string>>(new Set());
const hasUnsavedChanges = ref(false);
const loading = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);

onMounted(async () => {
  await loadData();
});

async function loadData() {
  loading.value = true;
  error.value = null;

  try {
    category.value = await gradeCategories.value?.findById(categoryId) ?? null;

    if (!category.value) {
      error.value = 'Kategorie nicht gefunden';
      return;
    }

    students.value = await studentRepository.value?.findByClassGroup(
      category.value.classGroupId
    ) ?? [];

    // Load existing verbal entries
    for (const student of students.value) {
      const entries = await performanceEntries.value
        ?.findByStudentAndCategory(student.id, categoryId) ?? [];

      if (entries.length > 0) {
        // entries are sorted descending (newest first)
        const latest = entries[0];
        const text = (latest.measurements as Record<string, unknown>)?.text;
        if (typeof text === 'string' && text.length > 0) {
          verbalEntries.value.set(student.id, text);
          savedStudents.value.add(student.id);
        }
      }
    }
  } catch (err) {
    console.warn('[VerbalGrading] Failed to load data', err);
    error.value = 'Fehler beim Laden der Daten';
  } finally {
    loading.value = false;
  }
}

function onEntryChange(studentId: string, value: string): void {
  verbalEntries.value.set(studentId, value);
  unsavedStudents.value.add(studentId);
  hasUnsavedChanges.value = true;
}

function hasUnsavedChangesForStudent(studentId: string): boolean {
  return unsavedStudents.value.has(studentId);
}

function isSaved(studentId: string): boolean {
  return savedStudents.value.has(studentId);
}

async function saveStudentEntry(studentId: string): Promise<void> {
  if (!unsavedStudents.value.has(studentId)) return;

  const text = verbalEntries.value.get(studentId) ?? '';

  saving.value = true;
  try {
    await SportBridge.value?.recordGradeUseCase.execute({
      studentId,
      categoryId,
      measurements: { text },
      calculatedGrade: undefined,
    });

    savedStudents.value.add(studentId);
    unsavedStudents.value.delete(studentId);
    if (unsavedStudents.value.size === 0) {
      hasUnsavedChanges.value = false;
    }
  } catch (err) {
    console.warn('[VerbalGrading] Failed to save entry for student', studentId, err);
    toast.error('Fehler beim Speichern der Beurteilung');
    throw err;
  } finally {
    saving.value = false;
  }
}

async function saveAllEntries(): Promise<void> {
  saving.value = true;
  let failureCount = 0;
  try {
    for (const studentId of [...unsavedStudents.value]) {
      try {
        await saveStudentEntry(studentId);
      } catch {
        failureCount++;
      }
    }
    if (failureCount === 0) {
      toast.success('Alle Beurteilungen gespeichert!');
    } else {
      toast.error(`${failureCount} Beurteilung(en) konnten nicht gespeichert werden.`);
    }
const toast = useToast();

const categoryId = computed(() => route.params.id as string);

const loading = ref(false);
const saving = ref(false);
const error = ref('');

const category = ref<Sport.GradeCategory | null>(null);
const students = ref<any[]>([]);
const existingEntries = ref<Sport.PerformanceEntry[]>([]);

// Draft assessments keyed by studentId
const drafts = ref<Record<string, Record<string, any>>>({});
const expandedStudents = ref<Set<string>>(new Set());

// ── Computed ──────────────────────────────────────────────────────────────────

const config = computed((): Sport.VerbalAssessmentConfig | null => {
  if (!category.value || category.value.type !== 'verbal') return null;
  return category.value.configuration as Sport.VerbalAssessmentConfig;
});

const assessmentFields = computed((): Sport.VerbalAssessmentField[] => {
  return config.value?.fields ?? [];
});

const assessedCount = computed(() =>
  students.value.filter(s => hasAssessment(s.id)).length
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function hasAssessment(studentId: string): boolean {
  const existing = existingEntries.value.find(e => e.studentId === studentId);
  if (existing) return true;
  const draft = drafts.value[studentId];
  if (!draft) return false;
  return Object.values(draft).some(v => v !== '' && v !== false && v !== null && v !== undefined);
}

function extractPreviewText(measurements: Record<string, any>): string {
  // Prefer a field called 'text', fall back to first non-empty measurement value
  const preferred = measurements['text'];
  if (preferred !== undefined && preferred !== null && preferred !== '') {
    return String(preferred);
  }
  for (const v of Object.values(measurements)) {
    if (v !== undefined && v !== null && v !== false && v !== '') {
      return String(v);
    }
  }
  return '';
}

function getAssessmentPreview(studentId: string): string {
  const existing = existingEntries.value.find(e => e.studentId === studentId);
  if (!existing) return '';
  const text = extractPreviewText(existing.measurements ?? {});
  return text.length > 60 ? text.slice(0, 60) + '…' : text;
}

function isExpanded(studentId: string): boolean {
  return expandedStudents.value.has(studentId);
}

function toggleExpand(studentId: string): void {
  if (expandedStudents.value.has(studentId)) {
    expandedStudents.value.delete(studentId);
  } else {
    expandedStudents.value.add(studentId);
    // Pre-fill draft from existing entry
    const existing = existingEntries.value.find(e => e.studentId === studentId);
    if (existing && !drafts.value[studentId]) {
      drafts.value[studentId] = { ...existing.measurements };
    }
  }
}

function collapseStudent(studentId: string): void {
  expandedStudents.value.delete(studentId);
}

function getOrInitDraft(studentId: string): Record<string, any> {
  if (!drafts.value[studentId]) {
    const existing = existingEntries.value.find(e => e.studentId === studentId);
    drafts.value[studentId] = existing ? { ...existing.measurements } : {};
  }
  return drafts.value[studentId];
}

function getScale(fieldId: string): Sport.AssessmentScale | undefined {
  return config.value?.scales.find(s => s.id === fieldId);
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  await loadData();
});

async function loadData(): Promise<void> {
  loading.value = true;
  error.value = '';
  try {
    const bridge = getSportBridge();
    const studentsBridge = getStudentsBridge();

    const cat = await bridge.gradeCategoryRepository.findById(categoryId.value);
    if (!cat) {
      error.value = 'Bewertungskategorie nicht gefunden.';
      return;
    }
    category.value = cat;

    const classStudents = await studentsBridge.studentRepository.findByClassGroup(cat.classGroupId);
    students.value = classStudents;

    const entryPromises = classStudents.map((s: any) =>
      bridge.performanceEntryRepository.findByStudent(s.id)
    );
    const allEntries = await Promise.all(entryPromises);
    existingEntries.value = (allEntries as any[][])
      .flat()
      .filter((e: any) => e.categoryId === categoryId.value);
  } catch (e: any) {
    error.value = e?.message ?? 'Fehler beim Laden.';
  } finally {
    loading.value = false;
  }
}

async function saveAssessment(studentId: string): Promise<void> {
  const draft = drafts.value[studentId];
  if (!draft) return;

  // Ensure there's at least one non-empty value
  const nonEmpty = Object.fromEntries(
    Object.entries(draft).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );
  if (Object.keys(nonEmpty).length === 0) {
    toast.error('Bitte geben Sie mindestens eine Beurteilung ein.');
    return;
  }

  saving.value = true;
  try {
    const bridge = getSportBridge();
    await bridge.recordGradeUseCase.execute({
      studentId,
      categoryId: categoryId.value,
      measurements: nonEmpty,
      comment: undefined
    });
    // Refresh entries
    const entries = await bridge.performanceEntryRepository.findByStudent(studentId);
    const updated = entries.filter(e => e.categoryId === categoryId.value);
    existingEntries.value = [
      ...existingEntries.value.filter(e => e.studentId !== studentId),
      ...updated
    ];
    collapseStudent(studentId);
    toast.success('Beurteilung gespeichert.');
  } catch (e: any) {
    toast.error(e?.message ?? 'Fehler beim Speichern.');
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.verbal-grading-view {
  max-width: 900px;
  margin: 0 auto;
  padding: 1rem;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-header h2 {
  margin: 0.5rem 0 0.25rem;
  font-size: 1.5rem;
  color: #1a1a1a;
  padding: 1rem;
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h2 {
  margin: 0.5rem 0;
  font-size: 1.75rem;
  color: #333;
}

.page-description {
  color: #666;
  margin: 0;
  font-size: 0.9rem;
  margin: 0.25rem 0 0;
}

.back-button {
  background: none;
  border: none;
  color: #0066cc;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem 0;
  margin-bottom: 0.5rem;
  touch-action: manipulation;
}

.back-button:hover {
  text-decoration: underline;
}

.grading-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card h3 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  color: #333;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-header h3 {
  margin: 0;
}

.count-badge {
  background: #e0e0e0;
  color: #333;
  padding: 0.2rem 0.6rem;
  border-radius: 99px;
  font-size: 0.85rem;
  font-weight: 600;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.info-item label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.student-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.student-entry {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.student-entry.assessed {
  border-color: #4caf50;
}

.student-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  cursor: pointer;
  background: #fafafa;
  user-select: none;
}

.student-entry.assessed .student-header {
  background: #f0faf0;
}

.student-name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.assessment-indicator {
  font-size: 0.9rem;
  color: #999;
  min-width: 1.2rem;
}

.assessment-indicator.filled {
  color: #4caf50;
  font-weight: bold;
}

.student-name {
  font-weight: 500;
  font-size: 1rem;
}

.student-preview {
  flex: 1;
  font-size: 0.8rem;
  color: #666;
  margin: 0 0.5rem;
  overflow: hidden;
}

.preview-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  font-size: 0.75rem;
  padding: 0 0.25rem;
  flex-shrink: 0;
}

.assessment-form {
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
  background: white;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.verbal-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9375rem;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
  line-height: 1.5;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.verbal-textarea:focus {
  gap: 0.4rem;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
}

.required-marker {
  color: #c00;
  margin-left: 0.2rem;
}

.form-textarea {
  padding: 0.6rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
}

.form-textarea:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.15);
}

.verbal-textarea:disabled {
  background-color: #f9fafb;
  cursor: not-allowed;
}

.loading-state,
.error-state,
.empty-state {
.scale-options {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.scale-option {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.scale-label {
  font-weight: 500;
}

.scale-desc {
  color: #666;
  font-size: 0.8rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn-primary, .btn-text {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  touch-action: manipulation;
  min-height: 44px;
}

.btn-primary {
  background-color: #0066cc;
  color: white;
}

.btn-primary:hover {
  background-color: #0052a3;
}

.btn-primary:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-text {
  background: transparent;
  color: #0066cc;
  border: 1px solid #0066cc;
}

.btn-text:hover {
  background: #f0f7ff;
}

.btn-small {
  padding: 0.4rem 0.85rem;
  font-size: 0.85rem;
  min-height: 36px;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #666;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #0066cc;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.btn-primary {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  min-height: 44px;
  background-color: #0066cc;
  color: white;
  white-space: nowrap;
}

.btn-primary:hover {
  background-color: #0052a3;
}

.btn-primary:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .bulk-save-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-primary {
    width: 100%;
  }
}
</style>
