/**
 * PerformanceEntry Repository
 * Handles persistence of performance entries (assessment results)
 */

import { AdapterRepository } from '@viccoboard/storage';
import { Sport } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

export class PerformanceEntryRepository extends AdapterRepository<Sport.PerformanceEntry> {
  constructor(adapter: StorageAdapter) {
    super(adapter, 'performance_entries');
  }

  /**
   * Map database row to PerformanceEntry entity
   */
  mapToEntity(row: any): Sport.PerformanceEntry {
    return {
      id: row.id,
      studentId: row.student_id,
      categoryId: row.category_id,
      measurements: JSON.parse(row.measurements),
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
  mapToRow(entity: Partial<Sport.PerformanceEntry>): any {
    const row: any = {};
    
    if (entity.id) row.id = entity.id;
    if (entity.studentId) row.student_id = entity.studentId;
    if (entity.categoryId) row.category_id = entity.categoryId;
    if (entity.measurements) row.measurements = JSON.stringify(entity.measurements);
    if (entity.calculatedGrade !== undefined) row.calculated_grade = entity.calculatedGrade;
    if (entity.timestamp) row.timestamp = entity.timestamp.toISOString();
    if (entity.deviceInfo !== undefined) row.device_info = entity.deviceInfo;
    if (entity.comment !== undefined) row.comment = entity.comment;
    if (entity.metadata) row.metadata = JSON.stringify(entity.metadata);
    
    return row;
  }

  /**
   * Find all performance entries for a specific student
   */
  async findByStudent(studentId: string): Promise<Sport.PerformanceEntry[]> {
    const entries = await this.find({ student_id: studentId });
    
    // Sort by timestamp descending by default
    return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Find all performance entries for a specific category
   */
  async findByCategory(categoryId: string): Promise<Sport.PerformanceEntry[]> {
    return this.find({ category_id: categoryId });
  }

  /**
   * Find performance entries for a student in a specific category
   */
  async findByStudentAndCategory(
    studentId: string, 
    categoryId: string
  ): Promise<Sport.PerformanceEntry[]> {
    const entries = await this.find({ 
      student_id: studentId,
      category_id: categoryId 
    });
    
    // Sort by timestamp descending
    return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get the latest performance entry for a student in a category
   */
  async getLatestEntry(studentId: string, categoryId: string): Promise<Sport.PerformanceEntry | null> {
    const entries = await this.findByStudentAndCategory(studentId, categoryId);
    return entries.length > 0 ? entries[0] : null;
  }

  /**
   * Find entries within a date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<Sport.PerformanceEntry[]> {
    const allEntries = await this.findAll();
    return allEntries.filter(entry => 
      entry.timestamp >= startDate && entry.timestamp <= endDate
    );
  }

  /**
   * Count entries for a student in a category
   */
  async countByStudentAndCategory(studentId: string, categoryId: string): Promise<number> {
    const entries = await this.findByStudentAndCategory(studentId, categoryId);
    return entries.length;
  }
}
