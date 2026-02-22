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

// Mock vue-router before importing store
jest.mock('vue-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

// Mock useExamsBridge before importing store
jest.mock('../src/composables/useExamsBridge', () => ({
  useExamsBridge: () => ({
    saveExam: jest.fn().mockResolvedValue({ id: 'saved-exam-id' }),
    getExam: jest.fn().mockResolvedValue(null),
  }),
}))

import { useExamBuilderStore } from '../src/stores/examBuilderStore'

describe('P5-3: examBuilderStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
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
  })
})
