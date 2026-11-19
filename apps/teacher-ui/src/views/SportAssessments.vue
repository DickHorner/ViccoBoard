<template>
  <section class="sport-assessments app-page">
    <header class="page-header">
      <div>
        <RouterLink to="/subjects/sport" class="back-link">← Sport</RouterLink>
        <h1>Leistungsabnahmen</h1>
        <p>Sportprüfungen direkt durchführen – mit Kriterienhilfe, Ergebniserfassung und Fortsetzung an Folgetagen.</p>
      </div>
    </header>

    <section class="app-card configuration" aria-label="Prüfung auswählen">
      <label>Klasse
        <select v-model="classGroupId" :disabled="loading || saving || dirty" @change="changeClass">
          <option value="">Klasse auswählen</option>
          <option v-for="group in classes" :key="group.id" :value="group.id">
            {{ group.name }}{{ group.gradeLevel ? ` · Jahrgang ${group.gradeLevel}` : '' }}
          </option>
        </select>
      </label>
      <label>Prüfung
        <select v-model="assessmentId" :disabled="loading || saving || dirty" @change="changeAssessment">
          <option v-for="item in assessments" :key="item.id" :value="item.id">
            {{ item.title }}
          </option>
        </select>
      </label>
      <label>Startdatum
        <input v-model="examDate" type="date" :disabled="loading || saving || dirty || !!sessionId" @change="changeDate" />
      </label>
      <label>Erfassung am
        <input v-model="assessmentDay" type="date" :disabled="loading || saving" required />
      </label>
      <label v-if="sessions.length">Durchführung fortsetzen
        <select v-model="sessionId" :disabled="loading || saving || dirty" @change="restoreSession">
          <option value="">Neue Durchführung</option>
          <option v-for="session in sessions" :key="session.id" :value="session.id">
            Beginn {{ formatStartDate(session) }} · {{ formatSessionTime(session.startedAt) }}
          </option>
        </select>
      </label>
    </section>

    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    <p v-if="dirty" class="notice" role="status">Ungespeicherte Änderungen – bitte vor einem Prüfungswechsel speichern.</p>
    <p v-if="sessionId" class="notice">Fortsetzung der Prüfung vom {{ formatDate(examDate) }}. Neue Bewertungen werden dem jeweils ausgewählten Erfassungstag zugeordnet.</p>
    <p v-if="loading" role="status">Prüfungsdaten werden geladen…</p>

    <template v-if="!loading && classGroupId && students.length">
      <section class="app-card task">
        <div class="task-heading">
          <div>
            <h2>{{ assessment.title }}</h2>
            <p class="source">LISUM 2020, S. {{ assessment.sourcePages }} · CC BY-SA 4.0 DE</p>
          </div>
          <Button label="Aufgabe & Aufbau" icon="pi pi-info-circle" outlined @click="help = 'task'" />
        </div>
        <p>{{ assessment.task }}</p>
      </section>

      <section class="app-card capture">
        <div class="capture-heading">
          <div>
            <h2>Beobachten und bewerten</h2>
            <p>{{ completedCount }} von {{ students.length }} Personen vollständig bewertet · {{ eligibleIds.length }} offen</p>
          </div>
          <Button
            :label="saving ? 'Speichert…' : 'Prüfung speichern'"
            :loading="saving"
            :disabled="saving || !dirty || !assessmentDay"
            @click="save"
          />
        </div>

        <div class="student-navigation">
          <label for="assessment-student">Aktuelle Person</label>
          <div class="student-navigation-controls">
            <Button label="Zufällig ziehen" icon="pi pi-shuffle" outlined :disabled="saving || eligibleIds.length === 0" @click="drawStudent" />
            <Button label="Zurück" severity="secondary" outlined :disabled="studentIndex === 0" @click="studentIndex--" />
            <select id="assessment-student" v-model.number="studentIndex" aria-label="Schüler auswählen">
              <option v-for="(student, index) in students" :key="student.id" :value="index">
                {{ student.firstName }} {{ student.lastName }}
              </option>
            </select>
            <Button label="Weiter" severity="secondary" outlined :disabled="studentIndex >= students.length - 1" @click="studentIndex++" />
          </div>
        </div>

        <template v-if="currentStudent">
          <label class="state-field">Teilnahmestatus
            <select :value="currentState" @change="setState(($event.target as HTMLSelectElement).value as SportExamStudentState)">
              <option value="not-assessed">Noch nicht bewertet</option>
              <option value="ready">Teilnahme</option>
              <option value="absent">Abwesend</option>
              <option value="passive">Passiv / verletzt</option>
            </select>
          </label>

          <div v-if="currentState === 'ready' || currentState === 'not-assessed'" class="criterion-list">
            <article v-for="criterion in assessment.criteria" :key="criterion.id" class="criterion-row">
              <div class="criterion-heading">
                <strong>{{ criterion.name }}</strong>
                <button type="button" class="help-button" :aria-label="`Beobachtungshilfe: ${criterion.name}`" @click="help = criterion.id">
                  <i class="pi pi-info-circle" aria-hidden="true"></i> Erklärung
                </button>
              </div>
              <div class="score-buttons" role="group" :aria-label="criterion.name">
                <button
                  v-for="value in criterion.choices"
                  :key="value"
                  :disabled="saving"
                  type="button"
                  :class="['score-button', { selected: currentScores[criterion.id] === value }]"
                  :aria-pressed="currentScores[criterion.id] === value"
                  @click="setScore(criterion.id, value)"
                >{{ value }}</button>
                <button type="button" class="score-button clear" :disabled="saving || currentScores[criterion.id] === undefined" @click="clearScore(criterion.id)">
                  Löschen
                </button>
              </div>
            </article>
          </div>
          <p v-else class="notice">Für diesen Teilnahmestatus werden keine Punkte erfasst.</p>

          <div class="result" aria-live="polite">
            <span v-if="assessment.type === 'points'">{{ assessment.scoreLabel ?? 'Punkte' }}:
              <strong>{{ currentResult?.totalPoints ?? '–' }} / {{ currentResult?.maxPoints ?? maximumPoints }}</strong>
            </span>
            <span>Note:
              <strong>{{ currentResult?.grade ?? '–' }}</strong>
            </span>
          </div>
          <p v-if="assessment.type === 'points' && currentResult && !currentResult.grade" class="notice">
            {{ assessment.noGradeReason }} Die Leistung ist dennoch speicherbar.
          </p>
          <p v-if="currentStudent && assessedDates[currentStudent.id]" class="source">
            Zuletzt bewertet am {{ formatDate(assessedDates[currentStudent.id]) }}
          </p>
          <p v-if="assessment.type === 'holistic'" class="source">
            Die qualitative Note wird direkt anhand der vollständigen Bewegungsbeschreibung ausgewählt.
          </p>
        </template>
      </section>
      <p v-if="saveMessage" class="notice success" role="status">{{ saveMessage }}</p>
    </template>

    <Dialog v-model:visible="helpVisible" modal :header="helpTitle" :style="{ width: 'min(94vw, 38rem)' }" :dismissableMask="true">
      <template v-if="help === 'task'">
        <p>{{ assessment.task }}</p>
        <ul><li v-for="instruction in assessment.instructions" :key="instruction">{{ instruction }}</li></ul>
        <svg v-if="assessment.diagram" class="court-diagram" viewBox="0 0 400 155" role="img" :aria-label="`Schematischer Aufbau: ${assessment.title}`">
          <rect x="14" y="16" width="372" height="120" rx="5" fill="none" stroke="currentColor" stroke-width="2" />
          <template v-if="assessment.diagram === 'passing'">
            <path d="M65 57 H333 M333 98 H65" stroke="#2563eb" stroke-width="3" fill="none" />
            <path d="M80 98 L130 57 L185 98 L240 57 L295 98 L328 57" stroke="#c2410c" stroke-width="2" stroke-dasharray="6 4" fill="none" />
            <text x="65" y="44" font-size="12" fill="currentColor">Laufweg A</text>
            <text x="65" y="118" font-size="12" fill="currentColor">Laufweg B</text>
          </template>
          <template v-else-if="assessment.diagram === 'dribbling'">
            <path d="M65 59 H330 Q365 76 330 96 H65" stroke="#2563eb" stroke-width="3" fill="none" />
            <circle cx="330" cy="77" r="9" stroke="#c2410c" fill="none" stroke-width="3" />
            <text x="265" y="44" font-size="12" fill="currentColor">Wendemarke</text>
            <text x="65" y="116" font-size="12" fill="currentColor">Start / Ziel</text>
          </template>
          <template v-else-if="assessment.diagram === 'shooting'">
            <circle cx="196" cy="54" r="13" stroke="#c2410c" stroke-width="3" fill="none" />
            <text x="218" y="57" font-size="12" fill="currentColor">Korb</text>
            <circle v-for="(point, index) in [[144,84],[176,101],[204,108],[230,101],[260,84]]" :key="index" :cx="point[0]" :cy="point[1]" r="11" fill="none" stroke="#2563eb" stroke-width="2" />
            <text v-for="(point, index) in [[144,84],[176,101],[204,108],[230,101],[260,84]]" :key="`point-${index}`" :x="point[0] - 4" :y="point[1] + 4" font-size="12" fill="currentColor">{{ 'ABCDE'[index] }}</text>
          </template>
          <template v-else-if="assessment.diagram === 'serving'">
            <line x1="200" y1="16" x2="200" y2="136" stroke="#c2410c" stroke-width="4" />
            <line x1="290" y1="16" x2="290" y2="136" stroke="#94a3b8" stroke-dasharray="6 4" />
            <path d="M72 76 Q158 12 285 70" stroke="#2563eb" stroke-width="3" stroke-dasharray="6 5" fill="none" />
            <circle cx="72" cy="76" r="8" fill="#2563eb" />
            <text x="25" y="59" font-size="12" fill="currentColor">Aufschlag</text>
            <text x="210" y="32" font-size="12" fill="currentColor">Zielfeld</text>
            <text x="170" y="151" font-size="12" fill="currentColor">Netz</text>
          </template>
        </svg>
        <p v-if="assessment.diagram" class="source">Eigene schematische Skizze, nicht maßstabsgetreu. Grundlage: LISUM, S. {{ assessment.sourcePages }}.</p>
      </template>
      <template v-else-if="activeCriterion">
        <p>{{ activeCriterion.description }}</p>
        <div v-if="activeCriterion.levels">
          <h3>Beobachtbare Notenstufen</h3>
          <dl v-for="level in activeCriterion.levels" :key="level.value" class="level-description">
            <dt>Note {{ level.value }}</dt><dd>{{ level.description }}</dd>
          </dl>
        </div>
        <p v-else class="source">Zulässige Punkte: {{ activeCriterion.choices.join(', ') }}. Die Handreichung erläutert die Merkmale, legt aber keine gesonderten Textanker für jeden einzelnen Punkt fest.</p>
        <p class="source">Quelle: LISUM, 2. Auflage 2020, S. {{ assessment.sourcePages }} · CC BY-SA 4.0 DE</p>
      </template>
    </Dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, RouterLink } from 'vue-router'
import Button from 'openvue/button'
import Dialog from 'openvue/dialog'
import { Sport, type ClassGroup, type Student } from '@viccoboard/core'
import {
  SPORT_ASSESSMENTS,
  evaluateSportAssessment,
  findSportAssessment,
  type SportAssessmentResult,
  type SportExamSessionMetadata,
  type SportExamStudentState
} from '@viccoboard/sport'
import { getSportBridge, initializeSportBridge } from '../composables/useSportBridge'
import { getStudentsBridge, initializeStudentsBridge } from '../composables/useStudentsBridge'
import { selectRandomStudentId } from '../utils/random-student'

initializeSportBridge()
initializeStudentsBridge()
const sport = getSportBridge()
const studentBridge = getStudentsBridge()
const assessments = SPORT_ASSESSMENTS
const classes = ref<ClassGroup[]>([])
const classGroupId = ref('')
const assessmentId = ref('passing-d')
const examDate = ref(localDateString(new Date()))
const assessmentDay = ref(localDateString(new Date()))
const students = ref<Student[]>([])
const categoryId = ref('')
const sessions = ref<Sport.ToolSession[]>([])
const sessionId = ref('')
const studentIndex = ref(0)
const scores = ref<Record<string, Record<string, number>>>({})
const states = ref<Record<string, SportExamStudentState>>({})
const assessedDates = ref<Record<string, string>>({})
const drawHistory = ref<string[]>([])
const loading = ref(false)
const saving = ref(false)
const dirty = ref(false)
const error = ref('')
const saveMessage = ref('')
const help = ref<string | null>(null)

const assessment = computed(() => assessments.find((item) => item.id === assessmentId.value) ?? assessments[0])
const currentStudent = computed(() => students.value[studentIndex.value])
const currentScores = computed<Record<string, number>>(() => currentStudent.value ? scores.value[currentStudent.value.id] ?? {} : {})
const currentState = computed<SportExamStudentState>(() =>
  currentStudent.value ? states.value[currentStudent.value.id] ?? 'not-assessed' : 'not-assessed'
)
const currentResult = computed<SportAssessmentResult | null>(() =>
  currentState.value === 'ready' || currentState.value === 'not-assessed'
    ? evaluateSportAssessment(assessment.value, currentScores.value)
    : null
)
const maximumPoints = computed(() =>
  assessment.value.criteria.reduce((total, criterion) => total + criterion.choices[criterion.choices.length - 1], 0)
)
const completedCount = computed(() => students.value.filter((student) =>
  states.value[student.id] === 'ready' &&
  evaluateSportAssessment(assessment.value, scores.value[student.id] ?? {}) !== null
).length)
const eligibleIds = computed(() => students.value
  .filter((student) => {
    const state = states.value[student.id] ?? 'not-assessed'
    return (state === 'not-assessed' || state === 'ready') &&
      evaluateSportAssessment(assessment.value, scores.value[student.id] ?? {}) === null
  })
  .map((student) => student.id)
)
const activeCriterion = computed(() => assessment.value.criteria.find((criterion) => criterion.id === help.value))
const helpTitle = computed(() => help.value === 'task' ? 'Aufgabe und Aufbau' : activeCriterion.value?.name ?? 'Beobachtungshilfe')
const helpVisible = computed({
  get: () => help.value !== null,
  set: (visible: boolean) => { if (!visible) help.value = null }
})

onBeforeRouteLeave(() =>
  !dirty.value || window.confirm('Die Bewertung enthält ungespeicherte Eingaben. Wirklich verlassen?')
)

onMounted(async () => {
  loading.value = true
  try {
    classes.value = (await sport.classGroupRepository.findAll()).filter((group) => !group.archived)
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Klassen konnten nicht geladen werden.'
  } finally {
    loading.value = false
  }
})

function clearDraft(): void {
  scores.value = {}
  states.value = {}
  assessedDates.value = {}
  drawHistory.value = []
  dirty.value = false
  saveMessage.value = ''
  studentIndex.value = 0
}

async function changeClass(): Promise<void> {
  students.value = []
  categoryId.value = ''
  sessions.value = []
  sessionId.value = ''
  clearDraft()
  if (!classGroupId.value) return
  loading.value = true
  error.value = ''
  try {
    students.value = await studentBridge.studentRepository.findByClassGroup(classGroupId.value)
    await loadAssessment()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Klasse konnte nicht geladen werden.'
  } finally {
    loading.value = false
  }
}

async function changeAssessment(): Promise<void> {
  loading.value = true
  error.value = ''
  sessionId.value = ''
  clearDraft()
  try {
    if (classGroupId.value) await loadAssessment()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Prüfung konnte nicht geladen werden.'
  } finally {
    loading.value = false
  }
}

function changeDate(): void {
  sessionId.value = ''
  clearDraft()
}

async function loadAssessment(): Promise<void> {
  const existing = (await sport.gradeCategoryRepository.findByClassGroup(classGroupId.value))
    .filter((category) => category.description === assessment.value.sourceId)
  if (existing.length > 1 || (existing.length && !findSportAssessment(existing[0]))) {
    throw new Error('Die zugehörige Prüfungsvorlage wurde verändert oder mehrfach angelegt. Bitte zuerst die Kategorie prüfen.')
  }
  const category = existing[0] ?? await sport.createGradeCategoryUseCase.execute({
    classGroupId: classGroupId.value,
    name: assessment.value.title,
    description: assessment.value.sourceId,
    type: Sport.GradeCategoryType.Criteria,
    weight: 0,
    configuration: {
      type: 'criteria',
      allowSelfAssessment: false,
      selfAssessmentViaWOW: false,
      criteria: assessment.value.criteria.map((criterion) => ({
        id: criterion.id,
        name: criterion.name,
        description: criterion.description,
        minValue: criterion.choices[0],
        maxValue: criterion.choices[criterion.choices.length - 1],
        weight: 1
      }))
    }
  })
  categoryId.value = category.id
  await loadSessions()
}

async function loadSessions(): Promise<void> {
  sessions.value = []
  if (!classGroupId.value || !categoryId.value) return
  sessions.value = (await sport.toolSessionRepository.findByClassGroup(classGroupId.value))
    .filter((session) => {
      if (session.toolType !== 'sport-exam') return false
      const metadata = session.sessionMetadata as SportExamSessionMetadata
      return metadata.categoryId === categoryId.value && metadata.assessmentType === 'criteria'
    })
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
}

async function restoreSession(): Promise<void> {
  if (!sessionId.value) {
    clearDraft()
    examDate.value = localDateString(new Date())
    return
  }
  loading.value = true
  error.value = ''
  try {
    const session = sessions.value.find((item) => item.id === sessionId.value)
    if (!session) throw new Error('Durchführung wurde nicht gefunden.')
    const metadata = session.sessionMetadata as SportExamSessionMetadata
    const studentIds = new Set(students.value.map((student) => student.id))
    const restoredStates: Record<string, SportExamStudentState> = {}
    const restoredScores: Record<string, Record<string, number>> = {}
    const restoredDates: Record<string, string> = {}
    for (const item of metadata.studentStates) {
      if (studentIds.has(item.studentId)) restoredStates[item.studentId] = item.state
    }
    const entries = await Promise.all(metadata.entryIds.map((id) => sport.performanceEntryRepository.findById(id)))
    if (entries.some((entry) => !entry)) throw new Error('Gespeicherte Leistungsdaten sind unvollständig.')
    for (const entry of entries) {
      if (!entry || !studentIds.has(entry.studentId)) continue
      const savedScores = entry.measurements.criteria
      if (savedScores && typeof savedScores === 'object' && !Array.isArray(savedScores)) {
        restoredScores[entry.studentId] = Object.fromEntries(
          assessment.value.criteria
            .filter((criterion) =>
              typeof savedScores[criterion.id] === 'number' &&
              criterion.choices.includes(savedScores[criterion.id])
            )
            .map((criterion) => [criterion.id, savedScores[criterion.id]])
        )
      }
      restoredDates[entry.studentId] = entry.metadata?.assessedOn ?? metadata.examDate
    }
    examDate.value = metadata.examDate
    scores.value = restoredScores
    states.value = restoredStates
    assessedDates.value = restoredDates
    drawHistory.value = (metadata.drawHistory ?? []).filter((id) => studentIds.has(id))
    dirty.value = false
    saveMessage.value = ''
    studentIndex.value = 0
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Durchführung konnte nicht wiederhergestellt werden.'
  } finally {
    loading.value = false
  }
}

function setState(state: SportExamStudentState): void {
  if (!currentStudent.value || saving.value || currentState.value === state) return
  states.value = { ...states.value, [currentStudent.value.id]: state }
  if (state === 'not-assessed') {
    const studentId = currentStudent.value.id
    scores.value = { ...scores.value, [studentId]: {} }
    const updatedDates = { ...assessedDates.value }
    delete updatedDates[studentId]
    assessedDates.value = updatedDates
  }
  dirty.value = true
  saveMessage.value = ''
}

function setScore(criterionId: string, value: number): void {
  if (!currentStudent.value || saving.value || currentScores.value[criterionId] === value) return
  const studentId = currentStudent.value.id
  scores.value = { ...scores.value, [studentId]: { ...currentScores.value, [criterionId]: value } }
  states.value = { ...states.value, [studentId]: 'ready' }
  assessedDates.value = { ...assessedDates.value, [studentId]: assessmentDay.value }
  dirty.value = true
  saveMessage.value = ''
}

function clearScore(criterionId: string): void {
  if (!currentStudent.value || saving.value) return
  const studentId = currentStudent.value.id
  if (currentScores.value[criterionId] === undefined) return
  const updated = { ...currentScores.value }
  delete updated[criterionId]
  scores.value = { ...scores.value, [studentId]: updated }
  states.value = { ...states.value, [studentId]: Object.keys(updated).length ? 'ready' : 'not-assessed' }
  assessedDates.value = { ...assessedDates.value, [studentId]: assessmentDay.value }
  dirty.value = true
  saveMessage.value = ''
}

function drawStudent(): void {
  if (!eligibleIds.value.length || saving.value) return
  const selected = selectRandomStudentId(eligibleIds.value, drawHistory.value)
  if (!selected) return
  const index = students.value.findIndex((student) => student.id === selected.selectedStudentId)
  if (index < 0) return
  studentIndex.value = index
  drawHistory.value = selected.updatedHistory
  dirty.value = true
  saveMessage.value = ''
}

async function save(): Promise<void> {
  if (!categoryId.value || !classGroupId.value || !dirty.value ||
      !assessmentDay.value) return
  saving.value = true
  error.value = ''
  saveMessage.value = ''
  try {
    const entries = students.value.map((student) => {
      const studentScores = scores.value[student.id] ?? {}
      const state = states.value[student.id] ?? 'not-assessed'
      const result = state === 'ready'
        ? evaluateSportAssessment(assessment.value, studentScores)
        : null
      return {
        studentId: student.id,
        state: state === 'ready' && !Object.keys(studentScores).length ? 'not-assessed' as const : state,
        criterionScores: state === 'ready' ? studentScores : undefined,
        criteriaTotalPoints: result?.totalPoints,
        criteriaMaxPoints: result?.maxPoints,
        criteriaPercentage: result?.percentage,
        calculatedGrade: result?.grade,
        assessedOn: assessedDates.value[student.id]
      }
    })
    const session = await sport.saveSportExamSessionUseCase.execute({
      sessionId: sessionId.value || undefined,
      classGroupId: classGroupId.value,
      categoryId: categoryId.value,
      assessmentType: 'criteria',
      examDate: examDate.value,
      announced: false,
      sport: assessment.value.sport,
      discipline: assessment.value.title,
      drawHistory: drawHistory.value,
      entries
    })
    sessionId.value = session.id
    dirty.value = false
    saveMessage.value = 'Zwischenstand gespeichert. Diese Durchführung kann auch an einem späteren Tag fortgesetzt werden.'
    await loadSessions()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Prüfung konnte nicht gespeichert werden.'
  } finally {
    saving.value = false
  }
}

function formatDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  return `${day}.${month}.${year}`
}

function formatStartDate(session: Sport.ToolSession): string {
  const metadata = session.sessionMetadata as SportExamSessionMetadata
  return formatDate(metadata.examDate)
}

function formatSessionTime(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' }).format(date)
}

function localDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
</script>

<style scoped>
.sport-assessments { display: flex; flex-direction: column; gap: 1rem; }
.page-header h1, h2 { margin: .3rem 0; }
.page-header p, .task p, .capture-heading p { color: var(--p-text-muted-color, #64748b); margin: .25rem 0; }
.back-link { text-decoration: none; }
.app-card { padding: 1rem; border: 1px solid var(--p-content-border-color, #d1d5db); border-radius: 14px; }
.configuration { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 190px), 1fr)); gap: 1rem; }
.configuration label, .state-field { display: flex; flex-direction: column; gap: .4rem; font-weight: 600; }
.configuration input, .configuration select, .student-navigation select, .state-field select { min-height: 44px; border: 1px solid var(--p-content-border-color, #94a3b8); border-radius: 8px; padding: .5rem; background: var(--p-content-background, white); color: inherit; width: 100%; }
.task-heading, .capture-heading, .criterion-heading, .result { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.capture { display: grid; gap: 1rem; }
.source { font-size: .84rem; color: var(--p-text-muted-color, #64748b); }
.student-navigation { display: grid; gap: .5rem; }
.student-navigation-controls { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; }
.student-navigation-controls select { flex: 1; min-width: 140px; }
.criterion-list { display: grid; gap: .5rem; }
.criterion-row { border-top: 1px solid var(--p-content-border-color, #e2e8f0); padding: .85rem 0; display: grid; gap: .5rem; }
.help-button { border: 0; background: transparent; color: var(--p-primary-color, #2563eb); padding: .6rem; min-height: 44px; cursor: pointer; }
.score-buttons { display: flex; flex-wrap: wrap; gap: .4rem; }
.score-button { border: 1px solid var(--p-content-border-color, #94a3b8); border-radius: 8px; padding: .55rem .8rem; min-width: 48px; min-height: 44px; background: var(--p-content-background, white); color: inherit; cursor: pointer; font-size: 1rem; }
.score-button.selected { background: var(--p-primary-color, #2563eb); color: white; border-color: var(--p-primary-color, #2563eb); }
.score-button.clear { margin-left: auto; font-size: .85rem; }
.score-button:disabled { opacity: .5; }
.result { padding: .9rem 0; border-top: 1px solid var(--p-content-border-color, #e2e8f0); }
.result strong { font-size: 1.3rem; margin-left: .5rem; }
.notice { margin: 0; padding: .8rem; border-radius: 8px; background: var(--p-content-hover-background, #f1f5f9); }
.error { color: #991b1b; }
.success { color: #166534; }
.court-diagram { display: block; width: 100%; height: auto; max-height: 180px; margin: 1rem 0; }
.level-description { margin: .5rem 0; border-bottom: 1px solid #cbd5e1; padding: .3rem 0; }
.level-description dt { font-weight: 700; }
.level-description dd { margin: .25rem 0 .5rem; }
@media (max-width: 600px) {
  .capture-heading { align-items: stretch; }
  .capture-heading > button { width: 100%; }
  .student-navigation-controls > button { flex: 0 0 auto; }
}
</style>
