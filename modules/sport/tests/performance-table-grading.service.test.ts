import type { Sport } from '@viccoboard/core';
import { PerformanceTableGradingService } from '../src/services/performance-table-grading.service';

describe('PerformanceTableGradingService', () => {
  const service = new PerformanceTableGradingService();

  function createTable(entries: Sport.TableEntry[]): Sport.TableDefinition {
    return {
      id: 'table-1',
      name: 'Test',
      type: 'simple',
      source: 'local',
      active: true,
      dimensions: [],
      mappingRules: [],
      entries,
      createdAt: new Date(),
      lastModified: new Date()
    };
  }

  test('grades a higher-is-better numeric measurement from minValue thresholds', () => {
    const table = createTable([
      { key: { minValue: 15 }, value: 1 },
      { key: { minValue: 12, maxValue: 14.99 }, value: 2 },
      { key: { minValue: 9, maxValue: 11.99 }, value: 3 },
      { key: { maxValue: 8.99 }, value: 4 }
    ]);

    expect(service.calculateGrade({ value: 15, table, measurementType: 'number' }).grade).toBe(1);
    expect(service.calculateGrade({ value: 12, table, measurementType: 'number' }).grade).toBe(2);
  });

  test('grades a lower-is-better time measurement from maxTime ranges', () => {
    const table = createTable([
      { key: { maxTime: 12.5 }, value: 1 },
      { key: { minTime: 12.51, maxTime: 13.5 }, value: 2 },
      { key: { minTime: 13.51 }, value: 3 }
    ]);

    expect(service.calculateGrade({ value: 12.3, table, measurementType: 'time' }).grade).toBe(1);
    expect(service.calculateGrade({ value: 13, table, measurementType: 'time' }).grade).toBe(2);
  });

  test('respects context columns such as gender', () => {
    const table = createTable([
      { key: { gender: 'm', maxTime: 12.5 }, value: 1 },
      { key: { gender: 'f', maxTime: 13.5 }, value: 1 }
    ]);

    expect(
      service.calculateGrade({
        value: 13,
        table,
        measurementType: 'time',
        context: { gender: 'f' }
      }).grade
    ).toBe(1);

    expect(() =>
      service.calculateGrade({
        value: 13,
        table,
        measurementType: 'time',
        context: { gender: 'm' }
      })
    ).toThrow('No matching grading table entry');
  });

  test('rejects rows without a measurement boundary', () => {
    const table = createTable([{ key: { gender: 'm' }, value: 1 }]);

    expect(() =>
      service.calculateGrade({
        value: 10,
        table,
        measurementType: 'number',
        context: { gender: 'm' }
      })
    ).toThrow('No matching grading table entry');
  });
});
