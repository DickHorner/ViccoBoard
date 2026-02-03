import { Sport } from '@viccoboard/core';
import { PDFDocument, StandardFonts } from 'pdf-lib';

export interface SportabzeichenPerformanceInput {
  disciplineId: string;
  gender: Sport.SportabzeichenGender;
  age: number;
  performanceValue: number;
}

export interface SportabzeichenReportEntry {
  studentName: string;
  age: number;
  gender: Sport.SportabzeichenGender;
  results: Array<{
    disciplineName: string;
    performance: string;
    level: Sport.SportabzeichenLevel;
  }>;
  overallLevel: Sport.SportabzeichenLevel;
}

export interface SportabzeichenReport {
  title: string;
  generatedAt: Date;
  entries: SportabzeichenReportEntry[];
}

const LEVEL_ORDER: Record<Sport.SportabzeichenLevel, number> = {
  none: 0,
  bronze: 1,
  silver: 2,
  gold: 3
};

export class SportabzeichenService {
  calculateAgeFromBirthYear(birthYear: number, testDate: Date = new Date()): number {
    if (!Number.isFinite(birthYear)) {
      throw new Error('Birth year must be a number');
    }
    const age = testDate.getFullYear() - birthYear;
    return Math.max(0, age);
  }

  evaluatePerformance(
    standards: Sport.SportabzeichenStandard[],
    input: SportabzeichenPerformanceInput
  ): Sport.SportabzeichenLevel {
    const applicable = standards.filter((standard) => {
      const genderMatch = standard.gender === 'any' || standard.gender === input.gender;
      const ageMatch = input.age >= standard.ageMin && input.age <= standard.ageMax;
      return standard.disciplineId === input.disciplineId && genderMatch && ageMatch;
    });

    let best: Sport.SportabzeichenLevel = 'none';

    for (const standard of applicable) {
      const meets = standard.comparison === 'min'
        ? input.performanceValue <= standard.threshold
        : input.performanceValue >= standard.threshold;

      if (meets && LEVEL_ORDER[standard.level] > LEVEL_ORDER[best]) {
        best = standard.level;
      }
    }

    return best;
  }

  buildResult(params: {
    studentId: string;
    disciplineId: string;
    birthYear: number;
    gender: Sport.SportabzeichenGender;
    performanceValue: number;
    unit: string;
    testDate?: Date;
    standards: Sport.SportabzeichenStandard[];
  }): Omit<Sport.SportabzeichenResult, 'id' | 'createdAt' | 'lastModified'> {
    const testDate = params.testDate ?? new Date();
    const ageAtTest = this.calculateAgeFromBirthYear(params.birthYear, testDate);
    const achievedLevel = this.evaluatePerformance(params.standards, {
      disciplineId: params.disciplineId,
      gender: params.gender,
      age: ageAtTest,
      performanceValue: params.performanceValue
    });

    return {
      studentId: params.studentId,
      disciplineId: params.disciplineId,
      testDate,
      ageAtTest,
      gender: params.gender,
      performanceValue: params.performanceValue,
      unit: params.unit,
      achievedLevel
    };
  }

  calculateOverallLevel(results: Sport.SportabzeichenResult[]): Sport.SportabzeichenLevel {
    if (results.length === 0) return 'none';
    return results.reduce((current, result) => {
      return LEVEL_ORDER[result.achievedLevel] < LEVEL_ORDER[current]
        ? result.achievedLevel
        : current;
    }, 'gold' as Sport.SportabzeichenLevel);
  }

  async generateOverviewPdf(report: SportabzeichenReport): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);

    const pageMargin = 40;
    const lineHeight = 16;
    let page = doc.addPage();
    let { height } = page.getSize();
    let y = height - pageMargin;

    const drawLine = (text: string, size = 12) => {
      if (y < pageMargin) {
        page = doc.addPage();
        ({ height } = page.getSize());
        y = height - pageMargin;
      }
      page.drawText(text, { x: pageMargin, y, size, font });
      y -= lineHeight;
    };

    drawLine(report.title, 16);
    drawLine(`Generated: ${report.generatedAt.toISOString()}`, 10);
    y -= lineHeight / 2;

    for (const entry of report.entries) {
      drawLine(`${entry.studentName} (${entry.age}, ${entry.gender}) - ${entry.overallLevel.toUpperCase()}`);
      for (const result of entry.results) {
        drawLine(`  ${result.disciplineName}: ${result.performance} -> ${result.level.toUpperCase()}`, 10);
      }
      y -= lineHeight / 2;
    }

    return doc.save();
  }
}
