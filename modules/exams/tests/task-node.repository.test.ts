import {
  SQLiteStorage,
  InitialSchemaMigration,
  GradingSchemaMigration,
  ExamSchemaMigration
} from '@viccoboard/storage/node';
import { TaskNodeRepository } from '../src/repositories/task-node.repository';
import { ExamRepository } from '../src/repositories/exam.repository';
import { Exams } from '@viccoboard/core';

describe('TaskNodeRepository', () => {
  let storage: SQLiteStorage;
  let repository: TaskNodeRepository;
  let examRepository: ExamRepository;

  const gradingKey: Exams.GradingKey = {
    id: 'grading-1',
    name: 'Default',
    type: Exams.GradingKeyType.Points,
    totalPoints: 10,
    gradeBoundaries: [],
    roundingRule: { type: 'none', decimalPlaces: 0 },
    errorPointsToGrade: false,
    customizable: true,
    modifiedAfterCorrection: false
  };

  const structure: Exams.ExamStructure = {
    parts: [],
    tasks: [],
    allowsComments: false,
    allowsSupportTips: false,
    totalPoints: 10
  };

  beforeEach(async () => {
    storage = new SQLiteStorage({
      databasePath: ':memory:',
      memory: true
    });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    storage.registerMigration(new GradingSchemaMigration(storage));
    storage.registerMigration(new ExamSchemaMigration(storage));
    await storage.migrate();

    repository = new TaskNodeRepository(storage.getAdapter());
    examRepository = new ExamRepository(storage.getAdapter());
  });

  afterEach(async () => {
    await storage.close();
  });

  test('creates and queries task nodes', async () => {
    const exam = await examRepository.create({
      title: 'Quiz',
      mode: Exams.ExamMode.Simple,
      structure,
      gradingKey,
      printPresets: [],
      candidates: [],
      status: 'draft'
    });

    const parent = await repository.createForExam(exam.id, {
      parentId: undefined,
      level: 1,
      order: 1,
      title: 'Task 1',
      description: 'Top-level',
      points: 5,
      isChoice: false,
      allowComments: true,
      allowSupportTips: false,
      commentBoxEnabled: true,
      criteria: [],
      subtasks: []
    });

    await repository.createForExam(exam.id, {
      parentId: parent.id,
      level: 2,
      order: 1,
      title: 'Task 1.1',
      description: 'Subtask',
      points: 5,
      isChoice: false,
      allowComments: false,
      allowSupportTips: false,
      commentBoxEnabled: false,
      criteria: [],
      subtasks: []
    });

    const all = await repository.findByExam(exam.id);
    expect(all).toHaveLength(2);

    const children = await repository.findByParent(parent.id);
    expect(children).toHaveLength(1);
    expect(children[0].title).toBe('Task 1.1');
  });
});
