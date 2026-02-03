/**
 * Student Repository
 * Handles persistence of student profiles
 */

import { AdapterRepository } from '@viccoboard/storage';
import { Student } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

export class StudentRepository extends AdapterRepository<Student> {
  constructor(adapter: StorageAdapter) {
    super(adapter, 'students');
  }

  /**
   * Map database row to Student entity
   */
  mapToEntity(row: any): Student {
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      birthYear: row.birth_year || undefined,
      gender: row.gender || undefined,
      photoUri: row.photo_uri || undefined,
      contactInfo: {
        email: row.email || undefined,
        parentEmail: row.parent_email || undefined,
        phone: row.phone || undefined
      },
      classGroupId: row.class_group_id,
      createdAt: new Date(row.created_at),
      lastModified: new Date(row.last_modified)
    };
  }

  /**
   * Map Student entity to database row
   */
  mapToRow(entity: Partial<Student>): any {
    const row: any = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.firstName !== undefined) row.first_name = entity.firstName;
    if (entity.lastName !== undefined) row.last_name = entity.lastName;
    if (entity.birthYear !== undefined) row.birth_year = entity.birthYear;
    if (entity.gender !== undefined) row.gender = entity.gender;
    if (entity.photoUri !== undefined) row.photo_uri = entity.photoUri;
    if (entity.contactInfo?.email !== undefined) row.email = entity.contactInfo.email;
    if (entity.contactInfo?.parentEmail !== undefined) row.parent_email = entity.contactInfo.parentEmail;
    if (entity.contactInfo?.phone !== undefined) row.phone = entity.contactInfo.phone;
    if (entity.classGroupId !== undefined) row.class_group_id = entity.classGroupId;
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt.toISOString();
    if (entity.lastModified !== undefined) row.last_modified = entity.lastModified.toISOString();

    return row;
  }

  /**
   * Find all students in a specific class
   */
  async findByClassGroup(classGroupId: string): Promise<Student[]> {
    return this.find({ class_group_id: classGroupId });
  }

  /**
   * Find students by name (partial match)
   */
  async findByName(searchTerm: string): Promise<Student[]> {
    const allStudents = await this.findAll();
    const lowerSearch = searchTerm.toLowerCase();
    return allStudents.filter(student =>
      student.firstName.toLowerCase().includes(lowerSearch) ||
      student.lastName.toLowerCase().includes(lowerSearch)
    );
  }

  /**
   * Count students in a class
   */
  async countByClassGroup(classGroupId: string): Promise<number> {
    const students = await this.findByClassGroup(classGroupId);
    return students.length;
  }
}
