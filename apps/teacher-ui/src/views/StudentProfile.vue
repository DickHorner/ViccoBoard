<template>
  <div class="student-profile-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← Back</button>
      <h2>Student Profile</h2>
      <p class="page-description">View student information, attendance history, and performance.</p>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading student information...</p>
    </div>
    
    <!-- Error State -->
    <div v-else-if="loadError" class="error-state">
      <p>{{ loadError }}</p>
      <button class="btn-primary" @click="loadData">Retry</button>
    </div>
    
    <!-- Student Profile -->
    <div v-else-if="student" class="profile-layout">
      <section class="card profile-card">
        <div class="student-header">
          <div class="student-avatar">{{ getInitials(student.firstName, student.lastName) }}</div>
          <div class="student-info">
            <h3>{{ student.firstName }} {{ student.lastName }}</h3>
            <p v-if="student.dateOfBirth">Born: {{ student.dateOfBirth.getFullYear() }}</p>
            <p v-if="student.email">{{ student.email }}</p>
          </div>
        </div>
      </section>
      
      <section class="card">
        <h3>Attendance Summary</h3>
        <div v-if="attendanceSummary" class="card-content">
          <div class="summary-grid">
            <div class="summary-item">
              <label>Total Lessons:</label>
              <span class="summary-value">{{ attendanceSummary.total }}</span>
            </div>
            <div class="summary-item">
              <label>Present:</label>
              <span class="summary-value status-present">{{ attendanceSummary.present }}</span>
            </div>
            <div class="summary-item">
              <label>Absent:</label>
              <span class="summary-value status-absent">{{ attendanceSummary.absent }}</span>
            </div>
            <div class="summary-item">
              <label>Attendance Rate:</label>
              <span class="summary-value">{{ attendanceSummary.percentage.toFixed(1) }}%</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>No attendance data available.</p>
        </div>
      </section>
      
      <section class="card">
        <h3>Attendance History</h3>
        <div class="card-content">
          <div v-if="attendanceRecords.length === 0" class="empty-state">
            <p>No attendance records yet.</p>
          </div>
          <div v-else class="attendance-list">
            <div 
              v-for="record in attendanceRecords" 
              :key="record.id"
              class="attendance-record"
            >
              <div class="record-date">
                {{ formatDate(record.date) }}
              </div>
              <div :class="['record-status', `status-${record.status}`]">
                {{ capitalize(record.status) }}
              </div>
              <div v-if="record.notes" class="record-reason">
                {{ record.notes }}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useStudents, useAttendance } from '../composables/useSportBridge'
import { getInitials, capitalize } from '../utils/stringUtils'
import type { Student, AttendanceRecord } from '../db'

const route = useRoute()
const studentId = route.params.id as string

// State
const student = ref<Student | undefined>(undefined)
const attendanceRecords = ref<AttendanceRecord[]>([])
const attendanceSummary = ref<{
  total: number
  present: number
  absent: number
  excused: number
  passive: number
  percentage: number
} | null>(null)
const loading = ref(true)
const loadError = ref('')

// Composables
const students = useStudents()
const attendance = useAttendance()

// Methods
const loadData = async () => {
  loading.value = true
  loadError.value = ''
  
  try {
    // Load student details
    student.value = await students.getById(studentId)
    
    if (!student.value) {
      loadError.value = 'Student not found'
      return
    }
    
    // Load attendance records
    attendanceRecords.value = await attendance.getByStudentId(studentId)
    
    // Load attendance summary
    attendanceSummary.value = await attendance.getAttendanceSummary(studentId)
  } catch (err) {
    console.error('Failed to load student profile:', err)
    loadError.value = 'Failed to load student profile. Please try again.'
  } finally {
    loading.value = false
  }
}

const formatDate = (date: Date): string => {
  // Date parameter is already a Date object from the database
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.student-profile-view {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.back-button {
  background: transparent;
  border: none;
  color: #667eea;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem 0;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  min-height: 44px; /* Touch target minimum */
  transition: all 0.2s ease;
}

.back-button:hover {
  color: #5568d3;
  transform: translateX(-4px);
}

.page-header h2 {
  font-size: 2rem;
  color: #333;
  margin: 0 0 0.5rem 0;
}

.page-description {
  color: #666;
  font-size: 1rem;
  margin: 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  text-align: center;
  padding: 3rem 1rem;
}

.error-state p {
  color: #c33;
  margin: 0 0 1rem 0;
  font-weight: 500;
  font-size: 1.1rem;
}

.btn-primary {
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
}

.btn-primary:hover {
  background: #5568d3;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.profile-layout {
  display: grid;
  gap: 1.5rem;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.card h3 {
  font-size: 1.25rem;
  color: #333;
  margin: 0 0 1rem 0;
  border-bottom: 2px solid #667eea;
  padding-bottom: 0.5rem;
}

.profile-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.student-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.student-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.student-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  border: none;
  padding: 0;
  color: white;
}

.student-info p {
  margin: 0.25rem 0;
  opacity: 0.9;
  font-size: 0.95rem;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.empty-state {
  color: #999;
  font-style: italic;
  text-align: center;
  padding: 2rem 1rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
  padding: 0.5rem 0;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.summary-item label {
  font-size: 0.875rem;
  color: #666;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
}

.summary-value.status-present {
  color: #4caf50;
}

.summary-value.status-absent {
  color: #f44336;
}

.attendance-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.attendance-record {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #e0e0e0;
}

.attendance-record:has(.status-present) {
  border-left-color: #4caf50;
}

.attendance-record:has(.status-absent) {
  border-left-color: #f44336;
}

.attendance-record:has(.status-late) {
  border-left-color: #ff9800;
}

.attendance-record:has(.status-excused) {
  border-left-color: #2196f3;
}

.record-date {
  font-size: 0.95rem;
  color: #666;
  white-space: nowrap;
}

.record-status {
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
  text-align: center;
}

.record-status.status-present {
  color: #2e7d32;
  background: #e8f5e9;
}

.record-status.status-absent {
  color: #c62828;
  background: #ffebee;
}

.record-status.status-late {
  color: #e65100;
  background: #fff3e0;
}

.record-status.status-excused {
  color: #1565c0;
  background: #e3f2fd;
}

.record-status.status-passive {
  color: #6a1b9a;
  background: #f3e5f5;
}

.record-reason {
  grid-column: 1 / -1;
  font-size: 0.875rem;
  color: #666;
  font-style: italic;
  padding-top: 0.5rem;
  border-top: 1px solid #e0e0e0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .student-header {
    flex-direction: column;
    text-align: center;
  }
  
  .student-avatar {
    width: 64px;
    height: 64px;
    font-size: 1.5rem;
  }
  
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .attendance-record {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .record-date {
    font-size: 0.85rem;
  }
}
</style>
