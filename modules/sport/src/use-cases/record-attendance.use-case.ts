/**
 * Record Attendance Use Case
 * Business logic for recording student attendance in a lesson
 */

import { AttendanceRecord, AttendanceStatus } from '@viccoboard/core';
import { AttendanceRepository } from '../repositories/attendance.repository';
import { StudentRepository } from '../repositories/student.repository';

export interface RecordAttendanceInput {
  studentId: string;
  lessonId: string;
  status: AttendanceStatus;
  reason?: string;
  notes?: string;
}

export class RecordAttendanceUseCase {
  constructor(
    private attendanceRepo: AttendanceRepository,
    private studentRepo: StudentRepository
  ) {}

  async execute(input: RecordAttendanceInput): Promise<AttendanceRecord> {
    // Validation
    await this.validate(input);

    // Check if attendance already recorded for this lesson
    const existingRecords = await this.attendanceRepo.findByLesson(input.lessonId);
    const existingRecord = existingRecords.find(r => r.studentId === input.studentId);

    if (existingRecord) {
      // Update existing record
      return await this.attendanceRepo.update(existingRecord.id, {
        status: input.status,
        reason: input.reason,
        notes: input.notes
      });
    }

    // Create new attendance record
    const record = await this.attendanceRepo.create({
      studentId: input.studentId,
      lessonId: input.lessonId,
      status: input.status,
      reason: input.reason,
      notes: input.notes,
      timestamp: new Date()
    });

    return record;
  }

  /**
   * Record attendance for multiple students at once
   */
  async executeBatch(inputs: RecordAttendanceInput[]): Promise<AttendanceRecord[]> {
    const results: AttendanceRecord[] = [];

    for (const input of inputs) {
      const record = await this.execute(input);
      results.push(record);
    }

    return results;
  }

  private async validate(input: RecordAttendanceInput): Promise<void> {
    if (!input.studentId || input.studentId.trim().length === 0) {
      throw new Error('Student ID is required');
    }

    if (!input.lessonId || input.lessonId.trim().length === 0) {
      throw new Error('Lesson ID is required');
    }

    if (!input.status) {
      throw new Error('Attendance status is required');
    }

    const validStatuses: AttendanceStatus[] = [
      AttendanceStatus.Present,
      AttendanceStatus.Absent,
      AttendanceStatus.Excused,
      AttendanceStatus.Passive,
      AttendanceStatus.Late
    ];
    if (!validStatuses.includes(input.status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Verify student exists
    const student = await this.studentRepo.findById(input.studentId);
    if (!student) {
      throw new Error(`Student with ID "${input.studentId}" not found`);
    }

    // Note: We're not validating lesson exists yet since we haven't implemented LessonRepository
    // In a full implementation, you'd verify the lesson exists
  }
}
