import { Sport} from '@viccoboard/core';
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
  /**
   * Calculates the age from a birth year relative to a test date.
   * 
   * @param birthYear - The year of birth as a number
   * @param testDate - The reference date for age calculation (defaults to today)
   * @returns The calculated age as a non-negative integer
   * @throws {Error} If birthYear is not a finite number
   */
  calculateAgeFromBirthYear(birthYear: number, testDate: Date = new Date()): number {
    if (!Number.isFinite(birthYear)) {
      throw new Error('Birth year must be a number');
    }
    const age = testDate.getFullYear() - birthYear;
    return Math.max(0, age);
  }

  /**
   * Evaluates a student's performance against applicable standards for a discipline.
   * 
   * Filters standards based on discipline ID, gender, and age, then checks if the
   * performance value meets the required thresholds. For standards with comparison
   * type 'min', the performance value must be less than or equal to the threshold
   * (e.g., time-based disciplines where lower is better). For 'max' comparison,
   * the performance value must be greater than or equal to the threshold (e.g.,
   * distance or count-based disciplines where higher is better).
   * 
   * @param standards - Array of applicable Sportabzeichen standards to evaluate against
   * @param input - The student's performance input containing discipline ID, gender, age, and performance value
   * @returns The highest level achieved that meets the performance threshold, or 'none' if no threshold is met
   */
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

  /**
   * Builds a Sportabzeichen result from student performance data.
   * 
   * Calculates the student's age from their birth year at the test date,
   * evaluates their performance against applicable standards, and returns
   * a complete result object with all relevant metadata.
   * 
   * @param params - The parameters object containing:
   *   - studentId: Unique identifier for the student
   *   - disciplineId: Unique identifier for the discipline
   *   - birthYear: The year of birth as a number
   *   - gender: The student's gender (SportabzeichenGender)
   *   - performanceValue: The numeric performance value achieved
   *   - unit: The unit of measurement for the performance (e.g., 'seconds', 'meters')
   *   - testDate: Optional reference date for age calculation (defaults to today)
   *   - standards: Array of Sportabzeichen standards to evaluate against
   * @returns A partial SportabzeichenResult object with id, createdAt, and lastModified omitted
   * @see calculateAgeFromBirthYear
   * @see evaluatePerformance
   */
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

  /**
   * Calculates the overall Sportabzeichen level from individual discipline results.
   * 
   * Determines the overall achievement level by finding the minimum (weakest) level
   * across all discipline results. This follows the principle that the overall badge
   * is limited by the weakest performance. For example, if a student achieves gold,
   * silver, and bronze across three disciplines, their overall level is bronze.
   * 
   * @param results - Array of individual discipline results to evaluate
   * @returns The overall level (none, bronze, silver, or gold), or 'none' if results array is empty
   */
  calculateOverallLevel(results: Sport.SportabzeichenResult[]): Sport.SportabzeichenLevel {
    if (results.length === 0) return 'none';
    return results.reduce((current, result) => {
      return LEVEL_ORDER[result.achievedLevel] < LEVEL_ORDER[current]
        ? result.achievedLevel
        : current;
    }, 'gold' as Sport.SportabzeichenLevel);
  }

  /**
   * Generates a PDF document containing an overview of Sportabzeichen results.
   * 
   * Creates a formatted PDF report displaying the Sportabzeichen achievements for multiple
   * students. The document includes a title, generation timestamp, and for each student:
   * their name, age, gender, overall achievement level, and individual discipline results.
   * Content automatically pages when necessary to fit within page margins.
   * 
   * @param report - The SportabzeichenReport object containing the report data
   *   - title: The heading for the PDF document
   *   - generatedAt: Timestamp of when the report was generated
   *   - entries: Array of student results with discipline-level achievements
   * @returns A promise that resolves to a Uint8Array containing the binary PDF data
   * @throws May throw errors from pdf-lib if document creation or font embedding fails
   */
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
