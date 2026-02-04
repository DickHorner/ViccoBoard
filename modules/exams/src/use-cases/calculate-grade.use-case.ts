import { Exams } from '@viccoboard/core';

export interface CalculateGradeResult {
  totalPoints: number;
  percentageScore: number;
  grade: string | number;
}

export class CalculateGradeUseCase {
  execute(totalPoints: number, gradingKey: Exams.GradingKey): CalculateGradeResult {
    const maxPoints = gradingKey.totalPoints || 0;
    const percentageScore = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;

    const grade = this.resolveGrade(totalPoints, percentageScore, gradingKey);

    return {
      totalPoints,
      percentageScore,
      grade
    };
  }

  private resolveGrade(
    totalPoints: number,
    percentageScore: number,
    gradingKey: Exams.GradingKey
  ): string | number {
    const boundaries = gradingKey.gradeBoundaries ?? [];
    if (boundaries.length === 0) {
      return Number.isFinite(percentageScore)
        ? Number(percentageScore.toFixed(2))
        : totalPoints;
    }

    const sorted = [...boundaries].sort((a, b) => {
      const aMetric = a.minPercentage ?? a.minPoints ?? 0;
      const bMetric = b.minPercentage ?? b.minPoints ?? 0;
      return bMetric - aMetric;
    });

    for (const boundary of sorted) {
      if (boundary.minPoints !== undefined && totalPoints >= boundary.minPoints) {
        return boundary.grade;
      }
      if (boundary.minPercentage !== undefined && percentageScore >= boundary.minPercentage) {
        return boundary.grade;
      }
    }

    return sorted[sorted.length - 1]?.grade ?? percentageScore;
  }
}
