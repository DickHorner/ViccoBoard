/**
 * Fachagnostic contracts for persisting and exchanging correction sessions that
 * were assisted by an external chat system.
 */

/**
 * Minimal score payload for one corrected item that can be re-imported into KBR.
 */
export interface TaskScoreImport {
  /**
   * Stable reference to the corrected item (for example task/subtask key).
   */
  itemRef: string;

  /**
   * Achieved score value for the corrected item.
   */
  score: number;

  /**
   * Optional maximum score used for validation and percentage reconstruction.
   */
  maxScore?: number;

  /**
   * Optional textual note that can be mapped back to KBR comments.
   */
  note?: string;

  /**
   * Optional evidence snippets attached to this scored item.
   */
  evidence?: EvidenceSnippet[];
}

/**
 * Optional evidence excerpt linked to one imported score decision.
 */
export interface EvidenceSnippet {
  /**
   * Human-readable source label (for example page or section identifier).
   */
  sourceRef: string;

  /**
   * Extracted content that supports the scoring decision.
   */
  excerpt: string;

  /**
   * Optional character index where the excerpt starts in the source.
   */
  startOffset?: number;

  /**
   * Optional character index where the excerpt ends in the source.
   */
  endOffset?: number;
}

/**
 * Optional session-level metadata used for import auditing and diagnostics.
 */
export interface SessionMeta {
  /**
   * Origin identifier of the external tool/system.
   */
  sourceSystem?: string;

  /**
   * Author or actor label captured by the external system.
   */
  authoredBy?: string;

  /**
   * Session timestamp from the external system in ISO-8601 format.
   */
  timestampIso?: string;

  /**
   * Additional non-domain specific metadata.
   */
  attributes?: Record<string, unknown>;
}

/**
 * Canonical in-memory contract for one correction session import candidate.
 */
export interface KbrCorrectionSessionContract {
  /**
   * Local unique identifier of this importable session contract.
   */
  id: string;

  /**
   * External chat/session reference used for traceability.
   */
  chatRef: string;

  /**
   * Reference to the correction context entity in KBR (for example exam).
   */
  contextRef: string;

  /**
   * Reference to the corrected target entity in KBR (for example candidate).
   */
  targetRef: string;

  /**
   * Imported per-item score payloads.
   */
  scores: TaskScoreImport[];

  /**
   * Optional aggregated score across all imported items.
   */
  totalScore?: number;

  /**
   * Optional session-level comment for the overall correction.
   */
  summaryNote?: string;

  /**
   * Optional metadata provided by the source system.
   */
  meta?: SessionMeta;
}

/**
 * Import bundle with only the data required for KBR re-import.
 */
export interface KbrCorrectionImportBundle {
  /**
   * Payload schema version for compatibility checks.
   */
  version: string;

  /**
   * Correction sessions ready for KBR re-import.
   */
  sessions: KbrCorrectionSessionContract[];
}

/**
 * Lookup map keyed by session id for fast session access during import.
 */
export type KbrCorrectionSessionMap = Record<string, KbrCorrectionSessionContract>;
