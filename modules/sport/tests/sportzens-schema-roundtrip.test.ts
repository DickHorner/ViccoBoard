/**
 * SportZens schema roundtrip tests
 */

import { SportZens } from '@viccoboard/core';
import {
  SQLiteStorage,
  InitialSchemaMigration,
  GradingSchemaMigration,
  SportZensSchemaMigration
} from '@viccoboard/storage/node';
import {
  SportZensClassRepository,
  SportZensCategoryRepository,
  SportZensGradeRepository,
  SportZensTableRepository,
  SportZensGradeWeightingRepository,
  SportZensNewDayDataRepository,
  SportZensUserDataRepository
} from '../src/index.js';
import { SportZensStudentRepository } from '@viccoboard/students';

describe('SportZens schema roundtrip', () => {
  let storage: SQLiteStorage;
  let classRepository: SportZensClassRepository;
  let studentRepository: SportZensStudentRepository;
  let categoryRepository: SportZensCategoryRepository;
  let gradeRepository: SportZensGradeRepository;
  let tableRepository: SportZensTableRepository;
  let gradeWeightingRepository: SportZensGradeWeightingRepository;
  let newDayDataRepository: SportZensNewDayDataRepository;
  let userDataRepository: SportZensUserDataRepository;

  beforeEach(async () => {
    storage = new SQLiteStorage({
      databasePath: ':memory:',
      memory: true
    });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    storage.registerMigration(new GradingSchemaMigration(storage));
    storage.registerMigration(new SportZensSchemaMigration(storage));
    await storage.migrate();

    const adapter = storage.getAdapter();
    classRepository = new SportZensClassRepository(adapter);
    studentRepository = new SportZensStudentRepository(adapter);
    categoryRepository = new SportZensCategoryRepository(adapter);
    gradeRepository = new SportZensGradeRepository(adapter);
    tableRepository = new SportZensTableRepository(adapter);
    gradeWeightingRepository = new SportZensGradeWeightingRepository(adapter);
    newDayDataRepository = new SportZensNewDayDataRepository(adapter);
    userDataRepository = new SportZensUserDataRepository(adapter);
  });

  afterEach(async () => {
    await storage.close();
  });

  test('class schema roundtrip', async () => {
    const original: SportZens.SportZensClass = {
      id: 'cls1',
      name: 'Class 5A',
      school_year: '2023/2024',
      teacher_id: 't1',
      color: '#FF5733',
      created_at: '2024-01-10T12:00:00.000Z',
      updated_at: '2024-01-11T12:00:00.000Z',
      grade_category_count: 2,
      grade_scheme: 'viertel16',
      is_dirty: 0,
      settings: { foo: 'bar' },
      sort: 'A',
      stats: { count: 42 },
      student_count: 20,
      version: 1
    };

    await classRepository.save(original);
    const loaded = await classRepository.findById(original.id);

    expect(loaded).toEqual(original);
  });

  test('student schema roundtrip', async () => {
    await classRepository.save({
      id: 'cls2',
      name: 'Class 6B',
      school_year: '2023/2024',
      teacher_id: 't1'
    });

    const original: SportZens.SportZensStudent = {
      id: 'stu1',
      class_id: 'cls2',
      first_name: 'Lena',
      last_name: 'Schmidt',
      teacher_id: 't1',
      gender: 'female',
      is_dirty: 1,
      public_code: 'ABC123',
      settings: { needsHelp: true },
      stats: { absences: 1 },
      version: 2
    };

    await studentRepository.save(original);
    const loaded = await studentRepository.findById(original.id);

    expect(loaded).toEqual(original);
  });

  test('category schema roundtrip', async () => {
    await classRepository.save({
      id: 'cls3',
      name: 'Class 7C',
      school_year: '2023/2024',
      teacher_id: 't1'
    });

    const original: SportZens.SportZensCategory = {
      id: 'cat1',
      class_id: 'cls3',
      name: 'Cooper Test',
      teacher_id: 't1',
      type: 'cooper',
      weight: 30,
      year: 2024,
      categories: { a: 1 },
      color: '#112233',
      created_at: '2024-01-12T12:00:00.000Z',
      deleted: 0,
      is_dirty: 0,
      main_category_id: 'main1',
      max_value: 10,
      min_value: 1,
      settings: { auto: true },
      stats: { avg: 5 },
      updated_at: '2024-01-13T12:00:00.000Z'
    };

    await categoryRepository.save(original);
    const loaded = await categoryRepository.findById(original.id);

    expect(loaded).toEqual(original);
  });

  test('grade schema roundtrip', async () => {
    const original: SportZens.SportZensGrade = {
      id: 'gr1',
      category_id: 'cat1',
      class_id: 'cls3',
      student_id: 'stu1',
      teacher_id: 't1',
      type: 'cooper',
      year: 2024,
      created_at: '2024-02-01T08:00:00.000Z',
      criterias: { distance: 2500 },
      deleted: 0,
      grade: '2',
      is_dirty: 0,
      main_category_id: 'main1',
      name: 'Cooper Test',
      total_points: 14,
      updated_at: '2024-02-02T08:00:00.000Z',
      weight: 1.5
    };

    await gradeRepository.save(original);
    const loaded = await gradeRepository.findById(original.id);

    expect(loaded).toEqual(original);
  });

  test('table schema roundtrip', async () => {
    const original: SportZens.SportZensTable = {
      id: 'tbl1',
      name: 'Standard Table',
      grade_scheme: 'viertel16',
      teacher_id: 't1',
      color: '#445566',
      created_at: '2024-02-03T08:00:00.000Z',
      grade_scheme_direction: 'asc',
      is_dirty: 0,
      school: 'Gymnasium',
      updated_at: '2024-02-04T08:00:00.000Z',
      version: 3,
      visibility: 'public'
    };

    await tableRepository.save(original);
    const loaded = await tableRepository.findById(original.id);

    expect(loaded).toEqual(original);
  });

  test('gradeWeighting schema roundtrip', async () => {
    const original: SportZens.SportZensGradeWeighting = {
      attendance: 20,
      grades: 60,
      remarks: 15,
      wow: 5
    };

    await gradeWeightingRepository.set(original);
    const loaded = await gradeWeightingRepository.get();

    expect(loaded).toEqual(original);
  });

  test('newDayData schema roundtrip', async () => {
    const original: SportZens.SportZensNewDayData = {
      date: '2024-02-05',
      additionalExercises: ['Jumping Jacks'],
      exercises: ['Sprints', 'Pushups'],
      notes: 'Warm-up only'
    };

    await newDayDataRepository.save(original);
    const loaded = await newDayDataRepository.findByDate(original.date);

    expect(loaded).toEqual(original);
  });

  test('userData schema roundtrip', async () => {
    const original: SportZens.SportZensUserData = {
      id: 'user1',
      email: 'teacher@example.com',
      role: 'teacher',
      addons: ['pro'],
      first_name: 'Anna',
      invoices: ['inv-1'],
      last_name: 'Meyer',
      settings: { theme: 'light' }
    };

    await userDataRepository.save(original);
    const loaded = await userDataRepository.findById(original.id);

    expect(loaded).toEqual(original);
  });
});
