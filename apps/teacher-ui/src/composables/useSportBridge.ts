/**
 * Sport Module Bridge Composable
 * Bridges the Dexie database with Sport module use cases
 * This provides validation and business logic from Sport module without changing storage
 */

import { ref, readonly } from 'vue'
import { db } from '../db'
import type { ClassGroup, Student, AttendanceRecord } from '../db'

// Import Sport module types for validation (not used directly)

interface CreateClassInput {
  name: string
  schoolYear: string
  state?: string
  gradingScheme?: string
}

interface AddStudentInput {
  firstName: string
  lastName: string
  classGroupId: string
  birthYear?: number
  gender?: 'male' | 'female' | 'diverse'
  email?: string
  parentEmail?: string
  phone?: string
}

interface RecordAttendanceInput {
  studentId: string
  lessonId: string
  status: string
  reason?: string
  notes?: string
}

const initialized = ref(true) // Dexie is always ready

/**
 * Validation helpers (from Sport module use case logic)
 */
function validateClassInput(input: CreateClassInput): void {
  if (!input.name || input.name.trim().length === 0) {
    throw new Error('Class name is required')
  }

  if (!input.schoolYear || input.schoolYear.trim().length === 0) {
    throw new Error('School year is required')
  }

  // Validate school year format (e.g., "2023/2024")
  const yearPattern = /^\d{4}\/\d{4}$/
  if (!yearPattern.test(input.schoolYear)) {
    throw new Error('School year must be in format YYYY/YYYY (e.g., "2023/2024")')
  }
}

async function validateStudentInput(input: AddStudentInput): Promise<void> {
  if (!input.firstName || input.firstName.trim().length === 0) {
    throw new Error('First name is required')
  }

  if (!input.lastName || input.lastName.trim().length === 0) {
    throw new Error('Last name is required')
  }

  if (!input.classGroupId || input.classGroupId.trim().length === 0) {
    throw new Error('Class group ID is required')
  }

  // Verify class exists
  const classGroup = await db.classGroups.get(input.classGroupId)
  if (!classGroup) {
    throw new Error(`Class with ID "${input.classGroupId}" not found`)
  }

  // Validate birth year if provided
  if (input.birthYear !== undefined) {
    const currentYear = new Date().getFullYear()
    if (input.birthYear < 1900 || input.birthYear > currentYear) {
      throw new Error(`Birth year must be between 1900 and ${currentYear}`)
    }
  }

  // Validate email format if provided
  if (input.email && !isValidEmail(input.email)) {
    throw new Error('Invalid email format')
  }

  if (input.parentEmail && !isValidEmail(input.parentEmail)) {
    throw new Error('Invalid parent email format')
  }
}

function isValidEmail(email: string): boolean {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailPattern.test(email)
}

async function validateAttendanceInput(input: RecordAttendanceInput): Promise<void> {
  if (!input.studentId || input.studentId.trim().length === 0) {
    throw new Error('Student ID is required')
  }

  if (!input.lessonId || input.lessonId.trim().length === 0) {
    throw new Error('Lesson ID is required')
  }

  if (!input.status) {
    throw new Error('Attendance status is required')
  }

  const validStatuses = ['present', 'absent', 'excused', 'passive', 'late']
  if (!validStatuses.includes(input.status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
  }

  // Verify student exists
  const student = await db.students.get(input.studentId)
  if (!student) {
    throw new Error(`Student with ID "${input.studentId}" not found`)
  }
}

/**
 * Composable for class group operations (with Sport module validation)
 */
export function useClassGroups() {
  const getAll = async (): Promise<ClassGroup[]> => {
    return await db.classGroups.toArray()
  }

  const getById = async (id: string): Promise<ClassGroup | null> => {
    const result = await db.classGroups.get(id)
    return result || null
  }

  const create = async (input: CreateClassInput): Promise<ClassGroup> => {
    // Validate using Sport module logic
    validateClassInput(input)

    // Check for duplicates
    const existing = await db.classGroups
      .where('schoolYear')
      .equals(input.schoolYear)
      .toArray()
    
    const duplicate = existing.find(c => 
      c.name.toLowerCase() === input.name.toLowerCase()
    )
    
    if (duplicate) {
      throw new Error(`Class "${input.name}" already exists for ${input.schoolYear}`)
    }

    // Create the class
    const id = crypto.randomUUID()
    const now = new Date()
    
    const classGroup: ClassGroup = {
      id,
      name: input.name,
      schoolYear: input.schoolYear,
      createdAt: now,
      updatedAt: now
    }

    await db.classGroups.add(classGroup)
    return classGroup
  }

  const getBySchoolYear = async (schoolYear: string): Promise<ClassGroup[]> => {
    return await db.classGroups
      .where('schoolYear')
      .equals(schoolYear)
      .toArray()
  }

  return {
    getAll,
    getById,
    create,
    getBySchoolYear
  }
}

/**
 * Composable for student operations (with Sport module validation)
 */
export function useStudents() {
  const getAll = async (): Promise<Student[]> => {
    return await db.students.toArray()
  }

  const getById = async (id: string): Promise<Student | undefined> => {
    return await db.students.get(id)
  }
  const getByClassId = async (classId: string): Promise<Student[]> => {
    return await db.students
      .where('classId')
      .equals(classId)
      .toArray()
  }

  const create = async (input: AddStudentInput): Promise<Student> => {
    // Validate using Sport module logic
    await validateStudentInput(input)

    // Create the student
    const id = crypto.randomUUID()
    const now = new Date()

    const student: Student = {
      id,
      classId: input.classGroupId,
      firstName: input.firstName,
      lastName: input.lastName,
      dateOfBirth: input.birthYear ? new Date(input.birthYear, 0, 1) : undefined,
      email: input.email,
      createdAt: now,
      updatedAt: now
    }

    await db.students.add(student)
    return student
  }

  return {
    getAll,
    getById,
    getByClassId,
    create
  }
}

/**
 * Composable for attendance operations (with Sport module validation)
 */
export function useAttendance() {
  const getAll = async (): Promise<AttendanceRecord[]> => {
    return await db.attendanceRecords.toArray()
  }

  const getById = async (id: string): Promise<AttendanceRecord | null> => {
    const result = await db.attendanceRecords.get(id)
    return result || null
  }

  const getByStudentId = async (studentId: string): Promise<AttendanceRecord[]> => {
    return await db.attendanceRecords
      .where('studentId')
      .equals(studentId)
      .reverse()
      .toArray()
  }

  const getByLessonId = async (lessonId: string): Promise<AttendanceRecord[]> => {
    return await db.attendanceRecords
      .where('lessonId')
      .equals(lessonId)
      .toArray()
  }

  const getRecent = async (limit: number = 10): Promise<AttendanceRecord[]> => {
    return await db.attendanceRecords
      .orderBy('date')
      .reverse()
      .limit(limit)
      .toArray()
  }

  const record = async (input: RecordAttendanceInput): Promise<AttendanceRecord> => {
    // Validate using Sport module logic
    await validateAttendanceInput(input)

    // Check if attendance already recorded for this lesson
    const existingRecords = await getByLessonId(input.lessonId)
    const existingRecord = existingRecords.find(r => r.studentId === input.studentId)

    if (existingRecord) {
      // Update existing record
      await db.attendanceRecords.update(existingRecord.id, {
        status: input.status as 'present' | 'absent' | 'excused' | 'late',
        notes: input.notes || input.reason,
        updatedAt: new Date()
      })
      return (await db.attendanceRecords.get(existingRecord.id))!
    }

    // Create new attendance record
    const id = crypto.randomUUID()
    const now = new Date()

    const record: AttendanceRecord = {
      id,
      studentId: input.studentId,
      lessonId: input.lessonId,
      date: now,
      status: input.status as 'present' | 'absent' | 'excused' | 'late',
      notes: input.notes || input.reason,
      createdAt: now,
      updatedAt: now
    }

    await db.attendanceRecords.add(record)
    return record
  }

  const recordBatch = async (inputs: RecordAttendanceInput[]): Promise<AttendanceRecord[]> => {
    const results: AttendanceRecord[] = []

    for (const input of inputs) {
      const result = await record(input)
      results.push(result)
    }

    return results
  }

  const getAttendanceSummary = async (studentId: string) => {
    const records = await getByStudentId(studentId)

    const summary = {
      total: records.length,
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      excused: records.filter(r => r.status === 'excused').length,
      passive: 0, // Passive status not in Dexie schema - feature for future enhancement
      percentage: 0
    }

    summary.percentage = summary.total > 0 
      ? (summary.present / summary.total) * 100 
      : 100

    return summary
  }

  return {
    getAll,
    getById,
    getByStudentId,
    getByLessonId,
    getRecent,
    record,
    recordBatch,
    getAttendanceSummary
  }
}

/**
 * Bridge initialization (always ready with Dexie)
 */
export function useSportModule() {
  return {
    initialized: readonly(initialized),
    initialize: async () => { /* Dexie is always ready */ }
  }
}
