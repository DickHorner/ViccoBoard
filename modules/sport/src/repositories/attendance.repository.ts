/**
 * Attendance Repository
 * Handles persistence of attendance records
 */

import { BaseRepository } from '@viccoboard/storage';
import { AttendanceRecord } from '@viccoboard/core';
import type { SQLiteStorage } from '@viccoboard/storage';

export class AttendanceRepository extends BaseRepository<AttendanceRecord> {
  constructor(storage: SQLiteStorage) {
    super(storage, 'attendance_records');
  }

  /**
   * Map database row to AttendanceRecord entity
   */
  mapToEntity(row: any): AttendanceRecord {
    return {
      id: row.id,
      studentId: row.student_id,
      lessonId: row.lesson_id,
      status: row.status,
      reason: row.reason || undefined,
      notes: row.notes || undefined,
      timestamp: new Date(row.timestamp),
      createdAt: new Date(row.created_at),
      lastModified: new Date(row.last_modified)
    };
  }

  /**
   * Map AttendanceRecord entity to database row
   */
  mapToRow(entity: Partial<AttendanceRecord>): any {
    const row: any = {};
    
    if (entity.id) row.id = entity.id;
    if (entity.studentId) row.student_id = entity.studentId;
    if (entity.lessonId) row.lesson_id = entity.lessonId;
    if (entity.status) row.status = entity.status;
    if (entity.reason) row.reason = entity.reason;
    if (entity.notes) row.notes = entity.notes;
    if (entity.timestamp) row.timestamp = entity.timestamp.toISOString();
    if (entity.createdAt) row.created_at = entity.createdAt.toISOString();
    if (entity.lastModified) row.last_modified = entity.lastModified.toISOString();
    
    return row;
  }

  /**
   * Find all attendance records for a lesson
   */
  async findByLesson(lessonId: string): Promise<AttendanceRecord[]> {
    return this.find({ lesson_id: lessonId });
  }

  /**
   * Find all attendance records for a student
   */
  async findByStudent(studentId: string): Promise<AttendanceRecord[]> {
    return this.find({ student_id: studentId });
  }

  /**
   * Calculate attendance percentage for a student
   */
  async getAttendancePercentage(studentId: string): Promise<number> {
    const records = await this.findByStudent(studentId);
    
    if (records.length === 0) return 100;
    
    const presentCount = records.filter(r => r.status === 'present').length;
    return (presentCount / records.length) * 100;
  }

  /**
   * Get attendance summary for a student
   */
  async getAttendanceSummary(studentId: string): Promise<{
    total: number;
    present: number;
    absent: number;
    excused: number;
    passive: number;
    percentage: number;
  }> {
    const records = await this.findByStudent(studentId);
    
    const summary = {
      total: records.length,
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      excused: records.filter(r => r.status === 'excused').length,
      passive: records.filter(r => r.status === 'passive').length,
      percentage: 0
    };
    
    summary.percentage = summary.total > 0 
      ? (summary.present / summary.total) * 100 
      : 100;
    
    return summary;
  }
}
