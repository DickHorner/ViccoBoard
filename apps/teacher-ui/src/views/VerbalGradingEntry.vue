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
        <h3>Kategorieinformationen</h3>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useSportBridge } from '../composables/useSportBridge';
import { useStudents } from '../composables/useStudentsBridge';
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
}

.page-description {
  color: #666;
  margin: 0;
  font-size: 0.9rem;
}

.back-button {
  background: none;
  border: none;
  color: #0066cc;
  cursor: pointer;
  padding: 0;
  font-size: 0.9rem;
}

.back-button:hover {
  text-decoration: underline;
}

.card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.card-unsaved {
  border-left: 4px solid #f59e0b;
}

.card-saved {
  border-left: 4px solid #22c55e;
}

.category-info-card h3 {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  color: #333;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-item label {
  font-weight: 600;
  color: #666;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.info-item span {
  color: #333;
}

.bulk-save-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.info-note {
  display: block;
  padding: 0.75rem;
  background-color: #e6f7ff;
  border-left: 3px solid #0066cc;
  font-size: 0.875rem;
  flex: 1;
  margin: 0;
}

.student-card {
  transition: border-color 0.15s;
}

.student-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  gap: 1rem;
}

.student-header h4 {
  margin: 0;
  font-size: 1rem;
  color: #1a1a1a;
}

.badge-saved {
  font-size: 0.75rem;
  color: #15803d;
  font-weight: 600;
}

.badge-unsaved {
  font-size: 0.75rem;
  color: #b45309;
  font-weight: 600;
}

.badge-empty {
  font-size: 0.75rem;
  color: #9ca3af;
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
