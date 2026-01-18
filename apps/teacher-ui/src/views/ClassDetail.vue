<template>
  <div class="class-detail-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← Back</button>
      <div class="header-content">
        <div>
          <h2>{{ classGroup?.name || 'Loading...' }}</h2>
          <p class="page-description">View and manage class information, students, and lessons.</p>
        </div>
        <button v-if="classGroup" class="btn-primary" @click="showEditModal = true">
          Edit Class
        </button>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading class details...</p>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-primary" @click="loadData">Retry</button>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading class details...</p>
    </div>
    
    <!-- Error State -->
    <div v-else-if="loadError" class="error-state">
      <p>{{ loadError }}</p>
      <button class="btn-primary" @click="loadData">Retry</button>
    </div>
    
    <!-- Class Details -->
    <div v-else-if="classGroup" class="class-info">
      <section class="card">
        <h3>Class Information</h3>
        <div class="info-grid">
          <div class="info-item">
            <label>Class Name:</label>
            <span>{{ classGroup.name }}</span>
          </div>
          <div class="info-item">
            <label>School Year:</label>
            <span>{{ classGroup.schoolYear }}</span>
          </div>
          <div class="info-item">
            <label>Students:</label>
            <span>{{ students.length }}</span>
          </div>
          <div class="info-item">
            <label>Grading Scheme:</label>
            <span>{{ getGradingSchemeDisplay() }}</span>
          </div>
          <div class="info-item">
            <label>Created:</label>
            <span>{{ formatDate(classGroup.createdAt) }}</span>
          </div>
        </div>
      </section>
      
      <section class="card">
        <div class="card-header">
          <h3>Students</h3>
          <button class="btn-primary btn-small" @click="showAddStudentModal = true">
            + Add Student
          </button>
        </div>
        <div class="card-content">
          <!-- Empty State -->
          <div v-if="students.length === 0" class="empty-state">
            <p>No students in this class yet. Add your first student to get started.</p>
          </div>
          
          <!-- Students List -->
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
                <p v-if="student.dateOfBirth">Birth: {{ student.dateOfBirth.getFullYear() }}</p>
              </div>
              <div class="student-arrow">→</div>
            </RouterLink>
          </div>
        </div>
      </section>
      
      <section class="card">
        <h3>Statistics</h3>
        <div class="card-content">
          <p class="info-note">📊 Statistics will be calculated from actual attendance and assessment data.</p>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ statistics.attendanceRate }}%</div>
              <div class="stat-label">Attendance Rate</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ statistics.totalLessons }}</div>
              <div class="stat-label">Total Lessons</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ statistics.assessmentCount }}</div>
              <div class="stat-label">Assessments</div>
            </div>
          </div>
        </div>
      </section>
      
      <section class="card">
        <h3>Quick Actions</h3>
        <div class="card-content">
          <RouterLink 
            :to="`/attendance?classId=${classGroup.id}`" 
            class="action-button"
          >
            <span class="action-icon">✓</span>
            <span>Record Attendance</span>
          </RouterLink>
          <button class="action-button" @click="showEditModal = true">
            <span class="action-icon">✏️</span>
            <span>Edit Class Info</span>
          </button>
        </div>
      </section>
    </div>
    
    <!-- Add Student Modal -->
    <div v-if="showAddStudentModal" class="modal-overlay" @click="closeAddStudentModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Add Student</h3>
          <button 
            class="modal-close" 
            @click="closeAddStudentModal"
            aria-label="Close add student form"
          >
            ✕
          </button>
        </div>
        
        <form @submit.prevent="handleAddStudent" class="modal-form">
          <div class="form-group">
            <label for="firstName">First Name *</label>
            <input
              id="firstName"
              v-model="newStudent.firstName"
              type="text"
              placeholder="e.g., John"
              required
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="lastName">Last Name *</label>
            <input
              id="lastName"
              v-model="newStudent.lastName"
              type="text"
              placeholder="e.g., Doe"
              required
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="birthYear">Birth Year</label>
            <input
              id="birthYear"
              v-model.number="newStudent.birthYear"
              type="number"
              placeholder="e.g., 2010"
              min="1900"
              :max="new Date().getFullYear()"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="gender">Gender</label>
            <select id="gender" v-model="newStudent.gender" class="form-input">
              <option value="">Not specified</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="diverse">Diverse</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="newStudent.email"
              type="email"
              placeholder="student@example.com"
              class="form-input"
            />
          </div>
          
          <div v-if="addStudentError" class="error-message">
            {{ addStudentError }}
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeAddStudentModal" class="btn-secondary">
              Cancel
            </button>
            <button type="submit" :disabled="addingStudent" class="btn-primary">
              {{ addingStudent ? 'Adding...' : 'Add Student' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useClassGroups, useStudents } from '../composables/useSportBridge'
import { getInitials } from '../utils/stringUtils'
import type { ClassGroup, Student } from '../db'

const route = useRoute()
const classId = route.params.id as string

// State
const classGroup = ref<ClassGroup | undefined>(undefined)
const students = ref<Student[]>([])
const loading = ref(true)
const loadError = ref('')
const showAddStudentModal = ref(false)
const addingStudent = ref(false)
const addStudentError = ref('')

const newStudent = ref({
  firstName: '',
  lastName: '',
  birthYear: undefined as number | undefined,
  gender: '' as '' | 'male' | 'female' | 'diverse',
  email: ''
})

// Composables
const classGroups = useClassGroups()
const studentsComposable = useStudents()

// Methods
const loadData = async () => {
  loading.value = true
  loadError.value = ''
  
  try {
    // Load class details
    classGroup.value = await classGroups.getById(classId)
    
    if (!classGroup.value) {
      loadError.value = 'Class not found'
      return
    }
    
    // Load students for this class
    students.value = await studentsComposable.getByClassId(classId)
  } catch (err) {
    console.error('Failed to load class details:', err)
    loadError.value = 'Failed to load class details. Please try again.'
  } finally {
    loading.value = false
  }
}

const handleAddStudent = async () => {
  addStudentError.value = ''
  addingStudent.value = true
  
  try {
    await studentsComposable.create({
      firstName: newStudent.value.firstName.trim(),
      lastName: newStudent.value.lastName.trim(),
      classGroupId: classId,
      birthYear: newStudent.value.birthYear,
      gender: newStudent.value.gender || undefined,
      email: newStudent.value.email.trim() || undefined
    })
    
    // Reload students
    students.value = await studentsComposable.getByClassId(classId)
    
    // Reset form and close modal
    closeAddStudentModal()
  } catch (err) {
    console.error('Failed to add student:', err)
    if (err instanceof Error) {
      addStudentError.value = err.message
    } else {
      addStudentError.value = 'Failed to add student. Please try again.'
    }
  } finally {
    addingStudent.value = false
  }
}

const closeEditModal = () => {
  showEditModal.value = false
  editError.value = ''
  if (classGroup.value) {
    editForm.value = {
      name: classGroup.value.name,
      schoolYear: classGroup.value.schoolYear
    }
  }
}

const closeAddStudentModal = () => {
  showAddStudentModal.value = false
  studentError.value = ''
  studentForm.value = { firstName: '', lastName: '', email: '' }
}

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString()
}

const getGradingSchemeDisplay = (): string => {
  // TODO: Get actual grading scheme from class when gradingScheme field is added to ClassGroup
  return GRADING_SCHEMES[DEFAULT_GRADING_SCHEME] || 'Not set'
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<style src="../styles/modal.css"></style>

<style scoped>
.class-detail-view {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
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
}

.info-note {
  background: #e7f3ff;
  border-left: 4px solid #667eea;
  padding: 0.75rem 1rem;
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 0.9rem;
  border-radius: 4px;
}

.class-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  border-bottom: 2px solid #667eea;
  padding-bottom: 0.5rem;
}

.card-header h3 {
  margin: 0;
  border: none;
  padding: 0;
}

.info-grid {
  display: grid;
  gap: 1rem;
}

.info-item {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 0.5rem;
  padding: 0.5rem 0;
}

.info-item label {
  font-weight: 600;
  color: #666;
}

.info-item span {
  color: #333;
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

.student-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.student-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: #f8f9fa;
  border-radius: 8px;
  text-decoration: none;
  color: #333;
  transition: all 0.2s ease;
  min-height: 44px;
}

.student-card:hover {
  background: #e9ecef;
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.student-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #667eea;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.student-info {
  flex: 1;
}

.student-info h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  color: #333;
}

.student-info p {
  margin: 0;
  font-size: 0.85rem;
  color: #666;
}

.student-arrow {
  font-size: 1.5rem;
  color: #667eea;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1.5rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #666;
  font-weight: 500;
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

.btn-primary:hover {
  background: #5568d3;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  min-height: 36px;
}

.btn-secondary {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 8px;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
}

.btn-secondary:hover {
  background: #f8f9fa;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: #f8f9fa;
  border-radius: 8px;
  text-decoration: none;
  color: #333;
  transition: all 0.2s ease;
  min-height: 44px; /* Touch target minimum */
  font-weight: 500;
  border: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
}

.action-button:hover {
  background: #e9ecef;
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  padding: 0;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.modal-close:hover {
  background: #f8f9fa;
}

.modal-form {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.form-input {
  padding: 0.875rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-hint {
  font-size: 0.8rem;
  color: #666;
}

.error-message {
  padding: 0.875rem;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  color: #c33;
  font-size: 0.9rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .class-info {
    grid-template-columns: 1fr;
  }
  
  .info-item {
    grid-template-columns: 1fr;
  }
  
  .header-content {
    flex-direction: column;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .modal {
    margin: 0;
    border-radius: 0;
    max-height: 100vh;
    height: 100%;
  }
  
  .modal-actions {
    flex-direction: column-reverse;
  }
  
  .modal-actions button {
    width: 100%;
  }
}
</style>
