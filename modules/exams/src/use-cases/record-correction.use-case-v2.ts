/**
 * Record Correction Use Case
 * Handles recording corrections and calculating grades for a candidate
 */

import { Exams } from '@viccoboard/core';
import { v4 as uuidv4 } from 'uuid';
import { GradingKeyService } from '../services/grading-key.service';
import type { CorrectionEntryRepository } from '../repositories/correction-entry.repository';
import type { ExamRepository } from '../repositories/exam.repository';

export class RecordCorrectionUseCase {
  constructor(
    private correctionRepo: CorrectionEntryRepository,
    private examRepo: ExamRepository
  ) {}

  async execute(input: RecordCorrectionInput): Promise<Exams.CorrectionEntry> {
    // Get current correction entry or create new
    let correction = await this.correctionRepo.findByExamAndCandidate(
      input.examId,
      input.candidateId
    );

    // Get exam for grading key
    const exam = await this.examRepo.findById(input.examId);
    if (!exam) {
      throw new Error(`Exam ${input.examId} not found`);
    }

    // Create new if doesn't exist
    if (!correction) {
      correction = {
        id: uuidv4(),
        examId: input.examId,
        candidateId: input.candidateId,
        taskScores: [],
        totalPoints: 0,
        totalGrade: 'N/A',
        percentageScore: 0,
        comments: [],
        supportTips: [],
        status: 'in-progress',
        lastModified: new Date()
      };
    }

    // Update task scores
    if (input.taskScores && input.taskScores.length > 0) {
      correction.taskScores = input.taskScores;
    }

    // Calculate total points
    correction.totalPoints = correction.taskScores.reduce((sum, ts) => sum + ts.points, 0);

    // Calculate grade
    const gradeResult = GradingKeyService.calculateGrade(
      correction.totalPoints,
      exam.gradingKey
    );
    correction.totalGrade = gradeResult.grade;
    correction.percentageScore = gradeResult.percentage;

    // Add comments if provided
    if (input.comments && input.comments.length > 0) {
      correction.comments = [
        ...correction.comments,
        ...input.comments.map(c => ({
          id: uuidv4(),
          ...c,
          timestamp: new Date()
        }))
      ];
    }

    // Assign support tips if provided
    if (input.supportTips && input.supportTips.length > 0) {
      correction.supportTips = input.supportTips.map(st => ({
        ...st,
        assignedAt: new Date()
      }));
    }

    // Update timestamps
    correction.lastModified = new Date();
    if (input.finalizeCorrection) {
      correction.status = 'completed';
      correction.correctedAt = new Date();
    }

    // Save to repository
    const existing = await this.correctionRepo.findById(correction.id);
    if (existing) {
      await this.correctionRepo.update(correction.id, correction);
    } else {
      await this.correctionRepo.create(correction);
    }

    return correction;
  }
}

export interface RecordCorrectionInput {
  examId: string;
  candidateId: string;
  taskScores?: Exams.TaskScore[];
  comments?: Omit<Exams.CorrectionComment, 'id' | 'timestamp'>[];
  supportTips?: Omit<Exams.AssignedSupportTip, 'assignedAt'>[];
  finalizeCorrection?: boolean;
}
