import { SQLiteStorage, InitialSchemaMigration, GradingSchemaMigration, ExamSchemaMigration } from '@viccoboard/storage';
import { CriterionRepository } from '../src/repositories/criterion.repository';
import { ExamRepository } from '../src/repositories/exam.repository';
import { TaskNodeRepository } from '../src/repositories/task-node.repository';
import { Exams } from '@viccoboard/core';
describe('CriterionRepository', () => {
    let storage;
    let repository;
    let examRepository;
    let taskRepository;
    const gradingKey = {
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
    const structure = {
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
        repository = new CriterionRepository(storage.getAdapter());
        examRepository = new ExamRepository(storage.getAdapter());
        taskRepository = new TaskNodeRepository(storage.getAdapter());
    });
    afterEach(async () => {
        await storage.close();
    });
    test('creates and queries criteria', async () => {
        const exam = await examRepository.create({
            title: 'Quiz',
            mode: Exams.ExamMode.Simple,
            structure,
            gradingKey,
            printPresets: [],
            candidates: [],
            status: 'draft'
        });
        const task = await taskRepository.createForExam(exam.id, {
            parentId: undefined,
            level: 1,
            order: 1,
            title: 'Task 1',
            points: 10,
            isChoice: false,
            allowComments: false,
            allowSupportTips: false,
            commentBoxEnabled: false,
            criteria: [],
            subtasks: []
        });
        const created = await repository.createForTask(exam.id, task.id, {
            text: 'Show your work',
            formatting: { bold: true },
            points: 5,
            aspectBased: false
        });
        expect(created.text).toBe('Show your work');
        const byTask = await repository.findByTask(task.id);
        expect(byTask).toHaveLength(1);
        const byExam = await repository.findByExam(exam.id);
        expect(byExam).toHaveLength(1);
    });
});
