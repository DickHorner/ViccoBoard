/**
 * Add Status Use Case Tests
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { InMemoryStorageAdapter } from '@viccoboard/storage';
import { StatusCatalogRepository } from '../../src/repositories/status-catalog.repository';
import { AddStatusUseCase } from '../../src/use-cases/add-status.use-case';
describe('AddStatusUseCase', () => {
    let adapter;
    let statusRepo;
    let useCase;
    beforeEach(async () => {
        adapter = new InMemoryStorageAdapter();
        await adapter.initialize();
        statusRepo = new StatusCatalogRepository(adapter);
        useCase = new AddStatusUseCase(statusRepo);
    });
    describe('execute', () => {
        it('should add a new status to a catalog', async () => {
            // Setup: Create a catalog
            const catalog = await statusRepo.getOrCreateForClassGroup('class-1', 'attendance');
            // Execute: Add a new status
            const newStatus = await useCase.execute({
                catalogId: catalog.id,
                name: 'Illness',
                code: 'ILL',
                description: 'Student was ill',
                color: '#6366f1',
                icon: '🤒'
            });
            // Verify: Status was added
            expect(newStatus).toBeDefined();
            expect(newStatus.name).toBe('Illness');
            expect(newStatus.code).toBe('ILL');
            expect(newStatus.description).toBe('Student was ill');
            expect(newStatus.color).toBe('#6366f1');
            expect(newStatus.icon).toBe('🤒');
            expect(newStatus.active).toBe(true);
            expect(newStatus.id).toBeDefined();
            // Verify: Catalog was updated
            const updatedCatalog = await statusRepo.findById(catalog.id);
            expect(updatedCatalog?.statuses.length).toBe(6); // 5 defaults + 1 new
            expect(updatedCatalog?.statuses.some(s => s.name === 'Illness')).toBe(true);
        });
        it('should validate required fields', async () => {
            const catalog = await statusRepo.getOrCreateForClassGroup('class-1', 'attendance');
            // Missing name
            await expect(useCase.execute({
                catalogId: catalog.id,
                name: '',
                code: 'TEST'
            })).rejects.toThrow('Status name is required');
            // Missing code
            await expect(useCase.execute({
                catalogId: catalog.id,
                name: 'Test',
                code: ''
            })).rejects.toThrow('Status code is required');
            // Missing catalogId
            await expect(useCase.execute({
                catalogId: '',
                name: 'Test',
                code: 'T'
            })).rejects.toThrow('Catalog ID is required');
        });
        it('should validate code length', async () => {
            const catalog = await statusRepo.getOrCreateForClassGroup('class-1', 'attendance');
            await expect(useCase.execute({
                catalogId: catalog.id,
                name: 'Test',
                code: 'THISISWAYTOOLONG'
            })).rejects.toThrow('must be 10 characters or less');
        });
        it('should validate name length', async () => {
            const catalog = await statusRepo.getOrCreateForClassGroup('class-1', 'attendance');
            await expect(useCase.execute({
                catalogId: catalog.id,
                name: 'a'.repeat(51),
                code: 'TEST'
            })).rejects.toThrow('must be 50 characters or less');
        });
        it('should prevent duplicate codes', async () => {
            const catalog = await statusRepo.getOrCreateForClassGroup('class-1', 'attendance');
            // Try to add with existing code
            await expect(useCase.execute({
                catalogId: catalog.id,
                name: 'Duplicate',
                code: 'P' // 'P' already exists (Present)
            })).rejects.toThrow('already exists');
        });
        it('should throw error if catalog not found', async () => {
            await expect(useCase.execute({
                catalogId: 'non-existent',
                name: 'Test',
                code: 'T'
            })).rejects.toThrow('not found');
        });
        it('should handle optional fields', async () => {
            const catalog = await statusRepo.getOrCreateForClassGroup('class-1', 'attendance');
            const newStatus = await useCase.execute({
                catalogId: catalog.id,
                name: 'Simple',
                code: 'SIM'
                // no description, color, icon
            });
            expect(newStatus.description).toBeUndefined();
            expect(newStatus.color).toBeUndefined();
            expect(newStatus.icon).toBeUndefined();
        });
        it('should assign unique IDs', async () => {
            const catalog = await statusRepo.getOrCreateForClassGroup('class-1', 'attendance');
            const status1 = await useCase.execute({
                catalogId: catalog.id,
                name: 'Status 1',
                code: 'S1'
            });
            const status2 = await useCase.execute({
                catalogId: catalog.id,
                name: 'Status 2',
                code: 'S2'
            });
            expect(status1.id).not.toBe(status2.id);
        });
    });
});
