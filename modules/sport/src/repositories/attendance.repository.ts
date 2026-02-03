/**
 * Attendance Repository
 * Handles persistence of attendance records
 */

import { AdapterRepository } from '@viccoboard/storage';
import { AttendanceRecord, AttendanceStatus } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

export class AttendanceRepository extends AdapterRepository<AttendanceRecord> {
  constructor(adapter: StorageAdapter) {
    super(adapter, 'attendance_records');
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
      lastModified: new Date(row.last_modified),
      exported: row.exported ? true : false
    };
  }

  /**
   * Map AttendanceRecord entity to database row
   */
  mapToRow(entity: Partial<AttendanceRecord>): any {
    const row: any = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.studentId !== undefined) row.student_id = entity.studentId;
    if (entity.lessonId !== undefined) row.lesson_id = entity.lessonId;
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.reason !== undefined) row.reason = entity.reason;
    if (entity.notes !== undefined) row.notes = entity.notes;
    if (entity.timestamp !== undefined) row.timestamp = entity.timestamp.toISOString();
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt.toISOString();
    if (entity.lastModified !== undefined) row.last_modified = entity.lastModified.toISOString();
    if (entity.exported !== undefined) row.exported = entity.exported ? 1 : 0;

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

    const presentCount = records.filter(r => r.status === AttendanceStatus.Present).length;
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
