/**
 * Sportabzeichen Result Repository
 * Handles persistence of Sportabzeichen results
 */

import { AdapterRepository } from '@viccoboard/storage';
import { Sport } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

export class SportabzeichenResultRepository extends AdapterRepository<Sport.SportabzeichenResult> {
  constructor(adapter: StorageAdapter) {
    super(adapter, 'sportabzeichen_results');
  }

  /**
   * Map database row to SportabzeichenResult entity
   */
  mapToEntity(row: any): Sport.SportabzeichenResult {
    return {
      id: row.id,
      studentId: row.student_id,
      disciplineId: row.discipline_id,
      testDate: new Date(row.test_date),
      ageAtTest: row.age_at_test,
      gender: row.gender,
      performanceValue: row.performance_value,
      unit: row.unit,
      achievedLevel: row.achieved_level,
      createdAt: new Date(row.created_at),
      lastModified: new Date(row.last_modified)
    };
  }

  /**
   * Map SportabzeichenResult entity to database row
   */
  mapToRow(entity: Partial<Sport.SportabzeichenResult>): any {
    const row: any = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.studentId !== undefined) row.student_id = entity.studentId;
    if (entity.disciplineId !== undefined) row.discipline_id = entity.disciplineId;
    if (entity.testDate !== undefined) row.test_date = entity.testDate.toISOString();
    if (entity.ageAtTest !== undefined) row.age_at_test = entity.ageAtTest;
    if (entity.gender !== undefined) row.gender = entity.gender;
    if (entity.performanceValue !== undefined) row.performance_value = entity.performanceValue;
    if (entity.unit !== undefined) row.unit = entity.unit;
    if (entity.achievedLevel !== undefined) row.achieved_level = entity.achievedLevel;
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt.toISOString();
    if (entity.lastModified !== undefined) row.last_modified = entity.lastModified.toISOString();

    return row;
  }

  /**
   * Finds all Sportabzeichen results for a given student.
   *
   * Use this to retrieve the complete Sportabzeichen history for a student,
   * for example when displaying their performance overview or analyzing
   * their progress over time.
   *
   * @param studentId - The identifier of the student whose results should be returned.
   * @returns A promise resolving to all Sportabzeichen results stored for the given student.
   */

  async findByStudent(studentId: string): Promise<Sport.SportabzeichenResult[]> {
    return this.find({ student_id: studentId });
  }
}
