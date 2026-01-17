<template>
  <div class="student-list-view">
    <div class="page-header">
      <h2>Students</h2>
      <p class="page-description">View and manage all students across your classes.</p>
    </div>
    
    <div class="controls-bar">
      <!-- Search -->
      <div class="search-bar">
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="Search by name or ID..."
          class="search-input"
        />
      </div>
      
      <!-- Add Student Button -->
      <button class="btn-primary" @click="showAddModal = true">
        + Add Student
      </button>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading students...</p>
    </div>
    
    <!-- Error State -->
    <div v-else-if="loadError" class="error-state">
      <p>{{ loadError }}</p>
      <button class="btn-primary" @click="loadStudents">Retry</button>
    </div>
    
    <!-- Empty State -->
    <div v-else-if="students.length === 0" class="empty-state">
      <p>No students yet. Add your first student to get started.</p>
      <button class="btn-primary" @click="showAddModal = true">
        + Add Student
      </button>
    </div>
    
    <!-- No Results State -->
    <div v-else-if="filteredStudents.length === 0" class="empty-state">
      <p>No students found matching "{{ searchQuery }}"</p>
    </div>
    
    <!-- Students List -->
    <div v-else class="student-grid">
      <RouterLink
        v-for="student in filteredStudents"
        :key="student.id"
        :to="`/students/${student.id}`"
        class="student-card"
      >
        <div class="student-avatar">
          <img
            v-if="student.photo"
            :src="student.photo"
            :alt="student.firstName + ' ' + student.lastName"
          />
          <span v-else>
            {{ getInitials(student.firstName, student.lastName) }}
          </span>
        </div>
        <div class="student-info">
          <h3>{{ student.firstName }} {{ student.lastName }}</h3>
          <p class="student-class">{{ getClassName(student.classId) }}</p>
          <p class="student-id">ID: {{ student.id.substring(0, 8) }}</p>
        </div>
        <div class="student-arrow">→</div>
      </RouterLink>
    </div>
    
    <!-- Add Student Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click="closeAddModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Add Student</h3>
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
            <label for="classId">Class *</label>
            <select
              id="classId"
              v-model="newStudent.classId"
              required
              class="form-input"
            >
              <option value="">Select a class</option>
              <option v-for="cls in classes" :key="cls.id" :value="cls.id">
                {{ cls.name }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="dateOfBirth">Date of Birth</label>
            <input
              id="dateOfBirth"
              v-model="newStudent.dateOfBirth"
              type="date"
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
          
          <div v-if="error" class="error-message">
            {{ error }}
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
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useStudents, useClassGroups } from '../composables/useDatabase'
import type { Student, ClassGroup } from '../db'

// State
const students = ref<Student[]>([])
const classes = ref<ClassGroup[]>([])
const loading = ref(true)
const loadError = ref('')
const searchQuery = ref('')
const showAddModal = ref(false)
const creating = ref(false)
const error = ref('')

const newStudent = ref({
  firstName: '',
  lastName: '',
  classId: '',
  dateOfBirth: '',
  email: ''
})

// Composables
const studentsDb = useStudents()
const classGroupsDb = useClassGroups()

// Computed
const filteredStudents = computed(() => {
  if (!searchQuery.value) {
    return students.value
  }
  const query = searchQuery.value.toLowerCase()
  return students.value.filter(student => 
    student.firstName.toLowerCase().includes(query) ||
    student.lastName.toLowerCase().includes(query) ||
    student.id.toLowerCase().includes(query)
  )
})

// Methods
const loadStudents = async () => {
  loading.value = true
  loadError.value = ''
  try {
    students.value = await studentsDb.getAll()
    classes.value = await classGroupsDb.getAll()
  } catch (err) {
    console.error('Failed to load students:', err)
    loadError.value = 'Failed to load students. Please try again.'
  } finally {
    loading.value = false
  }
}

const handleAddStudent = async () => {
  error.value = ''
  creating.value = true
  
  try {
    await studentsDb.create({
      firstName: newStudent.value.firstName.trim(),
      lastName: newStudent.value.lastName.trim(),
      classId: newStudent.value.classId,
      dateOfBirth: newStudent.value.dateOfBirth ? new Date(newStudent.value.dateOfBirth) : undefined,
      email: newStudent.value.email || undefined
    })
    
    // Reload students
    await loadStudents()
    
    // Reset form and close modal
    newStudent.value = {
      firstName: '',
      lastName: '',
      classId: '',
      dateOfBirth: '',
      email: ''
    }
    showAddModal.value = false
  } catch (err) {
    console.error('Failed to add student:', err)
    error.value = err instanceof Error ? err.message : 'Failed to add student. Please try again.'
  } finally {
    creating.value = false
  }
}

const closeAddModal = () => {
  showAddModal.value = false
  error.value = ''
  newStudent.value = {
    firstName: '',
    lastName: '',
    classId: '',
    dateOfBirth: '',
    email: ''
  }
}

export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export const getClassName = (classId: string): string => {
  const cls = classes.value.find(c => c.id === classId)
  return cls ? cls.name : 'Unknown Class'
}

// Lifecycle
onMounted(() => {
  loadStudents()
})
</script>

<style scoped>
.student-list-view {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
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

.controls-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  align-items: center;
}

.search-bar {
  flex: 1;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.search-input:focus {
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
  min-height: 44px;
  white-space: nowrap;
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

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.student-grid {
  display: grid;
  gap: 1rem;
}

.student-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-decoration: none;
  color: #333;
  transition: all 0.2s ease;
  min-height: 80px;
}

.student-card:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.student-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 600;
  flex-shrink: 0;
}

.student-info {
  flex: 1;
}

.student-info h3 {
  font-size: 1.125rem;
  margin: 0 0 0.25rem 0;
  color: #333;
}

.student-class {
  font-size: 0.875rem;
  color: #666;
  margin: 0 0 0.25rem 0;
}

.student-id {
  font-size: 0.75rem;
  color: #999;
  margin: 0;
  font-family: monospace;
}

.student-arrow {
  font-size: 1.5rem;
  color: #667eea;
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
  .controls-bar {
    flex-direction: column;
  }
  
  .btn-primary {
    width: 100%;
  }
  
  .student-card {
    flex-direction: column;
    text-align: center;
  }
  
  .student-arrow {
    display: none;
  }
}
</style>
