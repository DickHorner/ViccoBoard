/**
 * Exams Module Bridge
 * Provides UI access to exams module repositories and use-cases
 * 
 * ARCHITECTURE: This is the ONLY place where UI should access exams domain.
 * All exam-related data access must go through this bridge.
 */

import { ref, computed } from 'vue';
import { getStorageAdapter } from '../services/storage.service';

/**
 * Singleton exams bridge instance
 */
let examsBridgeInstance: ExamsBridge | null = null;

interface ExamsBridge {
  // TODO: Add exam repositories and use cases from @viccoboard/exams modules
  // when they are fully implemented
  initialized: boolean;
}

/**
 * Initialize exams bridge
 * Must be called after storage is initialized
 */
export function initializeExamsBridge(): ExamsBridge {
  if (examsBridgeInstance) {
    return examsBridgeInstance;
  }

  const adapter = getStorageAdapter();

  // TODO: Initialize exam repositories and use cases from @viccoboard/exams
  // const examRepo = new ExamRepository(adapter);
  // const createExamUseCase = new CreateExamUseCase(examRepo);
  // etc.

  examsBridgeInstance = {
    // TODO: Add actual implementations
    initialized: true
  };

  return examsBridgeInstance;
}

/**
 * Get exams bridge instance
 */
export function getExamsBridge(): ExamsBridge {
  if (!examsBridgeInstance) {
    throw new Error(
      'ExamsBridge not initialized. Call initializeExamsBridge() first.'
    );
  }
  return examsBridgeInstance;
}

/**
 * Vue composable for exams module access
 * Provides reactive access to exams bridge
 */
export function useExamsBridge() {
  const bridge = ref<ExamsBridge | null>(examsBridgeInstance);

  const isInitialized = computed(() => bridge.value !== null);

  return {
    examsBridge: bridge,
    isInitialized
  };
}
