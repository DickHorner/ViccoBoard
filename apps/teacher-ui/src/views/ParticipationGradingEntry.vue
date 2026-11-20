<template>
  <section class="participation-view sport-ui app-page">
    <header class="page-header">
      <Button severity="secondary" text icon="pi pi-arrow-left" label="Zurück"
        @click="router.push(directEntry ? '/subjects/sport' : '/grading')" />
      <div>
        <h1>Mitarbeitsbewertung</h1>
        <p>Sport Sek I · fünf Kriterien mit 0–3 Punkten und ein optionaler Zusatzpunkt.</p>
      </div>
    </header>

    <section v-if="directEntry" class="app-card selection">
      <div class="app-field">
        <label for="participation-class">Klasse</label>
        <Select
          inputId="participation-class"
          :modelValue="selectedClassId"
          :options="classOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Klasse auswählen"
          :disabled="loading || saving || unsaved.size > 0"
          fluid
          @update:modelValue="value => { selectedClassId = value; void selectClass() }"
        />
      </div>

      <div v-if="participationCategories.length > 1" class="app-field">
        <label for="participation-category">Mitarbeitsraster</label>
        <Select
          inputId="participation-category"
          :modelValue="categoryId"
          :options="categoryOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Raster auswählen"
          :disabled="loading || saving || unsaved.size > 0"
          fluid
          @update:modelValue="value => { categoryId = value; void load() }"
        />
      </div>

      <div v-if="selectedClassId && !loading && participationCategories.length === 0" class="create-category">
        <p>Für diese Klasse gibt es noch kein Mitarbeitsraster. Du kannst hier eines anlegen.</p>
        <div class="app-field">
          <label for="participation-weight">Gewichtung für die Gesamtnote (%)</label>
          <InputNumber
            inputId="participation-weight"
            v-model="newCategoryWeight"
            :min="0"
            :max="100"
            :useGrouping="false"
            :disabled="saving"
            fluid
          />
        </div>
        <Button
          label="Mitarbeitsraster anlegen"
          icon="pi pi-plus"
          :disabled="saving || newCategoryWeight === null || newCategoryWeight < 0 || newCategoryWeight > 100"
          :loading="saving"
          @click="createCategory"
        />
        <p class="app-data-note">Die Gewichtung lässt sich unter „Bewerten & Prüfen“ später ändern.</p>
      </div>

      <p v-if="unsaved.size > 0" class="app-data-note" role="status">
        Bitte ungespeicherte Änderungen zuerst sichern, bevor Du die Klasse oder das Raster wechselst.
      </p>
    </section>

    <p v-if="error" class="error-message" role="alert">{{ error }}</p>
    <p v-if="loading" role="status">Daten werden geladen …</p>

    <template v-else-if="category">
      <section class="app-card rubric">
        <div class="app-actions-row">
          <div>
            <h2 class="app-section-title">{{ category.name }}</h2>
            <p v-if="schoolYear" class="app-data-note">Schuljahr {{ schoolYear }}</p>
          </div>
          <Button
            :label="saving ? 'Speichert …' : 'Änderungen speichern'"
            icon="pi pi-save"
            :disabled="saving || unsaved.size === 0"
            :loading="saving"
            @click="saveAll"
          />
        </div>
        <p>Selbsteinschätzungen unterstützen das Gespräch; nur vollständig ausgefüllte Lehrkraftbewertungen ergeben eine Note.</p>
        <details>
          <summary>Kriterien und Notenschwellen</summary>
          <ul>
            <li v-for="criterion in criteria" :key="criterion.id">
              <strong>{{ criterion.label }}</strong>: {{ criterion.description }}
            </li>
          </ul>
          <p>Note 1 ab 14,5 · Note 2 ab 12 · Note 3 ab 9 · Note 4 ab 7 · Note 5 bei geringerer Punktzahl · Note 6 ausschließlich bei Leistungsverweigerung.</p>
        </details>
      </section>

      <p v-if="students.length === 0" class="app-data-note">Dieser Klasse sind keine Schüler zugeordnet.</p>

      <section v-for="student in students" :key="student.id" class="app-card student-card">
        <div class="student-heading">
          <h3>{{ student.firstName }} {{ student.lastName }}</h3>
          <span class="app-data-note">
            {{ assessment(student.id).refused ? 'Leistungsverweigerung' : `${total(student.id).toFixed(1)} Punkte` }} ·
            {{ complete(student.id) ? `Note ${grade(student.id)}` : 'Noch keine Note' }}
          </span>
        </div>

        <div class="assessment-grid">
          <strong>Kriterium</strong>
          <strong>Selbst</strong>
          <strong>Lehrkraft</strong>
          <template v-for="criterion in criteria" :key="criterion.id">
            <div class="criterion-details">
              <label :for="`${student.id}-${criterion.id}-teacher`">
                <strong>{{ criterion.label }}</strong>
                <small>{{ criterion.description }}</small>
              </label>
              <details class="criterion-levels">
                <summary>Bewertungsstufen 0–3</summary>
                <span v-for="(description, points) in criterion.levels" :key="points">
                  <strong>{{ points }} Punkte:</strong> {{ description }}
                </span>
              </details>
            </div>
            <select
              :aria-label="`Selbsteinschätzung: ${criterion.label}, ${student.firstName} ${student.lastName}`"
              :value="score(student.id, 'selfAssessment', criterion.id)"
              :disabled="saving || !!assessment(student.id).refused"
              @change="setScore(student.id, 'selfAssessment', criterion.id, $event)"
            >
              <option value="">–</option>
              <option v-for="n in 4" :key="n" :value="n - 1">{{ n - 1 }}</option>
            </select>
            <select
              :id="`${student.id}-${criterion.id}-teacher`"
              :value="score(student.id, 'teacherAssessment', criterion.id)"
              :disabled="saving || !!assessment(student.id).refused"
              @change="setScore(student.id, 'teacherAssessment', criterion.id, $event)"
            >
              <option value="">–</option>
              <option v-for="n in 4" :key="n" :value="n - 1">{{ n - 1 }}</option>
            </select>
          </template>
        </div>

        <label class="bonus">
          <input type="checkbox" :checked="assessment(student.id).bonusPoint" :disabled="saving || !!assessment(student.id).refused"
            @change="setBonus(student.id, $event)" />
          Zusatzpunkt für besonderes Engagement
        </label>

        <label class="bonus">
          <input type="checkbox" :checked="!!assessment(student.id).refused" :disabled="saving"
            @change="setRefused(student.id, $event)" />
          Leistungsverweigerung (Note 6, unabhängig von der Punktzahl)
        </label>

        <div class="app-field">
          <label :for="`participation-note-${student.id}`">Verbalbeurteilung</label>
          <textarea
            :id="`participation-note-${student.id}`"
            :value="notes.get(student.id) ?? ''"
            :disabled="saving"
            rows="2"
            @input="setNote(student.id, $event)"
            @blur="save(student.id)"
          ></textarea>
        </div>
      </section>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import Button from 'openvue/button'
import InputNumber from 'openvue/inputnumber'
import Select from 'openvue/select'
import { Sport, type ClassGroup, type Student } from '@viccoboard/core'
import { getSportBridge, initializeSportBridge } from '../composables/useSportBridge'
import { getStudentsBridge, initializeStudentsBridge } from '../composables/useStudentsBridge'
import {
  PARTICIPATION_CRITERIA,
  createParticipationCategoryConfiguration,
  emptyParticipationAssessment,
  hasCompleteTeacherAssessment,
  isParticipationAssessment,
  participationGrade,
  participationTotal,
  type ParticipationAssessment,
  type ParticipationCriterionId
} from '../utils/participation-rubric'
import { isPerformanceEntryInSchoolYear } from '../utils/performance-school-year'

initializeSportBridge()
initializeStudentsBridge()

const sport = getSportBridge()
const studentBridge = getStudentsBridge()
const route = useRoute()
const router = useRouter()
const directEntry = !route.params.id
const categoryId = ref(typeof route.params.id === 'string' ? route.params.id : '')
const selectedClassId = ref('')
const classes = ref<ClassGroup[]>([])
const participationCategories = ref<Sport.GradeCategory[]>([])
const classOptions = computed(() => classes.value.map(group => ({
  label: `${group.name} · ${group.schoolYear}`,
  value: group.id
})))
const categoryOptions = computed(() => participationCategories.value.map(item => ({
  label: item.name,
  value: item.id
})))

const newCategoryWeight = ref<number | null>(0)
const schoolYear = ref('')
const category = ref<Sport.GradeCategory | null>(null)
const students = ref<Student[]>([])
const assessments = ref(new Map<string, ParticipationAssessment>())
const notes = ref(new Map<string, string>())
const entryIds = ref(new Map<string, string>())
const unsaved = ref(new Set<string>())
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const criteria = PARTICIPATION_CRITERIA

onBeforeRouteLeave(() =>
  unsaved.value.size === 0 || window.confirm('Ungespeicherte Mitarbeitsbewertungen verwerfen?')
)

onMounted(async () => {
  if (!directEntry) {
    await load()
    return
  }

  try {
    classes.value = (await sport.classGroupRepository.findAll()).filter(group => !group.archived)
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Klassen konnten nicht geladen werden.'
  } finally {
    loading.value = false
  }
})

function isParticipationCategory(candidate: Sport.GradeCategory): boolean {
  const config = candidate.configuration
  if (candidate.type !== Sport.GradeCategoryType.Verbal || config.type !== 'verbal') {
    return false
  }
  return criteria.every(criterion => config.fields.some(field => field.id === criterion.id))
}

async function selectClass(): Promise<void> {
  categoryId.value = ''
  category.value = null
  participationCategories.value = []
  students.value = []
  unsaved.value = new Set()
  if (!selectedClassId.value) return

  loading.value = true
  error.value = null
  try {
    const found = await sport.gradeCategoryRepository.findByClassGroup(selectedClassId.value)
    participationCategories.value = found.filter(isParticipationCategory)
    if (participationCategories.value.length === 1) {
      categoryId.value = participationCategories.value[0].id
      await load()
    }
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Mitarbeitsraster konnten nicht geladen werden.'
  } finally {
    loading.value = false
  }
}

async function createCategory(): Promise<void> {
  if (!selectedClassId.value || newCategoryWeight.value === null ||
      !Number.isFinite(newCategoryWeight.value) ||
      newCategoryWeight.value < 0 || newCategoryWeight.value > 100) return

  saving.value = true
  error.value = null
  try {
    const existing = await sport.gradeCategoryRepository.findByClassGroup(selectedClassId.value)
    if (existing.some(isParticipationCategory)) {
      throw new Error('Für diese Klasse gibt es bereits ein Mitarbeitsraster. Bitte wähle es aus.')
    }

    const created = await sport.createGradeCategoryUseCase.execute({
      classGroupId: selectedClassId.value,
      name: 'Mitarbeitsbewertung',
      type: Sport.GradeCategoryType.Verbal,
      weight: newCategoryWeight.value,
      configuration: createParticipationCategoryConfiguration()
    })

    participationCategories.value = [created]
    categoryId.value = created.id
    await load()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Mitarbeitsraster konnte nicht angelegt werden.'
  } finally {
    saving.value = false
  }
}

function assessment(id: string): ParticipationAssessment {
  return assessments.value.get(id) ?? emptyParticipationAssessment()
}

function score(
  id: string,
  type: 'selfAssessment' | 'teacherAssessment',
  criterion: ParticipationCriterionId
): number | '' {
  return assessment(id)[type][criterion] ?? ''
}

function total(id: string): number {
  return participationTotal(assessment(id))
}

function complete(id: string): boolean {
  return !!assessment(id).refused || hasCompleteTeacherAssessment(assessment(id))
}

function grade(id: string): number {
  return participationGrade(total(id), assessment(id).refused)
}

function setScore(
  id: string,
  type: 'selfAssessment' | 'teacherAssessment',
  criterion: ParticipationCriterionId,
  event: Event
): void {
  const previous = assessment(id)
  const next = {
    ...previous,
    selfAssessment: { ...previous.selfAssessment },
    teacherAssessment: { ...previous.teacherAssessment }
  }
  const value = (event.target as HTMLSelectElement).value
  if (value === '') delete next[type][criterion]
  else next[type][criterion] = Number(value)
  assessments.value = new Map(assessments.value).set(id, next)
  unsaved.value = new Set(unsaved.value).add(id)
}

function setRefused(id: string, event: Event): void {
  const next = { ...assessment(id), refused: (event.target as HTMLInputElement).checked }
  assessments.value = new Map(assessments.value).set(id, next)
  unsaved.value = new Set(unsaved.value).add(id)
}

function setBonus(id: string, event: Event): void {
  const next = { ...assessment(id), bonusPoint: (event.target as HTMLInputElement).checked }
  assessments.value = new Map(assessments.value).set(id, next)
  unsaved.value = new Set(unsaved.value).add(id)
}

function setNote(id: string, event: Event): void {
  notes.value = new Map(notes.value).set(id, (event.target as HTMLTextAreaElement).value)
  unsaved.value = new Set(unsaved.value).add(id)
}

async function load(): Promise<void> {
  if (!categoryId.value) return
  loading.value = true
  error.value = null
  category.value = null
  students.value = []
  assessments.value = new Map()
  notes.value = new Map()
  entryIds.value = new Map()
  unsaved.value = new Set()

  try {
    const found = await sport.gradeCategoryRepository.findById(categoryId.value)
    if (!found || found.type !== Sport.GradeCategoryType.Verbal) {
      throw new Error('Mitarbeitskategorie nicht gefunden.')
    }
    const group = await sport.classGroupRepository.findById(found.classGroupId)
    if (!group) throw new Error('Klasse nicht gefunden.')

    schoolYear.value = group.schoolYear
    selectedClassId.value = group.id
    const loadedStudents = await studentBridge.studentRepository.findByClassGroup(group.id)
    const allEntries = await Promise.all(loadedStudents.map(student =>
      sport.performanceEntryRepository.findByStudentAndCategory(student.id, found.id)
    ))

    const restoredAssessments = new Map<string, ParticipationAssessment>()
    const restoredNotes = new Map<string, string>()
    const restoredIds = new Map<string, string>()
    loadedStudents.forEach((student, index) => {
      const latest = allEntries[index].find(entry => isPerformanceEntryInSchoolYear(entry, group.schoolYear))
      if (!latest) return
      restoredIds.set(student.id, latest.id)
      const values = latest.measurements as Record<string, unknown>
      if (isParticipationAssessment(values.participation)) {
        restoredAssessments.set(student.id, values.participation)
      }
      if (typeof values.text === 'string') restoredNotes.set(student.id, values.text)
    })

    assessments.value = restoredAssessments
    notes.value = restoredNotes
    entryIds.value = restoredIds
    students.value = loadedStudents
    category.value = found
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Fehler beim Laden der Mitarbeitsbewertung.'
  } finally {
    loading.value = false
  }
}

async function save(id: string): Promise<boolean> {
  if (!unsaved.value.has(id) || !category.value || !schoolYear.value || saving.value) return false
  saving.value = true
  error.value = null

  try {
    const value = assessment(id)
    const update = {
      measurements: { participation: value, text: notes.value.get(id) ?? '' },
      calculatedGrade: complete(id) ? grade(id) : undefined,
      metadata: {
        rubric: value.rubric,
        totalPoints: total(id),
        selfAssessment: value.selfAssessment,
        schoolYear: schoolYear.value
      }
    }

    const entryId = entryIds.value.get(id)
    if (entryId) {
      await sport.performanceEntryRepository.update(entryId, update)
    } else {
      const entry = await sport.recordGradeUseCase.execute({
        studentId: id,
        categoryId: category.value.id,
        ...update
      })
      entryIds.value = new Map(entryIds.value).set(id, entry.id)
    }

    const remaining = new Set(unsaved.value)
    remaining.delete(id)
    unsaved.value = remaining
    return true
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Mitarbeitsbewertung konnte nicht gespeichert werden.'
    return false
  } finally {
    saving.value = false
  }
}

async function saveAll(): Promise<void> {
  for (const id of [...unsaved.value]) {
    const saved = await save(id)
    if (!saved) break
  }
}
</script>

<style scoped>
.participation-view { max-width: 1040px; margin: 0 auto; display: grid; gap: 1rem; padding: 1rem; }
.page-header { display: flex; align-items: flex-start; flex-wrap: wrap; gap: 1rem; }
.page-header h1, .student-heading h3 { margin: 0; }
.page-header p { margin: .25rem 0; color: var(--color-muted); }
.selection { display: grid; gap: 1rem; padding: 1rem; }
.create-category { display: grid; gap: .65rem; max-width: 360px; }
.create-category p { margin: 0; }
.app-field { display: grid; gap: .4rem; }
.app-field label { font-weight: 600; }
.rubric { padding: 1rem; display: grid; gap: .75rem; }
.rubric p { margin: 0; }
.rubric details { color: var(--color-muted); }
.rubric summary { cursor: pointer; min-height: 44px; display: flex; align-items: center; }
.student-card { padding: 1rem; display: grid; gap: 1rem; }
.student-heading { display: flex; align-items: baseline; justify-content: space-between; gap: .5rem; flex-wrap: wrap; }
.assessment-grid { display: grid; grid-template-columns: minmax(170px, 1fr) 95px 105px; gap: .5rem; align-items: center; }
.criterion-details, .criterion-details label { display: grid; gap: .15rem; }
.assessment-grid small { color: var(--color-muted); }
.criterion-levels summary { cursor: pointer; min-height: 36px; }
.criterion-levels span { display: block; margin: .4rem 0; line-height: 1.4; }
.criterion-levels span strong { font-size: inherit; }
.assessment-grid select, textarea { min-height: 44px; width: 100%; border: 1px solid var(--surface-border); border-radius: 6px; padding: .35rem; background: var(--p-content-background, var(--surface-soft)); color: inherit; box-sizing: border-box; font: inherit; }
.bonus { display: flex; align-items: center; gap: .5rem; min-height: 44px; }
.bonus input { width: 18px; height: 18px; }
.error-message { color: var(--p-red-700, #991b1b); }
@media (max-width: 600px) {
  .assessment-grid { grid-template-columns: minmax(110px, 1fr) 75px 85px; font-size: .875rem; }
}
</style>