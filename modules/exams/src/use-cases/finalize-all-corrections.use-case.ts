import { Exams } from '@viccoboard/core';
import type { CorrectionEntryRepository } from '../repositories/correction-entry.repository';
import type { ExamRepository } from '../repositories/exam.repository';
import { getCorrectionRelevantTaskNodes } from '../utils/task-tree';
import { RecordCorrectionUseCase } from './record-correction.use-case-v2';

export interface FinalizeAllCorrectionsResult {
  savedCorrections: Exams.CorrectionEntry[];
  finalizedCount: number;
  createdCount: number;
}

export class FinalizeAllCorrectionsUseCase {
  constructor(
    private readonly examRepository: ExamRepository,
    private readonly correctionEntryRepository: CorrectionEntryRepository,
    private readonly recordCorrectionUseCase: RecordCorrectionUseCase
  ) {}

  async execute(examId: string): Promise<FinalizeAllCorrectionsResult> {
    const exam = await this.examRepository.findById(examId);
    if (!exam) {
      throw new Error(`Exam ${examId} not found`);
    }

    if (exam.candidates.length === 0) {
      throw new Error('Exam has no candidates');
    }

    const relevantTasks = getCorrectionRelevantTaskNodes(exam.structure.tasks);
    const existingCorrections = await this.correctionEntryRepository.findByExam(examId);
    const existingByCandidateId = new Map(
      existingCorrections.map((correction) => [correction.candidateId, correction])
    );

    const savedCorrections: Exams.CorrectionEntry[] = [];
    let createdCount = 0;

    for (const candidate of exam.candidates) {
      const existingCorrection = existingByCandidateId.get(candidate.id);
      if (!existingCorrection) {
        createdCount += 1;
      }

      const taskScores = relevantTasks.map((task) => {
        const existingTaskScore = existingCorrection?.taskScores.find((score) => score.taskId === task.id);

        return {
          taskId: task.id,
          points: existingTaskScore?.points ?? 0,
          maxPoints: task.points,
          alternativeGrading: existingTaskScore?.alternativeGrading,
          partialPoints: existingTaskScore?.partialPoints,
          criterionScores: task.criteria.length > 0
            ? task.criteria.map((criterion) => {
                const existingCriterionScore = existingTaskScore?.criterionScores?.find(
                  (score) => score.criterionId === criterion.id
                );

                return {
                  criterionId: criterion.id,
                  points: existingCriterionScore?.points ?? 0,
                  maxPoints: criterion.points,
                  subCriterionScores: existingCriterionScore?.subCriterionScores
                };
              })
            : existingTaskScore?.criterionScores,
          comment: existingTaskScore?.comment,
          timestamp: existingTaskScore?.timestamp ?? new Date()
        };
      });

      const comments = existingCorrection?.comments.map((comment) => ({
        id: comment.id,
        taskId: comment.taskId,
        level: comment.level,
        text: comment.text,
        printable: comment.printable,
        availableAfterReturn: comment.availableAfterReturn,
        timestamp: comment.timestamp
      })) ?? [];

      const supportTips = existingCorrection?.supportTips.map((supportTip) => ({
        supportTipId: supportTip.supportTipId,
        taskId: supportTip.taskId,
        subtaskId: supportTip.subtaskId,
        assignedAt: supportTip.assignedAt,
        weight: supportTip.weight,
        notes: supportTip.notes
      })) ?? [];

      const savedCorrection = await this.recordCorrectionUseCase.execute({
        examId,
        candidateId: candidate.id,
        taskScores,
        comments,
        supportTips,
        finalizeCorrection: true
      });

      savedCorrections.push(savedCorrection);
    }

    return {
      savedCorrections,
      finalizedCount: savedCorrections.length,
      createdCount
    };
  }
}
