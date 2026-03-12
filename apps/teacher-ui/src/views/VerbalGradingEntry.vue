<template>
  <div class="verbal-grading-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← Zurück</button>
      <h2>{{ category?.name || 'Verbalbeurteilung' }}</h2>
      <p class="page-description">
        Erfassen Sie Verbalbeurteilungen für jeden Schüler.
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
          <div class="info-item" v-if="category.description">
            <label>Beschreibung:</label>
            <span>{{ category.description }}</span>
          </div>
        </div>
      </section>

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
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getSportBridge } from '../composables/useSportBridge';
import { getStudentsBridge } from '../composables/useStudentsBridge';
import { useToast } from '../composables/useToast';
import type { Sport } from '@viccoboard/core';

const route = useRoute();
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

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.category-info-card .info-grid {
  margin-top: 0;
}

@media (max-width: 600px) {
  .student-preview {
    display: none;
  }
}
</style>
