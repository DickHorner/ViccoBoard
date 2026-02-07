/**
 * Students Module Bridge
 * Provides UI access to students module repositories and use-cases
 * 
 * ARCHITECTURE: This is the ONLY place where UI should access students domain.
 * All student-related data access must go through this bridge.
 */

import { ref, computed } from 'vue';
import { StudentRepository, AddStudentUseCase } from '@viccoboard/students';
import type { AddStudentInput } from '@viccoboard/students';
import { getStorageAdapter } from '../services/storage.service';

/**
 * Singleton students bridge instance
 */
let studentsBridgeInstance: StudentsBridge | null = null;

interface StudentsBridge {
  studentRepository: StudentRepository;
  addStudentUseCase: AddStudentUseCase;
}

/**
 * Initialize students bridge
 * Must be called after storage is initialized
 */
export function initializeStudentsBridge(): StudentsBridge {
  if (studentsBridgeInstance) {
    return studentsBridgeInstance;
  }

  const adapter = getStorageAdapter();

  // Initialize repository with storage adapter
  const studentRepo = new StudentRepository(adapter);

  // Initialize use case with repository
  const addStudentUseCase = new AddStudentUseCase(studentRepo);

  studentsBridgeInstance = {
    studentRepository: studentRepo,
    addStudentUseCase
  };

  return studentsBridgeInstance;
}

/**
 * Get students bridge instance
 */
export function getStudentsBridge(): StudentsBridge {
  if (!studentsBridgeInstance) {
    throw new Error(
      'StudentsBridge not initialized. Call initializeStudentsBridge() first.'
    );
  }
  return studentsBridgeInstance;
}

/**
 * Vue composable for students module access
 * Provides reactive access to students bridge
 */
export function useStudents() {
  const bridge = ref<StudentsBridge | null>(studentsBridgeInstance);

  const isInitialized = computed(() => bridge.value !== null);

  return {
    studentsBridge: bridge,
    isInitialized,

    // Convenience accessors
    repository: computed(() => bridge.value?.studentRepository),
    addStudentUseCase: computed(() => bridge.value?.addStudentUseCase)
  };
}

// Re-exports for convenience
export { StudentRepository, AddStudentUseCase };
export type { AddStudentInput };
