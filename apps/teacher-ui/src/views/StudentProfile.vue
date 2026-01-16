<template>
  <div class="student-profile-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← Back</button>
      <h2>Student Profile</h2>
      <p class="page-description">View and manage student information, attendance, and performance.</p>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading student profile...</p>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-primary" @click="loadStudent">Retry</button>
    </div>
    
    <!-- Profile Content -->
    <div v-else-if="student" class="profile-layout">
      <!-- Profile Card -->
      <section class="card profile-card">
        <div class="student-header">
          <div class="photo-container">
            <img v-if="student.photo" :src="student.photo" class="student-photo" alt="Student photo" />
            <div v-else class="student-avatar">
              {{ getInitials(student.firstName, student.lastName) }}
            </div>
            <button class="photo-upload-btn" @click="showPhotoModal = true" title="Manage photo">
              📷
            </button>
          </div>
          <div class="student-info">
            <h3>{{ student.firstName }} {{ student.lastName }}</h3>
            <p v-if="student.dateOfBirth">Born: {{ formatDate(student.dateOfBirth) }}</p>
            <p v-if="student.email">{{ student.email }}</p>
            <p class="class-info">{{ getClassName(student.classId) }}</p>
          </div>
          <div class="header-actions">
            <button class="btn-icon" @click="showEditModal = true" title="Edit student">
              ✏️
            </button>
            <button class="btn-icon btn-danger" @click="confirmDelete" title="Delete student">
              🗑️
            </button>
          </div>
        </div>
      </section>
      
      <!-- Attendance Record -->
      <section class="card">
        <h3>Attendance Record</h3>
        <div class="card-content">
          <div v-if="loadingAttendance" class="loading-state-small">
            <div class="spinner-small"></div>
            <p>Loading attendance...</p>
          </div>
          <div v-else-if="attendance.length === 0" class="empty-state">
            <p>No attendance records yet.</p>
          </div>
          <div v-else class="attendance-table-container">
            <table class="attendance-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="record in attendance" :key="record.id">
                  <td>{{ formatDate(record.date) }}</td>
                  <td>
                    <span :class="['status-badge', `status-${record.status}`]">
                      {{ record.status }}
                    </span>
                  </td>
                  <td>{{ record.notes || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
      
      <!-- Performance Summary -->
      <section class="card">
        <h3>Performance Summary</h3>
        <div class="card-content">
          <p class="empty-state">Performance tracking coming in Phase 3.</p>
        </div>
      </section>
    </div>
    
    <!-- Edit Student Modal -->
    <div v-if="showEditModal && student" class="modal-overlay" @click="closeEditModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Edit Student</h3>
          <button class="modal-close" @click="closeEditModal">✕</button>
        </div>
        
        <form @submit.prevent="handleEditStudent" class="modal-form">
          <div class="form-group">
            <label for="editFirstName">First Name *</label>
            <input
              id="editFirstName"
              v-model="editForm.firstName"
              type="text"
              required
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="editLastName">Last Name *</label>
            <input
              id="editLastName"
              v-model="editForm.lastName"
              type="text"
              required
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="editClassId">Class *</label>
            <select
              id="editClassId"
              v-model="editForm.classId"
              required
              class="form-input"
            >
              <option v-for="cls in classes" :key="cls.id" :value="cls.id">
                {{ cls.name }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="editDateOfBirth">Date of Birth</label>
            <input
              id="editDateOfBirth"
              v-model="editForm.dateOfBirth"
              type="date"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="editEmail">Email</label>
            <input
              id="editEmail"
              v-model="editForm.email"
              type="email"
              class="form-input"
            />
          </div>
          
          <div v-if="editError" class="error-message">
            {{ editError }}
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeEditModal" class="btn-secondary">
              Cancel
            </button>
            <button type="submit" :disabled="saving" class="btn-primary">
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Photo Management Modal -->
    <div v-if="showPhotoModal && student" class="modal-overlay" @click="closePhotoModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Manage Photo</h3>
          <button class="modal-close" @click="closePhotoModal">✕</button>
        </div>
        
        <div class="modal-form">
          <div class="photo-preview-container">
            <img v-if="student.photo || photoPreview" :src="photoPreview || student.photo" class="photo-preview" alt="Preview" />
            <div v-else class="photo-preview-placeholder">
              <span>No photo</span>
            </div>
          </div>
          
          <div class="form-group">
            <label for="photoInput">Upload Photo</label>
            <input
              id="photoInput"
              ref="photoInput"
              type="file"
              accept="image/*"
              @change="handlePhotoSelect"
              class="form-input"
            />
            <small class="form-hint">Recommended: Square image, max 2MB</small>
          </div>
          
          <div v-if="photoError" class="error-message">
            {{ photoError }}
          </div>
          
          <div class="modal-actions">
            <button
              v-if="student.photo"
              type="button"
              @click="removePhoto"
              class="btn-secondary btn-danger"
            >
              Remove Photo
            </button>
            <button type="button" @click="closePhotoModal" class="btn-secondary">
              Cancel
            </button>
            <button
              v-if="photoPreview"
              type="button"
              @click="savePhoto"
              :disabled="saving"
              class="btn-primary"
            >
              {{ saving ? 'Saving...' : 'Save Photo' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Delete Student Confirmation Modal -->
    <div v-if="showDeleteModal && student" class="modal-overlay" @click="showDeleteModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Delete Student</h3>
          <button class="modal-close" @click="showDeleteModal = false">✕</button>
        </div>
        
        <div class="modal-form">
          <p class="confirmation-text">
            Are you sure you want to delete <strong>{{ student.firstName }} {{ student.lastName }}</strong>?
            This action cannot be undone.
          </p>
          
          <div v-if="deleteError" class="error-message">
            {{ deleteError }}
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="showDeleteModal = false" class="btn-secondary">
              Cancel
            </button>
            <button
              type="button"
              @click="handleDelete"
              :disabled="saving"
              class="btn-primary btn-danger-solid"
            >
              {{ saving ? 'Deleting...' : 'Delete Student' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Remove Photo Confirmation Modal -->
    <div v-if="showRemovePhotoModal && student" class="modal-overlay" @click="showRemovePhotoModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Remove Photo</h3>
          <button class="modal-close" @click="showRemovePhotoModal = false">✕</button>
        </div>
        
        <div class="modal-form">
          <p class="confirmation-text">
            Are you sure you want to remove this photo?
          </p>
          
          <div class="modal-actions">
            <button type="button" @click="showRemovePhotoModal = false" class="btn-secondary">
              Cancel
            </button>
            <button
              type="button"
              @click="confirmRemovePhoto"
              :disabled="saving"
              class="btn-primary btn-danger-solid"
            >
              {{ saving ? 'Removing...' : 'Remove Photo' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStudents, useClassGroups, useAttendance } from '../composables/useDatabase'
import type { Student, ClassGroup, AttendanceRecord } from '../db'

// Router
const route = useRoute()
const router = useRouter()

// State
const student = ref<Student | null>(null)
const classes = ref<ClassGroup[]>([])
const attendance = ref<AttendanceRecord[]>([])
const loading = ref(true)
const loadingAttendance = ref(true)
const error = ref('')
const showEditModal = ref(false)
const showPhotoModal = ref(false)
const showDeleteModal = ref(false)
const showRemovePhotoModal = ref(false)
const editError = ref('')
const photoError = ref('')
const deleteError = ref('')
const saving = ref(false)
const photoPreview = ref('')
const photoInput = ref<HTMLInputElement | null>(null)

const editForm = ref({
  firstName: '',
  lastName: '',
  classId: '',
  dateOfBirth: '',
  email: ''
})

// Composables
const studentsDb = useStudents()
const classGroupsDb = useClassGroups()
const attendanceDb = useAttendance()

// Methods
const loadStudent = async () => {
  loading.value = true
  error.value = ''
  try {
    const studentId = route.params.id as string
    const foundStudent = await studentsDb.getById(studentId)
    
    if (!foundStudent) {
      error.value = 'Student not found'
      return
    }
    
    student.value = foundStudent
    classes.value = await classGroupsDb.getAll()
    
    // Initialize edit form
    editForm.value = {
      firstName: foundStudent.firstName,
      lastName: foundStudent.lastName,
      classId: foundStudent.classId,
      dateOfBirth: foundStudent.dateOfBirth ? formatDateForInput(foundStudent.dateOfBirth) : '',
      email: foundStudent.email || ''
    }
    
    // Load attendance
    await loadAttendance(studentId)
  } catch (err) {
    console.error('Failed to load student:', err)
    error.value = 'Failed to load student profile. Please try again.'
  } finally {
    loading.value = false
  }
}

const loadAttendance = async (studentId: string) => {
  loadingAttendance.value = true
  try {
    attendance.value = await attendanceDb.getByStudentId(studentId)
  } catch (err) {
    console.error('Failed to load attendance:', err)
  } finally {
    loadingAttendance.value = false
  }
}

const handleEditStudent = async () => {
  if (!student.value) return
  
  editError.value = ''
  saving.value = true
  
  try {
    await studentsDb.update(student.value.id, {
      firstName: editForm.value.firstName.trim(),
      lastName: editForm.value.lastName.trim(),
      classId: editForm.value.classId,
      dateOfBirth: editForm.value.dateOfBirth ? new Date(editForm.value.dateOfBirth) : undefined,
      email: editForm.value.email || undefined
    })
    
    // Update local state
    student.value.firstName = editForm.value.firstName.trim()
    student.value.lastName = editForm.value.lastName.trim()
    student.value.classId = editForm.value.classId
    student.value.dateOfBirth = editForm.value.dateOfBirth ? new Date(editForm.value.dateOfBirth) : undefined
    student.value.email = editForm.value.email || undefined
    
    showEditModal.value = false
  } catch (err) {
    console.error('Failed to update student:', err)
    editError.value = err instanceof Error ? err.message : 'Failed to update student'
  } finally {
    saving.value = false
  }
}

const handlePhotoSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  // Validate file size (2MB max)
  if (file.size > 2 * 1024 * 1024) {
    photoError.value = 'Photo size must be less than 2MB'
    return
  }
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    photoError.value = 'Please select an image file'
    return
  }
  
  photoError.value = ''
  
  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    photoPreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const savePhoto = async () => {
  if (!student.value || !photoPreview.value) return
  
  saving.value = true
  photoError.value = ''
  
  try {
    await studentsDb.update(student.value.id, {
      photo: photoPreview.value
    })
    
    // Update local state
    student.value.photo = photoPreview.value
    photoPreview.value = ''
    showPhotoModal.value = false
  } catch (err) {
    console.error('Failed to save photo:', err)
    photoError.value = 'Failed to save photo. Please try again.'
  } finally {
    saving.value = false
  }
}

const removePhoto = async () => {
  if (!student.value) return
  
  showRemovePhotoModal.value = true
}

const confirmRemovePhoto = async () => {
  if (!student.value) return
  
  saving.value = true
  photoError.value = ''
  
  try {
    await studentsDb.update(student.value.id, {
      photo: undefined
    })
    
    // Update local state
    student.value.photo = undefined
    showPhotoModal.value = false
    showRemovePhotoModal.value = false
  } catch (err) {
    console.error('Failed to remove photo:', err)
    photoError.value = 'Failed to remove photo. Please try again.'
  } finally {
    saving.value = false
  }
}

const confirmDelete = () => {
  if (!student.value) return
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (!student.value) return
  
  deleteError.value = ''
  saving.value = true
  
  try {
    await studentsDb.remove(student.value.id)
    router.push('/students')
  } catch (err) {
    console.error('Failed to delete student:', err)
    deleteError.value = err instanceof Error ? err.message : 'Failed to delete student. Please try again.'
    saving.value = false
  }
}

const closeEditModal = () => {
  showEditModal.value = false
  editError.value = ''
}

const closePhotoModal = () => {
  showPhotoModal.value = false
  photoPreview.value = ''
  photoError.value = ''
  if (photoInput.value) {
    photoInput.value.value = ''
  }
}

const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

const getClassName = (classId: string): string => {
  const cls = classes.value.find(c => c.id === classId)
  return cls ? cls.name : 'Unknown Class'
}

const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString()
}

const formatDateForInput = (date: Date): string => {
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

// Lifecycle
onMounted(() => {
  loadStudent()
})
</script>

<style scoped>
.student-profile-view {
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

.profile-layout {
  display: grid;
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

.profile-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.student-header {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  position: relative;
}

.photo-container {
  position: relative;
  flex-shrink: 0;
}

.student-photo {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.student-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.photo-upload-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #667eea;
  border: 2px solid white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.photo-upload-btn:hover {
  transform: scale(1.1);
  background: #5568d3;
}

.student-info {
  flex: 1;
}

.student-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.75rem;
  border: none;
  padding: 0;
}

.student-info p {
  margin: 0.25rem 0;
  opacity: 0.9;
  font-size: 0.95rem;
}

.class-info {
  font-weight: 600;
  font-size: 1rem !important;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.btn-icon.btn-danger:hover {
  background: rgba(220, 53, 69, 0.9);
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

.attendance-table-container {
  overflow-x: auto;
}

.attendance-table {
  width: 100%;
  border-collapse: collapse;
}

.attendance-table th,
.attendance-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.attendance-table th {
  font-weight: 600;
  color: #666;
  background: #f8f9fa;
}

.attendance-table tbody tr:hover {
  background: #f8f9fa;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status-present {
  background: #d4edda;
  color: #155724;
}

.status-absent {
  background: #f8d7da;
  color: #721c24;
}

.status-excused {
  background: #d1ecf1;
  color: #0c5460;
}

.status-late {
  background: #fff3cd;
  color: #856404;
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

.form-hint {
  font-size: 0.75rem;
  color: #666;
  margin-top: -0.25rem;
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

.btn-secondary.btn-danger {
  color: #dc3545;
}

.btn-secondary.btn-danger:hover {
  background: #dc3545;
  color: white;
}

.btn-danger-solid {
  background: #dc3545 !important;
}

.btn-danger-solid:hover {
  background: #c82333 !important;
}

.confirmation-text {
  color: #333;
  font-size: 1rem;
  line-height: 1.5;
  margin: 0;
}

.photo-preview-container {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.photo-preview {
  width: 200px;
  height: 200px;
  border-radius: 8px;
  object-fit: cover;
  border: 2px solid #ddd;
}

.photo-preview-placeholder {
  width: 200px;
  height: 200px;
  border-radius: 8px;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-style: italic;
  border: 2px dashed #ddd;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .student-header {
    flex-direction: column;
    text-align: center;
    align-items: center;
  }
  
  .header-actions {
    position: absolute;
    top: 0;
    right: 0;
  }
  
  .attendance-table {
    font-size: 0.875rem;
  }
  
  .attendance-table th,
  .attendance-table td {
    padding: 0.5rem;
  }
}
</style>

