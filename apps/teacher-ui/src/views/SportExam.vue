<template>
  <section class="sport-exam-view">
    <header class="page-header">
      <button class="back-button" @click="router.back()">← Zurück</button>
      <div>
        <h1>Sportprüfung</h1>
        <p>Prüfung anlegen, Anwesenheit abgleichen und Messwerte direkt in Noten umrechnen.</p>
      </div>
    </header>

    <section class="card setup-card">
      <div class="setup-grid">
        <label>
          <span>Datum</span>
          <input v-model="examDate" type="date" class="form-input" @change="loadRoster" />
        </label>

        <label>
          <span>Klasse</span>
          <select v-model="selectedClassId" class="form-input" @change="loadClassContext">
            <option value="">Klasse auswählen...</option>
            <option v-for="classGroup in classes" :key="classGroup.id" :value="classGroup.id">
              {{ classGroup.name }}{{ classGroup.gradeLevel ? ` · Jg. ${classGroup.gradeLevel}` : '' }}
            </option>
          </select>
        </label>

        <label>
          <span>Disziplin</span>
          <select v-model="selectedCategoryId" class="form-input" @change="loadCategory">
            <option value="">Disziplin auswählen...</option>
            <option v-for="candidate in categories" :key="candidate.id" :value="candidate.id">
              {{ categoryLabel(candidate) }}
            </option>
          </select>
        </label>

        <label class="announced-toggle">
          <input v-model="announced" type="checkbox" />
          <span>Prüfung war angekündigt</span>
        </label>
      </div>

      <div v-if="selectedCategory" class="exam-meta">
        <strong>{{ categoryLabel(selectedCategory) }}</strong>
        <span v-if="selectedConfig?.measurementLabel">{{ selectedConfig.measurementLabel }}</span>
        <span v-if="selectedConfig?.unit">· {{ selectedConfig.unit }}</span>
        <span v-if="selectedConfig?.normalization === 'body-height-percent'">· relativ zur Körpergröße</span>
      </div>

      <p v-if="contextWarning" class="warning">{{ contextWarning }}</p>
    </section>

    <section v-if="students.length > 0 && selectedCategory" class="card">
      <div class="card-header">
        <div>
          <h2>Leistungserfassung</h2>
          <p>{{ students.length }} Schüler · Abwesenheiten für {{ formatDate(examDate) }} abgeglichen</p>
        </div>
        <button class="btn-primary" :disabled="saving || !canSave" @click="saveExam">
          {{ saving ? 'Speichern...' : 'Prüfung speichern' }}
        </button>
      </div>

      <div class="table-wrapper">
        <table class="exam-table">
          <thead>
            <tr>
              <th>Schüler</th>
              <th>Status</th>
              <th v-if="isRelative">Körpergröße</th>
              <th>{{ selectedConfig?.measurementLabel || 'Messwert' }}</th>
              <th v-if="isRelative">Relativwert</th>
              <th>Note</th>
              <th>Hinweis</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="student in students"
              :key="student.id"
              :class="rowClass(student.id)"
            >
              <td class="student-name">{{ student.firstName }} {{ student.lastName }}</td>
              <td>
                <select
                  :value="states.get(student.id) || 'ready'"
                  class="status-select"
                  @change="setState(student.id, ($event.target as HTMLSelectElement).value as SportExamStudentState)"
                >
                  <option value="ready">Teilnahme</option>
                  <option value="absent">Abwesend</option>
                  <option value="passive">Passiv / verletzt</option>
                  <option value="missing-kit">Sportsachen vergessen</option>
                </select>
              </td>
              <td v-if="isRelative">
                <input
                  class="value-input"
                  type="number"
                  inputmode="decimal"
                  min="1"
                  max="260"
                  :value="bodyHeights.get(student.id) || ''"
                  :disabled="states.get(student.id) !== 'ready'"
                  @input="setBodyHeight(student, ($event.target as HTMLInputElement).value)"
                  @blur="saveBodyHeight(student)"
                />
                cm
              </td>
              <td>
                <input
                  class="value-input"
                  type="text"
                  inputmode="decimal"
                  :placeholder="selectedConfig?.measurementType === 'time' ? '12,84' : '0'"
                  :value="values.get(student.id) || ''"
                  :disabled="states.get(student.id) !== 'ready'"
                  @input="setValue(student, ($event.target as HTMLInputElement).value)"
                />
                <span v-if="selectedConfig?.unit" class="unit">{{ selectedConfig.unit }}</span>
              </td>
              <td v-if="isRelative">{{ normalizedDisplay(student) }}</td>
              <td class="grade-cell">
                <strong v-if="states.get(student.id) === 'missing-kit'">6</strong>
                <strong v-else-if="grades.has(student.id)">{{ formatGrade(grades.get(student.id)) }}</strong>
                <span v-else>—</span>
              </td>
              <td class="note-cell">
                <span v-if="announced && states.get(student.id) === 'absent'" class="attest-badge">
                  Attest erforderlich
                </span>
                <span v-else-if="attendanceLabels.get(student.id)">
                  {{ attendanceLabels.get(student.id) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-else-if="selectedClassId && selectedCategoryId" class="card empty-state">
      Keine Schüler gefunden.
    </section>

    <section v-if="savedSessionId" class="success-card">
      Prüfung gespeichert · Session {{ savedSessionId }}
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  AttendanceStatus,
  calculateAgeFromDateOfBirth,
  type ClassGroup,
  type Sport,
  type SportStudentProfile,
  type Student
} from '@viccoboard/core'
import type { SportExamStudentState } from '@viccoboard/sport'

import { getSportBridge, initializeSportBridge } from '../composables/useSportBridge'
import { getStudentsBridge, initializeStudentsBridge } from '../composables/useStudentsBridge'
import { useToast } from '../composables/useToast'

const router = useRouter()
const toast = useToast()

initializeSportBridge()
initializeStudentsBridge()

const sportBridge = getSportBridge()
const studentsBridge = getStudentsBridge()

const classes = ref<ClassGroup[]>([])
const categories = ref<Sport.GradeCategory[]>([])
const students = ref<Student[]>([])
const selectedClassId = ref('')
const selectedCategoryId = ref('')
const selectedCategory = ref<Sport.GradeCategory | null>(null)
const selectedTable = ref<Sport.TableDefinition | null>(null)
const examDate = ref(localDateString(new Date()))
const announced = ref(false)
const states = ref<Map<string, SportExamStudentState>>(new Map())
const attendanceSources = ref<Map<string, 'lesson' | 'calendar'>>(new Map())
const attendanceLabels = ref<Map<string, string>>(new Map())
const values = ref<Map<string, string>>(new Map())
const grades = ref<Map<string, string | number>>(new Map())
const bodyHeights = ref<Map<string, number>>(new Map())
const sportProfiles = ref<Map<string, SportStudentProfile>>(new Map())
const contextWarning = ref('')
const saving = ref(false)
const savedSessionId = ref('')

const selectedConfig = computed(() =>
  selectedCategory.value?.configuration.type === 'performance'
    ? selectedCategory.value.configuration
    : null
)

const isRelative = computed(() =>
  selectedConfig.value?.normalization === 'body-height-percent'
)

const canSave = computed(() => {
  if (!selectedCategory.value || !selectedTable.value) return false
  return students.value.some((student) => {
    const state = states.value.get(student.id)
    if (state === 'missing-kit') return true
    return state === 'ready' && grades.value.has(student.id)
  })
})

onMounted(async () => {
  classes.value = (await sportBridge.classGroupRepository.findAll())
    .filter((classGroup) => !classGroup.archived)
})

async function loadClassContext(): Promise<void> {
  selectedCategoryId.value = ''
  selectedCategory.value = null
  selectedTable.value = null
  categories.value = []
  students.value = []
  savedSessionId.value = ''

  if (!selectedClassId.value) return

  categories.value = (await sportBridge.gradeCategoryRepository.findByClassGroup(selectedClassId.value))
    .filter((category) => category.type === 'performance')

  await loadRoster()
}

async function loadCategory(): Promise<void> {
  selectedCategory.value = selectedCategoryId.value
    ? await sportBridge.gradeCategoryRepository.findById(selectedCategoryId.value)
    : null

  selectedTable.value = null
  contextWarning.value = ''

  const config = selectedConfig.value
  if (!config) return

  if (!config.gradingTable) {
    contextWarning.value = 'Für diese Disziplin ist noch keine Bewertungstabelle hinterlegt.'
    return
  }

  selectedTable.value = await sportBridge.tableDefinitionRepository.findById(config.gradingTable)
  if (!selectedTable.value) {
    contextWarning.value = 'Die hinterlegte Bewertungstabelle wurde nicht gefunden.'
    return
  }

  recalculateAll()
}

async function loadRoster(): Promise<void> {
  states.value = new Map()
  attendanceSources.value = new Map()
  attendanceLabels.value = new Map()
  values.value = new Map()
  grades.value = new Map()
  bodyHeights.value = new Map()
  sportProfiles.value = new Map()
  savedSessionId.value = ''

  if (!selectedClassId.value || !examDate.value) {
    students.value = []
    return
  }

  const roster = await studentsBridge.studentRepository.findByClassGroup(selectedClassId.value)
  students.value = roster

  const profiles = await Promise.all(
    roster.map((student) => studentsBridge.sportStudentProfileRepository.findByStudentId(student.id))
  )
  roster.forEach((student, index) => {
    const profile = profiles[index]
    if (!profile) return
    sportProfiles.value.set(student.id, profile)
    if (profile.bodyHeightCm !== undefined) {
      bodyHeights.value.set(student.id, profile.bodyHeightCm)
    }
  })

  for (const student of roster) {
    states.value.set(student.id, 'ready')
  }

  const calendarEntries = await Promise.all(
    roster.map((student) => studentsBridge.studentCalendarEntryRepository.findByStudent(student.id))
  )
  roster.forEach((student, index) => {
    const absence = calendarEntries[index].find(
      (entry) =>
        entry.type === 'absence' &&
        entry.startDate <= examDate.value &&
        entry.endDate >= examDate.value
    )
    if (!absence) return
    states.value.set(student.id, 'absent')
    attendanceSources.value.set(student.id, 'calendar')
    attendanceLabels.value.set(
      student.id,
      absence.source === 'iserv' ? 'Abwesend laut IServ' : 'Abwesenheit eingetragen'
    )
  })

  const sportSubjectIds = new Set(
    (await sportBridge.subjectRepository.findAll())
      .filter((subject) => subject.workspaceProfile === 'sport')
      .map((subject) => subject.id)
  )

  const lessons = (await sportBridge.lessonRepository.findByClassGroup(selectedClassId.value))
    .filter((lesson) =>
      sportSubjectIds.has(lesson.subjectId) &&
      localDateString(lesson.date) === examDate.value
    )

  for (const lesson of lessons) {
    const records = await sportBridge.attendanceRepository.findByLesson(lesson.id)
    for (const record of records) {
      if (attendanceSources.value.get(record.studentId) === 'calendar') continue

      if (record.status === AttendanceStatus.Absent || record.status === AttendanceStatus.Excused) {
        states.value.set(record.studentId, 'absent')
        attendanceSources.value.set(record.studentId, 'lesson')
        attendanceLabels.value.set(
          record.studentId,
          record.status === AttendanceStatus.Excused ? 'Entschuldigt abwesend' : 'Abwesend'
        )
      } else if (record.status === AttendanceStatus.Passive) {
        states.value.set(record.studentId, 'passive')
        attendanceSources.value.set(record.studentId, 'lesson')
        attendanceLabels.value.set(record.studentId, 'Passiv')
      } else if (record.status === AttendanceStatus.Late) {
        attendanceSources.value.set(record.studentId, 'lesson')
        attendanceLabels.value.set(record.studentId, 'Verspätet')
      }
    }
  }

  recalculateAll()
}

function categoryLabel(category: Sport.GradeCategory): string {
  if (category.configuration.type !== 'performance') return category.name
  const parts = [category.configuration.sport, category.configuration.discipline]
    .filter((value): value is string => Boolean(value))
  return parts.length > 0 ? `${parts.join(' · ')} — ${category.name}` : category.name
}

function setState(studentId: string, state: SportExamStudentState): void {
  states.value.set(studentId, state)
  if (state !== 'ready') grades.value.delete(studentId)
  else {
    const student = students.value.find((candidate) => candidate.id === studentId)
    if (student) recalculate(student)
  }
}

function setValue(student: Student, rawValue: string): void {
  values.value.set(student.id, rawValue)
  recalculate(student)
}

function parseMeasurement(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.')
  if (!normalized) return null

  if (selectedConfig.value?.measurementType !== 'time') {
    const value = Number(normalized)
    return Number.isFinite(value) && value >= 0 ? value : null
  }

  const parts = normalized.split(':')
  if (parts.length === 1) {
    const seconds = Number(parts[0])
    return Number.isFinite(seconds) && seconds >= 0 ? seconds : null
  }
  if (parts.length !== 2) return null

  const minutes = Number(parts[0])
  const seconds = Number(parts[1])
  if (!Number.isInteger(minutes) || minutes < 0 || !Number.isFinite(seconds) || seconds < 0 || seconds >= 60) {
    return null
  }
  return minutes * 60 + seconds
}

function gradingValue(student: Student): number | null {
  const raw = values.value.get(student.id)
  if (!raw) return null
  const measurement = parseMeasurement(raw)
  if (measurement === null) return null

  if (!isRelative.value) return measurement
  const bodyHeight = bodyHeights.value.get(student.id)
  if (!bodyHeight || bodyHeight <= 0) return null
  return (measurement / bodyHeight) * 100
}

function buildContext(student: Student): Record<string, unknown> {
  const config = selectedConfig.value
  const classGroup = classes.value.find((candidate) => candidate.id === selectedClassId.value)
  return {
    gender: student.gender,
    genderLong: student.gender === 'm' ? 'male' : student.gender === 'f' ? 'female' : undefined,
    age: calculateAgeFromDateOfBirth(student.dateOfBirth) ?? undefined,
    dateOfBirth: student.dateOfBirth,
    gradeLevel: config?.gradeLevel ?? classGroup?.gradeLevel,
    sport: config?.sport,
    discipline: config?.discipline,
    measurementType: config?.measurementType,
    normalization: config?.normalization ?? 'raw'
  }
}

function recalculate(student: Student): void {
  if (states.value.get(student.id) !== 'ready' || !selectedTable.value || !selectedConfig.value) {
    grades.value.delete(student.id)
    return
  }

  const value = gradingValue(student)
  if (value === null) {
    grades.value.delete(student.id)
    return
  }

  try {
    const result = sportBridge.performanceTableGradingService.calculateGrade({
      value,
      table: selectedTable.value,
      measurementType: selectedConfig.value.measurementType,
      context: buildContext(student)
    })
    grades.value.set(student.id, result.grade)
  } catch {
    grades.value.delete(student.id)
  }
}

function recalculateAll(): void {
  for (const student of students.value) recalculate(student)
}

function setBodyHeight(student: Student, raw: string): void {
  const value = Number(raw)
  if (Number.isFinite(value) && value > 0) bodyHeights.value.set(student.id, value)
  else bodyHeights.value.delete(student.id)
  recalculate(student)
}

async function saveBodyHeight(student: Student): Promise<void> {
  const bodyHeightCm = bodyHeights.value.get(student.id)
  if (!bodyHeightCm) return

  const existing = sportProfiles.value.get(student.id)
  try {
    const saved = existing
      ? await studentsBridge.sportStudentProfileRepository.update(existing.id, { bodyHeightCm })
      : await studentsBridge.sportStudentProfileRepository.create({
          studentId: student.id,
          moduleKey: 'sport',
          bodyHeightCm
        })
    sportProfiles.value.set(student.id, saved)
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Körpergröße konnte nicht gespeichert werden.')
  }
}

function normalizedDisplay(student: Student): string {
  const value = gradingValue(student)
  return value === null ? '—' : `${value.toFixed(1).replace('.', ',')} %`
}

function rowClass(studentId: string): Record<string, boolean> {
  const state = states.value.get(studentId)
  return {
    'exam-row--absent': state === 'absent',
    'exam-row--passive': state === 'passive',
    'exam-row--missing-kit': state === 'missing-kit'
  }
}

async function saveExam(): Promise<void> {
  if (!selectedCategory.value || !selectedConfig.value || !selectedTable.value) return

  const entries = students.value.map((student) => {
    const state = states.value.get(student.id) ?? 'ready'
    const rawValue = values.value.get(student.id)
    const value = state === 'ready' ? gradingValue(student) ?? undefined : undefined
    return {
      studentId: student.id,
      state,
      rawValue,
      value,
      calculatedGrade: state === 'ready' ? grades.value.get(student.id) : undefined,
      bodyHeightCm: isRelative.value ? bodyHeights.value.get(student.id) : undefined,
      attendanceSource: attendanceSources.value.get(student.id)
    }
  })

  const invalidReady = entries.find(
    (entry) => entry.state === 'ready' && (entry.value === undefined || entry.calculatedGrade === undefined)
  )
  if (invalidReady) {
    const student = students.value.find((candidate) => candidate.id === invalidReady.studentId)
    toast.error(`Für ${student?.firstName ?? 'einen Schüler'} fehlt ein gültiger Messwert oder Tabellenwert.`)
    return
  }

  saving.value = true
  try {
    const session = await sportBridge.saveSportExamSessionUseCase.execute({
      classGroupId: selectedClassId.value,
      categoryId: selectedCategory.value.id,
      tableId: selectedTable.value.id,
      examDate: examDate.value,
      announced: announced.value,
      sport: selectedConfig.value.sport,
      discipline: selectedConfig.value.discipline,
      measurementType: selectedConfig.value.measurementType,
      normalization: selectedConfig.value.normalization ?? 'raw',
      unit: selectedConfig.value.unit,
      entries
    })
    savedSessionId.value = session.id
    toast.success('Sportprüfung gespeichert.')
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Sportprüfung konnte nicht gespeichert werden.')
  } finally {
    saving.value = false
  }
}

function formatGrade(grade: string | number | undefined): string {
  if (grade === undefined) return '—'
  return typeof grade === 'number' && !Number.isInteger(grade)
    ? grade.toFixed(2).replace('.', ',')
    : String(grade)
}

function formatDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number)
  return `${day}.${month}.${year}`
}

function localDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
</script>

<style scoped>
.sport-exam-view { display: flex; flex-direction: column; gap: 1.25rem; }
.page-header { display: flex; gap: 1rem; align-items: flex-start; }
.page-header h1, .card h2 { margin: 0; }
.page-header p, .card-header p { margin: 0.25rem 0 0; color: #64748b; }
.back-button { background: none; border: 0; cursor: pointer; min-height: 44px; }
.card { background: white; border: 1px solid rgba(15,23,42,.08); border-radius: 16px; padding: 1rem; }
.setup-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 1rem; align-items: end; }
.setup-grid label { display: flex; flex-direction: column; gap: .35rem; font-weight: 600; }
.form-input, .status-select, .value-input { min-height: 44px; border: 1px solid #cbd5e1; border-radius: 8px; padding: .5rem .65rem; background: white; }
.announced-toggle { flex-direction: row !important; align-items: center; min-height: 44px; }
.exam-meta { margin-top: 1rem; display: flex; gap: .5rem; flex-wrap: wrap; }
.warning { color: #92400e; background: #fffbeb; padding: .75rem; border-radius: 8px; }
.card-header { display: flex; justify-content: space-between; gap: 1rem; align-items: center; }
.btn-primary { min-height: 44px; padding: .6rem 1rem; border: 0; border-radius: 8px; background: #0066cc; color: white; cursor: pointer; }
.btn-primary:disabled { background: #cbd5e1; cursor: not-allowed; }
.table-wrapper { overflow-x: auto; margin-top: 1rem; }
.exam-table { width: 100%; border-collapse: collapse; }
.exam-table th, .exam-table td { padding: .65rem; border-bottom: 1px solid #e2e8f0; text-align: left; vertical-align: middle; }
.student-name { font-weight: 600; white-space: nowrap; }
.value-input { width: 100px; }
.unit { margin-left: .35rem; color: #64748b; }
.grade-cell { text-align: center !important; }
.note-cell { min-width: 140px; }
.exam-row--absent { opacity: .5; background: #f8fafc; }
.exam-row--passive { background: #fefce8; }
.exam-row--missing-kit { background: #fef2f2; }
.attest-badge { display: inline-block; border-radius: 999px; padding: .2rem .55rem; background: #fee2e2; color: #991b1b; font-weight: 700; font-size: .8rem; }
.success-card { padding: .8rem 1rem; border-radius: 10px; background: #ecfdf5; color: #166534; }
.empty-state { text-align: center; color: #64748b; }
@media (max-width: 700px) {
  .card-header { align-items: stretch; flex-direction: column; }
  .exam-table th, .exam-table td { padding: .5rem; }
}
</style>
