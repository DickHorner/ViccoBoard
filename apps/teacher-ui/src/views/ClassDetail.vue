<template>
  <div class="class-detail-view">
    <div class="page-header">
      <Button severity="secondary" text icon="pi pi-arrow-left" label="Zurück" @click="$router.back()" />
      <div class="header-content">
        <div>
          <div class="class-title">
            <span class="class-color" :style="getClassColorStyle(classGroup?.color)"></span>
            <h2>{{ classGroup?.name || 'Wird geladen...' }}</h2>
          </div>
          <p class="page-description">Verwalten Sie Klasseninformationen, Schüler und Stunden.</p>
        </div>
        <Button v-if="classGroup" label="Klasse bearbeiten" icon="pi pi-pencil" @click="openEditModal" />
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Klasse wird geladen...</p>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <Button label="Erneut versuchen" @click="loadData" />
    </div>
    
    <!-- Class Details -->
    <div v-else-if="classGroup" class="class-info">
      <section class="card app-card">
        <h3>Klasseninformation</h3>
        <div class="info-grid">
          <div class="info-item">
            <label>Klassenname:</label>
            <span>{{ classGroup.name }}</span>
          </div>
          <div class="info-item">
            <label>Schuljahr:</label>
            <span>{{ classGroup.schoolYear }}</span>
          </div>
          <div class="info-item">
            <label>Schüler:</label>
            <span>{{ loadingStudents ? '…' : studentsError ? '–' : students.length }}</span>
          </div>
          <div class="info-item">
            <label>Bewertungsschema:</label>
            <span>{{ getGradingSchemeDisplay() }}</span>
          </div>
          <div class="info-item">
            <label>Status:</label>
            <span>{{ classGroup.archived ? 'Archiviert' : 'Aktiv' }}</span>
          </div>
          <div class="info-item">
            <label>Erstellt:</label>
            <span>{{ formatDate(classGroup.createdAt) }}</span>
          </div>
        </div>
      </section>
      
      <section class="card app-card">
        <div class="card-header">
          <h3>Schüler</h3>
          <div class="roster-actions">
            <label class="roster-toggle">
              <input v-model="showInactiveStudents" type="checkbox" />
              Ausgeschiedene anzeigen
            </label>
            <Button label="Schüler hinzufügen" icon="pi pi-plus" @click="showAddStudentModal = true" />
          </div>
        </div>
        <div class="card-content">
          <div v-if="loadingStudents" class="loading-state-small">
            <div class="spinner-small"></div>
            <p>Schüler werden geladen...</p>
          </div>
          <div v-else-if="studentsError" class="error-state">
            <p>{{ studentsError }}</p>
            <Button label="Erneut versuchen" @click="loadStudents" />
          </div>
          <div v-else-if="visibleStudents.length === 0" class="empty-state">
            <p>Noch keine Schüler in dieser Klasse. Fügen Sie Ihren ersten Schüler hinzu.</p>
          </div>
          
          <div v-else class="student-list">
            <div v-for="student in visibleStudents" :key="student.id" class="student-card">
              <RouterLink
                :to="`/students/${student.id}`"
                class="student-profile-link"
                @pointerenter="prefetchStudentSport(student.id)"
                @pointerdown="prefetchStudentSport(student.id)"
                @focus="prefetchStudentSport(student.id)"
                @click="rememberStudentForNavigation(student)"
              >
                <div class="student-avatar">{{ getInitials(student.firstName, student.lastName) }}</div>
                <div class="student-info">
                  <h4>{{ student.firstName }} {{ student.lastName }}</h4>
                  <p v-if="student.dateOfBirth">Geb.: {{ formatGermanDateOfBirth(student.dateOfBirth) }}</p>
                  <p v-if="student.inactive">Nicht mehr in der Klasse</p>
                </div>
                <div class="student-arrow">→</div>
              </RouterLink>
              <Button
                severity="secondary"
                :label="student.inactive ? 'Wieder aufnehmen' : 'Aus Klasse nehmen'"
                :loading="updatingRosterId === student.id"
                :disabled="updatingRosterId === student.id"
                @click="toggleStudentActive(student)"
              />
            </div>
          </div>
        </div>
      </section>
      
      <section class="card app-card">
        <h3>Sport-Kennzahlen</h3>
        <div class="card-content">
          <p v-if="loadingSummary" role="status">Sport-Kennzahlen werden geladen...</p>
          <div v-else-if="summaryError" class="error-state">
            <p>{{ summaryError }}</p>
            <Button v-if="!studentsError" label="Erneut versuchen" @click="loadSportSummary" />
          </div>
          <div v-else class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ sportSummary.lessonCount }}</div>
              <div class="stat-label">Unterrichtsstunden</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ sportSummary.gradeCategoryCount }}</div>
              <div class="stat-label">Bewertungskategorien</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ sportSummary.assessmentCount }}</div>
              <div class="stat-label">Bewertungen</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ sportSummary.studentCount }}</div>
              <div class="stat-label">Schüler</div>
            </div>
          </div>
        </div>
      </section>

      <section class="card app-card sport-workbench-card">
        <h3>Sport-Arbeitsbereiche</h3>
        <div class="card-content">
          <RouterLink
            v-for="area in sportWorkAreas"
            :key="area.to"
            :to="area.to"
            class="action-button"
          >
            <span class="action-icon">{{ area.icon }}</span>
            <span class="action-text">
              <span class="action-label">{{ area.label }}</span>
              <span class="action-description">{{ area.description }}</span>
            </span>
            <span class="action-arrow">→</span>
          </RouterLink>
          <button class="action-button" @click="openEditModal">
            <span class="action-icon">✏️</span>
            <span class="action-text">
              <span class="action-label">Klasse bearbeiten</span>
              <span class="action-description">Klasseninformationen anpassen</span>
            </span>
          </button>
        </div>
      </section>
    </div>
    

    <!-- Add Student Dialog -->
    <Dialog :visible="showAddStudentModal" @update:visible="visible => { if (!visible) closeAddStudentModal() }" modal :header="`Schüler zu ${classGroup?.name ?? 'Klasse'} hinzufügen`" :style="{ width: '32rem', maxWidth: 'calc(100vw - 2rem)' }">
      <form @submit.prevent="handleAddStudent" class="modal-form">
        <div class="form-group">
          <label for="firstName">Vorname *</label>
          <InputText id="firstName" v-model="newStudent.firstName" placeholder="z.B. Max" required fluid />
        </div>
        <div class="form-group">
          <label for="lastName">Nachname *</label>
          <InputText id="lastName" v-model="newStudent.lastName" placeholder="z.B. Mustermann" required fluid />
        </div>
        <div class="form-group">
          <label for="dateOfBirth">Geburtsdatum</label>
          <InputText id="dateOfBirth" v-model="newStudent.dateOfBirth" placeholder="TT.MM.JJJJ" fluid />
        </div>
        <div class="form-group">
          <label for="gender">Geschlecht</label>
          <Select inputId="gender" v-model="newStudent.gender" :options="genderOptions" optionLabel="label" optionValue="value" fluid />
        </div>
        <div class="form-group">
          <label for="email">E-Mail</label>
          <InputText id="email" v-model="newStudent.email" type="email" placeholder="z.B. max@schule.de" fluid />
        </div>
        <Message v-if="addStudentError" severity="error" role="alert">{{ addStudentError }}</Message>
        <div class="modal-actions">
          <Button type="button" severity="secondary" label="Abbrechen" @click="closeAddStudentModal" />
          <Button type="submit" :label="addingStudent ? 'Wird hinzugefügt...' : 'Schüler hinzufügen'" :loading="addingStudent" :disabled="addingStudent" />
        </div>
      </form>
    </Dialog>

    <!-- Edit Class Dialog -->
    <Dialog :visible="showEditModal" @update:visible="visible => { if (!visible) closeEditModal() }" modal header="Klasse bearbeiten" :style="{ width: '32rem', maxWidth: 'calc(100vw - 2rem)' }">
      <form @submit.prevent="handleUpdateClass" class="modal-form">
        <div class="form-group">
          <label for="detailClassName">Klassenname *</label>
          <InputText id="detailClassName" v-model="editClassData.name" required fluid />
        </div>
        <div class="form-group">
          <label for="detailSchoolYear">Schuljahr *</label>
          <InputText id="detailSchoolYear" v-model="editClassData.schoolYear" pattern="\\d{4}/\\d{4}" required fluid />
          <small class="form-hint">Format: YYYY/YYYY</small>
        </div>
        <div class="form-group">
          <label for="detailGradeLevel">Klassenstufe</label>
          <InputNumber inputId="detailGradeLevel" :modelValue="editClassData.gradeLevel" @update:modelValue="value => editClassData.gradeLevel = value ?? undefined" :min="1" :max="13" :useGrouping="false" fluid />
        </div>
        <div class="form-group">
          <label for="detailGradingScheme">Notenschema</label>
          <Select inputId="detailGradingScheme" v-model="editClassData.gradingScheme" :options="gradingSchemeOptions" optionLabel="label" optionValue="value" fluid />
        </div>
        <div class="form-group">
          <label for="detailClassColor">Klassenfarbe</label>
          <Select inputId="detailClassColor" v-model="editClassData.color" :options="classColorOptions" optionLabel="label" optionValue="value" fluid />
        </div>
        <Message v-if="editError" severity="error" role="alert">{{ editError }}</Message>
        <div class="modal-actions">
          <Button type="button" severity="secondary" label="Abbrechen" @click="closeEditModal" />
          <Button type="submit" :label="editingClass ? 'Wird gespeichert...' : 'Änderungen speichern'" :loading="editingClass" :disabled="editingClass" />
        </div>
      </form>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, onMounted, onUnmounted } from 'vue'
import Button from 'openvue/button'
import Dialog from 'openvue/dialog'
import InputNumber from 'openvue/inputnumber'
import InputText from 'openvue/inputtext'
import Message from 'openvue/message'
import Select from 'openvue/select'
import { RouterLink, useRoute } from 'vue-router'
import { getSportBridge, initializeSportBridge, useClassGroups } from '../composables/useSportBridge'
import { getStudentsBridge, initializeStudentsBridge } from '../composables/useStudentsBridge'
import { buildClassSportSummary, buildSportWorkAreas } from '../utils/class-detail-summary'
import { DEFAULT_GRADING_SCHEME, GRADING_SCHEMES } from '../constants/grading'
import { formatGermanDateOfBirth } from '../utils/locale-format'
import type { ClassGroup, Student } from '@viccoboard/core'
import { loadClassStudents, prefetchStudentSport, rememberStudentForNavigation, scheduleViewPrefetch, takeClassForNavigation } from '../services/navigation-prefetch'
import { recordRouteContentReady } from '../utils/navigation-performance'

const route = useRoute()

// State
const classId = route.params.id as string
const classGroup = ref<ClassGroup | null>(null)
const students = ref<Student[]>([])
const loading = ref(false)
const loadingStudents = ref(true)
const loadingSummary = ref(true)
const studentsError = ref('')
let cancelProfilePrefetch: (() => void) | null = null
const summaryError = ref('')
const showInactiveStudents = ref(false)
const updatingRosterId = ref<string | null>(null)
const visibleStudents = computed(() => showInactiveStudents.value
  ? students.value
  : students.value.filter(student => !student.inactive))
const error = ref('')
const showAddStudentModal = ref(false)
const addingStudent = ref(false)
const addStudentError = ref('')
const showEditModal = ref(false)
const editingClass = ref(false)
const editError = ref('')
const editClassData = ref({ name: '', schoolYear: '', gradeLevel: undefined as number | undefined, gradingScheme: DEFAULT_GRADING_SCHEME as string, color: '' })
const gradingSchemeOptions = Object.entries(GRADING_SCHEMES).map(([value, label]) => ({ value, label }))
const classColorOptions = [
  { value: '', label: 'Keine' },
  { value: 'white', label: 'Weiß' },
  { value: 'green', label: 'Grün' },
  { value: 'red', label: 'Rot' },
  { value: 'blue', label: 'Blau' },
  { value: 'orange', label: 'Orange' },
  { value: 'yellow', label: 'Gelb' },
  { value: 'grey', label: 'Grau' }
]
const genderOptions = [
  { value: '', label: 'Nicht angegeben' },
  { value: 'm', label: 'Männlich' },
  { value: 'f', label: 'Weiblich' }
]

const sportSummary = ref(buildClassSportSummary(0, 0, 0, 0))
const sportWorkAreas = ref(buildSportWorkAreas(''))

const newStudent = ref({
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '' as '' | 'm' | 'f',
  email: ''
})

initializeSportBridge()
initializeStudentsBridge()

// Composables
const classGroups = useClassGroups()
const sportBridge = getSportBridge()
const studentsBridge = getStudentsBridge()

// Methods
const loadData = async () => {
  loading.value = true
  error.value = ''

  try {
    classGroup.value = takeClassForNavigation(classId) ?? await classGroups.findById(classId)
    if (!classGroup.value) {
      error.value = 'Klasse nicht gefunden'
      return
    }

    sportWorkAreas.value = buildSportWorkAreas(classId)
  } catch (err) {
    console.error('Failed to load class:', err)
    error.value = 'Fehler beim Laden der Klasse. Bitte versuchen Sie es erneut.'
  } finally {
    loading.value = false
  }

  if (classGroup.value) {
    void loadStudents()
  }
}

const loadStudents = async () => {
  loadingStudents.value = true
  studentsError.value = ''

  try {
    students.value = await loadClassStudents(classId)
  } catch (err) {
    console.error('Failed to load class students:', err)
    studentsError.value = 'Schüler konnten nicht geladen werden.'
    loadingSummary.value = false
    summaryError.value = 'Sport-Kennzahlen können ohne Schülerliste nicht geladen werden.'
  } finally {
    loadingStudents.value = false
  }

  if (!studentsError.value) {
    await nextTick()
    recordRouteContentReady('class-detail')
    cancelProfilePrefetch?.()
    cancelProfilePrefetch = scheduleViewPrefetch(() => import('./StudentProfile.vue'))
    void loadSportSummary()
  }
}

const loadSportSummary = async () => {
  loadingSummary.value = true
  summaryError.value = ''

  try {
    const [lessonCount, gradeCategoryCount, studentCounts] = await Promise.all([
      sportBridge.lessonRepository.count({ class_group_id: classId }),
      sportBridge.gradeCategoryRepository.count({ class_group_id: classId }),
      Promise.all(students.value.map(student =>
        sportBridge.performanceEntryRepository.count({ student_id: student.id })
      ))
    ])

    sportSummary.value = buildClassSportSummary(
      students.value.filter(student => !student.inactive).length,
      lessonCount,
      gradeCategoryCount,
      studentCounts.reduce((sum, count) => sum + count, 0)
    )
  } catch (err) {
    console.error('Failed to load class sport summary:', err)
    summaryError.value = 'Sport-Kennzahlen konnten nicht geladen werden.'
  } finally {
    loadingSummary.value = false
  }
}

const handleAddStudent = async () => {
  addStudentError.value = ''
  addingStudent.value = true
  
  try {
    await studentsBridge.addStudentUseCase.execute({
      firstName: newStudent.value.firstName.trim(),
      lastName: newStudent.value.lastName.trim(),
      classGroupId: classId,
      dateOfBirth: newStudent.value.dateOfBirth,
      gender: newStudent.value.gender || undefined,
      email: newStudent.value.email.trim() || undefined
    })
    
    // Reload students
    students.value = await studentsBridge.studentRepository.findAllByClassGroup(classId)
    sportSummary.value = {
      ...sportSummary.value,
      studentCount: students.value.filter(student => !student.inactive).length
    }

    // Reset form and close modal
    closeAddStudentModal()
  } catch (err) {
    console.error('Failed to add student:', err)
    if (err instanceof Error) {
      addStudentError.value = err.message
    } else {
      addStudentError.value = 'Fehler beim Hinzufügen des Schülers. Bitte versuchen Sie es erneut.'
    }
  } finally {
    addingStudent.value = false
  }
}

const toggleStudentActive = async (student: Student) => {
  if (!student.inactive && !window.confirm(
    `${student.firstName} ${student.lastName} aus der aktiven Klassenliste nehmen? Die Leistungen bleiben erhalten.`
  )) return

  updatingRosterId.value = student.id
  try {
    const updated = await studentsBridge.studentRepository.update(student.id, { inactive: !student.inactive })
    students.value = students.value.map(entry => entry.id === updated.id ? updated : entry)
    sportSummary.value = {
      ...sportSummary.value,
      studentCount: students.value.filter(entry => !entry.inactive).length
    }
  } catch (err) {
    console.error('Failed to update roster:', err)
    error.value = 'Die Schülerzuordnung konnte nicht aktualisiert werden.'
  } finally {
    updatingRosterId.value = null
  }
}

const openEditModal = () => {
  if (!classGroup.value) return
  const group = classGroup.value
  editClassData.value = {
    name: group.name,
    schoolYear: group.schoolYear,
    gradeLevel: group.gradeLevel,
    gradingScheme: group.gradingScheme || DEFAULT_GRADING_SCHEME,
    color: group.color || ''
  }
  editError.value = ''
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  editError.value = ''
}

const handleUpdateClass = async () => {
  if (!classGroup.value) return
  editingClass.value = true
  editError.value = ''
  try {
    await classGroups.update(classId, {
      name: editClassData.value.name.trim(),
      schoolYear: editClassData.value.schoolYear.trim(),
      gradeLevel: editClassData.value.gradeLevel,
      gradingScheme: editClassData.value.gradingScheme,
      color: editClassData.value.color || undefined
    })
    classGroup.value = await classGroups.findById(classId)
    closeEditModal()
  } catch (err) {
    console.error('Failed to update class:', err)
    editError.value = err instanceof Error ? err.message : 'Klasse konnte nicht gespeichert werden.'
  } finally {
    editingClass.value = false
  }
}

const closeAddStudentModal = () => {
  showAddStudentModal.value = false
  addStudentError.value = ''
  newStudent.value = { firstName: '', lastName: '', dateOfBirth: '', gender: '', email: '' }
}

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('de-DE')
}

const getGradingSchemeDisplay = (): string => {
  return classGroup.value?.gradingScheme || 'Standard'
}

const getClassColorStyle = (color?: string) => {
  if (!color) {
    return { backgroundColor: '#e0e0e0' }
  }
  const colorMap: Record<string, string> = {
    white: '#f8f9fa',
    green: '#7ed957',
    red: '#ff6b6b',
    blue: '#4dabf7',
    orange: '#ffa94d',
    yellow: '#ffd43b',
    grey: '#adb5bd'
  }
  return { backgroundColor: colorMap[color] || '#e0e0e0' }
}

const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

// Lifecycle
onMounted(() => {
  void loadData()
})

onUnmounted(() => {
  cancelProfilePrefetch?.()
})
</script>

<style scoped src="./ClassDetail.style2.css"></style>
