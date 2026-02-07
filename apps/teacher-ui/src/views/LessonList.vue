<template>
  <div class="lesson-list-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← Zurück</button>
      <div class="header-content">
        <div>
          <h2>Stunden {{ classGroup ? `- ${classGroup.name}` : '' }}</h2>
          <p class="page-description">Verwalten Sie Unterrichtsstunden und Anwesenheit</p>
        </div>
        <button class="btn-primary" @click="showCreateLessonModal = true">
          + Neue Stunde
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Stunden werden geladen...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-primary" @click="loadData">Erneut versuchen</button>
    </div>

    <!-- Lessons -->
    <div v-else>
      <!-- Filters -->
      <section class="card filters-card">
        <div class="filters">
          <div class="filter-group">
            <label for="class-filter" class="filter-label">Klasse:</label>
            <select id="class-filter" v-model="selectedClassId" class="filter-select" @change="onClassChange">
              <option value="">Alle Klassen</option>
              <option v-for="cls in classes" :key="cls.id" :value="cls.id">
                {{ cls.name }} ({{ cls.schoolYear }})
              </option>
            </select>
          </div>
          
          <div class="filter-group">
            <label for="date-from" class="filter-label">Von:</label>
            <input 
              id="date-from" 
              type="date" 
              v-model="dateFrom" 
              class="filter-input"
              @change="onDateFilterChange"
            />
          </div>
          
          <div class="filter-group">
            <label for="date-to" class="filter-label">Bis:</label>
            <input 
              id="date-to" 
              type="date" 
              v-model="dateTo" 
              class="filter-input"
              @change="onDateFilterChange"
            />
          </div>
        </div>
      </section>

      <!-- Lessons List -->
      <section class="card">
        <h3>Stunden ({{ filteredLessons.length }})</h3>
        
        <div v-if="filteredLessons.length === 0" class="empty-state">
          <p>Keine Stunden gefunden. {{ selectedClassId ? 'Erstellen Sie die erste Stunde für diese Klasse.' : 'Wählen Sie eine Klasse und erstellen Sie eine Stunde.' }}</p>
        </div>
        
        <div v-else class="lessons-list">
          <div v-for="lesson in filteredLessons" :key="lesson.id" class="lesson-card">
            <div class="lesson-main">
              <div class="lesson-date">
                <div class="lesson-day">{{ formatDay(lesson.date) }}</div>
                <div class="lesson-month">{{ formatMonth(lesson.date) }}</div>
              </div>
              <div class="lesson-info">
                <h4>{{ getClassName(lesson.classGroupId) }}</h4>
                <p class="lesson-time">{{ formatTime(lesson.date) }}</p>
                <div v-if="lesson.lessonParts && lesson.lessonParts.length > 0" class="lesson-parts">
                  <span v-for="(part, idx) in lesson.lessonParts" :key="part.id" class="lesson-part">
                    {{ part.description }}{{ idx < lesson.lessonParts!.length - 1 ? ', ' : '' }}
                  </span>
                </div>
              </div>
            </div>
            <div class="lesson-actions">
              <RouterLink 
                :to="`/attendance?classId=${lesson.classGroupId}&lessonId=${lesson.id}`" 
                class="action-btn action-btn-attendance"
                title="Anwesenheit erfassen"
              >
                ✓
              </RouterLink>
              <button 
                @click="handleEditLesson(lesson)" 
                class="action-btn action-btn-edit"
                title="Stunde bearbeiten"
              >
                ✏️
              </button>
              <button 
                @click="handleDeleteLesson(lesson.id)" 
                class="action-btn action-btn-delete"
                title="Stunde löschen"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Create/Edit Lesson Modal -->
    <div v-if="showCreateLessonModal || showEditLessonModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ showEditLessonModal ? 'Stunde bearbeiten' : 'Neue Stunde' }}</h3>
          <button class="modal-close" @click="closeModals">×</button>
        </div>
        
        <div class="modal-content">
          <div class="form-group">
            <label for="lesson-class" class="form-label">Klasse*</label>
            <select 
              id="lesson-class" 
              v-model="lessonForm.classGroupId" 
              class="form-input"
              :disabled="showEditLessonModal"
            >
              <option value="">Klasse wählen...</option>
              <option v-for="cls in classes" :key="cls.id" :value="cls.id">
                {{ cls.name }} ({{ cls.schoolYear }})
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="lesson-date" class="form-label">Datum*</label>
            <input 
              id="lesson-date" 
              type="date" 
              v-model="lessonForm.date" 
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="lesson-time" class="form-label">Uhrzeit</label>
            <input 
              id="lesson-time" 
              type="time" 
              v-model="lessonForm.time" 
              class="form-input"
            />
          </div>
          
          <div v-if="saveError" class="error-message">
            {{ saveError }}
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeModals">Abbrechen</button>
          <button 
            class="btn-primary" 
            @click="handleSaveLesson"
            :disabled="!lessonForm.classGroupId || !lessonForm.date || saving"
          >
            {{ saving ? 'Wird gespeichert...' : (showEditLessonModal ? 'Speichern' : 'Erstellen') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getSportBridge } from '../composables/useSportBridge'
import type { Lesson, ClassGroup } from '@viccoboard/core'

const route = useRoute()
const sportBridge = getSportBridge()

// State
const classes = ref<ClassGroup[]>([])
const lessons = ref<Lesson[]>([])
const classGroup = ref<ClassGroup | null>(null)
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const saveError = ref('')
const selectedClassId = ref<string>('')
const dateFrom = ref<string>('')
const dateTo = ref<string>('')
const showCreateLessonModal = ref(false)
const showEditLessonModal = ref(false)

interface LessonForm {
  id?: string
  classGroupId: string
  date: string
  time: string
}

const lessonForm = ref<LessonForm>({
  classGroupId: '',
  date: new Date().toISOString().split('T')[0],
  time: '08:00'
})

// Computed
const filteredLessons = computed(() => {
  let filtered = lessons.value

  if (selectedClassId.value) {
    filtered = filtered.filter(l => l.classGroupId === selectedClassId.value)
  }

  if (dateFrom.value) {
    const fromDate = new Date(dateFrom.value)
    filtered = filtered.filter(l => l.date >= fromDate)
  }

  if (dateTo.value) {
    const toDate = new Date(dateTo.value)
    toDate.setHours(23, 59, 59, 999)
    filtered = filtered.filter(l => l.date <= toDate)
  }

  // Sort by date descending
  return filtered.sort((a, b) => b.date.getTime() - a.date.getTime())
})

// Methods
const loadData = async () => {
  loading.value = true
  error.value = ''

  try {
    // Load all classes
    classes.value = await sportBridge.classGroupRepository.findAll()

    // If classId is in route, load that class specifically
    const classIdFromRoute = route.query.classId as string
    if (classIdFromRoute) {
      selectedClassId.value = classIdFromRoute
      classGroup.value = await sportBridge.classGroupRepository.findById(classIdFromRoute)
      lessons.value = await sportBridge.lessonRepository.findByClassGroup(classIdFromRoute)
    } else {
      // Load all lessons for all classes
      const allLessons: Lesson[] = []
      for (const cls of classes.value) {
        const classLessons = await sportBridge.lessonRepository.findByClassGroup(cls.id)
        allLessons.push(...classLessons)
      }
      lessons.value = allLessons
    }
  } catch (err) {
    console.error('Failed to load lessons:', err)
    error.value = 'Fehler beim Laden der Stunden'
  } finally {
    loading.value = false
  }
}

const onClassChange = async () => {
  if (!selectedClassId.value) {
    lessons.value = []
    const allLessons: Lesson[] = []
    for (const cls of classes.value) {
      const classLessons = await sportBridge.lessonRepository.findByClassGroup(cls.id)
      allLessons.push(...classLessons)
    }
    lessons.value = allLessons
  } else {
    lessons.value = await sportBridge.lessonRepository.findByClassGroup(selectedClassId.value)
  }
}

const onDateFilterChange = () => {
  // Filtering happens automatically via computed property
}

const handleEditLesson = (lesson: Lesson) => {
  lessonForm.value = {
    id: lesson.id,
    classGroupId: lesson.classGroupId,
    date: lesson.date.toISOString().split('T')[0],
    time: lesson.date.toTimeString().split(' ')[0].substring(0, 5)
  }
  showEditLessonModal.value = true
}

const handleDeleteLesson = async (lessonId: string) => {
  if (!confirm('Möchten Sie diese Stunde wirklich löschen?')) {
    return
  }

  try {
    await sportBridge.lessonRepository.delete(lessonId)
    await loadData()
  } catch (err) {
    console.error('Failed to delete lesson:', err)
    error.value = 'Fehler beim Löschen der Stunde'
  }
}

const handleSaveLesson = async () => {
  saveError.value = ''
  saving.value = true

  try {
    // Combine date and time
    const dateTime = new Date(`${lessonForm.value.date}T${lessonForm.value.time}:00`)

    if (showEditLessonModal.value && lessonForm.value.id) {
      // Update existing lesson
      await sportBridge.lessonRepository.update(lessonForm.value.id, {
        date: dateTime
      })
    } else {
      // Create new lesson
      await sportBridge.createLessonUseCase.execute({
        classGroupId: lessonForm.value.classGroupId,
        date: dateTime
      })
    }

    closeModals()
    await loadData()
  } catch (err) {
    console.error('Failed to save lesson:', err)
    if (err instanceof Error) {
      saveError.value = err.message
    } else {
      saveError.value = 'Fehler beim Speichern der Stunde'
    }
  } finally {
    saving.value = false
  }
}

const closeModals = () => {
  showCreateLessonModal.value = false
  showEditLessonModal.value = false
  saveError.value = ''
  lessonForm.value = {
    classGroupId: selectedClassId.value || '',
    date: new Date().toISOString().split('T')[0],
    time: '08:00'
  }
}

const getClassName = (classGroupId: string): string => {
  const cls = classes.value.find(c => c.id === classGroupId)
  return cls ? cls.name : 'Unbekannt'
}

const formatDay = (date: Date): string => {
  return date.getDate().toString().padStart(2, '0')
}

const formatMonth = (date: Date): string => {
  const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
  return months[date.getMonth()]
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

// Lifecycle
onMounted(async () => {
  await loadData()
})
</script>

<style scoped>
.lesson-list-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
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

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
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

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.card h3 {
  font-size: 1.25rem;
  color: #333;
  margin: 0 0 1.5rem 0;
  border-bottom: 2px solid #667eea;
  padding-bottom: 0.5rem;
}

.filters-card {
  margin-bottom: 1.5rem;
}

.filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 200px;
}

.filter-label {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.filter-select,
.filter-input {
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
  min-height: 44px;
}

.filter-select:focus,
.filter-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
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
  padding: 2rem;
  color: #c62828;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #999;
  font-style: italic;
}

.lessons-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.lesson-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  transition: all 0.2s ease;
  gap: 1rem;
}

.lesson-card:hover {
  background: #fafafa;
  border-color: #667eea;
}

.lesson-main {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex: 1;
}

.lesson-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: #667eea;
  color: white;
  border-radius: 8px;
  flex-shrink: 0;
}

.lesson-day {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
}

.lesson-month {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.lesson-info {
  flex: 1;
}

.lesson-info h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
  color: #333;
}

.lesson-time {
  margin: 0 0 0.5rem 0;
  color: #666;
  font-size: 0.95rem;
}

.lesson-parts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: #999;
}

.lesson-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  min-width: 44px;
  min-height: 44px;
  padding: 0.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-size: 1.2rem;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-btn-attendance:hover {
  border-color: #4caf50;
  background: #e8f5e9;
}

.action-btn-edit:hover {
  border-color: #2196f3;
  background: #e3f2fd;
}

.action-btn-delete:hover {
  border-color: #f44336;
  background: #ffebee;
}

.btn-primary {
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
}

.btn-primary:hover:not(:disabled) {
  background: #5568d3;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-secondary {
  background: white;
  color: #666;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
}

.btn-secondary:hover {
  border-color: #ccc;
  background: #f8f9fa;
}

/* Modal styles */
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
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
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
  font-size: 1.25rem;
  color: #333;
}

.modal-close {
  background: transparent;
  border: none;
  font-size: 2rem;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: #f5f5f5;
  color: #333;
}

.modal-content {
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

.form-label {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.form-input {
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
  min-height: 44px;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.error-message {
  padding: 0.75rem;
  border-radius: 6px;
  background: #ffebee;
  color: #c62828;
  border: 1px solid #f44336;
  font-size: 0.95rem;
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
  }

  .filters {
    flex-direction: column;
  }

  .filter-group {
    min-width: 100%;
  }

  .lesson-actions {
    flex-direction: column;
  }

  .lesson-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .lesson-actions {
    align-self: flex-end;
    flex-direction: row;
  }
}
</style>
