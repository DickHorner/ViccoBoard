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
          <div class="status-summary" v-if="statusOptions.length > 0">
            <div 
              v-for="status in statusOptions" 
              :key="status.value"
              class="status-item"
              :style="{ borderLeftColor: status.color || '#ccc' }"
            >
              <span class="status-label">{{ status.label }}</span>
              <span class="status-count">{{ countByStatus(status.value) }}</span>
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
                    <div class="status-buttons" v-if="statusOptions.length > 0">
                      <button 
                        v-for="status in statusOptions" 
                        :key="status.value"
                        @click="setStudentStatus(student.id, status.value)"
                        :class="['status-btn', `status-btn-${status.value.toLowerCase()}`, { 
                          'active': attendance[student.id]?.status === status.value 
                        }]"
                        :style="attendance[student.id]?.status === status.value ? { 
                          borderColor: status.color || '#667eea',
                          backgroundColor: status.color ? status.color + '22' : '#f0f0f0'
                        } : {}"
                        :disabled="saving || catalogLoading"
                        :title="status.label"
                        :aria-pressed="attendance[student.id]?.status === status.value"
                      >
                        {{ status.icon || status.short }}
                      </button>
                    </div>
                    <div v-else class="status-buttons">
                      <span class="text-muted">{{ t('COMMON.loading') }}...</span>
                    </div>
                  </td>
                  <td class="reason-cell">
                    <input 
                      v-if="attendance[student.id] && statusesWithReason.includes(attendance[student.id].status)"
                      v-model="attendance[student.id].reason"
                      type="text"
                      class="reason-input"
                      :placeholder="`${t('ANWESENHEIT.reason')}...`"
                      :disabled="saving"
                    />
                    <input
                      v-if="attendance[student.id]?.status === AttendanceStatus.Late"
                      v-model.number="attendance[student.id].lateMinutes"
                      type="number"
                      min="0"
                      step="1"
                      inputmode="numeric"
                      class="reason-input late-minutes-input"
                      placeholder="Minuten..."
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
import {
  ATTENDANCE_STATUSES_WITH_REASON,
  buildAttendanceRecords,
  shouldClearAttendanceAfterSave
} from '../utils/attendance-entry'
import { AttendanceStatus } from '@viccoboard/core'
import type { ClassGroup, Student, StatusOption } from '@viccoboard/core'

const route = useRoute()
const { t } = useI18n()

// State
const classes = ref<ClassGroup[]>([])
const students = ref<Student[]>([])
const selectedClassId = ref<string>('')
const currentLessonId = ref<string | null>(null)
const loading = ref(false)
const saving = ref(false)
const saveError = ref('')
const saveSuccess = ref('')
const statusCatalog = ref<StatusOption[]>([])
const catalogLoading = ref(false)

interface AttendanceEntry {
  status: AttendanceStatus
  reason?: string
  lateMinutes?: number
}

const attendance = ref<Record<string, AttendanceEntry>>({})

// Bridge access
const SportBridge = getSportBridge()
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

const statusesWithReason = [
  ...ATTENDANCE_STATUSES_WITH_REASON
]

// Status options derived from catalog
// Maps catalog StatusOption to UI format compatible with existing AttendanceStatus enum
const statusOptions = computed(() => {
  return statusCatalog.value
    .filter(status => status.active)
    .sort((a, b) => a.order - b.order)
    .map(status => {
      // Map common codes to AttendanceStatus enum values for backward compatibility
      let enumValue: AttendanceStatus
      const code = status.code.toUpperCase()
      
      switch (code) {
        case 'P':
          enumValue = AttendanceStatus.Present
          break
        case 'A':
        case 'AB':
          enumValue = AttendanceStatus.Absent
          break
        case 'E':
          enumValue = AttendanceStatus.Excused
          break
        case 'L':
        case 'V':
          enumValue = AttendanceStatus.Late
          break
        case 'PA':
          enumValue = AttendanceStatus.Passive
          break
        default:
          // For custom statuses, use Present as fallback (or could extend enum)
          enumValue = AttendanceStatus.Present
      }
      
      return {
        value: enumValue,
        label: status.name,
        short: status.code,
        color: status.color,
        icon: status.icon
      }
    })
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
  
  if (!statusesWithReason.includes(status)) {
    delete attendance.value[studentId].reason
  }

  if (status !== AttendanceStatus.Late) {
    delete attendance.value[studentId].lateMinutes
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
    statusCatalog.value = []
    return
  }
  
  loading.value = true
  catalogLoading.value = true
  try {
    // Load students and status catalog in parallel
    const [studentsResult, catalog] = await Promise.all([
      studentsBridge.studentRepository.findByClassGroup(selectedClassId.value),
      studentsBridge.statusCatalogRepository.getOrCreateForClassGroup(
        selectedClassId.value,
        'attendance'
      )
    ])
    
    students.value = studentsResult
    statusCatalog.value = catalog.statuses
    attendance.value = {}
  } catch (err) {
    saveError.value = t('COMMON.error')
  } finally {
    loading.value = false
    catalogLoading.value = false
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

    // Reuse existing lesson if editing, otherwise create a new one
    const wasEditingExistingLesson = !!currentLessonId.value
    let lessonId: string
    if (currentLessonId.value) {
      lessonId = currentLessonId.value
    } else {
      const now = new Date()
      const lesson = await SportBridge.createLessonUseCase.execute({
        classGroupId: selectedClassId.value,
        date: now,
        startTime: now.toTimeString().split(' ')[0].slice(0, 5),
        durationMinutes: 45
      })
      lessonId = lesson.id
      currentLessonId.value = lessonId
    }
    
    // Prepare attendance records
    const records = buildAttendanceRecords(attendance.value, lessonId)
    
    // Save using batch record
    await SportBridge.recordAttendanceUseCase.executeBatch(records)
    
    const savedCount = records.length
    saveSuccess.value = `${t('COMMON.success')} (${savedCount})`
    
    // Reset attendance after brief display in create mode only.
    setTimeout(() => {
      if (saveSuccess.value.includes(savedCount.toString())) {
        if (shouldClearAttendanceAfterSave(wasEditingExistingLesson)) {
          attendance.value = {}
        }
        saveSuccess.value = ''
      }
    }, 2000)
  } catch (err) {
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
    classes.value = await SportBridge.classGroupRepository.findAll()
    
    // Check if lessonId is passed via query params (edit mode)
    const lessonIdFromQuery = route.query.lessonId as string
    const classIdFromQuery = route.query.classId as string
    
    if (lessonIdFromQuery) {
      const lesson = await SportBridge.lessonRepository.findById(lessonIdFromQuery)
      if (lesson) {
        currentLessonId.value = lesson.id
        selectedClassId.value = lesson.classGroupId
        await onClassChange()
        // Load existing attendance records for this lesson
        const records = await SportBridge.attendanceRepository.findByLesson(lesson.id)
        for (const record of records) {
          attendance.value[record.studentId] = {
            status: record.status,
            reason: record.reason,
            lateMinutes: record.lateMinutes
          }
        }
      } else {
        saveError.value = t('COMMON.error')
      }
    } else if (classIdFromQuery) {
      selectedClassId.value = classIdFromQuery
      await onClassChange()
    }
  } catch (err) {
    saveError.value = t('COMMON.error')
  }
})
</script>

<style scoped src="./AttendanceEntry.css"></style>
