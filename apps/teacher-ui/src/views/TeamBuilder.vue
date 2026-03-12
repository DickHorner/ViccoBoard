<template>
  <div class="team-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← {{ t('COMMON.back') }}</button>
      <h2>{{ t('TEAM.team-erstellen') }}</h2>
      <p class="page-description">{{ t('TEAM.teams-klasse') }}</p>
    </div>

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
          <label>{{ t('TEAM.anzahl') }}</label>
          <input v-model.number="teamCount" type="number" min="2" class="form-input" />
        </div>
        <div class="form-group">
          <label>{{ t('TEAM.bezeichnung') }}</label>
          <input v-model="teamLabel" type="text" class="form-input" />
        </div>
      </div>

      <div class="form-row">
        <label class="checkbox-row">
          <input type="checkbox" v-model="useLatestAttendance" />
          <span>{{ t('TEAM.anwesenheit') }}</span>
        </label>
        <div class="form-group">
          <label>{{ t('TEAM.algorithm') }}</label>
          <select v-model="algorithm" class="form-input">
            <option value="random">{{ t('TEAM.algorithm-random') }}</option>
            <option value="gender-balanced">{{ t('TEAM.algorithm-gender-balanced') }}</option>
          </select>
        </div>
      </div>

      <div v-if="warning" class="warning-banner">{{ warning }}</div>

      <div class="form-actions">
        <button class="btn-primary" @click="generateTeams" :disabled="!canGenerate">
          {{ t('TEAM.erstellen') }}
        </button>
        <button class="btn-secondary" @click="clearTeams" :disabled="teams.length === 0">
          {{ t('TEAM.loeschen') }}
        </button>
      </div>
    </section>

    <section class="card" v-if="teams.length > 0">
      <div class="card-header">
        <h3>{{ t('TEAM.turniere') }}</h3>
      </div>
      <div class="teams-grid">
        <div v-for="team in teams" :key="team.id" class="team-card">
          <h4>{{ team.name }}</h4>
          <ul>
            <li v-for="student in team.students" :key="student.id">
              {{ student.firstName }} {{ student.lastName }}
            </li>
          </ul>
        </div>
      </div>

      <div class="save-section">
        <div class="form-group">
          <label>{{ t('TEAM.session-name') }}</label>
          <input v-model="sessionName" type="text" class="form-input" :placeholder="t('TEAM.session-name')" />
        </div>
        <div class="form-actions">
          <button class="btn-primary" @click="saveTeams" :disabled="!canSave">
            {{ t('TEAM.speichern') }}
          </button>
        </div>
        <div v-if="saveSuccess" class="success-banner">{{ t('TEAM.session-gespeichert') }}</div>
      </div>
    </section>

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
            <span class="session-meta">{{ formatDate(session.createdAt) }} · {{ session.sessionMetadata.teams?.length }} {{ t('TEAM.anzahl') }}</span>
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
import type { ClassGroup, Student, Sport } from '@viccoboard/core'
import type { TeamSessionMetadata } from '@viccoboard/sport'

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
const algorithm = ref<'random' | 'gender-balanced'>('random')
const sessionName = ref('')
const warning = ref('')
const saveSuccess = ref(false)
const savedSessions = ref<Sport.ToolSession[]>([])

interface DisplayTeam {
  id: string
  name: string
  students: Student[]
}

const teams = ref<DisplayTeam[]>([])

const canGenerate = computed(() => Boolean(selectedClassId.value && students.value.length > 0 && teamCount.value >= 2))
const canSave = computed(() => Boolean(teams.value.length > 0 && sessionName.value.trim().length > 0 && selectedClassId.value))

async function loadClasses() {
  classes.value = await SportBridge.classGroupRepository.findAll()
}

async function loadStudents() {
  warning.value = ''
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

function generateTeams() {
  if (!canGenerate.value) return

  const builtTeams = SportBridge.teamBuilderService.buildTeams({
    students: students.value.map(s => ({ id: s.id, gender: s.gender })),
    teamCount: teamCount.value,
    teamLabel: teamLabel.value,
    algorithm: algorithm.value
  })

  // Map built teams back to display teams with full student objects
  const studentMap = new Map(students.value.map(s => [s.id, s]))
  teams.value = builtTeams.map(bt => ({
    id: bt.id,
    name: bt.name,
    students: bt.studentIds.map(id => studentMap.get(id)).filter((s): s is Student => s !== undefined)
  }))

  saveSuccess.value = false
  sessionName.value = ''
}

async function saveTeams() {
  if (!canSave.value) return

  try {
    await SportBridge.saveTeamAssignmentUseCase.execute({
      classGroupId: selectedClassId.value,
      sessionName: sessionName.value,
      algorithm: algorithm.value,
      teamLabel: teamLabel.value,
      teams: teams.value.map(t => ({
        id: t.id,
        name: t.name,
        studentIds: t.students.map(s => s.id)
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
  if (meta.teamLabel) teamLabel.value = meta.teamLabel
  teamCount.value = meta.teams.length

  // Always resolve against the full class roster so that students filtered out
  // by attendance are still shown when a saved session is reopened.
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
    }).filter((s): s is Student => s !== undefined)
  }))

  if (missingIds.length > 0) {
    warning.value = t('COMMON.error')
  }

  saveSuccess.value = false
  sessionName.value = session.sessionMetadata.sessionName ?? ''
}

function clearTeams() {
  teams.value = []
  saveSuccess.value = false
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

.form-actions {
  display: flex;
  gap: 1rem;
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

.warning-banner {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  background: #fff3cd;
  color: #856404;
  margin-bottom: 1rem;
}

.success-banner {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  background: #d4edda;
  color: #155724;
  margin-top: 0.75rem;
}

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

.team-card li {
  padding: 0.25rem 0;
}

.save-section {
  margin-top: 1.5rem;
  border-top: 1px solid #eee;
  padding-top: 1rem;
}

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
}
</style>

