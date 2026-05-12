import type { Exams } from '@viccoboard/core'
import type { TaskDraft } from '../stores/examBuilderStore'

export interface ReusableTaskEntry {
  examId: string
  examTitle: string
  task: Exams.TaskNode
  childTasks: Exams.TaskNode[]
}

export interface TaskCollectionFilters {
  subject: string
  gradeLevel: string
  query: string
}

type CreateId = () => string

const normalize = (value?: string): string => value?.trim().toLowerCase() ?? ''

const collectDescendants = (
  task: Exams.TaskNode,
  tasksById: Map<string, Exams.TaskNode>
): Exams.TaskNode[] => {
  const descendants: Exams.TaskNode[] = []

  task.subtasks.forEach((childId) => {
    const child = tasksById.get(childId)
    if (!child) return

    descendants.push(child)
    descendants.push(...collectDescendants(child, tasksById))
  })

  return descendants
}

export const collectReusableTasks = (exams: Exams.Exam[]): ReusableTaskEntry[] => {
  return exams.flatMap((exam) => {
    const tasksById = new Map(exam.structure.tasks.map((task) => [task.id, task]))

    return exam.structure.tasks
      .filter((task) => task.reusable === true)
      .map((task) => ({
        examId: exam.id,
        examTitle: exam.title,
        task,
        childTasks: collectDescendants(task, tasksById)
      }))
  })
}

export const filterReusableTasks = (
  entries: ReusableTaskEntry[],
  filters: TaskCollectionFilters
): ReusableTaskEntry[] => {
  const subject = normalize(filters.subject)
  const gradeLevel = normalize(filters.gradeLevel)
  const query = normalize(filters.query)

  return entries.filter((entry) => {
    if (subject && normalize(entry.task.subject) !== subject) return false
    if (gradeLevel && normalize(entry.task.gradeLevel) !== gradeLevel) return false
    if (!query) return true

    const searchable = [
      entry.task.title,
      ...entry.task.criteria.map((criterion) => criterion.text),
      ...entry.childTasks.flatMap((task) => [
        task.title,
        ...task.criteria.map((criterion) => criterion.text)
      ])
    ].join(' ')

    return normalize(searchable).includes(query)
  })
}

export const cloneTaskDraftFromNode = (
  task: Exams.TaskNode,
  childTasks: Exams.TaskNode[],
  createId: CreateId
): TaskDraft => {
  const childrenByParentId = new Map<string, Exams.TaskNode[]>()
  childTasks.forEach((child) => {
    if (!child.parentId) return

    const siblings = childrenByParentId.get(child.parentId) ?? []
    siblings.push(child)
    childrenByParentId.set(child.parentId, siblings)
  })

  const cloneNode = (node: Exams.TaskNode): TaskDraft => ({
    id: createId(),
    title: node.title,
    points: node.points,
    bonusPoints: node.bonusPoints ?? 0,
    reusable: node.reusable ?? false,
    subject: node.subject ?? '',
    gradeLevel: node.gradeLevel ?? '',
    isChoice: node.isChoice,
    choiceGroup: node.choiceGroup ?? '',
    criteria: node.criteria.map((criterion) => ({
      id: createId(),
      text: criterion.text,
      points: criterion.points,
      formatting: { ...criterion.formatting },
      aspectBased: criterion.aspectBased,
      subCriteria: criterion.subCriteria?.map((subCriterion) => ({
        ...subCriterion,
        id: createId(),
        formatting: { ...subCriterion.formatting }
      }))
    })),
    subtasks: (childrenByParentId.get(node.id) ?? [])
      .sort((a, b) => a.order - b.order)
      .map(cloneNode)
  })

  return cloneNode(task)
}
