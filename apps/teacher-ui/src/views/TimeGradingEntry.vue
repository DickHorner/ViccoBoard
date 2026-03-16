<template>
  <div class="time-grading-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← Zurück</button>
      <h2>{{ category?.name || 'Zeitbasierte Bewertung' }}</h2>
      <p class="page-description">
        Erfassen Sie Zeiten und lassen Sie die Noten automatisch berechnen.
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
      <section class="card">
        <h3>Kategorieinformationen</h3>
        <div class="info-grid">
          <div class="info-item">
            <label>Typ:</label>
            <span>Zeitbasiert</span>
          </div>
          <div class="info-item">
            <label>Beste Note:</label>
            <span>{{ config.bestGrade }}</span>
          </div>
          <div class="info-item">
            <label>Schlechteste Note:</label>
            <span>{{ config.worstGrade }}</span>
          </div>
          <div class="info-item">
            <label>Mapping:</label>
            <span>{{ config.linearMapping ? 'Linear' : 'Benutzerdefiniert' }}</span>
          </div>
        </div>
      </section>

      <!-- Time Entry Table -->
      <section class="card" v-if="students.length > 0">
        <div class="card-header">
          <h3>Zeiteingabe</h3>
          <div class="header-actions">
            <button 
              class="btn-primary btn-small"
              @click="saveAllTimes"
              :disabled="saving || !hasUnsavedChanges"
            >
              {{ saving ? 'Speichern...' : 'Alle speichern' }}
            </button>
          </div>
        </div>
        
        <div class="card-content">
          <p class="info-note">
            💡 Zeiten im Format MM:SS.MS eingeben (z.B. 02:30.50 für 2 Minuten, 30,5 Sekunden)
          </p>
          
          <div class="time-table-wrapper">
            <table class="time-table">
              <thead>
                <tr>
                  <th class="student-col">Schüler</th>
                  <th class="time-col">Zeit</th>
                  <th class="seconds-col">Sekunden</th>
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
                  <td class="input-cell">
                    <input 
                      type="text"
                      :value="getTimeValue(student.id)"
                      @input="onTimeChange(student.id, ($event.target as HTMLInputElement).value)"
                      @blur="saveStudentTime(student.id)"
                      placeholder="MM:SS.MS"
                      class="time-input"
                      :disabled="saving"
                    />
                  </td>
                  <td class="seconds-cell">
                    {{ getSecondsValue(student.id) || '—' }}
                  </td>
                  <td class="grade-cell">
                    <span 
                      v-if="getCalculatedGrade(student.id)"
                      class="calculated-grade"
                    >
                      {{ getCalculatedGrade(student.id) }}
                    </span>
                    <span v-else class="grade-missing">—</span>
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
import type { Sport} from '@viccoboard/core';

const route = useRoute();
const { SportBridge, gradeCategories, performanceEntries } = useSportBridge();
const { repository: studentRepository } = useStudents();
const toast = useToast();

const categoryId = route.params.id as string;
const category = ref<Sport.GradeCategory | null>(null);
const students = ref<any[]>([]);
const timeEntries = ref<Map<string, string>>(new Map());
const comments = ref<Map<string, string>>(new Map());
const loading = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);
const hasUnsavedChanges = ref(false);
const unsavedStudents = ref<Set<string>>(new Set());

const showCommentModal = ref(false);
const currentCommentStudentId = ref<string | null>(null);
const currentComment = ref('');

const config = computed(() => {
  if (!category.value) return null;
  return category.value.configuration as any;
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
    
    // Load existing times
    for (const student of students.value) {
      const entries = await performanceEntries.value
        ?.findByStudentAndCategory(student.id, categoryId) ?? [];
      
      if (entries.length > 0) {
        const latestEntry = entries[entries.length - 1];
        
        if (latestEntry.measurements?.time) {
          timeEntries.value.set(student.id, formatSecondsToTime(latestEntry.measurements.time));
        }
        
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

function getTimeValue(studentId: string): string {
  return timeEntries.value.get(studentId) || '';
}

function getSecondsValue(studentId: string): string {
  const time = timeEntries.value.get(studentId);
  if (!time) return '';
  
  const seconds = parseTimeToSeconds(time);
  if (seconds === null) return '';
  
  return seconds.toFixed(2) + 's';
}

function parseTimeToSeconds(timeStr: string): number | null {
  // Parse MM:SS.MS or SS.MS format
  const parts = timeStr.split(':');
  let minutes = 0;
  let seconds = 0;
  
  if (parts.length === 2) {
    // MM:SS.MS format
    minutes = parseFloat(parts[0]);
    seconds = parseFloat(parts[1]);
  } else if (parts.length === 1) {
    // SS.MS format
    seconds = parseFloat(parts[0]);
  } else {
    return null;
  }
  
  if (isNaN(minutes) || isNaN(seconds)) return null;
  
  return minutes * 60 + seconds;
}

function formatSecondsToTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(2);

  if (mins > 0) {
    const [secIntPart, secFracPart] = secs.split('.');
    const paddedIntPart = secIntPart.length < 2 ? secIntPart.padStart(2, '0') : secIntPart;
    const formattedSecs = `${paddedIntPart}.${secFracPart ?? '00'}`;
    return `${mins}:${formattedSecs}`;
  }
  return secs;
}

function getCalculatedGrade(studentId: string): string | null {
  const time = timeEntries.value.get(studentId);
  if (!time) return null;

  const seconds = parseTimeToSeconds(time);
  if (seconds === null || !config.value) return null;

  const cfg: any = config.value;
  const rawBoundaries = Array.isArray(cfg.customBoundaries) ? cfg.customBoundaries : [];
  const boundaries = rawBoundaries
    .filter((b: any) => typeof b?.timeSeconds === 'number' && typeof b?.grade === 'number')
    .slice()
    .sort((a: any, b: any) => a.timeSeconds - b.timeSeconds);

  const linearMapping: boolean = cfg.linearMapping !== false;
  const bestGrade = Number(cfg.bestGrade);
  const worstGrade = Number(cfg.worstGrade);

  // If we have custom boundaries and linear mapping is disabled, use step-wise thresholds.
  if (!linearMapping && boundaries.length > 0) {
    // Faster or equal to the best boundary time gets the best boundary grade.
    if (seconds <= boundaries[0].timeSeconds) {
      return String(boundaries[0].grade);
    }

    const lastBoundary = boundaries[boundaries.length - 1];
    // Slower or equal to the worst boundary time gets the worst boundary grade.
    if (seconds >= lastBoundary.timeSeconds) {
      return String(lastBoundary.grade);
    }

    // Otherwise, find the first boundary that the time is better than or equal to.
    for (let i = 1; i < boundaries.length; i += 1) {
      const boundary = boundaries[i];
      if (seconds <= boundary.timeSeconds) {
        return String(boundary.grade);
      }
    }
  }

  // Linear interpolation between best and worst grade.
  // Derive best and worst times from custom boundaries if available, otherwise fall back.
  let bestTime: number;
  let worstTime: number;

  if (boundaries.length >= 2) {
    bestTime = boundaries[0].timeSeconds;
    worstTime = boundaries[boundaries.length - 1].timeSeconds;
  } else {
    // Fallback to placeholder values if no valid boundaries are configured.
    bestTime = 60;
    worstTime = 300;
  }

  if (seconds <= bestTime) return String(bestGrade);
  if (seconds >= worstTime) return String(worstGrade);

  const ratio = (seconds - bestTime) / (worstTime - bestTime);
  const grade = bestGrade + ratio * (worstGrade - bestGrade);
  return grade.toFixed(1);
}

function onTimeChange(studentId: string, newTime: string) {
  timeEntries.value.set(studentId, newTime);
  hasUnsavedChanges.value = true;
  unsavedStudents.value.add(studentId);
}

function hasUnsavedChangesForStudent(studentId: string): boolean {
  return unsavedStudents.value.has(studentId);
}

async function saveStudentTime(studentId: string) {
  if (!unsavedStudents.value.has(studentId)) return;
  
  const timeStr = timeEntries.value.get(studentId);
  if (!timeStr) return;
  
  const seconds = parseTimeToSeconds(timeStr);
  if (seconds === null) {
    toast.error('Ungültiges Zeitformat. Verwenden Sie MM:SS.MS oder SS.MS');
    return;
  }
  
  saving.value = true;
  try {
    await SportBridge.value?.recordGradeUseCase.execute({
      studentId,
      categoryId,
      measurements: { time: seconds },
      calculatedGrade: getCalculatedGrade(studentId) || undefined,
      comment: comments.value.get(studentId)
    });
    
    unsavedStudents.value.delete(studentId);
    if (unsavedStudents.value.size === 0) {
      hasUnsavedChanges.value = false;
    }
  } catch (err) {
    console.error('Failed to save time:', err);
    toast.error('Fehler beim Speichern der Zeit');
  } finally {
    saving.value = false;
  }
}

async function saveAllTimes() {
  saving.value = true;
  try {
    for (const studentId of unsavedStudents.value) {
      await saveStudentTime(studentId);
    }
    toast.success('Alle Zeiten gespeichert!');
  } catch (err) {
    console.error('Failed to save all times:', err);
    toast.error('Fehler beim Speichern einiger Zeiten');
  } finally {
    saving.value = false;
  }
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
  
  await saveStudentTime(currentCommentStudentId.value);
  
  showCommentModal.value = false;
  currentCommentStudentId.value = null;
  currentComment.value = '';
}
</script>

<style scoped src="./TimeGradingEntry.css"></style>
