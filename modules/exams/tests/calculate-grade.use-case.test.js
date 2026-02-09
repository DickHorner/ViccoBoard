import { Exams } from '@viccoboard/core';
import { CalculateGradeUseCase } from '../src/use-cases/calculate-grade.use-case';
describe('CalculateGradeUseCase', () => {
    it('calculates percentage when no boundaries are provided', () => {
        const gradingKey = {
            id: 'g1',
            name: 'default',
            type: Exams.GradingKeyType.Points,
            totalPoints: 100,
            gradeBoundaries: [],
            roundingRule: { type: 'none', decimalPlaces: 0 },
            errorPointsToGrade: false,
            customizable: true,
            modifiedAfterCorrection: false
        };
        const useCase = new CalculateGradeUseCase();
        const result = useCase.execute(75, gradingKey);
        expect(result.percentageScore).toBeCloseTo(75, 2);
        expect(result.grade).toBe(75);
    });
    it('picks the best matching boundary', () => {
        const gradingKey = {
            id: 'g2',
            name: 'boundaries',
            type: Exams.GradingKeyType.Points,
            totalPoints: 50,
            gradeBoundaries: [
                { grade: 1, minPercentage: 90, displayValue: '1' },
                { grade: 2, minPercentage: 75, displayValue: '2' },
                { grade: 3, minPercentage: 60, displayValue: '3' }
            ],
            roundingRule: { type: 'none', decimalPlaces: 0 },
            errorPointsToGrade: false,
            customizable: true,
            modifiedAfterCorrection: false
        };
        const useCase = new CalculateGradeUseCase();
        const result = useCase.execute(40, gradingKey);
        expect(result.grade).toBe(2);
    });
});
