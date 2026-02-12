<template>
  <div class="mittelstrecke-grading-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← {{ t('COMMON.back') }}</button>
      <h2>{{ t('MITTELSTRECKE.bewerte') }} {{ categoryName }}</h2>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>{{ t('COMMON.loading') }}</p>
    </div>

    <div v-else class="grading-content">
      <!-- Table Selection -->
      <section class="card">
        <h3>{{ t('MITTELSTRECKE.tabelle') }}</h3>
        <select v-model="selectedTableId" class="form-select">
          <option value="">{{ t('TABLES.select-table') }}...</option>
          <option v-for="table in tables" :key="table.id" :value="table.id">
            {{ table.name }}
          </option>
        </select>
      </section>

      <!-- Grading Table -->
      <section class="card">
        <div class="card-header">
          <h3>{{ t('MITTELSTRECKE.alle-schueler') }}</h3>
          <button 
            v-if="hasChanges" 
            class="btn-primary btn-small" 
            @click="saveAll"
            :disabled="saving"
          >
            {{ saving ? t('COMMON.syncing') : t('COMMON.save') }}
          </button>
        </div>

        <div class="grading-table-wrapper">
          <table class="grading-table">
            <thead>
              <tr>
                <th>{{ t('SCHUELER.name') }}</th>
                <th>{{ t('MITTELSTRECKE.gesamt') }}</th>
                <th>{{ t('MITTELSTRECKE.note') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in students" :key="student.id">
                <td class="student-name">
                  {{ student.firstName }} {{ student.lastName }}
                </td>
                <td class="time-input-cell">
                  <input 
                    type="text"
                    v-model="times[student.id]"
                    class="time-input"
                    placeholder="mm:ss.ms"
                    @input="onTimeChange(student.id)"
                  />
                </td>
                <td class="grade-cell">
                  <span 
                    v-if="grades[student.id]" 
                    class="grade-value"
                    :class="getGradeClass(grades[student.id])"
                  >
                    {{ grades[student.id] }}
                  </span>
                  <span v-else class="grade-missing">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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
import { MittelstreckeGradingService } from '@viccoboard/sport';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { sportBridge } = useSportBridge();
const { repository: studentRepository } = useStudents();
const toast = useToast();
const mittelstreckeService = new MittelstreckeGradingService();

const categoryId = route.params.id as string;
const categoryName = ref('');
const loading = ref(true);
const saving = ref(false);
const students = ref<any[]>([]);
const tables = ref<any[]>([]);
const selectedTableId = ref<string>('');
const times = ref<Record<string, string>>({});
const grades = ref<Record<string, string | number>>({});
const existingEntries = ref<Record<string, any>>({});
const hasChanges = ref(false);

onMounted(async () => {
  await loadData();
});

async function loadData() {
  loading.value = true;
  try {
    // Load category
    const category = await sportBridge.value?.gradeCategoryRepository.findById(categoryId) ?? null;
    if (!category) {
      toast.error('Kategorie nicht gefunden');
      router.back();
      return;
    }
    categoryName.value = category.name;

    // Load students
    students.value = await studentRepository.value?.findByClassGroup(category.classGroupId) ?? [];

    // Load tables
    tables.value = await sportBridge.value?.tableDefinitionRepository.findAll() ?? [];

    // Load existing performance entries
    const entries = await sportBridge.value?.performanceEntryRepository.findByCategory(categoryId) ?? [];
    entries.forEach((entry) => {
      existingEntries.value[entry.studentId] = entry;
      if (entry.measurements?.timeInSeconds) {
        times.value[entry.studentId] = formatSecondsToTime(entry.measurements.timeInSeconds);
      }
      if (entry.calculatedGrade) {
        grades.value[entry.studentId] = entry.calculatedGrade;
      }
    });
  } catch (error) {
    console.error('Failed to load data:', error);
    toast.error('Fehler beim Laden der Daten');
  } finally {
    loading.value = false;
  }
}

function formatSecondsToTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 100);
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

function parseTimeToSeconds(timeStr: string): number | null {
  if (!timeStr || !timeStr.trim()) return null;
  
  // Try to parse mm:ss.ms format
  const match = timeStr.match(/^(\d{1,2}):(\d{2})(?:\.(\d{1,2}))?$/);
  if (match) {
    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    const milliseconds = match[3] ? parseInt(match[3].padEnd(2, '0'), 10) : 0;
    return minutes * 60 + seconds + milliseconds / 100;
  }
  
  // Try to parse just seconds
  const secondsMatch = timeStr.match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (secondsMatch) {
    const secs = parseInt(secondsMatch[1], 10);
    const ms = secondsMatch[2] ? parseInt(secondsMatch[2].padEnd(2, '0'), 10) : 0;
    return secs + ms / 100;
  }
  
  return null;
}

function onTimeChange(studentId: string) {
  hasChanges.value = true;
  
  const timeStr = times.value[studentId];
  const timeInSeconds = parseTimeToSeconds(timeStr);
  
  if (timeInSeconds !== null && selectedTableId.value) {
    // Calculate grade from table
    const grade = calculateGradeFromTable(timeInSeconds);
    grades.value[studentId] = grade;
  } else {
    grades.value[studentId] = '';
  }
}

function calculateGradeFromTable(timeInSeconds: number): string | number {
  if (!selectedTableId.value) return '';
  
  const table = tables.value.find(t => t.id === selectedTableId.value);
  if (!table || !table.entries) return '';
  
  try {
    const result = mittelstreckeService.calculateGradeFromTime({
      timeInSeconds,
      table,
      context: {} // Could add gender/age context if available on the student
    });
    return result.grade;
  } catch (error) {
    console.error('Failed to calculate grade from table:', error);
    return '';
  }
}

async function saveAll() {
  saving.value = true;
  try {
    const savePromises: Promise<any>[] = [];
    
    for (const student of students.value) {
      const timeStr = times.value[student.id];
      const grade = grades.value[student.id];
      
      if (!timeStr || !grade) continue;
      
      const timeInSeconds = parseTimeToSeconds(timeStr);
      if (timeInSeconds === null) continue;
      
      const measurements = {
        timeInSeconds,
        timeFormatted: timeStr
      };
      
      if (sportBridge.value) {
        savePromises.push(
          sportBridge.value.recordGradeUseCase.execute({
            studentId: student.id,
            categoryId: categoryId,
            measurements,
            calculatedGrade: grade
          })
        );
      }
    }
    
    await Promise.all(savePromises);
    hasChanges.value = false;
    toast.success(t('COMMON.success'));
  } catch (error) {
    console.error('Failed to save grades:', error);
    toast.error('Fehler beim Speichern');
  } finally {
    saving.value = false;
  }
}

function getGradeClass(grade: string | number): string {
  const numGrade = typeof grade === 'string' ? parseFloat(grade) : grade;
  if (isNaN(numGrade)) return '';
  if (numGrade <= 2.0) return 'grade-good';
  if (numGrade <= 3.5) return 'grade-ok';
  return 'grade-poor';
}
</script>

<style scoped>
.mittelstrecke-grading-view {
  padding: 1rem;
  max-width: 1200px;
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

.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background-color: white;
  cursor: pointer;
  min-height: 44px;
}

.btn-primary {
  background-color: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.625rem 1.25rem;
  font-size: 1rem;
  cursor: pointer;
  touch-action: manipulation;
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

.grading-table-wrapper {
  overflow-x: auto;
  margin-top: 1rem;
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

.time-input-cell {
  width: 120px;
}

.time-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;
  font-family: 'Courier New', monospace;
  text-align: center;
  min-height: 36px;
}

.time-input:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
}

.grade-cell {
  text-align: center;
  width: 80px;
}

.grade-value {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-weight: 600;
  min-width: 50px;
}

.grade-good {
  background-color: #e6f7e6;
  color: #2d6a2d;
}

.grade-ok {
  background-color: #fff8e1;
  color: #856404;
}

.grade-poor {
  background-color: #ffe6e6;
  color: #a23838;
}

.grade-missing {
  color: #999;
}

@media (max-width: 768px) {
  .grading-table {
    font-size: 0.75rem;
  }
  
  .grading-table th,
  .grading-table td {
    padding: 0.5rem 0.25rem;
  }
  
  .student-name {
    min-width: 100px;
  }
  
  .time-input-cell {
    width: 100px;
  }
  
  .grade-cell {
    width: 60px;
  }
}
</style>
