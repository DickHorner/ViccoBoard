<template>
  <div class="shuttle-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← {{ t('COMMON.back') }}</button>
      <h2>{{ t('SHUTTLE.bewerte-shuttle') }} {{ currentDate }}</h2>
      <p class="page-description">{{ t('SHUTTLE.tabelle') }}</p>
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
          <label>{{ t('SHUTTLE.tabelle') }}</label>
          <select v-model="selectedTableId" class="form-input" @change="handleConfigChange">
            <option value="">{{ t('SHUTTLE.tabelle') }}...</option>
            <option v-for="table in tables" :key="table.id" :value="table.id">
              {{ table.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ t('SHUTTLE.stufe') }}</label>
          <select v-model="selectedConfigId" class="form-input" @change="handleConfigChange">
            <option value="">{{ t('SHUTTLE.level') }}...</option>
            <option v-for="config in configs" :key="config.id" :value="config.id">
              {{ config.name }}
            </option>
          </select>
        </div>
      </div>

      <div v-if="!selectedTableId || !selectedConfigId" class="warning-banner">
        {{ t('COMMON.error') }}
      </div>

      <div class="table-wrapper" v-if="students.length > 0">
        <table class="shuttle-table">
          <thead>
            <tr>
              <th>{{ t('SCHUELER.schueler') }}</th>
              <th>{{ t('SHUTTLE.level') }}</th>
              <th>{{ t('SHUTTLE.bahn') }}</th>
              <th>{{ t('SHUTTLE.note') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in students" :key="student.id">
              <td class="student-name">{{ student.firstName }} {{ student.lastName }}</td>
              <td>
                <select
                  v-model.number="results[student.id].level"
                  class="table-input"
                  :disabled="!selectedConfig"
                  @change="recalculate(student.id)"
                >
                  <option value="">{{ t('SHUTTLE.level') }}</option>
                  <option v-for="level in availableLevels" :key="level" :value="level">
                    {{ level }}
                  </option>
                </select>
              </td>
              <td>
                <select
                  v-model.number="results[student.id].lane"
                  class="table-input"
                  :disabled="!selectedConfig || !results[student.id].level"
                  @change="recalculate(student.id)"
                >
                  <option value="">{{ t('SHUTTLE.bahn') }}</option>
                  <option v-for="lane in availableLanes(results[student.id].level)" :key="lane" :value="lane">
                    {{ lane }}
                  </option>
                </select>
              </td>
              <td class="grade-cell">{{ results[student.id].grade ?? '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="form-actions">
        <button class="btn-secondary" @click="resetAll" :disabled="saving">
          {{ t('SHUTTLE.noten-neu') }}
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
const configs = ref<Sport.ShuttleRunConfig[]>([])
const selectedTableId = ref('')
const selectedConfigId = ref('')
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

interface ShuttleResult {
  level: number | ''
  lane: number | ''
  grade?: string | number
}

const results = ref<Record<string, ShuttleResult>>({})

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

const availableLevels = computed(() => {
  if (!selectedConfig.value) return []
  const levels = selectedConfig.value.levels.map(level => level.level)
  return Array.from(new Set(levels)).sort((a, b) => a - b)
})

function availableLanes(level: number | ''): number[] {
  if (!selectedConfig.value || level === '') return []
  return selectedConfig.value.levels
    .filter(entry => entry.level === level)
    .map(entry => entry.lane)
    .sort((a, b) => a - b)
}

function initResults(existingEntries: Sport.PerformanceEntry[] = []) {
  const initial: Record<string, ShuttleResult> = {}
  students.value.forEach(student => {
    const entry = existingEntries.find(item => item.studentId === student.id)
    const measurements = entry?.measurements || {}

    initial[student.id] = {
      level: Number(measurements.level) || '',
      lane: Number(measurements.lane) || '',
      grade: entry?.calculatedGrade
    }
  })
  results.value = initial
}

function recalculate(studentId: string) {
  const entry = results.value[studentId]
  if (!entry || entry.level === '' || entry.lane === '') {
    entry.grade = undefined
    return
  }

  if (selectedTable.value) {
    try {
      entry.grade = sportBridge.shuttleRunService.calculateGradeFromTable(
        selectedTable.value,
        entry.level,
        entry.lane
      )
    } catch (error) {
      entry.grade = undefined
    }
  }
}

function resetAll() {
  students.value.forEach(student => {
    results.value[student.id].level = ''
    results.value[student.id].lane = ''
    results.value[student.id].grade = undefined
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
      if (!entry || entry.level === '' || entry.lane === '') return null

      return sportBridge.recordGradeUseCase.execute({
        studentId: student.id,
        categoryId: category.value!.id,
        measurements: {
          level: entry.level,
          lane: entry.lane,
          configId: selectedConfigId.value,
          gradingTable: selectedTableId.value
        },
        calculatedGrade: entry.grade
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

async function handleConfigChange() {
  if (!category.value) return
  const config = category.value.configuration as Sport.ShuttleGradingConfig

  await sportBridge.gradeCategoryRepository.update(category.value.id, {
    configuration: {
      ...config,
      gradingTable: selectedTableId.value || undefined,
      configId: selectedConfigId.value || undefined
    }
  })

  students.value.forEach(student => recalculate(student.id))
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
    configs.value = await sportBridge.shuttleRunConfigRepository.findAll()
    const existingEntries = await sportBridge.performanceEntryRepository.findByCategory(category.value.id)

    const config = category.value.configuration as Sport.ShuttleGradingConfig
    selectedTableId.value = config.gradingTable ?? ''
    selectedConfigId.value = config.configId ?? ''

    initResults(existingEntries)
  } catch (error) {
    errorMessage.value = t('COMMON.error')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.shuttle-view {
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

.shuttle-table {
  width: 100%;
  border-collapse: collapse;
}

.shuttle-table th,
.shuttle-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
  text-align: left;
}

.student-name {
  font-weight: 600;
}

.table-input {
  width: 100%;
  min-width: 90px;
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
