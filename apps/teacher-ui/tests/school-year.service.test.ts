import { InMemoryStorageAdapter } from '@viccoboard/storage/browser'
import { ClassGroupRepository } from '@viccoboard/sport'
import { StudentRepository } from '@viccoboard/students'
import type { ExamRepository } from '@viccoboard/exams'
import type { Exams } from '@viccoboard/core'
import {
  SchoolYearTransitionService,
  nextSchoolYear,
  suggestedClassName
} from '../src/services/school-year.service'

describe('SchoolYearTransitionService', () => {
  let adapter: InMemoryStorageAdapter
  let classGroups: ClassGroupRepository
  let students: StudentRepository
  let service: SchoolYearTransitionService
  let sourceId: string
  const archivedExam = {
    id: 'exam-old',
    kind: 'exam',
    classGroupId: '',
    candidates: [{ id: 'candidate-1' }],
    status: 'completed'
  } as unknown as Exams.Exam
  const reusableTemplate = {
    id: 'template-1',
    kind: 'template',
    candidates: [],
    status: 'draft'
  } as unknown as Exams.Exam
  let exams: Exams.Exam[]

  beforeEach(async () => {
    adapter = new InMemoryStorageAdapter()
    await adapter.initialize()
    classGroups = new ClassGroupRepository(adapter)
    students = new StudentRepository(adapter)

    const oldClass = await classGroups.create({
      name: '9a',
      schoolYear: '2025/2026',
      gradeLevel: 9,
      archived: false,
      gradingScheme: 'default'
    })
    sourceId = oldClass.id

    await students.create({
      firstName: 'Anna',
      lastName: 'Muster',
      dateOfBirth: '2010-10-01',
      classGroupId: sourceId
    })
    archivedExam.classGroupId = sourceId
    exams = [archivedExam, reusableTemplate]
    service = new SchoolYearTransitionService(
      classGroups,
      students,
      { findAll: async () => exams } as unknown as ExamRepository,
      adapter
    )
  })

  test('previews the transition without changing records', async () => {
    const result = await service.preview({
      fromYear: '2025/2026',
      targetYear: '2026/2027',
      decisions: [{ classGroupId: sourceId, action: 'promote', targetName: '10a', targetGradeLevel: 10 }]
    })

    expect(result).toEqual({
      fromYear: '2025/2026',
      targetYear: '2026/2027',
      archivedClasses: 0,
      promotedClasses: 1,
      copiedStudents: 1,
      historicalExams: 1
    })
    expect((await classGroups.findById(sourceId))?.archived).toBe(false)
    expect(await classGroups.findBySchoolYear('2026/2027')).toHaveLength(0)
  })

  test('archives old class, copies students into next grade and keeps historic data', async () => {
    const result = await service.execute({
      fromYear: '2025/2026',
      targetYear: '2026/2027',
      decisions: [{ classGroupId: sourceId, action: 'promote', targetName: '10a', targetGradeLevel: 10 }]
    })

    const oldClass = await classGroups.findById(sourceId)
    const newClasses = await classGroups.findBySchoolYear('2026/2027')
    const oldStudents = await students.findByClassGroup(sourceId)
    const newStudents = await students.findByClassGroup(newClasses[0].id)

    expect(result.promotedClasses).toBe(1)
    expect(oldClass?.archived).toBe(true)
    expect(newClasses).toHaveLength(1)
    expect(newClasses[0]).toMatchObject({ name: '10a', gradeLevel: 10, archived: false })
    expect(oldStudents).toHaveLength(1)
    expect(newStudents).toHaveLength(1)
    expect(newStudents[0].id).not.toBe(oldStudents[0].id)
    expect(newStudents[0].firstName).toBe(oldStudents[0].firstName)
    expect(exams).toEqual([archivedExam, reusableTemplate])
    expect(await service.currentYear()).toBe('2026/2027')

    await expect(service.execute({
      fromYear: '2025/2026',
      targetYear: '2026/2027',
      decisions: [{ classGroupId: sourceId, action: 'archive' }]
    })).rejects.toThrow('aktive Schuljahr')
  })

  test('archives without copying when class is not promoted', async () => {
    await service.execute({
      fromYear: '2025/2026',
      targetYear: '2026/2027',
      decisions: [{ classGroupId: sourceId, action: 'archive' }]
    })

    expect((await classGroups.findById(sourceId))?.archived).toBe(true)
    expect(await classGroups.findBySchoolYear('2026/2027')).toHaveLength(0)
    expect(await students.findByClassGroup(sourceId)).toHaveLength(1)
    expect(await service.currentYear()).toBe('2026/2027')
  })

  test('rejects target-name collisions before modifying any class', async () => {
    await classGroups.create({
      name: '10a',
      schoolYear: '2026/2027',
      gradeLevel: 10,
      archived: false
    })

    await expect(service.execute({
      fromYear: '2025/2026',
      targetYear: '2026/2027',
      decisions: [{ classGroupId: sourceId, action: 'promote', targetName: '10a', targetGradeLevel: 10 }]
    })).rejects.toThrow('existiert')

    expect((await classGroups.findById(sourceId))?.archived).toBe(false)
    expect(await service.currentYear()).toBe('2025/2026')
  })

  test('requires a decision for each class and consecutive school years', async () => {
    await expect(service.preview({
      fromYear: '2025/2026',
      targetYear: '2027/2028',
      decisions: [{ classGroupId: sourceId, action: 'archive' }]
    })).rejects.toThrow('unmittelbar nächste')

    await expect(service.preview({
      fromYear: '2025/2026',
      targetYear: '2026/2027',
      decisions: []
    })).rejects.toThrow('jede aktive Klasse')

    expect(nextSchoolYear('2025/2026')).toBe('2026/2027')
    expect(suggestedClassName((await classGroups.findById(sourceId))!)).toBe('10a')
  })
})
