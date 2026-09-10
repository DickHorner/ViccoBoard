<template>
  <section class="planning-overview">
    <header class="page-header">
      <div>
        <h1>Sequenzplanung</h1>
        <p class="subtitle">Themenblöcke pro Klasse und Schuljahr im Wochenraster.</p>
      </div>
      <RouterLink class="ghost-link" to="/schedule">
        Stundenplan öffnen
      </RouterLink>
    </header>

    <div v-if="loading" class="state-card">Planungsdaten werden geladen...</div>
    <div v-else-if="loadError" class="state-card error">{{ loadError }}</div>
    <div v-else class="planning-layout">
      <aside class="panel planning-sidebar">
        <div class="form-group">
          <label for="class-select">Klasse / Kurs</label>
          <select id="class-select" v-model="selectedClassId" @change="handleClassChange">
            <option value="">Klasse wählen...</option>
            <option v-for="classGroup in activeClasses" :key="classGroup.id" :value="classGroup.id">
              {{ classGroup.name }} · {{ classGroup.schoolYear }}
            </option>
          </select>
        </div>

        <div v-if="selectedClass" class="class-summary">
          <strong>{{ selectedClass.name }}</strong>
          <span>{{ selectedClass.schoolYear }}</span>
          <span v-if="selectedClass.state">{{ selectedClass.state }}</span>
        </div>

        <form v-if="selectedClass" class="block-form" @submit.prevent="handleSaveBlock">
          <h2>{{ editingBlockId ? 'Themenblock bearbeiten' : 'Themenblock anlegen' }}</h2>

          <div class="form-group">
            <label for="block-title">Titel</label>
            <input id="block-title" v-model="blockForm.title" type="text" required />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="block-start">Start</label>
              <input id="block-start" v-model="blockForm.startDate" type="date" required />
            </div>
            <div class="form-group">
              <label for="block-end">Ende</label>
              <input id="block-end" v-model="blockForm.endDate" type="date" required />
            </div>
          </div>

          <div class="form-group">
            <label for="block-color">Farbe</label>
            <select id="block-color" v-model="blockForm.color">
              <option value="blue">Blau</option>
              <option value="green">Grün</option>
              <option value="orange">Orange</option>
              <option value="red">Rot</option>
              <option value="grey">Grau</option>
            </select>
          </div>

          <div class="form-group">
            <label for="block-notes">Notiz</label>
            <textarea id="block-notes" v-model="blockForm.notes" rows="4"></textarea>
          </div>

          <p v-if="saveError" class="error-text">{{ saveError }}</p>

          <div class="form-actions">
            <button class="primary-link" type="submit" :disabled="saving">
              {{ saving ? 'Speichert...' : 'Speichern' }}
            </button>
            <button v-if="editingBlockId" class="ghost-link" type="button" @click="resetBlockForm">
              Abbrechen
            </button>
          </div>
        </form>

        <p v-else class="empty-text">Wähle eine Klasse, um das Schuljahresraster zu öffnen.</p>
      </aside>

      <section class="panel planning-board">
        <div class="panel-header">
          <div>
            <h2>Schuljahresraster</h2>
            <p class="panel-subtitle">
              {{ selectedClass ? selectedClass.schoolYear : 'Keine Klasse gewählt' }}
            </p>
          </div>
          <span>{{ selectedBlocks.length }} Themenblöcke</span>
        </div>

        <div v-if="!selectedClass" class="empty-state">Keine Klasse gewählt.</div>
        <div v-else-if="weeks.length === 0" class="empty-state">Ungültiges Schuljahr.</div>
        <div v-else class="week-grid">
          <section v-for="week in weeks" :key="week.key" class="week-card">
            <header class="week-header">
              <strong>{{ week.label }}</strong>
              <span>{{ week.startDate }}</span>
            </header>

            <div v-if="week.markers.length > 0" class="calendar-markers">
              <span
                v-for="marker in week.markers"
                :key="week.key + marker.type + marker.label"
                class="calendar-marker"
                :class="`is-${marker.type}`"
              >
                {{ marker.label }}
              </span>
            </div>

            <div v-if="week.blocks.length > 0" class="block-list">
              <article
                v-for="block in week.blocks"
                :key="block.id"
                class="planning-block"
                :class="`is-${block.color || 'blue'}`"
              >
                <strong>{{ block.title }}</strong>
                <span>{{ getBlockRangeLabel(block) }}</span>
                <p v-if="block.notes">{{ block.notes }}</p>
                <div class="block-actions">
                  <button type="button" @click="editBlock(block)">Bearbeiten</button>
                  <button type="button" @click="deleteBlock(block)">Löschen</button>
                </div>
              </article>
            </div>

            <div v-if="week.lessons.length > 0" class="lesson-list">
              <span v-for="lesson in week.lessons" :key="lesson.id">
                {{ getLessonLabel(lesson) }}
              </span>
            </div>
          </section>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { ClassGroup, Lesson, PlanningBlock } from '@viccoboard/core'
import { useClassGroups, useLessons } from '../composables/useSportBridge'
import { usePlanningBlocks } from '../composables/usePlanningBridge'
import { buildPlanningWeeks } from '../utils/planning-week-projection'

interface BlockForm {
  title: string
  startDate: string
  endDate: string
  color: string
  notes: string
}

const classGroups = useClassGroups()
const lessonsRepository = useLessons()
const planningBlocks = usePlanningBlocks()

const loading = ref(true)
const saving = ref(false)
const loadError = ref('')
const saveError = ref('')
const classes = ref<ClassGroup[]>([])
const lessons = ref<Lesson[]>([])
const blocks = ref<PlanningBlock[]>([])
const selectedClassId = ref('')
const editingBlockId = ref<string | null>(null)

const blockForm = ref<BlockForm>({
  title: '',
  startDate: '',
  endDate: '',
  color: 'blue',
  notes: ''
})

const activeClasses = computed(() =>
  classes.value.filter((classGroup) => !classGroup.archived)
)

const selectedClass = computed(() =>
  classes.value.find((classGroup) => classGroup.id === selectedClassId.value) ?? null
)

const selectedBlocks = computed(() =>
  selectedClass.value ? blocks.value.filter((block) => block.classGroupId === selectedClass.value!.id) : []
)

const selectedLessons = computed(() =>
  selectedClass.value ? lessons.value.filter((lesson) => lesson.classGroupId === selectedClass.value!.id) : []
)

const weeks = computed(() => {
  if (!selectedClass.value) {
    return []
  }

  return buildPlanningWeeks({
    classGroup: selectedClass.value,
    blocks: selectedBlocks.value,
    lessons: selectedLessons.value
  })
})

const loadData = async () => {
  loading.value = true
  loadError.value = ''

  try {
    classes.value = await classGroups.findAll()
    selectedClassId.value = activeClasses.value[0]?.id ?? ''
    await loadSelectedClassPlanning()
  } catch (error) {
    console.error('Failed to load planning overview:', error)
    loadError.value = 'Die Sequenzplanung konnte nicht geladen werden.'
  } finally {
    loading.value = false
  }
}

const loadSelectedClassPlanning = async () => {
  if (!selectedClassId.value) {
    blocks.value = []
    lessons.value = []
    resetBlockForm()
    return
  }

  const [loadedBlocks, loadedLessons] = await Promise.all([
    planningBlocks.findByClassGroup(selectedClassId.value),
    lessonsRepository.findByClassGroup(selectedClassId.value)
  ])

  blocks.value = loadedBlocks
  lessons.value = loadedLessons
  resetBlockForm()
}

const handleClassChange = async () => {
  saveError.value = ''
  await loadSelectedClassPlanning()
}

const handleSaveBlock = async () => {
  if (!selectedClass.value) {
    return
  }

  saveError.value = ''
  saving.value = true

  try {
    const payload = {
      classGroupId: selectedClass.value.id,
      title: blockForm.value.title.trim(),
      startDate: blockForm.value.startDate,
      endDate: blockForm.value.endDate,
      color: blockForm.value.color || undefined,
      notes: blockForm.value.notes.trim() || undefined
    }

    if (editingBlockId.value) {
      await planningBlocks.update(editingBlockId.value, payload)
    } else {
      await planningBlocks.create(payload)
    }

    await loadSelectedClassPlanning()
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : 'Themenblock konnte nicht gespeichert werden.'
  } finally {
    saving.value = false
  }
}

const editBlock = (block: PlanningBlock) => {
  editingBlockId.value = block.id
  blockForm.value = {
    title: block.title,
    startDate: block.startDate,
    endDate: block.endDate,
    color: block.color || 'blue',
    notes: block.notes || ''
  }
}

const deleteBlock = async (block: PlanningBlock) => {
  await planningBlocks.delete(block.id)
  await loadSelectedClassPlanning()
}

const resetBlockForm = () => {
  editingBlockId.value = null
  const fallbackDate = selectedClass.value ? getSchoolYearStartDate(selectedClass.value.schoolYear) : ''
  blockForm.value = {
    title: '',
    startDate: fallbackDate,
    endDate: fallbackDate,
    color: 'blue',
    notes: ''
  }
}

const getSchoolYearStartDate = (schoolYear: string): string => {
  const match = /^(\d{4})\/\d{4}$/.exec(schoolYear)
  return match ? match[1] + '-08-01' : ''
}

const getBlockRangeLabel = (block: PlanningBlock): string =>
  block.startDate + ' bis ' + block.endDate

const getLessonLabel = (lesson: Lesson): string => {
  const date = lesson.date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
  return date + ' · ' + lesson.startTime + ' · ' + (lesson.title || 'Stunde')
}

onMounted(() => {
  void loadData()
})
</script>

<style scoped>
.planning-overview,
.planning-layout,
.block-form,
.week-grid,
.block-list,
.lesson-list,
.calendar-markers {
  display: flex;
  flex-direction: column;
}

.planning-overview,
.planning-layout,
.block-form,
.week-grid {
  gap: 1.5rem;
}

.page-header,
.panel-header,
.form-row,
.form-actions,
.block-actions,
.week-header {
  display: flex;
  gap: 1rem;
}

.page-header,
.panel-header,
.week-header {
  align-items: center;
  justify-content: space-between;
}

.page-header,
.panel-header,
.form-row,
.form-actions {
  flex-wrap: wrap;
}

.subtitle,
.panel-subtitle,
.empty-text,
.week-header span,
.planning-block span,
.lesson-list span,
.class-summary span {
  color: #64748b;
}

.panel-subtitle,
.planning-block p,
.empty-text {
  margin: 0.25rem 0 0;
}

.primary-link,
.ghost-link,
.block-actions button {
  min-height: 44px;
  border-radius: 16px;
  text-decoration: none;
}

.primary-link,
.ghost-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1rem;
  font-weight: 600;
}

.primary-link {
  border: 0;
  background: #0f172a;
  color: white;
}

.ghost-link {
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: white;
  color: #0f172a;
}

.state-card,
.panel,
.week-card {
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  padding: 1.25rem;
}

.state-card.error,
.error-text {
  color: #991b1b;
}

.planning-layout {
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
}

.planning-sidebar {
  align-self: start;
}

.form-group {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  border: 1px solid rgba(15, 23, 42, 0.16);
  border-radius: 12px;
  font: inherit;
  padding: 0.7rem 0.8rem;
}

.class-summary {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin: 1rem 0;
}

.week-grid {
  max-height: 72vh;
  overflow: auto;
  padding-right: 0.25rem;
}

.week-card {
  display: grid;
  gap: 0.75rem;
}

.calendar-markers,
.block-list,
.lesson-list {
  gap: 0.4rem;
}

.calendar-marker {
  align-self: flex-start;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
}

.calendar-marker.is-holiday {
  background: rgba(220, 38, 38, 0.1);
  color: #991b1b;
}

.calendar-marker.is-school-break {
  background: rgba(14, 165, 233, 0.12);
  color: #075985;
}

.planning-block {
  border-left: 6px solid #2563eb;
  border-radius: 14px;
  background: rgba(37, 99, 235, 0.08);
  padding: 0.75rem;
}

.planning-block.is-green {
  border-left-color: #16a34a;
  background: rgba(22, 163, 74, 0.08);
}

.planning-block.is-orange {
  border-left-color: #f97316;
  background: rgba(249, 115, 22, 0.08);
}

.planning-block.is-red {
  border-left-color: #dc2626;
  background: rgba(220, 38, 38, 0.08);
}

.planning-block.is-grey {
  border-left-color: #64748b;
  background: rgba(100, 116, 139, 0.08);
}

.block-actions button {
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: white;
  color: #0f172a;
  padding: 0.45rem 0.75rem;
}

.lesson-list span {
  font-size: 0.85rem;
}

.empty-state {
  color: #64748b;
  padding: 2rem 0;
}

@media (max-width: 900px) {
  .planning-layout {
    grid-template-columns: 1fr;
  }

  .week-grid {
    max-height: none;
  }
}
</style>
