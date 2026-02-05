import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Exams as ExamsTypes } from '@viccoboard/core'
import { createUuid } from '../utils/uuid'
import { useExams } from '../composables/useDatabase'
import { useToast } from '../composables/useToast'
import { useRouter } from 'vue-router'

export interface CriterionDraft {
  id: string
  text: string
  points: number
}

export interface TaskDraft {
  id: string
  title: string
  points: number
  bonusPoints: number
  isChoice: boolean
  choiceGroup: string
  criteria: CriterionDraft[]
  subtasks: TaskDraft[]
}

export interface PartDraft {
  id: string
  name: string
  description: string
  taskIds: string[]
  calculateSubScore: boolean
  scoreType: 'points' | 'grade'
  printable: boolean
  order: number
}

export const useExamBuilderStore = defineStore('examBuilder', () => {
  // ============ State ============
  const title = ref('')
  const description = ref('')
  const classGroupId = ref('')
  const mode = ref<'simple' | 'complex'>('simple')
  const tasks = ref<TaskDraft[]>([])
  const parts = ref<PartDraft[]>([])
  const isEditing = ref(false)
  const createdAt = ref<Date | null>(null)
  const examId = ref<string | undefined>(undefined)

  // ============ Getters ============
  const flatTasks = computed(() => flattenTasks(tasks.value))

  const totalPoints = computed(() =>
    flatTasks.value.reduce((sum, task) => sum + (Number(task.points) || 0), 0)
  )

  const canSave = computed(() => title.value.trim().length > 0 && tasks.value.length > 0)

  // ============ Helper Functions ============
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

  const flattenTasks = (items: TaskDraft[], level: 1 | 2 | 3 = 1, parentId?: string): ExamsTypes.TaskNode[] => {
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

  // ============ Actions ============
  const setMode = (next: 'simple' | 'complex'): void => {
    mode.value = next
    if (next === 'simple') {
      parts.value = []
      tasks.value.forEach(task => {
        task.subtasks = []
      })
    }
  }

  const addTask = (): void => {
    tasks.value.push(newTask())
  }

  const addSubtask = (task: TaskDraft, level: 2 | 3): void => {
    if (level === 2 || level === 3) {
      task.subtasks.push(newTask())
    }
  }

  const removeTask = (id: string): void => {
    tasks.value = tasks.value.filter(task => task.id !== id)
  }

  const removeNestedTask = (parent: TaskDraft, id: string): void => {
    parent.subtasks = parent.subtasks.filter(task => task.id !== id)
  }

  const moveTask = (list: TaskDraft[], index: number, delta: number): void => {
    const next = index + delta
    if (next < 0 || next >= list.length) return
    const [item] = list.splice(index, 1)
    list.splice(next, 0, item)
  }

  const addCriterion = (task: TaskDraft): void => {
    task.criteria.push(newCriterion())
  }

  const removeCriterion = (task: TaskDraft, id: string): void => {
    task.criteria = task.criteria.filter(criterion => criterion.id !== id)
  }

  const addPart = (): void => {
    parts.value.push(newPart())
  }

  const removePart = (id: string): void => {
    parts.value = parts.value.filter(part => part.id !== id)
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

  const saveExam = async (): Promise<void> => {
    const router = useRouter()
    const { create: createExam, update: updateExam } = useExams()
    const { success, error: showError } = useToast()

    if (!canSave.value) {
      showError('Add a title and at least one task before saving.')
      return
    }

    const exam = buildExam()
    if (isEditing.value) {
      await updateExam(exam)
      success('Exam updated.')
    } else {
      await createExam(exam)
      success('Exam saved.')
    }
    router.push('/exams')
  }

  const loadExam = async (id: string): Promise<void> => {
    const router = useRouter()
    const { getById } = useExams()
    const { error: showError } = useToast()

    const exam = await getById(id)
    if (!exam) {
      showError('Exam not found.')
      router.push('/exams')
      return
    }

    examId.value = id
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

  const reset = (): void => {
    examId.value = undefined
    isEditing.value = false
    createdAt.value = null
    title.value = ''
    description.value = ''
    classGroupId.value = ''
    mode.value = 'simple'
    tasks.value = []
    parts.value = []
  }

  return {
    // State
    title,
    description,
    classGroupId,
    mode,
    tasks,
    parts,
    isEditing,
    createdAt,
    examId,

    // Getters
    flatTasks,
    totalPoints,
    canSave,

    // Actions
    setMode,
    addTask,
    addSubtask,
    removeTask,
    removeNestedTask,
    moveTask,
    addCriterion,
    removeCriterion,
    addPart,
    removePart,
    buildExam,
    saveExam,
    loadExam,
    reset
  }
})
