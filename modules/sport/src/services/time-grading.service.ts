/**
 * Time-Based Grading Service
 * Implements linear mapping algorithm for time-based performance assessments
 */

import { Sport } from '@viccoboard/core';

type TimeGradingConfig = Sport.TimeGradingConfig;

export interface TimeToGradeInput {
  timeInSeconds: number;
  config: TimeGradingConfig;
}

export interface TimeToGradeResult {
  grade: number | string;
  timeInSeconds: number;
  bestTime?: number;
  worstTime?: number;
}

export interface AdjustBoundariesInput {
  config: TimeGradingConfig;
  newBestTime?: number;
  newWorstTime?: number;
  newBestGrade?: number | string;
  newWorstGrade?: number | string;
}

/**
 * Time-Based Grading Service
 * Handles all time-to-grade conversions with linear mapping
 */
export class TimeGradingService {
  /**
   * Calculate grade from a time measurement using linear mapping
   * 
   * For time-based assessments, lower times are better.
   * Linear mapping formula:
   * - If time <= bestTime → bestGrade
   * - If time >= worstTime → worstGrade
   * - Otherwise: grade = bestGrade + ((time - bestTime) / (worstTime - bestTime)) * (worstGrade - bestGrade)
   * 
   * @param input Time measurement and grading configuration
   * @returns Calculated grade and metadata
   */
  calculateGrade(input: TimeToGradeInput): TimeToGradeResult {
    const { timeInSeconds, config } = input;

    if (!config.linearMapping) {
      throw new Error('Only linear mapping is currently supported');
    }

    // Use custom boundaries if provided
    if (config.customBoundaries && config.customBoundaries.length > 0) {
      return this.calculateWithCustomBoundaries(timeInSeconds, config);
    }

    // Validate configuration
    if (config.bestGrade === undefined || config.worstGrade === undefined) {
      throw new Error('Best and worst grades must be defined for time-based grading');
    }

    throw new Error('Custom boundaries with time values are required for time-based grading');
  }

  /**
   * Calculate grade using custom boundaries with explicit time-to-grade mappings
   */
  private calculateWithCustomBoundaries(
    timeInSeconds: number,
    config: TimeGradingConfig
  ): TimeToGradeResult {
    const boundaries = config.customBoundaries!;

    if (boundaries.length < 2) {
      throw new Error('At least 2 boundaries (best and worst) are required');
    }

    // Sort boundaries by time (ascending)
    const sortedBoundaries = [...boundaries].sort((a, b) => a.time - b.time);

    const bestBoundary = sortedBoundaries[0];
    const worstBoundary = sortedBoundaries[sortedBoundaries.length - 1];

    // If time is better than (less than) best time, return best grade
    if (timeInSeconds <= bestBoundary.time) {
      return {
        grade: bestBoundary.grade,
        timeInSeconds,
        bestTime: bestBoundary.time,
        worstTime: worstBoundary.time
      };
    }

    // If time is worse than (greater than) worst time, return worst grade
    if (timeInSeconds >= worstBoundary.time) {
      return {
        grade: worstBoundary.grade,
        timeInSeconds,
        bestTime: bestBoundary.time,
        worstTime: worstBoundary.time
      };
    }

    // Find the two boundaries that the time falls between
    let lowerBoundary = bestBoundary;
    let upperBoundary = worstBoundary;

    for (let i = 0; i < sortedBoundaries.length - 1; i++) {
      if (
        timeInSeconds >= sortedBoundaries[i].time &&
        timeInSeconds <= sortedBoundaries[i + 1].time
      ) {
        lowerBoundary = sortedBoundaries[i];
        upperBoundary = sortedBoundaries[i + 1];
        break;
      }
    }

    // Linear interpolation between the two boundaries
    const timeRange = upperBoundary.time - lowerBoundary.time;
    const timeOffset = timeInSeconds - lowerBoundary.time;
    const timeRatio = timeOffset / timeRange;

    // Calculate grade based on linear interpolation
    const calculatedGrade = this.interpolateGrade(
      lowerBoundary.grade,
      upperBoundary.grade,
      timeRatio
    );

    return {
      grade: calculatedGrade,
      timeInSeconds,
      bestTime: bestBoundary.time,
      worstTime: worstBoundary.time
    };
  }

  /**
   * Interpolate between two grades based on a ratio
   */
  private interpolateGrade(
    lowerGrade: number | string,
    upperGrade: number | string,
    ratio: number
  ): number | string {
    // If grades are numeric, perform numeric interpolation
    if (typeof lowerGrade === 'number' && typeof upperGrade === 'number') {
      const gradeRange = upperGrade - lowerGrade;
      return lowerGrade + gradeRange * ratio;
    }

    // If grades are strings, try to parse as numbers
    const lowerNum = typeof lowerGrade === 'string' ? parseFloat(lowerGrade) : lowerGrade;
    const upperNum = typeof upperGrade === 'string' ? parseFloat(upperGrade) : upperGrade;

    if (!isNaN(lowerNum) && !isNaN(upperNum)) {
      const gradeRange = upperNum - lowerNum;
      return lowerNum + gradeRange * ratio;
    }

    // For non-numeric grades, return the closer boundary grade
    return ratio < 0.5 ? lowerGrade : upperGrade;
  }

  /**
   * Adjust time boundaries after initial configuration
   * Allows post-hoc adjustment as specified in requirements
   * 
   * @param input Current configuration and new boundary values
   * @returns Updated configuration
   */
  adjustBoundaries(input: AdjustBoundariesInput): TimeGradingConfig {
    const { config, newBestTime, newWorstTime, newBestGrade, newWorstGrade } = input;

    // Clone the configuration
    const updatedConfig: TimeGradingConfig = {
      ...config,
      bestGrade: newBestGrade !== undefined ? newBestGrade : config.bestGrade,
      worstGrade: newWorstGrade !== undefined ? newWorstGrade : config.worstGrade
    };

    // Update custom boundaries if provided
    if (config.customBoundaries && config.customBoundaries.length > 0) {
      const boundaries = [...config.customBoundaries];
      
      // Sort to find best and worst
      boundaries.sort((a, b) => a.time - b.time);

      // Update best boundary
      if (newBestTime !== undefined || newBestGrade !== undefined) {
        boundaries[0] = {
          time: newBestTime !== undefined ? newBestTime : boundaries[0].time,
          grade: newBestGrade !== undefined ? newBestGrade : boundaries[0].grade
        };
      }

      // Update worst boundary
      if (newWorstTime !== undefined || newWorstGrade !== undefined) {
        const lastIndex = boundaries.length - 1;
        boundaries[lastIndex] = {
          time: newWorstTime !== undefined ? newWorstTime : boundaries[lastIndex].time,
          grade: newWorstGrade !== undefined ? newWorstGrade : boundaries[lastIndex].grade
        };
      }

      updatedConfig.customBoundaries = boundaries;
    } else {
      // Create new boundaries if none exist
      if (newBestTime !== undefined && newWorstTime !== undefined) {
        updatedConfig.customBoundaries = [
          {
            time: newBestTime,
            grade: updatedConfig.bestGrade
          },
          {
            time: newWorstTime,
            grade: updatedConfig.worstGrade
          }
        ];
      }
    }

    return updatedConfig;
  }

  /**
   * Create a default time grading configuration
   * 
   * @param bestTime Best time boundary in seconds
   * @param worstTime Worst time boundary in seconds
   * @param bestGrade Best grade (e.g., 1 in German system, or 100 in percentage)
   * @param worstGrade Worst grade (e.g., 6 in German system, or 0 in percentage)
   * @returns A complete TimeGradingConfig
   */
  createDefaultConfig(
    bestTime: number,
    worstTime: number,
    bestGrade: number | string,
    worstGrade: number | string
  ): TimeGradingConfig {
    if (bestTime >= worstTime) {
      throw new Error('Best time must be less than worst time');
    }

    return {
      type: 'time',
      bestGrade,
      worstGrade,
      linearMapping: true,
      adjustableAfterwards: true,
      customBoundaries: [
        { time: bestTime, grade: bestGrade },
        { time: worstTime, grade: worstGrade }
      ]
    };
  }

  /**
   * Validate a time grading configuration
   * 
   * @param config Configuration to validate
   * @returns True if valid, throws error if invalid
   */
  validateConfig(config: TimeGradingConfig): boolean {
    if (config.type !== 'time') {
      throw new Error('Configuration type must be "time"');
    }

    if (!config.linearMapping) {
      throw new Error('Only linear mapping is currently supported');
    }

    if (config.bestGrade === undefined || config.worstGrade === undefined) {
      throw new Error('Best and worst grades must be defined');
    }

    if (config.customBoundaries) {
      if (config.customBoundaries.length < 2) {
        throw new Error('At least 2 boundaries are required');
      }

      // Check that times are unique
      const times = config.customBoundaries.map(b => b.time);
      const uniqueTimes = new Set(times);
      if (times.length !== uniqueTimes.size) {
        throw new Error('Boundary times must be unique');
      }

      // Validate time values are positive
      for (const boundary of config.customBoundaries) {
        if (boundary.time < 0) {
          throw new Error('Time values must be non-negative');
        }
      }
    }

    return true;
  }
}
