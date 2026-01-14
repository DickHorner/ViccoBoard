/**
 * ClassGroup Repository
 * Handles persistence of class/course groups
 */

import { AdapterRepository } from '@viccoboard/storage';
import { ClassGroup } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

export class ClassGroupRepository extends AdapterRepository<ClassGroup> {
  constructor(adapter: StorageAdapter) {
    super(adapter, 'class_groups');
  }

  /**
   * Map database row to ClassGroup entity
   */
  mapToEntity(row: any): ClassGroup {
    return {
      id: row.id,
      name: row.name,
      schoolYear: row.school_year,
      state: row.state || undefined,
      holidayCalendarRef: row.holiday_calendar_ref || undefined,
      gradingScheme: row.grading_scheme || 'default',
      subjectProfile: row.subject_profile ? JSON.parse(row.subject_profile) : undefined,
      createdAt: new Date(row.created_at),
      lastModified: new Date(row.last_modified)
    };
  }

  /**
   * Map ClassGroup entity to database row
   */
  mapToRow(entity: Partial<ClassGroup>): any {
    const row: any = {};
    
    if (entity.id) row.id = entity.id;
    if (entity.name) row.name = entity.name;
    if (entity.schoolYear) row.school_year = entity.schoolYear;
    if (entity.state) row.state = entity.state;
    if (entity.holidayCalendarRef) row.holiday_calendar_ref = entity.holidayCalendarRef;
    if (entity.gradingScheme) row.grading_scheme = entity.gradingScheme;
    if (entity.subjectProfile) row.subject_profile = JSON.stringify(entity.subjectProfile);
    if (entity.createdAt) row.created_at = entity.createdAt.toISOString();
    if (entity.lastModified) row.last_modified = entity.lastModified.toISOString();
    
    return row;
  }

  /**
   * Find all classes for a specific school year
   */
  async findBySchoolYear(schoolYear: string): Promise<ClassGroup[]> {
    return this.find({ school_year: schoolYear });
  }

  /**
   * Find classes by state (e.g., "Bayern", "NRW")
   */
  async findByState(state: string): Promise<ClassGroup[]> {
    return this.find({ state });
  }

  /**
   * Get all active classes (current school year)
   */
  async findActive(): Promise<ClassGroup[]> {
    const currentYear = new Date().getFullYear();
    const schoolYear = `${currentYear}/${currentYear + 1}`;
    return this.findBySchoolYear(schoolYear);
  }
}
