<template>
  <div class="student-list-view">
    <div class="page-header">
      <div class="header-content">
        <div>
          <h2>{{ t('SCHUELER.schueleruebersicht') }}</h2>
          <p class="page-description">{{ t('SCHUELER.schueler') }} verwalten und organisieren</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" @click="showImportModal = true">
            {{ t('SCHUELER.csv-import') }}
          </button>
          <button class="btn-primary" @click="showAddModal = true">
            + {{ t('SCHUELER.schueler-hinzu') }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Schüler werden geladen...</p>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-primary" @click="loadData">Erneut versuchen</button>
    </div>
    
    <!-- Main Content -->
    <div v-else class="student-content">
      <!-- Search and Filters -->
      <div class="controls-bar">
        <div class="search-group">
          <input 
            v-model="searchQuery"
            type="text"
            :placeholder="t('SEARCH.placeholder') || 'Schüler suchen...'"
            class="search-input"
          />
          <select v-model="filterClass" class="filter-select">
            <option value="">Alle Klassen</option>
            <option v-for="cls in classes" :key="cls.id" :value="cls.id">
              {{ cls.name }}
            </option>
          </select>
          <select v-model="filterGender" class="filter-select">
            <option value="">Alle Geschlechter</option>
            <option value="m">{{ t('SCHUELER.maennlich') }}</option>
            <option value="w">{{ t('SCHUELER.weiblich') }}</option>
          </select>
        </div>
        
        <div class="bulk-actions" v-if="selectedStudents.size > 0">
          <span class="selection-count">{{ selectedStudents.size }} ausgewählt</span>
          <button class="btn-secondary btn-small" @click="bulkMoveToClass">
            {{ t('COMMON.move') || 'Verschieben' }}
          </button>
          <button class="btn-danger btn-small" @click="bulkDelete">
            {{ t('COMMON.delete') || 'Löschen' }}
          </button>
        </div>
      </div>
      
      <!-- Student Table -->
      <div class="card">
        <!-- Empty State -->
        <div v-if="filteredStudents.length === 0 && searchQuery === '' && !filterClass" class="empty-state">
          <p>Noch keine Schüler. Fügen Sie Ihren ersten Schüler hinzu oder importieren Sie eine CSV-Datei.</p>
        </div>
        
        <!-- No Results State -->
        <div v-else-if="filteredStudents.length === 0" class="empty-state">
          <p>Keine Schüler gefunden</p>
        </div>
        
        <!-- Student Table -->
        <table v-else class="student-table">
          <thead>
            <tr>
              <th class="checkbox-col">
                <input 
                  type="checkbox" 
                  :checked="allSelected"
                  @change="toggleSelectAll"
                />
              </th>
              <th @click="sort('lastName')">
                {{ t('SCHUELER.nachname') }}
                <span class="sort-indicator">{{ getSortIcon('lastName') }}</span>
              </th>
              <th @click="sort('firstName')">
                {{ t('SCHUELER.name') }}
                <span class="sort-indicator">{{ getSortIcon('firstName') }}</span>
              </th>
              <th>{{ t('SCHUELER.klasse') }}</th>
              <th>{{ t('SCHUELER.geschlecht') }}</th>
              <th>{{ t('SCHUELER.geburtsjahr') }}</th>
              <th class="actions-col">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="student in paginatedStudents" 
              :key="student.id"
              :class="{ 'selected': isSelected(student.id) }"
            >
              <td class="checkbox-col">
                <input 
                  type="checkbox" 
                  :checked="isSelected(student.id)"
                  @change="toggleSelect(student.id)"
                />
              </td>
              <td>{{ student.lastName }}</td>
              <td>{{ student.firstName }}</td>
              <td>{{ getClassName(student.classGroupId) }}</td>
              <td>{{ getGenderDisplay(student.gender) }}</td>
              <td>{{ student.birthYear ?? '-' }}</td>
              <td class="actions-col">
                <button class="btn-icon" @click="editStudent(student)" title="Bearbeiten">
                  ✏️
                </button>
                <RouterLink :to="`/students/${student.id}`" class="btn-icon" title="Profil">
                  👤
                </RouterLink>
                <button class="btn-icon btn-danger" @click="deleteStudent(student)" title="Löschen">
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination">
          <button 
            class="btn-secondary btn-small" 
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            ← Zurück
          </button>
          <span class="page-info">Seite {{ currentPage }} von {{ totalPages }}</span>
          <button 
            class="btn-secondary btn-small" 
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            Weiter →
          </button>
        </div>
      </div>
      
      <!-- Summary Stats -->
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-label">Gesamt:</span>
          <span class="stat-value">{{ filteredStudents.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Männlich:</span>
          <span class="stat-value">{{ genderStats.male }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Weiblich:</span>
          <span class="stat-value">{{ genderStats.female }}</span>
        </div>
      </div>
    </div>
    
    <!-- Add/Edit Student Modal -->
    <div v-if="showAddModal || editingStudent" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingStudent ? t('SCHUELER.schueler-bearbeiten') : t('SCHUELER.schueler-hinzu') }}</h3>
          <button class="btn-close" @click="closeModal">×</button>
        </div>
        <form @submit.prevent="saveStudent" class="modal-body">
          <div class="form-group">
            <label>{{ t('SCHUELER.name') }} *</label>
            <input v-model="studentForm.firstName" type="text" required class="form-input" />
          </div>
          <div class="form-group">
            <label>{{ t('SCHUELER.nachname') }} *</label>
            <input v-model="studentForm.lastName" type="text" required class="form-input" />
          </div>
          <div class="form-group">
            <label>{{ t('SCHUELER.klasse') }} *</label>
            <select v-model="studentForm.classGroupId" required class="form-input">
              <option value="">-- Klasse wählen --</option>
              <option v-for="cls in classes" :key="cls.id" :value="cls.id">
                {{ cls.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ t('SCHUELER.geschlecht') }}</label>
            <select v-model="studentForm.gender" class="form-input">
              <option value="">-- Optional --</option>
              <option value="m">{{ t('SCHUELER.maennlich') }}</option>
              <option value="w">{{ t('SCHUELER.weiblich') }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ t('SCHUELER.geburtsjahr') }}</label>
            <input 
              v-model.number="birthYear" 
              type="number" 
              :min="1900" 
              :max="new Date().getFullYear()"
              class="form-input"
            />
            <p class="form-hint">{{ t('SCHUELER.geburt-hinweis') }}</p>
          </div>
          <div class="form-group">
            <label>{{ t('SCHUELER.email') }}</label>
            <input v-model="studentForm.email" type="email" class="form-input" />
          </div>
          <div class="form-group">
            <label>{{ t('SCHUELER.parent-email') }}</label>
            <input v-model="studentForm.parentEmail" type="email" class="form-input" />
          </div>
          <div class="form-group">
            <label>{{ t('SCHUELER.phone') }}</label>
            <input v-model="studentForm.phone" type="tel" class="form-input" />
          </div>
          <div class="form-actions">
            <button type="button" class="btn-secondary" @click="closeModal">
              {{ t('COMMON.cancel') || 'Abbrechen' }}
            </button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'Wird gespeichert...' : t('SCHUELER.speichern') }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- CSV Import Modal -->
    <div v-if="showImportModal" class="modal-overlay" @click.self="showImportModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ t('SCHUELER.csv-import') }}</h3>
          <button class="btn-close" @click="showImportModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>CSV-Datei (Vorname, Nachname, Klasse, Geschlecht, Geburtsjahr)</label>
            <textarea 
              v-model="csvData" 
              class="form-input" 
              rows="10"
              placeholder="Max,Mustermann,10a,m,2010&#10;Anna,Schmidt,10a,w,2009"
            ></textarea>
            <p class="form-hint">Format: Vorname,Nachname,Klasse,Geschlecht (m/w),Geburtsjahr</p>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn-secondary" @click="showImportModal = false">
              {{ t('COMMON.cancel') || 'Abbrechen' }}
            </button>
            <button type="button" class="btn-primary" @click="importCSV" :disabled="!csvData">
              Importieren
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Toast Notification -->
    <ToastNotification 
      v-if="toast.show"
      :message="toast.message"
      :type="toast.type"
      @close="toast.show = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getSportBridge, initializeSportBridge } from '../composables/useSportBridge'
import { getStudentsBridge, initializeStudentsBridge } from '../composables/useStudentsBridge'
import ToastNotification from '../components/ToastNotification.vue'
import type { Student, ClassGroup } from '@viccoboard/core'

const { t } = useI18n()

initializeSportBridge()
initializeStudentsBridge()

const SportBridge = getSportBridge()
const studentsBridge = getStudentsBridge()

// State
const loading = ref(true)
const error = ref<string | null>(null)
const students = ref<Student[]>([])
const classes = ref<ClassGroup[]>([])
const searchQuery = ref('')
const filterClass = ref('')
const filterGender = ref('')
const sortField = ref<'firstName' | 'lastName'>('lastName')
const sortDirection = ref<'asc' | 'desc'>('asc')
const currentPage = ref(1)
const itemsPerPage = 25
const selectedStudents = ref<Set<string>>(new Set())

// Modals
const showAddModal = ref(false)
const showImportModal = ref(false)
const editingStudent = ref<Student | null>(null)
const saving = ref(false)

// Forms
const studentForm = ref({
  firstName: '',
  lastName: '',
  classGroupId: '',
  gender: '' as 'm' | 'w' | '',
  email: '',
  parentEmail: '',
  phone: ''
})
const birthYear = ref<number | null>(null)
const csvData = ref('')

// Toast
const toast = ref({ show: false, message: '', type: 'success' as 'success' | 'error' })

// Computed
const filteredStudents = computed(() => {
  let filtered: Student[] = students.value
  
  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter((student: Student) =>
      student.firstName.toLowerCase().includes(query) ||
      student.lastName.toLowerCase().includes(query)
    )
  }
  
  // Class filter
  if (filterClass.value) {
    filtered = filtered.filter((student: Student) => student.classGroupId === filterClass.value)
  }
  
  // Gender filter
  if (filterGender.value) {
    filtered = filtered.filter((student: Student) =>
      student.gender === (filterGender.value === 'm' ? 'male' : 'female')
    )
  }
  
  // Sort
  filtered.sort((a: Student, b: Student) => {
    const aVal = a[sortField.value]
    const bVal = b[sortField.value]
    if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1
    return 0
  })
  
  return filtered
})

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredStudents.value.slice(start, end)
})

const totalPages = computed(() =>
  Math.ceil(filteredStudents.value.length / itemsPerPage)
)

const allSelected = computed(() =>
  paginatedStudents.value.length > 0 &&
  paginatedStudents.value.every((student: Student) => selectedStudents.value.has(student.id))
)

const genderStats = computed(() => ({
  male: filteredStudents.value.filter((student: Student) => student.gender === 'male').length,
  female: filteredStudents.value.filter((student: Student) => student.gender === 'female').length
}))

// Methods
async function loadData() {
  try {
    loading.value = true
    error.value = null

    students.value = await studentsBridge.studentRepository.findAll()
    classes.value = await SportBridge.classGroupRepository.findAll()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Fehler beim Laden'
  } finally {
    loading.value = false
  }
}

function getClassName(classGroupId: string): string {
  const cls = classes.value.find((classGroup: ClassGroup) => classGroup.id === classGroupId)
  return cls ? cls.name : '-'
}

function getGenderDisplay(gender?: 'male' | 'female' | 'diverse'): string {
  if (gender === 'male') return t('SCHUELER.maennlich')
  if (gender === 'female') return t('SCHUELER.weiblich')
  if (gender === 'diverse') return 'Divers'
  return '-'
}

function sort(field: 'firstName' | 'lastName') {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
}

function getSortIcon(field: string): string {
  if (sortField.value !== field) return ''
  return sortDirection.value === 'asc' ? '↑' : '↓'
}

function toggleSelect(id: string) {
  if (selectedStudents.value.has(id)) {
    selectedStudents.value.delete(id)
  } else {
    selectedStudents.value.add(id)
  }
}

function toggleSelectAll() {
  if (allSelected.value) {
    paginatedStudents.value.forEach((student: Student) => selectedStudents.value.delete(student.id))
  } else {
    paginatedStudents.value.forEach((student: Student) => selectedStudents.value.add(student.id))
  }
}

function isSelected(id: string): boolean {
  return selectedStudents.value.has(id)
}

function editStudent(student: Student) {
  editingStudent.value = student
  studentForm.value = {
    firstName: student.firstName,
    lastName: student.lastName,
    classGroupId: student.classGroupId,
    gender: student.gender === 'male' ? 'm' : student.gender === 'female' ? 'w' : '',
    email: student.contactInfo?.email || '',
    parentEmail: student.contactInfo?.parentEmail || '',
    phone: student.contactInfo?.phone || ''
  }
  birthYear.value = student.birthYear ?? null
}

async function saveStudent() {
  try {
    saving.value = true

    const gender = studentForm.value.gender === 'm'
      ? 'male'
      : studentForm.value.gender === 'w'
        ? 'female'
        : undefined

    if (editingStudent.value) {
      await studentsBridge.studentRepository.update(editingStudent.value.id, {
        firstName: studentForm.value.firstName,
        lastName: studentForm.value.lastName,
        classGroupId: studentForm.value.classGroupId,
        birthYear: birthYear.value ?? undefined,
        gender,
        contactInfo: {
          email: studentForm.value.email || undefined,
          parentEmail: studentForm.value.parentEmail || undefined,
          phone: studentForm.value.phone || undefined
        }
      })
      showToast('Schüler aktualisiert', 'success')
    } else {
      await studentsBridge.addStudentUseCase.execute({
        firstName: studentForm.value.firstName,
        lastName: studentForm.value.lastName,
        classGroupId: studentForm.value.classGroupId,
        birthYear: birthYear.value ?? undefined,
        gender,
        email: studentForm.value.email || undefined,
        parentEmail: studentForm.value.parentEmail || undefined,
        phone: studentForm.value.phone || undefined
      })
      showToast('Schüler hinzugefügt', 'success')
    }

    await loadData()
    closeModal()
  } catch (err) {
    showToast(err instanceof Error ? err.message : 'Fehler beim Speichern', 'error')
  } finally {
    saving.value = false
  }
}

async function deleteStudent(student: Student) {
  if (!confirm(`Schüler "${student.firstName} ${student.lastName}" wirklich löschen?`)) {
    return;
  }
  
  try {
    await studentsBridge.studentRepository.delete(student.id)
    showToast('Schüler gelöscht', 'success')
    await loadData()
  } catch (err) {
    showToast(err instanceof Error ? err.message : 'Fehler beim Löschen', 'error')
  }
}

async function bulkDelete() {
  if (!confirm(`${selectedStudents.value.size} Schüler wirklich löschen?`)) {
    return;
  }
  
  try {
    for (const id of selectedStudents.value) {
      await studentsBridge.studentRepository.delete(id)
    }
    showToast(`${selectedStudents.value.size} Schüler gelöscht`, 'success')
    selectedStudents.value.clear()
    await loadData()
  } catch (err) {
    showToast(err instanceof Error ? err.message : 'Fehler beim Löschen', 'error')
  }
}

function bulkMoveToClass() {
  // TODO: Implement bulk move - needs modal for class selection
  showToast('Funktion noch nicht implementiert', 'error');
}

async function importCSV() {
  if (!csvData.value.trim()) {
    showToast('Keine Daten zum Importieren', 'error')
    return
  }
  
  try {
    const lines = csvData.value.trim().split('\n')
    
    let imported = 0
    for (const line of lines) {
      const [firstName, lastName, className, gender, birthYearStr] = line.split(',').map((part) => part.trim())
      
      if (!firstName || !lastName || !className) continue
      
      // Find or create class
      let cls = classes.value.find((classGroup: ClassGroup) => classGroup.name === className)
      if (!cls) {
        // Create class if not exists
        const newClass = await SportBridge.classGroupRepository.create({
          name: className,
          schoolYear: new Date().getFullYear().toString()
        })
        classes.value.push(newClass)
        cls = newClass
      }
      
      // Create student
      await studentsBridge.addStudentUseCase.execute({
        firstName,
        lastName,
        classGroupId: cls.id,
        gender: gender === 'm' ? 'male' : gender === 'w' ? 'female' : undefined,
        birthYear: birthYearStr ? parseInt(birthYearStr, 10) : undefined
      })
      
      imported++
    }
    
    showToast(`${imported} Schüler importiert`, 'success')
    csvData.value = ''
    showImportModal.value = false
    await loadData()
  } catch (err) {
    showToast(err instanceof Error ? err.message : 'Fehler beim Importieren', 'error')
  }
}

function closeModal() {
  showAddModal.value = false
  editingStudent.value = null
  studentForm.value = {
    firstName: '',
    lastName: '',
    classGroupId: '',
    gender: '',
    email: '',
    parentEmail: '',
    phone: ''
  }
  birthYear.value = null
}

function showToast(message: string, type: 'success' | 'error') {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 3000)
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.student-list-view {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.page-description {
  color: #666;
  margin-top: 4px;
}

.controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.search-group {
  display: flex;
  gap: 12px;
  flex: 1;
  min-width: 300px;
}

.search-input,
.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.filter-select {
  min-width: 150px;
}

.bulk-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.selection-count {
  font-weight: 500;
  color: #0066cc;
}

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.student-table {
  width: 100%;
  border-collapse: collapse;
}

.student-table thead {
  background: #f8f9fa;
  border-bottom: 2px solid #e9ecef;
}

.student-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  font-size: 13px;
  color: #495057;
  cursor: pointer;
  user-select: none;
}

.student-table th:hover {
  background: #e9ecef;
}

.student-table td {
  padding: 12px;
  border-bottom: 1px solid #f1f3f5;
}

.student-table tbody tr:hover {
  background: #f8f9fa;
}

.student-table tbody tr.selected {
  background: #e7f5ff;
}

.checkbox-col {
  width: 40px;
  text-align: center;
}

.actions-col {
  width: 120px;
  text-align: right;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.btn-icon:hover {
  opacity: 1;
}

.sort-indicator {
  margin-left: 4px;
  font-size: 10px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-top: 1px solid #e9ecef;
}

.page-info {
  font-size: 14px;
  color: #666;
}

.stats-bar {
  display: flex;
  gap: 32px;
  margin-top: 16px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #0066cc;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 32px;
  line-height: 1;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 32px;
  height: 32px;
}

.btn-close:hover {
  color: #333;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.form-hint {
  margin-top: 6px;
  font-size: 13px;
  color: #666;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #0066cc;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0052a3;
}

.btn-secondary {
  background: #f1f3f5;
  color: #495057;
}

.btn-secondary:hover:not(:disabled) {
  background: #e9ecef;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-small {
  padding: 6px 12px;
  font-size: 13px;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 48px 24px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #0066cc;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
  }
  
  .header-actions {
    width: 100%;
  }
  
  .header-actions button {
    flex: 1;
  }
  
  .controls-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-group {
    flex-direction: column;
  }
  
  .student-table {
    font-size: 13px;
  }
  
  .student-table th,
  .student-table td {
    padding: 8px 6px;
  }
}
</style>

