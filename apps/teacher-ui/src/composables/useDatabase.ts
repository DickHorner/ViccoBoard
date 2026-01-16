/**
 * Database composable for managing Dexie database and repositories
 */

import { db } from '../db'
import type { ClassGroup, Student, AttendanceRecord } from '../db'

export function useDatabase() {
  return {
    db,
    classGroups: db.classGroups,
    students: db.students,
    attendanceRecords: db.attendanceRecords,
    assessments: db.assessments
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
    const id = crypto.randomUUID()
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
    const id = crypto.randomUUID()
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
    const id = crypto.randomUUID()
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
