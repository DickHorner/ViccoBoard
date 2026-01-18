/**
 * Grade Category Repository
 * Handles persistence of grading categories and configurations
 */

import { AdapterRepository } from '@viccoboard/storage';
import { GradeCategory, GradeCategoryType } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

export class GradeCategoryRepository extends AdapterRepository<GradeCategory> {
  constructor(adapter: StorageAdapter) {
    super(adapter, 'grade_categories');
  }

  /**
   * Map database row to GradeCategory entity
   */
  mapToEntity(row: any): GradeCategory {
    return {
      id: row.id,
      classGroupId: row.class_group_id,
      name: row.name,
      description: row.description || undefined,
      type: row.type as GradeCategoryType,
      weight: row.weight,
      configuration: JSON.parse(row.configuration),
      createdAt: new Date(row.created_at),
      lastModified: new Date(row.last_modified)
    };
  }

  /**
   * Map GradeCategory entity to database row
   */
  mapToRow(entity: Partial<GradeCategory>): any {
    const row: any = {};
    
    if (entity.id) row.id = entity.id;
    if (entity.classGroupId) row.class_group_id = entity.classGroupId;
    if (entity.name) row.name = entity.name;
    if (entity.description) row.description = entity.description;
    if (entity.type) row.type = entity.type;
    if (entity.weight !== undefined) row.weight = entity.weight;
    if (entity.configuration) row.configuration = JSON.stringify(entity.configuration);
    if (entity.createdAt) row.created_at = entity.createdAt.toISOString();
    if (entity.lastModified) row.last_modified = entity.lastModified.toISOString();
    
    return row;
  }

  /**
   * Find all grade categories for a specific class
   */
  async findByClassGroup(classGroupId: string): Promise<GradeCategory[]> {
    return this.find({ class_group_id: classGroupId });
  }

  /**
   * Find grade categories by type
   */
  async findByType(type: GradeCategoryType): Promise<GradeCategory[]> {
    return this.find({ type });
  }

  /**
   * Find grade categories by class and type
   */
  async findByClassGroupAndType(classGroupId: string, type: GradeCategoryType): Promise<GradeCategory[]> {
    return this.find({
      class_group_id: classGroupId,
      type
    });
  }
}
