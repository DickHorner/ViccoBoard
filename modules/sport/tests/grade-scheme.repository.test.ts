/**
 * GradeScheme Repository Tests
 */

import { GradeSchemeRepository } from '../src/repositories/grade-scheme.repository';
import { SQLiteStorage, InitialSchemaMigration, GradingSchemaMigration } from '@viccoboard/storage/node';
import { Sport } from '@viccoboard/core';

describe('GradeSchemeRepository', () => {
  let storage: SQLiteStorage;
  let repository: GradeSchemeRepository;

  beforeEach(async () => {
    // Use in-memory database for tests
    storage = new SQLiteStorage({
      databasePath: ':memory:',
      memory: true
    });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    storage.registerMigration(new GradingSchemaMigration(storage));
    await storage.migrate();

    repository = new GradeSchemeRepository(storage.getAdapter());
  });

  afterEach(async () => {
    await storage.close();
  });

  describe('create', () => {
    test('creates a grade scheme successfully', async () => {
      const scheme: Omit<Sport.GradeScheme, 'id' | 'createdAt' | 'lastModified'> = {
        name: 'German Grading System',
        description: 'Standard German grades 1-6',
        type: 'numeric',
        grades: [
          { value: 1, displayValue: '1', description: 'Very Good', minPercentage: 92, maxPercentage: 100 },
          { value: 2, displayValue: '2', description: 'Good', minPercentage: 81, maxPercentage: 91 },
          { value: 3, displayValue: '3', description: 'Satisfactory', minPercentage: 67, maxPercentage: 80 },
          { value: 4, displayValue: '4', description: 'Adequate', minPercentage: 50, maxPercentage: 66 },
          { value: 5, displayValue: '5', description: 'Poor', minPercentage: 30, maxPercentage: 49 },
          { value: 6, displayValue: '6', description: 'Insufficient', minPercentage: 0, maxPercentage: 29 }
        ]
      };

      const result = await repository.create(scheme);

      expect(result.id).toBeDefined();
      expect(result.name).toBe('German Grading System');
      expect(result.type).toBe('numeric');
      expect(result.grades).toHaveLength(6);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.lastModified).toBeInstanceOf(Date);
    });

    test('creates a letter-based grade scheme', async () => {
      const scheme: Omit<Sport.GradeScheme, 'id' | 'createdAt' | 'lastModified'> = {
        name: 'US Letter Grades',
        type: 'letter',
        grades: [
          { value: 'A', displayValue: 'A', description: 'Excellent', minPercentage: 90, maxPercentage: 100 },
          { value: 'B', displayValue: 'B', description: 'Good', minPercentage: 80, maxPercentage: 89 },
          { value: 'C', displayValue: 'C', description: 'Average', minPercentage: 70, maxPercentage: 79 },
          { value: 'D', displayValue: 'D', description: 'Below Average', minPercentage: 60, maxPercentage: 69 },
          { value: 'F', displayValue: 'F', description: 'Failing', minPercentage: 0, maxPercentage: 59 }
        ]
      };

      const result = await repository.create(scheme);

      expect(result.id).toBeDefined();
      expect(result.name).toBe('US Letter Grades');
      expect(result.type).toBe('letter');
      expect(result.grades).toHaveLength(5);
    });
  });

  describe('findById', () => {
    test('finds an existing grade scheme', async () => {
      const scheme: Omit<Sport.GradeScheme, 'id' | 'createdAt' | 'lastModified'> = {
        name: 'Test Scheme',
        type: 'numeric',
        grades: [
          { value: 1, displayValue: '1', description: 'Best' }
        ]
      };

      const created = await repository.create(scheme);
      const found = await repository.findById(created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('Test Scheme');
    });

    test('returns null for non-existent scheme', async () => {
      const found = await repository.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    test('returns all grade schemes', async () => {
      const scheme1: Omit<Sport.GradeScheme, 'id' | 'createdAt' | 'lastModified'> = {
        name: 'Scheme 1',
        type: 'numeric',
        grades: []
      };
      const scheme2: Omit<Sport.GradeScheme, 'id' | 'createdAt' | 'lastModified'> = {
        name: 'Scheme 2',
        type: 'letter',
        grades: []
      };

      await repository.create(scheme1);
      await repository.create(scheme2);

      const all = await repository.findAll();
      expect(all).toHaveLength(2);
    });

    test('returns empty array when no schemes exist', async () => {
      const all = await repository.findAll();
      expect(all).toHaveLength(0);
    });
  });

  describe('findByType', () => {
    test('filters schemes by type', async () => {
      await repository.create({
        name: 'Numeric Scheme',
        type: 'numeric',
        grades: []
      });
      await repository.create({
        name: 'Letter Scheme',
        type: 'letter',
        grades: []
      });
      await repository.create({
        name: 'Points Scheme',
        type: 'points',
        grades: []
      });

      const numericSchemes = await repository.findByType('numeric');
      expect(numericSchemes).toHaveLength(1);
      expect(numericSchemes[0].name).toBe('Numeric Scheme');

      const letterSchemes = await repository.findByType('letter');
      expect(letterSchemes).toHaveLength(1);
      expect(letterSchemes[0].name).toBe('Letter Scheme');
    });
  });

  describe('searchByName', () => {
    test('searches schemes by name', async () => {
      await repository.create({
        name: 'German Grading System',
        type: 'numeric',
        grades: []
      });
      await repository.create({
        name: 'US Letter Grades',
        type: 'letter',
        grades: []
      });

      const results = await repository.searchByName('german');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('German Grading System');
    });

    test('search is case-insensitive', async () => {
      await repository.create({
        name: 'Test Scheme',
        type: 'numeric',
        grades: []
      });

      const results = await repository.searchByName('TEST');
      expect(results).toHaveLength(1);
    });
  });

  describe('update', () => {
    test('updates a grade scheme', async () => {
      const scheme = await repository.create({
        name: 'Original Name',
        type: 'numeric',
        grades: []
      });

      const updated = await repository.update(scheme.id, {
        name: 'Updated Name',
        description: 'New description'
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('New description');
      expect(updated.type).toBe('numeric');
    });

    test('throws error when updating non-existent scheme', async () => {
      await expect(
        repository.update('non-existent-id', { name: 'New Name' })
      ).rejects.toThrow('Entity with id non-existent-id not found');
    });
  });

  describe('delete', () => {
    test('deletes a grade scheme', async () => {
      const scheme = await repository.create({
        name: 'To Delete',
        type: 'numeric',
        grades: []
      });

      const deleted = await repository.delete(scheme.id);
      expect(deleted).toBe(true);

      const found = await repository.findById(scheme.id);
      expect(found).toBeNull();
    });

    test('returns false when deleting non-existent scheme', async () => {
      const deleted = await repository.delete('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('count', () => {
    test('counts all schemes', async () => {
      await repository.create({ name: 'Scheme 1', type: 'numeric', grades: [] });
      await repository.create({ name: 'Scheme 2', type: 'letter', grades: [] });

      const count = await repository.count();
      expect(count).toBe(2);
    });

    test('returns 0 when no schemes exist', async () => {
      const count = await repository.count();
      expect(count).toBe(0);
    });
  });
});
