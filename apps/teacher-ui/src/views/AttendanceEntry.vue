<template>
  <div class="attendance-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← Back</button>
      <h2>Attendance Entry</h2>
      <p class="page-description">Record student attendance for today's lesson.</p>
    </div>
    
    <div class="attendance-form">
      <section class="card">
        <h3>Attendance for: {{ currentDate }}</h3>
        
        <div class="form-section">
          <label for="class-select" class="form-label">Select Class:</label>
          <select 
            id="class-select" 
            v-model="selectedClassId" 
            class="form-select"
            @change="onClassChange"
          >
            <option value="">Choose a class...</option>
            <option 
              v-for="cls in classes" 
              :key="cls.id" 
              :value="cls.id"
            >
              {{ cls.name }} ({{ cls.schoolYear }})
            </option>
          </select>
        </div>
        
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading students...</p>
        </div>
        
        <div v-else-if="selectedClassId && students.length === 0" class="empty-state">
          <p>No students in this class yet. Add students first.</p>
        </div>
        
        <div v-else-if="students.length > 0" class="card-content">
          <div class="status-summary">
            <div class="status-item status-present">
              <span class="status-label">Present</span>
              <span class="status-count">{{ countByStatus('present') }}</span>
            </div>
            <div class="status-item status-absent">
              <span class="status-label">Absent</span>
              <span class="status-count">{{ countByStatus('absent') }}</span>
            </div>
            <div class="status-item status-late">
              <span class="status-label">Late</span>
              <span class="status-count">{{ countByStatus('late') }}</span>
            </div>
            <div class="status-item status-excused">
              <span class="status-label">Excused</span>
              <span class="status-count">{{ countByStatus('excused') }}</span>
            </div>
          </div>
          
          <div class="attendance-table">
            <div 
              v-for="student in students" 
              :key="student.id" 
              class="attendance-row"
            >
              <div class="student-name">
                {{ student.firstName }} {{ student.lastName }}
              </div>
              <div class="status-buttons">
                <button
                  v-for="status in statuses"
                  :key="status.value"
                  type="button"
                  @click="setStatus(student.id, status.value)"
                  :class="['status-btn', `status-${status.value}`, { 
                    active: attendance[student.id]?.status === status.value 
                  }]"
                  :title="status.label"
                >
                  {{ status.emoji }}
                </button>
              </div>
              <input
                v-if="attendance[student.id]?.status === 'absent'"
                v-model="attendance[student.id].reason"
                type="text"
                placeholder="Reason for absence..."
                class="reason-input"
              />
            </div>
          </div>
          
          <div v-if="saveError" class="error-message">
            {{ saveError }}
          </div>
          
          <div v-if="saveSuccess" class="success-message">
            {{ saveSuccess }}
          </div>
          
          <button 
            class="btn-primary btn-large" 
            @click="handleSaveAttendance"
            :disabled="saving || !hasAnyAttendance"
          >
            {{ saving ? 'Saving...' : 'Save Attendance' }}
          </button>
        </div>
        
        <div v-else class="card-content">
          <p class="empty-state">Select a class to begin recording attendance.</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useClassGroups, useStudents, useAttendance } from '../composables/useSportModule'
import { AttendanceStatus } from '@viccoboard/core'
import type { ClassGroup, Student } from '@viccoboard/core'

const route = useRoute()

// State
const classes = ref<ClassGroup[]>([])
const students = ref<Student[]>([])
const selectedClassId = ref<string>('')
const loading = ref(false)
const saving = ref(false)
const saveError = ref('')
const saveSuccess = ref('')

interface AttendanceEntry {
  status: string
  reason?: string
}

const attendance = ref<Record<string, AttendanceEntry>>({})

const statuses = [
  { value: 'present', label: 'Present', emoji: '✓' },
  { value: 'absent', label: 'Absent', emoji: '✗' },
  { value: 'late', label: 'Late', emoji: '⏰' },
  { value: 'excused', label: 'Excused', emoji: '📋' },
  { value: 'passive', label: 'Passive', emoji: '👁' }
]

// Composables
const classGroups = useClassGroups()
const studentsComposable = useStudents()
const attendanceComposable = useAttendance()

// Computed
const currentDate = computed(() => {
  return new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
})

const hasAnyAttendance = computed(() => {
  return Object.keys(attendance.value).length > 0
})

// Methods
const countByStatus = (status: string): number => {
  return Object.values(attendance.value).filter(a => a.status === status).length
}

const setStatus = (studentId: string, status: string) => {
  if (!attendance.value[studentId]) {
    attendance.value[studentId] = { status }
  } else {
    attendance.value[studentId].status = status
  }
  
  // Clear reason if not absent
  if (status !== 'absent') {
    delete attendance.value[studentId].reason
  }
}

const onClassChange = async () => {
  if (!selectedClassId.value) {
    students.value = []
    attendance.value = {}
    return
  }
  
  loading.value = true
  try {
    students.value = await studentsComposable.getByClassId(selectedClassId.value)
    attendance.value = {}
  } catch (err) {
    console.error('Failed to load students:', err)
  } finally {
    loading.value = false
  }
}

const handleSaveAttendance = async () => {
  saveError.value = ''
  saveSuccess.value = ''
  saving.value = true
  
  try {
    // Generate a lesson ID for this attendance session
    const lessonId = `lesson-${selectedClassId.value}-${Date.now()}`
    
    // Prepare attendance records
    const records = Object.entries(attendance.value).map(([studentId, entry]) => ({
      studentId,
      lessonId,
      status: entry.status as AttendanceStatus,
      reason: entry.reason,
      notes: undefined
    }))
    
    // Save using batch record
    await attendanceComposable.recordBatch(records)
    
    saveSuccess.value = `Attendance recorded successfully for ${records.length} student${records.length > 1 ? 's' : ''}!`
    
    // Reset attendance after 2 seconds
    setTimeout(() => {
      attendance.value = {}
      saveSuccess.value = ''
    }, 2000)
  } catch (err) {
    console.error('Failed to save attendance:', err)
    if (err instanceof Error) {
      saveError.value = err.message
    } else {
      saveError.value = 'Failed to save attendance. Please try again.'
    }
  } finally {
    saving.value = false
  }
}

// Lifecycle
onMounted(async () => {
  try {
    classes.value = await classGroups.getAll()
    
    // Check if classId is passed via query params
    const classIdFromQuery = route.query.classId as string
    if (classIdFromQuery) {
      selectedClassId.value = classIdFromQuery
      await onClassChange()
    }
  } catch (err) {
    console.error('Failed to load classes:', err)
  }
})
</script>

<style scoped>
.attendance-view {
  max-width: 900px;
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

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.card h3 {
  font-size: 1.25rem;
  color: #333;
  margin: 0 0 1.5rem 0;
  border-bottom: 2px solid #667eea;
  padding-bottom: 0.5rem;
}

.form-section {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.form-select {
  width: 100%;
  padding: 0.875rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  min-height: 44px; /* Touch target minimum */
  transition: all 0.2s ease;
}

.form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  color: #666;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.empty-state {
  color: #999;
  font-style: italic;
  text-align: center;
  padding: 2rem 1rem;
}

.status-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  padding: 1rem 0;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 8px;
  background: #f8f9fa;
}

.status-present {
  border-left: 4px solid #4caf50;
}

.status-absent {
  border-left: 4px solid #f44336;
}

.status-late {
  border-left: 4px solid #ff9800;
}

.status-excused {
  border-left: 4px solid #2196f3;
}

.status-label {
  font-size: 0.875rem;
  color: #666;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-count {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
}

.attendance-table {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.attendance-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.attendance-row:has(.reason-input) {
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
}

.student-name {
  font-weight: 500;
  color: #333;
  font-size: 1rem;
}

.status-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.status-btn {
  min-width: 44px;
  min-height: 44px;
  padding: 0.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-btn:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.status-btn.active {
  border-width: 3px;
  transform: scale(1.05);
}

.status-btn.status-present.active {
  border-color: #4caf50;
  background: #e8f5e9;
}

.status-btn.status-absent.active {
  border-color: #f44336;
  background: #ffebee;
}

.status-btn.status-late.active {
  border-color: #ff9800;
  background: #fff3e0;
}

.status-btn.status-excused.active {
  border-color: #2196f3;
  background: #e3f2fd;
}

.status-btn.status-passive.active {
  border-color: #9c27b0;
  background: #f3e5f5;
}

.reason-input {
  grid-column: 1 / -1;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  margin-top: 0.5rem;
}

.reason-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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
  min-height: 44px; /* Touch target minimum */
}

.btn-primary:hover:not(:disabled) {
  background: #5568d3;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1.1rem;
}

.error-message {
  padding: 0.875rem;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  color: #c33;
  font-size: 0.9rem;
}

.success-message {
  padding: 0.875rem;
  background: #e8f5e9;
  border: 1px solid #a5d6a7;
  border-radius: 8px;
  color: #2e7d32;
  font-size: 0.9rem;
  font-weight: 500;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .status-summary {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .attendance-row {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .status-buttons {
    justify-content: flex-start;
  }
  
  .status-btn {
    min-width: 50px;
    min-height: 50px;
  }
}
</style>
