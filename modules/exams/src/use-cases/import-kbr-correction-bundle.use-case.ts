const uuidv4 = () => crypto.randomUUID();
import { Exams } from '@viccoboard/core';

import { ExamRepository } from '../repositories/exam.repository.js';
import { CorrectionEntryRepository } from '../repositories/correction-entry.repository.js';
import { RecordCorrectionUseCase } from './record-correction.use-case-v2.js';
import {
  getDefaultCorrectionImportBundleSchema,
  validateCorrectionImportBundle
} from '../validators/correction-import-bundle.validator.js';
import {
  buildDeductionManualReviewComment,
  reviewImportedDeduction
} from '../validators/deduction-justification.validator.js';

const EPSILON = 1e-6;

export interface CorrectionImportSessionMap {
  examId: string;
  sessionId: string;
  candidateIdByChatRef: Record<string, string>;
  taskIdByRef: Record<string, string>;
}

export type CorrectionImportUncertaintyCode =
  | 'task-id-unmapped-skipped'
  | 'imported-max-points-exceeds-task-max'
  | 'missing-local-task-map-entry'
  | 'general-comment-unrecognized'
  | 'deduction-requires-manual-review';

export interface CorrectionImportUncertainty {
  code: CorrectionImportUncertaintyCode;
  message: string;
  reference?: string;
}

export interface ImportKbrCorrectionBundleInput {
  bundle: unknown;
  examId: string;
  sessionId: string;
  sessionMap: CorrectionImportSessionMap;
  schema?: Exams.CorrectionSessionImportBundleSchemaDocument;
  finalizeCorrection?: boolean;
}

export interface ImportKbrCorrectionBundleResult {
  correction: Exams.CorrectionEntry;
  candidateId: string;
  chatRef: string;
  importedTaskScoreCount: number;
  skippedTaskScoreCount: number;
  uncertainties: CorrectionImportUncertainty[];
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

function extractGeneralComments(
  metadata: Record<string, unknown> | undefined,
  uncertainties: CorrectionImportUncertainty[]
): string[] {
  if (!metadata) {
    return [];
  }

  const possibleKeys = ['generalComment', 'generalComments', 'examComment', 'examLevelComments'] as const;
  const comments: string[] = [];

  for (const key of possibleKeys) {
    const raw = metadata[key];
    if (typeof raw === 'string' && raw.trim().length > 0) {
      comments.push(raw.trim());
      continue;
    }

    if (Array.isArray(raw)) {
      for (const entry of raw) {
        if (typeof entry === 'string' && entry.trim().length > 0) {
          comments.push(entry.trim());
          continue;
        }

        const asObj = asRecord(entry);
        const maybeText = asObj?.text;
        if (typeof maybeText === 'string' && maybeText.trim().length > 0) {
          comments.push(maybeText.trim());
          continue;
        }

        uncertainties.push({
          code: 'general-comment-unrecognized',
          message: `Ignored non-string general comment entry in metadata.${key}.`,
          reference: key
        });
      }
    }
  }

  return Array.from(new Set(comments));
}

function assertSessionContext(
  bundle: Exams.KbrCorrectionImportBundle & { chatRef: string },
  examId: string,
  sessionId: string,
  sessionMap: CorrectionImportSessionMap
): void {
  if (sessionMap.examId !== examId) {
    throw new Error(`Session map examId mismatch: expected "${examId}", got "${sessionMap.examId}".`);
  }

  if (sessionMap.sessionId !== sessionId) {
    throw new Error(`Session map sessionId mismatch: expected "${sessionId}", got "${sessionMap.sessionId}".`);
  }

  const contractExamId = bundle.contract.examId;
  if (contractExamId && contractExamId !== examId) {
    throw new Error(`Import bundle examId mismatch: expected "${examId}", got "${contractExamId}".`);
  }

  const expectedSessionChatRef = `session-${sessionId}`;
  if (bundle.contract.chatRef !== expectedSessionChatRef) {
    throw new Error(
      `Import bundle session chatRef mismatch: expected "${expectedSessionChatRef}", got "${bundle.contract.chatRef}".`
    );
  }
}

function resolveAllowedPointStep(exam: Exams.Exam): number {
  const decimalPlaces = exam.gradingKey.roundingRule.decimalPlaces;
  if (!Number.isFinite(decimalPlaces) || decimalPlaces <= 0) {
    return 1;
  }

  return 1 / Math.pow(10, decimalPlaces);
}

function assertPointStep(points: number, step: number, taskId: string): void {
  const stepCount = points / step;
  const distance = Math.abs(stepCount - Math.round(stepCount));
  if (distance > EPSILON) {
    throw new Error(
      `Task "${taskId}" has points ${points}, which violates allowed point step ${step}.`
    );
  }
}

function buildExamLevelComment(text: string): Exams.CorrectionComment {
  return {
    id: uuidv4(),
    level: 'exam',
    text,
    printable: true,
    availableAfterReturn: true,
    timestamp: new Date()
  };
}

function mergeUniqueComments(commentGroups: Exams.CorrectionComment[][]): Exams.CorrectionComment[] {
  const merged: Exams.CorrectionComment[] = [];
  const seen = new Set<string>();

  for (const group of commentGroups) {
    for (const comment of group) {
      const key = `${comment.level}:${comment.taskId ?? ''}:${comment.text}`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      merged.push(comment);
    }
  }

  return merged;
}

function mergeTaskScores(
  existingTaskScores: Exams.TaskScore[],
  importedTaskScores: Exams.TaskScore[],
  strategy: Exams.CorrectionSessionImportRules['mergeStrategy']
): Exams.TaskScore[] {
  if (strategy === 'replace') {
    return importedTaskScores;
  }

  if (strategy === 'append') {
    return [...existingTaskScores, ...importedTaskScores];
  }

  const merged = new Map(existingTaskScores.map((entry) => [entry.taskId, entry]));
  for (const imported of importedTaskScores) {
    merged.set(imported.taskId, imported);
  }

  return Array.from(merged.values());
}

export class ImportKbrCorrectionBundleUseCase {
  constructor(
    private readonly examRepository: ExamRepository,
    private readonly correctionEntryRepository: CorrectionEntryRepository,
    private readonly recordCorrectionUseCase: RecordCorrectionUseCase
  ) {}

  async execute(input: ImportKbrCorrectionBundleInput): Promise<ImportKbrCorrectionBundleResult> {
    const schema = input.schema ?? getDefaultCorrectionImportBundleSchema();
    const { bundle } = validateCorrectionImportBundle(input.bundle, schema);
    assertSessionContext(bundle, input.examId, input.sessionId, input.sessionMap);

    const candidateId = input.sessionMap.candidateIdByChatRef[bundle.chatRef];
    if (!candidateId) {
      throw new Error(`Could not resolve candidateId for chatRef "${bundle.chatRef}" in session map.`);
    }

    const exam = await this.examRepository.findById(input.examId);
    if (!exam) {
      throw new Error(`Exam "${input.examId}" not found.`);
    }

    const uncertainties: CorrectionImportUncertainty[] = [];
    const step = resolveAllowedPointStep(exam);
    const taskById = new Map(exam.structure.tasks.map((task) => [task.id, task]));
    const evidenceById = new Map((bundle.evidence ?? []).map((evidence) => [evidence.id, evidence]));
    const importedRules = bundle.contract.rules.imports;
    const mappedTaskScores: Exams.TaskScore[] = [];
    const manualReviewComments: Exams.CorrectionComment[] = [];
    let skippedTaskScoreCount = 0;

    for (const importedTaskScore of bundle.importedTaskScores) {
      const mappedTaskIdFromSession = input.sessionMap.taskIdByRef[importedTaskScore.taskId];
      const mappedTaskId = mappedTaskIdFromSession ?? importedTaskScore.taskId;
      if (!mappedTaskIdFromSession) {
        uncertainties.push({
          code: 'missing-local-task-map-entry',
          message: `No task map entry for "${importedTaskScore.taskId}", using raw id as fallback.`,
          reference: importedTaskScore.taskId
        });
      }

      const task = taskById.get(mappedTaskId);
      if (!task) {
        if (importedRules.allowUnmappedScores) {
          skippedTaskScoreCount += 1;
          uncertainties.push({
            code: 'task-id-unmapped-skipped',
            message: `Skipped unmapped imported task "${importedTaskScore.taskId}".`,
            reference: importedTaskScore.taskId
          });
          continue;
        }

        throw new Error(`Unknown taskId "${importedTaskScore.taskId}" (mapped to "${mappedTaskId}") in import bundle.`);
      }

      if (importedTaskScore.points < 0) {
        throw new Error(`Task "${mappedTaskId}" has negative points (${importedTaskScore.points}).`);
      }
      if (importedTaskScore.points > task.points + EPSILON) {
        throw new Error(
          `Task "${mappedTaskId}" has points ${importedTaskScore.points}, which exceeds task max ${task.points}.`
        );
      }
      if (importedTaskScore.points > importedTaskScore.maxPoints + EPSILON) {
        throw new Error(
          `Task "${mappedTaskId}" has points ${importedTaskScore.points}, which exceeds imported max ${importedTaskScore.maxPoints}.`
        );
      }
      if (importedTaskScore.maxPoints > task.points + EPSILON) {
        uncertainties.push({
          code: 'imported-max-points-exceeds-task-max',
          message: `Imported maxPoints ${importedTaskScore.maxPoints} exceeds exam task max ${task.points}; task max is used.`,
          reference: mappedTaskId
        });
      }

      assertPointStep(importedTaskScore.points, step, mappedTaskId);

      const deductionReview = reviewImportedDeduction(importedTaskScore, task.points, step, evidenceById);
      if (deductionReview?.requiresManualReview) {
        uncertainties.push({
          code: 'deduction-requires-manual-review',
          message: `Task "${mappedTaskId}" was marked for manual review: ${deductionReview.message}`,
          reference: mappedTaskId
        });
        manualReviewComments.push(buildDeductionManualReviewComment(mappedTaskId, deductionReview));
      }

      mappedTaskScores.push({
        taskId: mappedTaskId,
        points: importedTaskScore.points,
        maxPoints: task.points,
        alternativeGrading: importedTaskScore.alternativeGrading,
        comment: importedTaskScore.comment,
        timestamp: new Date()
      });
    }

    const existingCorrection = await this.correctionEntryRepository.findByExamAndCandidate(input.examId, candidateId);
    const finalTaskScores = mergeTaskScores(
      existingCorrection?.taskScores ?? [],
      mappedTaskScores,
      importedRules.mergeStrategy
    );

    const generalComments = extractGeneralComments(asRecord(bundle.metadata), uncertainties);
    const importedExamComments = generalComments.map(buildExamLevelComment);
    // `preserveManualComments=false` means we intentionally replace existing comments on import.
    const existingComments = importedRules.preserveManualComments
      ? (existingCorrection?.comments ?? [])
      : [];
    const allComments = mergeUniqueComments([existingComments, importedExamComments, manualReviewComments]);

    const correction = await this.recordCorrectionUseCase.execute({
      examId: input.examId,
      candidateId,
      taskScores: finalTaskScores,
      comments: allComments.length > 0 ? allComments : undefined,
      supportTips: existingCorrection?.supportTips ?? [],
      finalizeCorrection: input.finalizeCorrection
    });

    return {
      correction,
      candidateId,
      chatRef: bundle.chatRef,
      importedTaskScoreCount: mappedTaskScores.length,
      skippedTaskScoreCount,
      uncertainties
    };
  }
}
