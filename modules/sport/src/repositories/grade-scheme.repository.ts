/**
 * GradeScheme Repository
 * Handles persistence of grading schemes
 */

import { AdapterRepository } from '@viccoboard/storage';
import { Sport } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

export class GradeSchemeRepository extends AdapterRepository<Sport.GradeScheme> {
  constructor(adapter: StorageAdapter) {
    super(adapter, 'grade_schemes');
  }

  /**
   * Map database row to GradeScheme entity
   */
  mapToEntity(row: any): Sport.GradeScheme {
    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      grades: JSON.parse(row.grades),
      type: row.type as 'numeric' | 'letter' | 'points',
      createdAt: new Date(row.created_at),
      lastModified: new Date(row.last_modified)
    };
  }

  /**
   * Map GradeScheme entity to database row
   */
  mapToRow(entity: Partial<Sport.GradeScheme>): any {
    const row: any = {};
    
    if (entity.id) row.id = entity.id;
    if (entity.name) row.name = entity.name;
    if (entity.description !== undefined) row.description = entity.description;
    if (entity.grades) row.grades = JSON.stringify(entity.grades);
    if (entity.type) row.type = entity.type;
    if (entity.createdAt) row.created_at = entity.createdAt.toISOString();
    if (entity.lastModified) row.last_modified = entity.lastModified.toISOString();
    
    return row;
  }

  /**
   * Find grading schemes by type
   */
  async findByType(type: 'numeric' | 'letter' | 'points'): Promise<Sport.GradeScheme[]> {
    return this.find({ type });
  }

  /**
   * Search grading schemes by name
   */
  async searchByName(query: string): Promise<Sport.GradeScheme[]> {
    const allSchemes = await this.findAll();
    return allSchemes.filter((scheme: Sport.GradeScheme) => 
      scheme.name.toLowerCase().includes(query.toLowerCase())
    );
  }
}
