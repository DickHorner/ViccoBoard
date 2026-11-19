<template>
  <section class="basketball-assessment app-page">
    <header class="page-header">
      <div>
        <RouterLink to="/subjects/sport" class="back-link">← Sport</RouterLink>
        <h1>Basketball · Leistungsabnahme</h1>
        <p>Einheitliche Erfassung für Passen und Dribbeln, Niveaustufe D.</p>
      </div>
    </header>

    <section class="app-card configuration" aria-label="Prüfung auswählen">
      <label>Klasse
        <select v-model="classGroupId" :disabled="loading || saving" @change="changeClass">
          <option value="">Klasse auswählen</option>
          <option v-for="group in classes" :key="group.id" :value="group.id">
            {{ group.name }}{{ group.gradeLevel ? ` · Jahrgang ${group.gradeLevel}` : '' }}
          </option>
        </select>
      </label>
      <label>Prüfung
        <select v-model="assessmentId" :disabled="loading || saving" @change="changeAssessment">
          <option v-for="item in assessments" :key="item.id" :value="item.id">
            {{ item.title }}
          </option>
        </select>
      </label>
      <label>Datum
        <input v-model="examDate" type="date" :disabled="loading || saving" @change="changeDate" />
      </label>
      <label v-if="sessions.length">Gespeicherte Durchführung
        <select v-model="sessionId" :disabled="loading || saving" @change="restoreSession">
          <option value="">Neue Durchführung</option>
          <option v-for="session in sessions" :key="session.id" :value="session.id">
            {{ formatSessionTime(session.startedAt) }}
          </option>
        </select>
      </label>
    </section>

    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
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
            <p>{{ completedCount }} von {{ students.length }} Personen vollständig bewertet</p>
          </div>
          <Button
            :label="saving ? 'Speichert…' : 'Prüfung speichern'"
            :loading="saving"
            :disabled="saving || !hasInput"
            @click="save"
          />
        </div>

        <div class="student-navigation">
          <label for="basketball-student">Aktuelle Person</label>
          <div class="student-navigation-controls">
            <Button label="Zurück" severity="secondary" outlined :disabled="studentIndex === 0" @click="studentIndex--" />
            <select id="basketball-student" v-model.number="studentIndex" aria-label="Schüler auswählen">
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
                  type="button"
                  :class="['score-button', { selected: currentScores[criterion.id] === value }]"
                  :aria-pressed="currentScores[criterion.id] === value"
                  @click="setScore(criterion.id, value)"
                >{{ value }}</button>
                <button type="button" class="score-button clear" :disabled="currentScores[criterion.id] === undefined" @click="clearScore(criterion.id)">
                  Löschen
                </button>
              </div>
            </article>
          </div>
          <p v-else class="notice">Für diesen Teilnahmestatus werden keine Punkte erfasst.</p>

          <div class="result" aria-live="polite">
            <span v-if="assessment.type === 'points'">Punkte:
              <strong>{{ currentResult?.totalPoints ?? '–' }} / 16</strong>
            </span>
            <span>Note:
              <strong>{{ currentResult?.grade ?? '–' }}</strong>
            </span>
          </div>
          <p v-if="assessment.type === 'points' && currentResult && !currentResult.grade" class="notice">
            Für weniger als 3 Punkte ist in Tabelle 62 keine Note angegeben. Der Punktestand bleibt speicherbar.
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
        <svg class="court-diagram" viewBox="0 0 400 155" role="img" :aria-label="assessment.type === 'points' ? 'Zwei parallele Laufwege mit diagonalen Pässen' : 'Laufweg mit Dribbling bis zur Wendemarke und zurück'">
          <rect x="14" y="16" width="372" height="120" rx="5" fill="none" stroke="currentColor" stroke-width="2" />
          <line x1="55" y1="25" x2="55" y2="126" stroke="currentColor" stroke-dasharray="5 4" />
          <line x1="345" y1="25" x2="345" y2="126" stroke="currentColor" stroke-dasharray="5 4" />
          <template v-if="assessment.type === 'points'">
            <path d="M65 57 H333 M333 98 H65" stroke="#2563eb" stroke-width="3" fill="none" />
            <path d="M80 98 L130 57 L185 98 L240 57 L295 98 L328 57" stroke="#c2410c" stroke-width="2" stroke-dasharray="6 4" fill="none" />
            <text x="70" y="44" font-size="12" fill="currentColor">Laufweg A</text>
            <text x="70" y="117" font-size="12" fill="currentColor">Laufweg B</text>
          </template>
          <template v-else>
            <path d="M65 59 H330 Q365 76 330 96 H65" stroke="#2563eb" stroke-width="3" fill="none" />
            <circle cx="330" cy="77" r="9" stroke="#c2410c" fill="none" stroke-width="3" />
            <text x="285" y="44" font-size="12" fill="currentColor">Wendemarke</text>
            <text x="65" y="116" font-size="12" fill="currentColor">Start / Ziel</text>
          </template>
        </svg>
        <p class="source">Eigene schematische Skizze, nicht maßstabsgetreu. Grundlage: LISUM, S. {{ assessment.sourcePages }}.</p>
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
import { RouterLink } from 'vue-router'
import Button from 'openvue/button'
import Dialog from 'openvue/dialog'
import { Sport, type ClassGroup, type Student } from '@viccoboard/core'
import {
  BASKETBALL_ASSESSMENTS,
  evaluateBasketballAssessment,
  findBasketballAssessment,
  type BasketballAssessmentResult,
  type SportExamSessionMetadata,
  type SportExamStudentState
} from '@viccoboard/sport'
import { getSportBridge, initializeSportBridge } from '../composables/useSportBridge'
import { getStudentsBridge, initializeStudentsBridge } from '../composables/useStudentsBridge'

initializeSportBridge()
initializeStudentsBridge()
const sport = getSportBridge()
const studentBridge = getStudentsBridge()
const assessments = BASKETBALL_ASSESSMENTS
const classes = ref<ClassGroup[]>([])
const classGroupId = ref('')
const assessmentId = ref<(typeof assessments)[number]['id']>('passing-d')
const examDate = ref(localDateString(new Date()))
const students = ref<Student[]>([])
const categoryId = ref('')
const sessions = ref<Sport.ToolSession[]>([])
const sessionId = ref('')
const studentIndex = ref(0)
const scores = ref<Record<string, Record<string, number>>>({})
const states = ref<Record<string, SportExamStudentState>>({})
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const saveMessage = ref('')
const help = ref<string | null>(null)

const assessment = computed(() => assessments.find((item) => item.id === assessmentId.value) ?? assessments[0])
const currentStudent = computed(() => students.value[studentIndex.value])
const currentScores = computed(() => currentStudent.value ? scores.value[currentStudent.value.id] ?? {} : {})
const currentState = computed<SportExamStudentState>(() =>
  currentStudent.value ? states.value[currentStudent.value.id] ?? 'not-assessed' : 'not-assessed'
)
const currentResult = computed<BasketballAssessmentResult | null>(() =>
  currentState.value === 'ready' || currentState.value === 'not-assessed'
    ? evaluateBasketballAssessment(assessment.value, currentScores.value)
    : null
)
const completedCount = computed(() => students.value.filter((student) =>
  states.value[student.id] === 'ready' &&
  evaluateBasketballAssessment(assessment.value, scores.value[student.id] ?? {}) !== null
).length)
const hasInput = computed(() => students.value.some((student) =>
  Object.keys(scores.value[student.id] ?? {}).length > 0 ||
  (states.value[student.id] !== undefined && states.value[student.id] !== 'not-assessed')
))
const activeCriterion = computed(() => assessment.value.criteria.find((criterion) => criterion.id === help.value))
const helpTitle = computed(() => help.value === 'task' ? 'Aufgabe und Aufbau' : activeCriterion.value?.name ?? 'Beobachtungshilfe')
const helpVisible = computed({
  get: () => help.value !== null,
  set: (visible: boolean) => { if (!visible) help.value = null }
})

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

async function changeClass(): Promise<void> {
  students.value = []
  studentIndex.value = 0
  categoryId.value = ''
  sessions.value = []
  sessionId.value = ''
  scores.value = {}
  states.value = {}
  saveMessage.value = ''
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
  saveMessage.value = ''
  sessionId.value = ''
  scores.value = {}
  states.value = {}
  try {
    if (classGroupId.value) await loadAssessment()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Prüfung konnte nicht geladen werden.'
  } finally {
    loading.value = false
  }
}

async function changeDate(): Promise<void> {
  sessionId.value = ''
  scores.value = {}
  states.value = {}
  saveMessage.value = ''
  loading.value = true
  error.value = ''
  try {
    await loadSessions()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Durchführungen konnten nicht geladen werden.'
  } finally {
    loading.value = false
  }
}

async function loadAssessment(): Promise<void> {
  const existing = (await sport.gradeCategoryRepository.findByClassGroup(classGroupId.value))
    .filter((category) => category.description === assessment.value.sourceId)
  if (existing.length > 1 || (existing.length && !findBasketballAssessment(existing[0]))) {
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
      return metadata.categoryId === categoryId.value && metadata.examDate === examDate.value
    })
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
}

async function restoreSession(): Promise<void> {
  scores.value = {}
  states.value = {}
  saveMessage.value = ''
  if (!sessionId.value) return
  loading.value = true
  error.value = ''
  try {
    const session = sessions.value.find((item) => item.id === sessionId.value)
    if (!session) throw new Error('Durchführung wurde nicht gefunden.')
    const metadata = session.sessionMetadata as SportExamSessionMetadata
    const studentIds = new Set(students.value.map((student) => student.id))
    for (const item of metadata.studentStates) {
      if (studentIds.has(item.studentId)) states.value[item.studentId] = item.state
    }
    const entries = await Promise.all(metadata.entryIds.map((id) => sport.performanceEntryRepository.findById(id)))
    if (entries.some((entry) => !entry)) throw new Error('Gespeicherte Leistungsdaten sind unvollständig.')
    for (const entry of entries) {
      if (!entry || !studentIds.has(entry.studentId)) continue
      const savedScores = entry.measurements.criteria
      if (savedScores && typeof savedScores === 'object' && !Array.isArray(savedScores)) {
        scores.value[entry.studentId] = Object.fromEntries(
          assessment.value.criteria
            .filter((criterion) =>
              typeof savedScores[criterion.id] === 'number' &&
              criterion.choices.includes(savedScores[criterion.id])
            )
            .map((criterion) => [criterion.id, savedScores[criterion.id]])
        )
      }
    }
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Durchführung konnte nicht wiederhergestellt werden.'
  } finally {
    loading.value = false
  }
}

function setState(state: SportExamStudentState): void {
  if (!currentStudent.value) return
  states.value = { ...states.value, [currentStudent.value.id]: state }
  saveMessage.value = ''
}

function setScore(criterionId: string, value: number): void {
  if (!currentStudent.value) return
  const studentId = currentStudent.value.id
  scores.value = { ...scores.value, [studentId]: { ...currentScores.value, [criterionId]: value } }
  states.value = { ...states.value, [studentId]: 'ready' }
  saveMessage.value = ''
}

function clearScore(criterionId: string): void {
  if (!currentStudent.value) return
  const studentId = currentStudent.value.id
  const updated = { ...currentScores.value }
  delete updated[criterionId]
  scores.value = { ...scores.value, [studentId]: updated }
  states.value = { ...states.value, [studentId]: Object.keys(updated).length ? 'ready' : 'not-assessed' }
  saveMessage.value = ''
}

async function save(): Promise<void> {
  if (!categoryId.value || !classGroupId.value || !hasInput.value) return
  saving.value = true
  error.value = ''
  saveMessage.value = ''
  try {
    const entries = students.value.map((student) => {
      const studentScores = scores.value[student.id] ?? {}
      const state = states.value[student.id] ?? 'not-assessed'
      const result = state === 'ready'
        ? evaluateBasketballAssessment(assessment.value, studentScores)
        : null
      return {
        studentId: student.id,
        state: state === 'ready' && !Object.keys(studentScores).length ? 'not-assessed' as const : state,
        criterionScores: state === 'ready' ? studentScores : undefined,
        criteriaTotalPoints: result?.totalPoints,
        criteriaMaxPoints: result?.maxPoints,
        criteriaPercentage: result?.percentage,
        calculatedGrade: result?.grade
      }
    })
    const session = await sport.saveSportExamSessionUseCase.execute({
      sessionId: sessionId.value || undefined,
      classGroupId: classGroupId.value,
      categoryId: categoryId.value,
      assessmentType: 'criteria',
      examDate: examDate.value,
      announced: false,
      sport: 'Basketball',
      discipline: assessment.value.title,
      entries
    })
    sessionId.value = session.id
    await loadSessions()
    saveMessage.value = 'Durchführung gespeichert. Sie kann über die Auswahl erneut geöffnet werden.'
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Prüfung konnte nicht gespeichert werden.'
  } finally {
    saving.value = false
  }
}

function formatSessionTime(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' }).format(date)
}

function localDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
</script>

<style scoped>
.basketball-assessment { display: flex; flex-direction: column; gap: 1rem; }
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
