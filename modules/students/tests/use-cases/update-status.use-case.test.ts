/**
 * Update Status Use Case Tests
 * Covers active-state toggle, rename, code change, and duplicate-code guard.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { InMemoryStorageAdapter } from '@viccoboard/storage';
import { StatusCatalogRepository } from '../../src/repositories/status-catalog.repository';
import { UpdateStatusUseCase } from '../../src/use-cases/update-status.use-case';

describe('UpdateStatusUseCase', () => {
  let adapter: InMemoryStorageAdapter;
  let statusRepo: StatusCatalogRepository;
  let useCase: UpdateStatusUseCase;

  beforeEach(async () => {
    adapter = new InMemoryStorageAdapter();
    await adapter.initialize();
    statusRepo = new StatusCatalogRepository(adapter);
    useCase = new UpdateStatusUseCase(statusRepo);
  });

  describe('active state', () => {
    it('should deactivate an active status', async () => {
      const catalog = await statusRepo.getOrCreateForClassGroup('class-1', 'attendance');
      const target = catalog.statuses.find(s => s.active)!;

      const updated = await useCase.execute({
        catalogId: catalog.id,
        statusId: target.id,
        active: false
      });

      expect(updated.active).toBe(false);
    });

    it('should reactivate an inactive status', async () => {
      const catalog = await statusRepo.getOrCreateForClassGroup('class-1', 'attendance');
      const target = catalog.statuses[0];

      // Deactivate first
      await useCase.execute({ catalogId: catalog.id, statusId: target.id, active: false });

      // Reactivate
      const reactivated = await useCase.execute({
        catalogId: catalog.id,
        statusId: target.id,
        active: true
      });

      expect(reactivated.active).toBe(true);
    });

    it('getActiveStatuses should exclude inactive entries', async () => {
      const catalog = await statusRepo.getOrCreateForClassGroup('class-1', 'attendance');
      const target = catalog.statuses[0];

      await useCase.execute({ catalogId: catalog.id, statusId: target.id, active: false });

      const active = await statusRepo.getActiveStatuses(catalog.id);
      expect(active.some(s => s.id === target.id)).toBe(false);
      expect(active.every(s => s.active)).toBe(true);
    });
  });

  describe('rename', () => {
    it('should update the name', async () => {
      const catalog = await statusRepo.getOrCreateForClassGroup('class-1', 'attendance');
      const target = catalog.statuses[0];

      const updated = await useCase.execute({
        catalogId: catalog.id,
        statusId: target.id,
        name: 'Umbenannt'
      });

      expect(updated.name).toBe('Umbenannt');
    });

    it('should reject an empty name', async () => {
      const catalog = await statusRepo.getOrCreateForClassGroup('class-1', 'attendance');
      const target = catalog.statuses[0];

      await expect(
        useCase.execute({ catalogId: catalog.id, statusId: target.id, name: '' })
      ).rejects.toThrow('cannot be empty');
    });

    it('should reject a name exceeding 50 characters', async () => {
      const catalog = await statusRepo.getOrCreateForClassGroup('class-1', 'attendance');
      const target = catalog.statuses[0];

      await expect(
        useCase.execute({ catalogId: catalog.id, statusId: target.id, name: 'x'.repeat(51) })
      ).rejects.toThrow('50 characters');
    });
  });

  describe('code uniqueness', () => {
    it('should reject a code already used by another status', async () => {
      const catalog = await statusRepo.getOrCreateForClassGroup('class-1', 'attendance');
      const [first, second] = catalog.statuses;

      await expect(
        useCase.execute({ catalogId: catalog.id, statusId: first.id, code: second.code })
      ).rejects.toThrow('already exists');
    });

    it('should allow updating a status to keep its own code', async () => {
      const catalog = await statusRepo.getOrCreateForClassGroup('class-1', 'attendance');
      const target = catalog.statuses[0];

      // Setting the same code should not throw
      const updated = await useCase.execute({
        catalogId: catalog.id,
        statusId: target.id,
        code: target.code
      });

      expect(updated.code).toBe(target.code);
    });
  });

  describe('color and icon', () => {
    it('should update color', async () => {
      const catalog = await statusRepo.getOrCreateForClassGroup('class-1', 'attendance');
      const target = catalog.statuses[0];

      const updated = await useCase.execute({
        catalogId: catalog.id,
        statusId: target.id,
        color: '#ff0000'
      });

      expect(updated.color).toBe('#ff0000');
    });

    it('should update icon', async () => {
      const catalog = await statusRepo.getOrCreateForClassGroup('class-1', 'attendance');
      const target = catalog.statuses[0];

      const updated = await useCase.execute({
        catalogId: catalog.id,
        statusId: target.id,
        icon: '★'
      });

      expect(updated.icon).toBe('★');
    });
  });

  describe('validation', () => {
    it('should throw when catalogId is missing', async () => {
      await expect(
        useCase.execute({ catalogId: '', statusId: 'some-id' })
      ).rejects.toThrow('Catalog ID is required');
    });

    it('should throw when statusId is missing', async () => {
      await expect(
        useCase.execute({ catalogId: 'some-id', statusId: '' })
      ).rejects.toThrow('Status ID is required');
    });

    it('should throw when catalog is not found', async () => {
      await expect(
        useCase.execute({ catalogId: 'non-existent', statusId: 'x', name: 'Y' })
      ).rejects.toThrow('not found');
    });

    it('should throw when status is not found in catalog', async () => {
      const catalog = await statusRepo.getOrCreateForClassGroup('class-1', 'attendance');

      await expect(
        useCase.execute({ catalogId: catalog.id, statusId: 'ghost-id', name: 'Y' })
      ).rejects.toThrow('not found');
    });
  });
});
