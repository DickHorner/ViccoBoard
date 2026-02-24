<template>
  <div class="criteria-grading-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← Zurück</button>
      <h2>{{ category?.name || 'Kriterienbasierte Bewertung' }}</h2>
      <p class="page-description">
        Erfassen Sie Bewertungen basierend auf definierten Kriterien.
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
            <span>Kriterienbasiert</span>
          </div>
          <div class="info-item">
            <label>Gewicht:</label>
            <span>{{ category.weight }}%</span>
          </div>
          <div class="info-item">
            <label>Kriterien:</label>
            <span>{{ criteria.length }}</span>
          </div>
        </div>
        
        <!-- Add Criteria Button -->
        <div class="criteria-actions">
          <button 
            class="btn-secondary btn-small"
            @click="showAddCriterionModal = true"
            v-if="criteria.length < 8"
          >
            + Kriterium hinzufügen
          </button>
          <span v-if="criteria.length >= 8" class="info-note">
            Maximum 8 Kriterien erreicht
          </span>
        </div>
        
        <!-- Criteria List -->
        <div v-if="criteria.length > 0" class="criteria-list">
          <div v-for="(criterion, index) in criteria" :key="criterion.id" class="criterion-item">
            <div class="criterion-info">
              <strong>{{ criterion.name }}</strong>
              <span class="criterion-range">
                ({{ criterion.minValue }} - {{ criterion.maxValue }} Punkte, Gewicht: {{ criterion.weight }}%)
              </span>
              <p v-if="criterion.description" class="criterion-description">
                {{ criterion.description }}
              </p>
            </div>
            <button 
              class="btn-danger-text btn-small"
              @click="removeCriterion(index)"
              :disabled="saving"
            >
              Entfernen
            </button>
          </div>
        </div>
        
        <div v-else class="empty-state-small">
          <p>Keine Kriterien definiert. Fügen Sie Kriterien hinzu, um mit der Bewertung zu beginnen.</p>
        </div>
      </section>

      <!-- Grading Entry Table -->
      <section class="card" v-if="criteria.length > 0 && students.length > 0">
        <div class="card-header">
          <h3>Bewertungseingabe</h3>
          <div class="header-actions">
            <button 
              class="btn-secondary btn-small"
              @click="toggleBulkMode"
            >
              {{ bulkMode ? 'Einzelmodus' : 'Bulk-Modus' }}
            </button>
            <button 
              class="btn-primary btn-small"
              @click="saveAllGrades"
              :disabled="saving || !hasUnsavedChanges"
            >
              {{ saving ? 'Speichern...' : 'Alle speichern' }}
            </button>
          </div>
        </div>
        
        <div class="card-content">
          <p class="info-note">
            💡 Änderungen werden automatisch gespeichert. Bewegen Sie sich zwischen Feldern mit Tab.
          </p>
          
          <div class="grading-table-wrapper">
            <table class="grading-table">
              <thead>
                <tr>
                  <th class="student-col">Schüler</th>
                  <th 
                    v-for="criterion in criteria" 
                    :key="criterion.id"
                    class="criterion-col"
                    :title="criterion.name"
                  >
                    {{ criterion.name }}
                    <br>
                    <span class="col-subtitle">({{ criterion.minValue }}-{{ criterion.maxValue }})</span>
                  </th>
                  <th class="total-col">Gesamt</th>
                  <th class="grade-col">Note</th>
                  <th class="actions-col">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="student in students" 
                  :key="student.id"
                  :class="{ 'highlight-row': hasUnsavedChangesForStudent(student.id) }"
                >
                  <td class="student-name">
                    {{ student.firstName }} {{ student.lastName }}
                  </td>
                  <td 
                    v-for="criterion in criteria" 
                    :key="criterion.id"
                    class="input-cell"
                  >
                    <input 
                      type="number"
                      :min="criterion.minValue"
                      :max="criterion.maxValue"
                      :step="0.5"
                      :value="getGradeValue(student.id, criterion.id)"
                      @input="onGradeChange(student.id, criterion.id, ($event.target as HTMLInputElement)?.value)"
                      @blur="saveStudentGrade(student.id)"
                      class="grade-input"
                      :disabled="saving"
                    />
                  </td>
                  <td class="total-cell">
                    <strong>{{ calculateTotal(student.id).toFixed(1) }}</strong>
                  </td>
                  <td class="grade-cell">
                    <span class="calculated-grade">
                      {{ calculateGrade(student.id) }}
                    </span>
                  </td>
                  <td class="actions-cell">
                    <button 
                      class="btn-text-small"
                      @click="addComment(student.id)"
                      :title="'Kommentar hinzufügen'"
                    >
                      💬
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- No Students -->
      <section class="card" v-if="students.length === 0">
        <div class="empty-state">
          <p>Keine Schüler in dieser Klasse gefunden.</p>
        </div>
      </section>
    </div>

    <!-- Add Criterion Modal -->
    <div v-if="showAddCriterionModal" class="modal-overlay" @click="showAddCriterionModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Kriterium hinzufügen</h3>
          <button class="close-btn" @click="showAddCriterionModal = false">×</button>
        </div>
        <div class="modal-content">
          <form @submit.prevent="addCriterion">
            <div class="form-group">
              <label for="criterion-name">Name*</label>
              <input 
                id="criterion-name"
                v-model="newCriterion.name" 
                type="text" 
                required
                placeholder="z.B. Technik, Taktik, Teamwork"
              />
            </div>
            
            <div class="form-group">
              <label for="criterion-description">Beschreibung</label>
              <textarea 
                id="criterion-description"
                v-model="newCriterion.description"
                rows="2"
                placeholder="Optionale Beschreibung..."
              ></textarea>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="criterion-min">Min. Punkte*</label>
                <input 
                  id="criterion-min"
                  v-model.number="newCriterion.minValue" 
                  type="number" 
                  required
                  min="0"
                />
              </div>
              
              <div class="form-group">
                <label for="criterion-max">Max. Punkte*</label>
                <input 
                  id="criterion-max"
                  v-model.number="newCriterion.maxValue" 
                  type="number" 
                  required
                  min="0"
                />
              </div>
            </div>
            
            <div class="form-group">
              <label for="criterion-weight">Gewicht (%)*</label>
              <input 
                id="criterion-weight"
                v-model.number="newCriterion.weight" 
                type="number" 
                min="0" 
                max="100"
                required
                placeholder="0-100"
              />
              <small>Verbleibende Gewichtung: {{ remainingWeight }}%</small>
            </div>
            
            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="showAddCriterionModal = false">
                Abbrechen
              </button>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? 'Hinzufügen...' : 'Hinzufügen' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Comment Modal -->
    <div v-if="showCommentModal" class="modal-overlay" @click="showCommentModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Kommentar hinzufügen</h3>
          <button class="close-btn" @click="showCommentModal = false">×</button>
        </div>
        <div class="modal-content">
          <form @submit.prevent="saveComment">
            <div class="form-group">
              <label for="comment-text">Kommentar</label>
              <textarea 
                id="comment-text"
                v-model="currentComment"
                rows="5"
                placeholder="Fügen Sie einen Kommentar hinzu..."
              ></textarea>
            </div>
            
            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="showCommentModal = false">
                Abbrechen
              </button>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? 'Speichern...' : 'Speichern' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useSportBridge } from '../composables/useSportBridge';
import { useStudents } from '../composables/useStudentsBridge';
import { useToast } from '../composables/useToast';
import { v4 as uuidv4 } from 'uuid';
import type { Sport} from '@viccoboard/core';

const route = useRoute();
const { SportBridge, gradeCategories, performanceEntries } = useSportBridge();
const { repository: studentRepository } = useStudents();
const toast = useToast();

const categoryId = route.params.id as string;
const category = ref<Sport.GradeCategory | null>(null);
const students = ref<any[]>([]);
const gradeEntries = ref<Map<string, Map<string, number>>>(new Map());
const comments = ref<Map<string, string>>(new Map());
const loading = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);
const bulkMode = ref(false);
const hasUnsavedChanges = ref(false);
const unsavedStudents = ref<Set<string>>(new Set());

const showAddCriterionModal = ref(false);
const showCommentModal = ref(false);
const currentCommentStudentId = ref<string | null>(null);
const currentComment = ref('');

const newCriterion = ref({
  name: '',
  description: '',
  minValue: 0,
  maxValue: 10,
  weight: 100
});

const criteria = computed(() => {
  if (!category.value) return [];
  const config = category.value.configuration as any;
  return config.criteria || [];
});

const remainingWeight = computed(() => {
  const totalWeight = criteria.value.reduce((sum: number, c: any) => sum + c.weight, 0);
  return Math.max(0, 100 - totalWeight);
});

onMounted(async () => {
  await loadData();
});

async function loadData() {
  loading.value = true;
  error.value = null;
  
  try {
    // Load category
    category.value = await gradeCategories.value?.findById(categoryId) ?? null;
    
    if (!category.value) {
      error.value = 'Kategorie nicht gefunden';
      return;
    }
    
    // Load students
    students.value = await studentRepository.value?.findByClassGroup(
      category.value.classGroupId
    ) ?? [];
    
    // Load existing grades
    for (const student of students.value) {
      const entries = await performanceEntries.value
        ?.findByStudentAndCategory(student.id, categoryId) ?? [];
      
      if (entries.length > 0) {
        const latestEntry = entries[entries.length - 1];
        const studentGrades = new Map<string, number>();
        
        // Parse measurements
        if (latestEntry.measurements) {
          Object.entries(latestEntry.measurements).forEach(([criterionId, value]) => {
            studentGrades.set(criterionId, value as number);
          });
        }
        
        gradeEntries.value.set(student.id, studentGrades);
        
        if (latestEntry.comment) {
          comments.value.set(student.id, latestEntry.comment);
        }
      }
    }
  } catch (err) {
    console.error('Failed to load grading data:', err);
    error.value = 'Fehler beim Laden der Daten';
  } finally {
    loading.value = false;
  }
}

function getGradeValue(studentId: string, criterionId: string): number | '' {
  const value = gradeEntries.value.get(studentId)?.get(criterionId);
  return value === undefined ? '' : value;
}

function onGradeChange(
  studentId: string,
  criterionId: string,
  rawValue?: unknown
): void {
  // Mark student as having unsaved changes
  hasUnsavedChanges.value = true;
  unsavedStudents.value.add(studentId);

  // Derive numeric value from various possible input forms
  let value: number | undefined;

  if (typeof rawValue === 'number') {
    value = rawValue;
  } else if (typeof rawValue === 'string') {
    const parsed = Number(rawValue);
    value = Number.isNaN(parsed) ? undefined : parsed;
  } else if (rawValue && typeof rawValue === 'object' && 'target' in (rawValue as any)) {
    const eventTarget = (rawValue as { target: unknown }).target as HTMLInputElement | null;
    if (eventTarget && typeof eventTarget.value === 'string') {
      const parsed = Number(eventTarget.value);
      value = Number.isNaN(parsed) ? undefined : parsed;
    }
  }

  // Ensure there is a grade map for this student
  let studentGrades = gradeEntries.value.get(studentId);
  if (!studentGrades) {
    studentGrades = new Map<string, number>();
    gradeEntries.value.set(studentId, studentGrades);
  }

  // Update or remove the grade entry for this criterion
  if (value === undefined) {
    studentGrades.delete(criterionId);
  } else {
    studentGrades.set(criterionId, value);
  }
}

function hasUnsavedChangesForStudent(studentId: string): boolean {
  return unsavedStudents.value.has(studentId);
}

function calculateTotal(studentId: string): number {
  const studentGrades = gradeEntries.value.get(studentId);
  if (!studentGrades) return 0;
  
  let total = 0;
  for (const criterion of criteria.value) {
    const value = studentGrades.get(criterion.id) || 0;
    total += value * (criterion.weight / 100);
  }
  
  return total;
}

const DEFAULT_GRADING_THRESHOLDS: Array<{ minPercentage: number; grade: string }> = [
  { minPercentage: 92, grade: '1' },
  { minPercentage: 81, grade: '2' },
  { minPercentage: 67, grade: '3' },
  { minPercentage: 50, grade: '4' },
  { minPercentage: 30, grade: '5' },
  { minPercentage: 0, grade: '6' }
];

function calculateGrade(studentId: string): string {
  const total = calculateTotal(studentId);
  
  // Determine the maximum possible weighted score based on criteria
  const maxPossible = criteria.value.reduce(
    (sum: number, c: any) => sum + (c.maxValue * (c.weight / 100)),
    0
  );
  
  if (maxPossible === 0) return '—';
  
  const percentage = (total / maxPossible) * 100;
  
  // Allow category-specific grading scales when available, otherwise fall back to default
  const categoryGradingScale = (category.value as any)?.gradingScale as
    Array<{ minPercentage: number; grade: string }> | undefined;
  const gradingScale =
    categoryGradingScale && categoryGradingScale.length > 0
      ? categoryGradingScale
      : DEFAULT_GRADING_THRESHOLDS;

  for (const threshold of gradingScale) {
    if (percentage >= threshold.minPercentage) {
      return threshold.grade;
    }
  }

  // Fallback: return the lowest grade defined in the scale
  return gradingScale[gradingScale.length - 1]?.grade ?? '—';
}

async function saveStudentGrade(studentId: string) {
  if (!unsavedStudents.value.has(studentId)) return;
  
  const studentGrades = gradeEntries.value.get(studentId);
  if (!studentGrades) return;
  
  saving.value = true;
  try {
    const measurements: Record<string, any> = {};
    studentGrades.forEach((value, criterionId) => {
      measurements[criterionId] = value;
    });
    
    await SportBridge.value?.recordGradeUseCase.execute({
      studentId,
      categoryId,
      measurements,
      calculatedGrade: calculateGrade(studentId),
      comment: comments.value.get(studentId)
    });
    
    unsavedStudents.value.delete(studentId);
    if (unsavedStudents.value.size === 0) {
      hasUnsavedChanges.value = false;
    }
  } catch (err) {
    console.error('Failed to save grade:', err);
    toast.error('Fehler beim Speichern der Note');
  } finally {
    saving.value = false;
  }
}

async function saveAllGrades() {
  saving.value = true;
  try {
    for (const studentId of unsavedStudents.value) {
      await saveStudentGrade(studentId);
    }
    toast.success('Alle Noten gespeichert!');
  } catch (err) {
    console.error('Failed to save all grades:', err);
    toast.error('Fehler beim Speichern einiger Noten');
  } finally {
    saving.value = false;
  }
}

async function addCriterion() {
  if (!newCriterion.value.name || !category.value) return;
  
  if (newCriterion.value.weight > remainingWeight.value) {
    toast.warning(`Die Gewichtung darf ${remainingWeight.value}% nicht überschreiten.`);
    return;
  }
  
  // Validate minValue < maxValue
  if (newCriterion.value.minValue >= newCriterion.value.maxValue) {
    toast.error('Der Minimalwert muss kleiner als der Maximalwert sein.');
    return;
  }
  
  saving.value = true;
  try {
    const config = category.value.configuration as any;
    const updatedCriteria = [
      ...config.criteria,
      {
        id: uuidv4(),
        name: newCriterion.value.name,
        description: newCriterion.value.description || undefined,
        weight: newCriterion.value.weight,
        minValue: newCriterion.value.minValue,
        maxValue: newCriterion.value.maxValue
      }
    ];
    
    const updatedConfig: any = {
      ...config,
      criteria: updatedCriteria
    };
    
    const updatedCategory = {
      ...category.value,
      configuration: updatedConfig,
      lastModified: new Date()
    };
    
    await gradeCategories.value?.update(
      category.value.id,
      updatedCategory
    );
    
    category.value = updatedCategory;
    
    // Reset form
    newCriterion.value = {
      name: '',
      description: '',
      minValue: 0,
      maxValue: 10,
      weight: 100
    };
    showAddCriterionModal.value = false;
  } catch (err) {
    console.error('Failed to add criterion:', err);
    toast.error('Fehler beim Hinzufügen des Kriteriums');
  } finally {
    saving.value = false;
  }
}

async function removeCriterion(index: number) {
  if (!category.value) return;
  if (!confirm('Möchten Sie dieses Kriterium wirklich entfernen?')) return;
  
  saving.value = true;
  try {
    const config = category.value.configuration as any;
    const updatedCriteria = config.criteria.filter((_: any, i: number) => i !== index);
    
    const updatedConfig: any = {
      ...config,
      criteria: updatedCriteria
    };
    
    const updatedCategory = {
      ...category.value,
      configuration: updatedConfig,
      lastModified: new Date()
    };
    
    await gradeCategories.value?.update(
      category.value.id,
      updatedCategory
    );
    
    category.value = updatedCategory;
  } catch (err) {
    console.error('Failed to remove criterion:', err);
    toast.error('Fehler beim Entfernen des Kriteriums');
  } finally {
    saving.value = false;
  }
}

function toggleBulkMode() {
  toast.info('Der Bulk-Modus ist derzeit nicht verfügbar.');
}

function addComment(studentId: string) {
  currentCommentStudentId.value = studentId;
  currentComment.value = comments.value.get(studentId) || '';
  showCommentModal.value = true;
}

async function saveComment() {
  if (!currentCommentStudentId.value) return;
  
  comments.value.set(currentCommentStudentId.value, currentComment.value);
  unsavedStudents.value.add(currentCommentStudentId.value);
  hasUnsavedChanges.value = true;
  
  await saveStudentGrade(currentCommentStudentId.value);
  
  showCommentModal.value = false;
  currentCommentStudentId.value = null;
  currentComment.value = '';
}
</script>

<style scoped>
/* Reuse most styles from GradingOverview, add specific ones */
.criteria-grading-view {
  padding: 1rem;
  max-width: 1600px;
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
  margin: 0.5rem 0;
}

.back-button {
  background: none;
  border: none;
  color: #0066cc;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem 0;
  margin-bottom: 0.5rem;
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
  flex-wrap: wrap;
  gap: 1rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
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

.criteria-actions {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.criteria-list {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.criterion-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.75rem;
  background-color: #f9f9f9;
  border-radius: 4px;
  gap: 1rem;
}

.criterion-info {
  flex: 1;
}

.criterion-info strong {
  display: block;
  margin-bottom: 0.25rem;
  color: #333;
}

.criterion-range {
  font-size: 0.875rem;
  color: #666;
}

.criterion-description {
  margin: 0.5rem 0 0 0;
  font-size: 0.875rem;
  color: #888;
}

.info-note {
  display: block;
  padding: 0.75rem;
  background-color: #e6f7ff;
  border-left: 3px solid #0066cc;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.grading-table-wrapper {
  overflow-x: auto;
  margin-top: 1rem;
}

.grading-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  min-width: 800px;
}

.grading-table th,
.grading-table td {
  padding: 0.75rem 0.5rem;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.grading-table th {
  background-color: #f5f5f5;
  font-weight: 600;
  color: #333;
  position: sticky;
  top: 0;
  z-index: 10;
}

.col-subtitle {
  font-size: 0.75rem;
  font-weight: 400;
  color: #666;
}

.student-name {
  font-weight: 500;
  white-space: nowrap;
}

.input-cell {
  text-align: center;
}

.grade-input {
  width: 70px;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
  font-size: 0.875rem;
}

.grade-input:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
}

.total-cell,
.grade-cell {
  text-align: center;
}

.calculated-grade {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background-color: #e6f7e6;
  color: #2d6a2d;
  border-radius: 4px;
  font-weight: 600;
}

.highlight-row {
  background-color: #fff9e6;
}

.actions-cell {
  text-align: center;
}

.btn-text-small {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
  min-width: 32px;
  min-height: 32px;
}

.btn-danger-text {
  background: none;
  border: none;
  color: #d32f2f;
  cursor: pointer;
  padding: 0.5rem;
  font-size: 0.875rem;
}

.btn-danger-text:hover {
  text-decoration: underline;
}

.empty-state,
.loading-state,
.error-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #666;
}

.empty-state-small {
  padding: 1.5rem;
  text-align: center;
  color: #666;
  background-color: #f9f9f9;
  border-radius: 4px;
  margin-top: 1rem;
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

.btn-primary, .btn-secondary {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
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

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  min-height: 44px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 8px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 32px;
  height: 32px;
}

.modal-content {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
  box-sizing: border-box;
  min-height: 44px;
}

.form-group small {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #666;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .grading-table {
    font-size: 0.75rem;
  }
  
  .grade-input {
    width: 60px;
    padding: 0.375rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .header-actions {
    width: 100%;
  }
  
  .header-actions button {
    flex: 1;
  }
}
</style>

