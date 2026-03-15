<template>
  <div class="team-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← {{ t('COMMON.back') }}</button>
      <h2>{{ t('TEAM.team-erstellen') }}</h2>
      <p class="page-description">{{ t('TEAM.teams-klasse') }}</p>
    </div>

    <!-- ── Step 1: Class + Set Name ─────────────────────────────────────── -->
    <section class="card">
      <div class="form-row">
        <div class="form-group">
          <label>{{ t('KLASSEN.klasse') }}</label>
          <select v-model="selectedClassId" class="form-input" @change="loadStudents">
            <option value="">{{ t('KLASSEN.klasse') }}...</option>
            <option v-for="cls in classes" :key="cls.id" :value="cls.id">
              {{ cls.name }} ({{ cls.schoolYear }})
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ t('TEAM.session-name') }}</label>
          <input
            v-model="sessionName"
            type="text"
            class="form-input"
            :placeholder="t('TEAM.set-name-vor-generierung')"
          />
        </div>
        <div class="form-group">
          <label>{{ t('TEAM.bezeichnung') }}</label>
          <input v-model="teamLabel" type="text" class="form-input" />
        </div>
      </div>

      <!-- ── Team Count Slider ──────────────────────────────────────────── -->
      <div class="form-group slider-group">
        <label>{{ t('TEAM.anzahl-slider') }}: <strong>{{ teamCount }}</strong></label>
        <input
          v-model.number="teamCount"
          type="range"
          min="2"
          :max="maxTeamCount"
          step="1"
          class="team-count-slider"
        />
        <div class="slider-presets">
          <button
            v-for="preset in teamCountPresets"
            :key="preset"
            class="preset-btn"
            :class="{ active: teamCount === preset }"
            @click="teamCount = preset"
          >{{ preset }}</button>
        </div>
      </div>

      <!-- ── Attendance Filter ─────────────────────────────────────────── -->
      <div class="form-row">
        <label class="checkbox-row">
          <input type="checkbox" v-model="useLatestAttendance" @change="loadStudents" />
          <span>{{ t('TEAM.anwesenheit') }}</span>
        </label>
      </div>

      <!-- ── Algorithm + Basis ─────────────────────────────────────────── -->
      <div class="form-row">
        <div class="form-group">
          <label>{{ t('TEAM.algorithm') }}</label>
          <select v-model="algorithm" class="form-input">
            <option value="random">{{ t('TEAM.algorithm-random') }}</option>
            <option value="gender-balanced">{{ t('TEAM.algorithm-gender-balanced') }}</option>
            <option value="homogeneous">{{ t('TEAM.algorithm-homogeneous') }}</option>
            <option value="heterogeneous">{{ t('TEAM.algorithm-heterogeneous') }}</option>
          </select>
        </div>
        <div v-if="showBasisSelector" class="form-group">
          <label>{{ t('TEAM.basis') }}</label>
          <select v-model="basis" class="form-input">
            <option value="performance">{{ t('TEAM.basis-performance') }}</option>
            <option value="performanceRating">{{ t('TEAM.basis-performance-rating') }}</option>
          </select>
        </div>
      </div>

      <!-- ── Roles ─────────────────────────────────────────────────────── -->
      <details class="expandable-section">
        <summary class="expandable-title">{{ t('TEAM.rollen') }}</summary>
        <div class="expandable-body">
          <p class="hint-text">{{ t('TEAM.rollen-hint') }}</p>
          <div class="form-row">
            <div class="form-group">
              <input
                v-model="rolesInput"
                type="text"
                class="form-input"
                :placeholder="t('TEAM.rollen-hint')"
              />
            </div>
          </div>
        </div>
      </details>

      <!-- ── Exclusion Rules ───────────────────────────────────────────── -->
      <details class="expandable-section" v-if="students.length > 0">
        <summary class="expandable-title">{{ t('TEAM.ausschlussregeln') }}</summary>
        <div class="expandable-body">
          <p class="hint-text">{{ t('TEAM.ausschlussregeln-hint') }}</p>

          <!-- Never Together Rules -->
          <div class="constraint-section">
            <h4 class="constraint-title">{{ t('TEAM.nie-zusammen') }}</h4>
            <div
              v-for="(rule, idx) in neverTogetherRules"
              :key="'never-' + idx"
              class="rule-row"
            >
              <div class="rule-students">
                <select
                  v-for="(sid, si) in rule"
                  :key="si"
                  v-model="neverTogetherRules[idx][si]"
                  class="form-input rule-select"
                >
                  <option value="">–</option>
                  <option v-for="s in students" :key="s.id" :value="s.id">
                    {{ s.firstName }} {{ s.lastName }}
                  </option>
                </select>
              </div>
              <button class="btn-icon" @click="removeConstraint('never', idx)" :title="t('TEAM.regel-entfernen')">✕</button>
            </div>
            <button class="btn-secondary btn-small" @click="addConstraint('never')">
              + {{ t('TEAM.regel-hinzufuegen') }}
            </button>
          </div>

          <!-- Always Together Rules -->
          <div class="constraint-section" style="margin-top: 1rem;">
            <h4 class="constraint-title">{{ t('TEAM.immer-zusammen') }}</h4>
            <div
              v-for="(rule, idx) in alwaysTogetherRules"
              :key="'always-' + idx"
              class="rule-row"
            >
              <div class="rule-students">
                <select
                  v-for="(sid, si) in rule"
                  :key="si"
                  v-model="alwaysTogetherRules[idx][si]"
                  class="form-input rule-select"
                >
                  <option value="">–</option>
                  <option v-for="s in students" :key="s.id" :value="s.id">
                    {{ s.firstName }} {{ s.lastName }}
                  </option>
                </select>
              </div>
              <button class="btn-icon" @click="removeConstraint('always', idx)" :title="t('TEAM.regel-entfernen')">✕</button>
            </div>
            <button class="btn-secondary btn-small" @click="addConstraint('always')">
              + {{ t('TEAM.regel-hinzufuegen') }}
            </button>
          </div>
        </div>
      </details>

      <!-- ── Warnings / Constraint Errors ─────────────────────────────── -->
      <div v-if="warning" class="warning-banner">{{ warning }}</div>
      <div v-if="constraintErrors.length > 0" class="error-banner">
        <strong>{{ t('TEAM.constraint-fehler') }}</strong>
        <p>{{ t('TEAM.constraint-fehler-detail') }}</p>
        <ul>
          <li v-for="(err, i) in constraintErrors" :key="i">{{ err }}</li>
        </ul>
      </div>

      <div class="form-actions">
        <button class="btn-primary" @click="generateTeams" :disabled="!canGenerate">
          {{ t('TEAM.erstellen') }}
        </button>
        <button class="btn-secondary" @click="clearTeams" :disabled="teams.length === 0">
          {{ t('TEAM.loeschen') }}
        </button>
      </div>
    </section>

    <!-- ── Generated Teams ──────────────────────────────────────────────── -->
    <section class="card" v-if="teams.length > 0">
      <div class="card-header">
        <h3>{{ t('TEAM.turniere') }}</h3>
      </div>
      <div class="teams-grid">
        <div v-for="team in teams" :key="team.id" class="team-card">
          <h4>{{ team.name }}</h4>
          <ul>
            <li v-for="student in team.students" :key="student.id" class="student-row">
              <span>{{ student.firstName }} {{ student.lastName }}</span>
              <span v-if="team.roles && team.roles[student.id]" class="role-badge">
                {{ team.roles[student.id] }}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div class="save-section">
        <div class="form-actions">
          <button class="btn-primary" @click="saveTeams" :disabled="!canSave">
            {{ t('TEAM.speichern') }}
          </button>
        </div>
        <div v-if="saveSuccess" class="success-banner">{{ t('TEAM.session-gespeichert') }}</div>
      </div>
    </section>

    <!-- ── Saved Sessions ───────────────────────────────────────────────── -->
    <section class="card" v-if="selectedClassId">
      <div class="card-header">
        <h3>{{ t('TEAM.gespeicherte-sessions') }}</h3>
      </div>
      <div v-if="savedSessions.length === 0" class="empty-hint">
        {{ t('TEAM.keine-sessions') }}
      </div>
      <div v-else class="sessions-list">
        <div v-for="session in savedSessions" :key="session.id" class="session-item">
          <div class="session-info">
            <span class="session-name">{{ session.sessionMetadata.sessionName }}</span>
            <span class="session-meta">
              {{ formatDate(session.createdAt) }} · {{ session.sessionMetadata.teams?.length }} {{ t('TEAM.anzahl') }}
            </span>
          </div>
          <button class="btn-secondary btn-small" @click="loadSession(session)">
            {{ t('TEAM.sitzung-laden') }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getSportBridge, initializeSportBridge } from '../composables/useSportBridge'
import { getStudentsBridge, initializeStudentsBridge } from '../composables/useStudentsBridge'
import { AttendanceStatus } from '@viccoboard/core'
import { TeamConstraintError } from '@viccoboard/sport'
import type { ClassGroup, Student, Sport } from '@viccoboard/core'
import type { TeamSessionMetadata, TeamAlgorithm, TeamBasis } from '@viccoboard/sport'

const { t } = useI18n()

initializeSportBridge()
initializeStudentsBridge()

const SportBridge = getSportBridge()
const studentsBridge = getStudentsBridge()

const classes = ref<ClassGroup[]>([])
const selectedClassId = ref('')
const students = ref<Student[]>([])
const teamCount = ref(2)
const teamLabel = ref('Team')
const useLatestAttendance = ref(false)
const algorithm = ref<TeamAlgorithm>('random')
const basis = ref<TeamBasis>('performance')
const sessionName = ref('')
const rolesInput = ref('')
const warning = ref('')
const constraintErrors = ref<string[]>([])
const saveSuccess = ref(false)
const savedSessions = ref<Sport.ToolSession[]>([])

// Constraint rules: each rule is an array of two student IDs
const neverTogetherRules = ref<string[][]>([])
const alwaysTogetherRules = ref<string[][]>([])

interface DisplayTeam {
  id: string
  name: string
  students: Student[]
  roles?: Record<string, string>
}

const teams = ref<DisplayTeam[]>([])

// ── Computed ───────────────────────────────────────────────────────────────

const maxTeamCount = computed(() => Math.max(2, Math.min(students.value.length, 12)))

const teamCountPresets = computed(() => {
  const n = students.value.length
  const presets: number[] = []
  for (const p of [2, 3, 4, 5, 6]) {
    if (p <= n) presets.push(p)
  }
  return presets.length > 0 ? presets : [2]
})

const showBasisSelector = computed(() =>
  algorithm.value === 'homogeneous' || algorithm.value === 'heterogeneous'
)

const parsedRoles = computed(() =>
  rolesInput.value
    .split(',')
    .map(r => r.trim())
    .filter(r => r.length > 0)
)

const canGenerate = computed(() =>
  Boolean(selectedClassId.value && students.value.length > 0 && teamCount.value >= 2)
)

const canSave = computed(() =>
  Boolean(teams.value.length > 0 && sessionName.value.trim().length > 0 && selectedClassId.value)
)

// ── Actions ────────────────────────────────────────────────────────────────

async function loadClasses() {
  classes.value = await SportBridge.classGroupRepository.findAll()
}

async function loadStudents() {
  warning.value = ''
  constraintErrors.value = []
  teams.value = []
  savedSessions.value = []

  if (!selectedClassId.value) {
    students.value = []
    return
  }

  const allStudents = await studentsBridge.studentRepository.findByClassGroup(selectedClassId.value)

  if (!useLatestAttendance.value) {
    students.value = allStudents
  } else {
    const lesson = await SportBridge.lessonRepository.getMostRecent(selectedClassId.value)
    if (!lesson) {
      warning.value = t('COMMON.error')
      students.value = allStudents
    } else {
      const attendance = await SportBridge.attendanceRepository.findByLesson(lesson.id)
      if (attendance.length === 0) {
        warning.value = t('COMMON.error')
        students.value = allStudents
      } else {
        const presentIds = attendance
          .filter(record => [AttendanceStatus.Present, AttendanceStatus.Passive].includes(record.status))
          .map(record => record.studentId)
        const filtered = allStudents.filter(student => presentIds.includes(student.id))
        if (filtered.length === 0) {
          warning.value = t('COMMON.error')
          students.value = allStudents
        } else {
          students.value = filtered
        }
      }
    }
  }

  await loadSavedSessions()
}

async function loadSavedSessions() {
  if (!selectedClassId.value) return
  const allSessions = await SportBridge.toolSessionRepository.findByClassGroup(selectedClassId.value)
  savedSessions.value = allSessions
    .filter(s => s.toolType === 'teams')
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

function addConstraint(type: 'never' | 'always') {
  const rule = ['', '']
  if (type === 'never') neverTogetherRules.value.push(rule)
  else alwaysTogetherRules.value.push(rule)
}

function removeConstraint(type: 'never' | 'always', idx: number) {
  if (type === 'never') neverTogetherRules.value.splice(idx, 1)
  else alwaysTogetherRules.value.splice(idx, 1)
}

function generateTeams() {
  if (!canGenerate.value) return

  warning.value = ''
  constraintErrors.value = []

  const validNever = neverTogetherRules.value
    .map(r => r.filter(id => id.length > 0))
    .filter(r => r.length >= 2)

  const validAlways = alwaysTogetherRules.value
    .map(r => r.filter(id => id.length > 0))
    .filter(r => r.length >= 2)

  try {
    const builtTeams = SportBridge.teamBuilderService.buildTeams({
      students: students.value.map(s => ({ id: s.id, gender: s.gender })),
      teamCount: teamCount.value,
      teamLabel: teamLabel.value,
      algorithm: algorithm.value,
      basis: basis.value,
      roles: parsedRoles.value,
      constraints: {
        neverTogether: validNever,
        alwaysTogether: validAlways
      }
    })

    const studentMap = new Map(students.value.map(s => [s.id, s]))
    teams.value = builtTeams.map(bt => ({
      id: bt.id,
      name: bt.name,
      students: bt.studentIds.map(id => studentMap.get(id)).filter((s): s is Student => s !== undefined),
      roles: bt.roles
    }))
  } catch (err) {
    if (err instanceof TeamConstraintError) {
      constraintErrors.value = err.conflicts.map(c => c.message)
    } else {
      warning.value = t('COMMON.error')
    }
    return
  }

  saveSuccess.value = false
}

async function saveTeams() {
  if (!canSave.value) return

  const validNever = neverTogetherRules.value
    .map(r => r.filter(id => id.length > 0))
    .filter(r => r.length >= 2)

  const validAlways = alwaysTogetherRules.value
    .map(r => r.filter(id => id.length > 0))
    .filter(r => r.length >= 2)

  try {
    await SportBridge.saveTeamAssignmentUseCase.execute({
      classGroupId: selectedClassId.value,
      sessionName: sessionName.value,
      algorithm: algorithm.value,
      basis: basis.value,
      teamLabel: teamLabel.value,
      roles: parsedRoles.value.length > 0 ? parsedRoles.value : undefined,
      constraints: (validNever.length > 0 || validAlways.length > 0)
        ? { neverTogether: validNever, alwaysTogether: validAlways }
        : undefined,
      teams: teams.value.map(t => ({
        id: t.id,
        name: t.name,
        studentIds: t.students.map(s => s.id),
        roles: t.roles
      }))
    })

    saveSuccess.value = true
    await loadSavedSessions()
  } catch {
    saveSuccess.value = false
    warning.value = t('COMMON.error')
  }
}

async function loadSession(session: Sport.ToolSession) {
  const meta = session.sessionMetadata as TeamSessionMetadata

  if (!meta?.teams) return

  algorithm.value = meta.algorithm ?? 'random'
  basis.value = meta.basis ?? 'performance'
  if (meta.teamLabel) teamLabel.value = meta.teamLabel
  teamCount.value = meta.teams.length
  rolesInput.value = meta.roles?.join(', ') ?? ''

  // Restore constraints
  if (meta.constraints?.neverTogether) {
    neverTogetherRules.value = meta.constraints.neverTogether.map(g => [...g])
  } else {
    neverTogetherRules.value = []
  }
  if (meta.constraints?.alwaysTogether) {
    alwaysTogetherRules.value = meta.constraints.alwaysTogether.map(g => [...g])
  } else {
    alwaysTogetherRules.value = []
  }

  const fullRoster = await studentsBridge.studentRepository.findByClassGroup(selectedClassId.value)
  const studentMap = new Map(fullRoster.map(s => [s.id, s]))

  const missingIds: string[] = []
  teams.value = meta.teams.map(t => ({
    id: t.id,
    name: t.name,
    students: t.studentIds.map(id => {
      const s = studentMap.get(id)
      if (!s) missingIds.push(id)
      return s
    }).filter((s): s is Student => s !== undefined),
    roles: t.roles
  }))

  if (missingIds.length > 0) {
    warning.value = t('COMMON.error')
  }

  saveSuccess.value = false
  sessionName.value = session.sessionMetadata.sessionName ?? ''
  constraintErrors.value = []
}

function clearTeams() {
  teams.value = []
  saveSuccess.value = false
  constraintErrors.value = []
}

function formatDate(date: Date): string {
  return date.toLocaleDateString()
}

loadClasses()
</script>

<style scoped>
.team-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.page-header {
  margin-bottom: 1.5rem;
}

.back-button {
  background: none;
  border: none;
  color: #0066cc;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem 0;
  min-height: 44px;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.card-header {
  margin-bottom: 1rem;
}

.card-header h3 {
  margin: 0;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-input {
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #ddd;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
}

/* ── Team count slider ── */
.slider-group {
  margin-bottom: 1rem;
}

.team-count-slider {
  width: 100%;
  accent-color: #667eea;
  height: 6px;
  cursor: pointer;
}

.slider-presets {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.preset-btn {
  padding: 0.3rem 0.75rem;
  border-radius: 6px;
  border: 2px solid #ddd;
  background: white;
  cursor: pointer;
  font-size: 0.875rem;
  min-height: 36px;
  transition: background 0.15s, border-color 0.15s;
}

.preset-btn.active {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

/* ── Expandable sections ── */
.expandable-section {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
}

.expandable-title {
  font-weight: 600;
  cursor: pointer;
  list-style: none;
  user-select: none;
}

.expandable-title::-webkit-details-marker {
  display: none;
}

.expandable-title::before {
  content: '▶ ';
  font-size: 0.75em;
}

details[open] .expandable-title::before {
  content: '▼ ';
}

.expandable-body {
  margin-top: 0.75rem;
}

.hint-text {
  font-size: 0.85rem;
  color: #666;
  margin: 0 0 0.5rem;
}

/* ── Constraint rules ── */
.constraint-section {
  /* spacing provided by parent */
}

.constraint-title {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
}

.rule-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.rule-students {
  display: flex;
  gap: 0.5rem;
  flex: 1;
  flex-wrap: wrap;
}

.rule-select {
  padding: 0.5rem;
  flex: 1;
  min-width: 140px;
}

.btn-icon {
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  padding: 0.4rem 0.6rem;
  color: #666;
  min-height: 36px;
  line-height: 1;
}

.btn-icon:hover {
  background: #ffeaea;
  border-color: #e00;
  color: #e00;
}

/* ── Action buttons ── */
.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  min-height: 44px;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  border: 2px solid #ddd;
  color: #333;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-small {
  padding: 0.4rem 0.9rem;
  min-height: 36px;
  font-size: 0.875rem;
}

/* ── Banners ── */
.warning-banner {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  background: #fff3cd;
  color: #856404;
  margin-bottom: 1rem;
}

.error-banner {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  background: #fdecea;
  color: #c0392b;
  margin-bottom: 1rem;
}

.error-banner ul {
  margin: 0.5rem 0 0;
  padding-left: 1.25rem;
}

.success-banner {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  background: #d4edda;
  color: #155724;
  margin-top: 0.75rem;
}

/* ── Teams grid ── */
.teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.team-card {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
}

.team-card h4 {
  margin: 0 0 0.75rem;
}

.team-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.student-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.25rem 0;
  gap: 0.5rem;
}

.role-badge {
  font-size: 0.75rem;
  background: #667eea;
  color: white;
  border-radius: 10px;
  padding: 0.15rem 0.5rem;
  white-space: nowrap;
}

/* ── Save section ── */
.save-section {
  margin-top: 1.5rem;
  border-top: 1px solid #eee;
  padding-top: 1rem;
}

/* ── Sessions list ── */
.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  gap: 1rem;
}

.session-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.session-name {
  font-weight: 600;
}

.session-meta {
  font-size: 0.8rem;
  color: #666;
}

.empty-hint {
  color: #888;
  padding: 1rem 0;
}

@media (max-width: 768px) {
  .form-actions {
    flex-direction: column;
  }

  .session-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .rule-students {
    flex-direction: column;
  }
}
</style>
