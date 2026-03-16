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

<style scoped src="./VerbalGradingEntry.css"></style>
