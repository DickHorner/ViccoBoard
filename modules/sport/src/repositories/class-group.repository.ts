/**
 * ClassGroup Repository
 * Handles persistence of class/course groups
 */

import { AdapterRepository } from '@viccoboard/storage';
import { ClassGroup, safeJsonParse, safeJsonStringify } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

export class ClassGroupRepository extends AdapterRepository<ClassGroup> {
  constructor(adapter: StorageAdapter) {
    super(adapter, 'class_groups');
  }

  /**
   * Map database row to ClassGroup entity
   */
  mapToEntity(row: any): ClassGroup {
    const archived = row.archived === 1 || row.archived === true;

    return {
      id: row.id,
      name: row.name,
      schoolYear: row.school_year,
      color: row.color || undefined,
      archived,
      state: row.state || undefined,
      holidayCalendarRef: row.holiday_calendar_ref || undefined,
      gradingScheme: row.grading_scheme || 'default',
      subjectProfile: row.subject_profile ? safeJsonParse(row.subject_profile, undefined, 'ClassGroup.subjectProfile') : undefined,
      createdAt: new Date(row.created_at),
      lastModified: new Date(row.last_modified)
    };
  }

  /**
   * Map ClassGroup entity to database row
   */
  mapToRow(entity: Partial<ClassGroup>): any {
    const row: any = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.name !== undefined) row.name = entity.name;
    if (entity.schoolYear !== undefined) row.school_year = entity.schoolYear;
    if (entity.color !== undefined) row.color = entity.color;
    if (entity.archived !== undefined) row.archived = entity.archived ? 1 : 0;
    if (entity.state !== undefined) row.state = entity.state;
    if (entity.holidayCalendarRef !== undefined) row.holiday_calendar_ref = entity.holidayCalendarRef;
    if (entity.gradingScheme !== undefined) row.grading_scheme = entity.gradingScheme;
    if (entity.subjectProfile !== undefined) row.subject_profile = safeJsonStringify(entity.subjectProfile, 'ClassGroup.subjectProfile');
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt.toISOString();
    if (entity.lastModified !== undefined) row.last_modified = entity.lastModified.toISOString();

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
    const classes = await this.findBySchoolYear(schoolYear);
    return classes.filter((cls) => !cls.archived);
  }
}

