import { AdapterRepository } from '@viccoboard/storage';
import type { SportStudentProfile } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

export class SportStudentProfileRepository extends AdapterRepository<SportStudentProfile> {
  constructor(adapter: StorageAdapter) {
    super(adapter, 'sport_student_profiles');
  }

  mapToEntity(row: Record<string, unknown>): SportStudentProfile {
    return {
      id: row.id as string,
      studentId: row.student_id as string,
      moduleKey: 'sport',
      medicalNotes: row.medical_notes as string | undefined,
      asthma: Boolean(row.asthma),
      diabetes: Boolean(row.diabetes),
      hemiplegia: Boolean(row.hemiplegia),
      exemptFrom: (row.exempt_from as string | null | undefined) ?? null,
      exemptUntil: (row.exempt_until as string | null | undefined) ?? null,
      disadvantageCompensation: row.disadvantage_compensation as string | undefined,
      swimmingCapable: row.swimming_capable === null || row.swimming_capable === undefined
        ? undefined
        : Boolean(row.swimming_capable),
      createdAt: new Date(row.created_at as string),
      lastModified: new Date(row.last_modified as string)
    };
  }

  mapToRow(entity: Partial<SportStudentProfile>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.studentId !== undefined) row.student_id = entity.studentId;
    if (entity.moduleKey !== undefined) row.module_key = entity.moduleKey;
    if (entity.medicalNotes !== undefined) row.medical_notes = entity.medicalNotes;
    if (entity.asthma !== undefined) row.asthma = entity.asthma ? 1 : 0;
    if (entity.diabetes !== undefined) row.diabetes = entity.diabetes ? 1 : 0;
    if (entity.hemiplegia !== undefined) row.hemiplegia = entity.hemiplegia ? 1 : 0;
    if (entity.exemptFrom !== undefined) row.exempt_from = entity.exemptFrom;
    if (entity.exemptUntil !== undefined) row.exempt_until = entity.exemptUntil;
    if (entity.disadvantageCompensation !== undefined) {
      row.disadvantage_compensation = entity.disadvantageCompensation;
    }
    if (entity.swimmingCapable !== undefined) row.swimming_capable = entity.swimmingCapable ? 1 : 0;
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt.toISOString();
    if (entity.lastModified !== undefined) row.last_modified = entity.lastModified.toISOString();

    return row;
  }

  async findByStudentId(studentId: string): Promise<SportStudentProfile | null> {
    const profiles = await this.find({ student_id: studentId });
    return profiles[0] ?? null;
  }
}
