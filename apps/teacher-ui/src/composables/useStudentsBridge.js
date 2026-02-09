/**
 * Students Module Bridge
 * Provides UI access to students module repositories and use-cases
 *
 * ARCHITECTURE: This is the ONLY place where UI should access students domain.
 * All student-related data access must go through this bridge.
 */
import { ref, computed } from 'vue';
import { StudentRepository, AddStudentUseCase, StatusCatalogRepository, AddStatusUseCase, UpdateStatusUseCase, ReorderStatusUseCase } from '@viccoboard/students';
import { getStorageAdapter } from '../services/storage.service';
/**
 * Singleton students bridge instance
 */
let studentsBridgeInstance = null;
/**
 * Initialize students bridge
 * Must be called after storage is initialized
 */
export function initializeStudentsBridge() {
    if (studentsBridgeInstance) {
        return studentsBridgeInstance;
    }
    const adapter = getStorageAdapter();
    // Initialize repositories
    const studentRepo = new StudentRepository(adapter);
    const statusCatalogRepo = new StatusCatalogRepository(adapter);
    // Initialize use cases
    const addStudentUseCase = new AddStudentUseCase(studentRepo);
    const addStatusUseCase = new AddStatusUseCase(statusCatalogRepo);
    const updateStatusUseCase = new UpdateStatusUseCase(statusCatalogRepo);
    const reorderStatusUseCase = new ReorderStatusUseCase(statusCatalogRepo);
    studentsBridgeInstance = {
        studentRepository: studentRepo,
        addStudentUseCase,
        statusCatalogRepository: statusCatalogRepo,
        addStatusUseCase,
        updateStatusUseCase,
        reorderStatusUseCase
    };
    return studentsBridgeInstance;
}
/**
 * Get students bridge instance
 */
export function getStudentsBridge() {
    if (!studentsBridgeInstance) {
        throw new Error('StudentsBridge not initialized. Call initializeStudentsBridge() first.');
    }
    return studentsBridgeInstance;
}
/**
 * Vue composable for students module access
 * Provides reactive access to students bridge
 */
export function useStudents() {
    const bridge = ref(studentsBridgeInstance);
    const isInitialized = computed(() => bridge.value !== null);
    return {
        studentsBridge: bridge,
        isInitialized,
        // Convenience accessors
        repository: computed(() => bridge.value?.studentRepository),
        addStudentUseCase: computed(() => bridge.value?.addStudentUseCase),
        statusCatalogRepository: computed(() => bridge.value?.statusCatalogRepository),
        addStatusUseCase: computed(() => bridge.value?.addStatusUseCase),
        updateStatusUseCase: computed(() => bridge.value?.updateStatusUseCase),
        reorderStatusUseCase: computed(() => bridge.value?.reorderStatusUseCase)
    };
}
// Re-exports for convenience
export { StudentRepository, AddStudentUseCase, StatusCatalogRepository };
export { AddStatusUseCase, UpdateStatusUseCase, ReorderStatusUseCase };
