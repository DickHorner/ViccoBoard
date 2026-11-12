import type { Sport } from '@viccoboard/core';

export interface PerformanceTableGradingInput {
  value: number;
  table: Sport.TableDefinition;
  measurementType: 'number' | 'time';
  context?: Record<string, unknown>;
}

export interface PerformanceTableGradingResult {
  grade: string | number;
  value: number;
}

const toNumber = (value: unknown): number | null => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const coerced = Number(value);
  return Number.isFinite(coerced) ? coerced : null;
};

const matchesValue = (expected: unknown, actual: unknown): boolean => {
  if (expected === actual) return true;
  if (expected === undefined || expected === null) return false;
  if (actual === undefined || actual === null) return false;
  return String(expected) === String(actual);
};

const PERFORMANCE_KEYS = new Set([
  'measurement',
  'exactValue',
  'exact_value',
  'minValue',
  'min_value',
  'maxValue',
  'max_value',
  'time',
  'minTime',
  'min_time',
  'maxTime',
  'max_time'
]);

export class PerformanceTableGradingService {
  calculateGrade(input: PerformanceTableGradingInput): PerformanceTableGradingResult {
    const { value, table, measurementType, context = {} } = input;

    if (!Number.isFinite(value) || value < 0) {
      throw new Error('Performance value must be a non-negative number');
    }
    if (!table?.entries?.length) {
      throw new Error('Grading table must have at least one entry');
    }

    const entry = table.entries.find((row) => {
      const key = row.key as Record<string, unknown>;
      const exact = toNumber(
        key.measurement ??
        key.exactValue ??
        key.exact_value ??
        (measurementType === 'time' ? key.time : undefined)
      );
      const min = toNumber(
        measurementType === 'time'
          ? key.minTime ?? key.min_time ?? key.minValue ?? key.min_value
          : key.minValue ?? key.min_value
      );
      const max = toNumber(
        measurementType === 'time'
          ? key.maxTime ?? key.max_time ?? key.maxValue ?? key.max_value
          : key.maxValue ?? key.max_value
      );

      if (exact !== null && value !== exact) return false;
      if (min !== null && value < min) return false;
      if (max !== null && value > max) return false;
      if (exact === null && min === null && max === null) return false;

      for (const [entryKey, entryValue] of Object.entries(key)) {
        if (PERFORMANCE_KEYS.has(entryKey)) continue;
        if (!matchesValue(entryValue, context[entryKey])) return false;
      }

      return true;
    });

    if (!entry) {
      throw new Error('No matching grading table entry for performance value');
    }

    return {
      grade: entry.value as string | number,
      value
    };
  }
}
