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
  contractId?: string;
  contractChatRef?: string;
  contractSnapshotId?: string;
  sessionChatRef?: string;
  exportId?: string;
  targetSessionId?: string;
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

export interface ImportKbrCorrectionBundleBatchInput extends Omit<ImportKbrCorrectionBundleInput, 'bundle'> {
  bundles: unknown[];
}

export interface ImportKbrCorrectionBundleResult {
  correction: Exams.CorrectionEntry;
  candidateId: string;
  chatRef: string;
  importedTaskScoreCount: number;
  skippedTaskScoreCount: number;
  uncertainties: CorrectionImportUncertainty[];
}

export interface ImportKbrCorrectionBundleBatchResult {
  results: ImportKbrCorrectionBundleResult[];
  importedBundleCount: number;
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

  const possibleKeys = [
    'generalComment',
    'generalComments',
    'examComment',
    'examLevelComments',
    'generalRemark',
    'generalRemarks',
    'endComment',
    'finalComment',
    'remark',
    'remarks',
    'bemerkung',
    'bemerkungen'
  ] as const;
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

function extractFirstText(value: unknown, keys: readonly string[]): string | undefined {
  const texts: string[] = [];

  if (typeof value === 'string' && value.trim().length > 0) {
    texts.push(value.trim());
  }

  const record = asRecord(value);
  if (record) {
    for (const key of keys) {
      const candidate = record[key];
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        texts.push(candidate.trim());
      }
    }
  }

  return Array.from(new Set(texts))[0];
}

function extractTexts(value: unknown, keys: readonly string[]): string[] {
  const texts: string[] = [];

  if (typeof value === 'string' && value.trim().length > 0) {
    texts.push(value.trim());
  }

  const record = asRecord(value);
  if (record) {
    for (const key of keys) {
      const candidate = record[key];
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        texts.push(candidate.trim());
      }
    }
  }

  return Array.from(new Set(texts));
}

function extractImportedTaskScoreComment(rawTaskScore: Record<string, unknown>): string | undefined {
  return extractFirstText(rawTaskScore, [
    'comment',
    'comments',
    'remark',
    'remarks',
    'bemerkung',
    'bemerkungen',
    'feedback',
    'note',
    'notes',
    'justification'
  ]);
}

function extractEvidenceComment(evidence: Exams.KbrCorrectionEvidence | undefined): string | undefined {
  if (!evidence) {
    return undefined;
  }

  const topLevelComments = extractTexts(evidence as unknown, [
    'comment',
    'comments',
    'remark',
    'remarks',
    'bemerkung',
    'bemerkungen',
    'feedback',
    'note',
    'notes',
    'justification',
    'defectStatement',
    'explanation'
  ]);

  const metadataComments = extractTexts(evidence.metadata, [
    'comment',
    'comments',
    'remark',
    'remarks',
    'bemerkung',
    'bemerkungen',
    'feedback',
    'note',
    'notes',
    'justification',
    'defectStatement',
    'explanation'
  ]);

  const mergedTexts = [...topLevelComments, ...metadataComments];
  if (mergedTexts.length === 0) {
    return undefined;
  }

  return mergedTexts.join('\n');
}

function extractEvidenceLinkedComment(
  evidenceIds: readonly string[] | undefined,
  evidenceById: ReadonlyMap<string, Exams.KbrCorrectionEvidence>
): string | undefined {
  if (!evidenceIds || evidenceIds.length === 0) {
    return undefined;
  }

  let merged: string | undefined;
  for (const evidenceId of evidenceIds) {
    merged = mergeComment(merged, extractEvidenceComment(evidenceById.get(evidenceId)));
  }

  return merged;
}

function resolveMetadataCommentText(value: unknown): string | undefined {
  return extractFirstText(value, [
    'text',
    'comment',
    'comments',
    'remark',
    'remarks',
    'bemerkung',
    'bemerkungen',
    'feedback',
    'generalComment',
    'generalComments',
    'generalRemark',
    'generalRemarks',
    'examComment',
    'examLevelComments',
    'endComment',
    'finalComment'
  ]);
}

function resolveTaskReferenceFromMetadataComment(
  entry: Record<string, unknown>,
  sessionMap: CorrectionImportSessionMap,
  taskById: ReadonlyMap<string, Exams.TaskNode>,
  scoringUnitById: ReadonlyMap<string, Exams.KbrCorrectionScoringUnit>
): string | undefined {
  const possibleRefs: string[] = [];
  const directRefKeys = [
    'taskId',
    'taskRef',
    'taskReference',
    'taskChatRef',
    'task',
    'reference'
  ] as const;

  for (const key of directRefKeys) {
    const value = entry[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      possibleRefs.push(value.trim());
    }
  }

  const scoringUnitId = entry.scoringUnitId;
  if (typeof scoringUnitId === 'string' && scoringUnitId.trim().length > 0) {
    const scoringUnitTaskRef = scoringUnitById.get(scoringUnitId)?.taskId;
    if (scoringUnitTaskRef) {
      possibleRefs.push(scoringUnitTaskRef);
    }
  }

  for (const ref of possibleRefs) {
    const mappedTaskId = sessionMap.taskIdByRef[ref] ?? ref;
    if (taskById.has(mappedTaskId)) {
      return mappedTaskId;
    }
  }

  return undefined;
}

function extractMetadataTaskComments(
  metadata: Record<string, unknown> | undefined,
  sessionMap: CorrectionImportSessionMap,
  taskById: ReadonlyMap<string, Exams.TaskNode>,
  scoringUnitById: ReadonlyMap<string, Exams.KbrCorrectionScoringUnit>,
  uncertainties: CorrectionImportUncertainty[]
): Map<string, string[]> {
  if (!metadata) {
    return new Map();
  }

  const taskCommentsByTaskId = new Map<string, string[]>();
  const possibleKeys = ['comments', 'taskComments', 'remarks', 'feedback'] as const;

  for (const key of possibleKeys) {
    const raw = metadata[key];
    if (!Array.isArray(raw)) {
      continue;
    }

    for (const entry of raw) {
      const comment = resolveMetadataCommentText(entry);
      const asObj = asRecord(entry);

      if (!comment || !asObj) {
        uncertainties.push({
          code: 'general-comment-unrecognized',
          message: `Ignored metadata.${key} entry because no structured comment text could be resolved.`,
          reference: key
        });
        continue;
      }

      const taskId = resolveTaskReferenceFromMetadataComment(asObj, sessionMap, taskById, scoringUnitById);
      if (!taskId) {
        continue;
      }

      const existing = taskCommentsByTaskId.get(taskId) ?? [];
      taskCommentsByTaskId.set(taskId, existing.includes(comment) ? existing : [...existing, comment]);
    }
  }

  return taskCommentsByTaskId;
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

  const expectedContractChatRef = sessionMap.contractChatRef ?? sessionMap.sessionChatRef ?? `session-${sessionId}`;
  if (bundle.contract.chatRef !== expectedContractChatRef) {
    throw new Error(
      `Import bundle session chatRef mismatch: expected "${expectedContractChatRef}", got "${bundle.contract.chatRef}".`
    );
  }

  const expectedContractId = sessionMap.contractId ?? sessionMap.contractSnapshotId;
  if (expectedContractId && bundle.contract.id !== expectedContractId) {
    throw new Error(`Import bundle contract id mismatch: expected "${expectedContractId}", got "${bundle.contract.id}".`);
  }
}

function resolveAllowedPointStep(exam: Exams.Exam, contract: Exams.KbrCorrectionSessionContract): number {
  const contractStep = contract.rules.scoring.pointStep;
  if (typeof contractStep === 'number' && Number.isFinite(contractStep) && contractStep > 0) {
    return contractStep;
  }

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

function buildTaskLevelComment(taskId: string, text: string): Exams.CorrectionComment {
  return {
    id: uuidv4(),
    taskId,
    level: 'task',
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

function extractTaskComments(taskScores: Exams.TaskScore[]): Exams.CorrectionComment[] {
  return taskScores
    .filter((taskScore) => typeof taskScore.comment === 'string' && taskScore.comment.trim().length > 0)
    .map((taskScore) => buildTaskLevelComment(taskScore.taskId, taskScore.comment!.trim()));
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
    const existing = merged.get(imported.taskId);
    if (existing?.criterionScores && imported.criterionScores) {
      const criterionScores = new Map(existing.criterionScores.map((entry) => [entry.criterionId, entry]));
      for (const criterionScore of imported.criterionScores) {
        criterionScores.set(criterionScore.criterionId, criterionScore);
      }
      const nextCriterionScores = Array.from(criterionScores.values());
      merged.set(imported.taskId, {
        ...existing,
        ...imported,
        criterionScores: nextCriterionScores,
        points: nextCriterionScores.reduce((sum, entry) => sum + entry.points, 0),
        comment: imported.comment ?? existing.comment
      });
      continue;
    }

    merged.set(imported.taskId, imported);
  }

  return Array.from(merged.values());
}

function resolveCriterionId(
  importedTaskScore: Exams.KbrCorrectionImportedTaskScore,
  scoringUnitById: ReadonlyMap<string, Exams.KbrCorrectionScoringUnit>
): string | undefined {
  if (importedTaskScore.criterionId) {
    return importedTaskScore.criterionId;
  }

  if (!importedTaskScore.scoringUnitId) {
    return undefined;
  }

  return scoringUnitById.get(importedTaskScore.scoringUnitId)?.criterionId;
}

function mergeComment(existingComment: string | undefined, importedComment: string | undefined): string | undefined {
  if (!importedComment) {
    return existingComment;
  }

  if (!existingComment) {
    return importedComment;
  }

  if (existingComment.includes(importedComment)) {
    return existingComment;
  }

  return `${existingComment}\n${importedComment}`;
}

function mergeTaskCommentsIntoScores(
  taskScores: Exams.TaskScore[],
  taskCommentsByTaskId: ReadonlyMap<string, string[]>,
  taskById: ReadonlyMap<string, Exams.TaskNode>
): Exams.TaskScore[] {
  if (taskCommentsByTaskId.size === 0) {
    return taskScores;
  }

  const scoresByTaskId = new Map(taskScores.map((taskScore) => [taskScore.taskId, taskScore]));

  for (const [taskId, comments] of taskCommentsByTaskId.entries()) {
    const mergedComment = comments.reduce<string | undefined>(
      (current, next) => mergeComment(current, next),
      scoresByTaskId.get(taskId)?.comment
    );

    const existingScore = scoresByTaskId.get(taskId);
    if (existingScore) {
      scoresByTaskId.set(taskId, {
        ...existingScore,
        comment: mergedComment
      });
      continue;
    }

    const task = taskById.get(taskId);
    if (!task) {
      continue;
    }

    scoresByTaskId.set(taskId, {
      taskId,
      points: 0,
      maxPoints: task.points,
      comment: mergedComment,
      timestamp: new Date()
    });
  }

  return Array.from(scoresByTaskId.values());
}

export class ImportKbrCorrectionBundleUseCase {
  constructor(
    private readonly examRepository: ExamRepository,
    private readonly correctionEntryRepository: CorrectionEntryRepository,
    private readonly recordCorrectionUseCase: RecordCorrectionUseCase
  ) {}

  async executeMany(input: ImportKbrCorrectionBundleBatchInput): Promise<ImportKbrCorrectionBundleBatchResult> {
    const results: ImportKbrCorrectionBundleResult[] = [];

    for (const bundle of input.bundles) {
      results.push(await this.execute({ ...input, bundle }));
    }

    return {
      results,
      importedBundleCount: results.length,
      importedTaskScoreCount: results.reduce((sum, result) => sum + result.importedTaskScoreCount, 0),
      skippedTaskScoreCount: results.reduce((sum, result) => sum + result.skippedTaskScoreCount, 0),
      uncertainties: results.flatMap((result) => result.uncertainties)
    };
  }

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
    const step = resolveAllowedPointStep(exam, bundle.contract);
    const taskById = new Map(exam.structure.tasks.map((task) => [task.id, task]));
    const evidenceById = new Map((bundle.evidence ?? []).map((evidence) => [evidence.id, evidence]));
    const scoringUnitById = new Map(bundle.contract.scoringUnits.map((scoringUnit) => [scoringUnit.id, scoringUnit]));
    const importedRules = bundle.contract.rules.imports;
    const mappedTaskScoreByTaskId = new Map<string, Exams.TaskScore>();
    const manualReviewComments: Exams.CorrectionComment[] = [];
    let skippedTaskScoreCount = 0;
    let importedTaskScoreCount = 0;

    for (const rawImportedTaskScore of bundle.importedTaskScores) {
      const importedTaskScoreRecord = asRecord(rawImportedTaskScore);
      const importedTaskScore = importedTaskScoreRecord
        ? {
            ...rawImportedTaskScore,
            comment: mergeComment(
              extractImportedTaskScoreComment(importedTaskScoreRecord),
              extractEvidenceLinkedComment(
                Array.isArray(importedTaskScoreRecord.evidenceIds)
                  ? importedTaskScoreRecord.evidenceIds.filter((entry): entry is string => typeof entry === 'string')
                  : undefined,
                evidenceById
              )
            )
          }
        : rawImportedTaskScore;
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

      const criterionId = resolveCriterionId(importedTaskScore, scoringUnitById);
      const criterion = criterionId
        ? task.criteria.find((entry) => entry.id === criterionId)
        : undefined;
      if (criterionId && !criterion) {
        throw new Error(`Unknown criterionId "${criterionId}" for task "${mappedTaskId}" in import bundle.`);
      }

      const localMaxPoints = criterion?.points ?? task.points;
      const scoreLabel = criterion
        ? `Criterion "${criterion.id}" for task "${mappedTaskId}"`
        : `Task "${mappedTaskId}"`;

      if (importedTaskScore.points < 0) {
        throw new Error(`${scoreLabel} has negative points (${importedTaskScore.points}).`);
      }
      if (importedTaskScore.points > localMaxPoints + EPSILON) {
        throw new Error(
          `${scoreLabel} has points ${importedTaskScore.points}, which exceeds max ${localMaxPoints}.`
        );
      }
      if (importedTaskScore.points > importedTaskScore.maxPoints + EPSILON) {
        throw new Error(
          `${scoreLabel} has points ${importedTaskScore.points}, which exceeds imported max ${importedTaskScore.maxPoints}.`
        );
      }
      if (importedTaskScore.maxPoints > localMaxPoints + EPSILON) {
        uncertainties.push({
          code: 'imported-max-points-exceeds-task-max',
          message: `Imported maxPoints ${importedTaskScore.maxPoints} exceeds local max ${localMaxPoints}; local max is used.`,
          reference: criterion?.id ?? mappedTaskId
        });
      }

      assertPointStep(importedTaskScore.points, step, mappedTaskId);

      const deductionReview = reviewImportedDeduction(importedTaskScore, localMaxPoints, step, evidenceById);
      if (deductionReview?.requiresManualReview) {
        uncertainties.push({
          code: 'deduction-requires-manual-review',
          message: `${scoreLabel} was marked for manual review: ${deductionReview.message}`,
          reference: criterion?.id ?? mappedTaskId
        });
        manualReviewComments.push(buildDeductionManualReviewComment(mappedTaskId, deductionReview));
      }

      importedTaskScoreCount += 1;

      if (criterion) {
        const existingMappedScore = mappedTaskScoreByTaskId.get(mappedTaskId) ?? {
          taskId: mappedTaskId,
          points: 0,
          maxPoints: task.points,
          criterionScores: [],
          timestamp: new Date()
        };
        const criterionScores = new Map((existingMappedScore.criterionScores ?? []).map((entry) => [entry.criterionId, entry]));
        criterionScores.set(criterion.id, {
          criterionId: criterion.id,
          points: importedTaskScore.points,
          maxPoints: criterion.points
        });
        const nextCriterionScores = Array.from(criterionScores.values());
        mappedTaskScoreByTaskId.set(mappedTaskId, {
          ...existingMappedScore,
          points: nextCriterionScores.reduce((sum, entry) => sum + entry.points, 0),
          criterionScores: nextCriterionScores,
          comment: mergeComment(existingMappedScore.comment, importedTaskScore.comment),
          timestamp: new Date()
        });
        continue;
      }

      mappedTaskScoreByTaskId.set(mappedTaskId, {
        taskId: mappedTaskId,
        points: importedTaskScore.points,
        maxPoints: task.points,
        alternativeGrading: importedTaskScore.alternativeGrading,
        comment: importedTaskScore.comment,
        timestamp: new Date()
      });
    }

    const mappedTaskScores = Array.from(mappedTaskScoreByTaskId.values());

    const existingCorrection = await this.correctionEntryRepository.findByExamAndCandidate(input.examId, candidateId);
    const mergedTaskScores = mergeTaskScores(
      existingCorrection?.taskScores ?? [],
      mappedTaskScores,
      importedRules.mergeStrategy
    );
    const metadataTaskComments = extractMetadataTaskComments(
      asRecord(bundle.metadata),
      input.sessionMap,
      taskById,
      scoringUnitById,
      uncertainties
    );
    const finalTaskScores = mergeTaskCommentsIntoScores(mergedTaskScores, metadataTaskComments, taskById);

    const generalComments = extractGeneralComments(asRecord(bundle.metadata), uncertainties);
    const importedExamComments = generalComments.map(buildExamLevelComment);
    const importedTaskComments = extractTaskComments(finalTaskScores);
    // `preserveManualComments=false` means we intentionally replace existing comments on import.
    const existingComments = importedRules.preserveManualComments
      ? (existingCorrection?.comments ?? [])
      : [];
    const allComments = mergeUniqueComments([
      existingComments,
      importedExamComments,
      importedTaskComments,
      manualReviewComments
    ]);

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
      importedTaskScoreCount,
      skippedTaskScoreCount,
      uncertainties
    };
  }
}
