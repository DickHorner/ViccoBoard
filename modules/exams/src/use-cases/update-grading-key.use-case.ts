/**
 * Update Grading Key Use Case
 * Handles updating an exam's grading key, recording revision history persistently,
 * recalculating grades for all existing correction entries in cascade,
 * and saving updated correction entries and exam back to repositories.
 */

import { Exams } from '@viccoboard/core';
const uuidv4 = () => crypto.randomUUID();
import { GradingKeyEngine, type GradingKeyChange } from '../services/grading-key-engine.service.js';
import { GradingKeyService } from '../services/grading-key.service.js';
import type { ExamRepository } from '../repositories/exam.repository.js';
import type { CorrectionEntryRepository } from '../repositories/correction-entry.repository.js';

export interface UpdateGradingKeyInput {
  examId: string;
  newGradingKey: Partial<Exams.GradingKey>;
  reason?: string;
  changedBy?: string;
}

export interface UpdateGradingKeyResult {
  exam: Exams.Exam;
  affectedCorrectionsCount: number;
  affectedGrades: Array<{ candidateId: string; oldGrade: string | number; newGrade: string | number }>;
  changeLog?: GradingKeyChange;
}

export class UpdateGradingKeyUseCase {
  constructor(
    private examRepo: ExamRepository,
    private correctionRepo: CorrectionEntryRepository
  ) {}

  async execute(input: UpdateGradingKeyInput): Promise<UpdateGradingKeyResult> {
    const exam = await this.examRepo.findById(input.examId);
    if (!exam) {
      throw new Error(`Exam with ID ${input.examId} not found`);
    }

    const oldKey = exam.gradingKey;
    const corrections = await this.correctionRepo.findByExam(input.examId);
    const hasCorrections = corrections.length > 0;

    // Merge new grading key settings
    const targetBoundaries = input.newGradingKey.gradeBoundaries ?? oldKey.gradeBoundaries;
    const isModifiedAfterCorrection = hasCorrections || oldKey.modifiedAfterCorrection;

    const newKey: Exams.GradingKey = {
      ...oldKey,
      ...input.newGradingKey,
      gradeBoundaries: targetBoundaries,
      modifiedAfterCorrection: isModifiedAfterCorrection
    };

    // Record persistent change log if boundaries/type/rules changed or corrections exist
    let changeLog: GradingKeyChange | undefined;
    const comparison = GradingKeyEngine.compareGradingKeys(oldKey, newKey);

    if (!comparison.isSame || hasCorrections) {
      changeLog = {
        id: uuidv4(),
        timestamp: new Date(),
        previousKey: oldKey,
        newKey: newKey,
        reason: input.reason || (hasCorrections ? 'Notenschlüssel nach Korrektur angepasst' : 'Notenschlüssel geändert'),
        changedBy: input.changedBy
      };

      const existingHistory = (oldKey.history || GradingKeyEngine.getChangeHistory(oldKey.id)) as GradingKeyChange[];
      newKey.history = [...existingHistory, changeLog];
    }

    // Cascade recalculate grades for all existing corrections
    const affectedGrades: Array<{ candidateId: string; oldGrade: string | number; newGrade: string | number }> = [];

    for (const correction of corrections) {
      const oldGrade = correction.totalGrade;
      const newGradeResult = GradingKeyService.calculateGrade(correction.totalPoints, newKey);

      if (oldGrade !== newGradeResult.grade || correction.percentageScore !== newGradeResult.percentage) {
        if (oldGrade !== newGradeResult.grade) {
          affectedGrades.push({
            candidateId: correction.candidateId,
            oldGrade,
            newGrade: newGradeResult.grade
          });
        }

        const updatedCorrection: Exams.CorrectionEntry = {
          ...correction,
          totalGrade: newGradeResult.grade,
          percentageScore: newGradeResult.percentage,
          lastModified: new Date()
        };

        await this.correctionRepo.update(correction.id, updatedCorrection);
      }
    }

    // Update exam with new key
    const updatedExam: Exams.Exam = {
      ...exam,
      gradingKey: newKey,
      lastModified: new Date()
    };

    await this.examRepo.update(updatedExam.id, updatedExam);

    return {
      exam: updatedExam,
      affectedCorrectionsCount: affectedGrades.length,
      affectedGrades,
      changeLog
    };
  }

  async revert(examId: string, reason?: string, changedBy?: string): Promise<UpdateGradingKeyResult> {
    const exam = await this.examRepo.findById(examId);
    if (!exam) {
      throw new Error(`Exam with ID ${examId} not found`);
    }

    const currentKey = exam.gradingKey;
    const revertedKey = GradingKeyEngine.revertToPreviousGradingKey(currentKey, reason, changedBy);
    if (!revertedKey) {
      throw new Error(`No previous grading key revision found for exam ${examId}`);
    }

    const corrections = await this.correctionRepo.findByExam(examId);
    const affectedGrades: Array<{ candidateId: string; oldGrade: string | number; newGrade: string | number }> = [];

    for (const correction of corrections) {
      const oldGrade = correction.totalGrade;
      const newGradeResult = GradingKeyService.calculateGrade(correction.totalPoints, revertedKey);

      if (oldGrade !== newGradeResult.grade || correction.percentageScore !== newGradeResult.percentage) {
        if (oldGrade !== newGradeResult.grade) {
          affectedGrades.push({
            candidateId: correction.candidateId,
            oldGrade,
            newGrade: newGradeResult.grade
          });
        }

        const updatedCorrection: Exams.CorrectionEntry = {
          ...correction,
          totalGrade: newGradeResult.grade,
          percentageScore: newGradeResult.percentage,
          lastModified: new Date()
        };

        await this.correctionRepo.update(correction.id, updatedCorrection);
      }
    }

    const updatedExam: Exams.Exam = {
      ...exam,
      gradingKey: revertedKey,
      lastModified: new Date()
    };

    await this.examRepo.update(updatedExam.id, updatedExam);

    const history = revertedKey.history as GradingKeyChange[];
    const changeLog = history ? history[history.length - 1] : undefined;

    return {
      exam: updatedExam,
      affectedCorrectionsCount: affectedGrades.length,
      affectedGrades,
      changeLog
    };
  }
}
