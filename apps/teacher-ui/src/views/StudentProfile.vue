<template>
  <div class="student-profile-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← Zurück</button>
      <h2>Schülerprofil</h2>
      <p class="page-description">Verwalten Sie Schülerinformationen, Anwesenheit und Leistung.</p>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Schülerprofil wird geladen...</p>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-primary" @click="loadStudent">Erneut versuchen</button>
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
            <button class="photo-upload-btn" @click="showPhotoModal = true" title="Foto verwalten">
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
            <button class="btn-icon" @click="showEditModal = true" title="Schüler bearbeiten">
              ✏️
            </button>
            <button class="btn-icon btn-danger" @click="confirmDelete" title="Schüler löschen">
              🗑️
            </button>
          </div>
        </div>
      </section>
      
      <!-- Attendance Summary -->
      <section class="card">
        <h3>Anwesenheitsübersicht</h3>
        <div v-if="attendanceSummary" class="card-content">
          <div class="summary-grid">
            <div class="summary-item">
              <label>Unterrichtsstunden gesamt:</label>
              <span class="summary-value">{{ attendanceSummary.total }}</span>
            </div>
            <div class="summary-item">
              <label>Anwesend:</label>
              <span class="summary-value status-present">{{ attendanceSummary.present }}</span>
            </div>
            <div class="summary-item">
              <label>Abwesend:</label>
              <span class="summary-value status-absent">{{ attendanceSummary.absent }}</span>
            </div>
            <div class="summary-item">
              <label>Anwesenheitsquote:</label>
              <span class="summary-value">{{ attendanceSummary.percentage.toFixed(1) }}%</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>Keine Anwesenheitsdaten verfügbar.</p>
        </div>
      </section>
      
      <!-- Attendance History -->
      <section class="card">
        <h3>Anwesenheitsverlauf</h3>
        <div class="card-content">
          <div v-if="attendanceRecords.length === 0" class="empty-state">
            <p>Noch keine Anwesenheitsprotokollen.</p>
          </div>
          <div v-else class="attendance-list">
            <div 
              v-for="record in attendanceRecords" 
              :key="record.id"
              class="attendance-record"
            >
              <div class="record-date">
                {{ formatDate(record.date) }}
              </div>
              <div :class="['record-status', `status-${record.status}`]">
                {{ capitalize(record.status) }}
              </div>
              <div v-if="record.notes" class="record-reason">
                {{ record.notes }}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
    
    <!-- Edit Student Modal -->
    <div v-if="showEditModal && student" class="modal-overlay" @click="closeEditModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Schüler bearbeiten</h3>
          <button class="modal-close" @click="closeEditModal">✕</button>
        </div>
        
        <form @submit.prevent="handleEditStudent" class="modal-form">
          <div class="form-group">
            <label for="editFirstName">Vorname *</label>
            <input
              id="editFirstName"
              v-model="editForm.firstName"
              type="text"
              required
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="editLastName">Nachname *</label>
            <input
              id="editLastName"
              v-model="editForm.lastName"
              type="text"
              required
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="editClassId">Klasse *</label>
            <select
              id="editClassId"
              v-model="editForm.classId"
              required
              class="form-input"
              :disabled="!hasClasses"
            >
              <option value="" disabled>{{ hasClasses ? 'Wählen Sie eine Klasse' : 'Keine Klassen verfügbar' }}</option>
              <option v-for="classGroup in classes" :key="classGroup.id" :value="classGroup.id">
                {{ classGroup.name }}
              </option>
            </select>
            <small v-if="!hasClasses" class="form-hint error-hint">
              Erstellen Sie zunächst eine Klasse im Übersichts-Tab.
            </small>
          </div>
          
          <div class="form-group">
            <label for="editDateOfBirth">Geburtsdatum</label>
            <input
              id="editDateOfBirth"
              v-model="editForm.dateOfBirth"
              type="date"
              :max="getTodayDateString()"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="editEmail">E-Mail</label>
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
              Abbrechen
            </button>
            <button type="submit" :disabled="saving" class="btn-primary">
              {{ saving ? 'Wird gespeichert...' : 'Änderungen speichern' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Photo Management Modal -->
    <div v-if="showPhotoModal && student" class="modal-overlay" @click="closePhotoModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Foto verwalten</h3>
          <button class="modal-close" @click="closePhotoModal">✕</button>
        </div>
        
        <div class="modal-form">
          <div class="photo-preview-container">
            <img v-if="student.photo || photoPreview" :src="photoPreview || student.photo" class="photo-preview" alt="Preview" />
            <div v-else class="photo-preview-placeholder">
              <span>Kein Foto</span>
            </div>
          </div>
          
          <div class="form-group">
            <label for="photoInput">Foto hochladen</label>
            <input
              id="photoInput"
              ref="photoInput"
              type="file"
              accept="image/*"
              @change="handlePhotoSelect"
              class="form-input"
            />
            <small class="form-hint">Empfohlen: Quadratisches Bild, max. 2MB</small>
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
              Foto entfernen
            </button>
            <button type="button" @click="closePhotoModal" class="btn-secondary">
              Abbrechen
            </button>
            <button
              v-if="photoPreview"
              type="button"
              @click="savePhoto"
              :disabled="saving"
              class="btn-primary"
            >
              {{ saving ? 'Wird gespeichert...' : 'Foto speichern' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Delete Student Confirmation Modal -->
    <div v-if="showDeleteModal && student" class="modal-overlay" @click="showDeleteModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Schüler löschen</h3>
          <button class="modal-close" @click="showDeleteModal = false">✕</button>
        </div>
        
        <div class="modal-form">
          <p class="confirmation-text">
            Sind Sie sicher, dass Sie <strong>{{ student.firstName }} {{ student.lastName }}</strong> löschen möchten?
            Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
          
          <div v-if="deleteError" class="error-message">
            {{ deleteError }}
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="showDeleteModal = false" class="btn-secondary">
              Abbrechen
            </button>
            <button
              type="button"
              @click="handleDelete"
              :disabled="saving"
              class="btn-primary btn-danger-solid"
            >
              {{ saving ? 'Wird gelöscht...' : 'Schüler löschen' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Remove Photo Confirmation Modal -->
    <div v-if="showRemovePhotoModal && student" class="modal-overlay" @click="showRemovePhotoModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Foto entfernen</h3>
          <button class="modal-close" @click="showRemovePhotoModal = false">✕</button>
        </div>
        
        <div class="modal-form">
          <p class="confirmation-text">
            Sind Sie sicher, dass Sie dieses Foto entfernen möchten?
          </p>
          
          <div class="modal-actions">
            <button type="button" @click="showRemovePhotoModal = false" class="btn-secondary">
              Abbrechen
            </button>
            <button
              type="button"
              @click="confirmRemovePhoto"
              :disabled="saving"
              class="btn-primary btn-danger-solid"
            >
              {{ saving ? 'Wird entfernt...' : 'Foto entfernen' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useStudents, useAttendance } from '../composables/useSportBridge'
import { getInitials, capitalize } from '../utils/stringUtils'
import type { Student, AttendanceRecord } from '../db'

const route = useRoute()
const studentId = route.params.id as string

// State
const student = ref<Student | undefined>(undefined)
const attendanceRecords = ref<AttendanceRecord[]>([])
const attendanceSummary = ref<{
  total: number
  present: number
  absent: number
  excused?: number
  passive?: number
  percentage: number
} | null>(null)
const loading = ref(true)
const error = ref('')
const showEditModal = ref(false)
const showPhotoModal = ref(false)
const showDeleteModal = ref(false)
const showRemovePhotoModal = ref(false)
const saving = ref(false)
const editError = ref('')
const photoError = ref('')
const deleteError = ref('')
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
const students = useStudents()
const attendance = useAttendance()

// Methods
const loadData = async () => {
  loading.value = true
  loadError.value = ''
  
  try {
    // Load student details
    student.value = await students.getById(studentId)
    
    if (!student.value) {
      error.value = 'Schüler nicht gefunden'
      return
    }

const handleEditStudent = async () => {
  if (!student.value) return
  
  editError.value = ''
  saving.value = true
  
  try {
    await students.update(student.value.id, {
      firstName: editForm.value.firstName.trim(),
      lastName: editForm.value.lastName.trim(),
      classGroupId: editForm.value.classId,
      dateOfBirth: editForm.value.dateOfBirth ? new Date(editForm.value.dateOfBirth) : undefined,
      email: editForm.value.email || undefined
    })
    
    // Reload from database to ensure consistency
    const updatedStudent = await students.getById(student.value.id)
    if (updatedStudent) {
      student.value = updatedStudent
    }
    
    closeEditModal()
  } catch (err) {
    console.error('Failed to update student:', err)
    editError.value = err instanceof Error ? err.message : 'Fehler beim Aktualisieren des Schülers'
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
    photoError.value = 'Fotogröße muss kleiner als 2MB sein'
    return
  }
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    photoError.value = 'Bitte wählen Sie eine Bilddatei'
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
    await students.update(student.value.id, {
      photo: photoPreview.value
    })
    
    // Reload from database to ensure consistency
    const updatedStudent = await students.getById(student.value.id)
    if (updatedStudent) {
      student.value = updatedStudent
    }
    photoPreview.value = ''
    showPhotoModal.value = false
  } catch (err) {
    console.error('Failed to save photo:', err)
    photoError.value = 'Fehler beim Speichern des Fotos. Bitte versuchen Sie es erneut.'
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
    await students.update(student.value.id, {
      photo: undefined
    })
    
    // Reload from database to ensure consistency
    const updatedStudent = await students.getById(student.value.id)
    if (updatedStudent) {
      student.value = updatedStudent
    }
    showPhotoModal.value = false
    showRemovePhotoModal.value = false
  } catch (err) {
    console.error('Failed to remove photo:', err)
    photoError.value = 'Fehler beim Entfernen des Fotos. Bitte versuchen Sie es erneut.'
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
    await students.remove(student.value.id)
    router.push('/students')
  } catch (err) {
    console.error('Failed to delete student:', err)
    deleteError.value = err instanceof Error ? err.message : 'Fehler beim Löschen des Schülers. Bitte versuchen Sie es erneut.'
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

const getClassName = (classId: string): string => {
  // TODO: Implement class lookup from composable
  return 'Klassenname'
}

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('de-DE')
}

const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
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
  color: white;
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

.attendance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.5rem 0;
}

.attendance-count {
  font-size: 0.875rem;
  color: #666;
  margin: 0;
}

.btn-link {
  background: transparent;
  border: none;
  color: #667eea;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.5rem;
  text-decoration: underline;
  min-height: 32px;
  transition: color 0.2s ease;
}

.btn-link:hover {
  color: #5568d3;
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

