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
                <div v-if="lesson.shortcuts && lesson.shortcuts.length > 0" class="lesson-shortcuts">
                  <span v-for="tag in lesson.shortcuts" :key="tag" class="lesson-shortcut-tag">{{ tag }}</span>
                </div>
              </div>
            </div>
            <div class="lesson-actions">
              <RouterLink 
                :to="`/lessons/${lesson.id}/workspace`"
                class="action-btn action-btn-workspace"
                title="Arbeitsbereich öffnen"
                aria-label="Arbeitsbereich öffnen"
              >
                →
              </RouterLink>
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

          <div class="form-group">
            <label for="lesson-shortcuts" class="form-label">Kürzel / Tags</label>
            <input
              id="lesson-shortcuts"
              type="text"
              v-model="lessonForm.shortcuts"
              class="form-input"
              placeholder="z. B. Aufwärmen, Sprint, Teamspiel (kommagetrennt)"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Stundenteile</label>
            <div
              v-for="(part, idx) in lessonForm.lessonParts"
              :key="idx"
              class="lesson-part-row"
            >
              <input
                type="text"
                v-model="part.description"
                class="form-input lesson-part-description"
                placeholder="Beschreibung"
              />
              <input
                type="number"
                v-model="part.duration"
                class="form-input lesson-part-duration"
                placeholder="Min."
                min="1"
              />
              <button
                type="button"
                class="lesson-part-remove"
                @click="lessonForm.lessonParts.splice(idx, 1)"
                title="Teil entfernen"
              >×</button>
            </div>
            <button
              type="button"
              class="btn-secondary lesson-part-add"
              @click="lessonForm.lessonParts.push({ description: '', duration: '', type: '' })"
            >+ Stundenteil hinzufügen</button>
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
const SportBridge = getSportBridge()

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
  shortcuts: string
  lessonParts: { description: string; duration: string; type: string }[]
}

const lessonForm = ref<LessonForm>({
  classGroupId: '',
  date: new Date().toISOString().split('T')[0],
  time: '08:00',
  shortcuts: '',
  lessonParts: []
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
const enrichWithParts = async (lessonList: Lesson[]) => {
  for (const lesson of lessonList) {
    lesson.lessonParts = await SportBridge.lessonPartRepository.findByLesson(lesson.id)
  }
}

const loadData = async () => {
  loading.value = true
  error.value = ''

  try {
    // Load all classes
    classes.value = await SportBridge.classGroupRepository.findAll()

    // If classId is in route, load that class specifically
    const classIdFromRoute = route.query.classId as string
    if (classIdFromRoute) {
      selectedClassId.value = classIdFromRoute
      classGroup.value = await SportBridge.classGroupRepository.findById(classIdFromRoute)
      lessons.value = await SportBridge.lessonRepository.findByClassGroup(classIdFromRoute)
    } else {
      // Load all lessons for all classes
      const allLessons: Lesson[] = []
      for (const cls of classes.value) {
        const classLessons = await SportBridge.lessonRepository.findByClassGroup(cls.id)
        allLessons.push(...classLessons)
      }
      lessons.value = allLessons
    }

    // Populate lessonParts for each lesson so the list can display them
    await enrichWithParts(lessons.value)
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
      const classLessons = await SportBridge.lessonRepository.findByClassGroup(cls.id)
      allLessons.push(...classLessons)
    }
    lessons.value = allLessons
  } else {
    lessons.value = await SportBridge.lessonRepository.findByClassGroup(selectedClassId.value)
  }
  await enrichWithParts(lessons.value)
}

const onDateFilterChange = () => {
  // Filtering happens automatically via computed property
}

const handleEditLesson = async (lesson: Lesson) => {
  const parts = await SportBridge.lessonPartRepository.findByLesson(lesson.id)
  lessonForm.value = {
    id: lesson.id,
    classGroupId: lesson.classGroupId,
    date: lesson.date.toISOString().split('T')[0],
    time: lesson.date.toTimeString().split(' ')[0].substring(0, 5),
    shortcuts: (lesson.shortcuts ?? []).join(', '),
    lessonParts: parts.map(p => ({
      description: p.description,
      duration: p.duration != null ? String(p.duration) : '',
      type: p.type ?? ''
    }))
  }
  showEditLessonModal.value = true
}

const handleDeleteLesson = async (lessonId: string) => {
  if (!confirm('Möchten Sie diese Stunde wirklich löschen?')) {
    return
  }

  try {
    await SportBridge.lessonRepository.delete(lessonId)
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

    // Parse shortcuts from comma-separated string
    const shortcuts = lessonForm.value.shortcuts
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    if (showEditLessonModal.value && lessonForm.value.id) {
      // Update existing lesson
      await SportBridge.lessonRepository.update(lessonForm.value.id, {
        date: dateTime,
        shortcuts
      })
      // Replace lesson parts: delete old, create new
      await SportBridge.lessonPartRepository.deleteByLesson(lessonForm.value.id)
      for (let i = 0; i < lessonForm.value.lessonParts.length; i++) {
        const p = lessonForm.value.lessonParts[i]
        if (p.description.trim()) {
          await SportBridge.lessonPartRepository.createPart(
            lessonForm.value.id,
            {
              description: p.description.trim(),
              duration: p.duration ? Number(p.duration) : undefined,
              type: p.type.trim() || undefined
            },
            i
          )
        }
      }
    } else {
      // Create new lesson
      const created = await SportBridge.createLessonUseCase.execute({
        classGroupId: lessonForm.value.classGroupId,
        date: dateTime,
        shortcuts
      })
      // Create lesson parts
      for (let i = 0; i < lessonForm.value.lessonParts.length; i++) {
        const p = lessonForm.value.lessonParts[i]
        if (p.description.trim()) {
          await SportBridge.lessonPartRepository.createPart(
            created.id,
            {
              description: p.description.trim(),
              duration: p.duration ? Number(p.duration) : undefined,
              type: p.type.trim() || undefined
            },
            i
          )
        }
      }
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
    time: '08:00',
    shortcuts: '',
    lessonParts: []
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

<style scoped src="./LessonList.css"></style>
