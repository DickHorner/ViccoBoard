<template>
  <div class="grade-history-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← Zurück</button>
      <h2>Bewertungshistorie</h2>
      <p class="page-description">
        {{ category ? `Historie für: ${category.name}` : 'Zeigen Sie die Historie der Bewertungen an.' }}
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Historie wird geladen...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-primary" @click="loadData">Erneut versuchen</button>
    </div>

    <!-- Content -->
    <div v-else-if="category" class="history-content">
      <!-- Filters -->
      <section class="card filters-card">
        <h3>Filter</h3>
        <div class="filter-grid">
          <div class="filter-item">
            <label for="student-filter">Schüler</label>
            <select id="student-filter" v-model="selectedStudentId" class="form-select">
              <option value="">Alle Schüler</option>
              <option v-for="student in students" :key="student.id" :value="student.id">
                {{ student.firstName }} {{ student.lastName }}
              </option>
            </select>
          </div>
          
          <div class="filter-item">
            <label for="date-from">Von Datum</label>
            <input 
              id="date-from"
              type="date" 
              v-model="dateFrom"
              class="form-input"
            />
          </div>
          
          <div class="filter-item">
            <label for="date-to">Bis Datum</label>
            <input 
              id="date-to"
              type="date" 
              v-model="dateTo"
              class="form-input"
            />
          </div>
        </div>
      </section>

      <!-- History Table -->
      <section class="card">
        <div class="card-header">
          <h3>Bewertungseinträge</h3>
          <div class="header-actions">
            <button 
              class="btn-secondary btn-small"
              @click="exportHistory"
              :disabled="filteredEntries.length === 0"
            >
              📥 Exportieren
            </button>
          </div>
        </div>
        
        <div class="card-content">
          <div v-if="filteredEntries.length === 0" class="empty-state">
            <p>Keine Bewertungseinträge gefunden.</p>
          </div>
          
          <div v-else class="history-table-wrapper">
            <table class="history-table">
              <thead>
                <tr>
                  <th>Datum/Zeit</th>
                  <th>Schüler</th>
                  <th>Messwerte</th>
                  <th>Berechnete Note</th>
                  <th>Kommentar</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entry in filteredEntries" :key="entry.id">
                  <td class="timestamp-cell">
                    {{ formatDateTime(entry.timestamp) }}
                  </td>
                  <td class="student-cell">
                    {{ getStudentName(entry.studentId) }}
                  </td>
                  <td class="measurements-cell">
                    {{ formatMeasurements(entry.measurements) }}
                  </td>
                  <td class="grade-cell">
                    <span v-if="entry.calculatedGrade" class="grade-badge">
                      {{ entry.calculatedGrade }}
                    </span>
                    <span v-else class="grade-missing">—</span>
                  </td>
                  <td class="comment-cell">
                    {{ entry.comment || '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- Statistics (if student selected) -->
      <section class="card" v-if="selectedStudentId && studentStatistics">
        <h3>Statistiken für {{ getStudentName(selectedStudentId) }}</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-label">Einträge gesamt</div>
            <div class="stat-value">{{ studentStatistics.totalEntries }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Durchschnittsnote</div>
            <div class="stat-value">{{ studentStatistics.averageGrade }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Beste Note</div>
            <div class="stat-value">{{ studentStatistics.bestGrade }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Letzte Bewertung</div>
            <div class="stat-value">{{ studentStatistics.lastEntry }}</div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useSportBridge } from '../composables/useSportBridge';
import { useStudents } from '../composables/useStudentsBridge';
import { useToast } from '../composables/useToast';
import type { GradeCategory, Student, PerformanceEntry } from '@viccoboard/core';

const route = useRoute();
const { sportBridge } = useSportBridge();
const { repository: studentRepository } = useStudents();
const toast = useToast();

const categoryId = route.params.id as string;
const category = ref<GradeCategory | null>(null);
const students = ref<Student[]>([]);
const entries = ref<PerformanceEntry[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const selectedStudentId = ref<string>('');
const dateFrom = ref<string>('');
const dateTo = ref<string>('');

onMounted(async () => {
  await loadData();
});

async function loadData() {
  loading.value = true;
  error.value = null;
  
  try {
    // Load category
    category.value = await sportBridge.value.gradeCategoryRepository.read(categoryId);
    
    if (!category.value) {
      error.value = 'Kategorie nicht gefunden';
      return;
    }
    
    // Load students
    students.value = await studentRepository.value?.findByClassGroup(
      category.value.classGroupId
    ) ?? [];
    
    // Load all performance entries for this category
    entries.value = await sportBridge.value.performanceEntryRepository.findByCategory(categoryId);
    
    // Sort by timestamp descending (newest first)
    entries.value.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  } catch (err) {
    console.error('Failed to load history:', err);
    error.value = 'Fehler beim Laden der Historie';
  } finally {
    loading.value = false;
  }
}

const filteredEntries = computed(() => {
  let filtered = entries.value;
  
  // Filter by student
  if (selectedStudentId.value) {
    filtered = filtered.filter(e => e.studentId === selectedStudentId.value);
  }
  
  // Filter by date range
  if (dateFrom.value) {
    const fromDate = new Date(dateFrom.value);
    filtered = filtered.filter(e => e.timestamp >= fromDate);
  }
  
  if (dateTo.value) {
    const toDate = new Date(dateTo.value);
    toDate.setHours(23, 59, 59, 999); // End of day
    filtered = filtered.filter(e => e.timestamp <= toDate);
  }
  
  return filtered;
});

const studentStatistics = computed(() => {
  if (!selectedStudentId.value) return null;
  
  const studentEntries = filteredEntries.value.filter(
    e => e.studentId === selectedStudentId.value
  );
  
  if (studentEntries.length === 0) return null;
  
  const gradesWithValues = studentEntries
    .filter(e => e.calculatedGrade !== undefined && e.calculatedGrade !== null)
    .map(e => Number(e.calculatedGrade));
  
  const averageGrade = gradesWithValues.length > 0
    ? (gradesWithValues.reduce((sum, g) => sum + g, 0) / gradesWithValues.length).toFixed(2)
    : '—';
  
  const bestGrade = gradesWithValues.length > 0
    ? Math.min(...gradesWithValues).toString()
    : '—';
  
  const lastEntry = studentEntries.length > 0
    ? formatDate(studentEntries[0].timestamp)
    : '—';
  
  return {
    totalEntries: studentEntries.length,
    averageGrade,
    bestGrade,
    lastEntry
  };
});

function getStudentName(studentId: string): string {
  const student = students.value.find(s => s.id === studentId);
  if (!student) return 'Unbekannt';
  return `${student.firstName} ${student.lastName}`;
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

function formatMeasurements(measurements: Record<string, any>): string {
  if (!measurements || Object.keys(measurements).length === 0) {
    return '—';
  }
  
  // Format measurements based on type
  const formatted: string[] = [];
  
  for (const [key, value] of Object.entries(measurements)) {
    if (key === 'time') {
      formatted.push(`Zeit: ${value.toFixed(2)}s`);
    } else {
      formatted.push(`${key}: ${value}`);
    }
  }
  
  return formatted.join(', ');
}

function escapeCSVField(field: string): string {
  // Escape quotes by doubling them and wrap in quotes if contains special chars
  const needsEscape = /[",\n\r]/.test(field);
  if (needsEscape) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function exportHistory() {
  try {
    // Create CSV content with proper escaping
    let csv = 'Datum/Zeit,Schüler,Messwerte,Note,Kommentar\n';
    
    for (const entry of filteredEntries.value) {
      const row = [
        formatDateTime(entry.timestamp),
        getStudentName(entry.studentId),
        formatMeasurements(entry.measurements),
        entry.calculatedGrade?.toString() || '',
        entry.comment || ''
      ];
      
      csv += row.map(field => escapeCSVField(field)).join(',') + '\n';
    }
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bewertungshistorie_${category.value?.name || 'export'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to export history:', err);
    toast.error('Fehler beim Exportieren der Historie');
  }
}
</script>

<style scoped>
.grade-history-view {
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
}

.history-content {
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

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.filter-item {
  display: flex;
  flex-direction: column;
}

.filter-item label {
  font-weight: 500;
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.form-select,
.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background-color: white;
  min-height: 44px;
}

.history-table-wrapper {
  overflow-x: auto;
  margin-top: 1rem;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  min-width: 800px;
}

.history-table th,
.history-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.history-table th {
  background-color: #f5f5f5;
  font-weight: 600;
  color: #333;
  position: sticky;
  top: 0;
}

.timestamp-cell {
  white-space: nowrap;
}

.student-cell {
  font-weight: 500;
}

.grade-cell {
  text-align: center;
}

.grade-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background-color: #e6f7e6;
  color: #2d6a2d;
  border-radius: 4px;
  font-weight: 600;
}

.grade-missing {
  color: #999;
}

.comment-cell {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.stat-item {
  text-align: center;
  padding: 1.5rem;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.stat-label {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #333;
}

.empty-state,
.loading-state,
.error-state {
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

.btn-secondary:disabled {
  background-color: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  min-height: 44px;
}

@media (max-width: 768px) {
  .history-table {
    font-size: 0.75rem;
  }
  
  .history-table th,
  .history-table td {
    padding: 0.5rem;
  }
  
  .filter-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
