import { Exams } from '@viccoboard/core';
import { GradingKeyService } from '../services/grading-key.service.js';
import type { ExamRepository } from '../repositories/exam.repository.js';
import type { CorrectionEntryRepository } from '../repositories/correction-entry.repository.js';
import { getCorrectionRelevantTaskNodes } from '../utils/task-tree.js';

export interface PointAdjustment {
  taskId: string;
  suggestedPoints: number;
}

export interface ApplyPointAdjustmentsInput {
  examId: string;
  adjustments: PointAdjustment[];
}

/** Persists a reviewed point redistribution while preserving every achieved-score ratio. */
export class ApplyPointAdjustmentsUseCase {
  constructor(
    private readonly examRepository: ExamRepository,
    private readonly correctionRepository: CorrectionEntryRepository
  ) {}

  async execute(input: ApplyPointAdjustmentsInput): Promise<Exams.Exam> {
    const exam = await this.examRepository.findById(input.examId);
    if (!exam) throw new Error(`Exam with ID ${input.examId} not found`);

    const requested = new Map(input.adjustments.map((adjustment) => [adjustment.taskId, adjustment.suggestedPoints]));
    const relevantTasks = getCorrectionRelevantTaskNodes(exam.structure.tasks);
    for (const [taskId, points] of requested) {
      if (!relevantTasks.some((task) => task.id === taskId)) throw new Error(`Task ${taskId} is not adjustable`);
      if (!Number.isFinite(points) || points <= 0) throw new Error(`Task ${taskId} requires a positive point value`);
    }

    const oldMaxByTask = new Map(relevantTasks.map((task) => [task.id, task.points]));
    const tasks = exam.structure.tasks.map((task) => requested.has(task.id)
      ? { ...task, points: requested.get(task.id)! }
      : task);
    const totalPoints = getCorrectionRelevantTaskNodes(tasks).reduce((sum, task) => sum + task.points, 0);
    const gradingKey = { ...exam.gradingKey, totalPoints };

    for (const correction of await this.correctionRepository.findByExam(exam.id)) {
      const taskScores = correction.taskScores.map((score) => {
        const oldMax = oldMaxByTask.get(score.taskId);
        const newMax = requested.get(score.taskId);
        if (!oldMax || newMax === undefined) return score;
        const factor = newMax / oldMax;
        return {
          ...score,
          points: Number((score.points * factor).toFixed(4)),
          maxPoints: newMax,
          criterionScores: score.criterionScores?.map((criterion) => ({
            ...criterion,
            points: Number((criterion.points * factor).toFixed(4)),
            maxPoints: Number((criterion.maxPoints * factor).toFixed(4))
          }))
        };
      });
      const achievedPoints = taskScores.reduce((sum, score) => sum + score.points, 0);
      const grade = GradingKeyService.calculateGrade(achievedPoints, gradingKey);
      await this.correctionRepository.update(correction.id, {
        ...correction,
        taskScores,
        totalPoints: achievedPoints,
        totalGrade: grade.grade,
        percentageScore: grade.percentage,
        lastModified: new Date()
      });
    }

    const updatedExam: Exams.Exam = {
      ...exam,
      structure: { ...exam.structure, tasks, totalPoints },
      gradingKey,
      lastModified: new Date()
    };
    await this.examRepository.update(updatedExam.id, updatedExam);
    return updatedExam;
  }
}
