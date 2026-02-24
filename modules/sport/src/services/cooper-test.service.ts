import { Sport} from '@viccoboard/core';

export interface CooperTestResult {
  SportType: 'running' | 'swimming';
  rounds: number;
  lapLengthMeters: number;
  extraMeters: number;
  distanceMeters: number;
  timestamp: Date;
  grade?: string | number;
}

const toNumber = (value: unknown): number | null => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const coerced = Number(value);
  return Number.isFinite(coerced) ? coerced : null;
};

const isDistanceKey = (key: string): boolean =>
  key === 'distance' ||
  key === 'minDistance' ||
  key === 'maxDistance' ||
  key === 'min_distance' ||
  key === 'max_distance';

const matchesValue = (expected: unknown, actual: unknown): boolean => {
  if (expected === actual) return true;
  if (expected === undefined || expected === null) return false;
  if (actual === undefined || actual === null) return false;
  return String(expected) === String(actual);
};

export class CooperTestService {
  calculateDistance(rounds: number, lapLengthMeters: number, extraMeters = 0): number {
    if (!Number.isFinite(rounds) || rounds < 0) {
      throw new Error('Rounds must be a non-negative number');
    }
    if (!Number.isFinite(lapLengthMeters) || lapLengthMeters <= 0) {
      throw new Error('Lap length must be a positive number');
    }
    if (!Number.isFinite(extraMeters) || extraMeters < 0) {
      throw new Error('Extra meters must be a non-negative number');
    }
    return rounds * lapLengthMeters + extraMeters;
  }

  validateDistance(distanceMeters: number): void {
    if (!Number.isFinite(distanceMeters) || distanceMeters < 0) {
      throw new Error('Distance must be a non-negative number');
    }
  }

  buildResult(
    SportType: CooperTestResult['SportType'],
    rounds: number,
    lapLengthMeters: number,
    extraMeters = 0
  ): CooperTestResult {
    const distanceMeters = this.calculateDistance(rounds, lapLengthMeters, extraMeters);
    this.validateDistance(distanceMeters);

    return {
      SportType,
      rounds,
      lapLengthMeters,
      extraMeters,
      distanceMeters,
      timestamp: new Date()
    };
  }

  calculateGradeFromTable(
    table: Sport.TableDefinition,
    distanceMeters: number,
    context: Record<string, unknown> = {}
  ): string | number {
    this.validateDistance(distanceMeters);

    const entry = table.entries.find((row) => {
      const key = row.key || {};

      const exactDistance = toNumber((key as Record<string, unknown>).distance);
      const minDistance = toNumber((key as Record<string, unknown>).minDistance ?? (key as Record<string, unknown>).min_distance);
      const maxDistance = toNumber((key as Record<string, unknown>).maxDistance ?? (key as Record<string, unknown>).max_distance);

      if (exactDistance !== null && distanceMeters !== exactDistance) return false;
      if (minDistance !== null && distanceMeters < minDistance) return false;
      if (maxDistance !== null && distanceMeters > maxDistance) return false;

      for (const [entryKey, entryValue] of Object.entries(key)) {
        if (isDistanceKey(entryKey)) continue;
        if (!matchesValue(entryValue, context[entryKey])) return false;
      }

      return true;
    });

    if (!entry) {
      throw new Error('No matching table entry for cooper test result');
    }

    return entry.value as string | number;
  }
}
