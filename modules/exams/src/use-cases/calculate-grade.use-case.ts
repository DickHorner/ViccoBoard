import { Exams } from '@viccoboard/core';
import { GradingKeyService } from '../services/grading-key.service.js';

export interface CalculateGradeResult {
  totalPoints: number;
  percentageScore: number;
  grade: string | number;
}

export class CalculateGradeUseCase {
  execute(totalPoints: number, gradingKey: Exams.GradingKey): CalculateGradeResult {
    const result = GradingKeyService.calculateGrade(totalPoints, gradingKey);
    const boundary = gradingKey.gradeBoundaries?.find(b => b.displayValue === String(result.grade));
    const grade = boundary?.grade !== undefined ? boundary.grade : result.grade;

    return {
      totalPoints,
      percentageScore: result.percentage,
      grade
    };
  }
}
