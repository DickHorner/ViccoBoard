/**
 * Students Module Bridge
 * Provides UI access to students module repositories and use-cases
 * 
 * ARCHITECTURE: This is the ONLY place where UI should access students domain.
 * All student-related data access must go through this bridge.
 */

import { ref, computed } from 'vue';
import {
  StudentRepository,
  AddStudentUseCase,
  SportStudentProfileRepository,
  StatusCatalogRepository,
  AddStatusUseCase,
  UpdateStatusUseCase,
  ReorderStatusUseCase,
  ImportBatchRepository,
  ImportBatchItemRepository,
  StudentCalendarEntryRepository,
  StudentCsvImportUseCase,
  IservAbsenceImportUseCase
} from '@viccoboard/students';
import type { AddStudentInput } from '@viccoboard/students';
import type {
  AddStatusInput,
  UpdateStatusInput,
  ReorderStatusInput,
  StudentCsvFile
} from '@viccoboard/students';
import { ClassGroupRepository } from '@viccoboard/sport';
import { getStorageAdapter } from '../services/storage.service';

let studentsBridgeInstance: StudentsBridge | null = null;

interface StudentsBridge {
  studentRepository: StudentRepository;
  addStudentUseCase: AddStudentUseCase;
  sportStudentProfileRepository: SportStudentProfileRepository;
  statusCatalogRepository: StatusCatalogRepository;
  importBatchRepository: ImportBatchRepository;
  importBatchItemRepository: ImportBatchItemRepository;
  studentCalendarEntryRepository: StudentCalendarEntryRepository;
  studentCsvImportUseCase: StudentCsvImportUseCase;
  iservAbsenceImportUseCase: IservAbsenceImportUseCase;
  addStatusUseCase: AddStatusUseCase;
  updateStatusUseCase: UpdateStatusUseCase;
  reorderStatusUseCase: ReorderStatusUseCase;
}

export function initializeStudentsBridge(): StudentsBridge {
  if (studentsBridgeInstance) {
    return studentsBridgeInstance;
  }

  const adapter = getStorageAdapter();
  const studentRepo = new StudentRepository(adapter);
  const sportStudentProfileRepository = new SportStudentProfileRepository(adapter);
  const statusCatalogRepo = new StatusCatalogRepository(adapter);
  const importBatchRepository = new ImportBatchRepository(adapter);
  const importBatchItemRepository = new ImportBatchItemRepository(adapter);
  const studentCalendarEntryRepository = new StudentCalendarEntryRepository(adapter);
  const classGroupRepository = new ClassGroupRepository(adapter);

  const addStudentUseCase = new AddStudentUseCase(studentRepo);
  const studentCsvImportUseCase = new StudentCsvImportUseCase(
    studentRepo,
    classGroupRepository,
    importBatchRepository,
    importBatchItemRepository
  );
  const iservAbsenceImportUseCase = new IservAbsenceImportUseCase(
    studentRepo,
    classGroupRepository,
    studentCalendarEntryRepository
  );
  const addStatusUseCase = new AddStatusUseCase(statusCatalogRepo);
  const updateStatusUseCase = new UpdateStatusUseCase(statusCatalogRepo);
  const reorderStatusUseCase = new ReorderStatusUseCase(statusCatalogRepo);

  studentsBridgeInstance = {
    studentRepository: studentRepo,
    addStudentUseCase,
    sportStudentProfileRepository,
    statusCatalogRepository: statusCatalogRepo,
    importBatchRepository,
    importBatchItemRepository,
    studentCalendarEntryRepository,
    studentCsvImportUseCase,
    iservAbsenceImportUseCase,
    addStatusUseCase,
    updateStatusUseCase,
    reorderStatusUseCase
  };

  return studentsBridgeInstance;
}

export function getStudentsBridge(): StudentsBridge {
  if (!studentsBridgeInstance) {
    throw new Error(
      'StudentsBridge not initialized. Call initializeStudentsBridge() first.'
    );
  }
  return studentsBridgeInstance;
}

export function useStudents() {
  const bridge = ref<StudentsBridge | null>(studentsBridgeInstance);
  const isInitialized = computed(() => bridge.value !== null);

  return {
    studentsBridge: bridge,
    isInitialized,
    repository: computed(() => bridge.value?.studentRepository),
    addStudentUseCase: computed(() => bridge.value?.addStudentUseCase),
    sportStudentProfileRepository: computed(() => bridge.value?.sportStudentProfileRepository),
    statusCatalogRepository: computed(() => bridge.value?.statusCatalogRepository),
    importBatchRepository: computed(() => bridge.value?.importBatchRepository),
    importBatchItemRepository: computed(() => bridge.value?.importBatchItemRepository),
    studentCalendarEntryRepository: computed(() => bridge.value?.studentCalendarEntryRepository),
    studentCsvImportUseCase: computed(() => bridge.value?.studentCsvImportUseCase),
    iservAbsenceImportUseCase: computed(() => bridge.value?.iservAbsenceImportUseCase),
    addStatusUseCase: computed(() => bridge.value?.addStatusUseCase),
    updateStatusUseCase: computed(() => bridge.value?.updateStatusUseCase),
    reorderStatusUseCase: computed(() => bridge.value?.reorderStatusUseCase)
  };
}

export {
  StudentRepository,
  AddStudentUseCase,
  SportStudentProfileRepository,
  StatusCatalogRepository,
  ImportBatchRepository,
  ImportBatchItemRepository,
  StudentCalendarEntryRepository,
  StudentCsvImportUseCase,
  IservAbsenceImportUseCase
};
export { AddStatusUseCase, UpdateStatusUseCase, ReorderStatusUseCase };
export type {
  AddStudentInput,
  AddStatusInput,
  UpdateStatusInput,
  ReorderStatusInput,
  StudentCsvFile
};
