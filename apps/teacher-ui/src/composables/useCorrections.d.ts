/**
 * Corrections Composable
 * Handles all correction entry operations for KURT module
 */
import type { Exams as ExamsTypes } from '@viccoboard/core';
import { type PaginationOptions, type PaginatedResult } from '@viccoboard/core';
/**
 * Correction entry operations
 */
export declare function useCorrections(): {
    getByExam: (examId: string, pagination?: PaginationOptions) => Promise<PaginatedResult<ExamsTypes.CorrectionEntry>>;
    getByCandidate: (candidateId: string, pagination?: PaginationOptions) => Promise<PaginatedResult<ExamsTypes.CorrectionEntry>>;
    create: (entry: ExamsTypes.CorrectionEntry) => Promise<string>;
    update: (entry: ExamsTypes.CorrectionEntry) => Promise<void>;
    remove: (id: string) => Promise<void>;
};
