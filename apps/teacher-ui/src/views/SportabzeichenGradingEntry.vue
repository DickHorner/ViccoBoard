<template>
  <div class="sportabzeichen-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← {{ t('COMMON.back') }}</button>
      <h2>{{ t('SPORTABZEICHEN.title') }}</h2>
      <p class="info-text">{{ t('SPORTABZEICHEN.explainer') }}</p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>{{ t('COMMON.loading') }}</p>
    </div>

    <div v-else class="content">
      <!-- Discipline Category Tabs -->
      <section class="card">
        <div class="discipline-tabs">
          <button 
            v-for="cat in disciplineCategories" 
            :key="cat"
            :class="{ active: selectedCategory === cat }"
            @click="selectedCategory = cat"
            class="tab-button"
          >
            {{ t(`SPORTABZEICHEN.${cat}`) }}
          </button>
        </div>
      </section>

      <!-- Student Grading Table -->
      <section class="card">
        <div class="card-header">
          <h3>{{ t(`SPORTABZEICHEN.${selectedCategory}`) }}</h3>
          <button 
            v-if="hasChanges" 
            class="btn-primary btn-small"
            @click="saveAll"
            :disabled="saving"
          >
            {{ saving ? t('COMMON.syncing') : t('COMMON.save') }}
          </button>
        </div>

        <div class="table-wrapper">
          <table class="grading-table">
            <thead>
              <tr>
                <th>{{ t('SCHUELER.name') }}</th>
                <th>{{ t('SPORTABZEICHEN.disziplin') }}</th>
                <th>{{ t('SPORTABZEICHEN.leistung') }}</th>
                <th>{{ t('SPORTABZEICHEN.bronze') }}</th>
                <th>{{ t('SPORTABZEICHEN.silber') }}</th>
                <th>{{ t('SPORTABZEICHEN.gold') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in students" :key="student.id">
                <td class="student-name">
                  {{ student.firstName }} {{ student.lastName }}
                </td>
                <td>
                  <select 
                    v-model="disciplineSelections[student.id]"
                    class="discipline-select"
                    @change="onDisciplineChange(student.id)"
                  >
                    <option value="">{{ t('CATEGORIES.select-grading-table') }}...</option>
                    <option 
                      v-for="disc in getFilteredDisciplines(selectedCategory)" 
                      :key="disc.id" 
                      :value="disc.id"
                    >
                      {{ disc.name }}
                    </option>
                  </select>
                </td>
                <td>
                  <input 
                    type="number" 
                    v-model.number="performances[student.id]"
                    class="performance-input"
                    step="0.01"
                    @input="onPerformanceChange(student.id)"
                  />
                </td>
                <td class="level-cell">
                  <span 
                    v-if="levels[student.id] && levels[student.id] !== 'none'"
                    class="level-badge"
                    :class="`level-${levels[student.id]}`"
                  >
                    {{ levels[student.id] === 'bronze' ? '🥉' : '' }}
                    {{ levels[student.id] === 'silver' ? '🥈' : '' }}
                    {{ levels[student.id] === 'gold' ? '🥇' : '' }}
                  </span>
                </td>
                <td class="level-cell">
                  <span 
                    v-if="levels[student.id] === 'silver' || levels[student.id] === 'gold'"
                    class="level-badge"
                    :class="`level-${levels[student.id]}`"
                  >
                    {{ levels[student.id] === 'silver' ? '🥈' : '' }}
                    {{ levels[student.id] === 'gold' ? '🥇' : '' }}
                  </span>
                </td>
                <td class="level-cell">
                  <span 
                    v-if="levels[student.id] === 'gold'"
                    class="level-badge level-gold"
                  >
                    🥇
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Overall Results Summary -->
      <section class="card">
        <h3>{{ t('SPORTABZEICHEN.gesamtergebnis') }}</h3>
        <div class="summary-grid">
          <div 
            v-for="student in students" 
            :key="student.id"
            class="summary-item"
          >
            <span class="student-name-summary">
              {{ student.firstName }} {{ student.lastName }}
            </span>
            <span 
              class="overall-level"
              :class="`level-${getOverallLevel(student.id)}`"
            >
              {{ getOverallLevel(student.id).toUpperCase() }}
            </span>
          </div>
        </div>
      </section>

      <!-- PDF Export -->
      <section class="card">
        <h3>PDF Export</h3>
        <button 
          class="btn-primary"
          @click="exportPdf"
          :disabled="exporting"
        >
          {{ exporting ? 'Erstelle PDF...' : 'Übersicht als PDF exportieren' }}
        </button>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useSportBridge } from '../composables/useSportBridge';
import { useStudents } from '../composables/useStudentsBridge';
import { useToast } from '../composables/useToast';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { sportBridge } = useSportBridge();
const { repository: studentRepository } = useStudents();
const toast = useToast();

const categoryId = route.params.id as string;
const loading = ref(true);
const saving = ref(false);
const exporting = ref(false);
const students = ref<any[]>([]);
const disciplineCategories = ['ausdauer', 'kraft', 'schnelligkeit', 'koordination'];
const selectedCategory = ref('ausdauer');

// Simplified discipline structure (in production, load from database)
const disciplines = ref<any[]>([
  { id: 'd1', name: '3000m Lauf', category: 'ausdauer' },
  { id: 'd2', name: 'Schwimmen 200m', category: 'ausdauer' },
  { id: 'd3', name: 'Standweitsprung', category: 'kraft' },
  { id: 'd4', name: 'Kugelstoßen', category: 'kraft' },
  { id: 'd5', name: 'Sprint 100m', category: 'schnelligkeit' },
  { id: 'd6', name: 'Seilspringen', category: 'koordination' }
]);

const disciplineSelections = ref<Record<string, string>>({});
const performances = ref<Record<string, number>>({});
const levels = ref<Record<string, string>>({});
const studentResults = ref<Record<string, any[]>>({});
const hasChanges = ref(false);

onMounted(async () => {
  await loadData();
});

async function loadData() {
  loading.value = true;
  try {
    const category = await sportBridge.value?.gradeCategoryRepository.findById(categoryId) ?? null;
    if (!category) {
      toast.error('Kategorie nicht gefunden');
      router.back();
      return;
    }

    students.value = await studentRepository.value?.findByClassGroup(category.classGroupId) ?? [];

    // Load existing results
    for (const student of students.value) {
      studentResults.value[student.id] = [];
      // In production: load from sportabzeichenResultRepository
    }
  } catch (error) {
    console.error('Failed to load data:', error);
    toast.error('Fehler beim Laden der Daten');
  } finally {
    loading.value = false;
  }
}

function getFilteredDisciplines(category: string) {
  return disciplines.value.filter(d => d.category === category);
}

function onDisciplineChange(studentId: string) {
  hasChanges.value = true;
  onPerformanceChange(studentId);
}

function onPerformanceChange(studentId: string) {
  hasChanges.value = true;
  
  const disciplineId = disciplineSelections.value[studentId];
  const performance = performances.value[studentId];
  
  if (!disciplineId || !performance) {
    levels.value[studentId] = 'none';
    return;
  }
  
  // Simplified level calculation (in production, use SportabzeichenService.evaluatePerformance)
  // This is a placeholder
  if (performance > 0) {
    levels.value[studentId] = 'bronze';
    if (performance > 50) levels.value[studentId] = 'silver';
    if (performance > 80) levels.value[studentId] = 'gold';
  } else {
    levels.value[studentId] = 'none';
  }
}

function getOverallLevel(studentId: string): string {
  const results = studentResults.value[studentId] || [];
  if (results.length < 4) return 'none';
  
  // Overall level is determined by weakest discipline
  const levels = results.map(r => r.level);
  if (levels.every(l => l === 'gold')) return 'gold';
  if (levels.every(l => l === 'silver' || l === 'gold')) return 'silver';
  if (levels.every(l => l !== 'none')) return 'bronze';
  return 'none';
}

async function saveAll() {
  saving.value = true;
  try {
    for (const student of students.value) {
      const disciplineId = disciplineSelections.value[student.id];
      const performance = performances.value[student.id];
      const level = levels.value[student.id];
      
      if (!disciplineId || !performance || level === 'none') continue;
      
      // Save result (in production, use sportabzeichenResultRepository)
      // Placeholder: just store in memory
      if (!studentResults.value[student.id]) {
        studentResults.value[student.id] = [];
      }
      studentResults.value[student.id].push({
        disciplineId,
        performance,
        level
      });
    }
    
    hasChanges.value = false;
    toast.success(t('COMMON.success'));
  } catch (error) {
    console.error('Failed to save:', error);
    toast.error('Fehler beim Speichern');
  } finally {
    saving.value = false;
  }
}

async function exportPdf() {
  exporting.value = true;
  try {
    // Use SportabzeichenService.generateOverviewPdf in production
    toast.info('PDF Export wird in Kürze verfügbar sein');
  } catch (error) {
    console.error('Failed to export PDF:', error);
    toast.error('Fehler beim Exportieren');
  } finally {
    exporting.value = false;
  }
}
</script>

<style scoped>
.sportabzeichen-view {
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

.info-text {
  color: #666;
  font-size: 0.875rem;
  line-height: 1.5;
  max-width: 800px;
  margin: 1rem 0;
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

.content {
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

.discipline-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tab-button {
  padding: 0.75rem 1.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
  min-height: 44px;
}

.tab-button.active {
  background-color: #0066cc;
  color: white;
  border-color: #0066cc;
}

.tab-button:hover:not(.active) {
  border-color: #0066cc;
}

.btn-primary {
  background-color: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.625rem 1.25rem;
  font-size: 1rem;
  cursor: pointer;
  min-height: 44px;
}

.btn-primary:hover {
  background-color: #0052a3;
}

.btn-primary:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.table-wrapper {
  overflow-x: auto;
}

.grading-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.grading-table th,
.grading-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.grading-table th {
  background-color: #f5f5f5;
  font-weight: 600;
  color: #333;
}

.student-name {
  font-weight: 500;
  min-width: 150px;
}

.discipline-select,
.performance-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;
  min-height: 36px;
}

.level-cell {
  text-align: center;
  width: 60px;
}

.level-badge {
  display: inline-block;
  font-size: 1.5rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.student-name-summary {
  font-weight: 500;
}

.overall-level {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.875rem;
}

.overall-level.level-gold {
  background-color: #ffd700;
  color: #333;
}

.overall-level.level-silver {
  background-color: #c0c0c0;
  color: #333;
}

.overall-level.level-bronze {
  background-color: #cd7f32;
  color: white;
}

.overall-level.level-none {
  background-color: #e0e0e0;
  color: #666;
}

@media (max-width: 768px) {
  .discipline-tabs {
    flex-direction: column;
  }
  
  .tab-button {
    width: 100%;
  }
  
  .grading-table {
    font-size: 0.75rem;
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
