/**
 * Exam Composable
 * Handles all exam-related database operations for KURT module
 */
import { Exams, type PaginationOptions, type PaginatedResult } from '@viccoboard/core';
/**
 * Exam operations (KURT)
 */
export declare function useExams(): {
    getAll: (pagination?: PaginationOptions) => Promise<PaginatedResult<Exams.Exam>>;
    getById: (id: string) => Promise<Exams.Exam | undefined>;
    create: (exam: Exams.Exam) => Promise<string>;
    update: (exam: Exams.Exam) => Promise<void>;
    remove: (id: string) => Promise<void>;
};
