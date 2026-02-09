/**
 * Status Catalog Repository Tests
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { InMemoryStorageAdapter } from '@viccoboard/storage';
import { StatusCatalogRepository } from '../../src/repositories/status-catalog.repository';
import { DEFAULT_ATTENDANCE_STATUSES } from '@viccoboard/core';
describe('StatusCatalogRepository', () => {
    let adapter;
    let repo;
    beforeEach(async () => {
        adapter = new InMemoryStorageAdapter();
        await adapter.initialize();
        repo = new StatusCatalogRepository(adapter);
    });
    describe('getOrCreateForClassGroup', () => {
        it('should create a catalog with default statuses if not exists', async () => {
            const catalog = await repo.getOrCreateForClassGroup('class-1', 'attendance');
            expect(catalog).toBeDefined();
            expect(catalog.classGroupId).toBe('class-1');
            expect(catalog.context).toBe('attendance');
            expect(catalog.statuses.length).toBe(DEFAULT_ATTENDANCE_STATUSES.length);
            expect(catalog.statuses[0].name).toBe('Present');
        });
        it('should return existing catalog if already created', async () => {
            const first = await repo.getOrCreateForClassGroup('class-1', 'attendance');
            const second = await repo.getOrCreateForClassGroup('class-1', 'attendance');
            expect(first.id).toBe(second.id);
        });
        it('should create separate catalogs for different contexts', async () => {
            const attendance = await repo.getOrCreateForClassGroup('class-1', 'attendance');
            const participation = await repo.getOrCreateForClassGroup('class-1', 'participation');
            expect(attendance.context).toBe('attendance');
            expect(participation.context).toBe('participation');
            expect(attendance.id).not.toBe(participation.id);
        });
    });
    describe('addStatus', () => {
        it('should add a new status to a catalog', async () => {
            const catalog = await repo.getOrCreateForClassGroup('class-1', 'attendance');
            const updated = await repo.addStatus(catalog.id, {
                name: 'Illness',
                code: 'ILL',
                description: 'Student was ill',
                color: '#6366f1',
                active: true,
                order: 5
            });
            expect(updated.statuses.length).toBe(DEFAULT_ATTENDANCE_STATUSES.length + 1);
            expect(updated.statuses[updated.statuses.length - 1].name).toBe('Illness');
            expect(updated.statuses[updated.statuses.length - 1].code).toBe('ILL');
        });
        it('should throw error if catalog not found', async () => {
            await expect(repo.addStatus('non-existent', {
                name: 'Test',
                code: 'T',
                active: true,
                order: 0
            })).rejects.toThrow('not found');
        });
    });
    describe('updateStatus', () => {
        it('should update a status option', async () => {
            const catalog = await repo.getOrCreateForClassGroup('class-1', 'attendance');
            const statusId = catalog.statuses[0].id;
            const updated = await repo.updateStatus(catalog.id, statusId, {
                name: 'Present (Updated)',
                color: '#ff0000'
            });
            const updatedStatus = updated.statuses.find(s => s.id === statusId);
            expect(updatedStatus?.name).toBe('Present (Updated)');
            expect(updatedStatus?.color).toBe('#ff0000');
            expect(updatedStatus?.code).toBe('P'); // Code unchanged
        });
        it('should throw error if status not found', async () => {
            const catalog = await repo.getOrCreateForClassGroup('class-1', 'attendance');
            await expect(repo.updateStatus(catalog.id, 'non-existent', { name: 'Test' })).rejects.toThrow('not found');
        });
    });
    describe('deleteStatus', () => {
        it('should soft delete a status (mark as inactive)', async () => {
            const catalog = await repo.getOrCreateForClassGroup('class-1', 'attendance');
            const statusId = catalog.statuses[0].id;
            const updated = await repo.deleteStatus(catalog.id, statusId);
            const deletedStatus = updated.statuses.find(s => s.id === statusId);
            expect(deletedStatus?.active).toBe(false);
            expect(updated.statuses.length).toBe(DEFAULT_ATTENDANCE_STATUSES.length); // Still there
        });
    });
    describe('hardDeleteStatus', () => {
        it('should permanently remove a status', async () => {
            const catalog = await repo.getOrCreateForClassGroup('class-1', 'attendance');
            const statusId = catalog.statuses[0].id;
            const originalLength = catalog.statuses.length;
            const updated = await repo.hardDeleteStatus(catalog.id, statusId);
            expect(updated.statuses.length).toBe(originalLength - 1);
            expect(updated.statuses.find(s => s.id === statusId)).toBeUndefined();
        });
    });
    describe('reorderStatus', () => {
        it('should move a status to a new position', async () => {
            const catalog = await repo.getOrCreateForClassGroup('class-1', 'attendance');
            const statusId = catalog.statuses[0].id;
            const updated = await repo.reorderStatus(catalog.id, statusId, 2);
            // Check that status is at position 2
            expect(updated.statuses[2].id).toBe(statusId);
            expect(updated.statuses[2].order).toBe(2);
        });
        it('should clamp order to valid range', async () => {
            const catalog = await repo.getOrCreateForClassGroup('class-1', 'attendance');
            const statusId = catalog.statuses[0].id;
            const updated = await repo.reorderStatus(catalog.id, statusId, 999);
            // Should be at the end
            expect(updated.statuses[updated.statuses.length - 1].id).toBe(statusId);
        });
    });
    describe('getActiveStatuses', () => {
        it('should return only active statuses sorted by order', async () => {
            const catalog = await repo.getOrCreateForClassGroup('class-1', 'attendance');
            // Mark second status as inactive
            await repo.deleteStatus(catalog.id, catalog.statuses[1].id);
            const activeStatuses = await repo.getActiveStatuses(catalog.id);
            expect(activeStatuses.every(s => s.active)).toBe(true);
            expect(activeStatuses.length).toBe(DEFAULT_ATTENDANCE_STATUSES.length - 1);
            // Check ordered
            for (let i = 0; i < activeStatuses.length - 1; i++) {
                expect(activeStatuses[i].order).toBeLessThanOrEqual(activeStatuses[i + 1].order);
            }
        });
    });
    describe('getAllStatuses', () => {
        it('should return all statuses including inactive', async () => {
            const catalog = await repo.getOrCreateForClassGroup('class-1', 'attendance');
            // Mark second status as inactive
            await repo.deleteStatus(catalog.id, catalog.statuses[1].id);
            const allStatuses = await repo.getAllStatuses(catalog.id);
            expect(allStatuses.length).toBe(DEFAULT_ATTENDANCE_STATUSES.length);
            expect(allStatuses.some(s => !s.active)).toBe(true);
        });
    });
    describe('findByClassGroupAndContext', () => {
        it('should find catalog by class group and context', async () => {
            const created = await repo.getOrCreateForClassGroup('class-1', 'attendance');
            const found = await repo.findByClassGroupAndContext('class-1', 'attendance');
            expect(found).toBeDefined();
            expect(found?.id).toBe(created.id);
        });
        it('should return null if not found', async () => {
            const found = await repo.findByClassGroupAndContext('non-existent', 'attendance');
            expect(found).toBeNull();
        });
    });
    describe('Persistence', () => {
        it('should persist changes to storage', async () => {
            const catalog = await repo.getOrCreateForClassGroup('class-1', 'attendance');
            const catId = catalog.id;
            // Add a status
            await repo.addStatus(catId, {
                name: 'Test Status',
                code: 'TEST',
                active: true,
                order: 5
            });
            // Retrieve again
            const retrieved = await repo.findById(catId);
            expect(retrieved).toBeDefined();
            expect(retrieved?.statuses.some(s => s.name === 'Test Status')).toBe(true);
        });
    });
});
