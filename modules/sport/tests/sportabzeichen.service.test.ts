import { SportabzeichenService } from '../src/services/sportabzeichen.service';
import { Sport } from '@viccoboard/core';

describe('SportabzeichenService', () => {
  const standards: Sport.SportabzeichenStandard[] = [
    {
      id: 'std-1',
      disciplineId: 'run',
      gender: 'any',
      ageMin: 12,
      ageMax: 13,
      level: 'bronze',
      comparison: 'max',
      threshold: 2000,
      unit: 'm',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      lastModified: new Date('2026-01-01T00:00:00.000Z')
    },
    {
      id: 'std-2',
      disciplineId: 'run',
      gender: 'any',
      ageMin: 12,
      ageMax: 13,
      level: 'silver',
      comparison: 'max',
      threshold: 2400,
      unit: 'm',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      lastModified: new Date('2026-01-01T00:00:00.000Z')
    },
    {
      id: 'std-3',
      disciplineId: 'run',
      gender: 'any',
      ageMin: 12,
      ageMax: 13,
      level: 'gold',
      comparison: 'max',
      threshold: 2600,
      unit: 'm',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      lastModified: new Date('2026-01-01T00:00:00.000Z')
    },
    {
      id: 'std-4',
      disciplineId: 'swim',
      gender: 'any',
      ageMin: 12,
      ageMax: 13,
      level: 'bronze',
      comparison: 'min',
      threshold: 90,
      unit: 's',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      lastModified: new Date('2026-01-01T00:00:00.000Z')
    }
  ];

  test('calculates age from birth year', () => {
    const service = new SportabzeichenService();
    const age = service.calculateAgeFromBirthYear(2012, new Date('2026-06-01T00:00:00.000Z'));
    expect(age).toBe(14);
  });

  test('evaluates performance against standards', () => {
    const service = new SportabzeichenService();
    const level = service.evaluatePerformance(standards, {
      disciplineId: 'run',
      gender: 'any',
      age: 12,
      performanceValue: 2500
    });
    expect(level).toBe('silver');
  });

  test('supports min-comparison standards', () => {
    const service = new SportabzeichenService();
    const level = service.evaluatePerformance(standards, {
      disciplineId: 'swim',
      gender: 'any',
      age: 12,
      performanceValue: 85
    });
    expect(level).toBe('bronze');
  });

  test('calculates overall level from results', () => {
    const service = new SportabzeichenService();
    const results: Sport.SportabzeichenResult[] = [
      {
        id: 'r1',
        studentId: 's1',
        disciplineId: 'run',
        testDate: new Date('2026-01-01T00:00:00.000Z'),
        ageAtTest: 12,
        gender: 'any',
        performanceValue: 2400,
        unit: 'm',
        achievedLevel: 'silver',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        lastModified: new Date('2026-01-01T00:00:00.000Z')
      },
      {
        id: 'r2',
        studentId: 's1',
        disciplineId: 'swim',
        testDate: new Date('2026-01-01T00:00:00.000Z'),
        ageAtTest: 12,
        gender: 'any',
        performanceValue: 85,
        unit: 's',
        achievedLevel: 'bronze',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        lastModified: new Date('2026-01-01T00:00:00.000Z')
      }
    ];

    const overall = service.calculateOverallLevel(results);
    expect(overall).toBe('bronze');
  });

  test('generates a PDF overview', async () => {
    const service = new SportabzeichenService();
    const pdf = await service.generateOverviewPdf({
      title: 'Sportabzeichen Overview',
      generatedAt: new Date('2026-01-01T00:00:00.000Z'),
      entries: [
        {
          studentName: 'Jamie Doe',
          age: 12,
          gender: 'any',
          overallLevel: 'silver',
          results: [
            { disciplineName: 'Run', performance: '2500 m', level: 'silver' }
          ]
        }
      ]
    });

    expect(pdf.byteLength).toBeGreaterThan(0);
  });
});
