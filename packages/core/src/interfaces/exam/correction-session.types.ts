/**
 * Fachagnostic contracts for external correction sessions.
 *
 * These types model a normalized correction-session payload that can be
 * exchanged with ChatGPT or other external assistants without binding the
 * payload to a specific school subject. The contract focuses on hierarchical
 * assessment structure, scoring units, importable scores, and evidence links.
 */

import type { AlternativeGrading, TaskScore } from './correction.types.js';
import type { ExamPart, TaskNode } from './exam-structure.types.js';

/**
 * Minimal part representation for a correction session.
 *
 * Reuses the existing `ExamPart` contract so correction sessions can reference
 * the same part ordering and task grouping as the exam builder without copying
 * the full runtime entity.
 */
export interface KbrCorrectionSessionPart
  extends Pick<ExamPart, 'id' | 'name' | 'description' | 'taskIds' | 'printable' | 'order'> {
  maxPoints?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Normalized task node for hierarchical correction flows.
 *
 * The node keeps the existing task hierarchy semantics (`parentId`, `level`,
 * `choiceGroup`) while exposing child task IDs and scoring-unit IDs explicitly
 * for external correction tooling.
 */
export interface KbrCorrectionTaskTreeNode
  extends Pick<
    TaskNode,
    'id' | 'parentId' | 'level' | 'order' | 'title' | 'description' | 'points' | 'bonusPoints' | 'isChoice' | 'choiceGroup'
  > {
  partId?: ExamPart['id'];
  childTaskIds: TaskNode['subtasks'];
  scoringUnitIds: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Scoring-unit granularity supported by the correction-session contract.
 *
 * - `task`: score directly on the task node
 * - `criterion`: score against a criterion bucket
 * - `sub-criterion`: score against a nested rubric unit
 * - `manual`: ad-hoc external scoring unit without a direct rubric reference
 */
export type KbrCorrectionScoringUnitKind = 'task' | 'criterion' | 'sub-criterion' | 'manual';

/**
 * Atomic scoring unit used for imports and chat-assisted correction output.
 */
export interface KbrCorrectionScoringUnit {
  id: string;
  taskId: TaskNode['id'];
  kind: KbrCorrectionScoringUnitKind;
  label: string;
  maxPoints: number;
  criterionId?: string;
  subCriterionId?: string;
  weight?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Evidence payload kinds accepted by imported correction results.
 */
export type KbrCorrectionEvidenceKind =
  | 'text'
  | 'quote'
  | 'annotation'
  | 'link'
  | 'attachment'
  | 'structured';

/**
 * Evidence item linked to a task or scoring unit.
 *
 * The contract stays transport-friendly and does not assume any concrete file,
 * annotation, or storage implementation.
 */
export interface KbrCorrectionEvidence {
  id: string;
  taskId?: TaskNode['id'];
  scoringUnitId?: KbrCorrectionScoringUnit['id'];
  kind: KbrCorrectionEvidenceKind;
  label?: string;
  value?: string;
  uri?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Importable score payload for a task or nested scoring unit.
 *
 * This reuses the point/comment/alternative-grading primitives from the
 * existing `TaskScore` type while staying lighter than the persisted
 * `CorrectionEntry` shape.
 */
export interface KbrCorrectionImportedTaskScore {
  taskId: TaskScore['taskId'];
  points: TaskScore['points'];
  maxPoints: TaskScore['maxPoints'];
  scoringUnitId?: KbrCorrectionScoringUnit['id'];
  criterionId?: string;
  subCriterionId?: string;
  alternativeGrading?: AlternativeGrading;
  comment?: TaskScore['comment'];
  confidence?: number;
  evidenceIds?: Array<KbrCorrectionEvidence['id']>;
  rawScore?: unknown;
}

/**
 * Lookup-oriented normalized map for correction-session consumers.
 */
export interface KbrCorrectionSessionMap {
  partIds: Array<KbrCorrectionSessionPart['id']>;
  rootTaskIds: Array<KbrCorrectionTaskTreeNode['id']>;
  partsById: Record<string, KbrCorrectionSessionPart>;
  tasksById: Record<string, KbrCorrectionTaskTreeNode>;
  scoringUnitsById: Record<string, KbrCorrectionScoringUnit>;
  taskIdsByPartId: Record<string, Array<KbrCorrectionTaskTreeNode['id']>>;
  scoringUnitIdsByTaskId: Record<string, Array<KbrCorrectionScoringUnit['id']>>;
}

/**
 * Metadata for a reusable rules pack.
 *
 * `chatRef` allows a manifest to point back to the originating external chat or
 * other conversation thread without prescribing how the pack is loaded.
 */
export interface RulePackManifest {
  id: string;
  version: string;
  name: string;
  description?: string;
  chatRef?: string;
  target: 'correction-session';
  checksum?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Rules for how a correction session interprets scores.
 */
export interface CorrectionSessionScoringRules {
  aggregation: 'task' | 'scoring-unit' | 'external';
  allowPartialPoints: boolean;
  allowAlternativeGrading: boolean;
  allowManualScoringUnits: boolean;
}

/**
 * Rules for how evidence may be attached to imported scores.
 */
export interface CorrectionSessionEvidenceRules {
  required: boolean;
  supportedKinds: KbrCorrectionEvidenceKind[];
  allowMultipleEvidenceItems: boolean;
}

/**
 * Rules for how imported scores should be merged into an existing session.
 */
export interface CorrectionSessionImportRules {
  mergeStrategy: 'replace' | 'merge' | 'append';
  allowUnmappedScores: boolean;
  preserveManualComments: boolean;
  preserveExistingEvidence: boolean;
}

/**
 * Top-level correction-session rule set.
 */
export interface CorrectionSessionRules {
  rulePackId?: RulePackManifest['id'];
  taskSelection: 'leaf-only' | 'all-nodes' | 'mapped-only';
  scoring: CorrectionSessionScoringRules;
  evidence: CorrectionSessionEvidenceRules;
  imports: CorrectionSessionImportRules;
  metadata?: Record<string, unknown>;
}

/**
 * Serializable correction-session contract for external correction tooling.
 *
 * `chatRef` is the stable external reference to the originating chat session,
 * prompt chain, or other assistant conversation.
 */
export interface KbrCorrectionSessionContract {
  id: string;
  chatRef: string;
  title: string;
  examId?: string;
  candidateId?: string;
  parts: KbrCorrectionSessionPart[];
  taskTree: KbrCorrectionTaskTreeNode[];
  scoringUnits: KbrCorrectionScoringUnit[];
  rules: CorrectionSessionRules;
  metadata?: Record<string, unknown>;
}

/**
 * Import bundle for bringing externally corrected scores back into ViccoBoard.
 *
 * The bundle keeps the structural contract, normalized lookup map, optional
 * rule-pack manifest, imported task scores, and linked evidence in one place.
 */
export interface KbrCorrectionImportBundle {
  contract: KbrCorrectionSessionContract;
  sessionMap?: KbrCorrectionSessionMap;
  rulePack?: RulePackManifest;
  importedTaskScores: KbrCorrectionImportedTaskScore[];
  evidence?: KbrCorrectionEvidence[];
  metadata?: Record<string, unknown>;
}
