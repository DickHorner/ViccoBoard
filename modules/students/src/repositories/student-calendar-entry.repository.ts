import type { StudentCalendarEntry } from '@viccoboard/core';
import { AdapterRepository } from '@viccoboard/storage';
import type { StorageAdapter } from '@viccoboard/storage';

export class StudentCalendarEntryRepository extends AdapterRepository<StudentCalendarEntry> {
  constructor(adapter: StorageAdapter) {
    super(adapter, 'student_calendar_entries');
  }

  mapToEntity(row: any): StudentCalendarEntry {
    return {
      id: row.id,
      studentId: row.student_id,
      type: row.type,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status || undefined,
      period: row.period || undefined,
      compulsoryLessons: row.compulsory_lessons || undefined,
      missedDays: row.missed_days ?? undefined,
      missedHours: row.missed_hours ?? undefined,
      missedMinutes: row.missed_minutes ?? undefined,
      notes: row.notes || undefined,
      source: row.source,
      sourceKey: row.source_key || undefined,
      createdAt: new Date(row.created_at),
      lastModified: new Date(row.last_modified)
    };
  }

  mapToRow(entity: Partial<StudentCalendarEntry>): any {
    const row: any = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.studentId !== undefined) row.student_id = entity.studentId;
    if (entity.type !== undefined) row.type = entity.type;
    if (entity.startDate !== undefined) row.start_date = entity.startDate;
    if (entity.endDate !== undefined) row.end_date = entity.endDate;
    if (Object.prototype.hasOwnProperty.call(entity, 'status')) row.status = entity.status ?? null;
    if (Object.prototype.hasOwnProperty.call(entity, 'period')) row.period = entity.period ?? null;
    if (Object.prototype.hasOwnProperty.call(entity, 'compulsoryLessons')) row.compulsory_lessons = entity.compulsoryLessons ?? null;
    if (Object.prototype.hasOwnProperty.call(entity, 'missedDays')) row.missed_days = entity.missedDays ?? null;
    if (Object.prototype.hasOwnProperty.call(entity, 'missedHours')) row.missed_hours = entity.missedHours ?? null;
    if (Object.prototype.hasOwnProperty.call(entity, 'missedMinutes')) row.missed_minutes = entity.missedMinutes ?? null;
    if (Object.prototype.hasOwnProperty.call(entity, 'notes')) row.notes = entity.notes ?? null;
    if (entity.source !== undefined) row.source = entity.source;
    if (Object.prototype.hasOwnProperty.call(entity, 'sourceKey')) row.source_key = entity.sourceKey ?? null;
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt.toISOString();
    if (entity.lastModified !== undefined) row.last_modified = entity.lastModified.toISOString();

    return row;
  }

  async create(
    entity: Omit<StudentCalendarEntry, 'id' | 'createdAt' | 'lastModified'>
  ): Promise<StudentCalendarEntry> {
    this.assertValid(entity);
    return super.create(entity);
  }

  async update(id: string, updates: Partial<StudentCalendarEntry>): Promise<StudentCalendarEntry> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Entity with id ${id} not found`);
    }

    this.assertValid({ ...existing, ...updates });
    return super.update(id, updates);
  }

  async findByStudent(studentId: string): Promise<StudentCalendarEntry[]> {
    const entries = await this.find({ student_id: studentId });
    return entries.sort(compareStudentCalendarEntries);
  }

  private assertValid(
    entry: Pick<StudentCalendarEntry, 'studentId' | 'type' | 'startDate' | 'endDate' | 'source'>
  ): void {
    if (!entry.studentId.trim()) {
      throw new Error('studentId is required');
    }

    if (entry.type !== 'absence' && entry.type !== 'injury') {
      throw new Error('type must be absence or injury');
    }

    if (!isIsoDate(entry.startDate) || !isIsoDate(entry.endDate)) {
      throw new Error('startDate and endDate must use YYYY-MM-DD format');
    }

    if (entry.startDate > entry.endDate) {
      throw new Error('startDate must be before or equal to endDate');
    }

    if (entry.source !== 'manual' && entry.source !== 'iserv') {
      throw new Error('source must be manual or iserv');
    }
  }
}

export const compareStudentCalendarEntries = (
  left: StudentCalendarEntry,
  right: StudentCalendarEntry
): number => {
  if (left.startDate !== right.startDate) {
    return right.startDate.localeCompare(left.startDate);
  }

  if (left.endDate !== right.endDate) {
    return right.endDate.localeCompare(left.endDate);
  }

  return left.type.localeCompare(right.type);
};

function isIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}
