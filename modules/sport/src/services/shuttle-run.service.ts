import { Sport} from '@viccoboard/core';

export interface ShuttleRunResult {
  level: number;
  lane: number;
  timestamp: Date;
  grade?: string | number;
}

export class ShuttleRunService {
  validateResult(config: Sport.ShuttleRunConfig, level: number, lane: number): void {
    const match = config.levels.find(entry => entry.level === level && entry.lane === lane);
    if (!match) {
      throw new Error('Invalid shuttle run result: level/lane not found in configuration');
    }
  }

  buildResult(config: Sport.ShuttleRunConfig, level: number, lane: number): ShuttleRunResult {
    this.validateResult(config, level, lane);
    return {
      level,
      lane,
      timestamp: new Date()
    };
  }

  calculateGradeFromTable(table: Sport.TableDefinition, level: number, lane: number): string | number {
    const entry = table.entries.find((row) => {
      const key = row.key || {};
      if (key.level !== undefined && key.level !== level) return false;
      if (key.lane !== undefined && key.lane !== lane) return false;
      return true;
    });

    if (!entry) {
      throw new Error('No matching table entry for shuttle run result');
    }

    return entry.value as string | number;
  }
}
