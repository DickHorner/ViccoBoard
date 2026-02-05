/**
 * Corrections Composable
 * Handles all correction entry operations for KURT module
 */

import type { Exams as ExamsTypes } from '@viccoboard/core'
import { normalizePaginationOptions, createPaginatedResult, type PaginationOptions, type PaginatedResult } from '@viccoboard/core'
import { safeJsonParse, safeJsonStringify } from '@viccoboard/storage'
import { db } from '../db'
import type { CorrectionEntryRecord } from '../db'

/**
 * Map database record to CorrectionEntry domain entity
 */
const mapRecordToCorrection = (record: CorrectionEntryRecord): ExamsTypes.CorrectionEntry => ({
  id: record.id,
  examId: record.examId,
  candidateId: record.candidateId,
  taskScores: safeJsonParse(record.taskScores, [], 'CorrectionEntry.taskScores'),
  totalPoints: record.totalPoints,
  totalGrade: record.totalGrade,
  percentageScore: record.percentageScore,
  comments: safeJsonParse(record.comments, [], 'CorrectionEntry.comments'),
  supportTips: safeJsonParse(record.supportTips, [], 'CorrectionEntry.supportTips'),
  highlightedWork: record.highlightedWork ? safeJsonParse(record.highlightedWork, undefined, 'CorrectionEntry.highlightedWork') : undefined,
  status: record.status,
  correctedAt: record.correctedAt,
  lastModified: record.lastModified
})

/**
 * Map CorrectionEntry domain entity to database record
 */
const mapCorrectionToRecord = (entry: ExamsTypes.CorrectionEntry): CorrectionEntryRecord => ({
  id: entry.id,
  examId: entry.examId,
  candidateId: entry.candidateId,
  taskScores: safeJsonStringify(entry.taskScores ?? [], 'CorrectionEntry.taskScores'),
  totalPoints: entry.totalPoints,
  totalGrade: entry.totalGrade,
  percentageScore: entry.percentageScore,
  comments: safeJsonStringify(entry.comments ?? [], 'CorrectionEntry.comments'),
  supportTips: safeJsonStringify(entry.supportTips ?? [], 'CorrectionEntry.supportTips'),
  highlightedWork: entry.highlightedWork ? safeJsonStringify(entry.highlightedWork, 'CorrectionEntry.highlightedWork') : undefined,
  status: entry.status,
  correctedAt: entry.correctedAt,
  lastModified: entry.lastModified
})

/**
 * Correction entry operations
 */
export function useCorrections() {
  const getByExam = async (examId: string, pagination?: PaginationOptions): Promise<PaginatedResult<ExamsTypes.CorrectionEntry>> => {
    try {
      const options = normalizePaginationOptions(pagination)
      const total = await db.correctionEntries.where('examId').equals(examId).count()
      const records = await db.correctionEntries
        .where('examId')
        .equals(examId)
        .offset(options.offset)
        .limit(options.limit)
        .toArray()
      const items = records.map(mapRecordToCorrection)
      
      return createPaginatedResult(items, total, options)
    } catch (error) {
      console.error(`[useCorrections.getByExam] Failed to fetch corrections for exam ${examId}:`, error)
      throw new Error('Failed to load corrections. Please try again.')
    }
  }

  const getByCandidate = async (candidateId: string, pagination?: PaginationOptions): Promise<PaginatedResult<ExamsTypes.CorrectionEntry>> => {
    try {
      const options = normalizePaginationOptions(pagination)
      const total = await db.correctionEntries.where('candidateId').equals(candidateId).count()
      const records = await db.correctionEntries
        .where('candidateId')
        .equals(candidateId)
        .offset(options.offset)
        .limit(options.limit)
        .toArray()
      const items = records.map(mapRecordToCorrection)
      
      return createPaginatedResult(items, total, options)
    } catch (error) {
      console.error(`[useCorrections.getByCandidate] Failed to fetch corrections for candidate ${candidateId}:`, error)
      throw new Error('Failed to load corrections. Please try again.')
    }
  }

  const create = async (entry: ExamsTypes.CorrectionEntry): Promise<string> => {
    try {
      const record = mapCorrectionToRecord(entry)
      await db.correctionEntries.add(record)
      return record.id
    } catch (error) {
      console.error('[useCorrections.create] Failed to create correction:', error)
      throw new Error('Failed to create correction. Please try again.')
    }
  }

  const update = async (entry: ExamsTypes.CorrectionEntry): Promise<void> => {
    try {
      const record = mapCorrectionToRecord(entry)
      await db.correctionEntries.update(record.id, record)
    } catch (error) {
      console.error(`[useCorrections.update] Failed to update correction ${entry.id}:`, error)
      throw new Error('Failed to update correction. Please try again.')
    }
  }

  const remove = async (id: string): Promise<void> => {
    try {
      await db.correctionEntries.delete(id)
    } catch (error) {
      console.error(`[useCorrections.remove] Failed to delete correction ${id}:`, error)
      throw new Error('Failed to delete correction. Please try again.')
    }
  }

  return {
    getByExam,
    getByCandidate,
    create,
    update,
    remove
  }
}
