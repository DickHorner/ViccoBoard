/**
 * SportZens NewDayData Repository
 * Stores daily workout notes in new_day_data.
 */

import { SportZens, safeJsonParse, safeJsonStringify } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

export class SportZensNewDayDataRepository {
  private readonly tableName = 'new_day_data';

  constructor(private adapter: StorageAdapter) {}

  async save(entry: SportZens.SportZensNewDayData): Promise<SportZens.SportZensNewDayData> {
    const existing = await this.adapter.getById(this.tableName, entry.date);
    const row = this.mapToRow(entry);

    if (existing) {
      await this.adapter.update(this.tableName, entry.date, row);
      return entry;
    }

    await this.adapter.insert(this.tableName, row);
    return entry;
  }

  async findByDate(date: string): Promise<SportZens.SportZensNewDayData | null> {
    const row = await this.adapter.getById(this.tableName, date);
    return row ? this.mapToEntity(row) : null;
  }

  async findAll(): Promise<SportZens.SportZensNewDayData[]> {
    const rows = await this.adapter.getAll(this.tableName);
    return rows.map((row) => this.mapToEntity(row));
  }

  async delete(date: string): Promise<boolean> {
    return this.adapter.delete(this.tableName, date);
  }

  private mapToEntity(row: Record<string, unknown>): SportZens.SportZensNewDayData {
    return {
      date: (row.date as string) || (row.id as string),
      additionalExercises: safeJsonParse(row.additional_exercises as string | undefined, undefined, 'SportZensNewDayData.additionalExercises') as unknown[] | undefined,
      exercises: safeJsonParse(row.exercises as string | undefined, undefined, 'SportZensNewDayData.exercises') as unknown[] | undefined,
      notes: row.notes as string | undefined
    };
  }

  private mapToRow(entity: SportZens.SportZensNewDayData): Record<string, unknown> {
    return {
      id: entity.date,
      date: entity.date,
      additional_exercises: entity.additionalExercises
        ? safeJsonStringify(entity.additionalExercises, 'SportZensNewDayData.additionalExercises')
        : undefined,
      exercises: entity.exercises
        ? safeJsonStringify(entity.exercises, 'SportZensNewDayData.exercises')
        : undefined,
      notes: entity.notes
    };
  }
}
