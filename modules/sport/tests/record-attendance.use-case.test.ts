/**
 * RecordAttendanceUseCase Tests
 * Covers create-versus-edit behavior and duplicate-lesson prevention.
 */

import { RecordAttendanceUseCase } from '../src/use-cases/record-attendance.use-case';
import { CreateLessonUseCase } from '../src/use-cases/create-lesson.use-case';
import { AttendanceRepository } from '../src/repositories/attendance.repository';
import { LessonRepository } from '../src/repositories/lesson.repository';
import { ClassGroupRepository } from '../src/repositories/class-group.repository';
import { StudentRepository } from '@viccoboard/students';
import { SQLiteStorage, InitialSchemaMigration } from '@viccoboard/storage/node';
import { AttendanceStatus } from '@viccoboard/core';

describe('RecordAttendanceUseCase', () => {
  let storage: SQLiteStorage;
  let attendanceRepo: AttendanceRepository;
  let lessonRepo: LessonRepository;
  let recordAttendanceUseCase: RecordAttendanceUseCase;
  let createLessonUseCase: CreateLessonUseCase;
  let testStudentId: string;
  let testLessonId: string;

  beforeEach(async () => {
    storage = new SQLiteStorage({
      databasePath: ':memory:',
      memory: true
    });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    await storage.migrate();

    attendanceRepo = new AttendanceRepository(storage.getAdapter());
    lessonRepo = new LessonRepository(storage.getAdapter());
    recordAttendanceUseCase = new RecordAttendanceUseCase(attendanceRepo);
    createLessonUseCase = new CreateLessonUseCase(lessonRepo);

    const classGroupRepo = new ClassGroupRepository(storage.getAdapter());
    const studentRepository = new StudentRepository(storage.getAdapter());

    const classGroup = await classGroupRepo.create({
      name: 'Test Class',
      schoolYear: '2024/2025',
      gradingScheme: 'default'
    });

    const student = await studentRepository.create({
      firstName: 'Max',
      lastName: 'Mustermann',
      dateOfBirth: '2012-02-10',
      classGroupId: classGroup.id
    });
    testStudentId = student.id;

    const lesson = await createLessonUseCase.execute({
      classGroupId: classGroup.id,
      date: new Date('2024-09-01'),
      startTime: '08:00',
      durationMinutes: 45
    });
    testLessonId = lesson.id;
  });

  afterEach(async () => {
    await storage.close();
  });

  test('creates a new attendance record for a lesson', async () => {
    const result = await recordAttendanceUseCase.execute({
      studentId: testStudentId,
      lessonId: testLessonId,
      status: AttendanceStatus.Present
    });

    expect(result.id).toBeDefined();
    expect(result.studentId).toBe(testStudentId);
    expect(result.lessonId).toBe(testLessonId);
    expect(result.status).toBe(AttendanceStatus.Present);
  });

  test('updates existing attendance record instead of creating duplicate', async () => {
    // Record attendance once
    const first = await recordAttendanceUseCase.execute({
      studentId: testStudentId,
      lessonId: testLessonId,
      status: AttendanceStatus.Present
    });

    // Record again with different status (edit case)
    const second = await recordAttendanceUseCase.execute({
      studentId: testStudentId,
      lessonId: testLessonId,
      status: AttendanceStatus.Absent,
      reason: 'Illness'
    });

    // Same record ID — no duplicate created
    expect(second.id).toBe(first.id);
    expect(second.status).toBe(AttendanceStatus.Absent);
    expect(second.reason).toBe('Illness');

    // Only one record in DB
    const allRecords = await attendanceRepo.findByLesson(testLessonId);
    expect(allRecords).toHaveLength(1);
  });

  test('batch recording does not produce duplicates on second save', async () => {
    const input = [
      { studentId: testStudentId, lessonId: testLessonId, status: AttendanceStatus.Present }
    ];

    await recordAttendanceUseCase.executeBatch(input);
    await recordAttendanceUseCase.executeBatch([
      { studentId: testStudentId, lessonId: testLessonId, status: AttendanceStatus.Excused, reason: 'Trip' }
    ]);

    const allRecords = await attendanceRepo.findByLesson(testLessonId);
    expect(allRecords).toHaveLength(1);
    expect(allRecords[0].status).toBe(AttendanceStatus.Excused);
    expect(allRecords[0].reason).toBe('Trip');
  });

  test('throws error when student ID is missing', async () => {
    await expect(
      recordAttendanceUseCase.execute({
        studentId: '',
        lessonId: testLessonId,
        status: AttendanceStatus.Present
      })
    ).rejects.toThrow('Student ID is required');
  });

  test('throws error when lesson ID is missing', async () => {
    await expect(
      recordAttendanceUseCase.execute({
        studentId: testStudentId,
        lessonId: '',
        status: AttendanceStatus.Present
      })
    ).rejects.toThrow('Lesson ID is required');
  });

  test('loads existing attendance records for a known lesson', async () => {
    await recordAttendanceUseCase.execute({
      studentId: testStudentId,
      lessonId: testLessonId,
      status: AttendanceStatus.Late,
      reason: 'Bus delay'
    });

    const records = await attendanceRepo.findByLesson(testLessonId);
    expect(records).toHaveLength(1);
    expect(records[0].status).toBe(AttendanceStatus.Late);
    expect(records[0].reason).toBe('Bus delay');
  });
});
