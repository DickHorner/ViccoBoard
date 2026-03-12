<template>
  <div class="student-profile-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← Zurück</button>
      <h2>Schülerprofil</h2>
      <p class="page-description">Leistungsentwicklung, Anwesenheit und sportbezogene Zusammenfassung.</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Schülerprofil wird geladen…</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-primary" @click="loadData">Erneut versuchen</button>
    </div>

    <!-- Content -->
    <div v-else-if="student" class="profile-layout">

      <!-- Identity card -->
      <section class="card profile-card">
        <div class="student-header">
          <div class="student-avatar">{{ initials }}</div>
          <div class="student-info">
            <h3>{{ student.firstName }} {{ student.lastName }}</h3>
            <p v-if="student.birthYear" class="meta">Jahrgang {{ student.birthYear }}</p>
            <p v-if="student.contactInfo?.email" class="meta">{{ student.contactInfo.email }}</p>
            <p v-if="className" class="meta class-badge">{{ className }}</p>
          </div>
        </div>
      </section>

      <!-- Sport summary cards -->
      <section class="card">
        <h3>Sport-Zusammenfassung</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">Unterrichtsstunden</span>
            <span class="summary-value">{{ attendanceSummary.total }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Anwesenheitsquote</span>
            <span class="summary-value">{{ attendanceSummary.percentage.toFixed(1) }}%</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Leistungseinträge</span>
            <span class="summary-value">{{ performanceSummary.totalEntries }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Ø Note</span>
            <span class="summary-value">
              {{ performanceSummary.averageGrade !== null ? performanceSummary.averageGrade.toFixed(2) : '—' }}
            </span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Beste Note</span>
            <span class="summary-value">
              {{ performanceSummary.bestGrade !== null ? performanceSummary.bestGrade : '—' }}
            </span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Letzte Aktivität</span>
            <span class="summary-value">
              {{ performanceSummary.lastActivity ? formatDateDe(performanceSummary.lastActivity) : '—' }}
            </span>
          </div>
        </div>
      </section>

      <!-- Attendance history -->
      <section class="card">
        <h3>Anwesenheitsverlauf</h3>
        <div v-if="attendanceRecords.length === 0" class="empty-state">
          <p>Noch keine Anwesenheitseinträge vorhanden.</p>
        </div>
        <div v-else class="attendance-list">
          <div
            v-for="record in attendanceRecords"
            :key="record.id"
            class="attendance-row"
          >
            <span class="record-date">{{ formatDateDe(record.timestamp) }}</span>
            <span :class="['record-status', attendanceStatusClass(record.status)]">
              {{ attendanceStatusLabel(record.status) }}
            </span>
            <span v-if="record.notes" class="record-notes">{{ record.notes }}</span>
          </div>
        </div>
      </section>

      <!-- Performance history -->
      <section class="card">
        <h3>Leistungsverlauf</h3>
        <div v-if="performanceEntries.length === 0" class="empty-state">
          <p>Noch keine Leistungseinträge vorhanden.</p>
        </div>
        <div v-else class="performance-list">
          <div
            v-for="entry in performanceEntries"
            :key="entry.id"
            class="performance-row"
          >
            <span class="record-date">{{ formatDateDe(entry.timestamp) }}</span>
            <span class="category-name">{{ getCategoryName(entry.categoryId) }}</span>
            <span v-if="entry.calculatedGrade !== undefined && entry.calculatedGrade !== null" class="grade-badge">
              Note: {{ entry.calculatedGrade }}
            </span>
            <span v-if="entry.comment" class="record-notes">{{ entry.comment }}</span>
          </div>
        </div>
      </section>

    </div>

    <!-- Not found -->
    <div v-else class="error-state">
      <p>Schüler nicht gefunden.</p>
      <button class="btn-secondary" @click="$router.back()">Zurück</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getSportBridge, initializeSportBridge } from '../composables/useSportBridge'
import { getStudentsBridge, initializeStudentsBridge } from '../composables/useStudentsBridge'
import {
  buildAttendanceSummary,
  buildPerformanceSummary,
  formatDateDe,
  getStudentInitials,
  attendanceStatusLabel,
  attendanceStatusClass
} from '../utils/student-profile'
import type { Student, AttendanceRecord } from '@viccoboard/core'
import type { Sport } from '@viccoboard/core'

const route = useRoute()
const studentId = route.params.id as string

initializeSportBridge()
initializeStudentsBridge()

const sportBridge = getSportBridge()
const studentsBridge = getStudentsBridge()

const student = ref<Student | null>(null)
const className = ref<string | null>(null)
const attendanceRecords = ref<AttendanceRecord[]>([])
const performanceEntries = ref<Sport.PerformanceEntry[]>([])
const categories = ref<Sport.GradeCategory[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const initials = computed(() =>
  student.value ? getStudentInitials(student.value) : ''
)

const attendanceSummary = computed(() =>
  buildAttendanceSummary(attendanceRecords.value)
)

const performanceSummary = computed(() =>
  buildPerformanceSummary(performanceEntries.value)
)

function getCategoryName(categoryId: string): string {
  const cat = categories.value.find((c) => c.id === categoryId)
  return cat?.name ?? categoryId
}

onMounted(loadData)

async function loadData() {
  loading.value = true
  error.value = null
  try {
    student.value = await studentsBridge.studentRepository.findById(studentId) ?? null
    if (!student.value) {
      loading.value = false
      return
    }

    // Load class name
    const classGroup = await sportBridge.classGroupRepository.findById(student.value.classGroupId)
    className.value = classGroup?.name ?? null

    // Load attendance and performance data in parallel
    const [attendance, performances, cats] = await Promise.all([
      sportBridge.attendanceRepository.findByStudent(studentId),
      sportBridge.performanceEntryRepository.findByStudent(studentId),
      sportBridge.gradeCategoryRepository.findAll()
    ])

    // Sort attendance records newest-first
    attendanceRecords.value = [...attendance].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    )
    performanceEntries.value = [...performances].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    )
    categories.value = cats
  } catch (err) {
    console.error('Failed to load student profile:', err)
    error.value = 'Fehler beim Laden des Schülerprofils.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.student-profile-view {
  padding: 1rem;
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 1.5rem;
}

.back-button {
  background: none;
  border: none;
  color: #0066cc;
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
  margin-bottom: 0.5rem;
}

h2 {
  margin: 0.25rem 0;
}

.page-description {
  color: #666;
  font-size: 0.875rem;
  margin: 0;
}

.profile-layout {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

/* Profile card */
.student-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.student-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: #0066cc;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  flex-shrink: 0;
}

.student-info h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.125rem;
}

.meta {
  margin: 0.1rem 0;
  font-size: 0.875rem;
  color: #666;
}

.class-badge {
  display: inline-block;
  background: #e8f0fe;
  color: #1a56db;
  border-radius: 4px;
  padding: 0.125rem 0.5rem;
  font-size: 0.8125rem;
}

/* Summary grid */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.875rem;
  background: #f9fafb;
  border-radius: 6px;
  text-align: center;
}

.summary-label {
  font-size: 0.75rem;
  color: #666;
  margin-bottom: 0.375rem;
}

.summary-value {
  font-size: 1.375rem;
  font-weight: 700;
  color: #111;
}

/* Attendance list */
.attendance-list,
.performance-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.attendance-row,
.performance-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.625rem;
  border-radius: 4px;
  background: #f9fafb;
  font-size: 0.875rem;
}

.record-date {
  color: #555;
  min-width: 90px;
}

.record-status {
  font-weight: 500;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
}

.status-present  { background: #dcfce7; color: #166534; }
.status-absent   { background: #fee2e2; color: #991b1b; }
.status-excused  { background: #fef9c3; color: #854d0e; }
.status-late     { background: #fef3c7; color: #92400e; }
.status-passive  { background: #f1f5f9; color: #475569; }

.record-notes {
  color: #666;
  font-style: italic;
  flex: 1;
}

.category-name {
  font-weight: 500;
  color: #333;
}

.grade-badge {
  background: #e6f0ff;
  color: #1a56db;
  border-radius: 4px;
  padding: 0.125rem 0.5rem;
  font-weight: 600;
}

/* States */
.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 2.5rem 1rem;
  color: #666;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #0066cc;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.btn-primary {
  padding: 0.625rem 1.25rem;
  background-color: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  min-height: 44px;
}

.btn-primary:hover { background-color: #0052a3; }

.btn-secondary {
  padding: 0.625rem 1.25rem;
  background-color: #f0f0f0;
  color: #333;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  min-height: 44px;
}

.btn-secondary:hover { background-color: #e0e0e0; }

@media (max-width: 600px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

