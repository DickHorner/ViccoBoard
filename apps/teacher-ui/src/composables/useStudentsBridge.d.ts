/**
 * Students Module Bridge
 * Provides UI access to students module repositories and use-cases
 *
 * ARCHITECTURE: This is the ONLY place where UI should access students domain.
 * All student-related data access must go through this bridge.
 */
import { StudentRepository, AddStudentUseCase, StatusCatalogRepository, AddStatusUseCase, UpdateStatusUseCase, ReorderStatusUseCase } from '@viccoboard/students';
import type { AddStudentInput } from '@viccoboard/students';
import type { AddStatusInput, UpdateStatusInput, ReorderStatusInput } from '@viccoboard/students';
interface StudentsBridge {
    studentRepository: StudentRepository;
    addStudentUseCase: AddStudentUseCase;
    statusCatalogRepository: StatusCatalogRepository;
    addStatusUseCase: AddStatusUseCase;
    updateStatusUseCase: UpdateStatusUseCase;
    reorderStatusUseCase: ReorderStatusUseCase;
}
/**
 * Initialize students bridge
 * Must be called after storage is initialized
 */
export declare function initializeStudentsBridge(): StudentsBridge;
/**
 * Get students bridge instance
 */
export declare function getStudentsBridge(): StudentsBridge;
/**
 * Vue composable for students module access
 * Provides reactive access to students bridge
 */
export declare function useStudents(): {
    studentsBridge: import("vue").Ref<{
        studentRepository: StudentRepository;
        addStudentUseCase: AddStudentUseCase;
        statusCatalogRepository: StatusCatalogRepository;
        addStatusUseCase: AddStatusUseCase;
        updateStatusUseCase: UpdateStatusUseCase;
        reorderStatusUseCase: ReorderStatusUseCase;
    } | null, StudentsBridge | {
        studentRepository: StudentRepository;
        addStudentUseCase: AddStudentUseCase;
        statusCatalogRepository: StatusCatalogRepository;
        addStatusUseCase: AddStatusUseCase;
        updateStatusUseCase: UpdateStatusUseCase;
        reorderStatusUseCase: ReorderStatusUseCase;
    } | null>;
    isInitialized: import("vue").ComputedRef<boolean>;
    repository: import("vue").ComputedRef<any>;
    addStudentUseCase: import("vue").ComputedRef<any>;
    statusCatalogRepository: import("vue").ComputedRef<any>;
    addStatusUseCase: import("vue").ComputedRef<any>;
    updateStatusUseCase: import("vue").ComputedRef<any>;
    reorderStatusUseCase: import("vue").ComputedRef<any>;
};
export { StudentRepository, AddStudentUseCase, StatusCatalogRepository };
export { AddStatusUseCase, UpdateStatusUseCase, ReorderStatusUseCase };
export type { AddStudentInput, AddStatusInput, UpdateStatusInput, ReorderStatusInput };
