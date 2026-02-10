<template>
  <div class="dashboard-view">
    <div class="page-header">
      <h2>{{ t('TOURNAMENT.overview') }}</h2>
      <p class="page-description">{{ t('HELLO') }}! {{ t('KLASSEN.klassen-verwalten') }}</p>
    </div>
    
    <div class="dashboard-grid">
      <section class="card classes-card">
        <div class="card-header">
          <h3>{{ t('KLASSEN.title') }}</h3>
          <button class="btn-primary btn-small" @click="showCreateModal = true">
            + {{ t('KLASSEN.hinzu') }}
          </button>
        </div>
        
        <!-- Search/Filter -->
        <div class="search-bar" v-if="classes.length > 0">
          <div class="search-controls">
            <input 
              v-model="searchQuery"
              type="text"
              :placeholder="t('SEARCH.placeholder')"
              class="search-input"
            />
            <select v-model="filterSchoolYear" class="filter-select">
              <option value="">{{ t('KLASSEN.schuljahr') }}: {{ t('COMMON.alle') || 'Alle' }}</option>
              <option v-for="year in schoolYears" :key="year" :value="year">
                {{ year }}
              </option>
            </select>
          </div>
          <label class="archive-toggle">
            <input type="checkbox" v-model="showArchived" />
            {{ t('COMMON.archivierte-anzeigen') || 'Archivierte anzeigen' }}
          </label>
        </div>

        <div class="card-content">
          <!-- Loading State -->
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>{{ t('COMMON.loading') }}</p>
          </div>

          <!-- Error State -->
          <div v-else-if="loadError" class="error-state">
            <p>{{ loadError }}</p>
            <button class="btn-primary btn-small" @click="loadData">
              {{ t('COMMON.retry') || 'Erneut versuchen' }}
            </button>
          </div>

          <!-- Empty State -->
          <div v-else-if="filteredClasses.length === 0 && searchQuery === ''" class="empty-state">
            <p>{{ t('KLASSEN.no-classes') }}</p>
          </div>
          
          <!-- No Results State -->
          <div v-else-if="filteredClasses.length === 0" class="empty-state">
            <p>{{ t('COMMON.no-results') || `Keine Klassen gefunden für "${searchQuery}"` }}</p>
          </div>
          
          <!-- Classes List -->
          <div v-else class="class-list">
            <div 
              v-for="cls in filteredClasses" 
              :key="cls.id"
              class="class-card-wrapper"
            >
              <RouterLink 
                :to="`/classes/${cls.id}`"
                class="class-card"
              >
                <div class="class-info">
                  <div class="class-title">
                    <span class="class-color" :style="getClassColorStyle(cls.color)"></span>
                    <h4>{{ cls.name }}</h4>
                  </div>
                  <p class="class-meta">{{ cls.schoolYear }}</p>
                </div>
                <div class="class-arrow">→</div>
              </RouterLink>
              <div class="class-actions">
                <button 
                  @click.stop="editClass(cls)" 
                  class="action-btn"
                  :title="t('CLASSES.edit')"
                  :aria-label="t('CLASSES.edit')"
                >
                  ✏️
                </button>
                <button 
                  @click.stop="toggleArchiveClass(cls)" 
                  class="action-btn"
                  :title="cls.archived ? t('COMMON.unarchive') || 'Wiederherstellen' : t('COMMON.archive') || 'Archivieren'"
                  :aria-label="cls.archived ? t('COMMON.unarchive') || 'Wiederherstellen' : t('COMMON.archive') || 'Archivieren'"
                >
                  {{ cls.archived ? '📤' : '📥' }}
                </button>
                <button 
                  @click.stop="confirmDeleteClass(cls)" 
                  class="action-btn action-btn-danger"
                  :title="`Delete class ${cls.name}`"
                  :aria-label="`Delete class ${cls.name}`"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section class="card">
        <h3>Schnellzugriffe</h3>
        <div class="card-content">
          <button 
            class="action-button"
            @click="showCreateModal = true"
          >
            <span class="action-icon">📚</span>
            <span>Neue Klasse erstellen</span>
          </button>
          <RouterLink to="/students" class="action-button">
            <span class="action-icon">👥</span>
            <span>Alle Schüler anzeigen</span>
          </RouterLink>
          <RouterLink to="/attendance" class="action-button">
            <span class="action-icon">✓</span>
            <span>Anwesenheit erfassen</span>
          </RouterLink>
        </div>
      </section>
      
      <section class="card">
        <h3>Letzte Aktivitäten</h3>
        <div class="card-content">
          <!-- Loading State -->
          <div v-if="loading" class="loading-state-small">
            <div class="spinner-small"></div>
            <p>Wird geladen...</p>
          </div>
          
          <!-- Empty State -->
          <div v-else-if="recentActivity.length === 0" class="empty-state">
            <p>Keine Aktivitäten zum Anzeigen.</p>
          </div>
          
          <!-- Recent Activity List -->
          <div v-else class="activity-list">
            <div 
              v-for="activity in recentActivity" 
              :key="activity.id"
              class="activity-item"
            >
              <span class="activity-icon">{{ getActivityIcon(activity.status) }}</span>
              <div class="activity-details">
                <p class="activity-text">Anwesenheit erfasst</p>
                <p class="activity-time">{{ formatDate(activity.timestamp) }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
    
    <!-- Create Class Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ t('KLASSEN.hinzu') }}</h3>
          <button class="modal-close" @click="closeModal">✕</button>
        </div>
        
        <form @submit.prevent="handleCreateClass" class="modal-form">
          <div class="form-group">
            <label for="className">Klassenname *</label>
            <input
              id="className"
              v-model="newClass.name"
              type="text"
              placeholder="z.B. Klasse 9a Sport"
              required
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="schoolYear">Schuljahr *</label>
            <input
              id="schoolYear"
              v-model="newClass.schoolYear"
              type="text"
              placeholder="z.B. 2025/2026"
              pattern="\d{4}/\d{4}"
              required
              class="form-input"
            />
            <small class="form-hint">Format: YYYY/YYYY</small>
          </div>

          <div class="form-group">
            <label for="gradingScheme">{{ t('KLASSEN.notenschema') }}</label>
            <select id="gradingScheme" v-model="newClass.gradingScheme" class="form-input">
              <option v-for="(label, key) in gradingSchemes" :key="key" :value="key">
                {{ label }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="classColor">{{ t('KLASSEN.color') || 'Klassenfarbe' }}</label>
            <select id="classColor" v-model="newClass.color" class="form-input">
              <option value="">{{ t('COMMON.none') || 'Keine' }}</option>
              <option v-for="color in classColorOptions" :key="color.value" :value="color.value">
                {{ color.label }}
              </option>
            </select>
          </div>
          
          <div v-if="error" class="error-message">
            {{ error }}
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn-secondary">
              {{ t('COMMON.cancel') || t('CANCEL') }}
            </button>
            <button type="submit" :disabled="creating" class="btn-primary">
              {{ creating ? t('COMMON.loading') : t('KLASSEN.button-hinzufuegen') }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Edit Class Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Edit Class</h3>
          <button class="modal-close" @click="closeEditModal">✕</button>
        </div>
        
        <form @submit.prevent="handleUpdateClass" class="modal-form">
          <div class="form-group">
            <label for="editClassName">Class Name *</label>
            <input
              id="editClassName"
              v-model="editClassData.name"
              type="text"
              required
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="editSchoolYear">School Year *</label>
            <input
              id="editSchoolYear"
              v-model="editClassData.schoolYear"
              type="text"
              pattern="\d{4}/\d{4}"
              required
              class="form-input"
            />
            <small class="form-hint">Format: YYYY/YYYY</small>
          </div>

          <div class="form-group">
            <label for="editGradingScheme">Notenschema</label>
            <select id="editGradingScheme" v-model="editClassData.gradingScheme" class="form-input">
              <option v-for="(label, key) in gradingSchemes" :key="key" :value="key">
                {{ label }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="editClassColor">Klassenfarbe</label>
            <select id="editClassColor" v-model="editClassData.color" class="form-input">
              <option value="">Keine</option>
              <option v-for="color in classColorOptions" :key="color.value" :value="color.value">
                {{ color.label }}
              </option>
            </select>
          </div>
          
          <div v-if="editError" class="error-message">
            {{ editError }}
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeEditModal" class="btn-secondary">
              Cancel
            </button>
            <button type="submit" :disabled="updating" class="btn-primary">
              {{ updating ? 'Updating...' : 'Update Class' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal modal-small" @click.stop>
        <div class="modal-header">
          <h3>Delete Class</h3>
          <button class="modal-close" @click="closeDeleteModal">✕</button>
        </div>
        
        <div class="modal-content">
          <p>Are you sure you want to delete <strong>{{ classToDelete?.name }}</strong>?</p>
          <p class="warning-text">This action cannot be undone.</p>
          
          <div v-if="deleteError" class="error-message">
            {{ deleteError }}
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeDeleteModal" class="btn-secondary">
              Cancel
            </button>
            <button @click="handleDeleteClass" :disabled="deleting" class="btn-danger">
              {{ deleting ? 'Deleting...' : 'Delete Class' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useClassGroups, useAttendance } from '../composables/useSportBridge'
import { DEFAULT_GRADING_SCHEME, GRADING_SCHEMES } from '../constants/grading'
import type { ClassGroup, AttendanceRecord } from '@viccoboard/core'

// i18n
const { t } = useI18n()

// State
const classes = ref<ClassGroup[]>([])
const recentActivity = ref<AttendanceRecord[]>([])
const loading = ref(true)
const loadError = ref('')
const searchQuery = ref('')
const filterSchoolYear = ref('')
const showArchived = ref(false)
const showCreateModal = ref(false)
const creating = ref(false)
const error = ref('')

const newClass = ref<{ name: string; schoolYear: string; gradingScheme: string; color: string }>({
  name: '',
  schoolYear: '',
  gradingScheme: DEFAULT_GRADING_SCHEME,
  color: ''
})

// Edit state
const showEditModal = ref(false)
const editClassData = ref<{ id: string; name: string; schoolYear: string; gradingScheme: string; color: string }>({ id: '', name: '', schoolYear: '', gradingScheme: DEFAULT_GRADING_SCHEME, color: '' })
const editError = ref('')
const updating = ref(false)

// Delete state
const showDeleteModal = ref(false)
const classToDelete = ref<ClassGroup | null>(null)
const deleteError = ref('')
const deleting = ref(false)

// Composables
const classGroups = useClassGroups()
const attendance = useAttendance()
const gradingSchemes = GRADING_SCHEMES
const classColorOptions = [
  { value: 'white', label: 'Weiß' },
  { value: 'green', label: 'Grün' },
  { value: 'red', label: 'Rot' },
  { value: 'blue', label: 'Blau' },
  { value: 'orange', label: 'Orange' },
  { value: 'yellow', label: 'Gelb' },
  { value: 'grey', label: 'Grau' }
]

// Computed
const schoolYears = computed(() => {
  const years = new Set(classes.value.map((cls: ClassGroup) => cls.schoolYear))
  return Array.from(years).sort().reverse()
})

const filteredClasses = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return classes.value.filter((cls: ClassGroup) => {
    const matchesQuery = !query
      || cls.name.toLowerCase().includes(query)
      || cls.schoolYear.toLowerCase().includes(query)
    const matchesYear = !filterSchoolYear.value || cls.schoolYear === filterSchoolYear.value
    const matchesArchive = showArchived.value ? true : !cls.archived
    return matchesQuery && matchesYear && matchesArchive
  })
})

// Methods
const loadData = async () => {
  loading.value = true
  loadError.value = ''
  try {
    classes.value = await classGroups.findAll()
    recentActivity.value = await attendance.findAll({
      orderBy: 'timestamp',
      orderDirection: 'desc',
      limit: 5
    })
  } catch (err) {
    console.error('Failed to load data:', err)
    loadError.value = 'Fehler beim Laden der Übersichtsdaten. Bitte aktualisieren Sie die Seite.'
  } finally {
    loading.value = false
  }
}

const handleCreateClass = async () => {
  error.value = ''
  creating.value = true
  
  try {
    await classGroups.create({
      name: newClass.value.name.trim(),
      schoolYear: newClass.value.schoolYear.trim(),
      gradingScheme: newClass.value.gradingScheme,
      color: newClass.value.color || undefined
    })
    
    // Reload classes
    await loadData()
    
    // Reset form and close modal
    newClass.value = { name: '', schoolYear: '', gradingScheme: DEFAULT_GRADING_SCHEME, color: '' }
    showCreateModal.value = false
  } catch (err) {
    console.error('Failed to create class:', err)
    if (err instanceof Error) {
      // Check for specific error types
      if (err.message.includes('already exists')) {
        error.value = 'Eine Klasse mit diesem Namen existiert bereits für dieses Schuljahr.'
      } else if (err.message.includes('name is required')) {
        error.value = 'Bitte geben Sie einen Klassennamen ein.'
      } else if (err.message.includes('School year')) {
        error.value = 'Bitte geben Sie ein gültiges Schuljahr im Format YYYY/YYYY ein (z.B. 2025/2026).'
      } else {
        error.value = err.message
      }
    } else {
      error.value = 'Fehler beim Erstellen der Klasse. Bitte versuchen Sie es erneut.'
    }
  } finally {
    creating.value = false
  }
}

const closeModal = () => {
  showCreateModal.value = false
  error.value = ''
  newClass.value = { name: '', schoolYear: '', gradingScheme: DEFAULT_GRADING_SCHEME, color: '' }
}

const editClass = (cls: ClassGroup) => {
  editClassData.value = {
    id: cls.id,
    name: cls.name,
    schoolYear: cls.schoolYear,
    gradingScheme: cls.gradingScheme || DEFAULT_GRADING_SCHEME,
    color: cls.color || ''
  }
  showEditModal.value = true
}

const handleUpdateClass = async () => {
  editError.value = ''
  updating.value = true
  
  try {
    await classGroups.update(editClassData.value.id, {
      name: editClassData.value.name.trim(),
      schoolYear: editClassData.value.schoolYear.trim(),
      gradingScheme: editClassData.value.gradingScheme,
      color: editClassData.value.color || undefined
    })
    
    // Reload classes
    await loadData()
    
    // Close modal
    showEditModal.value = false
  } catch (err) {
    console.error('Failed to update class:', err)
    editError.value = err instanceof Error ? err.message : 'Failed to update class'
  } finally {
    updating.value = false
  }
}

const closeEditModal = () => {
  showEditModal.value = false
  editError.value = ''
  editClassData.value = { id: '', name: '', schoolYear: '', gradingScheme: DEFAULT_GRADING_SCHEME, color: '' }
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

const confirmDeleteClass = (cls: ClassGroup) => {
  classToDelete.value = cls
  showDeleteModal.value = true
}

const handleDeleteClass = async () => {
  if (!classToDelete.value) return
  
  deleteError.value = ''
  deleting.value = true
  
  try {
    await classGroups.delete(classToDelete.value.id)
    
    // Reload classes
    await loadData()
    
    // Close modal
    showDeleteModal.value = false
    classToDelete.value = null
  } catch (err) {
    console.error('Failed to delete class:', err)
    deleteError.value = err instanceof Error ? err.message : 'Failed to delete class'
  } finally {
    deleting.value = false
  }
}

const toggleArchiveClass = async (cls: ClassGroup) => {
  try {
    await classGroups.update(cls.id, { archived: !cls.archived })
    await loadData()
  } catch (err) {
    console.error('Failed to toggle archive:', err)
  }
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  deleteError.value = ''
  classToDelete.value = null
}

const getActivityIcon = (status: string): string => {
  const icons: Record<string, string> = {
    present: '✓',
    absent: '✗',
    excused: '📋',
    late: '⏰'
  }
  return icons[status] || '•'
}

const formatDate = (date: Date): string => {
  const now = new Date()
  const recordDate = new Date(date)
  const diffMs = now.getTime() - recordDate.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'Eben eben'
  if (diffMins < 60) return `vor ${diffMins} Minute${diffMins > 1 ? 'n' : ''}`
  if (diffHours < 24) return `vor ${diffHours} Stunde${diffHours > 1 ? 'n' : ''}`
  if (diffDays < 7) return `vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`
  
  return recordDate.toLocaleDateString()
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<style src="../styles/modal.css"></style>

<style scoped>
.dashboard-view {
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

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
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

.card-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
}

.search-bar {
  margin-bottom: 0.5rem;
}

.search-controls {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.archive-toggle {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.9rem;
  color: #555;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.filter-select {
  padding: 0.75rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  background: #fff;
  min-width: 160px;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  gap: 1rem;
}

.loading-state-small {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  color: #666;
  font-size: 0.875rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  color: #999;
  font-style: italic;
  text-align: center;
  padding: 2rem 1rem;
}

.error-state {
  text-align: center;
  padding: 2rem 1rem;
}

.error-state p {
  color: #c33;
  margin: 0 0 1rem 0;
  font-weight: 500;
}

.class-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.class-card-wrapper {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.class-card {
  flex: 1;
  display: flex;
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

.class-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.class-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid #ccc;
  display: inline-block;
}

.class-card:hover {
  background: #e9ecef;
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.class-info h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
  color: #333;
}

.class-meta {
  margin: 0;
  font-size: 0.875rem;
  color: #666;
}

.class-arrow {
  font-size: 1.5rem;
  color: #667eea;
}

.class-actions {
  display: flex;
  gap: 0.25rem;
}

.action-btn {
  padding: 0.5rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.25rem;
  transition: all 0.2s ease;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: #f8f9fa;
  border-color: #667eea;
  transform: scale(1.05);
}

.action-btn-danger:hover {
  background: #fee;
  border-color: #fcc;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.activity-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.activity-details {
  flex: 1;
}

.activity-text {
  margin: 0 0 0.25rem 0;
  font-size: 0.95rem;
  color: #333;
}

.activity-time {
  margin: 0;
  font-size: 0.8rem;
  color: #666;
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
  display: flex;
  align-items: center;
  justify-content: center;
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

.btn-danger {
  background: #dc3545;
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

.btn-danger:hover {
  background: #c82333;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

.btn-danger:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
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

.modal-small {
  max-width: 400px;
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

.modal-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-content p {
  margin: 0;
  color: #333;
  line-height: 1.5;
}

.warning-text {
  color: #dc3545;
  font-weight: 500;
  font-size: 0.9rem;
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
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .page-header h2 {
    font-size: 1.5rem;
  }
  
  .card-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
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

/* Classes card takes more space on larger screens */
@media (min-width: 769px) {
  .classes-card {
    grid-column: span 2;
  }
}
</style>

