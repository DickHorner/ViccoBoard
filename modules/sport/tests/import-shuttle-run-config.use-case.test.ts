import { ImportShuttleRunConfigUseCase } from '../src/use-cases/import-shuttle-run-config.use-case.js';
import type { Sport } from '@viccoboard/core';

// Mock repository
class MockShuttleRunConfigRepository {
  private configs: Sport.ShuttleRunConfig[] = [];
  private nextId = 0;

  async create(partial: Partial<Sport.ShuttleRunConfig>): Promise<Sport.ShuttleRunConfig> {
    const now = new Date();
    const config: Sport.ShuttleRunConfig = {
      id: `config-${++this.nextId}`,
      name: partial.name ?? '',
      levels: partial.levels ?? [],
      audioSignalsEnabled: partial.audioSignalsEnabled ?? true,
      source: partial.source ?? 'imported',
      createdAt: now,
      lastModified: now
    };
    this.configs.push(config);
    return config;
  }

  async findById(id: string): Promise<Sport.ShuttleRunConfig | null> {
    return this.configs.find(c => c.id === id) ?? null;
  }

  all(): Sport.ShuttleRunConfig[] {
    return this.configs;
  }
}

// ─── parseCsv unit tests ────────────────────────────────────────────────────

describe('ImportShuttleRunConfigUseCase.parseCsv', () => {
  it('parses a standard CSV with all columns', () => {
    const csv = 'level,lane,speed,duration\n1,1,8.0,9\n1,2,8.0,8\n2,1,9.0,8';
    const levels = ImportShuttleRunConfigUseCase.parseCsv(csv);
    expect(levels).toHaveLength(3);
    expect(levels[0]).toEqual({ level: 1, lane: 1, speed: 8.0, duration: 9 });
    expect(levels[2]).toEqual({ level: 2, lane: 1, speed: 9.0, duration: 8 });
  });

  it('parses CSV with only level and lane columns (no speed/duration)', () => {
    const csv = 'level,lane\n1,1\n2,3';
    const levels = ImportShuttleRunConfigUseCase.parseCsv(csv);
    expect(levels).toHaveLength(2);
    expect(levels[0]).toEqual({ level: 1, lane: 1, speed: 0, duration: 0 });
  });

  it('handles Windows-style CRLF line endings', () => {
    const csv = 'level,lane,speed,duration\r\n1,1,8.0,9\r\n2,2,9.0,8';
    const levels = ImportShuttleRunConfigUseCase.parseCsv(csv);
    expect(levels).toHaveLength(2);
  });

  it('ignores empty trailing lines', () => {
    const csv = 'level,lane,speed,duration\n1,1,8.0,9\n\n\n';
    const levels = ImportShuttleRunConfigUseCase.parseCsv(csv);
    expect(levels).toHaveLength(1);
  });

  it('throws when CSV has no header row', () => {
    expect(() => ImportShuttleRunConfigUseCase.parseCsv('1,1,8.0,9')).toThrow(
      'CSV must contain a header row'
    );
  });

  it('throws when required columns are missing', () => {
    const csv = 'speed,duration\n8.0,9';
    expect(() => ImportShuttleRunConfigUseCase.parseCsv(csv)).toThrow(
      '"level" and "lane" columns'
    );
  });

  it('throws when level value is not a number', () => {
    const csv = 'level,lane,speed,duration\nabc,1,8.0,9';
    expect(() => ImportShuttleRunConfigUseCase.parseCsv(csv)).toThrow(
      'Invalid level or lane value'
    );
  });
});

// ─── parseJson unit tests ────────────────────────────────────────────────────

describe('ImportShuttleRunConfigUseCase.parseJson', () => {

  it('parses a top-level array of levels', () => {
    const json = JSON.stringify([
      { level: 1, lane: 1, speed: 8.0, duration: 9 },
      { level: 2, lane: 2, speed: 9.0, duration: 8 }
    ]);
    const { levels } = ImportShuttleRunConfigUseCase.parseJson(json);
    expect(levels).toHaveLength(2);
    expect(levels[0]).toEqual({ level: 1, lane: 1, speed: 8.0, duration: 9 });
  });

  it('parses an object with a levels array', () => {
    const json = JSON.stringify({
      name: 'Standard 20m',
      audioSignalsEnabled: false,
      levels: [{ level: 1, lane: 1, speed: 8.0, duration: 9 }]
    });
    const { levels, meta } = ImportShuttleRunConfigUseCase.parseJson(json);
    expect(levels).toHaveLength(1);
    // metadata from JSON should be returned in meta, not mutate caller input
    expect(meta.name).toBe('Standard 20m');
    expect(meta.audioSignalsEnabled).toBe(false);
  });

  it('accepts German field aliases (bahn)', () => {
    const json = JSON.stringify([{ level: 1, bahn: 2, speed: 8.0, duration: 9 }]);
    const { levels } = ImportShuttleRunConfigUseCase.parseJson(json);
    expect(levels[0].lane).toBe(2);
  });

  it('throws on invalid JSON', () => {
    expect(() => ImportShuttleRunConfigUseCase.parseJson('not json')).toThrow(
      'Invalid JSON content'
    );
  });

  it('throws when JSON has no levels array', () => {
    const json = JSON.stringify({ foo: 'bar' });
    expect(() => ImportShuttleRunConfigUseCase.parseJson(json)).toThrow(
      '"levels" array'
    );
  });

  it('throws on missing level field in entry', () => {
    const json = JSON.stringify([{ lane: 1, speed: 8 }]);
    expect(() => ImportShuttleRunConfigUseCase.parseJson(json)).toThrow(
      'level'
    );
  });
});

// ─── execute integration tests ────────────────────────────────────────────────

describe('ImportShuttleRunConfigUseCase.execute', () => {
  let repo: MockShuttleRunConfigRepository;
  let useCase: ImportShuttleRunConfigUseCase;

  beforeEach(() => {
    repo = new MockShuttleRunConfigRepository();
    useCase = new ImportShuttleRunConfigUseCase(repo as any);
  });

  it('imports a CSV and persists the config', async () => {
    const csv = 'level,lane,speed,duration\n1,1,8.0,9\n1,2,8.5,8';
    const result = await useCase.execute({
      rawContent: csv,
      format: 'csv',
      name: 'My Import'
    });

    expect(result.levelsImported).toBe(2);
    expect(result.config.name).toBe('My Import');
    expect(result.config.source).toBe('imported');
    expect(result.config.levels).toHaveLength(2);
    expect(repo.all()).toHaveLength(1);
  });

  it('imports a JSON and persists the config', async () => {
    const json = JSON.stringify({
      name: 'JSON Config',
      audioSignalsEnabled: false,
      levels: [{ level: 1, lane: 1, speed: 8.0, duration: 9 }]
    });
    const result = await useCase.execute({
      rawContent: json,
      format: 'json',
      name: 'JSON Config'
    });

    expect(result.levelsImported).toBe(1);
    expect(result.config.audioSignalsEnabled).toBe(false);
  });

  it('throws when content is empty', async () => {
    await expect(
      useCase.execute({ rawContent: '', format: 'csv', name: 'x' })
    ).rejects.toThrow('File content is empty');
  });

  it('throws when CSV has only a header and no data rows', async () => {
    await expect(
      useCase.execute({ rawContent: 'level,lane\n', format: 'csv', name: 'x' })
    ).rejects.toThrow('CSV must contain a header row and at least one data row');
  });

  it('sets audioSignalsEnabled to true by default', async () => {
    const csv = 'level,lane\n1,1';
    const result = await useCase.execute({ rawContent: csv, format: 'csv', name: 'x' });
    expect(result.config.audioSignalsEnabled).toBe(true);
  });
});
