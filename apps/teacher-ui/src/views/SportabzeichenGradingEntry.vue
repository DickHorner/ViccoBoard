<template>
  <div class="Sportabzeichen-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← {{ t('COMMON.back') }}</button>
      <h2>{{ t('SportABZEICHEN.title') }}</h2>
      <p class="info-text">{{ t('SportABZEICHEN.explainer') }}</p>
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
            {{ t(`SportABZEICHEN.${cat}`) }}
          </button>
        </div>
      </section>

      <!-- Student Grading Table -->
      <section class="card">
        <div class="card-header">
          <h3>{{ t(`SportABZEICHEN.${selectedCategory}`) }}</h3>
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
                <th>{{ t('SportABZEICHEN.disziplin') }}</th>
                <th>{{ t('SportABZEICHEN.leistung') }}</th>
                <th>{{ t('SportABZEICHEN.bronze') }}</th>
                <th>{{ t('SportABZEICHEN.silber') }}</th>
                <th>{{ t('SportABZEICHEN.gold') }}</th>
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
        <h3>{{ t('SportABZEICHEN.gesamtergebnis') }}</h3>
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
        <h3>PDF-Export</h3>
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
import type { Sport} from '@viccoboard/core';
import { calculateAgeFromDateOfBirth } from '@viccoboard/core';
import type { SportabzeichenReportEntry } from '@viccoboard/sport';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { SportBridge } = useSportBridge();
const { repository: studentRepository } = useStudents();
const toast = useToast();

const categoryId = route.params.id as string;
const loading = ref(true);
const saving = ref(false);
const exporting = ref(false);
const students = ref<any[]>([]);
const disciplineCategories = ['ausdauer', 'kraft', 'schnelligkeit', 'koordination'];
const selectedCategory = ref('ausdauer');

// Simplified discipline structure (in production, could load from config)
const disciplines = ref<Sport.SportabzeichenDiscipline[]>([
  { id: 'd1', name: '3000m Lauf', category: 'endurance', measurementUnit: 'seconds' },
  { id: 'd2', name: 'Schwimmen 200m', category: 'endurance', measurementUnit: 'seconds' },
  { id: 'd3', name: 'Standweitsprung', category: 'strength', measurementUnit: 'cm' },
  { id: 'd4', name: 'Kugelstoßen', category: 'strength', measurementUnit: 'meters' },
  { id: 'd5', name: 'Sprint 100m', category: 'speed', measurementUnit: 'seconds' },
  { id: 'd6', name: 'Seilspringen', category: 'coordination', measurementUnit: 'count' }
]);

const disciplineSelections = ref<Record<string, string>>({});
const performances = ref<Record<string, number>>({});
const levels = ref<Record<string, Sport.SportabzeichenLevel>>({});
const studentResults = ref<Record<string, Sport.SportabzeichenResult[]>>({});
const allStandards = ref<Sport.SportabzeichenStandard[]>([]);
const hasChanges = ref(false);

onMounted(async () => {
  await loadData();
});

async function loadData() {
  loading.value = true;
  try {
    const category = await SportBridge.value?.gradeCategoryRepository.findById(categoryId) ?? null;
    if (!category) {
      toast.error('Kategorie nicht gefunden');
      router.back();
      return;
    }

    students.value = await studentRepository.value?.findByClassGroup(category.classGroupId) ?? [];

    // Load all Sportabzeichen standards
    allStandards.value = await SportBridge.value?.SportabzeichenStandardRepository.findAll() ?? [];

    // Load existing results for each student
    for (const student of students.value) {
      const results = await SportBridge.value?.SportabzeichenResultRepository.findByStudent(student.id) ?? [];
      studentResults.value[student.id] = results;
    }
  } catch (error) {
    console.error('Failed to load data:', error);
    toast.error('Fehler beim Laden der Daten');
  } finally {
    loading.value = false;
  }
}

function getFilteredDisciplines(category: string) {
  // Map UI category names to Sport type category names
  const categoryMap: Record<string, Sport.SportabzeichenDiscipline['category']> = {
    'ausdauer': 'endurance',
    'kraft': 'strength',
    'schnelligkeit': 'speed',
    'koordination': 'coordination'
  };
  const mappedCategory = categoryMap[category];
  return disciplines.value.filter(d => d.category === mappedCategory);
}

function onDisciplineChange(studentId: string) {
  hasChanges.value = true;
  onPerformanceChange(studentId);
}

async function onPerformanceChange(studentId: string) {
  hasChanges.value = true;
  
  const disciplineId = disciplineSelections.value[studentId];
  const performance = performances.value[studentId];
  
  if (!disciplineId || performance === undefined || performance === null) {
    levels.value[studentId] = 'none';
    return;
  }

  const student = students.value.find(s => s.id === studentId);
  if (!student?.dateOfBirth) {
    levels.value[studentId] = 'none';
    return;
  }

  // Calculate age using service
  const service = SportBridge.value?.SportabzeichenService;
  if (!service) {
    levels.value[studentId] = 'none';
    return;
  }

  const age = calculateAgeFromDateOfBirth(student.dateOfBirth, new Date());
  if (age === null) {
    levels.value[studentId] = 'none';
    return;
  }
  const gender: Sport.SportabzeichenGender = student.gender === 'm' ? 'male' : 'female';

  // Evaluate performance using service with all standards
  const achievedLevel = service.evaluatePerformance(allStandards.value, {
    disciplineId,
    gender,
    age,
    performanceValue: performance
  });

  levels.value[studentId] = achievedLevel;
}

function getOverallLevel(studentId: string): Sport.SportabzeichenLevel {
  const results = studentResults.value[studentId] || [];
  if (results.length === 0) return 'none';
  
  const service = SportBridge.value?.SportabzeichenService;
  if (!service) return 'none';
  
  return service.calculateOverallLevel(results);
}

async function saveAll() {
  saving.value = true;
  try {
    const useCase = SportBridge.value?.recordSportabzeichenResultUseCase;
    if (!useCase) {
      throw new Error('RecordSportabzeichenResultUseCase not available');
    }

    for (const student of students.value) {
      const disciplineId = disciplineSelections.value[student.id];
      const performance = performances.value[student.id];
      const level = levels.value[student.id];
      
      if (!disciplineId || performance === undefined || performance === null || level === 'none') {
        continue;
      }

      if (!student.dateOfBirth) {
        console.warn(`Student ${student.id} has no date of birth, skipping`);
        continue;
      }

      const discipline = disciplines.value.find(d => d.id === disciplineId);
      if (!discipline) {
        console.warn(`Discipline ${disciplineId} not found, skipping`);
        continue;
      }

      const gender: Sport.SportabzeichenGender = student.gender === 'm' ? 'male' : 'female';

      // Save result using use case
      const result = await useCase.execute({
        studentId: student.id,
        disciplineId,
        dateOfBirth: student.dateOfBirth,
        gender,
        performanceValue: performance,
        unit: discipline.measurementUnit,
        testDate: new Date()
      });

      // Update local results
      if (!studentResults.value[student.id]) {
        studentResults.value[student.id] = [];
      }
      const existingIndex = studentResults.value[student.id].findIndex(r => r.disciplineId === disciplineId);
      if (existingIndex >= 0) {
        studentResults.value[student.id][existingIndex] = result;
      } else {
        studentResults.value[student.id].push(result);
      }
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
    const service = SportBridge.value?.SportabzeichenService;
    if (!service) {
      throw new Error('SportabzeichenService not available');
    }

    // Build report data
    const entries: SportabzeichenReportEntry[] = students.value.map(student => {
      const results = studentResults.value[student.id] || [];
      const age = calculateAgeFromDateOfBirth(student.dateOfBirth, new Date()) ?? 0;
      const gender: Sport.SportabzeichenGender = student.gender === 'm' ? 'male' : 'female';
      const overallLevel = getOverallLevel(student.id);

      return {
        studentName: `${student.firstName} ${student.lastName}`,
        age,
        gender,
        overallLevel,
        results: results.map(r => {
          const discipline = disciplines.value.find(d => d.id === r.disciplineId);
          return {
            disciplineName: discipline?.name || r.disciplineId,
            performance: `${r.performanceValue} ${r.unit}`,
            level: r.achievedLevel
          };
        })
      };
    });

    const pdfBytes = await service.generateOverviewPdf({
      title: t('SportABZEICHEN.title'),
      generatedAt: new Date(),
      entries
    });

    // Trigger download
    const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sportabzeichen-${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('PDF erfolgreich erstellt');
  } catch (error) {
    console.error('Failed to export PDF:', error);
    toast.error('Fehler beim Exportieren');
  } finally {
    exporting.value = false;
  }
}
</script>

<style scoped src="./SportabzeichenGradingEntry.css"></style>
