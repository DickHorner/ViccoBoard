/**
 * Sport Module Integration Composable
 * Provides access to Sport module repositories and use cases
 */

import { ref, readonly } from 'vue'
import { IndexedDBStorage } from '@viccoboard/storage'
import {
  ClassGroupRepository,
  StudentRepository,
  AttendanceRepository,
  CreateClassUseCase,
  AddStudentUseCase,
  RecordAttendanceUseCase,
  type CreateClassInput,
  type AddStudentInput,
  type RecordAttendanceInput
} from '@viccoboard/sport'
import type { ClassGroup, Student, AttendanceRecord } from '@viccoboard/core'

// Singleton state for repositories and use cases
let storage: IndexedDBStorage | null = null
let classGroupRepo: ClassGroupRepository | null = null
let studentRepo: StudentRepository | null = null
let attendanceRepo: AttendanceRepository | null = null
let createClassUseCase: CreateClassUseCase | null = null
let addStudentUseCase: AddStudentUseCase | null = null
let recordAttendanceUseCase: RecordAttendanceUseCase | null = null

const initialized = ref(false)
const initError = ref<string | null>(null)

/**
 * Initialize the Sport module with storage adapter
 */
async function initialize(): Promise<void> {
  if (initialized.value) return
  
  try {
    // Initialize IndexedDB storage
    storage = new IndexedDBStorage({
      databaseName: 'viccoboard',
      version: 1
    })
    
    // Initialize with empty password for now (encryption can be added later)
    await storage.initialize('')
    
    // Get the adapter
    const adapter = storage.getAdapter()
    
    // Create repositories
    classGroupRepo = new ClassGroupRepository(adapter)
    studentRepo = new StudentRepository(adapter)
    attendanceRepo = new AttendanceRepository(adapter)
    
    // Create use cases
    createClassUseCase = new CreateClassUseCase(classGroupRepo)
    addStudentUseCase = new AddStudentUseCase(studentRepo, classGroupRepo)
    recordAttendanceUseCase = new RecordAttendanceUseCase(attendanceRepo, studentRepo)
    
    initialized.value = true
    initError.value = null
  } catch (error) {
    console.error('Failed to initialize Sport module:', error)
    initError.value = error instanceof Error ? error.message : 'Unknown error'
    throw error
  }
}

/**
 * Composable for Sport module integration
 */
export function useSportModule() {
  const ensureInitialized = async () => {
    if (!initialized.value) {
      await initialize()
    }
  }
  
  return {
    initialized: readonly(initialized),
    initError: readonly(initError),
    initialize: ensureInitialized,
    
    // Repositories
    getClassGroupRepository: () => {
      if (!classGroupRepo) throw new Error('Sport module not initialized')
      return classGroupRepo
    },
    getStudentRepository: () => {
      if (!studentRepo) throw new Error('Sport module not initialized')
      return studentRepo
    },
    getAttendanceRepository: () => {
      if (!attendanceRepo) throw new Error('Sport module not initialized')
      return attendanceRepo
    },
    
    // Use cases
    getCreateClassUseCase: () => {
      if (!createClassUseCase) throw new Error('Sport module not initialized')
      return createClassUseCase
    },
    getAddStudentUseCase: () => {
      if (!addStudentUseCase) throw new Error('Sport module not initialized')
      return addStudentUseCase
    },
    getRecordAttendanceUseCase: () => {
      if (!recordAttendanceUseCase) throw new Error('Sport module not initialized')
      return recordAttendanceUseCase
    }
  }
}

/**
 * Composable for class group operations
 */
export function useClassGroups() {
  const sportModule = useSportModule()
  
  const getAll = async (): Promise<ClassGroup[]> => {
    await sportModule.initialize()
    const repo = sportModule.getClassGroupRepository()
    return await repo.findAll()
  }
  
  const getById = async (id: string): Promise<ClassGroup | null> => {
    await sportModule.initialize()
    const repo = sportModule.getClassGroupRepository()
    return await repo.findById(id)
  }
  
  const create = async (input: CreateClassInput): Promise<ClassGroup> => {
    await sportModule.initialize()
    const useCase = sportModule.getCreateClassUseCase()
    return await useCase.execute(input)
  }
  
  const getBySchoolYear = async (schoolYear: string): Promise<ClassGroup[]> => {
    await sportModule.initialize()
    const repo = sportModule.getClassGroupRepository()
    return await repo.findBySchoolYear(schoolYear)
  }
  
  return {
    getAll,
    getById,
    create,
    getBySchoolYear
  }
}

/**
 * Composable for student operations
 */
export function useStudents() {
  const sportModule = useSportModule()
  
  const getAll = async (): Promise<Student[]> => {
    await sportModule.initialize()
    const repo = sportModule.getStudentRepository()
    return await repo.findAll()
  }
  
  const getById = async (id: string): Promise<Student | null> => {
    await sportModule.initialize()
    const repo = sportModule.getStudentRepository()
    return await repo.findById(id)
  }
  
  const getByClassId = async (classGroupId: string): Promise<Student[]> => {
    await sportModule.initialize()
    const repo = sportModule.getStudentRepository()
    return await repo.findByClassGroup(classGroupId)
  }
  
  const create = async (input: AddStudentInput): Promise<Student> => {
    await sportModule.initialize()
    const useCase = sportModule.getAddStudentUseCase()
    return await useCase.execute(input)
  }
  
  return {
    getAll,
    getById,
    getByClassId,
    create
  }
}

/**
 * Composable for attendance operations
 */
export function useAttendance() {
  const sportModule = useSportModule()
  
  const getAll = async (): Promise<AttendanceRecord[]> => {
    await sportModule.initialize()
    const repo = sportModule.getAttendanceRepository()
    return await repo.findAll()
  }
  
  const getById = async (id: string): Promise<AttendanceRecord | null> => {
    await sportModule.initialize()
    const repo = sportModule.getAttendanceRepository()
    return await repo.findById(id)
  }
  
  const getByStudentId = async (studentId: string): Promise<AttendanceRecord[]> => {
    await sportModule.initialize()
    const repo = sportModule.getAttendanceRepository()
    return await repo.findByStudent(studentId)
  }
  
  const getByLessonId = async (lessonId: string): Promise<AttendanceRecord[]> => {
    await sportModule.initialize()
    const repo = sportModule.getAttendanceRepository()
    return await repo.findByLesson(lessonId)
  }
  
  const getRecent = async (limit: number = 10): Promise<AttendanceRecord[]> => {
    await sportModule.initialize()
    const repo = sportModule.getAttendanceRepository()
    const allRecords = await repo.findAll()
    return allRecords
      .sort((a: AttendanceRecord, b: AttendanceRecord) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }
  
  const record = async (input: RecordAttendanceInput): Promise<AttendanceRecord> => {
    await sportModule.initialize()
    const useCase = sportModule.getRecordAttendanceUseCase()
    return await useCase.execute(input)
  }
  
  const recordBatch = async (inputs: RecordAttendanceInput[]): Promise<AttendanceRecord[]> => {
    await sportModule.initialize()
    const useCase = sportModule.getRecordAttendanceUseCase()
    return await useCase.executeBatch(inputs)
  }
  
  const getAttendanceSummary = async (studentId: string) => {
    await sportModule.initialize()
    const repo = sportModule.getAttendanceRepository()
    return await repo.getAttendanceSummary(studentId)
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
