<template>
  <div class="grading-overview-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← Zurück</button>
      <h2>Bewertungsübersicht</h2>
      <p class="page-description">Verwalten Sie Bewertungskategorien und erfassen Sie Noten.</p>
    </div>
    
    <div class="grading-content">
      <!-- Class Selection -->
      <section class="card">
        <h3>Klasse auswählen</h3>
        <div class="form-section">
          <select 
            v-model="selectedClassId" 
            class="form-select"
            @change="onClassChange"
          >
            <option value="">Klasse auswählen...</option>
            <option 
              v-for="cls in classes" 
              :key="cls.id" 
              :value="cls.id"
            >
              {{ cls.name }} ({{ cls.schoolYear }})
            </option>
          </select>
        </div>
      </section>

      <!-- No Class Selected -->
      <div v-if="!selectedClassId" class="empty-state">
        <p>Wählen Sie eine Klasse, um Bewertungskategorien zu sehen.</p>
      </div>

      <!-- Loading State -->
      <div v-else-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Kategorien werden geladen...</p>
      </div>

      <!-- Grade Categories -->
      <div v-else-if="selectedClassId">
        <section class="card">
          <div class="card-header">
            <h3>Bewertungskategorien</h3>
            <button class="btn-primary btn-small" @click="showCreateCategoryModal = true">
              + Neue Kategorie
            </button>
          </div>
          
          <div class="card-content">
            <div v-if="categories.length === 0" class="empty-state">
              <p>Noch keine Bewertungskategorien. Erstellen Sie Ihre erste Kategorie.</p>
            </div>
            
            <div v-else class="category-list">
              <div 
                v-for="category in categories" 
                :key="category.id"
                class="category-card"
              >
                <div class="category-info">
                  <h4>{{ category.name }}</h4>
                  <p class="category-type">{{ getCategoryTypeLabel(category.type) }}</p>
                  <p class="category-weight">Gewicht: {{ category.weight }}%</p>
                  <p v-if="category.description" class="category-description">
                    {{ category.description }}
                  </p>
                </div>
                
                <div class="category-actions">
                  <button 
                    class="btn-secondary btn-small"
                    @click="openGradingEntry(category)"
                  >
                    Noten erfassen
                  </button>
                  <button 
                    class="btn-text btn-small"
                    @click="viewHistory(category)"
                  >
                    Historie
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Grade Progress Summary -->
        <section class="card" v-if="categories.length > 0 && students.length > 0">
          <h3>Bewertungsfortschritt</h3>
          <div class="card-content">
            <div class="progress-table-wrapper">
              <table class="progress-table">
                <thead>
                  <tr>
                    <th>Schüler</th>
                    <th v-for="category in categories" :key="category.id" :title="category.name">
                      {{ category.name }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="student in students" :key="student.id">
                    <td class="student-name">
                      {{ student.firstName }} {{ student.lastName }}
                    </td>
                    <td 
                      v-for="category in categories" 
                      :key="category.id"
                      class="grade-cell"
                    >
                      <span 
                        v-if="getStudentGrade(student.id, category.id)"
                        class="grade-value"
                      >
                        {{ formatGrade(getStudentGrade(student.id, category.id)) }}
                      </span>
                      <span v-else class="grade-missing">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- Create Category Modal -->
    <div v-if="showCreateCategoryModal" class="modal-overlay" @click="showCreateCategoryModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Neue Bewertungskategorie</h3>
          <button class="close-btn" @click="showCreateCategoryModal = false">×</button>
        </div>
        <div class="modal-content">
          <form @submit.prevent="createCategory">
            <div class="form-group">
              <label for="category-name">Name*</label>
              <input 
                id="category-name"
                v-model="newCategory.name" 
                type="text" 
                required
                placeholder="z.B. Ausdauer, Technik, Teamfähigkeit"
              />
            </div>
            
            <div class="form-group">
              <label for="category-description">Beschreibung</label>
              <textarea 
                id="category-description"
                v-model="newCategory.description"
                rows="3"
                placeholder="Optionale Beschreibung..."
              ></textarea>
            </div>
            
            <div class="form-group">
              <label for="category-type">Typ*</label>
              <select 
                id="category-type"
                v-model="newCategory.type" 
                required
              >
                <option value="">Typ auswählen...</option>
                <option value="criteria">Kriterienbasiert</option>
                <option value="time">Zeitbasiert</option>
                <option value="cooper">Cooper-Test</option>
                <option value="verbal">Verbal</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="category-weight">Gewicht (%)*</label>
              <input 
                id="category-weight"
                v-model.number="newCategory.weight" 
                type="number" 
                min="0" 
                max="100"
                required
                placeholder="0-100"
              />
            </div>
            
            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="showCreateCategoryModal = false">
                Abbrechen
              </button>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? 'Wird erstellt...' : 'Erstellen' }}
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
import { useRouter } from 'vue-router';
import { useDatabase } from '../composables/useDatabase';
import type { ClassGroup, Student, GradeCategory, PerformanceEntry, GradeCategoryType } from '@viccoboard/core';

const router = useRouter();
const { sportBridge } = useDatabase();

const classes = ref<ClassGroup[]>([]);
const selectedClassId = ref<string>('');
const categories = ref<GradeCategory[]>([]);
const students = ref<Student[]>([]);
const performanceEntries = ref<PerformanceEntry[]>([]);
const loading = ref(false);
const saving = ref(false);
const showCreateCategoryModal = ref(false);

const newCategory = ref({
  name: '',
  description: '',
  type: '' as GradeCategoryType | '',
  weight: 0
});

onMounted(async () => {
  await loadClasses();
});

async function loadClasses() {
  try {
    classes.value = await sportBridge.value.classGroupRepository.findAll();
  } catch (error) {
    console.error('Failed to load classes:', error);
  }
}

async function onClassChange() {
  if (!selectedClassId.value) {
    categories.value = [];
    students.value = [];
    performanceEntries.value = [];
    return;
  }
  
  loading.value = true;
  try {
    // Load categories, students, and performance entries
    categories.value = await sportBridge.value.gradeCategoryRepository.findByClassGroup(selectedClassId.value);
    students.value = await sportBridge.value.studentRepository.findByClassGroup(selectedClassId.value);
    
    // Load all performance entries for students in this class in parallel
    const entryPromises = students.value.map((student) =>
      sportBridge.value.performanceEntryRepository.findByStudent(student.id)
    );
    const entriesPerStudent = await Promise.all(entryPromises);
    performanceEntries.value = entriesPerStudent.flat();
  } catch (error) {
    console.error('Failed to load grading data:', error);
  } finally {
    loading.value = false;
  }
}

function getCategoryTypeLabel(type: GradeCategoryType): string {
  const labels: Record<GradeCategoryType, string> = {
    criteria: 'Kriterienbasiert',
    time: 'Zeitbasiert',
    cooper: 'Cooper-Test',
    sportabzeichen: 'Sportabzeichen',
    bjs: 'Bundesjugendspiele',
    verbal: 'Verbal'
  };
  return labels[type] || type;
}

function getStudentGrade(studentId: string, categoryId: string): string | number | null {
  const entry = performanceEntries.value.find(
    e => e.studentId === studentId && e.categoryId === categoryId
  );
  return entry?.calculatedGrade || null;
}

function formatGrade(grade: string | number | null): string {
  if (grade === null || grade === undefined) return '—';
  return String(grade);
}

function openGradingEntry(category: GradeCategory) {
  if (category.type === 'criteria') {
    router.push(`/grading/criteria/${category.id}`);
  } else if (category.type === 'time') {
    router.push(`/grading/time/${category.id}`);
  } else {
    alert('Dieser Bewertungstyp wird noch nicht unterstützt.');
  }
}

function viewHistory(category: GradeCategory) {
  router.push(`/grading/history/${category.id}`);
}

async function createCategory() {
  if (!selectedClassId.value) return;
  if (!newCategory.value.name || !newCategory.value.type) return;
  
  saving.value = true;
  try {
    // Create default configuration based on type
    let configuration: any;
    
    if (newCategory.value.type === 'criteria') {
      configuration = {
        type: 'criteria',
        criteria: [],
        allowSelfAssessment: false,
        selfAssessmentViaWOW: false
      };
    } else if (newCategory.value.type === 'time') {
      configuration = {
        type: 'time',
        bestGrade: 1,
        worstGrade: 6,
        linearMapping: true,
        adjustableAfterwards: true
      };
    } else if (newCategory.value.type === 'cooper') {
      configuration = {
        type: 'cooper',
        sportType: 'running',
        distanceUnit: 'meters',
        autoEvaluation: true
      };
    } else if (newCategory.value.type === 'verbal') {
      configuration = {
        type: 'verbal',
        fields: [],
        scales: [],
        exportFormat: 'text'
      };
    } else {
      throw new Error('Unsupported category type');
    }
    
    await sportBridge.value.createGradeCategoryUseCase.execute({
      classGroupId: selectedClassId.value,
      name: newCategory.value.name,
      description: newCategory.value.description || undefined,
      type: newCategory.value.type as GradeCategoryType,
      weight: newCategory.value.weight,
      configuration
    });
    
    // Reset form
    newCategory.value = { name: '', description: '', type: '', weight: 0 };
    showCreateCategoryModal.value = false;
    
    // Reload categories
    await onClassChange();
  } catch (error) {
    console.error('Failed to create category:', error);
    let userMessage = 'Die Kategorie konnte nicht erstellt werden.';
    if (error instanceof Error) {
      if (error.message === 'Unsupported category type') {
        userMessage = 'Die ausgewählte Bewertungskategorie wird nicht unterstützt. Bitte wählen Sie einen anderen Typ.';
      } else if (error.message && error.message.trim().length > 0) {
        userMessage = `Die Kategorie konnte nicht erstellt werden: ${error.message}`;
      }
    }
    alert(userMessage);
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.grading-overview-view {
  padding: 1rem;
  max-width: 1400px;
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

.card-content {
  margin-top: 1rem;
}

.form-section {
  margin-bottom: 1rem;
}

.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background-color: white;
  cursor: pointer;
  touch-action: manipulation;
  min-height: 44px;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #666;
}

.loading-state {
  text-align: center;
  padding: 3rem 1rem;
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

.category-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.category-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.category-info h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: #333;
}

.category-type {
  font-size: 0.875rem;
  color: #666;
  margin: 0.25rem 0;
}

.category-weight {
  font-size: 0.875rem;
  color: #666;
  margin: 0.25rem 0;
  font-weight: 500;
}

.category-description {
  font-size: 0.875rem;
  color: #888;
  margin: 0.5rem 0 0 0;
}

.category-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-primary, .btn-secondary, .btn-text {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  touch-action: manipulation;
  min-height: 44px;
  min-width: 44px;
  white-space: nowrap;
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

.btn-text {
  background-color: transparent;
  color: #0066cc;
  border: 1px solid #0066cc;
}

.btn-text:hover {
  background-color: #f0f7ff;
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  min-height: 44px;
}

.progress-table-wrapper {
  overflow-x: auto;
  margin-top: 1rem;
}

.progress-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.progress-table th,
.progress-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.progress-table th {
  background-color: #f5f5f5;
  font-weight: 600;
  color: #333;
  position: sticky;
  top: 0;
}

.progress-table .student-name {
  font-weight: 500;
}

.grade-cell {
  text-align: center;
}

.grade-value {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background-color: #e6f7e6;
  color: #2d6a2d;
  border-radius: 4px;
  font-weight: 500;
}

.grade-missing {
  color: #999;
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
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-btn:hover {
  background-color: #f0f0f0;
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
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
  box-sizing: border-box;
  min-height: 44px;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .category-card {
    flex-direction: column;
  }
  
  .category-actions {
    flex-direction: row;
    width: 100%;
  }
  
  .category-actions button {
    flex: 1;
  }
  
  .progress-table {
    font-size: 0.75rem;
  }
  
  .progress-table th,
  .progress-table td {
    padding: 0.5rem;
  }
}
</style>
