<template>
  <div class="attendance-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← {{ t('COMMON.back') }}</button>
      <h2>{{ t('ANWESENHEIT.title') }}</h2>
      <p class="page-description">{{ t('ANWESENHEIT.status') }}</p>
    </div>
    
    <div class="attendance-form">
      <section class="card">
        <h3>{{ t('ANWESENHEIT.liste') }} {{ currentDate }}</h3>
        
        <div class="form-section">
          <label for="class-select" class="form-label">{{ t('KLASSEN.klasse') }}</label>
          <select 
            id="class-select" 
            v-model="selectedClassId" 
            class="form-select"
            @change="onClassChange"
          >
            <option value="">{{ t('KLASSEN.klasse') }}...</option>
            <option 
              v-for="cls in classes" 
              :key="cls.id" 
              :value="cls.id"
            >
              {{ cls.name }} ({{ cls.schoolYear }})
            </option>
          </select>
        </div>
        
        <div class="card-content" v-if="!selectedClassId">
          <p class="empty-state">{{ t('KLASSEN.klasse') }}...</p>
        </div>

        <div v-else-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>{{ t('COMMON.loading') }}</p>
        </div>
        
        <div v-else-if="selectedClassId && students.length === 0" class="empty-state">
          <p>{{ t('KLASSEN.keine-schueler') }}</p>
        </div>

        <div v-else-if="students.length > 0" class="card-content">
          <div class="status-summary">
            <div class="status-item status-present">
              <span class="status-label">{{ t('ANWESENHEIT.present') }}</span>
              <span class="status-count">{{ countByStatus(AttendanceStatus.Present) }}</span>
            </div>
            <div class="status-item status-absent">
              <span class="status-label">{{ t('ANWESENHEIT.absent') }}</span>
              <span class="status-count">{{ countByStatus(AttendanceStatus.Absent) }}</span>
            </div>
            <div class="status-item status-late">
              <span class="status-label">{{ t('ANWESENHEIT.verspaetet') }}</span>
              <span class="status-count">{{ countByStatus(AttendanceStatus.Late) }}</span>
            </div>
            <div class="status-item status-excused">
              <span class="status-label">{{ t('ANWESENHEIT.selbst') }}</span>
              <span class="status-count">{{ countByStatus(AttendanceStatus.Excused) }}</span>
            </div>
            <div class="status-item status-passive">
              <span class="status-label">{{ t('ANWESENHEIT.passive') }}</span>
              <span class="status-count">{{ countByStatus(AttendanceStatus.Passive) }}</span>
            </div>
          </div>

          <div class="bulk-actions">
            <button 
              class="btn-bulk" 
              @click="markAllPresent"
              :disabled="saving"
            >
              Alle {{ t('ANWESENHEIT.present') }}
            </button>
          </div>
          
          <div class="attendance-table-wrapper">
            <table class="attendance-table">
              <thead>
                <tr>
                  <th class="student-name-col">{{ t('SCHUELER.schueler') }}</th>
                  <th class="status-col">{{ t('ANWESENHEIT.status') }}</th>
                  <th class="reason-col">{{ t('ANWESENHEIT.reason') }}</th>
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
                      v-if="attendance[student.id] && [AttendanceStatus.Absent, AttendanceStatus.Excused].includes(attendance[student.id].status)"
                      v-model="attendance[student.id].reason"
                      type="text"
                      class="reason-input"
                      :placeholder="`${t('ANWESENHEIT.reason')}...`"
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
              @click="handleSaveAttendance"
              :disabled="!hasAnyAttendance || saving"
            >
              {{ saving ? t('COMMON.loading') : t('COMMON.save') }}
            </button>
            <button 
              class="btn-secondary" 
              @click="clearAttendance"
              :disabled="!hasAnyAttendance || saving"
            >
              {{ t('COMMON.delete') }}
            </button>
          </div>
          
          <div v-if="saveError" class="error-message">
            {{ saveError }}
          </div>
          
          <div v-if="saveSuccess" class="success-message">
            {{ saveSuccess }}
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getSportBridge } from '../composables/useSportBridge'
import { getStudentsBridge } from '../composables/useStudentsBridge'
import { AttendanceStatus } from '@viccoboard/core'
import type { ClassGroup, Student } from '@viccoboard/core'

const route = useRoute()
const { t } = useI18n()

// Status options for quick selection
const statusOptions: Array<{ value: AttendanceStatus; label: string; short: string }> = [
  { value: AttendanceStatus.Present, label: t('ANWESENHEIT.present'), short: 'A' },
  { value: AttendanceStatus.Absent, label: t('ANWESENHEIT.absent'), short: 'Ab' },
  { value: AttendanceStatus.Late, label: t('ANWESENHEIT.verspaetet'), short: 'V' },
  { value: AttendanceStatus.Excused, label: t('ANWESENHEIT.selbst'), short: 'E' },
  { value: AttendanceStatus.Passive, label: t('ANWESENHEIT.passive'), short: 'P' }
]

// State
const classes = ref<ClassGroup[]>([])
const students = ref<Student[]>([])
const selectedClassId = ref<string>('')
const loading = ref(false)
const saving = ref(false)
const saveError = ref('')
const saveSuccess = ref('')

interface AttendanceEntry {
  status: AttendanceStatus
  reason?: string
}

const attendance = ref<Record<string, AttendanceEntry>>({})

// Bridge access
const sportBridge = getSportBridge()
const studentsBridge = getStudentsBridge()

// Computed
const currentDate = computed(() => {
  return new Date().toLocaleDateString('de-DE', { 
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
const countByStatus = (status: AttendanceStatus): number => {
  return Object.values(attendance.value).filter(a => a.status === status).length
}

const setStatus = (studentId: string, status: AttendanceStatus) => {
  if (!attendance.value[studentId]) {
    attendance.value[studentId] = { status }
  } else {
    attendance.value[studentId].status = status
  }
  
  // Clear reason if not absent/excused
  if (![AttendanceStatus.Absent, AttendanceStatus.Excused].includes(status)) {
    delete attendance.value[studentId].reason
  }
}

const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
  setStatus(studentId, status)
}

const markAllPresent = async () => {
  students.value.forEach(student => {
    setStatus(student.id, AttendanceStatus.Present)
  })
}

const clearAttendance = () => {
  attendance.value = {}
  saveError.value = ''
}

const onClassChange = async () => {
  if (!selectedClassId.value) {
    students.value = []
    attendance.value = {}
    return
  }
  
  loading.value = true
  try {
    students.value = await studentsBridge.studentRepository.findByClassGroup(selectedClassId.value)
    attendance.value = {}
  } catch (err) {
    console.error('Failed to load students:', err)
    saveError.value = t('COMMON.error')
  } finally {
    loading.value = false
  }
}

const handleSaveAttendance = async () => {
  saveError.value = ''
  saveSuccess.value = ''
  saving.value = true
  
  try {
    if (!selectedClassId.value) {
      throw new Error('Keine Klasse ausgewählt')
    }

    // Create a lesson for today
    const lesson = await sportBridge.createLessonUseCase.execute({
      classGroupId: selectedClassId.value,
      date: new Date()
    })
    
    // Prepare attendance records
    const records = Object.entries(attendance.value).map(([studentId, entry]) => ({
      studentId,
      lessonId: lesson.id,
      status: entry.status,
      reason: entry.reason,
      notes: undefined
    }))
    
    // Save using batch record
    await sportBridge.recordAttendanceUseCase.executeBatch(records)
    
    const savedCount = records.length
    saveSuccess.value = `${t('COMMON.success')} (${savedCount})`
    
    // Reset attendance after brief display
    setTimeout(() => {
      if (saveSuccess.value.includes(savedCount.toString())) {
        attendance.value = {}
        saveSuccess.value = ''
      }
    }, 2000)
  } catch (err) {
    console.error('Failed to save attendance:', err)
    if (err instanceof Error) {
      saveError.value = err.message
    } else {
      saveError.value = t('COMMON.error')
    }
  } finally {
    saving.value = false
  }
}

// Lifecycle
onMounted(async () => {
  try {
    classes.value = await sportBridge.classGroupRepository.findAll()
    
    // Check if classId is passed via query params
    const classIdFromQuery = route.query.classId as string
    if (classIdFromQuery) {
      selectedClassId.value = classIdFromQuery
      await onClassChange()
    }
  } catch (err) {
    console.error('Failed to load classes:', err)
    saveError.value = t('COMMON.error')
  }
})
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
  justify-content: flex-start;
  margin-bottom: 1rem;
}

.btn-bulk {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 8px;
  padding: 0.75rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
}

.btn-bulk:hover:not(:disabled) {
  background: #667eea;
  color: white;
}

.btn-bulk:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.attendance-table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.attendance-table {
  width: 100%;
  border-collapse: collapse;
}

.attendance-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #e0e0e0;
}

.student-name-col {
  width: 30%;
}

.status-col {
  width: 50%;
}

.reason-col {
  width: 20%;
}

.student-row {
  border-bottom: 1px solid #e0e0e0;
  transition: background 0.2s ease;
}

.student-row:hover {
  background: #fafafa;
}

.student-name {
  font-weight: 500;
  color: #333;
  font-size: 1rem;
  padding: 1rem;
}

.status-buttons-cell {
  padding: 0.75rem 1rem;
}

.status-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.status-btn {
  min-width: 44px;
  min-height: 44px;
  padding: 0.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-btn:hover:not(:disabled) {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.status-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.status-btn.active {
  border-width: 3px;
  transform: scale(1.05);
}

.status-btn-present.active {
  border-color: #4caf50;
  background: #e8f5e9;
}

.status-btn-absent.active {
  border-color: #f44336;
  background: #ffebee;
}

.status-btn-late.active {
  border-color: #ff9800;
  background: #fff3e0;
}

.status-btn-excused.active {
  border-color: #2196f3;
  background: #e3f2fd;
}

.status-btn-passive.active {
  border-color: #9c27b0;
  background: #f3e5f5;
}

.reason-cell {
  padding: 0.75rem 1rem;
}

.reason-input {
  width: 100%;
  padding: 0.625rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.95rem;
  min-height: 44px;
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
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
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

.error-message {
  padding: 1rem;
  border-radius: 6px;
  font-weight: 500;
  text-align: center;
  background: #ffebee;
  color: #c62828;
  border: 1px solid #f44336;
}

.success-message {
  padding: 1rem;
  border-radius: 6px;
  font-weight: 500;
  text-align: center;
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #4caf50;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .status-summary {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .attendance-table {
    font-size: 0.9rem;
  }
  
  .status-col {
    width: auto;
  }
  
  .reason-col {
    width: auto;
  }
  
  .status-buttons {
    flex-wrap: wrap;
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
    padding: 0 1.5rem;
  }
  
  .status-summary {
    grid-template-columns: repeat(5, 1fr);
  }
}

/* Touch-optimized spacing for iPad */
@media (hover: none) and (pointer: coarse) {
  .status-btn {
    min-width: 50px;
    min-height: 50px;
  }
  
  .btn-bulk,
  .btn-primary,
  .btn-secondary {
    min-height: 48px;
  }
}
</style>

