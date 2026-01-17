<template>
  <div class="class-detail-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← Back</button>
      <h2>Class Detail</h2>
      <p class="page-description">View and manage class information, students, and lessons.</p>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading class...</p>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-primary" @click="loadClass">Retry</button>
    </div>
    
    <!-- Class Content -->
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
        </div>
      </section>
      
      <section class="card">
        <div class="card-header">
          <h3>Students</h3>
          <button class="btn-primary btn-small" @click="showAddModal = true">
            + Add Student
          </button>
        </div>
        <div class="card-content">
          <div v-if="loadingStudents" class="loading-state-small">
            <div class="spinner-small"></div>
            <p>Loading students...</p>
          </div>
          <div v-else-if="students.length === 0" class="empty-state">
            <p>No students in this class yet.</p>
          </div>
          <div v-else class="student-list">
            <RouterLink
              v-for="student in students"
              :key="student.id"
              :to="`/students/${student.id}`"
              class="student-item"
            >
              <div class="student-avatar-small">
                <img
                  v-if="student.photo"
                  :src="student.photo"
                  :alt="`${student.firstName} ${student.lastName}`"
                  class="student-avatar-img"
                />
                <span v-else>
                  {{ getInitials(student.firstName, student.lastName) }}
                </span>
              </div>
              <span>{{ student.firstName }} {{ student.lastName }}</span>
              <span class="student-arrow">→</span>
            </RouterLink>
          </div>
        </div>
      </section>
      
      <section class="card">
        <h3>Quick Actions</h3>
        <div class="card-content">
          <RouterLink to="/attendance" class="action-button">
            <span class="action-icon">✓</span>
            <span>Record Attendance</span>
          </RouterLink>
        </div>
      </section>
    </div>
    
    <!-- Add Student Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click="closeAddModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Add Student to {{ classGroup?.name }}</h3>
          <button class="modal-close" @click="closeAddModal">✕</button>
        </div>
        
        <form @submit.prevent="handleAddStudent" class="modal-form">
          <div class="form-group">
            <label for="firstName">First Name *</label>
            <input
              id="firstName"
              v-model="newStudent.firstName"
              type="text"
              placeholder="Enter first name"
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
              placeholder="Enter last name"
              required
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="dateOfBirth">Date of Birth</label>
            <input
              id="dateOfBirth"
              v-model="newStudent.dateOfBirth"
              type="date"
              :max="getTodayDateString()"
              class="form-input"
            />
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
          
          <div v-if="addError" class="error-message">
            {{ addError }}
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeAddModal" class="btn-secondary">
              Cancel
            </button>
            <button type="submit" :disabled="creating" class="btn-primary">
              {{ creating ? 'Adding...' : 'Add Student' }}
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
import { useClassGroups, useStudents } from '../composables/useDatabase'
import { useModal } from '../composables/useModal'
import { getInitials, getTodayDateString } from '../utils/student'
import type { ClassGroup, Student } from '../db'

// Router
const route = useRoute()

// State
const classGroup = ref<ClassGroup | null>(null)
const students = ref<Student[]>([])
const loading = ref(true)
const loadingStudents = ref(true)
const error = ref('')
const showAddModal = ref(false)
const creating = ref(false)
const addError = ref('')

const newStudent = ref({
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  email: ''
})

// Composables
const classGroupsDb = useClassGroups()
const studentsDb = useStudents()

// Methods
const loadClass = async () => {
  loading.value = true
  error.value = ''
  try {
    const classId = route.params.id as string
    const foundClass = await classGroupsDb.getById(classId)
    
    if (!foundClass) {
      error.value = 'Class not found'
      return
    }
    
    classGroup.value = foundClass
    
    // Load students
    await loadStudents(classId)
  } catch (err) {
    console.error('Failed to load class:', err)
    error.value = 'Failed to load class. Please try again.'
  } finally {
    loading.value = false
  }
}

const loadStudents = async (classId: string) => {
  loadingStudents.value = true
  try {
    students.value = await studentsDb.getByClassId(classId)
  } catch (err) {
    console.error('Failed to load students:', err)
  } finally {
    loadingStudents.value = false
  }
}

const handleAddStudent = async () => {
  if (!classGroup.value) return
  
  addError.value = ''
  creating.value = true
  
  try {
    await studentsDb.create({
      firstName: newStudent.value.firstName.trim(),
      lastName: newStudent.value.lastName.trim(),
      classId: classGroup.value.id,
      dateOfBirth: newStudent.value.dateOfBirth ? new Date(newStudent.value.dateOfBirth) : undefined,
      email: newStudent.value.email || undefined
    })
    
    // Reload students
    await loadStudents(classGroup.value.id)
    
    // Reset form and close modal
    newStudent.value = {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      email: ''
    }
    showAddModal.value = false
  } catch (err) {
    console.error('Failed to add student:', err)
    addError.value = err instanceof Error ? err.message : 'Failed to add student. Please try again.'
  } finally {
    creating.value = false
  }
}

const closeAddModal = () => {
  showAddModal.value = false
  addError.value = ''
  newStudent.value = {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    email: ''
  }
}

// Enable keyboard accessibility for modal (after function definitions)
useModal(showAddModal, closeAddModal)

// Lifecycle
onMounted(() => {
  loadClass()
})
</script>

<style scoped>
.class-detail-view {
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
  min-height: 44px;
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

.loading-state,
.error-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
}

.loading-state-small {
  text-align: center;
  padding: 2rem 1rem;
  color: #666;
}

.spinner,
.spinner-small {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.spinner {
  width: 48px;
  height: 48px;
}

.spinner-small {
  width: 32px;
  height: 32px;
  border-width: 3px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-header h3 {
  margin: 0;
}

.card h3 {
  font-size: 1.25rem;
  color: #333;
  margin: 0 0 1rem 0;
  border-bottom: 2px solid #667eea;
  padding-bottom: 0.5rem;
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

.student-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.student-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  text-decoration: none;
  color: #333;
  transition: all 0.2s ease;
  min-height: 44px;
}

.student-item:hover {
  background: #e9ecef;
  transform: translateX(4px);
}

.student-avatar-small {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
  overflow: hidden;
}

.student-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.student-arrow {
  margin-left: auto;
  color: #667eea;
  font-size: 1.25rem;
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
  min-height: 44px;
  font-weight: 500;
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
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h3 {
  font-size: 1.5rem;
  color: #333;
  margin: 0;
}

.modal-close {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
}

.modal-close:hover {
  color: #333;
}

.modal-form {
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
  font-size: 0.875rem;
}

.form-input {
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
  min-height: 44px;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.error-message {
  padding: 0.75rem;
  background: #fee;
  color: #c33;
  border-radius: 8px;
  font-size: 0.875rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
  border: none;
  border-radius: 8px;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .class-info {
    grid-template-columns: 1fr;
  }
  
  .info-item {
    grid-template-columns: 1fr;
  }
  
  .card-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .btn-small {
    width: 100%;
  }
}
</style>

