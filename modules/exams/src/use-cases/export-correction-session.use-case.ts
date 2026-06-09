import { Exams } from '@viccoboard/core';
const uuidv4 = () => crypto.randomUUID();

import { getEmbeddedDefaultCorrectionSessionRulePack } from '../rule-packs/default-pack.js';
import type {
  CorrectionSessionRulePackSource,
  LoadedCorrectionSessionRulePack
} from '../rule-packs/types.js';
import {
  buildCorrectionSessionParts,
  buildCorrectionSessionReferenceMaps,
  buildCorrectionSessionScoringUnits,
  buildCorrectionSessionTaskTree,
  buildExamReference,
  renderCorrectionSessionChatReferenceEntries,
  renderCorrectionSessionParts,
  renderCorrectionSessionRules,
  renderCorrectionSessionScoringUnits,
  renderCorrectionSessionTaskTree,
  type CorrectionSessionReferenceMaps
} from '../utils/correction-session-export.js';
import { renderTemplate } from '../utils/template-renderer.js';

const CHAT_REF_PADDING_LENGTH = 4;

export interface CorrectionSessionExportFileArtifact {
  fileName: string;
  content: string;
}

export interface CorrectionSessionLocalReferenceMap {
  examRef: string;
  partIdByRef: Record<string, string>;
  taskIdByRef: Record<string, string>;
  scoringUnitKeyByRef: Record<string, string>;
  candidateIdByChatRef: Record<string, string>;
}

export interface CorrectionSessionExportArtifact {
  sessionChatRef: string;
  chatRefs: string[];
  contract: Exams.KbrCorrectionSessionContract;
  contractFile: CorrectionSessionExportFileArtifact;
  promptFile: CorrectionSessionExportFileArtifact;
  localReferenceMap: CorrectionSessionLocalReferenceMap;
}

export interface ExportCorrectionSessionArtifactsResult {
  sessionId: string;
  rulePack: Exams.RulePackManifest;
  artifact: CorrectionSessionExportArtifact;
  sessionMap: Record<string, string>;
}

export interface ExportCorrectionSessionArtifactsInput {
  exam: Exams.Exam;
  candidates?: Exams.Candidate[];
  sessionId?: string;
  rulePackSource?: CorrectionSessionRulePackSource;
}

export type CorrectionSessionRulePackResolver = (
  source?: CorrectionSessionRulePackSource
) => LoadedCorrectionSessionRulePack;

function resolveRulePack(
  source: CorrectionSessionRulePackSource | undefined,
  resolver?: CorrectionSessionRulePackResolver
): LoadedCorrectionSessionRulePack {
  if (source?.loadedRulePack) {
    return source.loadedRulePack;
  }

  if (source?.directoryPath || source?.id) {
    if (!resolver) {
      throw new Error(
        'Rule pack resolution for directoryPath/id sources requires an explicit resolver in this runtime.'
      );
    }
    return resolver(source);
  }

  return resolver?.(source) ?? getEmbeddedDefaultCorrectionSessionRulePack();
}

function buildBaseFileName(sessionId: string): string {
  const normalizedSessionId = sessionId.replace(/^session-/, '') || sessionId;
  return `kbr-correction-session-${normalizedSessionId}`;
}

function buildPromptArtifacts(
  rulePack: LoadedCorrectionSessionRulePack,
  contractMarkdown: string,
  contract: Exams.KbrCorrectionSessionContract
): string {
  return renderTemplate(rulePack.templates.prompt, {
    contractMarkdown,
    contractJson: JSON.stringify(contract, null, 2),
    importBundleSchema: JSON.stringify(rulePack.importBundleSchema, null, 2),
    rulePackManifest: JSON.stringify(rulePack.manifest, null, 2),
    rulePackRules: JSON.stringify(rulePack.rules, null, 2),
    'session.id': contract.id,
    'session.chatRef': contract.chatRef,
    'session.title': contract.title
  });
}

function resolveAllowedPointStep(exam: Exams.Exam): number {
  const decimalPlaces = exam.gradingKey.roundingRule.decimalPlaces;
  if (!Number.isFinite(decimalPlaces) || decimalPlaces <= 0) {
    return 1;
  }

  return 1 / Math.pow(10, decimalPlaces);
}

function hasCriteria(scoringUnits: Exams.KbrCorrectionScoringUnit[]): boolean {
  return scoringUnits.some((scoringUnit) => {
    const metadata = scoringUnit.metadata;
    return Boolean(metadata && Array.isArray(metadata.criteria) && metadata.criteria.length > 0);
  });
}

function cloneReferenceMap(
  references: CorrectionSessionReferenceMaps,
  sessionMap: Record<string, string>
): CorrectionSessionLocalReferenceMap {
  return {
    examRef: references.examRef,
    partIdByRef: { ...references.partIdByRef },
    taskIdByRef: { ...references.taskIdByRef },
    scoringUnitKeyByRef: { ...references.scoringUnitKeyByRef },
    candidateIdByChatRef: { ...sessionMap }
  };
}

export class ExportCorrectionSessionArtifactsUseCase {
  constructor(
    private readonly rulePackResolver?: CorrectionSessionRulePackResolver
  ) {}

  execute(
    input: ExportCorrectionSessionArtifactsInput
  ): ExportCorrectionSessionArtifactsResult {
    const rulePack = resolveRulePack(input.rulePackSource, this.rulePackResolver);
    const selectedCandidates = input.candidates ?? input.exam.candidates;

    if (selectedCandidates.length === 0) {
      throw new Error('Cannot export a correction session without at least one candidate.');
    }

    const sessionId = input.sessionId ?? uuidv4();
    const references = buildCorrectionSessionReferenceMaps(input.exam);
    const parts = buildCorrectionSessionParts(input.exam, references, rulePack.rules);
    const scoringUnits = buildCorrectionSessionScoringUnits(input.exam, references, rulePack.rules);
    const taskTree = buildCorrectionSessionTaskTree(input.exam, references, scoringUnits);
    const renderedParts = renderCorrectionSessionParts(parts);
    const renderedTaskTree = renderCorrectionSessionTaskTree(taskTree);
    const renderedScoringUnits = renderCorrectionSessionScoringUnits(scoringUnits);
    const renderedRules = renderCorrectionSessionRules(rulePack.rules);
    const sessionMap: Record<string, string> = {};
    const chatRefEntries = selectedCandidates.map((candidate, index) => {
      const chatRef = `chat-${String(index + 1).padStart(CHAT_REF_PADDING_LENGTH, '0')}`;
      sessionMap[chatRef] = candidate.id;
      return {
        chatRef,
        candidateLabel: `${candidate.firstName} ${candidate.lastName}`.trim()
      };
    });
    const chatRefs = chatRefEntries.map((entry) => entry.chatRef);
    const sessionChatRef = `session-${sessionId}`;
    const requiresCriterionId = hasCriteria(scoringUnits);
    const contract: Exams.KbrCorrectionSessionContract = {
      id: `contract-${sessionChatRef}`,
      chatRef: sessionChatRef,
      title: `${input.exam.title} - correction session`,
      parts,
      taskTree,
      scoringUnits,
      rules: rulePack.rules,
      metadata: {
        assessmentFormat: input.exam.assessmentFormat,
        examRef: references.examRef,
        subjectAgnostic: true,
        exportKind: 'chatgpt-correction-session',
        status: input.exam.status,
        chatRefs,
        candidateCount: selectedCandidates.length,
        allowedPointStep: resolveAllowedPointStep(input.exam),
        requiredImportGranularity: requiresCriterionId ? 'criterion' : 'task',
        scoreExportMode: requiresCriterionId ? 'criterionScoresOnly' : 'taskScores',
        requiresCriterionId,
        requiresEvidenceForCriterionDeductions: rulePack.rules.deductionGovernance.requireEvidenceForDeductions,
        contractRulesShape: 'activeRulesNested'
      }
    };

    const contractMarkdown = renderTemplate(rulePack.templates.contract, {
      'session.id': contract.id,
      'session.chatRef': contract.chatRef,
      'session.title': contract.title,
      'session.examRef': references.examRef,
      'rulePack.manifest.id': rulePack.manifest.id,
      'rulePack.manifest.version': rulePack.manifest.version,
      'render.chatRefs': renderCorrectionSessionChatReferenceEntries(chatRefEntries),
      'render.parts': renderedParts,
      'render.taskTree': renderedTaskTree,
      'render.scoringUnits': renderedScoringUnits,
      'render.rules': renderedRules
    });

    const promptMarkdown = buildPromptArtifacts(rulePack, contractMarkdown, contract);
    const fileNameBase = buildBaseFileName(sessionId);

    return {
      sessionId,
      rulePack: rulePack.manifest,
      artifact: {
        sessionChatRef,
        chatRefs,
        contract,
        contractFile: {
          fileName: `${fileNameBase}-contract.md`,
          content: contractMarkdown
        },
        promptFile: {
          fileName: `${fileNameBase}-prompt.md`,
          content: promptMarkdown
        },
        localReferenceMap: cloneReferenceMap(references, sessionMap)
      },
      sessionMap
    };
  }
}
