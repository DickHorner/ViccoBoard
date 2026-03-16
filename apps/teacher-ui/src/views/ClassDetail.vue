<template>
  <div class="class-detail-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← Zurück</button>
      <div class="header-content">
        <div>
          <div class="class-title">
            <span class="class-color" :style="getClassColorStyle(classGroup?.color)"></span>
            <h2>{{ classGroup?.name || 'Wird geladen...' }}</h2>
          </div>
          <p class="page-description">Verwalten Sie Klasseninformationen, Schüler und Stunden.</p>
        </div>
        <button v-if="classGroup" class="btn-primary" @click="showEditModal = true">
          Klasse bearbeiten
        </button>
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
      <button class="btn-primary" @click="loadData">Erneut versuchen</button>
    </div>
    
    <!-- Class Details -->
    <div v-else-if="classGroup" class="class-info">
      <section class="card">
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
            <span>{{ students.length }}</span>
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
      
      <section class="card">
        <div class="card-header">
          <h3>Schüler</h3>
          <button class="btn-primary btn-small" @click="showAddStudentModal = true">
            + Schüler hinzufügen
          </button>
        </div>
        <div class="card-content">
          <div v-if="loadingStudents" class="loading-state-small">
            <div class="spinner-small"></div>
            <p>Schüler werden geladen...</p>
          </div>
          <div v-else-if="students.length === 0" class="empty-state">
            <p>Noch keine Schüler in dieser Klasse. Fügen Sie Ihren ersten Schüler hinzu.</p>
          </div>
          
          <div v-else class="student-list">
            <RouterLink 
              v-for="student in students" 
              :key="student.id"
              :to="`/students/${student.id}`"
              class="student-card"
            >
              <div class="student-avatar">{{ getInitials(student.firstName, student.lastName) }}</div>
              <div class="student-info">
                <h4>{{ student.firstName }} {{ student.lastName }}</h4>
                <p v-if="student.birthYear">Geb.: {{ student.birthYear }}</p>
              </div>
              <div class="student-arrow">→</div>
            </RouterLink>
          </div>
        </div>
      </section>
      
      <section class="card">
        <h3>Sport-Kennzahlen</h3>
        <div class="card-content">
          <div class="stats-grid">
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

      <section class="card sport-workbench-card">
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
          <button class="action-button" @click="showEditModal = true">
            <span class="action-icon">✏️</span>
            <span class="action-text">
              <span class="action-label">Klasse bearbeiten</span>
              <span class="action-description">Klasseninformationen anpassen</span>
            </span>
          </button>
        </div>
      </section>
    </div>
    
    <!-- Add Student Modal -->
    <div v-if="showAddStudentModal" class="modal-overlay" @click="closeAddStudentModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Schüler zu {{ classGroup?.name }} hinzufügen</h3>
          <button class="modal-close" @click="closeAddStudentModal" aria-label="Dialog schließen">✕</button>
        </div>
        
        <form @submit.prevent="handleAddStudent" class="modal-form">
          <div class="form-group">
            <label for="firstName">Vorname</label>
            <input
              id="firstName"
              v-model="newStudent.firstName"
              type="text"
              placeholder="z.B. Max"
              required
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="lastName">Nachname</label>
            <input
              id="lastName"
              v-model="newStudent.lastName"
              type="text"
              placeholder="z.B. Mustermann"
              required
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="birthYear">Geburtsjahr</label>
            <input
              id="birthYear"
              v-model.number="newStudent.birthYear"
              type="number"
              placeholder="z.B. 2010"
              min="1900"
              :max="new Date().getFullYear()"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="gender">Geschlecht</label>
            <select id="gender" v-model="newStudent.gender" class="form-input">
              <option value="">Nicht angegeben</option>
              <option value="male">Männlich</option>
              <option value="female">Weiblich</option>
              <option value="diverse">Divers</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="email">E-Mail</label>
            <input
              id="email"
              v-model="newStudent.email"
              type="email"
              placeholder="z.B. max@schule.de"
              class="form-input"
            />
          </div>
          
          <div v-if="addStudentError" class="error-message">
            {{ addStudentError }}
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeAddStudentModal" class="btn-secondary">
              Abbrechen
            </button>
            <button type="submit" :disabled="addingStudent" class="btn-primary">
              {{ addingStudent ? 'Wird hinzugefügt...' : 'Schüler hinzufügen' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { getSportBridge, initializeSportBridge, useClassGroups } from '../composables/useSportBridge'
import { getStudentsBridge, initializeStudentsBridge } from '../composables/useStudentsBridge'
import { buildClassSportSummary, buildSportWorkAreas } from '../utils/class-detail-summary'
import type { ClassGroup, Student } from '@viccoboard/core'

const route = useRoute()

// State
const classId = route.params.id as string
const classGroup = ref<ClassGroup | null>(null)
const students = ref<Student[]>([])
const loading = ref(false)
const loadingStudents = ref(false)
const error = ref('')
const showAddStudentModal = ref(false)
const addingStudent = ref(false)
const addStudentError = ref('')
const showEditModal = ref(false)

const sportSummary = ref(buildClassSportSummary(0, 0, 0, 0))
const sportWorkAreas = ref(buildSportWorkAreas(''))

const newStudent = ref({
  firstName: '',
  lastName: '',
  birthYear: undefined as number | undefined,
  gender: '' as '' | 'male' | 'female' | 'diverse',
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
    // Load class details
    classGroup.value = await classGroups.findById(classId)
    
    if (!classGroup.value) {
      error.value = 'Klasse nicht gefunden'
      return
    }
    
    // Load students for this class
    students.value = await studentsBridge.studentRepository.findByClassGroup(classId)

    // Load sport-specific data for summary cards
    const [lessons, gradeCategories, studentEntryArrays] = await Promise.all([
      sportBridge.lessonRepository.findByClassGroup(classId),
      sportBridge.gradeCategoryRepository.findByClassGroup(classId),
      Promise.all(
        students.value.map((s) => sportBridge.performanceEntryRepository.findByStudent(s.id))
      )
    ])

    const classAssessmentCount = studentEntryArrays.reduce((sum, entries) => sum + entries.length, 0)

    sportSummary.value = buildClassSportSummary(
      students.value.length,
      lessons.length,
      gradeCategories.length,
      classAssessmentCount
    )
    sportWorkAreas.value = buildSportWorkAreas(classId)
  } catch (err) {
    console.error('Failed to load class:', err)
    error.value = 'Fehler beim Laden der Klasse. Bitte versuchen Sie es erneut.'
  } finally {
    loading.value = false
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
      birthYear: newStudent.value.birthYear,
      gender: newStudent.value.gender || undefined,
      email: newStudent.value.email.trim() || undefined
    })
    
    // Reload students
    students.value = await studentsBridge.studentRepository.findByClassGroup(classId)
    
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

const closeAddStudentModal = () => {
  showAddStudentModal.value = false
  addStudentError.value = ''
  newStudent.value = { firstName: '', lastName: '', birthYear: undefined, gender: '', email: '' }
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
  loadData()
})
</script>

<style src="../styles/modal.css"></style>

<style scoped src="./ClassDetail.style2.css"></style>
