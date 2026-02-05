<template>
  <section class="exam-builder">
    <header class="builder-header">
      <div>
        <h1>{{ isEditing ? 'Edit exam' : 'New exam' }}</h1>
        <p class="subtitle">
          {{ mode === 'simple'
            ? 'Simple mode: tasks, points, and criteria.'
            : 'Complex mode: three levels, choice tasks, bonus points, and exam parts.'
          }}
        </p>
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
          <div class="field">
            <label>Mode</label>
            <div class="mode-toggle">
              <button
                class="pill"
                :class="{ active: mode === 'simple' }"
                type="button"
                @click="setMode('simple')"
              >
                Simple
              </button>
              <button
                class="pill"
                :class="{ active: mode === 'complex' }"
                type="button"
                @click="setMode('complex')"
              >
                Complex
              </button>
            </div>
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
              <div class="task-actions">
                <button class="ghost" type="button" @click="moveTask(tasks, index, -1)">Up</button>
                <button class="ghost" type="button" @click="moveTask(tasks, index, 1)">Down</button>
                <button class="ghost" type="button" @click="removeTask(task.id)">Remove</button>
              </div>
            </div>
            <div class="field">
              <label :for="`task-title-${task.id}`">Title</label>
              <input :id="`task-title-${task.id}`" v-model="task.title" type="text" placeholder="Task title" />
            </div>
            <div class="field-grid">
              <div class="field">
                <label :for="`task-points-${task.id}`">Points</label>
                <input :id="`task-points-${task.id}`" v-model.number="task.points" type="number" min="0" step="0.5" />
              </div>
              <div class="field">
                <label :for="`task-bonus-${task.id}`">Bonus points</label>
                <input :id="`task-bonus-${task.id}`" v-model.number="task.bonusPoints" type="number" min="0" step="0.5" />
              </div>
            </div>
            <div class="field-grid">
              <label class="choice-toggle">
                <input v-model="task.isChoice" type="checkbox" />
                Choice task
              </label>
              <div class="field" v-if="task.isChoice">
                <label :for="`task-choice-${task.id}`">Choice group</label>
                <input :id="`task-choice-${task.id}`" v-model="task.choiceGroup" type="text" placeholder="e.g. 3a/3b" />
              </div>
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

            <div v-if="mode === 'complex'" class="subtasks">
              <div class="panel-header">
                <h4>Subtasks</h4>
                <button class="ghost" type="button" @click="addSubtask(task, 2)">Add subtask</button>
              </div>

              <div v-for="(subtask, subIndex) in task.subtasks" :key="subtask.id" class="task-card nested">
                <div class="task-header">
                  <h4>Task {{ index + 1 }}.{{ subIndex + 1 }}</h4>
                  <div class="task-actions">
                    <button class="ghost" type="button" @click="moveTask(task.subtasks, subIndex, -1)">Up</button>
                    <button class="ghost" type="button" @click="moveTask(task.subtasks, subIndex, 1)">Down</button>
                    <button class="ghost" type="button" @click="removeNestedTask(task, subtask.id)">Remove</button>
                  </div>
                </div>
                <div class="field">
                  <label :for="`subtask-title-${subtask.id}`">Title</label>
                  <input :id="`subtask-title-${subtask.id}`" v-model="subtask.title" type="text" placeholder="Subtask title" />
                </div>
                <div class="field-grid">
                  <div class="field">
                    <label :for="`subtask-points-${subtask.id}`">Points</label>
                    <input :id="`subtask-points-${subtask.id}`" v-model.number="subtask.points" type="number" min="0" step="0.5" />
                  </div>
                  <div class="field">
                    <label :for="`subtask-bonus-${subtask.id}`">Bonus points</label>
                    <input :id="`subtask-bonus-${subtask.id}`" v-model.number="subtask.bonusPoints" type="number" min="0" step="0.5" />
                  </div>
                </div>

                <div class="criteria-block">
                  <div class="panel-header">
                    <h5>Criteria</h5>
                    <button class="ghost" type="button" @click="addCriterion(subtask)">Add criterion</button>
                  </div>
                  <div v-if="subtask.criteria.length === 0" class="empty">No criteria yet.</div>
                  <div v-for="criterion in subtask.criteria" :key="criterion.id" class="criterion-row">
                    <input v-model="criterion.text" type="text" placeholder="Criterion" />
                    <input v-model.number="criterion.points" type="number" min="0" step="0.5" />
                    <button class="ghost" type="button" @click="removeCriterion(subtask, criterion.id)">Remove</button>
                  </div>
                </div>

                <div class="subtasks">
                  <div class="panel-header">
                    <h5>Subtasks (level 3)</h5>
                    <button class="ghost" type="button" @click="addSubtask(subtask, 3)">Add subtask</button>
                  </div>

                  <div v-for="(leaf, leafIndex) in subtask.subtasks" :key="leaf.id" class="task-card nested">
                    <div class="task-header">
                      <h5>Task {{ index + 1 }}.{{ subIndex + 1 }}.{{ leafIndex + 1 }}</h5>
                      <div class="task-actions">
                        <button class="ghost" type="button" @click="moveTask(subtask.subtasks, leafIndex, -1)">Up</button>
                        <button class="ghost" type="button" @click="moveTask(subtask.subtasks, leafIndex, 1)">Down</button>
                        <button class="ghost" type="button" @click="removeNestedTask(subtask, leaf.id)">Remove</button>
                      </div>
                    </div>
                    <div class="field">
                      <label :for="`leaf-title-${leaf.id}`">Title</label>
                      <input :id="`leaf-title-${leaf.id}`" v-model="leaf.title" type="text" placeholder="Leaf task title" />
                    </div>
                    <div class="field-grid">
                      <div class="field">
                        <label :for="`leaf-points-${leaf.id}`">Points</label>
                        <input :id="`leaf-points-${leaf.id}`" v-model.number="leaf.points" type="number" min="0" step="0.5" />
                      </div>
                      <div class="field">
                        <label :for="`leaf-bonus-${leaf.id}`">Bonus points</label>
                        <input :id="`leaf-bonus-${leaf.id}`" v-model.number="leaf.bonusPoints" type="number" min="0" step="0.5" />
                      </div>
                    </div>
                    <div class="criteria-block">
                      <div class="panel-header">
                        <h6>Criteria</h6>
                        <button class="ghost" type="button" @click="addCriterion(leaf)">Add criterion</button>
                      </div>
                      <div v-if="leaf.criteria.length === 0" class="empty">No criteria yet.</div>
                      <div v-for="criterion in leaf.criteria" :key="criterion.id" class="criterion-row">
                        <input v-model="criterion.text" type="text" placeholder="Criterion" />
                        <input v-model.number="criterion.points" type="number" min="0" step="0.5" />
                        <button class="ghost" type="button" @click="removeCriterion(leaf, criterion.id)">Remove</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section v-if="mode === 'complex'" class="panel">
          <div class="panel-header">
            <h2>Exam parts</h2>
            <button class="ghost" type="button" @click="addPart">Add part</button>
          </div>
          <div v-if="parts.length === 0" class="empty">No parts yet.</div>
          <div v-for="(part, index) in parts" :key="part.id" class="task-card">
            <div class="task-header">
              <h3>Part {{ index + 1 }}</h3>
              <button class="ghost" type="button" @click="removePart(part.id)">Remove</button>
            </div>
            <div class="field">
              <label :for="`part-name-${part.id}`">Name</label>
              <input :id="`part-name-${part.id}`" v-model="part.name" type="text" placeholder="Part name" />
            </div>
            <div class="field">
              <label :for="`part-description-${part.id}`">Description</label>
              <textarea :id="`part-description-${part.id}`" v-model="part.description" rows="2" placeholder="Optional" />
            </div>
            <div class="field-grid">
              <label class="choice-toggle">
                <input v-model="part.calculateSubScore" type="checkbox" />
                Calculate sub score
              </label>
              <label class="choice-toggle">
                <input v-model="part.printable" type="checkbox" />
                Printable
              </label>
              <label class="choice-toggle">
                <input v-model="part.scoreType" type="radio" value="points" />
                Points
              </label>
              <label class="choice-toggle">
                <input v-model="part.scoreType" type="radio" value="grade" />
                Grade
              </label>
            </div>
            <div class="field">
              <label>Included tasks</label>
              <div class="chip-grid">
                <label
                  v-for="task in flatTasks"
                  :key="task.id"
                  class="chip"
                >
                  <input
                    type="checkbox"
                    :value="task.id"
                    v-model="part.taskIds"
                  />
                  {{ task.title || task.id.slice(0, 4) }}
                </label>
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
            <ul v-if="task.subtasks.length" class="criteria-list">
              <li v-for="subtask in task.subtasks" :key="subtask.id">
                {{ subtask.title || 'Subtask' }} ({{ subtask.points }} pts)
                <ul v-if="subtask.subtasks.length" class="criteria-list">
                  <li v-for="leaf in subtask.subtasks" :key="leaf.id">
                    {{ leaf.title || 'Subtask' }} ({{ leaf.points }} pts)
                  </li>
                </ul>
              </li>
            </ul>
          </li>
        </ol>
        <div v-if="mode === 'complex'" class="preview-meta">
          <h3>Exam parts</h3>
          <ul>
            <li v-for="part in parts" :key="part.id">
              {{ part.name || 'Unnamed part' }} — {{ part.taskIds.length }} tasks
            </li>
          </ul>
        </div>
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
  bonusPoints: number
  isChoice: boolean
  choiceGroup: string
  criteria: CriterionDraft[]
  subtasks: TaskDraft[]
}

interface PartDraft {
  id: string
  name: string
  description: string
  taskIds: string[]
  calculateSubScore: boolean
  scoreType: 'points' | 'grade'
  printable: boolean
  order: number
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
const mode = ref<'simple' | 'complex'>('simple')
const tasks = ref<TaskDraft[]>([])
const parts = ref<PartDraft[]>([])

const flatTasks = computed(() => flattenTasks(tasks.value))

const totalPoints = computed(() =>
  flatTasks.value.reduce((sum, task) => sum + (Number(task.points) || 0), 0)
)

const canSave = computed(() => title.value.trim().length > 0 && tasks.value.length > 0)

const newTask = (): TaskDraft => ({
  id: createUuid(),
  title: '',
  points: 0,
  bonusPoints: 0,
  isChoice: false,
  choiceGroup: '',
  criteria: [],
  subtasks: []
})

const newCriterion = (): CriterionDraft => ({
  id: createUuid(),
  text: '',
  points: 0
})

const newPart = (): PartDraft => ({
  id: createUuid(),
  name: '',
  description: '',
  taskIds: [],
  calculateSubScore: false,
  scoreType: 'points',
  printable: true,
  order: parts.value.length + 1
})

const setMode = (next: 'simple' | 'complex') => {
  mode.value = next
  if (next === 'simple') {
    parts.value = []
    tasks.value.forEach(task => {
      task.subtasks = []
    })
  }
}

const addTask = () => {
  tasks.value.push(newTask())
}

const addSubtask = (task: TaskDraft, level: 2 | 3) => {
  if (level === 2) {
    task.subtasks.push(newTask())
  } else if (level === 3) {
    task.subtasks.push(newTask())
  }
}

const removeTask = (id: string) => {
  tasks.value = tasks.value.filter(task => task.id !== id)
}

const removeNestedTask = (parent: TaskDraft, id: string) => {
  parent.subtasks = parent.subtasks.filter(task => task.id !== id)
}

const moveTask = (list: TaskDraft[], index: number, delta: number) => {
  const next = index + delta
  if (next < 0 || next >= list.length) return
  const [item] = list.splice(index, 1)
  list.splice(next, 0, item)
}

const addCriterion = (task: TaskDraft) => {
  task.criteria.push(newCriterion())
}

const removeCriterion = (task: TaskDraft, id: string) => {
  task.criteria = task.criteria.filter(criterion => criterion.id !== id)
}

const addPart = () => {
  parts.value.push(newPart())
}

const removePart = (id: string) => {
  parts.value = parts.value.filter(part => part.id !== id)
}

const flattenTasks = (items: TaskDraft[], level: 1 | 2 | 3 = 1, parentId?: string) => {
  const output: ExamsTypes.TaskNode[] = []
  items.forEach((task, index) => {
    output.push({
      id: task.id,
      parentId,
      level,
      order: index + 1,
      title: task.title.trim() || `Task ${index + 1}`,
      description: undefined,
      points: Number(task.points) || 0,
      bonusPoints: Number(task.bonusPoints) || 0,
      isChoice: task.isChoice,
      choiceGroup: task.choiceGroup || undefined,
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
      subtasks: task.subtasks.map(sub => sub.id)
    })

    if (level < 3 && task.subtasks.length) {
      output.push(...flattenTasks(task.subtasks, (level + 1) as 2 | 3, task.id))
    }
  })
  return output
}

const buildExam = (): ExamsTypes.Exam => {
  const now = new Date()
  const taskNodes = flattenTasks(tasks.value)
  const exam: ExamsTypes.Exam = {
    id: examId.value ?? createUuid(),
    title: title.value.trim(),
    description: description.value.trim() || undefined,
    classGroupId: classGroupId.value.trim() || undefined,
    mode: mode.value as ExamsTypes.ExamMode,
    structure: {
      parts: parts.value.map((part, index) => ({
        id: part.id,
        name: part.name || `Part ${index + 1}`,
        description: part.description || undefined,
        taskIds: part.taskIds,
        calculateSubScore: part.calculateSubScore,
        scoreType: part.scoreType,
        printable: part.printable,
        order: index + 1
      })),
      tasks: taskNodes,
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
  mode.value = exam.mode
  parts.value = exam.structure.parts.map((part, index) => ({
    id: part.id,
    name: part.name,
    description: part.description ?? '',
    taskIds: part.taskIds,
    calculateSubScore: part.calculateSubScore,
    scoreType: part.scoreType,
    printable: part.printable,
    order: index + 1
  }))

  if (exam.mode === 'simple') {
    tasks.value = exam.structure.tasks
      .filter(task => task.level === 1)
      .sort((a, b) => a.order - b.order)
      .map(task => ({
        id: task.id,
        title: task.title,
        points: task.points,
        bonusPoints: task.bonusPoints ?? 0,
        isChoice: task.isChoice,
        choiceGroup: task.choiceGroup ?? '',
        criteria: task.criteria.map(criterion => ({
          id: criterion.id,
          text: criterion.text,
          points: criterion.points
        })),
        subtasks: []
      }))
    return
  }

  const byId = new Map<string, TaskDraft>()
  exam.structure.tasks.forEach(task => {
    byId.set(task.id, {
      id: task.id,
      title: task.title,
      points: task.points,
      bonusPoints: task.bonusPoints ?? 0,
      isChoice: task.isChoice,
      choiceGroup: task.choiceGroup ?? '',
      criteria: task.criteria.map(criterion => ({
        id: criterion.id,
        text: criterion.text,
        points: criterion.points
      })),
      subtasks: []
    })
  })

  const root: TaskDraft[] = []
  exam.structure.tasks
    .sort((a, b) => a.order - b.order)
    .forEach(task => {
      const draft = byId.get(task.id)
      if (!draft) return
      if (!task.parentId) {
        root.push(draft)
      } else {
        const parent = byId.get(task.parentId)
        if (parent) {
          parent.subtasks.push(draft)
        }
      }
    })

  tasks.value = root
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

.mode-toggle {
  display: flex;
  gap: 0.75rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem;
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

.task-card.nested {
  background: rgba(15, 23, 42, 0.02);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.task-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
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

.subtasks {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.5rem;
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
  border: none;
  cursor: pointer;
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

.choice-toggle {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
}

.chip-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 999px;
  padding: 0.35rem 0.75rem;
  border: 1px solid rgba(15, 23, 42, 0.12);
  font-size: 0.85rem;
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

