import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Exams as ExamsTypes } from '@viccoboard/core'
import { createUuid } from '../utils/uuid'
import { useExamsBridge } from '../composables/useExamsBridge'
import { useToast } from '../composables/useToast'
import { useRouter } from 'vue-router'

export interface CriteriaConsistencyWarning {
  taskId: string
  taskTitle: string
  kind: 'criteria-with-subtasks'
}

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

export interface CandidateGroupDraft {
  id: string
  name: string
  memberCandidateIds: string[]
  topic?: string
  notes?: string
}

export const useExamBuilderStore = defineStore('examBuilder', () => {
  // ============ State ============
  const title = ref('')
  const description = ref('')
  const classGroupId = ref('')
  const assessmentFormat = ref<ExamsTypes.ExamAssessmentFormat>('klausur')
  const mode = ref<'simple' | 'complex'>('complex')
  const tasks = ref<TaskDraft[]>([])
  const parts = ref<PartDraft[]>([])
  const candidateGroups = ref<CandidateGroupDraft[]>([])
  const isEditing = ref(false)
  const createdAt = ref<Date | null>(null)
  const examId = ref<string | undefined>(undefined)

  // ============ Getters ============
  const flatTasks = computed(() => flattenTasks(tasks.value))

  const totalPoints = computed(() =>
    tasks.value.reduce((sum, task) => sum + resolveTaskPoints(task), 0)
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

  const resolveTaskPoints = (task: TaskDraft): number => {
    if (task.subtasks.length > 0) {
      return task.subtasks.reduce((sum, subtask) => sum + resolveTaskPoints(subtask), 0)
    }

    if (task.criteria.length > 0) {
      return task.criteria.reduce((sum, criterion) => sum + (Number(criterion.points) || 0), 0)
    }

    return Number(task.points) || 0
  }

  const syncTaskBranch = (task: TaskDraft): number => {
    task.subtasks.forEach(syncTaskBranch)
    task.points = resolveTaskPoints(task)
    return task.points
  }

  const recalculateTaskPoints = (): void => {
    tasks.value.forEach(syncTaskBranch)
  }

  const getCriteriaConsistencyWarnings = (): CriteriaConsistencyWarning[] => {
    const warnings: CriteriaConsistencyWarning[] = []

    const check = (task: TaskDraft): void => {
      if (task.criteria.length > 0 && task.subtasks.length > 0) {
        warnings.push({
          taskId: task.id,
          taskTitle: task.title || '(ohne Titel)',
          kind: 'criteria-with-subtasks'
        })
      }

      task.subtasks.forEach(check)
    }

    tasks.value.forEach(check)
    return warnings
  }

  const flattenTasks = (items: TaskDraft[], level: 1 | 2 | 3 = 1, parentId?: string): ExamsTypes.TaskNode[] => {
    const output: ExamsTypes.TaskNode[] = []
    items.forEach((task, index) => {
      const taskPoints = resolveTaskPoints(task)
      output.push({
        id: task.id,
        parentId,
        level,
        order: index + 1,
        title: task.title.trim() || `Task ${index + 1}`,
        description: undefined,
        points: taskPoints,
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
    recalculateTaskPoints()
  }

  const addTask = (): void => {
    tasks.value.push(newTask())
    recalculateTaskPoints()
  }

  const addSubtask = (task: TaskDraft, level: 2 | 3): void => {
    if (level === 2 || level === 3) {
      task.subtasks.push(newTask())
    }
    recalculateTaskPoints()
  }

  const removeTask = (id: string): void => {
    tasks.value = tasks.value.filter(task => task.id !== id)
    recalculateTaskPoints()
  }

  const removeNestedTask = (parent: TaskDraft, id: string): void => {
    parent.subtasks = parent.subtasks.filter(task => task.id !== id)
    recalculateTaskPoints()
  }

  const moveTask = (list: TaskDraft[], index: number, delta: number): void => {
    const next = index + delta
    if (next < 0 || next >= list.length) return
    const [item] = list.splice(index, 1)
    list.splice(next, 0, item)
  }

  const addCriterion = (task: TaskDraft): void => {
    task.criteria.push(newCriterion())
    recalculateTaskPoints()
  }

  const removeCriterion = (task: TaskDraft, id: string): void => {
    task.criteria = task.criteria.filter(criterion => criterion.id !== id)
    recalculateTaskPoints()
  }

  const addPart = (): void => {
    parts.value.push(newPart())
  }

  const removePart = (id: string): void => {
    parts.value = parts.value.filter(part => part.id !== id)
  }

  const buildExam = (): ExamsTypes.Exam => {
    const now = new Date()
    recalculateTaskPoints()
    const taskNodes = flattenTasks(tasks.value)
    const exam: ExamsTypes.Exam = {
      id: examId.value ?? createUuid(),
      title: title.value.trim(),
      description: description.value.trim() || undefined,
      classGroupId: classGroupId.value.trim() || undefined,
      assessmentFormat: assessmentFormat.value,
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
      candidateGroups: candidateGroups.value.map((group) => ({
        id: group.id,
        name: group.name.trim() || 'Neue Gruppe',
        memberCandidateIds: [...group.memberCandidateIds],
        topic: group.topic?.trim() || undefined,
        notes: group.notes?.trim() || undefined
      })),
      status: 'draft',
      createdAt: createdAt.value ?? now,
      lastModified: now
    }

      return exam
  }

  const hydrateFromExam = (exam: ExamsTypes.Exam): void => {
    examId.value = exam.id
    isEditing.value = true
    createdAt.value = exam.createdAt
    title.value = exam.title
    description.value = exam.description ?? ''
    classGroupId.value = exam.classGroupId ?? ''
    assessmentFormat.value = exam.assessmentFormat ?? 'klausur'
    mode.value = exam.mode
    candidateGroups.value = (exam.candidateGroups ?? []).map((group) => ({
      id: group.id,
      name: group.name,
      memberCandidateIds: [...group.memberCandidateIds],
      topic: group.topic,
      notes: group.notes
    }))
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
      recalculateTaskPoints()
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
    recalculateTaskPoints()
  }

  const saveExam = async (): Promise<void> => {
    const router = useRouter()
    const { examRepository } = useExamsBridge()
    const { success, error: showError } = useToast()

    if (!canSave.value) {
      showError('Bitte geben Sie einen Titel ein und legen Sie mindestens eine Aufgabe an.')
      return
    }

    const exam = buildExam()
    try {
      if (isEditing.value && examId.value) {
        await examRepository?.update(examId.value, exam)
        success('Prüfung aktualisiert.')
      } else {
        const created = await examRepository?.create?.(exam)
        if (created) {
          examId.value = created.id
        }
        success('Prüfung gespeichert.')
      }
      router.push('/exams')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Die Prüfung konnte nicht gespeichert werden.')
    }
  }

  const loadExam = async (id: string): Promise<void> => {
    const router = useRouter()
    const { examRepository } = useExamsBridge()
    const { error: showError } = useToast()

    try {
      const exam = await examRepository?.findById(id)
      if (!exam) {
        showError('Die Prüfung wurde nicht gefunden.')
        router.push('/exams')
        return
      }

      hydrateFromExam(exam)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Die Prüfung konnte nicht geladen werden.')
      router.push('/exams')
    }
  }

  const reset = (): void => {
    examId.value = undefined
    isEditing.value = false
    createdAt.value = null
    title.value = ''
    description.value = ''
    classGroupId.value = ''
    assessmentFormat.value = 'klausur'
    mode.value = 'complex'
    tasks.value = []
    parts.value = []
    candidateGroups.value = []
  }

  return {
    // State
    title,
    description,
    classGroupId,
    assessmentFormat,
    mode,
    tasks,
    parts,
    candidateGroups,
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
    recalculateTaskPoints,
    getCriteriaConsistencyWarnings,
    buildExam,
    hydrateFromExam,
    saveExam,
    loadExam,
    reset
  }
})
