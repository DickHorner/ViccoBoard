/**
 * GradeCategory Repository
 * Handles persistence of grade categories
 */

import { AdapterRepository } from '@viccoboard/storage';
import { Sport } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

export class GradeCategoryRepository extends AdapterRepository<Sport.GradeCategory> {
  constructor(adapter: StorageAdapter) {
    super(adapter, 'grade_categories');
  }

  /**
   * Map database row to GradeCategory entity
   */
  mapToEntity(row: any): GradeCategory {
  mapToEntity(row: any): Sport.GradeCategory {
    return {
      id: row.id,
      classGroupId: row.class_group_id,
      name: row.name,
      description: row.description || undefined,
      type: row.type as GradeCategoryType,
      type: row.type as Sport.GradeCategoryType,
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
  mapToRow(entity: Partial<Sport.GradeCategory>): any {
    const row: any = {};
    
    if (entity.id) row.id = entity.id;
    if (entity.classGroupId) row.class_group_id = entity.classGroupId;
    if (entity.name) row.name = entity.name;
    if (entity.description) row.description = entity.description;
    if (entity.description !== undefined) row.description = entity.description;
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
   * Find all grade categories for a specific class group
   */
  async findByClassGroup(classGroupId: string): Promise<Sport.GradeCategory[]> {
    return this.find({ class_group_id: classGroupId });
  }

  /**
   * Find grade categories by type
   */
  async findByType(type: GradeCategoryType): Promise<GradeCategory[]> {
  async findByType(type: Sport.GradeCategoryType): Promise<Sport.GradeCategory[]> {
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
   * Find grade categories for a class group by type
   */
  async findByClassGroupAndType(
    classGroupId: string, 
    type: Sport.GradeCategoryType
  ): Promise<Sport.GradeCategory[]> {
    return this.find({ 
      class_group_id: classGroupId,
      type 
    });
  }

  /**
   * Get total weight of all categories for a class group
   */
  async getTotalWeight(classGroupId: string): Promise<number> {
    const categories = await this.findByClassGroup(classGroupId);
    return categories.reduce((sum, cat) => sum + cat.weight, 0);
  }
}
