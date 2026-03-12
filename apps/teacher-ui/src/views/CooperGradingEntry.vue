<template>
  <div class="cooper-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← {{ t('COMMON.back') }}</button>
      <h2>{{ t('COOPER.bewerte-cooper') }} {{ currentDate }}</h2>
      <p class="page-description">{{ t('COOPER.tabelle') }}</p>
    </div>

    <section class="card" v-if="loading">
      <div class="loading-state">
        <div class="spinner"></div>
        <p>{{ t('COMMON.loading') }}</p>
      </div>
    </section>

    <section v-else-if="category" class="card">
      <div class="config-row">
        <div class="form-group">
          <label>{{ t('COOPER.Sportart') }}</label>
          <select v-model="selectedSportType" class="form-input" @change="handleSportTypeChange">
            <option value="running">{{ t('COOPER.running') }}</option>
            <option value="swimming">{{ t('COOPER.swimming') }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ t('COOPER.config') }}</label>
          <select v-model="selectedConfigId" class="form-input" @change="handleConfigChange">
            <option value="">{{ t('COOPER.config') }}...</option>
            <option v-for="config in configs" :key="config.id" :value="config.id">
              {{ config.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ t('COOPER.tabelle') }}</label>
          <select v-model="selectedTableId" class="form-input" @change="handleTableChange">
            <option value="">{{ t('COOPER.tabelle') }}...</option>
            <option v-for="table in tables" :key="table.id" :value="table.id">
              {{ table.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ t('COOPER.bahn') }} ({{ t('COOPER.meter') }})</label>
          <input v-model.number="lapLengthMeters" type="number" min="1" class="form-input" />
        </div>
      </div>

      <div v-if="!selectedConfigId" class="warning-banner">
        {{ t('COOPER.config') }}: {{ t('COMMON.error') }}
      </div>

      <div class="table-wrapper" v-if="students.length > 0">
        <table class="cooper-table">
          <thead>
            <tr>
              <th>{{ t('SCHUELER.schueler') }}</th>
              <th>{{ t('COOPER.runden') }}</th>
              <th>{{ t('COOPER.bahn') }}</th>
              <th>{{ t('COOPER.gesamt') }} ({{ t('COOPER.meter') }})</th>
              <th>{{ t('COOPER.note') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in students" :key="student.id">
              <td class="student-name">{{ student.firstName }} {{ student.lastName }}</td>
              <td>
                <input
                  v-model.number="results[student.id].rounds"
                  type="number"
                  min="0"
                  class="table-input"
                  @input="recalculate(student.id)"
                />
              </td>
              <td>
                <input
                  v-model.number="results[student.id].extraMeters"
                  type="number"
                  min="0"
                  class="table-input"
                  @input="recalculate(student.id)"
                />
              </td>
              <td>{{ results[student.id].distanceMeters }}</td>
              <td class="grade-cell">{{ results[student.id].grade ?? '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="form-actions">
        <button class="btn-secondary" @click="resetAll" :disabled="saving">
          {{ t('COOPER.noten-neu') }}
        </button>
        <button class="btn-primary" @click="saveAll" :disabled="saving || !selectedConfigId">
          {{ saving ? t('COMMON.loading') : t('COMMON.save') }}
        </button>
      </div>

      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
      <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
    </section>

    <!-- Session History -->
    <section v-if="category && pastSessions.length > 0" class="card history-card">
      <h3>{{ t('COOPER.session-history') }}</h3>
      <div class="session-list">
        <div
          v-for="session in pastSessions"
          :key="session.id"
          class="session-item"
          :class="{ 'session-item--active': activeSessionId === session.id }"
        >
          <div class="session-info">
            <span class="session-date">{{ formatSessionDate(session.startedAt) }}</span>
            <span class="session-meta">
              {{ sessionSportType(session) }} ·
              {{ t('COOPER.session-count', { count: sessionEntryCount(session) }) }}
            </span>
          </div>
          <button
            class="btn-secondary btn-small"
            @click="loadSession(session)"
            :disabled="saving"
          >
            {{ t('COOPER.session-load') }}
          </button>
        </div>
      </div>
    </section>

    <section v-else-if="category" class="card history-card">
      <h3>{{ t('COOPER.session-history') }}</h3>
      <p class="empty-state">{{ t('COOPER.no-sessions') }}</p>
    </section>

    <section v-else class="card">
      <p class="empty-state">{{ t('COMMON.error') }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getSportBridge, initializeSportBridge } from '../composables/useSportBridge'
import { getStudentsBridge, initializeStudentsBridge } from '../composables/useStudentsBridge'
import type { Student, Sport } from '@viccoboard/core'
import type { CooperSessionMetadata } from '@viccoboard/sport'

const { t } = useI18n()
const route = useRoute()

initializeSportBridge()
initializeStudentsBridge()

const SportBridge = getSportBridge()
const studentsBridge = getStudentsBridge()

const category = ref<Sport.GradeCategory | null>(null)
const students = ref<Student[]>([])
const tables = ref<Sport.TableDefinition[]>([])
const configs = ref<Sport.CooperTestConfig[]>([])
const pastSessions = ref<Sport.ToolSession[]>([])
const activeSessionId = ref<string | null>(null)
const selectedSportType = ref<Sport.CooperTestConfig['SportType']>('running')
const selectedConfigId = ref('')
const selectedTableId = ref('')
const lapLengthMeters = ref(400)
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

interface CooperResult {
  rounds: number
  extraMeters: number
  distanceMeters: number
  grade?: string | number
}

const results = ref<Record<string, CooperResult>>({})

const currentDate = computed(() => {
  return new Date().toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const selectedTable = computed(() =>
  tables.value.find(table => table.id === selectedTableId.value) || null
)

const selectedConfig = computed(() =>
  configs.value.find(config => config.id === selectedConfigId.value) || null
)

function sessionIdOf(entry: Sport.PerformanceEntry): string | undefined {
  return (entry.metadata as Record<string, unknown>)?.sessionId as string | undefined
}

function buildContext(student: Student): Record<string, unknown> {
  const genderShort = student.gender === 'male' ? 'm' : student.gender === 'female' ? 'w' : 'd'
  const age = student.birthYear ? new Date().getFullYear() - student.birthYear : undefined

  return {
    gender: genderShort,
    genderLong: student.gender,
    age,
    birthYear: student.birthYear,
    SportType: selectedSportType.value
  }
}

function initResults(existingEntries: Sport.PerformanceEntry[] = []) {
  const initial: Record<string, CooperResult> = {}
  students.value.forEach(student => {
    const entry = existingEntries.find(item => item.studentId === student.id)
    const measurements = entry?.measurements || {}
    const rounds = Number(measurements.rounds) || 0
    const extraMeters = Number(measurements.extraMeters) || 0
    const distanceMeters = Number(measurements.distanceMeters) || 0

    initial[student.id] = {
      rounds,
      extraMeters,
      distanceMeters,
      grade: entry?.calculatedGrade
    }
  })
  results.value = initial
}

function recalculate(studentId: string) {
  const entry = results.value[studentId]
  if (!entry) return

  const rounds = Number(entry.rounds) || 0
  const extraMeters = Number(entry.extraMeters) || 0

  const distance = SportBridge.cooperTestService.calculateDistance(
    rounds,
    lapLengthMeters.value,
    extraMeters
  )

  entry.distanceMeters = distance

  if (selectedTable.value) {
    try {
      const student = students.value.find(s => s.id === studentId)
      if (student) {
        entry.grade = SportBridge.cooperTestService.calculateGradeFromTable(
          selectedTable.value,
          distance,
          buildContext(student)
        )
      }
    } catch {
      entry.grade = undefined
    }
  } else {
    entry.grade = undefined
  }
}

function resetAll() {
  students.value.forEach(student => {
    results.value[student.id].rounds = 0
    results.value[student.id].extraMeters = 0
    recalculate(student.id)
  })
  activeSessionId.value = null
}

async function saveAll() {
  if (!category.value || !selectedConfigId.value) return

  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const activeEntries = students.value
      .filter(student => {
        const entry = results.value[student.id]
        return entry && entry.distanceMeters > 0
      })
      .map(student => {
        const entry = results.value[student.id]
        return {
          studentId: student.id,
          rounds: entry.rounds,
          lapLengthMeters: lapLengthMeters.value,
          extraMeters: entry.extraMeters,
          distanceMeters: entry.distanceMeters,
          calculatedGrade: entry.grade
        }
      })

    if (activeEntries.length === 0) {
      errorMessage.value = t('COMMON.error')
      return
    }

    const session = await SportBridge.saveCooperSessionUseCase.execute({
      classGroupId: category.value.classGroupId,
      categoryId: category.value.id,
      SportType: selectedSportType.value,
      configId: selectedConfigId.value,
      tableId: selectedTableId.value || undefined,
      lapLengthMeters: lapLengthMeters.value,
      entries: activeEntries
    })

    activeSessionId.value = session.id
    successMessage.value = t('COMMON.success')
    await loadPastSessions()
  } catch (error) {
    errorMessage.value = t('COMMON.error')
  } finally {
    saving.value = false
  }
}

async function loadPastSessions() {
  if (!category.value) return
  const allSessions = await SportBridge.toolSessionRepository.findByClassGroup(
    category.value.classGroupId
  )
  pastSessions.value = allSessions
    .filter(
      s =>
        s.toolType === 'cooper-test' &&
        (s.sessionMetadata as CooperSessionMetadata).categoryId === category.value!.id
    )
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
}

async function loadSession(session: Sport.ToolSession) {
  const meta = session.sessionMetadata as CooperSessionMetadata
  if (!meta) return

  // Restore config from session
  selectedSportType.value = meta.SportType ?? selectedSportType.value
  selectedTableId.value = meta.tableId ?? ''
  lapLengthMeters.value = meta.lapLengthMeters ?? lapLengthMeters.value

  await loadConfigs(selectedSportType.value)
  if (meta.configId) {
    selectedConfigId.value = meta.configId
  }

  // Restore student entries from performance entries tagged with this session
  const allEntries = await SportBridge.performanceEntryRepository.findByCategory(category.value!.id)
  const sessionEntries = allEntries.filter(
    e => sessionIdOf(e) === session.id
  )

  initResults(sessionEntries)
  activeSessionId.value = session.id
}

function sessionSportType(session: Sport.ToolSession): string {
  const meta = session.sessionMetadata as CooperSessionMetadata
  if (!meta?.SportType) return ''
  return meta.SportType === 'running' ? t('COOPER.running') : t('COOPER.swimming')
}

function sessionEntryCount(session: Sport.ToolSession): number {
  const meta = session.sessionMetadata as CooperSessionMetadata
  return meta?.entryCount ?? 0
}

function formatSessionDate(date: Date): string {
  return new Date(date).toLocaleDateString('de-DE', {
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

async function handleTableChange() {
  if (!category.value) return
  const config = category.value.configuration as Sport.CooperGradingConfig

  if (selectedTableId.value && config.gradingTable !== selectedTableId.value) {
    await SportBridge.gradeCategoryRepository.update(category.value.id, {
      configuration: {
        ...config,
        gradingTable: selectedTableId.value
      }
    })
  }

  students.value.forEach(student => recalculate(student.id))
}

async function handleSportTypeChange() {
  if (!category.value) return
  const config = category.value.configuration as Sport.CooperGradingConfig

  if (config.SportType !== selectedSportType.value) {
    await SportBridge.gradeCategoryRepository.update(category.value.id, {
      configuration: {
        ...config,
        SportType: selectedSportType.value
      }
    })
  }

  await loadConfigs(selectedSportType.value)
  students.value.forEach(student => recalculate(student.id))
}

async function handleConfigChange() {
  const config = selectedConfig.value
  if (!config) return

  if (Number.isFinite(config.lapLengthMeters)) {
    lapLengthMeters.value = config.lapLengthMeters
  }

  if (!selectedTableId.value && config.gradingTableId) {
    selectedTableId.value = config.gradingTableId
  }

  students.value.forEach(student => recalculate(student.id))
}

async function loadConfigs(SportType: Sport.CooperTestConfig['SportType']) {
  configs.value = await SportBridge.cooperTestConfigRepository.findBySportType(SportType)

  if (selectedConfigId.value) {
    const stillAvailable = configs.value.some(config => config.id === selectedConfigId.value)
    if (!stillAvailable) {
      selectedConfigId.value = ''
    }
  }

  if (!selectedConfigId.value && configs.value.length > 0) {
    selectedConfigId.value = configs.value[0].id
  }

  const activeConfig = configs.value.find(config => config.id === selectedConfigId.value)
  if (activeConfig && Number.isFinite(activeConfig.lapLengthMeters)) {
    lapLengthMeters.value = activeConfig.lapLengthMeters
  }
}

onMounted(async () => {
  try {
    const categoryId = route.params.id as string
    category.value = await SportBridge.gradeCategoryRepository.findById(categoryId)

    if (!category.value) {
      errorMessage.value = t('COMMON.error')
      loading.value = false
      return
    }

    students.value = await studentsBridge.studentRepository.findByClassGroup(
      category.value.classGroupId
    )
    tables.value = await SportBridge.tableDefinitionRepository.findAll()

    const config = category.value.configuration as Sport.CooperGradingConfig
    selectedTableId.value = config.gradingTable ?? ''
    selectedSportType.value = config.SportType ?? 'running'

    await loadConfigs(selectedSportType.value)
    await loadPastSessions()

    // Pre-fill with the most recent session's entries (if any)
    if (pastSessions.value.length > 0) {
      const latest = pastSessions.value[0]
      const meta = latest.sessionMetadata as CooperSessionMetadata
      if (meta.lapLengthMeters) {
        lapLengthMeters.value = meta.lapLengthMeters
      }
      if (meta.configId) {
        selectedConfigId.value = meta.configId
      }
      if (meta.tableId) {
        selectedTableId.value = meta.tableId
      }
      const allEntries = await SportBridge.performanceEntryRepository.findByCategory(
        category.value.id
      )
      const sessionEntries = allEntries.filter(
        e => sessionIdOf(e) === latest.id
      )
      initResults(sessionEntries)
      activeSessionId.value = latest.id
    } else {
      // Legacy: load latest entries even if they have no session tag
      const existingEntries = await SportBridge.performanceEntryRepository.findByCategory(
        category.value.id
      )
      const lapLengthFromEntry = existingEntries.find(
        entry => entry.measurements?.lapLengthMeters
      )?.measurements?.lapLengthMeters
      if (lapLengthFromEntry) {
        lapLengthMeters.value = Number(lapLengthFromEntry) || lapLengthMeters.value
      }
      initResults(existingEntries)
    }
  } catch {
    errorMessage.value = t('COMMON.error')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.cooper-view {
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

.history-card {
  margin-top: 0;
}

.config-row {
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

.warning-banner {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  background: #fff3cd;
  color: #856404;
  margin-bottom: 1rem;
}

.table-wrapper {
  overflow-x: auto;
}

.cooper-table {
  width: 100%;
  border-collapse: collapse;
}

.cooper-table th,
.cooper-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
  text-align: left;
}

.student-name {
  font-weight: 600;
}

.table-input {
  width: 100%;
  min-width: 80px;
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid #ddd;
}

.grade-cell {
  font-weight: 700;
}

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

.btn-secondary {
  background: white;
  border: 2px solid #ddd;
  color: #333;
}

.btn-small {
  padding: 0.4rem 0.8rem;
  font-size: 0.875rem;
  min-height: 36px;
}

.session-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border: 1px solid #eee;
  border-radius: 6px;
  background: #fafafa;
}

.session-item--active {
  border-color: #667eea;
  background: #f0f2ff;
}

.session-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.session-date {
  font-weight: 600;
  font-size: 0.95rem;
}

.session-meta {
  font-size: 0.85rem;
  color: #666;
}

.loading-state {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 6px;
  background: #ffebee;
  color: #c62828;
}

.success-message {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 6px;
  background: #e8f5e9;
  color: #2e7d32;
}

.empty-state {
  color: #666;
  font-style: italic;
}

@media (max-width: 768px) {
  .form-actions {
    flex-direction: column;
  }
}
</style>

