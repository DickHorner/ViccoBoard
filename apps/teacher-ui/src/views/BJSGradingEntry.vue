<template>
  <div class="bjs-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← {{ t('COMMON.back') }}</button>
      <h2>{{ t('BUNDESJUGENDSPIELE.info-titel') }}</h2>
      <p class="info-text">{{ t('BUNDESJUGENDSPIELE.info1') }}</p>
      <p class="info-text">{{ t('BUNDESJUGENDSPIELE.info2') }}</p>
      <a :href="t('BUNDESJUGENDSPIELE.link')" target="_blank" class="info-link">
        {{ t('BUNDESJUGENDSPIELE.link') }}
      </a>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>{{ t('COMMON.loading') }}</p>
    </div>

    <div v-else class="content">
      <!-- Discipline Inputs-->
      <section class="card">
        <h3>{{ t('BUNDESJUGENDSPIELE.disziplinen-einzeln') }}</h3>
        
        <div class="table-wrapper">
          <table class="grading-table">
            <thead>
              <tr>
                <th>{{ t('SCHUELER.name') }}</th>
                <th>{{ t('BUNDESJUGENDSPIELE.sprint') }}</th>
                <th>{{ t('BUNDESJUGENDSPIELE.sprung') }}</th>
                <th>{{ t('BUNDESJUGENDSPIELE.wurf') }}</th>
                <th>{{ t('BUNDESJUGENDSPIELE.ausdauer') }}</th>
                <th>{{ t('BUNDESJUGENDSPIELE.punkte') }}</th>
                <th>Urkunde</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in students" :key="student.id">
                <td class="student-name">
                  {{ student.firstName }} {{ student.lastName }}
                </td>
                <td>
                  <input 
                    type="number" 
                    v-model.number="performances[student.id].sprint"
                    class="perf-input"
                    step="0.01"
                    placeholder="Zeit (s)"
                    @input="calculatePoints(student.id)"
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    v-model.number="performances[student.id].sprung"
                    class="perf-input"
                    step="0.01"
                    placeholder="Weite (m)"
                    @input="calculatePoints(student.id)"
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    v-model.number="performances[student.id].wurf"
                    class="perf-input"
                    step="0.01"
                    placeholder="Weite (m)"
                    @input="calculatePoints(student.id)"
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    v-model.number="performances[student.id].ausdauer"
                    class="perf-input"
                    step="0.01"
                    placeholder="Zeit (min)"
                    @input="calculatePoints(student.id)"
                  />
                </td>
                <td class="points-cell">
                  <strong>{{ totalPoints[student.id] || 0 }}</strong>
                </td>
                <td class="certificate-cell">
                  <span 
                    v-if="getCertificateType(student.id)"
                    class="certificate-badge"
                    :class="`cert-${getCertificateType(student.id)}`"
                  >
                    {{ getCertificateLabel(getCertificateType(student.id)) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Summary -->
      <section class="card">
        <h3>Übersicht</h3>
        <div class="summary-stats">
          <div class="stat-item">
            <div class="stat-label">{{ t('BUNDESJUGENDSPIELE.ehrenurkunde') }}</div>
            <div class="stat-value">{{ getCertificateCount('ehrenurkunde') }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">{{ t('BUNDESJUGENDSPIELE.siegerurkunde') }}</div>
            <div class="stat-value">{{ getCertificateCount('siegerurkunde') }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">{{ t('BUNDESJUGENDSPIELE.teilnahmeurkunde') }}</div>
            <div class="stat-value">{{ getCertificateCount('teilnahmeurkunde') }}</div>
          </div>
        </div>
      </section>

      <!-- Actions -->
      <section class="card">
        <div class="action-buttons">
          <button 
            class="btn-primary"
            @click="saveAll"
            :disabled="saving"
          >
            {{ saving ? t('COMMON.syncing') : t('COMMON.save') }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useSportBridge } from '../composables/useSportBridge';
import { useStudents } from '../composables/useStudentsBridge';
import { useToast } from '../composables/useToast';
import type { Student } from '@viccoboard/core';
import { BJSGradingService } from '@viccoboard/sport';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { sportBridge, gradeCategories, performanceEntries } = useSportBridge();
const { repository: studentRepository } = useStudents();
const toast = useToast();
const bjsService = new BJSGradingService();

const categoryId = route.params.id as string;
const loading = ref(true);
const saving = ref(false);
const students = ref<Student[]>([]);
const performances = reactive<Record<string, any>>({});
const totalPoints = reactive<Record<string, number>>({});
const gradingTable = ref<any>(null);
const bjsConfig = ref<any>(null);

onMounted(async () => {
  await loadData();
});

async function loadData() {
  loading.value = true;
  try {
    const category = await gradeCategories.value?.findById(categoryId);
    if (!category) {
      toast.error('Kategorie nicht gefunden');
      router.back();
      return;
    }

    bjsConfig.value = category.configuration;

    students.value = await studentRepository.value?.findByClassGroup(category.classGroupId) ?? [];

    // Load grading table if referenced in config
    if (bjsConfig.value?.gradingTable) {
      gradingTable.value = await sportBridge.value?.tableDefinitionRepository.findById(bjsConfig.value.gradingTable);
      if (!gradingTable.value) {
        console.warn(`BJS grading table not found: ${bjsConfig.value.gradingTable}`);
      }
    }

    // Initialize performance objects
    students.value.forEach(student => {
      performances[student.id] = {
        sprint: null,
        sprung: null,
        wurf: null,
        ausdauer: null
      };
      totalPoints[student.id] = 0;
    });

    // Load existing entries (if any)
    const entries = await performanceEntries.value?.findByCategory(categoryId) ?? [];
    entries.forEach(entry => {
      if (entry.measurements) {
        performances[entry.studentId] = {
          sprint: entry.measurements.sprint || null,
          sprung: entry.measurements.sprung || null,
          wurf: entry.measurements.wurf || null,
          ausdauer: entry.measurements.ausdauer || null
        };
        calculatePoints(entry.studentId);
      }
    });
  } catch (error) {
    console.error('Failed to load data:', error);
    toast.error('Fehler beim Laden der Daten');
  } finally {
    loading.value = false;
  }
}

function calculatePoints(studentId: string) {
  const perf = performances[studentId];
  if (!perf) return;

  // If we have a grading table, use proper BJS scoring via the service
  if (gradingTable.value && bjsConfig.value?.disciplines) {
    try {
      const result = bjsService.calculateScore({
        disciplines: bjsConfig.value.disciplines,
        performances: perf,
        table: gradingTable.value,
        context: {}
      });

      totalPoints[studentId] = result.totalPoints;
      return;
    } catch (error) {
      console.warn(`Failed to calculate BJS points for student ${studentId}:`, error);
      // Fall back to simplified calculation if table lookup fails
    }
  }

  // Fallback: simplified point calculation (if no table available)
  // This should be replaced with actual table lookup
  let points = 0;

  if (perf.sprint > 0) {
    points += Math.max(0, Math.round(200 - perf.sprint * 10));
  }

  if (perf.sprung > 0) {
    points += Math.round(perf.sprung * 50);
  }

  if (perf.wurf > 0) {
    points += Math.round(perf.wurf * 30);
  }

  if (perf.ausdauer > 0) {
    points += Math.max(0, Math.round(300 - perf.ausdauer * 20));
  }

  totalPoints[studentId] = points;
}

function getCertificateType(studentId: string): string | null {
  const points = totalPoints[studentId] || 0;
  
  // Official BJS thresholds (simplified - actual values depend on age/gender)
  if (points >= 1000) return 'ehrenurkunde';  // Honor certificate
  if (points >= 600) return 'siegerurkunde';   // Winner certificate
  if (points > 0) return 'teilnahmeurkunde';   // Participation certificate
  return null;
}

function getCertificateLabel(type: string | null): string {
  if (!type) return '';
  const labels: Record<string, string> = {
    ehrenurkunde: t('BUNDESJUGENDSPIELE.ehrenurkunde'),
    siegerurkunde: t('BUNDESJUGENDSPIELE.siegerurkunde'),
    teilnahmeurkunde: t('BUNDESJUGENDSPIELE.teilnahmeurkunde')
  };
  return labels[type] || '';
}

function getCertificateCount(type: string): number {
  return students.value.filter(s => getCertificateType(s.id) === type).length;
}

async function saveAll() {
  saving.value = true;
  try {
    const savePromises: Promise<any>[] = [];
    
    for (const student of students.value) {
      const perf = performances[student.id];
      const points = totalPoints[student.id];
      const certType = getCertificateType(student.id);
      
      if (!perf || points === 0 || !certType) continue;
      
      const measurements = {
        sprint: perf.sprint,
        sprung: perf.sprung,
        wurf: perf.wurf,
        ausdauer: perf.ausdauer,
        totalPoints: points,
        certificateType: certType
      };
      
      savePromises.push(
        sportBridge.value?.recordGradeUseCase.execute({
          studentId: student.id,
          categoryId: categoryId,
          measurements,
          calculatedGrade: certType,
          metadata: { timestamp: new Date().toISOString() }
        }) ?? Promise.resolve()
      );
    }
    
    await Promise.all(savePromises);
    toast.success(t('COMMON.success'));
  } catch (error) {
    console.error('Failed to save grades:', error);
    toast.error('Fehler beim Speichern');
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.bjs-view {
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
  margin: 0.5rem 0;
}

.info-link {
color: #0066cc;
  font-size: 0.875rem;
  margin: 0.5rem 0;
  display: inline-block;
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
  position: sticky;
  top: 0;
}

.student-name {
  font-weight: 500;
  min-width: 150px;
}

.perf-input {
  width: 80px;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;
  text-align: right;
}

.points-cell {
  text-align: center;
  font-size: 1.1rem;
  color: #0066cc;
}

.certificate-cell {
  text-align: center;
}

.certificate-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
}

.cert-ehrenurkunde {
  background-color: #ffd700;
  color: #333;
}

.cert-siegerurkunde {
  background-color: #c0c0c0;
  color: #333;
}

.cert-teilnahmeurkunde {
  background-color: #cd7f32;
  color: white;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-item {
  text-align: center;
  padding: 1.5rem;
  background: #f5f5f5;
  border-radius: 8px;
}

.stat-label {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #0066cc;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
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

@media (max-width: 768px) {
  .grading-table {
    font-size: 0.75rem;
  }
  
  .perf-input {
    width: 60px;
    font-size: 0.75rem;
  }
  
  .summary-stats {
    grid-template-columns: 1fr;
  }
}
</style>
