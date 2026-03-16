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
const { SportBridge } = useSportBridge();
const { repository: studentRepository } = useStudents();
const toast = useToast();
const mittelstreckeService = new MittelstreckeGradingService();

const categoryId = route.params.id as string;
const sessionId = route.query.sessionId as string | undefined;
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

/** Convert milliseconds from Multistop to the mm:ss.ms format used in this view */
function formatMsToTime(ms: number): string {
  const totalSeconds = ms / 1000;
  return formatSecondsToTime(totalSeconds);
}

async function loadData() {
  loading.value = true;
  try {
    // Load category
    const category = await SportBridge.value?.gradeCategoryRepository.findById(categoryId) ?? null;
    if (!category) {
      toast.error('Kategorie nicht gefunden');
      router.back();
      return;
    }
    categoryName.value = category.name;

    // Load students
    students.value = await studentRepository.value?.findByClassGroup(category.classGroupId) ?? [];

    // Load tables
    tables.value = await SportBridge.value?.tableDefinitionRepository.findAll() ?? [];

    // Load existing performance entries
    const entries = await SportBridge.value?.performanceEntryRepository.findByCategory(categoryId) ?? [];
    entries.forEach((entry: any) => {
      existingEntries.value[entry.studentId] = entry;
      if (entry.measurements?.timeInSeconds) {
        times.value[entry.studentId] = formatSecondsToTime(entry.measurements.timeInSeconds);
      }
      if (entry.calculatedGrade) {
        grades.value[entry.studentId] = entry.calculatedGrade;
      }
    });

    // Pre-populate times from a Multistop session if sessionId was provided
    if (sessionId && SportBridge.value) {
      try {
        const session = await SportBridge.value.toolSessionRepository.findById(sessionId);
        if (session?.sessionMetadata?.results) {
          const results: Array<{ studentId: string; timeMs: number }> =
            session.sessionMetadata.results;
          results.forEach(r => {
            if (r.studentId && typeof r.timeMs === 'number') {
              // Only pre-fill if not already filled from existing entries
              if (!times.value[r.studentId]) {
                times.value[r.studentId] = formatMsToTime(r.timeMs);
                hasChanges.value = true;
              }
            }
          });
        }
      } catch {
        // Non-blocking: ignore session load errors
      }
    }
  } catch (error) {
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
      
      if (SportBridge.value) {
        savePromises.push(
          SportBridge.value.recordGradeUseCase.execute({
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

<style scoped src="./MittelstreckeGradingEntry.css"></style>
