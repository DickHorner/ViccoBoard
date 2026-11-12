<template>
  <div class="time-grading-view">
    <div class="page-header">
      <button class="back-button" @click="router.back()">← Zurück</button>
      <h2>{{ category?.name || 'Messwertbewertung' }}</h2>
      <p class="page-description">
        Messwerte erfassen und über eine Bewertungstabelle automatisch in Noten umrechnen.
      </p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Daten werden geladen...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-primary" @click="loadData">Erneut versuchen</button>
    </div>

    <div v-else-if="category" class="grading-content">
      <section class="card">
        <div class="card-header">
          <h3>Bewertung konfigurieren</h3>
          <button class="btn-secondary btn-small" @click="router.push('/grading/tables')">
            Tabellen verwalten
          </button>
        </div>

        <div class="info-grid">
          <div class="form-group">
            <label for="measurement-label">Messwert</label>
            <input
              id="measurement-label"
              v-model="measurementLabel"
              class="time-input"
              type="text"
              maxlength="80"
              placeholder="z. B. Korbtreffer"
            />
          </div>

          <div class="form-group">
            <label for="measurement-type">Eingabeart</label>
            <select id="measurement-type" v-model="measurementType" class="form-select" @change="recalculateAll">
              <option value="number">Zahl</option>
              <option value="time">Zeit</option>
            </select>
          </div>

          <div class="form-group">
            <label for="measurement-unit">Einheit</label>
            <input
              id="measurement-unit"
              v-model="measurementUnit"
              class="time-input"
              type="text"
              maxlength="30"
              placeholder="z. B. Treffer oder s"
            />
          </div>

          <div class="form-group">
            <label for="grading-table">Bewertungstabelle</label>
            <select id="grading-table" v-model="selectedTableId" class="form-select" @change="recalculateAll">
              <option value="">Tabelle auswählen...</option>
              <option v-for="table in tables" :key="table.id" :value="table.id">
                {{ table.name }}{{ table.active === false ? ' (inaktiv)' : '' }}
              </option>
            </select>
          </div>
        </div>

        <p class="info-note">
          Zahlen-Tabellen verwenden z. B. <code>minValue,maxValue,value</code>;
          Zeit-Tabellen <code>minTime,maxTime,value</code>. Die Spalte <code>value</code>
          enthält die Note. Zusätzliche Spalten wie <code>gender</code> oder <code>age</code>
          werden beim Schülerabgleich berücksichtigt.
        </p>

        <button class="btn-primary btn-small" :disabled="savingConfig" @click="saveConfiguration">
          {{ savingConfig ? 'Speichern...' : 'Konfiguration speichern' }}
        </button>
      </section>

      <section v-if="students.length > 0" class="card">
        <div class="card-header">
          <h3>Leistungen</h3>
          <button
            class="btn-primary btn-small"
            :disabled="saving || dirtyStudents.size === 0 || !selectedTableId"
            @click="saveAll"
          >
            {{ saving ? 'Speichern...' : 'Alle Änderungen speichern' }}
          </button>
        </div>

        <p class="info-note">
          {{ measurementType === 'time'
            ? 'Zeit als SS,cc oder MM:SS,cc eingeben, z. B. 12,84.'
            : 'Messwert als Zahl eingeben; Dezimalkomma wird unterstützt.' }}
        </p>

        <div class="time-table-wrapper">
          <table class="time-table">
            <thead>
              <tr>
                <th class="student-col">Schüler</th>
                <th class="time-col">{{ measurementLabel || 'Messwert' }}</th>
                <th v-if="measurementUnit" class="seconds-col">Einheit</th>
                <th class="grade-col">Note</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="student in students"
                :key="student.id"
                :class="{ 'highlight-row': dirtyStudents.has(student.id) }"
              >
                <td class="student-name">{{ student.firstName }} {{ student.lastName }}</td>
                <td class="input-cell">
                  <input
                    class="time-input"
                    :value="values.get(student.id) || ''"
                    :placeholder="measurementType === 'time' ? '12,84' : '0'"
                    inputmode="decimal"
                    :disabled="saving"
                    @input="onValueChange(student, ($event.target as HTMLInputElement).value)"
                  />
                </td>
                <td v-if="measurementUnit" class="seconds-cell">{{ measurementUnit }}</td>
                <td class="grade-cell">
                  <span v-if="grades.has(student.id)" class="calculated-grade">
                    {{ formatGrade(grades.get(student.id)) }}
                  </span>
                  <span v-else class="grade-missing">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-else class="card">
        <div class="empty-state">
          <p>Keine Schüler in dieser Klasse gefunden.</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { calculateAgeFromDateOfBirth, type Sport, type Student } from '@viccoboard/core'

import {
  getSportBridge,
  initializeSportBridge
} from '../composables/useSportBridge'
import {
  getStudentsBridge,
  initializeStudentsBridge
} from '../composables/useStudentsBridge'
import { useToast } from '../composables/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()

initializeSportBridge()
initializeStudentsBridge()

const sportBridge = getSportBridge()
const studentsBridge = getStudentsBridge()

const categoryId = route.params.id as string
const category = ref<Sport.GradeCategory | null>(null)
const students = ref<Student[]>([])
const tables = ref<Sport.TableDefinition[]>([])
const selectedTableId = ref('')
const measurementType = ref<'number' | 'time'>('number')
const measurementLabel = ref('Leistung')
const measurementUnit = ref('')
const values = ref<Map<string, string>>(new Map())
const grades = ref<Map<string, string | number>>(new Map())
const dirtyStudents = ref<Set<string>>(new Set())
const loading = ref(true)
const saving = ref(false)
const savingConfig = ref(false)
const error = ref<string | null>(null)

onMounted(loadData)

async function loadData(): Promise<void> {
  loading.value = true
  error.value = null

  try {
    const loadedCategory = await sportBridge.gradeCategoryRepository.findById(categoryId)
    if (!loadedCategory || loadedCategory.type !== 'performance') {
      error.value = 'Bewertungskategorie nicht gefunden.'
      return
    }

    category.value = loadedCategory
    const config = loadedCategory.configuration as Sport.PerformanceGradingConfig
    selectedTableId.value = config.gradingTable ?? ''
    measurementType.value = config.measurementType
    measurementLabel.value = config.measurementLabel
    measurementUnit.value = config.unit ?? ''

    const [loadedStudents, loadedTables, entries] = await Promise.all([
      studentsBridge.studentRepository.findByClassGroup(loadedCategory.classGroupId),
      sportBridge.tableDefinitionRepository.findAll(),
      sportBridge.performanceEntryRepository.findByCategory(categoryId)
    ])

    students.value = loadedStudents
    tables.value = loadedTables

    const latestByStudent = new Map<string, Sport.PerformanceEntry>()
    for (const entry of entries) {
      const current = latestByStudent.get(entry.studentId)
      if (!current || entry.timestamp.getTime() > current.timestamp.getTime()) {
        latestByStudent.set(entry.studentId, entry)
      }
    }

    values.value = new Map()
    grades.value = new Map()

    for (const student of loadedStudents) {
      const entry = latestByStudent.get(student.id)
      if (!entry) continue

      const rawValue = entry.measurements?.rawValue
      const value = entry.measurements?.value
      if (typeof rawValue === 'string') {
        values.value.set(student.id, rawValue)
      } else if (typeof value === 'number' && Number.isFinite(value)) {
        values.value.set(student.id, formatStoredValue(value))
      }

      if (entry.calculatedGrade !== undefined) {
        grades.value.set(student.id, entry.calculatedGrade)
      }
    }

    dirtyStudents.value = new Set()
  } catch (loadError) {
    console.error('Failed to load performance grading:', loadError)
    error.value = 'Fehler beim Laden der Leistungsbewertung.'
  } finally {
    loading.value = false
  }
}

function parseMeasurement(rawValue: string): number | null {
  const normalized = rawValue.trim().replace(',', '.')
  if (!normalized) return null

  if (measurementType.value === 'number') {
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

function formatStoredValue(value: number): string {
  if (measurementType.value !== 'time') return String(value).replace('.', ',')

  const minutes = Math.floor(value / 60)
  const seconds = value - minutes * 60
  const formattedSeconds = seconds.toFixed(2).replace('.', ',')
  return minutes > 0
    ? `${minutes}:${formattedSeconds.padStart(5, '0')}`
    : formattedSeconds
}

function buildContext(student: Student): Record<string, unknown> {
  return {
    gender: student.gender,
    genderLong: student.gender === 'm' ? 'male' : student.gender === 'f' ? 'female' : undefined,
    age: calculateAgeFromDateOfBirth(student.dateOfBirth) ?? undefined,
    dateOfBirth: student.dateOfBirth
  }
}

function calculateGrade(student: Student, rawValue: string): string | number | undefined {
  const value = parseMeasurement(rawValue)
  const table = tables.value.find(candidate => candidate.id === selectedTableId.value)

  if (value === null || !table) return undefined

  try {
    return sportBridge.performanceTableGradingService.calculateGrade({
      value,
      table,
      measurementType: measurementType.value,
      context: buildContext(student)
    }).grade
  } catch {
    return undefined
  }
}

function onValueChange(student: Student, rawValue: string): void {
  values.value.set(student.id, rawValue)
  dirtyStudents.value.add(student.id)

  const grade = calculateGrade(student, rawValue)
  if (grade === undefined) {
    grades.value.delete(student.id)
  } else {
    grades.value.set(student.id, grade)
  }
}

function recalculateAll(): void {
  for (const student of students.value) {
    const rawValue = values.value.get(student.id)
    if (!rawValue) {
      grades.value.delete(student.id)
      continue
    }

    const grade = calculateGrade(student, rawValue)
    if (grade === undefined) {
      grades.value.delete(student.id)
    } else {
      grades.value.set(student.id, grade)
    }
  }
}

async function saveConfiguration(): Promise<void> {
  if (!category.value) return
  if (!measurementLabel.value.trim()) {
    toast.error('Bitte eine Bezeichnung für den Messwert eingeben.')
    return
  }

  savingConfig.value = true
  try {
    const updated = await sportBridge.updateGradeCategoryUseCase.execute({
      id: category.value.id,
      configuration: {
        type: 'performance',
        gradingTable: selectedTableId.value || undefined,
        measurementType: measurementType.value,
        measurementLabel: measurementLabel.value.trim(),
        unit: measurementUnit.value.trim() || undefined
      }
    })

    category.value = updated
    recalculateAll()
    toast.success('Bewertungskonfiguration gespeichert.')
  } catch (saveError) {
    toast.error(saveError instanceof Error ? saveError.message : 'Konfiguration konnte nicht gespeichert werden.')
  } finally {
    savingConfig.value = false
  }
}

async function saveAll(): Promise<void> {
  if (!selectedTableId.value) {
    toast.error('Bitte zuerst eine Bewertungstabelle auswählen.')
    return
  }

  const pending: Array<{
    student: Student
    rawValue: string
    value: number
    grade: string | number
  }> = []

  for (const student of students.value) {
    if (!dirtyStudents.value.has(student.id)) continue

    const rawValue = values.value.get(student.id)?.trim() ?? ''
    if (!rawValue) continue

    const value = parseMeasurement(rawValue)
    const grade = grades.value.get(student.id)
    if (value === null) {
      toast.error(`Ungültiger Messwert bei ${student.firstName} ${student.lastName}.`)
      return
    }
    if (grade === undefined) {
      toast.error(`Kein Tabellenwert für ${student.firstName} ${student.lastName} gefunden.`)
      return
    }

    pending.push({ student, rawValue, value, grade })
  }

  if (pending.length === 0) return

  saving.value = true
  try {
    await Promise.all(
      pending.map(({ student, rawValue, value, grade }) =>
        sportBridge.recordGradeUseCase.execute({
          studentId: student.id,
          categoryId,
          measurements: {
            value,
            rawValue,
            measurementType: measurementType.value,
            unit: measurementUnit.value.trim() || undefined,
            tableId: selectedTableId.value
          },
          calculatedGrade: grade
        })
      )
    )

    dirtyStudents.value = new Set()
    toast.success(`${pending.length} Leistungen gespeichert.`)
  } catch (saveError) {
    toast.error(saveError instanceof Error ? saveError.message : 'Leistungen konnten nicht gespeichert werden.')
  } finally {
    saving.value = false
  }
}

function formatGrade(grade: string | number | undefined): string {
  if (grade === undefined) return '—'
  if (typeof grade === 'number' && !Number.isInteger(grade)) {
    return grade.toFixed(2).replace('.', ',')
  }
  return String(grade)
}
</script>

<style scoped src="./TimeGradingEntry.css"></style>
