import { InMemoryStorageAdapter } from '@viccoboard/storage/browser'
import type { ClassGroup, Exams, Student } from '@viccoboard/core'
import type { ClassGroupRepository } from '@viccoboard/sport'
import type { StudentRepository, CopyClassGroupToSchoolYearUseCase } from '@viccoboard/students'
import type { ExamRepository } from '@viccoboard/exams'
import {
  SchoolYearTransitionService,
  nextSchoolYear,
  suggestedClassName
} from '../src/services/school-year.service'

describe('SchoolYearTransitionService', () => {
  let adapter: InMemoryStorageAdapter
  let classes: ClassGroup[]
  let pupils: Student[]
  let classGroups: ClassGroupRepository
  let students: StudentRepository
  let service: SchoolYearTransitionService
  let exams: Exams.Exam[]
  let sourceId: string
  let nextId: number

  beforeEach(async () => {
    nextId = 1
    classes = []
    pupils = []
    adapter = new InMemoryStorageAdapter()
    await adapter.initialize()
    await adapter.insert('school_year_state', { id: 'active', school_year: '2025/2026' })

    classGroups = {
      findAll: async () => [...classes],
      findBySchoolYear: async year => classes.filter(group => group.schoolYear === year),
      findById: async id => classes.find(group => group.id === id) ?? null,
      create: async input => {
        const group: ClassGroup = {
          ...input,
          id: `class-${nextId++}`,
          createdAt: new Date(),
          lastModified: new Date()
        }
        classes.push(group)
        return group
      },
      update: async (id, updates) => {
        const index = classes.findIndex(group => group.id === id)
        if (index < 0) throw new Error('Class not found')
        classes[index] = { ...classes[index], ...updates }
        return classes[index]
      }
    } as ClassGroupRepository

    students = {
      findByClassGroup: async id => pupils.filter(student => student.classGroupId === id),
      countByClassGroup: async id => pupils.filter(student => student.classGroupId === id).length,
      create: async input => {
        const student: Student = {
          ...input,
          id: `student-${nextId++}`,
          createdAt: new Date(),
          lastModified: new Date()
        }
        pupils.push(student)
        return student
      }
    } as StudentRepository

    const source = await classGroups.create({
      name: '9a',
      schoolYear: '2025/2026',
      gradeLevel: 9,
      archived: false
    })
    sourceId = source.id

    await students.create({
      firstName: 'Anna',
      lastName: 'Muster',
      dateOfBirth: '2010-10-01',
      classGroupId: sourceId
    })

    exams = [
      { id: 'exam-old', kind: 'exam', classGroupId: sourceId, candidates: [{ id: 'candidate-1' }] },
      { id: 'template-1', kind: 'template', candidates: [] }
    ] as unknown as Exams.Exam[]

    const copyUseCase = {
      execute: async (input: {
        sourceClassGroupId: string
        targetSchoolYear: string
        targetClassName?: string
        targetGradeLevel?: number
      }) => {
        const original = (await classGroups.findById(input.sourceClassGroupId))!
        const created = await classGroups.create({
          name: input.targetClassName ?? original.name,
          schoolYear: input.targetSchoolYear,
          gradeLevel: input.targetGradeLevel,
          archived: false
        })
        const originals = await students.findByClassGroup(original.id)
        for (const student of originals) {
          await students.create({
            firstName: student.firstName,
            lastName: student.lastName,
            dateOfBirth: student.dateOfBirth,
            classGroupId: created.id
          })
        }
        return { classGroup: created, copiedStudents: originals.length, skippedStudents: 0 }
      }
    } as CopyClassGroupToSchoolYearUseCase

    service = new SchoolYearTransitionService(
      classGroups,
      students,
      { findAll: async () => exams } as ExamRepository,
      adapter,
      copyUseCase
    )
  })

  test('previews without changing any records', async () => {
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

  test('archives old class, copies pupils into a new class and preserves exam records', async () => {
    const result = await service.execute({
      fromYear: '2025/2026',
      targetYear: '2026/2027',
      decisions: [{ classGroupId: sourceId, action: 'promote', targetName: '10a', targetGradeLevel: 10 }]
    })

    const newClasses = await classGroups.findBySchoolYear('2026/2027')
    const oldPupils = await students.findByClassGroup(sourceId)
    const newPupils = await students.findByClassGroup(newClasses[0].id)

    expect(result.promotedClasses).toBe(1)
    expect((await classGroups.findById(sourceId))?.archived).toBe(true)
    expect(newClasses).toHaveLength(1)
    expect(newClasses[0]).toMatchObject({ name: '10a', gradeLevel: 10, archived: false })
    expect(oldPupils).toHaveLength(1)
    expect(newPupils).toHaveLength(1)
    expect(newPupils[0].id).not.toBe(oldPupils[0].id)
    expect(exams[0].classGroupId).toBe(sourceId)
    expect(exams[1].kind).toBe('template')
    expect(await service.currentYear()).toBe('2026/2027')

    await expect(service.execute({
      fromYear: '2025/2026',
      targetYear: '2026/2027',
      decisions: [{ classGroupId: sourceId, action: 'archive' }]
    })).rejects.toThrow('aktive Schuljahr')
  })

  test('archives classes without copying them when not promoted', async () => {
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

  test('rejects duplicate target names before changing data', async () => {
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

  test('requires a decision per class and a consecutive target year', async () => {
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
