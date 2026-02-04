import { Exams } from '@viccoboard/core';
import { v4 as uuidv4 } from 'uuid';
import { CorrectionEntryRepository } from '../repositories/correction-entry.repository';
import { CalculateGradeUseCase } from './calculate-grade.use-case';

export interface RecordCorrectionInput {
  examId: string;
  candidateId: string;
  taskScores: Exams.TaskScore[];
  gradingKey: Exams.GradingKey;
  comments?: Exams.CorrectionComment[];
  supportTips?: Exams.AssignedSupportTip[];
  highlightedWork?: Exams.HighlightedWork[];
  correctedBy?: string;
  status?: Exams.CorrectionEntry['status'];
}

export class RecordCorrectionUseCase {
  private calculateGrade: CalculateGradeUseCase;

  constructor(private repository: CorrectionEntryRepository) {
    this.calculateGrade = new CalculateGradeUseCase();
  }

  async execute(input: RecordCorrectionInput): Promise<Exams.CorrectionEntry> {
    const totalPoints = input.taskScores.reduce((sum, task) => sum + (task.points || 0), 0);
    const result = this.calculateGrade.execute(totalPoints, input.gradingKey);

    const now = new Date();
    const entry: Exams.CorrectionEntry = {
      id: uuidv4(),
      examId: input.examId,
      candidateId: input.candidateId,
      taskScores: input.taskScores,
      totalPoints: result.totalPoints,
      totalGrade: result.grade,
      percentageScore: result.percentageScore,
      comments: input.comments ?? [],
      supportTips: input.supportTips ?? [],
      highlightedWork: input.highlightedWork,
      status: input.status ?? 'in-progress',
      correctedBy: input.correctedBy,
      correctedAt: now,
      lastModified: now
    };

    await this.repository.createEntry(entry);
    return entry;
  }
}

