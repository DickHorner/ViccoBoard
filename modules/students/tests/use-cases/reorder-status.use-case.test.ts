/**
 * Reorder Status Use Case Tests
 * Covers ordering semantics and sequential index enforcement.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { InMemoryStorageAdapter } from '@viccoboard/storage';
import { StatusCatalogRepository } from '../../src/repositories/status-catalog.repository';
import { ReorderStatusUseCase } from '../../src/use-cases/reorder-status.use-case';
import { AddStatusUseCase } from '../../src/use-cases/add-status.use-case';

describe('ReorderStatusUseCase', () => {
  let adapter: InMemoryStorageAdapter;
  let statusRepo: StatusCatalogRepository;
  let useCase: ReorderStatusUseCase;
  let addUseCase: AddStatusUseCase;

  beforeEach(async () => {
    adapter = new InMemoryStorageAdapter();
    await adapter.initialize();
    statusRepo = new StatusCatalogRepository(adapter);
    useCase = new ReorderStatusUseCase(statusRepo);
    addUseCase = new AddStatusUseCase(statusRepo);
  });

  async function buildSmallCatalog() {
    // Creates a participation catalog with 3 custom options
    const catalog = await statusRepo.getOrCreateForClassGroup('class-1', 'participation');
    await addUseCase.execute({ catalogId: catalog.id, name: 'Alpha', code: 'A' });
    await addUseCase.execute({ catalogId: catalog.id, name: 'Beta', code: 'B' });
    await addUseCase.execute({ catalogId: catalog.id, name: 'Gamma', code: 'G' });
    // Return refreshed catalog
    return (await statusRepo.findById(catalog.id))!;
  }

  describe('ordering semantics', () => {
    it('should move a status to the specified position', async () => {
      const catalog = await buildSmallCatalog();
      const last = catalog.statuses[catalog.statuses.length - 1]; // Gamma at index 2

      await useCase.execute({ catalogId: catalog.id, statusId: last.id, newOrder: 0 });

      const updated = await statusRepo.getAllStatuses(catalog.id);
      expect(updated[0].id).toBe(last.id);
    });

    it('should produce sequential order values after reorder', async () => {
      const catalog = await buildSmallCatalog();
      const first = catalog.statuses[0];

      await useCase.execute({
        catalogId: catalog.id,
        statusId: first.id,
        newOrder: catalog.statuses.length - 1
      });

      const statuses = await statusRepo.getAllStatuses(catalog.id);
      statuses.forEach((s, i) => {
        expect(s.order).toBe(i);
      });
    });

    it('should clamp newOrder to valid range (upper bound)', async () => {
      const catalog = await buildSmallCatalog();
      const first = catalog.statuses[0];
      const lastIndex = catalog.statuses.length - 1;

      await useCase.execute({
        catalogId: catalog.id,
        statusId: first.id,
        newOrder: 9999 // out of bounds
      });

      const statuses = await statusRepo.getAllStatuses(catalog.id);
      expect(statuses[lastIndex].id).toBe(first.id);
    });

    it('should clamp newOrder to valid range (lower bound = 0)', async () => {
      const catalog = await buildSmallCatalog();
      const last = catalog.statuses[catalog.statuses.length - 1];

      // 0 is already valid; just verifying the clamp doesn't break anything
      await useCase.execute({ catalogId: catalog.id, statusId: last.id, newOrder: 0 });

      const statuses = await statusRepo.getAllStatuses(catalog.id);
      expect(statuses[0].id).toBe(last.id);
    });

    it('should return the moved status with its new order', async () => {
      const catalog = await buildSmallCatalog();
      const first = catalog.statuses[0];

      const result = await useCase.execute({
        catalogId: catalog.id,
        statusId: first.id,
        newOrder: 2
      });

      expect(result.id).toBe(first.id);
      expect(result.order).toBe(2);
    });
  });

  describe('validation', () => {
    it('should throw when catalogId is missing', async () => {
      await expect(
        useCase.execute({ catalogId: '', statusId: 'x', newOrder: 0 })
      ).rejects.toThrow('Catalog ID is required');
    });

    it('should throw when statusId is missing', async () => {
      await expect(
        useCase.execute({ catalogId: 'some', statusId: '', newOrder: 0 })
      ).rejects.toThrow('Status ID is required');
    });

    it('should throw when newOrder is negative', async () => {
      await expect(
        useCase.execute({ catalogId: 'some', statusId: 'x', newOrder: -1 })
      ).rejects.toThrow('non-negative integer');
    });

    it('should throw when catalog is not found', async () => {
      await expect(
        useCase.execute({ catalogId: 'ghost', statusId: 'x', newOrder: 0 })
      ).rejects.toThrow('not found');
    });

    it('should throw when status is not in catalog', async () => {
      const catalog = await buildSmallCatalog();

      await expect(
        useCase.execute({ catalogId: catalog.id, statusId: 'ghost', newOrder: 0 })
      ).rejects.toThrow('not found');
    });
  });
});
