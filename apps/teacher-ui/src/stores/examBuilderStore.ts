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
  reusable: boolean
  subject: string
  gradeLevel: string
  criteria: CriterionDraft[]
  subtasks: TaskDraft[]
}

export interface ReusableTaskBranch {
  node: ExamsTypes.TaskNode
  children: ReusableTaskBranch[]
}

export interface ReusableTaskCollectionItem {
  id: string
  sourceExamId: string
  sourceExamTitle: string
  title: string
  subject: string
  gradeLevel: string
  points: number
  criteriaSummary: string
  searchText: string
  task: ReusableTaskBranch
}

export interface ReusableTaskFilters {
  subject?: string
  gradeLevel?: string
  query?: string
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

function toTaskDraft(task: ExamsTypes.TaskNode, subtasks: TaskDraft[] = []): TaskDraft {
  return {
    id: task.id,
    title: task.title,
    points: task.points,
    bonusPoints: task.bonusPoints ?? 0,
    isChoice: task.isChoice,
    choiceGroup: task.choiceGroup ?? '',
    reusable: Boolean(task.reusable),
    subject: task.subject ?? '',
    gradeLevel: task.gradeLevel ?? '',
    criteria: task.criteria.map(criterion => ({
      id: criterion.id,
      text: criterion.text,
      points: criterion.points
    })),
    subtasks
  }
}

function compareTaskOrder(a: ExamsTypes.TaskNode, b: ExamsTypes.TaskNode): number {
  return a.order - b.order
}

function buildTaskChildrenMap(tasks: ExamsTypes.TaskNode[]): Map<string, ExamsTypes.TaskNode[]> {
  const childrenByParent = new Map<string, ExamsTypes.TaskNode[]>()

  tasks.forEach(task => {
    if (!task.parentId) return
    const siblings = childrenByParent.get(task.parentId) ?? []
    siblings.push(task)
    childrenByParent.set(task.parentId, siblings)
  })

  childrenByParent.forEach(children => children.sort(compareTaskOrder))
  return childrenByParent
}

function buildReusableTaskBranch(
  task: ExamsTypes.TaskNode,
  childrenByParent: Map<string, ExamsTypes.TaskNode[]>
): ReusableTaskBranch {
  const children = (childrenByParent.get(task.id) ?? []).map(child =>
    buildReusableTaskBranch(child, childrenByParent)
  )

  return {
    node: task,
    children
  }
}

function collectCriteriaTexts(branch: ReusableTaskBranch): string[] {
  const ownCriteria = branch.node.criteria.map(criterion => criterion.text).filter(Boolean)
  return ownCriteria.concat(branch.children.flatMap(collectCriteriaTexts))
}

function collectSearchSegments(branch: ReusableTaskBranch): string[] {
  const ownSegments = [branch.node.title, ...branch.node.criteria.map(criterion => criterion.text)]
  return ownSegments.concat(branch.children.flatMap(collectSearchSegments))
}

export function collectReusableTasks(exams: ExamsTypes.Exam[]): ReusableTaskCollectionItem[] {
  const items: ReusableTaskCollectionItem[] = []

  exams.forEach(exam => {
    const childrenByParent = buildTaskChildrenMap(exam.structure.tasks)

    exam.structure.tasks
      .filter(task => task.reusable === true)
      .sort(compareTaskOrder)
      .forEach(task => {
        const branch = buildReusableTaskBranch(task, childrenByParent)
        const criteriaSummary = collectCriteriaTexts(branch).join(' · ')

        items.push({
          id: `${exam.id}:${task.id}`,
          sourceExamId: exam.id,
          sourceExamTitle: exam.title,
          title: task.title,
          subject: task.subject ?? '',
          gradeLevel: task.gradeLevel ?? '',
          points: task.points,
          criteriaSummary,
          searchText: collectSearchSegments(branch).join(' ').toLocaleLowerCase(),
          task: branch
        })
      })
  })

  return items
}

export function filterReusableTasks(
  items: ReusableTaskCollectionItem[],
  filters: ReusableTaskFilters
): ReusableTaskCollectionItem[] {
  const normalizedSubject = filters.subject?.trim().toLocaleLowerCase() ?? ''
  const normalizedGradeLevel = filters.gradeLevel?.trim().toLocaleLowerCase() ?? ''
  const normalizedQuery = filters.query?.trim().toLocaleLowerCase() ?? ''

  return items.filter(item => {
    if (normalizedSubject && item.subject.toLocaleLowerCase() !== normalizedSubject) {
      return false
    }

    if (normalizedGradeLevel && item.gradeLevel.toLocaleLowerCase() !== normalizedGradeLevel) {
      return false
    }

    if (normalizedQuery && !item.searchText.includes(normalizedQuery)) {
      return false
    }

    return true
  })
}

export function cloneTaskDraftFromNode(branch: ReusableTaskBranch): TaskDraft {
  return {
    id: createUuid(),
    title: branch.node.title,
    points: branch.node.points,
    bonusPoints: branch.node.bonusPoints ?? 0,
    isChoice: branch.node.isChoice,
    choiceGroup: branch.node.choiceGroup ?? '',
    reusable: Boolean(branch.node.reusable),
    subject: branch.node.subject ?? '',
    gradeLevel: branch.node.gradeLevel ?? '',
    criteria: branch.node.criteria.map(criterion => ({
      id: createUuid(),
      text: criterion.text,
      points: criterion.points
    })),
    subtasks: branch.children.map(child => cloneTaskDraftFromNode(child))
  }
}

export const useExamBuilderStore = defineStore('examBuilder', () => {
  const title = ref('')
  const description = ref('')
  const classGroupId = ref('')
  const assessmentFormat = ref<ExamsTypes.ExamAssessmentFormat>('klausur')
  const mode = ref<'simple' | 'complex'>('complex')
  const tasks = ref<TaskDraft[]>([])
  const parts = ref<PartDraft[]>([])
  const candidateGroups = ref<CandidateGroupDraft[]>([])
  const reusableTaskLibrary = ref<ReusableTaskCollectionItem[]>([])
  const isEditing = ref(false)
  const createdAt = ref<Date | null>(null)
  const examId = ref<string | undefined>(undefined)
  const sourceTemplateId = ref<string | undefined>(undefined)

  const flatTasks = computed(() => flattenTasks(tasks.value))
  const totalPoints = computed(() => tasks.value.reduce((sum, task) => sum + resolveTaskPoints(task), 0))
  const canSave = computed(() => title.value.trim().length > 0 && tasks.value.length > 0)

  const newTask = (): TaskDraft => ({
    id: createUuid(),
    title: '',
    points: 0,
    bonusPoints: 0,
    isChoice: false,
    choiceGroup: '',
    reusable: false,
    subject: '',
    gradeLevel: '',
    criteria: [],
    subtasks: []
  })

  const newCriterion = (): CriterionDraft => ({ id: createUuid(), text: '', points: 0 })

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
        warnings.push({ taskId: task.id, taskTitle: task.title || '(ohne Titel)', kind: 'criteria-with-subtasks' })
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
        reusable: task.reusable,
        subject: task.subject.trim() || undefined,
        gradeLevel: task.gradeLevel.trim() || undefined,
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
        subtasks: task.subtasks.map(subtask => subtask.id)
      })
      if (level < 3 && task.subtasks.length) {
        output.push(...flattenTasks(task.subtasks, (level + 1) as 2 | 3, task.id))
      }
    })
    return output
  }

  const setMode = (next: 'simple' | 'complex'): void => {
    mode.value = next
    if (next === 'simple') {
      parts.value = []
      tasks.value.forEach(task => { task.subtasks = [] })
    }
    recalculateTaskPoints()
  }

  const addTask = (): void => {
    tasks.value.push(newTask())
    recalculateTaskPoints()
  }

  const canInsertReusableTask = (item: ReusableTaskCollectionItem): boolean => {
    return mode.value === 'complex' || item.task.children.length === 0
  }

  const insertReusableTask = (item: ReusableTaskCollectionItem): void => {
    tasks.value.push(cloneTaskDraftFromNode(item.task))
    recalculateTaskPoints()
  }

  const addSubtask = (task: TaskDraft, level: 2 | 3): void => {
    if (level === 2 || level === 3) task.subtasks.push(newTask())
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

  const addPart = (): void => { parts.value.push(newPart()) }
  const removePart = (id: string): void => { parts.value = parts.value.filter(part => part.id !== id) }

  const loadReusableTasks = async (): Promise<void> => {
    const { examRepository } = useExamsBridge()
    const exams = await examRepository?.findAll() ?? []
    reusableTaskLibrary.value = collectReusableTasks(exams)
  }

  const buildExam = (): ExamsTypes.Exam => {
    const now = new Date()
    recalculateTaskPoints()
    return {
      id: examId.value ?? createUuid(),
      title: title.value.trim(),
      description: description.value.trim() || undefined,
      classGroupId: classGroupId.value.trim() || undefined,
      assessmentFormat: assessmentFormat.value,
      mode: mode.value as ExamsTypes.ExamMode,
      kind: 'template',
      sourceTemplateId: sourceTemplateId.value,
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
        tasks: flattenTasks(tasks.value),
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
      candidateGroups: candidateGroups.value.map(group => ({
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
  }

  const hydrateFromExam = (exam: ExamsTypes.Exam): void => {
    examId.value = exam.id
    isEditing.value = true
    createdAt.value = exam.createdAt
    sourceTemplateId.value = exam.sourceTemplateId
    title.value = exam.title
    description.value = exam.description ?? ''
    classGroupId.value = exam.classGroupId ?? ''
    assessmentFormat.value = exam.assessmentFormat ?? 'klausur'
    mode.value = exam.mode
    candidateGroups.value = (exam.candidateGroups ?? []).map(group => ({
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
        .map(task => toTaskDraft(task))
      recalculateTaskPoints()
      return
    }

    const byId = new Map<string, TaskDraft>()
    exam.structure.tasks.forEach(task => { byId.set(task.id, toTaskDraft(task)) })
    const root: TaskDraft[] = []
    exam.structure.tasks
      .sort((a, b) => a.order - b.order)
      .forEach(task => {
        const draft = byId.get(task.id)
        if (!draft) return
        if (!task.parentId) {
          root.push(draft)
        } else {
          byId.get(task.parentId)?.subtasks.push(draft)
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
        if (created) examId.value = created.id
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
    sourceTemplateId.value = undefined
    title.value = ''
    description.value = ''
    classGroupId.value = ''
    assessmentFormat.value = 'klausur'
    mode.value = 'complex'
    tasks.value = []
    parts.value = []
    candidateGroups.value = []
    reusableTaskLibrary.value = []
  }

  return {
    title,
    description,
    classGroupId,
    assessmentFormat,
    mode,
    tasks,
    parts,
    candidateGroups,
    reusableTaskLibrary,
    isEditing,
    createdAt,
    examId,
    sourceTemplateId,
    flatTasks,
    totalPoints,
    canSave,
    setMode,
    addTask,
    canInsertReusableTask,
    insertReusableTask,
    addSubtask,
    removeTask,
    removeNestedTask,
    moveTask,
    addCriterion,
    removeCriterion,
    addPart,
    removePart,
    loadReusableTasks,
    recalculateTaskPoints,
    getCriteriaConsistencyWarnings,
    buildExam,
    hydrateFromExam,
    saveExam,
    loadExam,
    reset
  }
})
