<template>
  <section class="exam-builder">
    <header class="builder-header">
      <div>
        <h1>{{ isEditing ? 'Edit exam' : 'New exam' }}</h1>
        <p class="subtitle">Simple mode: tasks, points, and criteria. Complex mode comes next.</p>
      </div>
      <div class="header-actions">
        <button class="ghost" type="button" @click="goBack">Back to list</button>
        <button class="primary" type="button" :disabled="!canSave" @click="saveExam">
          {{ isEditing ? 'Save changes' : 'Save exam' }}
        </button>
      </div>
    </header>

    <div class="builder-grid">
      <form class="builder-form" @submit.prevent="saveExam">
        <section class="panel">
          <h2>Exam details</h2>
          <div class="field">
            <label for="exam-title">Title</label>
            <input id="exam-title" v-model="title" type="text" placeholder="e.g. Unit 2 Test" required />
          </div>
          <div class="field">
            <label for="exam-description">Description</label>
            <textarea id="exam-description" v-model="description" rows="3" placeholder="Optional context" />
          </div>
          <div class="field">
            <label for="exam-class">Class group</label>
            <input id="exam-class" v-model="classGroupId" type="text" placeholder="Optional class id" />
          </div>
        </section>

        <section class="panel">
          <div class="panel-header">
            <h2>Tasks</h2>
            <button class="ghost" type="button" @click="addTask">Add task</button>
          </div>

          <div v-if="tasks.length === 0" class="empty">Add at least one task.</div>

          <div v-for="(task, index) in tasks" :key="task.id" class="task-card">
            <div class="task-header">
              <h3>Task {{ index + 1 }}</h3>
              <button class="ghost" type="button" @click="removeTask(task.id)">Remove</button>
            </div>
            <div class="field">
              <label :for="`task-title-${task.id}`">Title</label>
              <input :id="`task-title-${task.id}`" v-model="task.title" type="text" placeholder="Task title" />
            </div>
            <div class="field">
              <label :for="`task-points-${task.id}`">Points</label>
              <input :id="`task-points-${task.id}`" v-model.number="task.points" type="number" min="0" step="0.5" />
            </div>

            <div class="criteria-block">
              <div class="panel-header">
                <h4>Criteria</h4>
                <button class="ghost" type="button" @click="addCriterion(task)">Add criterion</button>
              </div>
              <div v-if="task.criteria.length === 0" class="empty">No criteria yet.</div>
              <div v-for="criterion in task.criteria" :key="criterion.id" class="criterion-row">
                <input v-model="criterion.text" type="text" placeholder="Criterion" />
                <input v-model.number="criterion.points" type="number" min="0" step="0.5" />
                <button class="ghost" type="button" @click="removeCriterion(task, criterion.id)">Remove</button>
              </div>
            </div>
          </div>
        </section>
      </form>

      <aside class="preview panel">
        <div class="preview-header">
          <h2>Preview</h2>
          <span class="pill">{{ totalPoints }} points</span>
        </div>
        <div class="preview-meta">
          <p><strong>{{ title || 'Untitled exam' }}</strong></p>
          <p v-if="description">{{ description }}</p>
          <p class="muted" v-if="!description">Add a description if you want students to see context.</p>
        </div>
        <ol class="preview-tasks">
          <li v-for="task in tasks" :key="task.id">
            <div class="task-line">
              <span>{{ task.title || 'Untitled task' }}</span>
              <span class="pill">{{ task.points }} pts</span>
            </div>
            <ul v-if="task.criteria.length" class="criteria-list">
              <li v-for="criterion in task.criteria" :key="criterion.id">
                {{ criterion.text || 'Criterion' }} ({{ criterion.points }} pts)
              </li>
            </ul>
          </li>
        </ol>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Exams as ExamsTypes } from '@viccoboard/core'
import { createUuid } from '../utils/uuid'
import { useExams } from '../composables/useDatabase'
import { useToast } from '../composables/useToast'

interface CriterionDraft {
  id: string
  text: string
  points: number
}

interface TaskDraft {
  id: string
  title: string
  points: number
  criteria: CriterionDraft[]
}

const route = useRoute()
const router = useRouter()
const { getById, create, update } = useExams()
const { success, error } = useToast()

const examId = computed(() => route.params.id as string | undefined)
const isEditing = ref(false)
const createdAt = ref<Date | null>(null)

const title = ref('')
const description = ref('')
const classGroupId = ref('')
const tasks = ref<TaskDraft[]>([])

const totalPoints = computed(() =>
  tasks.value.reduce((sum, task) => sum + (Number(task.points) || 0), 0)
)

const canSave = computed(() => title.value.trim().length > 0 && tasks.value.length > 0)

const newTask = (): TaskDraft => ({
  id: createUuid(),
  title: '',
  points: 0,
  criteria: []
})

const newCriterion = (): CriterionDraft => ({
  id: createUuid(),
  text: '',
  points: 0
})

const addTask = () => {
  tasks.value.push(newTask())
}

const removeTask = (id: string) => {
  tasks.value = tasks.value.filter(task => task.id !== id)
}

const addCriterion = (task: TaskDraft) => {
  task.criteria.push(newCriterion())
}

const removeCriterion = (task: TaskDraft, id: string) => {
  task.criteria = task.criteria.filter(criterion => criterion.id !== id)
}

const buildExam = (): ExamsTypes.Exam => {
  const now = new Date()
  const exam: ExamsTypes.Exam = {
    id: examId.value ?? createUuid(),
    title: title.value.trim(),
    description: description.value.trim() || undefined,
    classGroupId: classGroupId.value.trim() || undefined,
    mode: 'simple' as ExamsTypes.ExamMode,
    structure: {
      parts: [],
      tasks: tasks.value.map((task, index) => ({
        id: task.id,
        level: 1,
        order: index + 1,
        title: task.title.trim() || `Task ${index + 1}`,
        description: undefined,
        points: Number(task.points) || 0,
        bonusPoints: undefined,
        isChoice: false,
        choiceGroup: undefined,
        criteria: task.criteria.map(criterion => ({
          id: criterion.id,
          text: criterion.text.trim() || 'Criterion',
          formatting: {},
          points: Number(criterion.points) || 0,
          aspectBased: false
        })),
        allowComments: false,
        allowSupportTips: false,
        commentBoxEnabled: false,
        subtasks: []
      })),
      allowsComments: false,
      allowsSupportTips: false,
      totalPoints: totalPoints.value
    },
    gradingKey: {
      id: createUuid(),
      name: 'default',
      type: 'points' as ExamsTypes.GradingKeyType,
      totalPoints: totalPoints.value,
      gradeBoundaries: [],
      roundingRule: { type: 'none', decimalPlaces: 0 },
      errorPointsToGrade: false,
      customizable: true,
      modifiedAfterCorrection: false
    },
    printPresets: [],
    candidates: [],
    status: 'draft',
    createdAt: createdAt.value ?? now,
    lastModified: now
  }

  return exam
}

const saveExam = async () => {
  if (!canSave.value) {
    error('Add a title and at least one task before saving.')
    return
  }

  const exam = buildExam()
  if (isEditing.value) {
    await update(exam)
    success('Exam updated.')
  } else {
    await create(exam)
    success('Exam saved.')
  }
  router.push('/exams')
}

const loadExam = async (id: string) => {
  const exam = await getById(id)
  if (!exam) {
    error('Exam not found.')
    router.push('/exams')
    return
  }

  isEditing.value = true
  createdAt.value = exam.createdAt
  title.value = exam.title
  description.value = exam.description ?? ''
  classGroupId.value = exam.classGroupId ?? ''
  tasks.value = exam.structure.tasks
    .sort((a, b) => a.order - b.order)
    .map(task => ({
      id: task.id,
      title: task.title,
      points: task.points,
      criteria: task.criteria.map(criterion => ({
        id: criterion.id,
        text: criterion.text,
        points: criterion.points
      }))
    }))
}

const goBack = () => router.push('/exams')

onMounted(() => {
  if (examId.value) {
    loadExam(examId.value)
  } else if (tasks.value.length === 0) {
    addTask()
  }
})
</script>

<style scoped>
.exam-builder {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.builder-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.subtitle {
  color: #64748b;
  margin-top: 0.5rem;
}

.builder-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: 2rem;
  align-items: start;
}

.builder-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field input,
.field textarea {
  border: 1px solid rgba(15, 23, 42, 0.15);
  border-radius: 12px;
  padding: 0.65rem 0.75rem;
  font-size: 0.95rem;
}

.task-card {
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.criteria-block {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.criterion-row {
  display: grid;
  grid-template-columns: 1fr 90px auto;
  gap: 0.5rem;
  align-items: center;
}

.criterion-row input {
  border: 1px solid rgba(15, 23, 42, 0.15);
  border-radius: 10px;
  padding: 0.45rem 0.6rem;
}

.preview {
  position: sticky;
  top: 1.5rem;
  align-self: start;
  gap: 1.25rem;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.preview-tasks {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-left: 1.2rem;
}

.task-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.criteria-list {
  margin-top: 0.5rem;
  padding-left: 1.2rem;
  color: #64748b;
  font-size: 0.9rem;
}

.pill {
  padding: 0.2rem 0.7rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
  font-size: 0.75rem;
  font-weight: 600;
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

.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

@media (max-width: 1024px) {
  .builder-grid {
    grid-template-columns: 1fr;
  }

  .preview {
    position: static;
  }
}

@media (max-width: 640px) {
  .criterion-row {
    grid-template-columns: 1fr 70px;
  }

  .criterion-row button {
    grid-column: 1 / -1;
  }
}
</style>



