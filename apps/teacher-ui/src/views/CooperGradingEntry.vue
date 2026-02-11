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
          <label>{{ t('COOPER.sportart') }}</label>
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

      <div v-else-if="!selectedTableId" class="warning-banner">
        {{ t('COOPER.tabelle') }}: {{ t('COMMON.error') }}
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
        <button class="btn-primary" @click="saveAll" :disabled="saving || !selectedTableId || !selectedConfigId">
          {{ saving ? t('COMMON.loading') : t('COMMON.save') }}
        </button>
      </div>

      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
      <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
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

const { t } = useI18n()
const route = useRoute()

initializeSportBridge()
initializeStudentsBridge()

const sportBridge = getSportBridge()
const studentsBridge = getStudentsBridge()

const category = ref<Sport.GradeCategory | null>(null)
const students = ref<Student[]>([])
const tables = ref<Sport.TableDefinition[]>([])
const configs = ref<Sport.CooperTestConfig[]>([])
const selectedSportType = ref<Sport.CooperTestConfig['sportType']>('running')
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

function buildContext(student: Student): Record<string, unknown> {
  const genderShort = student.gender === 'male' ? 'm' : student.gender === 'female' ? 'w' : 'd'
  const age = student.birthYear ? new Date().getFullYear() - student.birthYear : undefined

  return {
    gender: genderShort,
    genderLong: student.gender,
    age,
    birthYear: student.birthYear,
    sportType: selectedSportType.value
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

  const distance = sportBridge.cooperTestService.calculateDistance(
    rounds,
    lapLengthMeters.value,
    extraMeters
  )

  entry.distanceMeters = distance

  if (selectedTable.value) {
    try {
      const student = students.value.find(s => s.id === studentId)
      if (student) {
        entry.grade = sportBridge.cooperTestService.calculateGradeFromTable(
          selectedTable.value,
          distance,
          buildContext(student)
        )
      }
    } catch (error) {
      entry.grade = undefined
    }
  }
}

function resetAll() {
  students.value.forEach(student => {
    results.value[student.id].rounds = 0
    results.value[student.id].extraMeters = 0
    recalculate(student.id)
  })
}

async function saveAll() {
  if (!category.value || !selectedTableId.value || !selectedConfigId.value) return

  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const entries = students.value.map(student => {
      const entry = results.value[student.id]
      if (!entry || entry.distanceMeters <= 0) return null

      return sportBridge.recordCooperTestResultUseCase.execute({
        studentId: student.id,
        categoryId: category.value!.id,
        configId: selectedConfigId.value,
        sportType: selectedSportType.value,
        rounds: entry.rounds,
        lapLengthMeters: lapLengthMeters.value,
        extraMeters: entry.extraMeters,
        calculatedGrade: entry.grade,
        tableId: selectedTableId.value
      })
    }).filter(Boolean) as Promise<any>[]

    if (entries.length === 0) {
      errorMessage.value = t('COMMON.error')
      return
    }

    await Promise.all(entries)
    successMessage.value = t('COMMON.success')
  } catch (error) {
    errorMessage.value = t('COMMON.error')
  } finally {
    saving.value = false
  }
}

async function handleTableChange() {
  if (!category.value) return
  const config = category.value.configuration as Sport.CooperGradingConfig

  if (selectedTableId.value && config.gradingTable !== selectedTableId.value) {
    await sportBridge.gradeCategoryRepository.update(category.value.id, {
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

  if (config.sportType !== selectedSportType.value) {
    await sportBridge.gradeCategoryRepository.update(category.value.id, {
      configuration: {
        ...config,
        sportType: selectedSportType.value
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

async function loadConfigs(sportType: Sport.CooperTestConfig['sportType']) {
  configs.value = await sportBridge.cooperTestConfigRepository.findBySportType(sportType)

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
    category.value = await sportBridge.gradeCategoryRepository.findById(categoryId)

    if (!category.value) {
      errorMessage.value = t('COMMON.error')
      loading.value = false
      return
    }

    students.value = await studentsBridge.studentRepository.findByClassGroup(category.value.classGroupId)
    tables.value = await sportBridge.tableDefinitionRepository.findAll()
    const existingEntries = await sportBridge.performanceEntryRepository.findByCategory(category.value.id)

    const config = category.value.configuration as Sport.CooperGradingConfig
    selectedTableId.value = config.gradingTable ?? ''
    selectedSportType.value = config.sportType ?? 'running'

    await loadConfigs(selectedSportType.value)

    const lapLengthFromEntry = existingEntries.find(entry => entry.measurements?.lapLengthMeters)?.measurements?.lapLengthMeters
    if (lapLengthFromEntry) {
      lapLengthMeters.value = Number(lapLengthFromEntry) || lapLengthMeters.value
    }

    initResults(existingEntries)
  } catch (error) {
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

@media (max-width: 768px) {
  .form-actions {
    flex-direction: column;
  }
}
</style>
