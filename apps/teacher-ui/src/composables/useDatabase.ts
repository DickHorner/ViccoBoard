/**
 * Database composable for managing Dexie database and repositories
 */

import { ref } from 'vue'
import type { Exams as ExamsTypes } from '@viccoboard/core'
import { db } from '../db'
import { createUuid } from '../utils/uuid'
import type {
  ClassGroup,
  Student,
  AttendanceRecord,
  ExamRecord,
  CorrectionEntryRecord
} from '../db'

export function useDatabase() {
  // Mock bridge structure for Sport module compatibility
  const sportBridge = ref({
    classGroupRepository: {
      findAll: async () => await db.classGroups.toArray(),
      read: async (id: string) => await db.classGroups.get(id),
      create: async (entity: any) => {
        const id = createUuid()
        const now = new Date()
        await db.classGroups.add({
          id,
          name: entity.name,
          schoolYear: entity.schoolYear,
          createdAt: now,
          updatedAt: now
        })
        return { ...entity, id, createdAt: now, lastModified: now }
      },
      update: async (id: string, entity: any) => {
        await db.classGroups.update(id, { ...entity, updatedAt: new Date() })
      }
    },
    studentRepository: {
      findAll: async () => await db.students.toArray(),
      read: async (id: string) => await db.students.get(id),
      findByClassGroup: async (classId: string) =>
        await db.students.where('classId').equals(classId).toArray(),
      create: async (entity: any) => {
        const id = createUuid()
        const now = new Date()
        await db.students.add({
          id,
          classId: entity.classGroupId,
          firstName: entity.firstName,
          lastName: entity.lastName,
          dateOfBirth: entity.birthYear ? new Date(entity.birthYear, 0, 1) : undefined,
          email: entity.email,
          createdAt: now,
          updatedAt: now
        })
        return { ...entity, id, createdAt: now, lastModified: now }
      }
    },
    gradeCategoryRepository: {
      findAll: async () => {
        const categories = await db.gradeCategories.toArray()
        return categories.map(c => ({
          ...c,
          configuration: JSON.parse(c.configuration),
          createdAt: c.createdAt,
          lastModified: c.updatedAt
        }))
      },
      read: async (id: string) => {
        const category = await db.gradeCategories.get(id)
        if (!category) return null
        return {
          ...category,
          configuration: JSON.parse(category.configuration),
          createdAt: category.createdAt,
          lastModified: category.updatedAt
        }
      },
      findByClassGroup: async (classId: string) => {
        const categories = await db.gradeCategories
          .where('classGroupId')
          .equals(classId)
          .toArray()
        return categories.map(c => ({
          ...c,
          configuration: JSON.parse(c.configuration),
          createdAt: c.createdAt,
          lastModified: c.updatedAt
        }))
      },
      create: async (entity: any) => {
        const id = createUuid()
        const now = new Date()
        await db.gradeCategories.add({
          id,
          classGroupId: entity.classGroupId,
          name: entity.name,
          description: entity.description,
          type: entity.type,
          weight: entity.weight,
          configuration: JSON.stringify(entity.configuration),
          createdAt: now,
          updatedAt: now
        })
        return { ...entity, id, createdAt: now, lastModified: now }
      },
      update: async (id: string, entity: any) => {
        await db.gradeCategories.update(id, {
          name: entity.name,
          description: entity.description,
          type: entity.type,
          weight: entity.weight,
          configuration: JSON.stringify(entity.configuration),
          updatedAt: new Date()
        })
      }
    },
    performanceEntryRepository: {
      findAll: async () => {
        const entries = await db.performanceEntries.toArray()
        return entries.map(e => ({
          ...e,
          measurements: JSON.parse(e.measurements || '{}'),
          metadata: e.metadata ? JSON.parse(e.metadata) : undefined
        }))
      },
      read: async (id: string) => {
        const entry = await db.performanceEntries.get(id)
        if (!entry) return null
        return {
          ...entry,
          measurements: JSON.parse(entry.measurements || '{}'),
          metadata: entry.metadata ? JSON.parse(entry.metadata) : undefined
        }
      },
      findByStudent: async (studentId: string) => {
        const entries = await db.performanceEntries
          .where('studentId')
          .equals(studentId)
          .toArray()
        return entries.map(e => ({
          ...e,
          measurements: JSON.parse(e.measurements || '{}'),
          metadata: e.metadata ? JSON.parse(e.metadata) : undefined
        }))
      },
      findByCategory: async (categoryId: string) => {
        const entries = await db.performanceEntries
          .where('categoryId')
          .equals(categoryId)
          .toArray()
        return entries.map(e => ({
          ...e,
          measurements: JSON.parse(e.measurements || '{}'),
          metadata: e.metadata ? JSON.parse(e.metadata) : undefined
        }))
      },
      findByStudentAndCategory: async (studentId: string, categoryId: string) => {
        const entries = await db.performanceEntries
          .where({ studentId, categoryId })
          .toArray()
        return entries.map(e => ({
          ...e,
          measurements: JSON.parse(e.measurements || '{}'),
          metadata: e.metadata ? JSON.parse(e.metadata) : undefined
        }))
      },
      create: async (entity: any) => {
        const id = createUuid()
        await db.performanceEntries.add({
          id,
          studentId: entity.studentId,
          categoryId: entity.categoryId,
          measurements: JSON.stringify(entity.measurements),
          calculatedGrade: entity.calculatedGrade,
          timestamp: entity.timestamp,
          comment: entity.comment,
          metadata: entity.metadata ? JSON.stringify(entity.metadata) : undefined
        })
        return { ...entity, id }
      }
    },
    createGradeCategoryUseCase: {
      execute: async (input: any) => {
        const id = createUuid()
        const now = new Date()
        await db.gradeCategories.add({
          id,
          classGroupId: input.classGroupId,
          name: input.name,
          description: input.description,
          type: input.type,
          weight: input.weight,
          configuration: JSON.stringify(input.configuration),
          createdAt: now,
          updatedAt: now
        })
        return {
          id,
          ...input,
          createdAt: now,
          lastModified: now
        }
      }
    },
    recordGradeUseCase: {
      execute: async (input: any) => {
        const id = createUuid()
        const now = new Date()
        await db.performanceEntries.add({
          id,
          studentId: input.studentId,
          categoryId: input.categoryId,
          measurements: JSON.stringify(input.measurements),
          calculatedGrade: input.calculatedGrade,
          timestamp: now,
          comment: input.comment,
          metadata: input.metadata ? JSON.stringify(input.metadata) : undefined
        })
        return {
          id,
          ...input,
          timestamp: now
        }
      }
    }
  })

  return {
    db,
    sportBridge,
    classGroups: db.classGroups,
    students: db.students,
    attendanceRecords: db.attendanceRecords,
    assessments: db.assessments,
    gradeCategories: db.gradeCategories,
    performanceEntries: db.performanceEntries,
    exams: db.exams,
    correctionEntries: db.correctionEntries
  }
}

const mapRecordToExam = (record: ExamRecord): ExamsTypes.Exam => ({
  id: record.id,
  title: record.title,
  description: record.description ?? undefined,
  classGroupId: record.classGroupId ?? undefined,
  mode: record.mode as ExamsTypes.ExamMode,
  structure: JSON.parse(record.structure),
  gradingKey: JSON.parse(record.gradingKey),
  printPresets: JSON.parse(record.printPresets || '[]'),
  candidates: JSON.parse(record.candidates || '[]'),
  status: record.status,
  createdAt: record.createdAt,
  lastModified: record.updatedAt
})

const mapExamToRecord = (exam: ExamsTypes.Exam): ExamRecord => ({
  id: exam.id,
  title: exam.title,
  description: exam.description,
  classGroupId: exam.classGroupId,
  mode: exam.mode,
  structure: JSON.stringify(exam.structure),
  gradingKey: JSON.stringify(exam.gradingKey),
  printPresets: JSON.stringify(exam.printPresets ?? []),
  candidates: JSON.stringify(exam.candidates ?? []),
  status: exam.status,
  createdAt: exam.createdAt,
  updatedAt: exam.lastModified
})

/**
 * Exam operations (KURT)
 */
export function useExams() {
  const { exams } = useDatabase()

  const getAll = async (): Promise<ExamsTypes.Exam[]> => {
    const records = await exams.orderBy('createdAt').reverse().toArray()
    return records.map(mapRecordToExam)
  }

  const getById = async (id: string): Promise<ExamsTypes.Exam | undefined> => {
    const record = await exams.get(id)
    return record ? mapRecordToExam(record) : undefined
  }

  const create = async (exam: ExamsTypes.Exam): Promise<string> => {
    const record = mapExamToRecord(exam)
    await exams.add(record)
    return record.id
  }

  const update = async (exam: ExamsTypes.Exam): Promise<void> => {
    const record = mapExamToRecord(exam)
    await exams.update(record.id, record)
  }

  const remove = async (id: string): Promise<void> => {
    await exams.delete(id)
  }

  return {
    getAll,
    getById,
    create,
    update,
    remove
  }
}

const mapRecordToCorrection = (record: CorrectionEntryRecord): ExamsTypes.CorrectionEntry => ({
  id: record.id,
  examId: record.examId,
  candidateId: record.candidateId,
  taskScores: JSON.parse(record.taskScores || '[]'),
  totalPoints: record.totalPoints,
  totalGrade: record.totalGrade,
  percentageScore: record.percentageScore,
  comments: JSON.parse(record.comments || '[]'),
  supportTips: JSON.parse(record.supportTips || '[]'),
  highlightedWork: record.highlightedWork ? JSON.parse(record.highlightedWork) : undefined,
  status: record.status,
  correctedAt: record.correctedAt,
  lastModified: record.lastModified
})

const mapCorrectionToRecord = (entry: ExamsTypes.CorrectionEntry): CorrectionEntryRecord => ({
  id: entry.id,
  examId: entry.examId,
  candidateId: entry.candidateId,
  taskScores: JSON.stringify(entry.taskScores ?? []),
  totalPoints: entry.totalPoints,
  totalGrade: entry.totalGrade,
  percentageScore: entry.percentageScore,
  comments: JSON.stringify(entry.comments ?? []),
  supportTips: JSON.stringify(entry.supportTips ?? []),
  highlightedWork: entry.highlightedWork ? JSON.stringify(entry.highlightedWork) : undefined,
  status: entry.status,
  correctedAt: entry.correctedAt,
  lastModified: entry.lastModified
})

/**
 * Correction entry operations
 */
export function useCorrections() {
  const { correctionEntries } = useDatabase()

  const getByExam = async (examId: string): Promise<ExamsTypes.CorrectionEntry[]> => {
    const records = await correctionEntries.where('examId').equals(examId).toArray()
    return records.map(mapRecordToCorrection)
  }

  const getByCandidate = async (candidateId: string): Promise<ExamsTypes.CorrectionEntry[]> => {
    const records = await correctionEntries.where('candidateId').equals(candidateId).toArray()
    return records.map(mapRecordToCorrection)
  }

  const create = async (entry: ExamsTypes.CorrectionEntry): Promise<string> => {
    const record = mapCorrectionToRecord(entry)
    await correctionEntries.add(record)
    return record.id
  }

  const update = async (entry: ExamsTypes.CorrectionEntry): Promise<void> => {
    const record = mapCorrectionToRecord(entry)
    await correctionEntries.update(record.id, record)
  }

  const remove = async (id: string): Promise<void> => {
    await correctionEntries.delete(id)
  }

  return {
    getByExam,
    getByCandidate,
    create,
    update,
    remove
  }
}

/**
 * Class Group operations
 */
export function useClassGroups() {
  const { classGroups } = useDatabase()

  const getAll = async (): Promise<ClassGroup[]> => {
    return await classGroups.toArray()
  }

  const getById = async (id: string): Promise<ClassGroup | undefined> => {
    return await classGroups.get(id)
  }

  const create = async (data: Omit<ClassGroup, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = createUuid()
    const now = new Date()
    await classGroups.add({
      id,
      ...data,
      createdAt: now,
      updatedAt: now
    })
    return id
  }

  const update = async (id: string, data: Partial<ClassGroup>): Promise<void> => {
    await classGroups.update(id, {
      ...data,
      updatedAt: new Date()
    })
  }

  const remove = async (id: string): Promise<void> => {
    await classGroups.delete(id)
  }

  const getBySchoolYear = async (schoolYear: string): Promise<ClassGroup[]> => {
    return await classGroups
      .where('schoolYear')
      .equals(schoolYear)
      .toArray()
  }

  return {
    getAll,
    getById,
    create,
    update,
    remove,
    getBySchoolYear
  }
}

/**
 * Student operations
 */
export function useStudents() {
  const { students } = useDatabase()

  const getAll = async (): Promise<Student[]> => {
    return await students.toArray()
  }

  const getById = async (id: string): Promise<Student | undefined> => {
    return await students.get(id)
  }

  const getByClassId = async (classId: string): Promise<Student[]> => {
    return await students
      .where('classId')
      .equals(classId)
      .toArray()
  }

  const create = async (data: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = createUuid()
    const now = new Date()
    await students.add({
      id,
      ...data,
      createdAt: now,
      updatedAt: now
    })
    return id
  }

  const update = async (id: string, data: Partial<Student>): Promise<void> => {
    await students.update(id, {
      ...data,
      updatedAt: new Date()
    })
  }

  const remove = async (id: string): Promise<void> => {
    await students.delete(id)
  }

  return {
    getAll,
    getById,
    getByClassId,
    create,
    update,
    remove
  }
}

/**
 * Attendance operations
 */
export function useAttendance() {
  const { attendanceRecords } = useDatabase()

  const getAll = async (): Promise<AttendanceRecord[]> => {
    return await attendanceRecords.toArray()
  }

  const getById = async (id: string): Promise<AttendanceRecord | undefined> => {
    return await attendanceRecords.get(id)
  }

  const getByStudentId = async (studentId: string): Promise<AttendanceRecord[]> => {
    return await attendanceRecords
      .where('studentId')
      .equals(studentId)
      .reverse()
      .toArray()
  }

  const getByLessonId = async (lessonId: string): Promise<AttendanceRecord[]> => {
    return await attendanceRecords
      .where('lessonId')
      .equals(lessonId)
      .toArray()
  }

  const getRecent = async (limit: number = 10): Promise<AttendanceRecord[]> => {
    return await attendanceRecords
      .orderBy('date')
      .reverse()
      .limit(limit)
      .toArray()
  }

  const create = async (data: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = createUuid()
    const now = new Date()
    await attendanceRecords.add({
      id,
      ...data,
      createdAt: now,
      updatedAt: now
    })
    return id
  }

  const update = async (id: string, data: Partial<AttendanceRecord>): Promise<void> => {
    await attendanceRecords.update(id, {
      ...data,
      updatedAt: new Date()
    })
  }

  const remove = async (id: string): Promise<void> => {
    await attendanceRecords.delete(id)
  }

  return {
    getAll,
    getById,
    getByStudentId,
    getByLessonId,
    getRecent,
    create,
    update,
    remove
  }
}

