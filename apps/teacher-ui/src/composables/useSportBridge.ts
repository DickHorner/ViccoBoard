/**
 * Sport Module Bridge
 * Provides UI access to sport module repositories and use-cases
 * 
 * ARCHITECTURE: This is the ONLY place where UI should access sport domain.
 * All sport-related data access must go through this bridge.
 */

import { ref, computed } from 'vue'
import {
  ClassGroupRepository,
  GradeCategoryRepository,
  PerformanceEntryRepository,
  AttendanceRepository,
  CreateClassUseCase,
  RecordAttendanceUseCase,
  CriteriaGradingEngine,
  TimeGradingService,
  type CreateClassInput,
  type RecordAttendanceInput
} from '@viccoboard/sport'
import { getStorageAdapter } from '../services/storage.service'

/**
 * Singleton sport bridge instance
 */
let sportBridgeInstance: SportBridge | null = null

interface SportBridge {
  // Repositories
  classGroupRepository: ClassGroupRepository
  gradeCategoryRepository: GradeCategoryRepository
  performanceEntryRepository: PerformanceEntryRepository
  attendanceRepository: AttendanceRepository

  // Use Cases
  createClassUseCase: CreateClassUseCase
  recordAttendanceUseCase: RecordAttendanceUseCase

  // Services
  criteriaGradingEngine: CriteriaGradingEngine
  timeGradingService: TimeGradingService
}

/**
 * Initialize sport bridge
 * Must be called after storage is initialized
 */
export function initializeSportBridge(): SportBridge {
  if (sportBridgeInstance) {
    return sportBridgeInstance
  }

  const adapter = getStorageAdapter()

  // Initialize repositories with storage adapter
  const classGroupRepo = new ClassGroupRepository(adapter)
  const gradeCategoryRepo = new GradeCategoryRepository(adapter)
  const performanceEntryRepo = new PerformanceEntryRepository(adapter)
  const attendanceRepo = new AttendanceRepository(adapter)

  // Initialize use cases with repositories
  const createClassUseCase = new CreateClassUseCase(classGroupRepo)
  const recordAttendanceUseCase = new RecordAttendanceUseCase(attendanceRepo)

  // Initialize services
  const criteriaGradingEngine = new CriteriaGradingEngine()
  const timeGradingService = new TimeGradingService()

  sportBridgeInstance = {
    // Repositories
    classGroupRepository: classGroupRepo,
    gradeCategoryRepository: gradeCategoryRepo,
    performanceEntryRepository: performanceEntryRepo,
    attendanceRepository: attendanceRepo,

    // Use Cases
    createClassUseCase,
    recordAttendanceUseCase,

    // Services
    criteriaGradingEngine,
    timeGradingService
  }

  return sportBridgeInstance
}

/**
 * Get sport bridge instance
 */
export function getSportBridge(): SportBridge {
  if (!sportBridgeInstance) {
    throw new Error(
      'SportBridge not initialized. Call initializeSportBridge() first.'
    )
  }
  return sportBridgeInstance
}

/**
 * Vue composable for sport module access
 * Provides reactive access to sport bridge
 */
export function useSportBridge() {
  const bridge = ref<SportBridge | null>(sportBridgeInstance)

  const isInitialized = computed(() => bridge.value !== null)

  return {
    sportBridge: bridge,
    isInitialized,

    // Convenience accessors
    classGroups: computed(() => bridge.value?.classGroupRepository),
    gradeCategories: computed(() => bridge.value?.gradeCategoryRepository),
    performanceEntries: computed(() => bridge.value?.performanceEntryRepository),
    attendance: computed(() => bridge.value?.attendanceRepository),

    // Use case accessors
    useCreateClass: computed(() => bridge.value?.createClassUseCase),
    useRecordAttendance: computed(() => bridge.value?.recordAttendanceUseCase),

    // Service accessors
    useCriteriaGrading: computed(() => bridge.value?.criteriaGradingEngine),
    useTimeGrading: computed(() => bridge.value?.timeGradingService)
  }
}

// Re-exports for convenience
export {
  ClassGroupRepository,
  GradeCategoryRepository,
  PerformanceEntryRepository,
  AttendanceRepository,
  CreateClassUseCase,
  RecordAttendanceUseCase,
  CriteriaGradingEngine,
  TimeGradingService
}
export type { CreateClassInput, RecordAttendanceInput }

