import type { Exams } from '@viccoboard/core'
import {
  cloneTaskDraftFromNode,
  collectReusableTasks,
  filterReusableTasks
} from '../src/utils/task-collection'

const task = (overrides: Partial<Exams.TaskNode> & Pick<Exams.TaskNode, 'id' | 'title'>): Exams.TaskNode => ({
  id: overrides.id,
  parentId: overrides.parentId,
  level: overrides.level ?? 1,
  order: overrides.order ?? 1,
  title: overrides.title,
  points: overrides.points ?? 0,
  bonusPoints: overrides.bonusPoints,
  reusable: overrides.reusable,
  subject: overrides.subject,
  gradeLevel: overrides.gradeLevel,
  isChoice: overrides.isChoice ?? false,
  choiceGroup: overrides.choiceGroup,
  criteria: overrides.criteria ?? [],
  allowComments: overrides.allowComments ?? false,
  allowSupportTips: overrides.allowSupportTips ?? false,
  commentBoxEnabled: overrides.commentBoxEnabled ?? false,
  subtasks: overrides.subtasks ?? []
})

const exam = (tasks: Exams.TaskNode[]): Exams.Exam => ({
  id: 'exam-1',
  title: 'Klausur 1',
  assessmentFormat: 'klausur',
  mode: 'complex' as Exams.ExamMode,
  structure: {
    parts: [],
    tasks,
    allowsComments: false,
    allowsSupportTips: false,
    totalPoints: 0
  },
  gradingKey: {
    id: 'grading-1',
    name: 'Default',
    type: 'points' as Exams.GradingKeyType,
    totalPoints: 0,
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
  createdAt: new Date('2026-01-01T00:00:00Z'),
  lastModified: new Date('2026-01-01T00:00:00Z')
})

describe('task collection helpers', () => {
  it('collects tasks marked reusable', () => {
    const entries = collectReusableTasks([
      exam([
        task({ id: 'task-1', title: 'Sichtbar', reusable: true }),
        task({ id: 'task-2', title: 'Unsichtbar', reusable: false })
      ])
    ])

    expect(entries).toHaveLength(1)
    expect(entries[0].task.title).toBe('Sichtbar')
  })

  it('filters by subject, grade level and criteria text', () => {
    const entries = collectReusableTasks([
      exam([
        task({
          id: 'task-1',
          title: 'Rechnungswesen',
          reusable: true,
          subject: 'KBR',
          gradeLevel: '11',
          criteria: [
            {
              id: 'criterion-1',
              text: 'Bilanz analysieren',
              formatting: {},
              points: 4,
              aspectBased: false
            }
          ]
        }),
        task({ id: 'task-2', title: 'Deutsch', reusable: true, subject: 'Deutsch', gradeLevel: '10' })
      ])
    ])

    expect(filterReusableTasks(entries, { subject: 'KBR', gradeLevel: '11', query: 'bilanz' })).toHaveLength(1)
    expect(filterReusableTasks(entries, { subject: 'Deutsch', gradeLevel: '11', query: '' })).toHaveLength(0)
  })

  it('clones task, criteria and subtasks with new ids without mutating the original', () => {
    let nextId = 0
    const createId = () => `new-${++nextId}`
    const root = task({
      id: 'task-root',
      title: 'Root',
      points: 7,
      bonusPoints: 1,
      reusable: true,
      subject: 'KBR',
      gradeLevel: '12',
      subtasks: ['task-child']
    })
    const child = task({
      id: 'task-child',
      parentId: 'task-root',
      level: 2,
      order: 1,
      title: 'Child',
      points: 7,
      criteria: [
        {
          id: 'criterion-1',
          text: 'Loesung',
          formatting: { bold: true },
          points: 7,
          aspectBased: false,
          subCriteria: [
            {
              id: 'subcriterion-1',
              text: 'Teilaspekt',
              formatting: { italic: true },
              weight: 1
            }
          ]
        }
      ]
    })

    const clone = cloneTaskDraftFromNode(root, [child], createId)

    expect(clone.id).not.toBe(root.id)
    expect(clone.reusable).toBe(true)
    expect(clone.subject).toBe('KBR')
    expect(clone.gradeLevel).toBe('12')
    expect(clone.subtasks).toHaveLength(1)
    expect(clone.subtasks[0].id).not.toBe(child.id)
    expect(clone.subtasks[0].criteria[0].id).not.toBe('criterion-1')
    expect(clone.subtasks[0].criteria[0].subCriteria?.[0].id).not.toBe('subcriterion-1')
    expect(child.criteria[0].id).toBe('criterion-1')
    expect(root.subtasks).toEqual(['task-child'])
  })
})
