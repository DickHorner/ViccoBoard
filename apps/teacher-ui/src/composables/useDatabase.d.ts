/**
 * Database composable for managing Dexie database and repositories
 * This is a minimal wrapper that provides access to the database
 * and re-exports specialized composables for better organization.
 */
import { Sport } from '@viccoboard/core';
/**
 * Main database composable
 * Returns low-level database access and sportBridge mock
 */
export declare function useDatabase(): {
    db: import("../db").ViccoDb;
    sportBridge: import("vue").Ref<{
        classGroupRepository: {
            findAll: () => Promise<import("../db").ClassGroup[]>;
            read: (id: string) => Promise<import("../db").ClassGroup | undefined>;
            create: (entity: any) => Promise<{
                lastModified: Date;
                students: never[];
                gradeCategories: never[];
                id: string;
                name: any;
                schoolYear: any;
                createdAt: Date;
                updatedAt: Date;
            }>;
            update: (id: string, entity: any) => Promise<void>;
        };
        studentRepository: {
            findAll: () => Promise<import("../db").Student[]>;
            read: (id: string) => Promise<import("../db").Student | undefined>;
            findByClassGroup: (classId: string) => Promise<import("../db").Student[]>;
            create: (entity: any) => Promise<{
                id: string;
                classGroupId: any;
                firstName: any;
                lastName: any;
                birthYear: any;
                email: any;
                createdAt: Date;
                lastModified: Date;
            }>;
        };
        gradeCategoryRepository: {
            findAll: () => Promise<Sport.GradeCategory[]>;
            read: (id: string) => Promise<Sport.GradeCategory | null>;
            findByClassGroup: (classId: string) => Promise<Sport.GradeCategory[]>;
            create: (entity: Partial<Sport.GradeCategory>) => Promise<Sport.GradeCategory>;
            update: (id: string, entity: Partial<Sport.GradeCategory>) => Promise<void>;
        };
        performanceEntryRepository: {
            findAll: () => Promise<{
                measurements: {};
                metadata: undefined;
                id: string;
                studentId: string;
                categoryId: string;
                calculatedGrade?: string | number;
                timestamp: Date;
                comment?: string;
            }[]>;
            read: (id: string) => Promise<{
                measurements: {};
                metadata: undefined;
                id: string;
                studentId: string;
                categoryId: string;
                calculatedGrade?: string | number;
                timestamp: Date;
                comment?: string;
            } | null>;
            findByStudent: (studentId: string) => Promise<{
                measurements: {};
                metadata: undefined;
                id: string;
                studentId: string;
                categoryId: string;
                calculatedGrade?: string | number;
                timestamp: Date;
                comment?: string;
            }[]>;
            findByCategory: (categoryId: string) => Promise<{
                measurements: {};
                metadata: undefined;
                id: string;
                studentId: string;
                categoryId: string;
                calculatedGrade?: string | number;
                timestamp: Date;
                comment?: string;
            }[]>;
            findByStudentAndCategory: (studentId: string, categoryId: string) => Promise<{
                measurements: {};
                metadata: undefined;
                id: string;
                studentId: string;
                categoryId: string;
                calculatedGrade?: string | number;
                timestamp: Date;
                comment?: string;
            }[]>;
            create: (entity: Partial<Sport.PerformanceEntry>) => Promise<Sport.PerformanceEntry>;
        };
        createGradeCategoryUseCase: {
            execute: (input: any) => Promise<any>;
        };
        recordGradeUseCase: {
            execute: (input: any) => Promise<any>;
        };
    }, {
        classGroupRepository: {
            findAll: () => Promise<import("../db").ClassGroup[]>;
            read: (id: string) => Promise<import("../db").ClassGroup | undefined>;
            create: (entity: any) => Promise<{
                lastModified: Date;
                students: never[];
                gradeCategories: never[];
                id: string;
                name: any;
                schoolYear: any;
                createdAt: Date;
                updatedAt: Date;
            }>;
            update: (id: string, entity: any) => Promise<void>;
        };
        studentRepository: {
            findAll: () => Promise<import("../db").Student[]>;
            read: (id: string) => Promise<import("../db").Student | undefined>;
            findByClassGroup: (classId: string) => Promise<import("../db").Student[]>;
            create: (entity: any) => Promise<{
                id: string;
                classGroupId: any;
                firstName: any;
                lastName: any;
                birthYear: any;
                email: any;
                createdAt: Date;
                lastModified: Date;
            }>;
        };
        gradeCategoryRepository: {
            findAll: () => Promise<Sport.GradeCategory[]>;
            read: (id: string) => Promise<Sport.GradeCategory | null>;
            findByClassGroup: (classId: string) => Promise<Sport.GradeCategory[]>;
            create: (entity: Partial<Sport.GradeCategory>) => Promise<Sport.GradeCategory>;
            update: (id: string, entity: Partial<Sport.GradeCategory>) => Promise<void>;
        };
        performanceEntryRepository: {
            findAll: () => Promise<{
                measurements: {};
                metadata: undefined;
                id: string;
                studentId: string;
                categoryId: string;
                calculatedGrade?: string | number;
                timestamp: Date;
                comment?: string;
            }[]>;
            read: (id: string) => Promise<{
                measurements: {};
                metadata: undefined;
                id: string;
                studentId: string;
                categoryId: string;
                calculatedGrade?: string | number;
                timestamp: Date;
                comment?: string;
            } | null>;
            findByStudent: (studentId: string) => Promise<{
                measurements: {};
                metadata: undefined;
                id: string;
                studentId: string;
                categoryId: string;
                calculatedGrade?: string | number;
                timestamp: Date;
                comment?: string;
            }[]>;
            findByCategory: (categoryId: string) => Promise<{
                measurements: {};
                metadata: undefined;
                id: string;
                studentId: string;
                categoryId: string;
                calculatedGrade?: string | number;
                timestamp: Date;
                comment?: string;
            }[]>;
            findByStudentAndCategory: (studentId: string, categoryId: string) => Promise<{
                measurements: {};
                metadata: undefined;
                id: string;
                studentId: string;
                categoryId: string;
                calculatedGrade?: string | number;
                timestamp: Date;
                comment?: string;
            }[]>;
            create: (entity: Partial<Sport.PerformanceEntry>) => Promise<Sport.PerformanceEntry>;
        };
        createGradeCategoryUseCase: {
            execute: (input: any) => Promise<any>;
        };
        recordGradeUseCase: {
            execute: (input: any) => Promise<any>;
        };
    } | {
        classGroupRepository: {
            findAll: () => Promise<import("../db").ClassGroup[]>;
            read: (id: string) => Promise<import("../db").ClassGroup | undefined>;
            create: (entity: any) => Promise<{
                lastModified: Date;
                students: never[];
                gradeCategories: never[];
                id: string;
                name: any;
                schoolYear: any;
                createdAt: Date;
                updatedAt: Date;
            }>;
            update: (id: string, entity: any) => Promise<void>;
        };
        studentRepository: {
            findAll: () => Promise<import("../db").Student[]>;
            read: (id: string) => Promise<import("../db").Student | undefined>;
            findByClassGroup: (classId: string) => Promise<import("../db").Student[]>;
            create: (entity: any) => Promise<{
                id: string;
                classGroupId: any;
                firstName: any;
                lastName: any;
                birthYear: any;
                email: any;
                createdAt: Date;
                lastModified: Date;
            }>;
        };
        gradeCategoryRepository: {
            findAll: () => Promise<Sport.GradeCategory[]>;
            read: (id: string) => Promise<Sport.GradeCategory | null>;
            findByClassGroup: (classId: string) => Promise<Sport.GradeCategory[]>;
            create: (entity: Partial<Sport.GradeCategory>) => Promise<Sport.GradeCategory>;
            update: (id: string, entity: Partial<Sport.GradeCategory>) => Promise<void>;
        };
        performanceEntryRepository: {
            findAll: () => Promise<{
                measurements: {};
                metadata: undefined;
                id: string;
                studentId: string;
                categoryId: string;
                calculatedGrade?: string | number;
                timestamp: Date;
                comment?: string;
            }[]>;
            read: (id: string) => Promise<{
                measurements: {};
                metadata: undefined;
                id: string;
                studentId: string;
                categoryId: string;
                calculatedGrade?: string | number;
                timestamp: Date;
                comment?: string;
            } | null>;
            findByStudent: (studentId: string) => Promise<{
                measurements: {};
                metadata: undefined;
                id: string;
                studentId: string;
                categoryId: string;
                calculatedGrade?: string | number;
                timestamp: Date;
                comment?: string;
            }[]>;
            findByCategory: (categoryId: string) => Promise<{
                measurements: {};
                metadata: undefined;
                id: string;
                studentId: string;
                categoryId: string;
                calculatedGrade?: string | number;
                timestamp: Date;
                comment?: string;
            }[]>;
            findByStudentAndCategory: (studentId: string, categoryId: string) => Promise<{
                measurements: {};
                metadata: undefined;
                id: string;
                studentId: string;
                categoryId: string;
                calculatedGrade?: string | number;
                timestamp: Date;
                comment?: string;
            }[]>;
            create: (entity: Partial<Sport.PerformanceEntry>) => Promise<Sport.PerformanceEntry>;
        };
        createGradeCategoryUseCase: {
            execute: (input: any) => Promise<any>;
        };
        recordGradeUseCase: {
            execute: (input: any) => Promise<any>;
        };
    }>;
    classGroups: import("dexie").EntityTable<import("../db").ClassGroup, "id">;
    students: import("dexie").EntityTable<import("../db").Student, "id">;
    attendanceRecords: import("dexie").EntityTable<import("../db").AttendanceRecord, "id">;
    assessments: import("dexie").EntityTable<import("../db").Assessment, "id">;
    gradeCategories: import("dexie").EntityTable<import("../db").GradeCategory, "id">;
    performanceEntries: import("dexie").EntityTable<import("../db").PerformanceEntry, "id">;
    exams: import("dexie").EntityTable<import("../db").ExamRecord, "id">;
    correctionEntries: import("dexie").EntityTable<import("../db").CorrectionEntryRecord, "id">;
};
/**
 * Re-export specialized composables from their dedicated files
 * This provides better code organization and testing isolation
 */
export { useExams } from './useExams';
export { useCorrections } from './useCorrections';
export { useSportBridge, initializeSportBridge, getSportBridge } from './useSportBridge';
