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
            class="form-select" 
            v-model="selectedClassId"
            @change="onClassChange"
          >
            <option value="">Choose a class...</option>
            <option v-for="cls in classes" :key="cls.id" :value="cls.id">
              {{ cls.name }} ({{ cls.schoolYear }})
            </option>
          </select>
        </div>
        
        <div class="card-content" v-if="!selectedClassId">
          <p class="empty-state">Select a class to begin recording attendance.</p>
        </div>

        <div class="card-content" v-else-if="loading">
          <p class="loading-state">Loading students...</p>
        </div>

        <div class="card-content" v-else-if="students.length === 0">
          <p class="empty-state">No students in this class. Add students first.</p>
        </div>

        <div class="card-content" v-else>
          <div class="status-summary">
            <div class="status-item status-present">
              <span class="status-label">Present</span>
              <span class="status-count">{{ statusCounts.present }}</span>
            </div>
            <div class="status-item status-absent">
              <span class="status-label">Absent</span>
              <span class="status-count">{{ statusCounts.absent }}</span>
            </div>
            <div class="status-item status-late">
              <span class="status-label">Late</span>
              <span class="status-count">{{ statusCounts.late }}</span>
            </div>
            <div class="status-item status-excused">
              <span class="status-label">Excused</span>
              <span class="status-count">{{ statusCounts.excused }}</span>
            </div>
            <div class="status-item status-passive">
              <span class="status-label">Passive</span>
              <span class="status-count">{{ statusCounts.passive }}</span>
            </div>
          </div>

          <div class="bulk-actions">
            <button 
              class="btn-bulk" 
              @click="markAllPresent"
              :disabled="saving"
            >
              Mark All Present
            </button>
          </div>
          
          <div class="attendance-table-wrapper">
            <table class="attendance-table">
              <thead>
                <tr>
                  <th class="student-name-col">Student</th>
                  <th class="status-col">Status</th>
                  <th class="reason-col">Reason</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="student in students" :key="student.id" class="student-row">
                  <td class="student-name">
                    {{ student.firstName }} {{ student.lastName }}
                  </td>
                  <td class="status-buttons-cell">
                    <div class="status-buttons">
                      <button 
                        v-for="status in statusOptions" 
                        :key="status.value"
                        @click="setStudentStatus(student.id, status.value)"
                        :class="['status-btn', `status-btn-${status.value}`, { 
                          'active': attendance[student.id]?.status === status.value 
                        }]"
                        :disabled="saving"
                        :title="status.label"
                      >
                        {{ status.short }}
                      </button>
                    </div>
                  </td>
                  <td class="reason-cell">
                    <input 
                      v-if="attendance[student.id] && ['absent', 'excused'].includes(attendance[student.id].status)"
                      v-model="attendance[student.id].reason"
                      type="text"
                      class="reason-input"
                      placeholder="Enter reason..."
                      :disabled="saving"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="form-actions">
            <button 
              class="btn-primary" 
              @click="saveAttendance"
              :disabled="!hasChanges || saving"
            >
              {{ saving ? 'Saving...' : 'Save Attendance' }}
            </button>
            <button 
              class="btn-secondary" 
              @click="clearAttendance"
              :disabled="!hasChanges || saving"
            >
              Clear All
            </button>
          </div>

          <div v-if="saveMessage" :class="['save-message', saveMessageType]">
            {{ saveMessage }}
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useClassGroups, useStudents, useAttendance } from '../composables/useDatabase'
import type { ClassGroup, Student } from '../db'

// Status options for quick selection
const statusOptions = [
  { value: 'present', label: 'Present', short: 'P' },
  { value: 'absent', label: 'Absent', short: 'A' },
  { value: 'late', label: 'Late', short: 'L' },
  { value: 'excused', label: 'Excused', short: 'E' },
  { value: 'passive', label: 'Passive', short: 'Pass' }
]

// State
const classes = ref<ClassGroup[]>([])
const students = ref<Student[]>([])
const selectedClassId = ref<string>('')
const loading = ref(false)
const saving = ref(false)
const saveMessage = ref('')
const saveMessageType = ref<'success' | 'error'>('success')

// Attendance tracking: { studentId: { status, reason } }
const attendance = reactive<Record<string, { status: string; reason?: string }>>({})

// Composables
const classGroupsApi = useClassGroups()
const studentsApi = useStudents()
const attendanceApi = useAttendance()

// Constants
const SUCCESS_MESSAGE_TIMEOUT_MS = 3000

// Current date display
const currentDate = computed(() => {
  return new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
})

// Status counts for summary
const statusCounts = computed(() => {
  const counts = {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    passive: 0
  }
  
  for (const record of Object.values(attendance)) {
    if (record.status && record.status in counts) {
      counts[record.status as keyof typeof counts]++
    }
  }
  
  return counts
})

// Check if there are any changes
const hasChanges = computed(() => {
  return Object.keys(attendance).length > 0
})

// Load classes on mount
onMounted(async () => {
  try {
    classes.value = await classGroupsApi.getAll()
  } catch (error) {
    console.error('Failed to load classes:', error)
  }
})

// When class is selected, load students
async function onClassChange() {
  if (!selectedClassId.value) {
    students.value = []
    clearAttendance()
    return
  }
  
  loading.value = true
  try {
    students.value = await studentsApi.getByClassId(selectedClassId.value)
    clearAttendance()
  } catch (error) {
    console.error('Failed to load students:', error)
  } finally {
    loading.value = false
  }
}

// Set status for a student
function setStudentStatus(studentId: string, status: string) {
  if (!attendance[studentId]) {
    attendance[studentId] = { status }
  } else {
    attendance[studentId].status = status
    // Clear reason if changing from absent/excused to other status
    if (!['absent', 'excused'].includes(status)) {
      delete attendance[studentId].reason
    }
  }
}

// Mark all students as present
function markAllPresent() {
  for (const student of students.value) {
    attendance[student.id] = { status: 'present' }
  }
}

// Clear all attendance records
function clearAttendance() {
  // Clear the reactive object
  for (const key in attendance) {
    delete attendance[key]
  }
  saveMessage.value = ''
}

// Save attendance to database
async function saveAttendance() {
  if (!selectedClassId.value || !hasChanges.value) {
    return
  }

  saving.value = true
  saveMessage.value = ''
  
  try {
    // Generate a lesson ID for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const lessonId = `lesson-${selectedClassId.value}-${today.getTime()}`
    
    // Load existing attendance records for this lesson so we can update instead of duplicating
    const existingRecords = await attendanceApi.list
      ? await attendanceApi.list({ lessonId })
      : []
    
    // Save each attendance record
    let savedCount = 0
    for (const [studentId, record] of Object.entries(attendance)) {
      if (record.status) {
        // Type assertion is safe here as we validate status in setStudentStatus
        const validStatus = record.status as 'present' | 'absent' | 'excused' | 'late' | 'passive'

        const payload = {
          studentId,
          lessonId,
          date: new Date(),
          status: validStatus,
          notes: record.reason || undefined
        }

        // If an existing record for this student/lesson exists, update it; otherwise create a new one
        const existing =
          Array.isArray(existingRecords)
            ? existingRecords.find((r: any) => r.studentId === studentId)
            : undefined

        if (existing && typeof attendanceApi.update === 'function') {
          await attendanceApi.update(existing.id, payload)
        } else {
          await attendanceApi.create(payload)
        }
        savedCount++
      }
    }
    
    saveMessage.value = `Successfully saved attendance for ${savedCount} student(s)`
    saveMessageType.value = 'success'
    
    // Clear form after successful save
    setTimeout(() => {
      clearAttendance()
      saveMessage.value = ''
    }, SUCCESS_MESSAGE_TIMEOUT_MS)
  } catch (error) {
    console.error('Failed to save attendance:', error)
    saveMessage.value = 'Failed to save attendance. Please try again.'
    saveMessageType.value = 'error'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.attendance-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
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

.loading-state {
  color: #667eea;
  text-align: center;
  padding: 2rem 1rem;
}

.status-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 0.75rem;
  padding: 1rem 0;
  margin-bottom: 1rem;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem;
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

.status-passive {
  border-left: 4px solid #9c27b0;
}

.status-label {
  font-size: 0.75rem;
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

.bulk-actions {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.btn-bulk {
  background: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
}

.btn-bulk:hover:not(:disabled) {
  background: #e0e0e0;
  border-color: #ccc;
}

.btn-bulk:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.attendance-table-wrapper {
  overflow-x: auto;
  margin-bottom: 1.5rem;
}

.attendance-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.attendance-table thead {
  background: #f8f9fa;
}

.attendance-table th {
  text-align: left;
  padding: 0.875rem;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e0e0e0;
}

.attendance-table td {
  padding: 0.75rem 0.875rem;
  border-bottom: 1px solid #f0f0f0;
}

.student-row:hover {
  background: #fafafa;
}

.student-name {
  font-weight: 500;
  color: #333;
}

.status-buttons {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.status-btn {
  padding: 0.5rem 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  color: #666;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 48px;
  min-height: 44px;
  text-align: center;
}

.status-btn:hover:not(:disabled):not(.active) {
  border-color: #ccc;
  background: #f8f9fa;
}

.status-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.status-btn.active {
  color: white;
  font-weight: 700;
}

.status-btn-present.active {
  background: #4caf50;
  border-color: #4caf50;
}

.status-btn-absent.active {
  background: #f44336;
  border-color: #f44336;
}

.status-btn-late.active {
  background: #ff9800;
  border-color: #ff9800;
}

.status-btn-excused.active {
  background: #2196f3;
  border-color: #2196f3;
}

.status-btn-passive.active {
  background: #9c27b0;
  border-color: #9c27b0;
}

.reason-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.reason-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.reason-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-start;
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

.btn-secondary {
  background: white;
  color: #666;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
}

.btn-secondary:hover:not(:disabled) {
  border-color: #ccc;
  background: #f8f9fa;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.save-message {
  padding: 1rem;
  border-radius: 6px;
  font-weight: 500;
  text-align: center;
  margin-top: 1rem;
}

.save-message.success {
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #4caf50;
}

.save-message.error {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #f44336;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .status-summary {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .attendance-table {
    font-size: 0.8rem;
  }
  
  .status-buttons {
    flex-direction: column;
  }
  
  .status-btn {
    width: 100%;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
}

/* iPad landscape and larger */
@media (min-width: 769px) and (max-width: 1024px) {
  .attendance-view {
    max-width: 100%;
  }
  
  .status-summary {
    grid-template-columns: repeat(5, 1fr);
  }
}
</style>
