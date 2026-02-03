<template>
  <section class="correction-compact">
    <header class="correction-header">
      <div>
        <h1>Compact Correction</h1>
        <p class="subtitle">Tab through points, see totals in real time.</p>
      </div>
      <div class="header-actions">
        <button class="ghost" type="button" @click="goBack">Back</button>
        <button class="primary" type="button" :disabled="!canSave" @click="saveCorrection">
          Save correction
        </button>
      </div>
    </header>

    <div class="panel">
      <div class="panel-header">
        <h2>Exam</h2>
        <span class="pill" v-if="exam">{{ exam.title }}</span>
      </div>
      <div class="grid-two">
        <div class="field">
          <label for="candidate-select">Candidate</label>
          <select id="candidate-select" v-model="selectedCandidateId">
            <option value="">Select candidate</option>
            <option v-for="candidate in candidates" :key="candidate.id" :value="candidate.id">
              {{ candidate.firstName }} {{ candidate.lastName }}
            </option>
          </select>
        </div>
        <div class="field">
          <label>Quick add candidate</label>
          <div class="candidate-add">
            <input v-model="candidateFirstName" type="text" placeholder="First name" />
            <input v-model="candidateLastName" type="text" placeholder="Last name" />
            <button class="ghost" type="button" @click="addCandidate">Add</button>
          </div>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <h2>Points</h2>
        <div class="summary">
          <span>{{ totalPoints }} / {{ maxPoints }} pts</span>
          <span class="pill">{{ percentageScore.toFixed(1) }}%</span>
        </div>
      </div>

      <label class="choice-toggle">
        <input type="checkbox" v-model="useAlternativeGrading" />
        Alternative grading (++/+/0/-/--)
      </label>

      <div v-if="tasks.length === 0" class="empty">No tasks found for this exam.</div>
      <div v-else class="task-grid">
        <div v-for="task in tasks" :key="task.id" class="task-row">
          <div class="task-info">
            <strong>{{ task.title }}</strong>
            <span class="muted">Max {{ task.points }} pts</span>
          </div>
          <div class="task-score">
            <div v-if="useAlternativeGrading" class="alt-grade-group">
              <button
                v-for="option in alternativeOptions"
                :key="option"
                type="button"
                class="alt-button"
                :class="{ active: alternativeGrades[task.id] === option }"
                @click="setAlternative(task, option)"
              >
                {{ option }}
              </button>
            </div>
            <input
              v-else
              v-model.number="taskScores[task.id]"
              type="number"
              min="0"
              :max="task.points"
              step="0.5"
              class="score-input"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="panel summary-panel">
      <div class="summary">
        <div>
          <h3>Total</h3>
          <p class="muted">Points to next grade: {{ pointsToNextGrade }}</p>
        </div>
        <div class="summary-value">
          <span>{{ totalPoints }}</span>
          <span class="muted">/{{ maxPoints }} pts</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Exams as ExamsTypes } from '@viccoboard/core'
import { createUuid } from '../utils/uuid'
import { useExams, useCorrections } from '../composables/useDatabase'
import { useToast } from '../composables/useToast'

const route = useRoute()
const router = useRouter()
const { getById, update } = useExams()
const { create } = useCorrections()
const { success, error } = useToast()

const exam = ref<ExamsTypes.Exam | null>(null)
const tasks = ref<ExamsTypes.TaskNode[]>([])

const candidates = ref<ExamsTypes.Candidate[]>([])
const selectedCandidateId = ref('')
const candidateFirstName = ref('')
const candidateLastName = ref('')

const taskScores = ref<Record<string, number>>({})
const useAlternativeGrading = ref(false)
const alternativeGrades = ref<Record<string, ExamsTypes.AlternativeGrading['type']>>({})
const alternativeOptions: ExamsTypes.AlternativeGrading['type'][] = ['++', '+', '0', '-', '--']

const alternativeToPoints = (task: ExamsTypes.TaskNode, option: ExamsTypes.AlternativeGrading['type']) => {
  const max = task.points || 0
  switch (option) {
    case '++':
      return max
    case '+':
      return max * 0.75
    case '0':
      return max * 0.5
    case '-':
      return max * 0.25
    case '--':
      return 0
    default:
      return 0
  }
}

const setAlternative = (task: ExamsTypes.TaskNode, option: ExamsTypes.AlternativeGrading['type']) => {
  alternativeGrades.value[task.id] = option
  taskScores.value[task.id] = Number(alternativeToPoints(task, option).toFixed(1))
}


const maxPoints = computed(() => exam.value?.gradingKey.totalPoints ?? 0)
const totalPoints = computed(() =>
  tasks.value.reduce((sum, task) => sum + (taskScores.value[task.id] || 0), 0)
)
const percentageScore = computed(() =>
  maxPoints.value > 0 ? (totalPoints.value / maxPoints.value) * 100 : 0
)

const pointsToNextGrade = computed(() => {
  const gradingKey = exam.value?.gradingKey
  if (!gradingKey || gradingKey.gradeBoundaries.length === 0) return 'n/a'
  const sorted = [...gradingKey.gradeBoundaries]
    .filter(b => b.minPoints !== undefined)
    .sort((a, b) => (a.minPoints ?? 0) - (b.minPoints ?? 0))
  const next = sorted.find(b => (b.minPoints ?? 0) > totalPoints.value)
  if (!next || next.minPoints === undefined) return '0'
  return Math.max(next.minPoints - totalPoints.value, 0).toFixed(1)
})

const canSave = computed(() => Boolean(exam.value && selectedCandidateId.value))

const loadExam = async () => {
  const examId = route.params.examId as string
  const data = await getById(examId)
  if (!data) {
    error('Exam not found.')
    router.push('/exams')
    return
  }
  exam.value = data
  candidates.value = data.candidates
  tasks.value = data.structure.tasks.filter(task => task.level === 1)
  tasks.value.forEach(task => {
    taskScores.value[task.id] = 0
  })
}

const addCandidate = async () => {
  if (!exam.value) return
  if (!candidateFirstName.value.trim() || !candidateLastName.value.trim()) {
    error('Provide first and last name.')
    return
  }
  const candidate: ExamsTypes.Candidate = {
    id: createUuid(),
    examId: exam.value.id,
    firstName: candidateFirstName.value.trim(),
    lastName: candidateLastName.value.trim()
  }
  candidates.value = [...candidates.value, candidate]
  exam.value.candidates = candidates.value
  await update(exam.value)
  selectedCandidateId.value = candidate.id
  candidateFirstName.value = ''
  candidateLastName.value = ''
  success('Candidate added.')
}

const saveCorrection = async () => {
  if (!exam.value || !selectedCandidateId.value) return

  const now = new Date()
  const entry: ExamsTypes.CorrectionEntry = {
    id: createUuid(),
    examId: exam.value.id,
    candidateId: selectedCandidateId.value,
    taskScores: tasks.value.map(task => ({
      taskId: task.id,
      points: taskScores.value[task.id] || 0,
      maxPoints: task.points,
      timestamp: now
    })),
    totalPoints: totalPoints.value,
    totalGrade: percentageScore.value.toFixed(1),
    percentageScore: percentageScore.value,
    comments: [],
    supportTips: [],
    status: 'in-progress',
    lastModified: now
  }

  await create(entry)
  success('Correction saved.')
}

const goBack = () => router.push('/exams')

watch(useAlternativeGrading, (enabled) => {
  if (enabled) {
    tasks.value.forEach(task => {
      if (!alternativeGrades.value[task.id]) {
        setAlternative(task, '0')
      }
    })
  }
})

onMounted(() => {
  loadExam()
})
</script>

<style scoped>
.correction-compact {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.correction-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.subtitle {
  color: #64748b;
  margin-top: 0.5rem;
}

.panel {
  background: white;
  border-radius: 18px;
  padding: 1.5rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.grid-two {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field input,
.field select {
  border: 1px solid rgba(15, 23, 42, 0.15);
  border-radius: 12px;
  padding: 0.6rem 0.75rem;
  font-size: 0.95rem;
}

.candidate-add {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 0.5rem;
  align-items: center;
}

.task-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.task-row {
  display: grid;
  grid-template-columns: 1fr 110px;
  gap: 1rem;
  align-items: center;
  padding: 0.75rem;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.03);
}

.score-input {
  border: 1px solid rgba(15, 23, 42, 0.2);
  border-radius: 12px;
  padding: 0.6rem 0.75rem;
  font-size: 1rem;
  min-height: 44px;
  text-align: right;
}

.summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.summary-panel {
  background: #0f172a;
  color: white;
}

.summary-value {
  font-size: 1.6rem;
  font-weight: 600;
}

.pill {
  padding: 0.2rem 0.7rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
  font-size: 0.75rem;
  font-weight: 600;
}

.summary-panel .pill {
  background: rgba(255, 255, 255, 0.18);
}

.primary {
  border: none;
  background: #0f172a;
  color: white;
  padding: 0.7rem 1.5rem;
  border-radius: 999px;
  font-weight: 600;
  min-height: 44px;
  cursor: pointer;
}

.ghost {
  background: transparent;
  border: 1px solid rgba(15, 23, 42, 0.2);
  border-radius: 999px;
  padding: 0.6rem 1.25rem;
  cursor: pointer;
  min-height: 44px;
}

.empty {
  font-size: 0.9rem;
  color: #94a3b8;
}

.muted {
  color: #94a3b8;
}

@media (max-width: 640px) {
  .candidate-add {
    grid-template-columns: 1fr;
  }

  .task-row {
    grid-template-columns: 1fr;
  }

  .summary {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>








