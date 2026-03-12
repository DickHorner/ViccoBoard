/**
 * Import Shuttle Run Config Use Case
 * Parses a CSV or JSON text payload into a ShuttleRunConfig and persists it.
 *
 * Supported CSV format (header row required):
 *   level,lane,speed,duration
 *   1,1,8.0,9
 *   ...
 *
 * Supported JSON format:
 *   {
 *     "name": "My Config",          // optional, falls back to parameter
 *     "audioSignalsEnabled": true,  // optional, default true
 *     "levels": [
 *       { "level": 1, "lane": 1, "speed": 8.0, "duration": 9 },
 *       ...
 *     ]
 *   }
 */

import { Sport } from '@viccoboard/core';
import type { ShuttleRunConfigRepository } from '../repositories/shuttle-run-config.repository.js';

export interface ImportShuttleRunConfigInput {
  /** Raw text content of a CSV or JSON file */
  rawContent: string;
  /** Format of rawContent */
  format: 'csv' | 'json';
  /** Human-readable name for the imported config */
  name: string;
  /** Whether audio signals should be enabled (default: true) */
  audioSignalsEnabled?: boolean;
}

export interface ImportShuttleRunConfigResult {
  config: Sport.ShuttleRunConfig;
  levelsImported: number;
}

export interface ParseJsonMetadata {
  name?: string;
  audioSignalsEnabled?: boolean;
}

export class ImportShuttleRunConfigUseCase {
  constructor(private configRepository: ShuttleRunConfigRepository) {}

  async execute(input: ImportShuttleRunConfigInput): Promise<ImportShuttleRunConfigResult> {
    if (!input.rawContent || !input.rawContent.trim()) {
      throw new Error('File content is empty');
    }

    let levels: Sport.ShuttleRunLevel[];
    let jsonMeta: ParseJsonMetadata = {};

    if (input.format === 'csv') {
      levels = ImportShuttleRunConfigUseCase.parseCsv(input.rawContent);
    } else {
      const result = ImportShuttleRunConfigUseCase.parseJson(input.rawContent);
      levels = result.levels;
      jsonMeta = result.meta;
    }

    if (levels.length === 0) {
      throw new Error('No valid level entries found in the file');
    }

    const name = (input.name.trim() || jsonMeta.name || 'Imported Config').trim();
    const audioSignalsEnabled = input.audioSignalsEnabled ?? jsonMeta.audioSignalsEnabled ?? true;

    const config = await this.configRepository.create({
      name,
      levels,
      audioSignalsEnabled,
      source: 'imported'
    });

    return { config, levelsImported: levels.length };
  }

  static parseCsv(raw: string): Sport.ShuttleRunLevel[] {
    const lines = raw
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length < 2) {
      throw new Error('CSV must contain a header row and at least one data row');
    }

    const header = lines[0].toLowerCase().split(',').map(h => h.trim());
    const levelIdx = header.indexOf('level');
    const laneIdx = header.indexOf('lane');
    const speedIdx = header.indexOf('speed');
    const durationIdx = header.indexOf('duration');

    if (levelIdx === -1 || laneIdx === -1) {
      throw new Error('CSV must contain "level" and "lane" columns');
    }

    const levels: Sport.ShuttleRunLevel[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      const level = parseInt(cols[levelIdx], 10);
      const lane = parseInt(cols[laneIdx], 10);
      const speed = speedIdx !== -1 ? parseFloat(cols[speedIdx]) : 0;
      const duration = durationIdx !== -1 ? parseFloat(cols[durationIdx]) : 0;

      if (isNaN(level) || isNaN(lane)) {
        throw new Error(`Invalid level or lane value on CSV row ${i + 1}`);
      }

      levels.push({ level, lane, speed: isNaN(speed) ? 0 : speed, duration: isNaN(duration) ? 0 : duration });
    }

    return levels;
  }

  static parseJson(raw: string): { levels: Sport.ShuttleRunLevel[]; meta: ParseJsonMetadata } {
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('Invalid JSON content');
    }

    // Accept either a top-level array of levels or an object with a "levels" array
    const levelsRaw: any[] = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.levels) ? parsed.levels : null);
    if (!levelsRaw) {
      throw new Error('JSON must be an array of level entries or an object with a "levels" array');
    }

    // Extract optional metadata from the JSON envelope (never mutate the caller's input)
    const meta: ParseJsonMetadata = {};
    if (!Array.isArray(parsed)) {
      if (parsed.name) meta.name = String(parsed.name);
      if (parsed.audioSignalsEnabled !== undefined) meta.audioSignalsEnabled = !!parsed.audioSignalsEnabled;
    }

    const levels = levelsRaw.map((entry: any, idx: number) => {
      const level = parseInt(entry.level ?? entry.Level, 10);
      const lane = parseInt(entry.lane ?? entry.Lane ?? entry.bahn ?? entry.Bahn, 10);
      const speed = parseFloat(entry.speed ?? entry.Speed ?? 0);
      const duration = parseFloat(entry.duration ?? entry.Duration ?? 0);

      if (isNaN(level) || isNaN(lane)) {
        throw new Error(`JSON entry ${idx + 1}: missing or invalid "level"/"lane" field`);
      }

      return { level, lane, speed: isNaN(speed) ? 0 : speed, duration: isNaN(duration) ? 0 : duration };
    });

    return { levels, meta };
  }
}
