import { Exams } from '@viccoboard/core';
import type { CorrectionEntryRepository } from '../repositories/correction-entry.repository';
import type { ExamRepository } from '../repositories/exam.repository';
import { GetCorrectionSheetPresetUseCase } from './get-correction-sheet-preset.use-case';
import { getCorrectionRelevantTaskNodes } from '../utils/task-tree';

import type { SupportTipRepository } from '../repositories/support-tip.repository';
import { SupportTipManagementService } from '../services/support-tip-management.service';

function resolveCandidateName(candidate: Exams.Candidate): string {
  return `${candidate.firstName} ${candidate.lastName}`.trim();
}

function resolvePartLabel(exam: Exams.Exam, taskId: string): string | undefined {
  return exam.structure.parts.find((part) => part.taskIds.includes(taskId))?.name;
}

function resolveGeneralComment(
  correction: Exams.CorrectionEntry,
  preset: Exams.CorrectionSheetPreset
): string | undefined {
  if (!preset.showGeneralComment) {
    return undefined;
  }

  const examComments = correction.comments
    .filter((comment) => comment.level === 'exam')
    .sort((left, right) => {
      return new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime();
    });

  const latestComment = examComments[examComments.length - 1];
  return latestComment?.text?.trim() || undefined;
}

export interface BuildCorrectionSheetProjectionOptions {
  /** When true, allows building projections for non-completed corrections (for preview only). Default: false. */
  allowIncomplete?: boolean;
}

export class BuildCorrectionSheetProjectionUseCase {
  constructor(
    private readonly examRepository: ExamRepository,
    private readonly correctionEntryRepository: CorrectionEntryRepository,
    private readonly getCorrectionSheetPresetUseCase: GetCorrectionSheetPresetUseCase,
    private readonly supportTipRepository?: SupportTipRepository
  ) {}

  async execute(
    examId: string,
    candidateId: string,
    options: BuildCorrectionSheetProjectionOptions = {}
  ): Promise<Exams.CorrectionSheetProjection> {
    const exam = await this.examRepository.findById(examId);
    if (!exam) {
      throw new Error(`Exam ${examId} not found`);
    }

    const candidate = exam.candidates.find((entry) => entry.id === candidateId);
    if (!candidate) {
      throw new Error(`Candidate ${candidateId} not found in exam ${examId}`);
    }

    const correction = await this.correctionEntryRepository.findByExamAndCandidate(
      examId,
      candidateId
    );
    if (!correction) {
      throw new Error(`Correction for candidate ${candidateId} not found`);
    }

    if (!options.allowIncomplete && correction.status !== 'completed') {
      throw new Error(
        `Korrektur für Prüfling ${candidateId} ist noch nicht abgeschlossen (Status: ${correction.status}). Nur abgeschlossene Korrekturen können als Druckbogen ausgegeben werden.`
      );
    }

    const preset = await this.getCorrectionSheetPresetUseCase.execute(examId);

    const taskRows = getCorrectionRelevantTaskNodes(exam.structure.tasks)
      .map((task) => {
        const score = correction.taskScores.find((entry) => entry.taskId === task.id);
        return {
          taskId: task.id,
          label: task.title,
          maxPoints: task.points,
          awardedPoints: score?.points ?? 0,
          comment: preset.showTaskComments ? score?.comment : undefined,
          partLabel: preset.showExamParts ? resolvePartLabel(exam, task.id) : undefined,
          criteria: task.criteria.map((criterion) => {
            const criterionScore = score?.criterionScores?.find(
              (entry) => entry.criterionId === criterion.id
            );
            return {
              criterionId: criterion.id,
              text: criterion.text,
              maxPoints: criterion.points,
              awardedPoints: criterionScore?.points,
              formatting: criterion.formatting
            };
          })
        };
      });

    let supportTipRows: Exams.ProjectionSupportTipRow[] | undefined;
    if (preset.showSupportTips && this.supportTipRepository && correction.supportTips.length > 0) {
      const allTips = await this.supportTipRepository.findAll();
      supportTipRows = [];
      for (const assignment of correction.supportTips) {
        const tip = allTips.find((t) => t.id === assignment.supportTipId);
        if (tip) {
          const assignedTaskId = assignment.subtaskId ?? assignment.taskId;
          const taskNode = assignedTaskId
            ? getCorrectionRelevantTaskNodes(exam.structure.tasks).find((task) => task.id === assignedTaskId)
            : undefined;
          supportTipRows.push({
            id: tip.id,
            title: tip.title,
            shortDescription: tip.shortDescription,
            category: tip.category,
            taskId: assignedTaskId,
            taskTitle: taskNode?.title,
            priority: tip.priority,
            weight: assignment.weight ?? tip.weight,
            links: tip.links || [],
            qrCode: tip.qrCode || SupportTipManagementService.generateQRCode(tip)
          });
        }
      }
      supportTipRows.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || (b.weight ?? 1) - (a.weight ?? 1));
    }

    return {
      examId: exam.id,
      examTitle: exam.title,
      examDate: exam.date ?? exam.createdAt,
      candidateId: candidate.id,
      candidateName: resolveCandidateName(candidate),
      maxPoints: exam.gradingKey.totalPoints || exam.structure.totalPoints,
      totalPoints: correction.totalPoints,
      grade: preset.showGrade ? correction.totalGrade : undefined,
      generalComment: resolveGeneralComment(correction, preset),
      headerText: preset.headerText,
      footerText: preset.footerText,
      schoolLogo: preset.schoolLogo,
      teacherSignature: preset.teacherSignature,
      layoutMode: preset.layoutMode,
      showHeader: preset.showHeader,
      showOverallPoints: preset.showOverallPoints,
      showGrade: preset.showGrade,
      showTaskPoints: preset.showTaskPoints,
      showTaskComments: preset.showTaskComments,
      showGeneralComment: preset.showGeneralComment,
      showSupportTips: preset.showSupportTips,
      showTaskPercentages: preset.showTaskPercentages,
      italicizeFeedback: preset.italicizeFeedback,
      showPointDeductions: preset.showPointDeductions,
      showExamParts: preset.showExamParts,
      showSignatureArea: preset.showSignatureArea,
      taskRows,
      supportTips: supportTipRows
    };
  }
}
