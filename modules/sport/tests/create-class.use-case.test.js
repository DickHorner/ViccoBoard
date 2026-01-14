"use strict";
/**
 * CreateClassUseCase Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const create_class_use_case_1 = require("../src/use-cases/create-class.use-case");
const class_group_repository_1 = require("../src/repositories/class-group.repository");
const storage_1 = require("@viccoboard/storage");
describe('CreateClassUseCase', () => {
    let storage;
    let repository;
    let useCase;
    beforeEach(async () => {
        // Use in-memory database for tests
        storage = new storage_1.SQLiteStorage({
            databasePath: ':memory:',
            memory: true
        });
        await storage.initialize('test-password');
        storage.registerMigration(new storage_1.InitialSchemaMigration(storage));
        await storage.migrate();
        repository = new class_group_repository_1.ClassGroupRepository(storage.getAdapter());
        useCase = new create_class_use_case_1.CreateClassUseCase(repository);
    });
    afterEach(async () => {
        await storage.close();
    });
    test('creates a class successfully', async () => {
        const input = {
            name: 'Test Class',
            schoolYear: '2023/2024',
            state: 'Bayern'
        };
        const result = await useCase.execute(input);
        expect(result.id).toBeDefined();
        expect(result.name).toBe('Test Class');
        expect(result.schoolYear).toBe('2023/2024');
        expect(result.state).toBe('Bayern');
        expect(result.gradingScheme).toBe('default');
    });
    test('throws error for missing name', async () => {
        const input = {
            name: '',
            schoolYear: '2023/2024'
        };
        await expect(useCase.execute(input)).rejects.toThrow('Class name is required');
    });
    test('throws error for missing school year', async () => {
        const input = {
            name: 'Test Class',
            schoolYear: ''
        };
        await expect(useCase.execute(input)).rejects.toThrow('School year is required');
    });
    test('throws error for invalid school year format', async () => {
        const input = {
            name: 'Test Class',
            schoolYear: '2023-2024'
        };
        await expect(useCase.execute(input)).rejects.toThrow('School year must be in format YYYY/YYYY');
    });
    test('throws error for duplicate class name in same school year', async () => {
        const input = {
            name: 'Test Class',
            schoolYear: '2023/2024'
        };
        await useCase.execute(input);
        await expect(useCase.execute(input)).rejects.toThrow('Class "Test Class" already exists for 2023/2024');
    });
    test('allows same class name in different school years', async () => {
        const input1 = {
            name: 'Test Class',
            schoolYear: '2023/2024'
        };
        const input2 = {
            name: 'Test Class',
            schoolYear: '2024/2025'
        };
        const result1 = await useCase.execute(input1);
        const result2 = await useCase.execute(input2);
        expect(result1.id).not.toBe(result2.id);
        expect(result1.schoolYear).toBe('2023/2024');
        expect(result2.schoolYear).toBe('2024/2025');
    });
});
