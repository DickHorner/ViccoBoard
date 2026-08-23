/**
 * P5-3: Complex Exam Builder Store Tests
 *
 * Verifies examBuilderStore key features:
 * - 3-level hierarchy (addTask, addSubtask)
 * - Choice task support (isChoice, choiceGroup)
 * - Bonus point configuration (bonusPoints)
 * - Exam parts management (addPart, removePart)
 * - Drag-and-drop reordering (moveTask)
 */

import { setActivePinia, createPinia } from 'pinia'
import type { Exams as ExamsTypes } from '@viccoboard/core'

// Mock vue-router before importing store
jest.mock('vue-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

const mockExamRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  create: jest.fn()
}

// Mock useExamsBridge before importing store
jest.mock('../src/composables/useExamsBridge', () => ({
  useExamsBridge: () => ({
    examRepository: mockExamRepository
  }),
}))

import {
  collectReusableTasks,
  filterReusableTasks,
  useExamBuilderStore
} from '../src/stores/examBuilderStore'

const createReusableExam = (): ExamsTypes.Exam => ({
  id: 'exam-1',
  title: 'Klassenarbeit Deutsch',
  assessmentFormat: 'klausur',
  mode: 'complex',
  structure: {
    parts: [],
    tasks: [
      {
        id: 'task-root',
        level: 1,
        order: 1,
        title: 'Erörterung',
        points: 6,
        bonusPoints: 1,
        isChoice: false,
        reusable: true,
        subject: 'Deutsch',
        gradeLevel: '8',
        criteria: [],
        allowComments: false,
        allowSupportTips: false,
        commentBoxEnabled: false,
        subtasks: ['task-child']
      },
      {
        id: 'task-child',
        parentId: 'task-root',
        level: 2,
        order: 1,
        title: 'Material auswerten',
        points: 6,
        isChoice: false,
        reusable: false,
        subject: 'Deutsch',
        gradeLevel: '8',
        criteria: [
          {
            id: 'criterion-child',
            text: 'Analyse der Quelle',
            formatting: {},
            points: 6,
            aspectBased: false
          }
        ],
        allowComments: false,
        allowSupportTips: false,
        commentBoxEnabled: false,
        subtasks: []
      },
      {
        id: 'task-non-reusable',
        level: 1,
        order: 2,
        title: 'Nicht in Sammlung',
        points: 5,
        isChoice: false,
        reusable: false,
        subject: 'Mathe',
        gradeLevel: '9',
        criteria: [],
        allowComments: false,
        allowSupportTips: false,
        commentBoxEnabled: false,
        subtasks: []
      }
    ],
    allowsComments: false,
    allowsSupportTips: false,
    totalPoints: 11
  },
  gradingKey: {
    id: 'grading-key-1',
    name: 'default',
    type: 'points',
    totalPoints: 11,
    gradeBoundaries: [],
    roundingRule: { type: 'none', decimalPlaces: 0 },
    errorPointsToGrade: false,
    customizable: true,
    modifiedAfterCorrection: false
  },
  printPresets: [],
  candidates: [],
  candidateGroups: [],
  status: 'draft',
  createdAt: new Date('2026-01-10T00:00:00.000Z'),
  lastModified: new Date('2026-01-10T00:00:00.000Z')
})

describe('P5-3: examBuilderStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockExamRepository.findAll.mockReset()
    mockExamRepository.findById.mockReset()
    mockExamRepository.update.mockReset()
    mockExamRepository.create.mockReset()
  })

  describe('3-level hierarchy', () => {
    it('adds a root-level task', () => {
      const store = useExamBuilderStore()
      expect(store.tasks).toHaveLength(0)
      store.addTask()
      expect(store.tasks).toHaveLength(1)
    })

    it('adds a level-2 subtask to a root task', () => {
      const store = useExamBuilderStore()
      store.addTask()
      const root = store.tasks[0]
      expect(root.subtasks).toHaveLength(0)
      store.addSubtask(root, 2)
      expect(root.subtasks).toHaveLength(1)
    })

    it('adds a level-3 subtask to a level-2 task', () => {
      const store = useExamBuilderStore()
      store.addTask()
      const root = store.tasks[0]
      store.addSubtask(root, 2)
      const level2 = root.subtasks[0]
      store.addSubtask(level2, 3)
      expect(level2.subtasks).toHaveLength(1)
    })

    it('removes a root task by id', () => {
      const store = useExamBuilderStore()
      store.addTask()
      const taskId = store.tasks[0].id
      store.removeTask(taskId)
      expect(store.tasks).toHaveLength(0)
    })

    it('removes a nested task by id', () => {
      const store = useExamBuilderStore()
      store.addTask()
      const root = store.tasks[0]
      store.addSubtask(root, 2)
      const subtaskId = root.subtasks[0].id
      store.removeNestedTask(root, subtaskId)
      expect(root.subtasks).toHaveLength(0)
    })

    it('flatTasks includes tasks at all levels', () => {
      const store = useExamBuilderStore()
      store.addTask()
      const root = store.tasks[0]
      store.addSubtask(root, 2)
      const level2 = root.subtasks[0]
      store.addSubtask(level2, 3)
      expect(store.flatTasks.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('choice task support', () => {
    it('new tasks have isChoice false by default', () => {
      const store = useExamBuilderStore()
      store.addTask()
      expect(store.tasks[0].isChoice).toBe(false)
    })

    it('allows setting isChoice and choiceGroup on a task', () => {
      const store = useExamBuilderStore()
      store.addTask()
      const task = store.tasks[0]
      task.isChoice = true
      task.choiceGroup = 'A'
      expect(task.isChoice).toBe(true)
      expect(task.choiceGroup).toBe('A')
    })

    it('buildExam preserves choice task fields', () => {
      const store = useExamBuilderStore()
      store.title = 'Choice Test'
      store.addTask()
      const task = store.tasks[0]
      task.title = 'Optional Question'
      task.isChoice = true
      task.choiceGroup = 'B'
      task.points = 5
      const exam = store.buildExam()
      const flatTask = exam.structure.tasks.find(t => t.isChoice === true)
      expect(flatTask).toBeDefined()
      expect(flatTask?.choiceGroup).toBe('B')
    })
  })

  describe('bonus point configuration', () => {
    it('new tasks have bonusPoints 0 by default', () => {
      const store = useExamBuilderStore()
      store.addTask()
      expect(store.tasks[0].bonusPoints).toBe(0)
    })

    it('allows setting bonusPoints on a task', () => {
      const store = useExamBuilderStore()
      store.addTask()
      store.tasks[0].bonusPoints = 2.5
      expect(store.tasks[0].bonusPoints).toBe(2.5)
    })

    it('buildExam preserves bonus points', () => {
      const store = useExamBuilderStore()
      store.title = 'Bonus Test'
      store.addTask()
      store.tasks[0].title = 'Bonus Task'
      store.tasks[0].points = 10
      store.tasks[0].bonusPoints = 3
      const exam = store.buildExam()
      const flatTask = exam.structure.tasks.find(t => t.bonusPoints === 3)
      expect(flatTask).toBeDefined()
    })
  })

  describe('exam parts management', () => {
    it('adds an exam part', () => {
      const store = useExamBuilderStore()
      expect(store.parts).toHaveLength(0)
      store.addPart()
      expect(store.parts).toHaveLength(1)
    })

    it('removes an exam part by id', () => {
      const store = useExamBuilderStore()
      store.addPart()
      const partId = store.parts[0].id
      store.removePart(partId)
      expect(store.parts).toHaveLength(0)
    })

    it('new parts have required fields', () => {
      const store = useExamBuilderStore()
      store.addPart()
      const part = store.parts[0]
      expect(part.id).toBeDefined()
      expect(part.name).toBe('')
      expect(Array.isArray(part.taskIds)).toBe(true)
      expect(typeof part.calculateSubScore).toBe('boolean')
      expect(typeof part.printable).toBe('boolean')
    })

    it('setMode("simple") clears exam parts', () => {
      const store = useExamBuilderStore()
      store.setMode('complex')
      store.addPart()
      expect(store.parts).toHaveLength(1)
      store.setMode('simple')
      expect(store.parts).toHaveLength(0)
    })
  })

  describe('drag-and-drop task reordering (moveTask)', () => {
    it('moves a task down by 1 position', () => {
      const store = useExamBuilderStore()
      store.addTask()
      store.addTask()
      const idFirst = store.tasks[0].id
      store.moveTask(store.tasks, 0, 1)
      expect(store.tasks[1].id).toBe(idFirst)
    })

    it('moves a task up by 1 position', () => {
      const store = useExamBuilderStore()
      store.addTask()
      store.addTask()
      const idSecond = store.tasks[1].id
      store.moveTask(store.tasks, 1, -1)
      expect(store.tasks[0].id).toBe(idSecond)
    })

    it('does not move task out of bounds (start)', () => {
      const store = useExamBuilderStore()
      store.addTask()
      store.addTask()
      const idFirst = store.tasks[0].id
      store.moveTask(store.tasks, 0, -1) // already at start
      expect(store.tasks[0].id).toBe(idFirst)
    })

    it('does not move task out of bounds (end)', () => {
      const store = useExamBuilderStore()
      store.addTask()
      store.addTask()
      const idLast = store.tasks[1].id
      store.moveTask(store.tasks, 1, 1) // already at end
      expect(store.tasks[1].id).toBe(idLast)
    })

    it('moves nested subtasks within parent', () => {
      const store = useExamBuilderStore()
      store.addTask()
      const root = store.tasks[0]
      store.addSubtask(root, 2)
      store.addSubtask(root, 2)
      const firstSubId = root.subtasks[0].id
      store.moveTask(root.subtasks, 0, 1)
      expect(root.subtasks[1].id).toBe(firstSubId)
    })
  })

  describe('totalPoints computed', () => {
    it('sums points from all root-level tasks', () => {
      const store = useExamBuilderStore()
      store.addTask()
      store.addTask()
      store.tasks[0].points = 10
      store.tasks[1].points = 5
      expect(store.totalPoints).toBe(15)
    })

    it('canSave is false when no title', () => {
      const store = useExamBuilderStore()
      store.addTask()
      expect(store.canSave).toBe(false)
    })

    it('canSave is true when title and tasks exist', () => {
      const store = useExamBuilderStore()
      store.title = 'My Exam'
      store.addTask()
      expect(store.canSave).toBe(true)
    })

    it('rolls criterion points up into the parent task automatically', () => {
      const store = useExamBuilderStore()
      store.addTask()
      const task = store.tasks[0]

      store.addCriterion(task)
      store.addCriterion(task)
      task.criteria[0].points = 3.5
      task.criteria[1].points = 4.5
      store.recalculateTaskPoints()

      expect(task.points).toBe(8)
      expect(store.totalPoints).toBe(8)
    })

    it('rolls subtask points up through the hierarchy automatically', () => {
      const store = useExamBuilderStore()
      store.title = 'Komplexe Klausur'
      store.setMode('complex')
      store.addTask()

      const root = store.tasks[0]
      root.title = 'Aufgabe 1'
      store.addSubtask(root, 2)
      const subtask = root.subtasks[0]
      subtask.title = 'Aufgabe 1a'
      store.addCriterion(subtask)
      subtask.criteria[0].text = 'Inhalt'
      subtask.criteria[0].points = 5
      store.recalculateTaskPoints()

      const exam = store.buildExam()
      const savedRoot = exam.structure.tasks.find((task) => task.id === root.id)
      const savedSubtask = exam.structure.tasks.find((task) => task.id === subtask.id)

      expect(root.points).toBe(5)
      expect(store.totalPoints).toBe(5)
      expect(savedRoot?.points).toBe(5)
      expect(savedSubtask?.title).toBe('Aufgabe 1a')
      expect(savedSubtask?.criteria[0]?.text).toBe('Inhalt')
      expect(savedSubtask?.criteria[0]?.points).toBe(5)
    })
  })

  describe('KBR-specific metadata', () => {
    it('preserves assessment format and candidate groups in buildExam', () => {
      const store = useExamBuilderStore()
      store.title = 'Gruppenpruefung'
      store.assessmentFormat = 'gruppenarbeit'
      store.addTask()
      store.candidateGroups.push({
        id: 'group-1',
        name: 'Gruppe A',
        memberCandidateIds: ['candidate-1'],
        topic: 'Praesentation',
        notes: 'Mit Medien'
      })

      const exam = store.buildExam()

      expect(exam.assessmentFormat).toBe('gruppenarbeit')
      expect(exam.candidateGroups).toHaveLength(1)
      expect(exam.candidateGroups[0].name).toBe('Gruppe A')
      expect(exam.candidateGroups[0].memberCandidateIds).toEqual(['candidate-1'])
    })

    it('hydrates assessment format and candidate groups from an existing exam', () => {
      const store = useExamBuilderStore()
      const exam = store.buildExam()

      store.hydrateFromExam({
        ...exam,
        title: 'Portfolio',
        assessmentFormat: 'portfolio',
        candidateGroups: [
          {
            id: 'group-2',
            name: 'Portfolio-Team',
            memberCandidateIds: ['candidate-2'],
            topic: 'Recherche',
            notes: 'Partnerarbeit'
          }
        ]
      })

      expect(store.assessmentFormat).toBe('portfolio')
      expect(store.candidateGroups).toHaveLength(1)
      expect(store.candidateGroups[0].topic).toBe('Recherche')
    })
  })

  describe('criteria consistency validation (getCriteriaConsistencyWarnings)', () => {
    it('returns no warnings for a task with criteria only', () => {
      const store = useExamBuilderStore()
      store.addTask()
      const task = store.tasks[0]
      store.addCriterion(task)
      task.criteria[0].text = 'Inhalt'
      task.criteria[0].points = 5
      store.recalculateTaskPoints()

      expect(store.getCriteriaConsistencyWarnings()).toHaveLength(0)
    })

    it('returns a criteria-with-subtasks warning when task has both criteria and subtasks', () => {
      const store = useExamBuilderStore()
      store.setMode('complex')
      store.addTask()
      const root = store.tasks[0]
      root.title = 'Aufgabe 1'
      store.addCriterion(root)
      root.criteria[0].text = 'Kriterium auf Root'
      root.criteria[0].points = 3
      store.addSubtask(root, 2)

      const warnings = store.getCriteriaConsistencyWarnings()
      expect(warnings).toHaveLength(1)
      expect(warnings[0].kind).toBe('criteria-with-subtasks')
      expect(warnings[0].taskId).toBe(root.id)
    })

    it('returns no warnings for a leaf task with multiple criteria', () => {
      const store = useExamBuilderStore()
      store.addTask()
      const task = store.tasks[0]
      store.addCriterion(task)
      store.addCriterion(task)
      task.criteria[0].points = 3
      task.criteria[1].points = 7
      store.recalculateTaskPoints()

      expect(task.points).toBe(10)
      expect(store.getCriteriaConsistencyWarnings()).toHaveLength(0)
    })

    it('criteria points are preserved through buildExam and hydrateFromExam round-trip', () => {
      const store = useExamBuilderStore()
      store.title = 'Kriterien Round-Trip'
      store.addTask()
      const task = store.tasks[0]
      task.title = 'Aufgabe 1'
      store.addCriterion(task)
      task.criteria[0].text = 'Analyse'
      task.criteria[0].points = 4
      store.addCriterion(task)
      task.criteria[1].text = 'Darstellung'
      task.criteria[1].points = 6
      store.recalculateTaskPoints()

      const exam = store.buildExam()
      const savedTask = exam.structure.tasks.find(t => t.id === task.id)
      expect(savedTask?.criteria).toHaveLength(2)
      expect(savedTask?.criteria[0].text).toBe('Analyse')
      expect(savedTask?.criteria[0].points).toBe(4)
      expect(savedTask?.criteria[1].text).toBe('Darstellung')
      expect(savedTask?.criteria[1].points).toBe(6)

      // Round-trip: hydrate from saved exam
      store.reset()
      store.hydrateFromExam(exam)
      const reloadedTask = store.tasks[0]
      expect(reloadedTask.criteria).toHaveLength(2)
      expect(reloadedTask.criteria[0].text).toBe('Analyse')
      expect(reloadedTask.criteria[0].points).toBe(4)
      expect(reloadedTask.criteria[1].text).toBe('Darstellung')
      expect(reloadedTask.criteria[1].points).toBe(6)
    })
  })

  describe('reusable task library slice', () => {
    it('loads only reusable tasks from existing exams into the collection', async () => {
      const store = useExamBuilderStore()
      mockExamRepository.findAll.mockResolvedValue([createReusableExam()])

      await store.loadReusableTasks()

      expect(store.reusableTaskLibrary).toHaveLength(1)
      expect(store.reusableTaskLibrary[0].title).toBe('Erörterung')
      expect(store.reusableTaskLibrary[0].subject).toBe('Deutsch')
      expect(store.reusableTaskLibrary[0].gradeLevel).toBe('8')
    })

    it('filters reusable tasks by subject, grade level, and text query', () => {
      const additionalExam: ExamsTypes.Exam = {
        ...createReusableExam(),
        id: 'exam-2',
        title: 'Mathearbeit',
        structure: {
          ...createReusableExam().structure,
          tasks: [
            {
              id: 'math-root',
              level: 1,
              order: 1,
              title: 'Lineare Funktionen',
              points: 8,
              isChoice: false,
              reusable: true,
              subject: 'Mathematik',
              gradeLevel: '9',
              criteria: [
                {
                  id: 'math-criterion',
                  text: 'Funktionsgleichung bestimmen',
                  formatting: {},
                  points: 8,
                  aspectBased: false
                }
              ],
              allowComments: false,
              allowSupportTips: false,
              commentBoxEnabled: false,
              subtasks: []
            }
          ],
          totalPoints: 8
        }
      }

      const items = collectReusableTasks([createReusableExam(), additionalExam])

      expect(filterReusableTasks(items, { subject: 'Deutsch' })).toHaveLength(1)
      expect(filterReusableTasks(items, { gradeLevel: '9' })).toHaveLength(1)
      expect(filterReusableTasks(items, { query: 'analyse der quelle' })).toHaveLength(1)
      expect(filterReusableTasks(items, {
        subject: 'Deutsch',
        gradeLevel: '8',
        query: 'analyse der quelle'
      })).toHaveLength(1)
    })

    it('inserts a reusable task as a deep copy with fresh task and criterion ids', () => {
      const store = useExamBuilderStore()
      store.setMode('complex')
      const sourceItem = collectReusableTasks([createReusableExam()])[0]
      const sourceSnapshot = JSON.parse(JSON.stringify(sourceItem))

      store.insertReusableTask(sourceItem)

      expect(store.tasks).toHaveLength(1)
      const insertedTask = store.tasks[0]

      expect(insertedTask.id).not.toBe(sourceItem.task.node.id)
      expect(insertedTask.criteria).toHaveLength(0)
      expect(insertedTask.subtasks[0].id).not.toBe(sourceItem.task.children[0].node.id)
      expect(insertedTask.subtasks[0].criteria[0].id).not.toBe(sourceItem.task.children[0].node.criteria[0].id)
      expect(insertedTask.title).toBe(sourceItem.task.node.title)
      expect(insertedTask.points).toBe(sourceItem.task.node.points)
      expect(insertedTask.bonusPoints).toBe(sourceItem.task.node.bonusPoints)
      expect(insertedTask.subject).toBe(sourceItem.task.node.subject)
      expect(insertedTask.gradeLevel).toBe(sourceItem.task.node.gradeLevel)
      expect(insertedTask.subtasks[0].title).toBe(sourceItem.task.children[0].node.title)
      expect(sourceItem).toEqual(sourceSnapshot)
    })
  })

  describe('§6.9/§6.22 criterion formatting and task comment/tip flags', () => {
    it('new criterion has empty formatting object', () => {
      const store = useExamBuilderStore()
      store.addTask()
      store.addCriterion(store.tasks[0])
      expect(store.tasks[0].criteria[0].formatting).toEqual({})
    })

    it('new task has allowComments, allowSupportTips, commentBoxEnabled defaulting to false', () => {
      const store = useExamBuilderStore()
      store.addTask()
      const task = store.tasks[0]
      expect(task.allowComments).toBe(false)
      expect(task.allowSupportTips).toBe(false)
      expect(task.commentBoxEnabled).toBe(false)
    })

    it('flattenTasks preserves criterion formatting through buildExam', () => {
      const store = useExamBuilderStore()
      store.title = 'Formatting Test'
      store.addTask()
      const task = store.tasks[0]
      task.title = 'Aufgabe 1'
      store.addCriterion(task)
      task.criteria[0].text = 'Inhalt'
      task.criteria[0].points = 5
      task.criteria[0].formatting = { bold: true, underline: true }
      store.recalculateTaskPoints()

      const exam = store.buildExam()
      const savedTask = exam.structure.tasks.find(t => t.id === task.id)
      expect(savedTask?.criteria[0].formatting).toEqual({ bold: true, underline: true })
    })

    it('flattenTasks preserves allowComments, allowSupportTips, commentBoxEnabled through buildExam', () => {
      const store = useExamBuilderStore()
      store.title = 'Flags Test'
      store.addTask()
      const task = store.tasks[0]
      task.title = 'Aufgabe 1'
      task.points = 5
      task.allowComments = true
      task.allowSupportTips = true
      task.commentBoxEnabled = true

      const exam = store.buildExam()
      const savedTask = exam.structure.tasks.find(t => t.id === task.id)
      expect(savedTask?.allowComments).toBe(true)
      expect(savedTask?.allowSupportTips).toBe(true)
      expect(savedTask?.commentBoxEnabled).toBe(true)
    })

    it('formatting and flags survive buildExam → hydrateFromExam round-trip', () => {
      const store = useExamBuilderStore()
      store.title = 'Roundtrip'
      store.addTask()
      const task = store.tasks[0]
      task.title = 'Aufgabe 1'
      store.addCriterion(task)
      task.criteria[0].text = 'Analyse'
      task.criteria[0].points = 4
      task.criteria[0].formatting = { bold: true }
      task.allowComments = true
      task.allowSupportTips = false
      task.commentBoxEnabled = true
      store.recalculateTaskPoints()

      const exam = store.buildExam()
      store.reset()
      store.hydrateFromExam(exam)

      const reloaded = store.tasks[0]
      expect(reloaded.criteria[0].formatting).toEqual({ bold: true })
      expect(reloaded.allowComments).toBe(true)
      expect(reloaded.allowSupportTips).toBe(false)
      expect(reloaded.commentBoxEnabled).toBe(true)
    })
  })
})
