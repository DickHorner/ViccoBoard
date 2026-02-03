<template>
  <section class="correction-task-wise">
    <header class="correction-header">
      <div>
        <h1>Task-wise Correction</h1>
        <p class="subtitle">Switch between candidate and task focus, add comments, and reuse them fast.</p>
      </div>
      <div class="header-actions">
        <button class="ghost" type="button" @click="goBack">Back</button>
        <button class="primary" type="button" @click="saveAll" :disabled="!canSaveAny">
          Save corrections
        </button>
      </div>
    </header>

    <div class="panel">
      <div class="panel-header">
        <h2>View</h2>
        <div class="mode-toggle">
          <button class="pill" :class="{ active: viewMode === 'candidate' }" type="button" @click="viewMode = 'candidate'">
            Candidate view
          </button>
          <button class="pill" :class="{ active: viewMode === 'task' }" type="button" @click="viewMode = 'task'">
            Task view
          </button>
        </div>
      </div>
      <div class="grid-two">
        <div class="field" v-if="viewMode === 'candidate'">
          <label for="candidate-select">Candidate</label>
          <select id="candidate-select" v-model="selectedCandidateId">
            <option value="">Select candidate</option>
            <option v-for="candidate in candidates" :key="candidate.id" :value="candidate.id">
              {{ candidate.firstName }} {{ candidate.lastName }}
            </option>
          </select>
        </div>
        <div class="field" v-if="viewMode === 'task'">
          <label for="task-select">Task</label>
          <select id="task-select" v-model="selectedTaskId">
            <option value="">Select task</option>
            <option v-for="task in tasks" :key="task.id" :value="task.id">
              {{ task.title }}
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
        <h2>{{ viewMode === 'candidate' ? 'Task scores' : 'Candidates' }}</h2>
        <span class="pill">{{ totalPointsDisplay }}</span>
      </div>

      <div v-if="viewMode === 'candidate'" class="task-grid">
        <div v-for="task in tasks" :key="task.id" class="task-row">
          <div class="task-info">
            <strong>{{ task.title }}</strong>
            <span class="muted">Max {{ task.points }} pts</span>
          </div>
          <input
            :value="getScore(selectedCandidateId, task.id)"
            type="number"
            min="0"
            :max="task.points"
            step="0.5"
            class="score-input"
            :disabled="!selectedCandidateId"
            @input="setScore(selectedCandidateId, task.id, ($event.target as HTMLInputElement).value)"
          />
          <textarea
            :value="getComment(selectedCandidateId, task.id)"
            class="comment-input"
            placeholder="Task comment"
            :disabled="!selectedCandidateId"
            @input="setComment(selectedCandidateId, task.id, ($event.target as HTMLTextAreaElement).value)"
          />
        </div>
      </div>

      <div v-else class="task-grid">
        <div v-for="candidate in candidates" :key="candidate.id" class="task-row">
          <div class="task-info">
            <strong>{{ candidate.firstName }} {{ candidate.lastName }}</strong>
            <span class="muted">{{ selectedTask?.title || 'Select a task' }}</span>
          </div>
          <input
            :value="getScore(candidate.id, selectedTaskId)"
            type="number"
            min="0"
            :max="selectedTask?.points || 0"
            step="0.5"
            class="score-input"
            :disabled="!selectedTaskId"
            @input="setScore(candidate.id, selectedTaskId, ($event.target as HTMLInputElement).value)"
          />
          <div class="comment-row">
            <textarea
              :value="getComment(candidate.id, selectedTaskId)"
              class="comment-input"
              placeholder="Task comment"
              :disabled="!selectedTaskId"
              @input="setComment(candidate.id, selectedTaskId, ($event.target as HTMLTextAreaElement).value, true)"
            />
            <button
              class="ghost small"
              type="button"
              :disabled="!selectedTaskId || !lastTaskComment"
              @click="reuseLastComment(candidate.id)"
            >
              Reuse
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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

const viewMode = ref<'candidate' | 'task'>('candidate')
const selectedCandidateId = ref('')
const selectedTaskId = ref('')

const candidateFirstName = ref('')
const candidateLastName = ref('')

const scoreMatrix = ref<Record<string, Record<string, number>>>({})
const commentMatrix = ref<Record<string, Record<string, string>>>({})
const lastTaskComment = ref('')

const selectedTask = computed(() => tasks.value.find(task => task.id === selectedTaskId.value))

const totalPointsDisplay = computed(() => {
  if (viewMode.value === 'candidate' && selectedCandidateId.value) {
    const scores = scoreMatrix.value[selectedCandidateId.value] || {}
    const total = tasks.value.reduce((sum, task) => sum + (scores[task.id] || 0), 0)
    return `${total} pts`
  }
  return 'Ready'
})

const canSaveAny = computed(() => candidates.value.length > 0 && tasks.value.length > 0)

const initMatrices = () => {
  candidates.value.forEach(candidate => {
    if (!scoreMatrix.value[candidate.id]) scoreMatrix.value[candidate.id] = {}
    if (!commentMatrix.value[candidate.id]) commentMatrix.value[candidate.id] = {}
    tasks.value.forEach(task => {
      if (scoreMatrix.value[candidate.id][task.id] === undefined) {
        scoreMatrix.value[candidate.id][task.id] = 0
      }
      if (commentMatrix.value[candidate.id][task.id] === undefined) {
        commentMatrix.value[candidate.id][task.id] = ''
      }
    })
  })
}

const ensureCandidateMatrix = (candidateId: string) => {
  if (!candidateId) return
  if (!scoreMatrix.value[candidateId]) scoreMatrix.value[candidateId] = {}
  if (!commentMatrix.value[candidateId]) commentMatrix.value[candidateId] = {}
}

const getScore = (candidateId: string, taskId: string) => {
  if (!candidateId || !taskId) return 0
  return scoreMatrix.value[candidateId]?.[taskId] ?? 0
}

const getComment = (candidateId: string, taskId: string) => {
  if (!candidateId || !taskId) return ''
  return commentMatrix.value[candidateId]?.[taskId] ?? ''
}

const setScore = (candidateId: string, taskId: string, value: string | number) => {
  if (!candidateId || !taskId) return
  ensureCandidateMatrix(candidateId)
  const parsed = Number(value)
  scoreMatrix.value[candidateId][taskId] = Number.isNaN(parsed) ? 0 : parsed
}

const setComment = (candidateId: string, taskId: string, value: string, trackLast = false) => {
  if (!candidateId || !taskId) return
  ensureCandidateMatrix(candidateId)
  commentMatrix.value[candidateId][taskId] = value
  if (trackLast) lastTaskComment.value = value
}

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
  initMatrices()
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
  candidateFirstName.value = ''
  candidateLastName.value = ''
  initMatrices()
  success('Candidate added.')
}

const reuseLastComment = (candidateId: string) => {
  if (!selectedTaskId.value || !lastTaskComment.value) return
  commentMatrix.value[candidateId][selectedTaskId.value] = lastTaskComment.value
}

const buildComments = (candidateId: string): ExamsTypes.CorrectionComment[] => {
  const comments: ExamsTypes.CorrectionComment[] = []
  tasks.value.forEach(task => {
    const text = commentMatrix.value[candidateId]?.[task.id]
    if (text && text.trim().length > 0) {
      comments.push({
        id: createUuid(),
        taskId: task.id,
        level: 'task',
        text: text.trim(),
        printable: true,
        availableAfterReturn: true,
        timestamp: new Date()
      })
    }
  })
  return comments
}

const saveAll = async () => {
  if (!exam.value) return
  const now = new Date()

  for (const candidate of candidates.value) {
    const scores = scoreMatrix.value[candidate.id] || {}
    const taskScores: ExamsTypes.TaskScore[] = tasks.value.map(task => ({
      taskId: task.id,
      points: scores[task.id] || 0,
      maxPoints: task.points,
      timestamp: now
    }))
    const totalPoints = taskScores.reduce((sum, task) => sum + task.points, 0)

    await create({
      id: createUuid(),
      examId: exam.value.id,
      candidateId: candidate.id,
      taskScores,
      totalPoints,
      totalGrade: totalPoints,
      percentageScore: exam.value.gradingKey.totalPoints
        ? (totalPoints / exam.value.gradingKey.totalPoints) * 100
        : 0,
      comments: buildComments(candidate.id),
      supportTips: [],
      status: 'in-progress',
      lastModified: now
    })
  }

  if (selectedTaskId.value) {
    lastTaskComment.value = commentMatrix.value[candidates.value[0]?.id || '']?.[selectedTaskId.value] || ''
  }
  success('Corrections saved.')
}

const goBack = () => router.push('/exams')

onMounted(() => {
  loadExam()
})
</script>

<style scoped>
.correction-task-wise {
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

.mode-toggle {
  display: flex;
  gap: 0.75rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field input,
.field select,
.field textarea {
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
  grid-template-columns: 1fr 110px 1fr;
  gap: 1rem;
  align-items: center;
  padding: 0.75rem;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.03);
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.score-input {
  border: 1px solid rgba(15, 23, 42, 0.2);
  border-radius: 12px;
  padding: 0.6rem 0.75rem;
  font-size: 1rem;
  min-height: 44px;
  text-align: right;
}

.comment-input {
  border: 1px solid rgba(15, 23, 42, 0.2);
  border-radius: 12px;
  padding: 0.6rem 0.75rem;
  min-height: 44px;
  resize: vertical;
}

.comment-row {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.pill {
  padding: 0.2rem 0.7rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
  font-size: 0.75rem;
  font-weight: 600;
}

.pill.active {
  background: #0f172a;
  color: white;
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

.ghost.small {
  padding: 0.4rem 0.9rem;
  min-height: 36px;
}

.muted {
  color: #94a3b8;
}

@media (max-width: 768px) {
  .task-row {
    grid-template-columns: 1fr;
  }

  .candidate-add {
    grid-template-columns: 1fr;
  }
}
</style>
