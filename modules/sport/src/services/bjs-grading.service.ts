/**
 * Bundesjugendspiele (BJS) Grading Service
 * Implements multi-discipline performance scoring with table-based point calculations
 */

import { Sport} from '@viccoboard/core';

export interface BJSDisciplineResult {
  disciplineId: string;
  discipline: Sport.BJSDiscipline;
  performanceValue: number;
  points: number;
  grade?: string | number;
}

export interface BJSGradingInput {
  disciplines: Sport.BJSDiscipline[];
  performances: Record<string, number>; // disciplineId -> performanceValue
  table: Sport.TableDefinition;
  context?: Record<string, unknown>;
}

export interface BJSGradingResult {
  totalPoints: number;
  disciplineResults: BJSDisciplineResult[];
  certificateType: 'ehrenurkunde' | 'siegerurkunde' | 'teilnahmeurkunde' | null;
}

const toNumber = (value: unknown): number | null => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const coerced = Number(value);
  return Number.isFinite(coerced) ? coerced : null;
};

/**
 * Bundesjugendspiele Grading Service
 * 
 * Handles scoring for multi-discipline Sports competitions.
 * Each discipline performance is looked up in a table to get points.
 * Total points across all disciplines determine the certificate level.
 */
export class BJSGradingService {
  /**
   * Calculate total score from individual discipline performances
   * 
   * For each discipline:
   * 1. Look up the performance value in the table
   * 2. Get the points for that performance
   * 3. Sum all points
   * 4. Determine certificate level based on total points
   * 
   * Table entries should have keys with:
   * - disciplineId (required)
   * - min/maxValue or exact value (for range matching)
   * - optional context (age, gender)
   * Value should be the points for that performance
   * 
   * @param input Disciplines, performances, and table
   * @returns Total points, individual results, and certificate level
   * @throws Error if any discipline is missing or table lookup fails
   */
  calculateScore(input: BJSGradingInput): BJSGradingResult {
    const { disciplines, performances, table, context = {} } = input;

    // Validate inputs
    if (!disciplines || disciplines.length === 0) {
      throw new Error('At least one discipline is required');
    }

    if (!performances || Object.keys(performances).length === 0) {
      throw new Error('Performances must be provided');
    }

    if (!table || !table.entries || table.entries.length === 0) {
      throw new Error('Grading table must have at least one entry');
    }

    let totalPoints = 0;
    const disciplineResults: BJSDisciplineResult[] = [];

    // Score each discipline
    for (const discipline of disciplines) {
      const performanceValue = performances[discipline.id];

      if (performanceValue === undefined || performanceValue === null) {
        throw new Error(`Performance value missing for discipline: ${discipline.id}`);
      }

      if (!Number.isFinite(performanceValue) || performanceValue < 0) {
        throw new Error(
          `Invalid performance value for discipline ${discipline.id}: ${performanceValue}`
        );
      }

      // Look up points in table
      const points = this.lookupPoints(discipline, performanceValue, table, context);

      totalPoints += points;
      disciplineResults.push({
        disciplineId: discipline.id,
        discipline,
        performanceValue,
        points
      });
    }

    // Determine certificate based on total points
    const certificateType = this.determineCertificate(totalPoints);

    return {
      totalPoints,
      disciplineResults,
      certificateType
    };
  }

  /**
   * Look up points for a single discipline performance
   * 
   * @param discipline The discipline definition
   * @param performanceValue The performance value achieved
   * @param table Grading table
   * @param context Additional context (e.g., age, gender)
   * @returns Points for this performance
   * @throws Error if no matching entry found
   */
  private lookupPoints(
    discipline: Sport.BJSDiscipline,
    performanceValue: number,
    table: Sport.TableDefinition,
    context: Record<string, unknown>
  ): number {
    // Find matching entry for this discipline's performance
    const entry = table.entries.find((row) => {
      const key = row.key || {};
      const keyObj = key as Record<string, unknown>;

      // Must match discipline ID
      if (keyObj.disciplineId !== discipline.id) return false;

      // Check performance value ranges (supports both minValue/maxValue and minTime/maxTime)
      const minValue = toNumber(keyObj.minValue ?? keyObj.min_value ?? keyObj.minTime ?? keyObj.min_time);
      const maxValue = toNumber(keyObj.maxValue ?? keyObj.max_value ?? keyObj.maxTime ?? keyObj.max_time);
      const exactValue = toNumber(keyObj.value);

      // For exact match
      if (exactValue !== null && performanceValue !== exactValue) return false;

      // For range matching: both time and distance/height use same comparison logic
      // (specifically: minValue is lower bound, maxValue is upper bound, >= is inclusive on both ends)
      if (minValue !== null && performanceValue < minValue) return false;
      if (maxValue !== null && performanceValue > maxValue) return false;

      // Check context dimensions if provided
      for (const [entryKey, entryValue] of Object.entries(keyObj)) {
        if (this.isPerformanceKey(entryKey)) continue;
        if (entryKey === 'disciplineId') continue;

        const contextValue = context[entryKey];
        // If context value is provided, it must match; if not provided, entry with that key doesn't match
        if (contextValue !== undefined && contextValue !== null) {
          if (String(entryValue) !== String(contextValue)) return false;
        } else {
          // If context value is NOT provided but entry has this dimension, skip this entry
          if (entryValue !== undefined && entryValue !== null) return false;
        }
      }

      return true;
    });

    if (!entry) {
      throw new Error(
        `No matching table entry for discipline ${discipline.id} with performance ${performanceValue}`
      );
    }

    const points = toNumber(entry.value);
    if (points === null) {
      throw new Error(
        `Invalid points value in table for discipline ${discipline.id}: ${entry.value}`
      );
    }

    return points;
  }

  /**
   * Determine certificate type based on total points
   * 
   * Official BJS thresholds (these may vary by state/event, so they should be
   * configurable via table metadata or a separate config):
   * - Ehrenurkunde (honor): >= 1000 points
   * - Siegerurkunde (winner): >= 600 points
   * - Teilnahmeurkunde (participation): > 0 points
   * 
   * @param totalPoints Total points scored
   * @returns Certificate type or null if no certificate
   */
  private determineCertificate(
    totalPoints: number
  ): 'ehrenurkunde' | 'siegerurkunde' | 'teilnahmeurkunde' | null {
    if (totalPoints >= 1000) return 'ehrenurkunde';
    if (totalPoints >= 600) return 'siegerurkunde';
    if (totalPoints > 0) return 'teilnahmeurkunde';
    return null;
  }

  /**
   * Check if a key is a performance/measurement dimension
   * 
   * @param key Key name to check
   * @returns True if this is a performance-related key
   */
  private isPerformanceKey(key: string): boolean {
    const perfKeys = [
      'value',
      'minValue',
      'maxValue',
      'min_value',
      'max_value',
      'minTime',
      'maxTime',
      'min_time',
      'max_time',
      'points',
      'grade'
    ];
    return perfKeys.includes(key);
  }

  /**
   * Format performance value as measurement unit string
   * 
   * @param value The numeric value
   * @param unit The unit (e.g., 's', 'm', 'cm')
   * @param type The measurement type
   * @returns Formatted string
   */
  formatPerformance(value: number, unit: string, type: 'time' | 'distance' | 'height'): string {
    if (type === 'time') {
      // Format time in seconds as mm:ss
      const minutes = Math.floor(value / 60);
      const seconds = Math.floor(value % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')} ${unit}`;
    } else {
      // Format distance/height with 2 decimals
      return `${value.toFixed(2)} ${unit}`;
    }
  }

  /**
   * Validate BJS grading table
   * 
   * @param table Table to validate
   * @throws Error if table is invalid
   */
  validateTable(table: Sport.TableDefinition): boolean {
    if (!table || !table.entries || table.entries.length === 0) {
      throw new Error('Table must have at least one entry');
    }

    // Check that at least one entry has a disciplineId
    const hasDisciplineKey = table.entries.some((entry) => {
      return (entry.key as Record<string, unknown>).disciplineId !== undefined;
    });

    if (!hasDisciplineKey) {
      throw new Error('At least one table entry must have a disciplineId key');
    }

    return true;
  }
}
