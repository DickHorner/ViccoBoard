import { MittelstreckeGradingService } from '../src/services/mittelstrecke-grading.service';
import { Sport } from '@viccoboard/core';

describe('MittelstreckeGradingService', () => {
  let service: MittelstreckeGradingService;

  beforeEach(() => {
    service = new MittelstreckeGradingService();
  });

  describe('parseTimeString', () => {
    test('should parse mm:ss.cs format', () => {
      const result = service.parseTimeString('04:30.50');
      expect(result).toBe(270.5);
    });

    test('should parse mm:ss format without centiseconds', () => {
      const result = service.parseTimeString('04:30');
      expect(result).toBe(270);
    });

    test('should parse seconds with centiseconds', () => {
      const result = service.parseTimeString('270.50');
      expect(result).toBe(270.5);
    });

    test('should parse seconds without centiseconds', () => {
      const result = service.parseTimeString('270');
      expect(result).toBe(270);
    });

    test('should return null for invalid format', () => {
      expect(service.parseTimeString('invalid')).toBe(null);
      expect(service.parseTimeString('')).toBe(null);
      expect(service.parseTimeString('  ')).toBe(null);
    });

    test('should handle single-digit minutes', () => {
      const result = service.parseTimeString('4:30');
      expect(result).toBe(270);
    });
  });

  describe('formatTimeString', () => {
    test('should format seconds to mm:ss.cs', () => {
      const result = service.formatTimeString(270.5);
      expect(result).toBe('04:30.50');
    });

    test('should format integer seconds', () => {
      const result = service.formatTimeString(270);
      expect(result).toBe('04:30.00');
    });

    test('should handle zero seconds', () => {
      const result = service.formatTimeString(0);
      expect(result).toBe('00:00.00');
    });

    test('should handle sub-second precision', () => {
      const result = service.formatTimeString(270.05);
      expect(result).toBe('04:30.05');
    });
  });

  describe('calculateGradeFromTime', () => {
    let mockTable: Sport.TableDefinition;

    beforeEach(() => {
      mockTable = {
        id: 'test-table',
        name: 'Mittelstrecke Test',
        type: 'simple',
        source: 'local',
        dimensions: [],
        mappingRules: [],
        entries: [
          { key: { minTime: 240, maxTime: 270 }, value: '1' },
          { key: { minTime: 270, maxTime: 300 }, value: '2' },
          { key: { minTime: 300, maxTime: 330 }, value: '3' },
          { key: { minTime: 330, maxTime: 360 }, value: '4' },
          { key: { minTime: 360, maxTime: 400 }, value: '5' },
          { key: { minTime: 400 }, value: '6' }
        ],
        createdAt: new Date(),
        lastModified: new Date()
      };
    });

    test('should return correct grade for time in range', () => {
      const result = service.calculateGradeFromTime({
        timeInSeconds: 255,
        table: mockTable
      });

      expect(result.grade).toBe('1');
      expect(result.timeInSeconds).toBe(255);
    });

    test('should return correct grade for time at boundary', () => {
      const result = service.calculateGradeFromTime({
        timeInSeconds: 270,
        table: mockTable
      });

      // Should match first table entry where time is in range
      expect(result.grade).toBe('1');
    });

    test('should return worst grade for slow time', () => {
      const result = service.calculateGradeFromTime({
        timeInSeconds: 450,
        table: mockTable
      });

      expect(result.grade).toBe('6');
    });

    test('should throw error for negative time', () => {
      expect(() => {
        service.calculateGradeFromTime({
          timeInSeconds: -10,
          table: mockTable
        });
      }).toThrow('Time must be a non-negative number');
    });

    test('should throw error for invalid time (NaN)', () => {
      expect(() => {
        service.calculateGradeFromTime({
          timeInSeconds: NaN,
          table: mockTable
        });
      }).toThrow('Time must be a non-negative number');
    });

    test('should throw error when no matching entry found', () => {
      const timeOutOfRange = 200; // Before first entry
      expect(() => {
        service.calculateGradeFromTime({
          timeInSeconds: timeOutOfRange,
          table: mockTable
        });
      }).toThrow();
    });

    it('should handle context dimensions', () => {
      const tableWithContext: Sport.TableDefinition = {
        ...mockTable,
        entries: [
          // Gender-specific entries
          {
            key: { gender: 'male', minTime: 240, maxTime: 270 },
            value: '1-male'
          },
          {
            key: { gender: 'male', minTime: 270, maxTime: 300 },
            value: '2-male'
          },
          {
            key: { gender: 'female', minTime: 260, maxTime: 290 },
            value: '1-female'
          },
          {
            key: { gender: 'female', minTime: 290, maxTime: 320 },
            value: '2-female'
          },
          // Fallback entries without gender
          {
            key: { minTime: 300, maxTime: 330 },
            value: '3-any'
          }
        ]
      };

      const resultMale = service.calculateGradeFromTime({
        timeInSeconds: 255,
        table: tableWithContext,
        context: { gender: 'male' }
      });

      expect(resultMale.grade).toBe('1-male');

      const resultFemale = service.calculateGradeFromTime({
        timeInSeconds: 300,
        table: tableWithContext,
        context: { gender: 'female' }
      });

      expect(resultFemale.grade).toBe('2-female');

      // Without context, should use entry without gender
      const resultNoContext = service.calculateGradeFromTime({
        timeInSeconds: 315,
        table: tableWithContext,
        context: {}
      });

      expect(resultNoContext.grade).toBe('3-any');
    });
  });

  describe('validateTable', () => {
    test('should validate a correct table', () => {
      const table: Sport.TableDefinition = {
        id: 'test',
        name: 'Test',
        type: 'simple',
        source: 'local',
        dimensions: [],
        mappingRules: [],
        entries: [{ key: { minTime: 240 }, value: '1' }],
        createdAt: new Date(),
        lastModified: new Date()
      };

      expect(() => service.validateTable(table)).not.toThrow();
    });

    test('should throw error for empty table', () => {
      const table: Sport.TableDefinition = {
        id: 'test',
        name: 'Test',
        type: 'simple',
        source: 'local',
        dimensions: [],
        mappingRules: [],
        entries: [],
        createdAt: new Date(),
        lastModified: new Date()
      };

      expect(() => service.validateTable(table)).toThrow('Table must have at least one entry');
    });

    test('should throw error if entry has no time key', () => {
      const table: Sport.TableDefinition = {
        id: 'test',
        name: 'Test',
        type: 'simple',
        source: 'local',
        dimensions: [],
        mappingRules: [],
        entries: [{ key: { gender: 'male' }, value: '1' }],
        createdAt: new Date(),
        lastModified: new Date()
      };

      expect(() => service.validateTable(table)).toThrow(
        'At least one table entry key must contain a time dimension'
      );
    });
  });
});
