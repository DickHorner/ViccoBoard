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
          <label>{{ t('TEAM.geschlecht') }}</label>
          <select v-model="genderMode" class="form-input">
            <option value="mixed">{{ t('TEAM.gemischt') }}</option>
            <option value="separated">{{ t('TEAM.getrennt') }}</option>
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
        <div v-for="team in teams" :key="team.name" class="team-card">
          <h4>{{ team.name }}</h4>
          <ul>
            <li v-for="student in team.students" :key="student.id">
              {{ student.firstName }} {{ student.lastName }}
            </li>
          </ul>
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
import type { ClassGroup, Student } from '@viccoboard/core'

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
const genderMode = ref<'mixed' | 'separated'>('mixed')
const warning = ref('')

const teams = ref<Array<{ name: string; students: Student[] }>>([])

const canGenerate = computed(() => selectedClassId.value && students.value.length > 0 && teamCount.value >= 2)

async function loadClasses() {
  classes.value = await SportBridge.classGroupRepository.findAll()
}

async function loadStudents() {
  warning.value = ''
  teams.value = []

  if (!selectedClassId.value) {
    students.value = []
    return
  }

  const allStudents = await studentsBridge.studentRepository.findByClassGroup(selectedClassId.value)

  if (!useLatestAttendance.value) {
    students.value = allStudents
    return
  }

  const lesson = await SportBridge.lessonRepository.getMostRecent(selectedClassId.value)
  if (!lesson) {
    warning.value = t('COMMON.error')
    students.value = allStudents
    return
  }

  const attendance = await SportBridge.attendanceRepository.findByLesson(lesson.id)
  if (attendance.length === 0) {
    warning.value = t('COMMON.error')
    students.value = allStudents
    return
  }

  const presentIds = attendance
    .filter(record => [AttendanceStatus.Present, AttendanceStatus.Passive].includes(record.status))
    .map(record => record.studentId)

  const filtered = allStudents.filter(student => presentIds.includes(student.id))
  if (filtered.length === 0) {
    warning.value = t('COMMON.error')
    students.value = allStudents
    return
  }

  students.value = filtered
}

function shuffle<T>(input: T[]): T[] {
  const array = [...input]
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

function generateTeams() {
  if (!canGenerate.value) return

  const members = genderMode.value === 'separated'
    ? buildSeparatedTeams()
    : buildMixedTeams()

  teams.value = members
}

function buildMixedTeams(): Array<{ name: string; students: Student[] }> {
  const shuffled = shuffle(students.value)
  const result: Array<{ name: string; students: Student[] }> = Array.from({ length: teamCount.value }, (_, index) => ({
    name: `${teamLabel.value} ${index + 1}`,
    students: []
  }))

  shuffled.forEach((student, index) => {
    result[index % teamCount.value].students.push(student)
  })

  return result
}

function buildSeparatedTeams(): Array<{ name: string; students: Student[] }> {
  const males = students.value.filter(student => student.gender === 'male')
  const females = students.value.filter(student => student.gender === 'female')
  const others = students.value.filter(student => !student.gender)

  const mixed = [...shuffle(males), ...shuffle(females), ...shuffle(others)]

  const result: Array<{ name: string; students: Student[] }> = Array.from({ length: teamCount.value }, (_, index) => ({
    name: `${teamLabel.value} ${index + 1}`,
    students: []
  }))

  mixed.forEach((student, index) => {
    result[index % teamCount.value].students.push(student)
  })

  return result
}

function clearTeams() {
  teams.value = []
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

.btn-secondary {
  background: white;
  border: 2px solid #ddd;
  color: #333;
}

.warning-banner {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  background: #fff3cd;
  color: #856404;
  margin-bottom: 1rem;
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

@media (max-width: 768px) {
  .form-actions {
    flex-direction: column;
  }
}
</style>
