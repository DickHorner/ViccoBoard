/**
 * Sport NewDayData Repository
 * Stores daily workout notes in new_day_data.
 */

import { SportSchema, safeJsonParse, safeJsonStringify } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

export class SportNewDayDataRepository {
  private readonly tableName = 'new_day_data';

  constructor(private adapter: StorageAdapter) {}

  async save(entry: SportSchema.SportNewDayData): Promise<SportSchema.SportNewDayData> {
    const existing = await this.adapter.getById(this.tableName, entry.date);
    const row = this.mapToRow(entry);

    if (existing) {
      await this.adapter.update(this.tableName, entry.date, row);
      return entry;
    }

    await this.adapter.insert(this.tableName, row);
    return entry;
  }

  async findByDate(date: string): Promise<SportSchema.SportNewDayData | null> {
    const row = await this.adapter.getById(this.tableName, date);
    return row ? this.mapToEntity(row) : null;
  }

  async findAll(): Promise<SportSchema.SportNewDayData[]> {
    const rows = await this.adapter.getAll(this.tableName);
    return rows.map((row) => this.mapToEntity(row));
  }

  async delete(date: string): Promise<boolean> {
    return this.adapter.delete(this.tableName, date);
  }

  private mapToEntity(row: Record<string, unknown>): SportSchema.SportNewDayData {
    return {
      date: (row.date as string) || (row.id as string),
      additionalExercises: safeJsonParse(row.additional_exercises as string | undefined, undefined, 'SportNewDayData.additionalExercises') as unknown[] | undefined,
      exercises: safeJsonParse(row.exercises as string | undefined, undefined, 'SportNewDayData.exercises') as unknown[] | undefined,
      notes: row.notes as string | undefined
    };
  }

  private mapToRow(entity: SportSchema.SportNewDayData): Record<string, unknown> {
    return {
      id: entity.date,
      date: entity.date,
      additional_exercises: entity.additionalExercises
        ? safeJsonStringify(entity.additionalExercises, 'SportNewDayData.additionalExercises')
        : undefined,
      exercises: entity.exercises
        ? safeJsonStringify(entity.exercises, 'SportNewDayData.exercises')
        : undefined,
      notes: entity.notes
    };
  }
}
