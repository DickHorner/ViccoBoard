/**
 * Database composable for managing Dexie database and repositories
 * This is a minimal wrapper that provides access to the database
 * and re-exports specialized composables for better organization.
 */

import { ref } from 'vue'
import { Sport, safeJsonParse, safeJsonStringify } from '@viccoboard/core'
import { db } from '../db'
import { createUuid } from '../utils/uuid'

/**
 * Main database composable
 * Returns low-level database access and sportBridge mock
 */
export function useDatabase() {
  // Mock bridge structure for Sport module compatibility
  const sportBridge = ref({
    classGroupRepository: {
      findAll: async () => await db.classGroups.toArray(),
      read: async (id: string) => await db.classGroups.get(id),
      create: async (entity: any) => {
        const id = createUuid()
        const now = new Date()
        const record = {
          id,
          name: entity.name || '',
          schoolYear: entity.schoolYear || '',
          createdAt: now,
          updatedAt: now
        }
        await db.classGroups.add(record)
        const result = { 
          ...record, 
          lastModified: now,
          students: [],
          gradeCategories: []
        }
        return result
      },
      update: async (id: string, entity: any) => {
        await db.classGroups.update(id, { 
          name: entity.name,
          schoolYear: entity.schoolYear,
          updatedAt: new Date() 
        })
      }
    },
    studentRepository: {
      findAll: async () => await db.students.toArray(),
      read: async (id: string) => await db.students.get(id),
      findByClassGroup: async (classId: string) =>
        await db.students.where('classId').equals(classId).toArray(),
      create: async (entity: any) => {
        const id = createUuid()
        const now = new Date()
        const record = {
          id,
          classId: entity.classGroupId || '',
          firstName: entity.firstName || '',
          lastName: entity.lastName || '',
          dateOfBirth: entity.birthYear ? new Date(entity.birthYear, 0, 1) : undefined,
          email: entity.email,
          createdAt: now,
          updatedAt: now
        }
        await db.students.add(record)
        const result = {
          id: record.id,
          classGroupId: record.classId,
          firstName: record.firstName,
          lastName: record.lastName,
          birthYear: entity.birthYear,
          email: entity.email,
          createdAt: now,
          lastModified: now
        }
        return result
      }
    },
    gradeCategoryRepository: {
      findAll: async () => {
        const categories = await db.gradeCategories.toArray()
        return categories.map(c => ({
          id: c.id,
          classGroupId: c.classGroupId,
          name: c.name,
          description: c.description,
          type: c.type as Sport.GradeCategoryType,
          weight: c.weight,
          configuration: safeJsonParse(c.configuration, {}, 'GradeCategory.configuration'),
          createdAt: c.createdAt,
          lastModified: c.updatedAt
        } as Sport.GradeCategory))
      },
      read: async (id: string) => {
        const category = await db.gradeCategories.get(id)
        if (!category) return null
        return {
          id: category.id,
          classGroupId: category.classGroupId,
          name: category.name,
          description: category.description,
          type: category.type as Sport.GradeCategoryType,
          weight: category.weight,
          configuration: safeJsonParse(category.configuration, {}, 'GradeCategory.configuration'),
          createdAt: category.createdAt,
          lastModified: category.updatedAt
        } as Sport.GradeCategory
      },
      findByClassGroup: async (classId: string) => {
        const categories = await db.gradeCategories
          .where('classGroupId')
          .equals(classId)
          .toArray()
        return categories.map(c => ({
          id: c.id,
          classGroupId: c.classGroupId,
          name: c.name,
          description: c.description,
          type: c.type as Sport.GradeCategoryType,
          weight: c.weight,
          configuration: safeJsonParse(c.configuration, {}, 'GradeCategory.configuration'),
          createdAt: c.createdAt,
          lastModified: c.updatedAt
        } as Sport.GradeCategory))
      },
      create: async (entity: Partial<Sport.GradeCategory>) => {
        const id = createUuid()
        const now = new Date()
        const record = {
          id,
          classGroupId: entity.classGroupId || '',
          name: entity.name || '',
          description: entity.description,
          type: (entity.type || 'criteria') as Sport.GradeCategoryType,
          weight: entity.weight || 0,
          configuration: safeJsonStringify(entity.configuration, 'GradeCategory.configuration'),
          createdAt: now,
          updatedAt: now
        }
        await db.gradeCategories.add(record)
        const result: Sport.GradeCategory = { 
          id: record.id,
          classGroupId: record.classGroupId,
          name: record.name,
          description: record.description,
          type: record.type as Sport.GradeCategoryType,
          weight: record.weight,
          configuration: entity.configuration!,
          createdAt: now, 
          lastModified: now 
        }
        return result
      },
      update: async (id: string, entity: Partial<Sport.GradeCategory>) => {
        await db.gradeCategories.update(id, { 
          name: entity.name,
          description: entity.description,
          type: entity.type,
          weight: entity.weight,
          configuration: entity.configuration 
            ? safeJsonStringify(entity.configuration, 'GradeCategory.configuration')
            : undefined,
          updatedAt: new Date() 
        })
      }
    },
    performanceEntryRepository: {
      findAll: async () => {
        const entries = await db.performanceEntries.toArray()
        return entries.map(e => ({
          ...e,
          measurements: safeJsonParse(e.measurements, {}, 'PerformanceEntry.measurements'),
          metadata: e.metadata ? safeJsonParse(e.metadata, undefined, 'PerformanceEntry.metadata') : undefined
        }))
      },
      read: async (id: string) => {
        const entry = await db.performanceEntries.get(id)
        if (!entry) return null
        return {
          ...entry,
          measurements: safeJsonParse(entry.measurements, {}, 'PerformanceEntry.measurements'),
          metadata: entry.metadata ? safeJsonParse(entry.metadata, undefined, 'PerformanceEntry.metadata') : undefined
        }
      },
      findByStudent: async (studentId: string) => {
        const entries = await db.performanceEntries
          .where('studentId')
          .equals(studentId)
          .toArray()
        return entries.map(e => ({
          ...e,
          measurements: safeJsonParse(e.measurements, {}, 'PerformanceEntry.measurements'),
          metadata: e.metadata ? safeJsonParse(e.metadata, undefined, 'PerformanceEntry.metadata') : undefined
        }))
      },
      findByCategory: async (categoryId: string) => {
        const entries = await db.performanceEntries
          .where('categoryId')
          .equals(categoryId)
          .toArray()
        return entries.map(e => ({
          ...e,
          measurements: safeJsonParse(e.measurements, {}, 'PerformanceEntry.measurements'),
          metadata: e.metadata ? safeJsonParse(e.metadata, undefined, 'PerformanceEntry.metadata') : undefined
        }))
      },
      findByStudentAndCategory: async (studentId: string, categoryId: string) => {
        const entries = await db.performanceEntries
          .where({ studentId, categoryId })
          .toArray()
        return entries.map(e => ({
          ...e,
          measurements: safeJsonParse(e.measurements, {}, 'PerformanceEntry.measurements'),
          metadata: e.metadata ? safeJsonParse(e.metadata, undefined, 'PerformanceEntry.metadata') : undefined
        }))
      },
      create: async (entity: Partial<Sport.PerformanceEntry>) => {
        const id = createUuid()
        const now = new Date()
        const record = {
          id,
          studentId: entity.studentId || '',
          categoryId: entity.categoryId || '',
          measurements: safeJsonStringify(entity.measurements || {}, 'PerformanceEntry.measurements'),
          calculatedGrade: entity.calculatedGrade,
          timestamp: entity.timestamp || now,
          comment: entity.comment,
          metadata: entity.metadata ? safeJsonStringify(entity.metadata, 'PerformanceEntry.metadata') : undefined,
          createdAt: now,
          updatedAt: now
        }
        await db.performanceEntries.add(record)
        const result: Sport.PerformanceEntry = {
          id: record.id,
          studentId: record.studentId,
          categoryId: record.categoryId,
          measurements: entity.measurements || {},
          calculatedGrade: record.calculatedGrade,
          timestamp: record.timestamp,
          comment: record.comment,
          metadata: entity.metadata,
          createdAt: now,
          lastModified: now
        }
        return result
      }
    },
    createGradeCategoryUseCase: {
      execute: async (input: any) => {
        const id = createUuid()
        const now = new Date()
        await db.gradeCategories.add({
          id,
          classGroupId: input.classGroupId,
          name: input.name,
          description: input.description,
          type: input.type,
          weight: input.weight,
          configuration: safeJsonStringify(input.configuration, 'CreateGradeCategory.configuration'),
          createdAt: now,
          updatedAt: now
        })
        return {
          id,
          ...input,
          createdAt: now,
          lastModified: now
        }
      }
    },
    recordGradeUseCase: {
      execute: async (input: any) => {
        const id = createUuid()
        const now = new Date()
        await db.performanceEntries.add({
          id,
          studentId: input.studentId,
          categoryId: input.categoryId,
          measurements: safeJsonStringify(input.measurements, 'RecordGrade.measurements'),
          calculatedGrade: input.calculatedGrade,
          timestamp: now,
          comment: input.comment,
          metadata: input.metadata ? safeJsonStringify(input.metadata, 'RecordGrade.metadata') : undefined
        })
        return {
          id,
          ...input,
          timestamp: now
        }
      }
    }
  })

  return {
    db,
    sportBridge,
    classGroups: db.classGroups,
    students: db.students,
    attendanceRecords: db.attendanceRecords,
    assessments: db.assessments,
    gradeCategories: db.gradeCategories,
    performanceEntries: db.performanceEntries,
    exams: db.exams,
    correctionEntries: db.correctionEntries
  }
}

/**
 * Re-export specialized composables from their dedicated files
 * This provides better code organization and testing isolation
 */
export { useExams } from './useExams'
export { useCorrections } from './useCorrections'
export { useClassGroups, useStudents, useAttendance, useSportModule } from './useSportBridge'
