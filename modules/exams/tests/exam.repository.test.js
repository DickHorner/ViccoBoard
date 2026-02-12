import { SQLiteStorage, InitialSchemaMigration, GradingSchemaMigration, ExamSchemaMigration } from '@viccoboard/storage/node';
import { ExamRepository } from '../src/repositories/exam.repository';
import { Exams } from '@viccoboard/core';
import { v4 as uuidv4 } from 'uuid';
describe('ExamRepository', () => {
    let storage;
    let repository;
    const gradingKey = {
        id: 'grading-1',
        name: 'Default',
        type: Exams.GradingKeyType.Percentage,
        totalPoints: 100,
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
        totalPoints: 100
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
        repository = new ExamRepository(storage.getAdapter());
    });
    afterEach(async () => {
        await storage.close();
    });
    test('creates and reads an exam', async () => {
        const classId = uuidv4();
        const now = new Date().toISOString();
        await storage.getAdapter().insert('class_groups', {
            id: classId,
            name: 'Class 10A',
            school_year: '2025/2026',
            grading_scheme: 'default',
            created_at: now,
            last_modified: now
        });
        const created = await repository.create({
            title: 'Midterm',
            description: 'Algebra',
            classGroupId: classId,
            mode: Exams.ExamMode.Simple,
            structure,
            gradingKey,
            printPresets: [],
            candidates: [],
            status: 'draft'
        });
        const found = await repository.findById(created.id);
        expect(found).not.toBeNull();
        expect(found?.title).toBe('Midterm');
    });
    test('filters by class group and status', async () => {
        const classId = uuidv4();
        const now = new Date().toISOString();
        await storage.getAdapter().insert('class_groups', {
            id: classId,
            name: 'Class 10B',
            school_year: '2025/2026',
            grading_scheme: 'default',
            created_at: now,
            last_modified: now
        });
        await repository.create({
            title: 'Quiz',
            mode: Exams.ExamMode.Simple,
            structure,
            gradingKey,
            printPresets: [],
            candidates: [],
            status: 'draft',
            classGroupId: classId
        });
        await repository.create({
            title: 'Final',
            mode: Exams.ExamMode.Simple,
            structure,
            gradingKey,
            printPresets: [],
            candidates: [],
            status: 'completed'
        });
        const byClass = await repository.findByClassGroup(classId);
        expect(byClass).toHaveLength(1);
        const byStatus = await repository.findByStatus('completed');
        expect(byStatus).toHaveLength(1);
        expect(byStatus[0].title).toBe('Final');
    });
});
