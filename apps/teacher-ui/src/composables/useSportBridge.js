/**
 * Sport Module Bridge
 * Provides UI access to sport module repositories and use-cases
 *
 * ARCHITECTURE: This is the ONLY place where UI should access sport domain.
 * All sport-related data access must go through this bridge.
 */
import { ref, computed } from 'vue';
import { ClassGroupRepository, LessonRepository, GradeCategoryRepository, PerformanceEntryRepository, AttendanceRepository, TableDefinitionRepository, CooperTestConfigRepository, ShuttleRunConfigRepository, SportabzeichenStandardRepository, SportabzeichenResultRepository, CreateClassUseCase, CreateLessonUseCase, RecordAttendanceUseCase, CreateGradeCategoryUseCase, RecordGradeUseCase, CriteriaGradingEngine, TimeGradingService, CooperTestService, ShuttleRunService, SportabzeichenService } from '@viccoboard/sport';
import { getStorageAdapter } from '../services/storage.service';
/**
 * Singleton sport bridge instance
 */
let sportBridgeInstance = null;
/**
 * Initialize sport bridge
 * Must be called after storage is initialized
 */
export function initializeSportBridge() {
    if (sportBridgeInstance) {
        return sportBridgeInstance;
    }
    const adapter = getStorageAdapter();
    // Initialize repositories with storage adapter
    const classGroupRepo = new ClassGroupRepository(adapter);
    const lessonRepo = new LessonRepository(adapter);
    const gradeCategoryRepo = new GradeCategoryRepository(adapter);
    const performanceEntryRepo = new PerformanceEntryRepository(adapter);
    const attendanceRepo = new AttendanceRepository(adapter);
    const tableDefinitionRepo = new TableDefinitionRepository(adapter);
    const cooperTestConfigRepo = new CooperTestConfigRepository(adapter);
    const shuttleRunConfigRepo = new ShuttleRunConfigRepository(adapter);
    const sportabzeichenStandardRepo = new SportabzeichenStandardRepository(adapter);
    const sportabzeichenResultRepo = new SportabzeichenResultRepository(adapter);
    // Initialize use cases with repositories
    const createClassUseCase = new CreateClassUseCase(classGroupRepo);
    const createLessonUseCase = new CreateLessonUseCase(lessonRepo);
    const recordAttendanceUseCase = new RecordAttendanceUseCase(attendanceRepo);
    const createGradeCategoryUseCase = new CreateGradeCategoryUseCase(gradeCategoryRepo);
    const recordGradeUseCase = new RecordGradeUseCase(performanceEntryRepo);
    // Initialize services
    const criteriaGradingEngine = new CriteriaGradingEngine();
    const timeGradingService = new TimeGradingService();
    const cooperTestService = new CooperTestService();
    const shuttleRunService = new ShuttleRunService();
    const sportabzeichenService = new SportabzeichenService();
    sportBridgeInstance = {
        // Repositories
        classGroupRepository: classGroupRepo,
        lessonRepository: lessonRepo,
        gradeCategoryRepository: gradeCategoryRepo,
        performanceEntryRepository: performanceEntryRepo,
        attendanceRepository: attendanceRepo,
        tableDefinitionRepository: tableDefinitionRepo,
        cooperTestConfigRepository: cooperTestConfigRepo,
        shuttleRunConfigRepository: shuttleRunConfigRepo,
        sportabzeichenStandardRepository: sportabzeichenStandardRepo,
        sportabzeichenResultRepository: sportabzeichenResultRepo,
        // Use Cases
        createClassUseCase,
        createLessonUseCase,
        recordAttendanceUseCase,
        createGradeCategoryUseCase,
        recordGradeUseCase,
        // Services
        criteriaGradingEngine,
        timeGradingService,
        cooperTestService,
        shuttleRunService,
        sportabzeichenService
    };
    return sportBridgeInstance;
}
/**
 * Get sport bridge instance
 */
export function getSportBridge() {
    if (!sportBridgeInstance) {
        throw new Error('SportBridge not initialized. Call initializeSportBridge() first.');
    }
    return sportBridgeInstance;
}
/**
 * Vue composable for class groups access
 */
export function useClassGroups() {
    const bridge = getSportBridge();
    return bridge.classGroupRepository;
}
/**
 * Vue composable for lessons access
 */
export function useLessons() {
    const bridge = getSportBridge();
    return bridge.lessonRepository;
}
/**
 * Vue composable for attendance access
 */
export function useAttendance() {
    const bridge = getSportBridge();
    return bridge.attendanceRepository;
}
/**
 * Vue composable for students access
 * Note: Students module should be initialized separately through StudentsBridge
 * For now, this is a placeholder that returns null if not available
 */
export function useStudents() {
    // This will need to come from a StudentsBridge similar to SportBridge
    // For now, return null - this should be refactored
    return null;
}
/**
 * Vue composable for sport module access
 * Provides reactive access to sport bridge
 */
export function useSportBridge() {
    const bridge = ref(sportBridgeInstance);
    const isInitialized = computed(() => bridge.value !== null);
    return {
        sportBridge: bridge,
        isInitialized,
        // Convenience accessors
        classGroups: computed(() => bridge.value?.classGroupRepository),
        lessons: computed(() => bridge.value?.lessonRepository),
        gradeCategories: computed(() => bridge.value?.gradeCategoryRepository),
        performanceEntries: computed(() => bridge.value?.performanceEntryRepository),
        attendance: computed(() => bridge.value?.attendanceRepository),
        tableDefinitions: computed(() => bridge.value?.tableDefinitionRepository),
        // Use case accessors
        useCreateClass: computed(() => bridge.value?.createClassUseCase),
        useCreateLesson: computed(() => bridge.value?.createLessonUseCase),
        useRecordAttendance: computed(() => bridge.value?.recordAttendanceUseCase),
        // Service accessors
        useCriteriaGrading: computed(() => bridge.value?.criteriaGradingEngine),
        useTimeGrading: computed(() => bridge.value?.timeGradingService),
        useCooperTest: computed(() => bridge.value?.cooperTestService),
        useShuttleRun: computed(() => bridge.value?.shuttleRunService)
    };
}
// Re-exports for convenience
export { ClassGroupRepository, LessonRepository, GradeCategoryRepository, PerformanceEntryRepository, AttendanceRepository, CreateClassUseCase, CreateLessonUseCase, RecordAttendanceUseCase, CreateGradeCategoryUseCase, RecordGradeUseCase, CriteriaGradingEngine, TimeGradingService };
