/**
 * Exam Composable
 * Handles all exam-related database operations for KURT module
 */

import { Exams, normalizePaginationOptions, createPaginatedResult, type PaginationOptions, type PaginatedResult } from '@viccoboard/core'
import { safeJsonParse, safeJsonStringify } from '@viccoboard/storage'
import { db } from '../db'
import type { ExamRecord } from '../db'

const EMPTY_STRUCTURE: Exams.ExamStructure = {
  parts: [],
  tasks: [],
  allowsComments: false,
  allowsSupportTips: false,
  totalPoints: 0
}

const DEFAULT_GRADING_KEY: Exams.GradingKey = {
  id: '',
  name: '',
  type: Exams.GradingKeyType.Percentage,
  totalPoints: 0,
  gradeBoundaries: [],
  roundingRule: {
    type: 'none',
    decimalPlaces: 0
  },
  errorPointsToGrade: false,
  customizable: true,
  modifiedAfterCorrection: false
}

/**
 * Map database record to Exam domain entity
 */
const mapRecordToExam = (record: ExamRecord): Exams.Exam => ({
  id: record.id,
  title: record.title,
  description: record.description ?? undefined,
  classGroupId: record.classGroupId ?? undefined,
  mode: record.mode as Exams.ExamMode,
  structure: safeJsonParse(record.structure, EMPTY_STRUCTURE, 'ExamRecord.structure'),
  gradingKey: safeJsonParse(record.gradingKey, DEFAULT_GRADING_KEY, 'ExamRecord.gradingKey'),
  printPresets: safeJsonParse(record.printPresets, [], 'ExamRecord.printPresets'),
  candidates: safeJsonParse(record.candidates, [], 'ExamRecord.candidates'),
  status: record.status,
  createdAt: record.createdAt,
  lastModified: record.updatedAt
})

/**
 * Map Exam domain entity to database record
 */
const mapExamToRecord = (exam: Exams.Exam): ExamRecord => ({
  id: exam.id,
  title: exam.title,
  description: exam.description,
  classGroupId: exam.classGroupId,
  mode: exam.mode,
  structure: safeJsonStringify(exam.structure, 'Exam.structure'),
  gradingKey: safeJsonStringify(exam.gradingKey, 'Exam.gradingKey'),
  printPresets: safeJsonStringify(exam.printPresets ?? [], 'Exam.printPresets'),
  candidates: safeJsonStringify(exam.candidates ?? [], 'Exam.candidates'),
  status: exam.status,
  createdAt: exam.createdAt,
  updatedAt: exam.lastModified
})

/**
 * Exam operations (KURT)
 */
export function useExams() {
  const getAll = async (pagination?: PaginationOptions): Promise<PaginatedResult<Exams.Exam>> => {
    try {
      const options = normalizePaginationOptions(pagination)
      const total = await db.exams.count()
      const records = await db.exams
        .orderBy('createdAt')
        .reverse()
        .offset(options.offset)
        .limit(options.limit)
        .toArray()
      const items = records.map(mapRecordToExam)
      
      return createPaginatedResult(items, total, options)
    } catch (error) {
      console.error('[useExams.getAll] Failed to fetch exams:', error)
      throw new Error('Failed to load exams. Please try again.')
    }
  }

  const getById = async (id: string): Promise<Exams.Exam | undefined> => {
    try {
      const record = await db.exams.get(id)
      return record ? mapRecordToExam(record) : undefined
    } catch (error) {
      console.error(`[useExams.getById] Failed to fetch exam ${id}:`, error)
      throw new Error('Failed to load exam. Please try again.')
    }
  }

  const create = async (exam: Exams.Exam): Promise<string> => {
    try {
      const record = mapExamToRecord(exam)
      await db.exams.add(record)
      return record.id
    } catch (error) {
      console.error('[useExams.create] Failed to create exam:', error)
      throw new Error('Failed to create exam. Please check your input and try again.')
    }
  }

  const update = async (exam: Exams.Exam): Promise<void> => {
    try {
      const record = mapExamToRecord(exam)
      await db.exams.update(record.id, record)
    } catch (error) {
      console.error(`[useExams.update] Failed to update exam ${exam.id}:`, error)
      throw new Error('Failed to update exam. Please try again.')
    }
  }

  const remove = async (id: string): Promise<void> => {
    try {
      await db.exams.delete(id)
    } catch (error) {
      console.error(`[useExams.remove] Failed to delete exam ${id}:`, error)
      throw new Error('Failed to delete exam. Please try again.')
    }
  }

  return {
    getAll,
    getById,
    create,
    update,
    remove
  }
}
