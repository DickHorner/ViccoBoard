<template>
  <div class="attendance-view">
    <div class="page-header">
      <RouterLink v-if="currentLessonId" :to="`/lessons/${currentLessonId}/workspace`" class="back-button">
        ← Zur Stunde
      </RouterLink>
      <button v-else class="back-button" @click="$router.back()">← {{ t('COMMON.back') }}</button>
      <h2>{{ t('ANWESENHEIT.title') }}</h2>
      <p class="page-description">{{ t('ANWESENHEIT.status') }}</p>
      <p v-if="currentLessonId" class="lesson-context" role="status">
        {{ selectedClassName || 'Klasse wird geladen…' }} · {{ currentDate }}
      </p>
      <RouterLink
        v-else-if="selectedClassId"
        :to="`/classes/${selectedClassId}`"
        class="class-link"
      >
        Zur Klasse
      </RouterLink>
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
            :disabled="Boolean(currentLessonId) || loading || saving"
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
          <p v-if="currentLessonId" class="field-hint">Diese Klasse gehört zur ausgewählten Stunde und kann hier nicht geändert werden.</p>
        </div>

        <div v-if="!currentLessonId" class="form-section">
          <label for="subject-select" class="form-label">Fach</label>
          <select
            id="subject-select"
            v-model="selectedSubjectId"
            class="form-select"
          >
            <option value="">Fach...</option>
            <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
              {{ subject.name }}
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
              :disabled="!hasAnyAttendance || saving || loading"
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
            <button
              class="btn-secondary"
              @click="exportAttendance"
              :disabled="!hasAnyAttendance || saving"
            >
              Export CSV
            </button>
          </div>

          <p class="text-muted">Lokales Exportformat (CSV UTF-8): {{ attendanceExportFormat }}</p>
          
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
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getSportBridge } from '../composables/useSportBridge'
import { getStudentsBridge } from '../composables/useStudentsBridge'
import {
  ATTENDANCE_STATUSES_WITH_REASON,
  buildAttendanceRecords,
  shouldClearAttendanceAfterSave
} from '../utils/attendance-entry'
import { buildAttendanceExportCsv, ATTENDANCE_EXPORT_COLUMNS } from '../utils/attendance-export'
import { downloadText } from '../utils/download'
import { AttendanceStatus } from '@viccoboard/core'
import type { ClassGroup, Student, StatusOption, Subject } from '@viccoboard/core'

const route = useRoute()
const { t } = useI18n()

// State
const classes = ref<ClassGroup[]>([])
const subjects = ref<Subject[]>([])
const students = ref<Student[]>([])
const selectedClassId = ref<string>('')
const selectedSubjectId = ref<string>('')
const currentLessonId = ref<string | null>(null)
const currentLessonDate = ref<Date | null>(null)
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

const exportAttendance = () => {
  if (!selectedClassId.value) {
    saveError.value = 'Keine Klasse ausgewählt'
    return
  }

  const selectedClass = classes.value.find((entry) => entry.id === selectedClassId.value)
  const lessonDate = currentLessonDate.value ?? new Date()
  const lessonId = currentLessonId.value ?? 'draft-' + lessonDate.toISOString().slice(0, 10)
  const rows = Object.entries(attendance.value).map(([studentId, entry]) => {
    const student = students.value.find((candidate) => candidate.id === studentId)
    return {
      studentId,
      firstName: student?.firstName ?? '',
      lastName: student?.lastName ?? '',
      status: entry.status,
      reason: entry.reason,
      lateMinutes: entry.lateMinutes
    }
  })

  const csv = buildAttendanceExportCsv({
    lessonId,
    classId: selectedClassId.value,
    className: selectedClass?.name ?? '',
    lessonDate,
    rows
  })

  const safeClassName = (selectedClass?.name ?? 'klasse').replace(/[^a-zA-Z0-9_-]/g, '-')
  downloadText(csv, `attendance-${safeClassName}-${lessonDate.toISOString().slice(0, 10)}.csv`)
  saveSuccess.value = 'Export heruntergeladen'
}

const attendance = ref<Record<string, AttendanceEntry>>({})

// Bridge access
const SportBridge = getSportBridge()
const studentsBridge = getStudentsBridge()

// Computed
const currentDate = computed(() => {
  return (currentLessonDate.value ?? new Date()).toLocaleDateString('de-DE', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
})

const selectedClassName = computed(() =>
  classes.value.find(group => group.id === selectedClassId.value)?.name ?? ''
)

const hasAnyAttendance = computed(() => {
  return Object.keys(attendance.value).length > 0
})

const statusesWithReason = [
  ...ATTENDANCE_STATUSES_WITH_REASON
]
const attendanceExportFormat = ATTENDANCE_EXPORT_COLUMNS.join('; ')

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

let classLoadVersion = 0

const onClassChange = async () => {
  const version = ++classLoadVersion
  const classId = selectedClassId.value
  students.value = []
  attendance.value = {}
  statusCatalog.value = []
  saveError.value = ''
  if (!classId) {
    loading.value = false
    catalogLoading.value = false
    return
  }

  loading.value = true
  catalogLoading.value = true
  try {
    const [studentsResult, catalog, existingRecords] = await Promise.all([
      studentsBridge.studentRepository.findByClassGroup(classId),
      studentsBridge.statusCatalogRepository.getOrCreateForClassGroup(classId, 'attendance'),
      currentLessonId.value
        ? SportBridge.attendanceRepository.findByLesson(currentLessonId.value)
        : Promise.resolve([])
    ])
    if (version !== classLoadVersion) return

    students.value = studentsResult
    statusCatalog.value = catalog.statuses
    attendance.value = Object.fromEntries(existingRecords.map(record => [
      record.studentId,
      { status: record.status, reason: record.reason, lateMinutes: record.lateMinutes }
    ]))
  } catch (err) {
    if (version === classLoadVersion) {
      console.error('Failed to load attendance context:', err)
      saveError.value = 'Anwesenheitsdaten konnten nicht geladen werden.'
    }
  } finally {
    if (version === classLoadVersion) {
      loading.value = false
      catalogLoading.value = false
    }
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

    if (!currentLessonId.value && !selectedSubjectId.value) {
      throw new Error('Kein Fach ausgewählt')
    }

    if (currentLessonId.value) {
      const lesson = await SportBridge.lessonRepository.findById(currentLessonId.value)
      if (!lesson || lesson.classGroupId !== selectedClassId.value) {
        throw new Error('Die Stunde gehört nicht zur ausgewählten Klasse.')
      }
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
        subjectId: selectedSubjectId.value,
        date: now,
        startTime: now.toTimeString().split(' ')[0].slice(0, 5),
        durationMinutes: 45
      })
      lessonId = lesson.id
      currentLessonId.value = lessonId
      currentLessonDate.value = lesson.date
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

// Lesson context is authoritative. Class/subject options load independently.
onMounted(async () => {
  const lookups = Promise.allSettled([
    SportBridge.classGroupRepository.findAll(),
    SportBridge.subjectRepository.findAll()
  ]).then(([loadedClasses, loadedSubjects]) => {
    if (loadedClasses.status === 'fulfilled') {
      classes.value = loadedClasses.value
    } else {
      console.error('Failed to load class options:', loadedClasses.reason)
      saveError.value = 'Klassen konnten nicht geladen werden.'
    }
    if (loadedSubjects.status === 'fulfilled') {
      subjects.value = loadedSubjects.value.sort((left, right) => left.name.localeCompare(right.name, 'de-DE'))
    } else {
      console.error('Failed to load subject options:', loadedSubjects.reason)
      saveError.value = 'Fächer konnten nicht geladen werden.'
    }
  })

  try {
    const lessonId = typeof route.query.lessonId === 'string' ? route.query.lessonId : ''
    const classId = typeof route.query.classId === 'string' ? route.query.classId : ''

    if (lessonId) {
      const lesson = await SportBridge.lessonRepository.findById(lessonId)
      if (!lesson) throw new Error('Die angeforderte Stunde wurde nicht gefunden.')
      currentLessonId.value = lesson.id
      currentLessonDate.value = lesson.date
      selectedClassId.value = lesson.classGroupId
      selectedSubjectId.value = lesson.subjectId
      await onClassChange()
    } else if (classId) {
      const classGroup = await SportBridge.classGroupRepository.findById(classId)
      if (!classGroup) throw new Error('Die angeforderte Klasse wurde nicht gefunden.')
      selectedClassId.value = classGroup.id
      await onClassChange()
    }
  } catch (err) {
    console.error('Failed to open attendance context:', err)
    saveError.value = err instanceof Error ? err.message : t('COMMON.error')
  }

  await lookups
})
</script>

<style scoped src="./AttendanceEntry.css"></style>
