import { ShuttleRunService } from '../src/services/shuttle-run.service';
import { Sport} from '@viccoboard/core';

describe('ShuttleRunService', () => {
  const config: Sport.ShuttleRunConfig = {
    id: 'config-1',
    name: 'Standard',
    levels: [
      { level: 1, lane: 1, speed: 8, duration: 9 },
      { level: 2, lane: 2, speed: 9, duration: 8 }
    ],
    audioSignalsEnabled: true,
    source: 'default',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    lastModified: new Date('2026-01-01T00:00:00.000Z')
  };

  const table: Sport.TableDefinition = {
    id: 'table-1',
    name: 'Shuttle Grades',
    type: 'simple',
    source: 'local',
    dimensions: [],
    mappingRules: [],
    entries: [
      { key: { level: 1, lane: 1 }, value: '2' },
      { key: { level: 2, lane: 2 }, value: '1' }
    ],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    lastModified: new Date('2026-01-01T00:00:00.000Z')
  };

  test('validates a correct result', () => {
    const service = new ShuttleRunService();
    expect(() => service.validateResult(config, 1, 1)).not.toThrow();
  });

  test('rejects an invalid result', () => {
    const service = new ShuttleRunService();
    expect(() => service.validateResult(config, 3, 1)).toThrow('Invalid shuttle run result');
  });

  test('builds a result with timestamp', () => {
    const service = new ShuttleRunService();
    const result = service.buildResult(config, 2, 2);
    expect(result.level).toBe(2);
    expect(result.lane).toBe(2);
    expect(result.timestamp).toBeInstanceOf(Date);
  });

  test('calculates grade from table', () => {
    const service = new ShuttleRunService();
    const grade = service.calculateGradeFromTable(table, 2, 2);
    expect(grade).toBe('1');
  });
});
