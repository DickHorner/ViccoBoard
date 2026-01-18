/**
 * Performance Entry Repository
 * Handles persistence of grade/performance entries
 */

import { AdapterRepository } from '@viccoboard/storage';
import { PerformanceEntry } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

export class PerformanceEntryRepository extends AdapterRepository<PerformanceEntry> {
  constructor(adapter: StorageAdapter) {
    super(adapter, 'performance_entries');
  }

  /**
   * Map database row to PerformanceEntry entity
   */
  mapToEntity(row: any): PerformanceEntry {
    return {
      id: row.id,
      studentId: row.student_id,
      categoryId: row.category_id,
      measurements: JSON.parse(row.measurements || '{}'),
      calculatedGrade: row.calculated_grade || undefined,
      timestamp: new Date(row.timestamp),
      deviceInfo: row.device_info || undefined,
      comment: row.comment || undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    };
  }

  /**
   * Map PerformanceEntry entity to database row
   */
  mapToRow(entity: Partial<PerformanceEntry>): any {
    const row: any = {};
    
    if (entity.id) row.id = entity.id;
    if (entity.studentId) row.student_id = entity.studentId;
    if (entity.categoryId) row.category_id = entity.categoryId;
    if (entity.measurements) row.measurements = JSON.stringify(entity.measurements);
    if (entity.calculatedGrade !== undefined) row.calculated_grade = entity.calculatedGrade;
    if (entity.timestamp) row.timestamp = entity.timestamp.toISOString();
    if (entity.deviceInfo) row.device_info = entity.deviceInfo;
    if (entity.comment) row.comment = entity.comment;
    if (entity.metadata) row.metadata = JSON.stringify(entity.metadata);
    
    return row;
  }

  /**
   * Find all performance entries for a student
   */
  async findByStudent(studentId: string): Promise<PerformanceEntry[]> {
    return this.find({ student_id: studentId });
  }

  /**
   * Find all performance entries for a grade category
   */
  async findByCategory(categoryId: string): Promise<PerformanceEntry[]> {
    return this.find({ category_id: categoryId });
  }

  /**
   * Find performance entries for a student in a specific category
   */
  async findByStudentAndCategory(studentId: string, categoryId: string): Promise<PerformanceEntry[]> {
    const entries = await this.findByStudent(studentId);
    return entries.filter(entry => entry.categoryId === categoryId);
  }

  /**
   * Get latest performance entry for a student in a category
   */
  async findLatestByStudentAndCategory(studentId: string, categoryId: string): Promise<PerformanceEntry | null> {
    const entries = await this.findByStudentAndCategory(studentId, categoryId);
    if (entries.length === 0) return null;
    
    return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
  }

  /**
   * Get grade history for a student
   */
  async getGradeHistory(studentId: string): Promise<PerformanceEntry[]> {
    const entries = await this.findByStudent(studentId);
    return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}
