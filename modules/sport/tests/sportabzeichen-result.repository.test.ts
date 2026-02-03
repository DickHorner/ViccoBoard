import {
  SQLiteStorage,
  InitialSchemaMigration,
  GradingSchemaMigration,
  SportabzeichenSchemaMigration
} from '@viccoboard/storage';
import { SportabzeichenResultRepository } from '../src/repositories/sportabzeichen-result.repository';
import { ClassGroupRepository } from '../src/repositories/class-group.repository';
import { StudentRepository } from '../src/repositories/student.repository';

describe('SportabzeichenResultRepository', () => {
  let storage: SQLiteStorage;
  let resultRepository: SportabzeichenResultRepository;
  let classRepository: ClassGroupRepository;
  let studentRepository: StudentRepository;

  beforeEach(async () => {
    storage = new SQLiteStorage({
      databasePath: ':memory:',
      memory: true
    });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    storage.registerMigration(new GradingSchemaMigration(storage));
    storage.registerMigration(new SportabzeichenSchemaMigration(storage));
    await storage.migrate();

    resultRepository = new SportabzeichenResultRepository(storage.getAdapter());
    classRepository = new ClassGroupRepository(storage.getAdapter());
    studentRepository = new StudentRepository(storage.getAdapter());
  });

  afterEach(async () => {
    await storage.close();
  });

  test('creates and reads a result', async () => {
    const classGroup = await classRepository.create({
      name: 'Class 7A',
      schoolYear: '2025/2026',
      gradingScheme: 'default'
    });

    const student = await studentRepository.create({
      firstName: 'Jamie',
      lastName: 'Doe',
      classGroupId: classGroup.id,
      birthYear: 2012,
      gender: 'diverse'
    });

    const created = await resultRepository.create({
      studentId: student.id,
      disciplineId: 'run',
      testDate: new Date('2026-01-01T00:00:00.000Z'),
      ageAtTest: 13,
      gender: 'diverse',
      performanceValue: 2400,
      unit: 'm',
      achievedLevel: 'silver'
    });

    const found = await resultRepository.findById(created.id);
    expect(found).not.toBeNull();
    expect(found?.studentId).toBe(student.id);
  });

  test('filters by student', async () => {
    const classGroup = await classRepository.create({
      name: 'Class 7B',
      schoolYear: '2025/2026',
      gradingScheme: 'default'
    });

    const student = await studentRepository.create({
      firstName: 'Alex',
      lastName: 'Lee',
      classGroupId: classGroup.id,
      birthYear: 2012,
      gender: 'diverse'
    });

    await resultRepository.create({
      studentId: student.id,
      disciplineId: 'run',
      testDate: new Date('2026-01-01T00:00:00.000Z'),
      ageAtTest: 13,
      gender: 'diverse',
      performanceValue: 2000,
      unit: 'm',
      achievedLevel: 'bronze'
    });

    const results = await resultRepository.findByStudent(student.id);
    expect(results).toHaveLength(1);
  });
});
