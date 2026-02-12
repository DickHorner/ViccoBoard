/**
 * Mittelstrecke Grading Service
 * Implements time-based grading for middle-distance track events
 * Uses table lookup to map time to grade
 */

import { Sport } from '@viccoboard/core';

export interface MittelstreckeGradingInput {
  timeInSeconds: number;
  table: Sport.TableDefinition;
  context?: Record<string, unknown>;
}

export interface MittelstreckeGradingResult {
  grade: string | number;
  timeInSeconds: number;
}

const toNumber = (value: unknown): number | null => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const coerced = Number(value);
  return Number.isFinite(coerced) ? coerced : null;
};

const isTimeKey = (key: string): boolean =>
  key === 'time' ||
  key === 'minTime' ||
  key === 'maxTime' ||
  key === 'min_time' ||
  key === 'max_time';

export class MittelstreckeGradingService {
  /**
   * Calculate grade from time using table lookup with range matching
   * 
   * Table entries can have:
   * - exact time match
   * - minTime/maxTime range (time >= minTime AND time <= maxTime, or < maxTime for "up to" semantics)
   * - context dimensions (e.g., gender, age)
   * 
   * For time-based performances, lower times are better (faster = better grade).
   * The table should be organized such that better grades appear with lower time thresholds.
   * 
   * @param input Time and table for lookup
   * @returns Calculated grade and context
   * @throws Error if time is invalid or no matching table entry found
   */
  calculateGradeFromTime(input: MittelstreckeGradingInput): MittelstreckeGradingResult {
    const { timeInSeconds, table, context = {} } = input;

    // Validate input
    if (!Number.isFinite(timeInSeconds) || timeInSeconds < 0) {
      throw new Error('Time must be a non-negative number');
    }

    if (!table || !table.entries || table.entries.length === 0) {
      throw new Error('Table must have at least one entry');
    }

    // Find the matching entry
    const entry = table.entries.find((row) => {
      const key = row.key || {};

      // Check time conditions
      const exactTime = toNumber((key as Record<string, unknown>).time);
      const minTime = toNumber((key as Record<string, unknown>).minTime ?? (key as Record<string, unknown>).min_time);
      const maxTime = toNumber((key as Record<string, unknown>).maxTime ?? (key as Record<string, unknown>).max_time);

      // For exact time match
      if (exactTime !== null && timeInSeconds !== exactTime) return false;

      // For range matching
      if (minTime !== null && timeInSeconds < minTime) return false;
      if (maxTime !== null && timeInSeconds > maxTime) return false;

      // Check context dimensions (e.g., gender, age)
      for (const [entryKey, entryValue] of Object.entries(key)) {
        if (isTimeKey(entryKey)) continue;
        
        const contextValue = context[entryKey];
        // If context value is provided, it must match; if not provided, entry with that key doesn't match
        if (contextValue !== undefined && contextValue !== null) {
          if (String(entryValue) !== String(contextValue)) return false;
        } else {
          // If context value is NOT provided but entry has this dimension, skip this entry
          // (it's more specific than our context)
          if (entryValue !== undefined && entryValue !== null) return false;
        }
      }

      return true;
    });

    if (!entry) {
      throw new Error(
        `No matching table entry for Mittelstrecke: time=${timeInSeconds}s, context=${JSON.stringify(context)}`
      );
    }

    return {
      grade: entry.value as string | number,
      timeInSeconds
    };
  }

  /**
   * Parse time string in format mm:ss.ms or just seconds
   * 
   * @param timeStr Time string to parse
   * @returns Time in seconds, or null if invalid format
   */
  parseTimeString(timeStr: string): number | null {
    if (!timeStr || !timeStr.trim()) return null;

    // Try mm:ss.ms format
    const mmssMatch = timeStr.match(/^(\d{1,2}):(\d{2})(?:\.(\d{1,2}))?$/);
    if (mmssMatch) {
      const minutes = parseInt(mmssMatch[1], 10);
      const seconds = parseInt(mmssMatch[2], 10);
      const centiseconds = mmssMatch[3] ? parseInt(mmssMatch[3].padEnd(2, '0'), 10) : 0;
      return minutes * 60 + seconds + centiseconds / 100;
    }

    // Try just seconds with optional decimal
    const secondsMatch = timeStr.match(/^(\d+)(?:\.(\d{1,2}))?$/);
    if (secondsMatch) {
      const secs = parseInt(secondsMatch[1], 10);
      const centiseconds = secondsMatch[2] ? parseInt(secondsMatch[2].padEnd(2, '0'), 10) : 0;
      return secs + centiseconds / 100;
    }

    return null;
  }

  /**
   * Format time in seconds to mm:ss.ms format
   * 
   * @param seconds Time in seconds
   * @returns Formatted time string
   */
  formatTimeString(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const cs = Math.round((seconds % 1) * 100);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
  }

  /**
   * Validate a Mittelstrecke grading table
   * 
   * @param table Table to validate
   * @throws Error if table is invalid
   */
  validateTable(table: Sport.TableDefinition): boolean {
    if (!table || !table.entries || table.entries.length === 0) {
      throw new Error('Table must have at least one entry');
    }

    for (const entry of table.entries) {
      if (!entry.key) {
        throw new Error('All table entries must have a key');
      }

      const key = entry.key as Record<string, unknown>;
      const hasTimeKey =
        key.time !== undefined ||
        key.minTime !== undefined ||
        key.maxTime !== undefined ||
        key.min_time !== undefined ||
        key.max_time !== undefined;

      if (!hasTimeKey) {
        throw new Error(
          'At least one table entry key must contain a time dimension (time, minTime, maxTime, min_time, or max_time)'
        );
      }
    }

    return true;
  }
}
