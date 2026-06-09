import { Exams } from '@viccoboard/core';

export interface KbrCorrectionImportBundleWithChatRef extends Exams.KbrCorrectionImportBundle {
  chatRef: string;
}

export interface ImportSchemaValidationResult {
  bundle: KbrCorrectionImportBundleWithChatRef;
}

type SchemaValidationError = {
  path: string;
  message: string;
};

const DEFAULT_CORRECTION_IMPORT_BUNDLE_SCHEMA: Exams.CorrectionSessionImportBundleSchemaDocument = {
  type: 'object',
  additionalProperties: false,
  required: ['contract', 'chatRef', 'importedTaskScores'],
  properties: {
    contract: {
      type: 'object',
      required: ['id', 'chatRef', 'title', 'parts', 'taskTree', 'scoringUnits', 'rules'],
      additionalProperties: true
    },
    chatRef: {
      type: 'string',
      minLength: 1,
      pattern: '^chat-[0-9]+$'
    },
    rulePack: {
      type: 'object',
      additionalProperties: true
    },
    importedTaskScores: {
      type: 'array',
      items: {
        type: 'object',
        required: ['taskId', 'points', 'maxPoints'],
        additionalProperties: true,
        properties: {
          taskId: { type: 'string', minLength: 1 },
          points: { type: 'number' },
          maxPoints: { type: 'number' },
          scoringUnitId: { type: 'string' },
          criterionId: { type: 'string' },
          subCriterionId: { type: 'string' },
          comment: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          evidenceIds: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    },
    evidence: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'kind'],
        additionalProperties: true
      }
    },
    metadata: {
      type: 'object',
      additionalProperties: true
    }
  }
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readSchemaObjectNode(
  schemaNode: unknown
): Record<string, unknown> & {
  type?: string;
  properties?: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
  items?: unknown;
  minLength?: number;
  pattern?: string;
  minimum?: number;
  maximum?: number;
} {
  return isObject(schemaNode) ? schemaNode : {};
}

function pushError(errors: SchemaValidationError[], path: string, message: string): void {
  errors.push({ path, message });
}

function validateSchemaNode(
  value: unknown,
  schemaNode: unknown,
  path: string,
  errors: SchemaValidationError[]
): void {
  const schema = readSchemaObjectNode(schemaNode);
  const schemaType = schema.type;
  if (!schemaType) {
    return;
  }

  switch (schemaType) {
    case 'object': {
      if (!isObject(value)) {
        pushError(errors, path, 'must be an object');
        return;
      }

      const required = Array.isArray(schema.required) ? schema.required : [];
      for (const key of required) {
        if (!(key in value)) {
          pushError(errors, `${path}.${key}`, 'is required');
        }
      }

      const properties = isObject(schema.properties) ? schema.properties : {};
      for (const [key, propertySchema] of Object.entries(properties)) {
        if (key in value) {
          validateSchemaNode(value[key], propertySchema, `${path}.${key}`, errors);
        }
      }

      if (schema.additionalProperties === false) {
        const propertyKeys = new Set(Object.keys(properties));
        for (const key of Object.keys(value)) {
          if (!propertyKeys.has(key)) {
            pushError(errors, `${path}.${key}`, 'is not allowed');
          }
        }
      }
      break;
    }
    case 'array': {
      if (!Array.isArray(value)) {
        pushError(errors, path, 'must be an array');
        return;
      }

      if (schema.items) {
        value.forEach((entry, index) => {
          validateSchemaNode(entry, schema.items, `${path}[${index}]`, errors);
        });
      }
      break;
    }
    case 'string': {
      if (typeof value !== 'string') {
        pushError(errors, path, 'must be a string');
        return;
      }

      if (typeof schema.minLength === 'number' && value.length < schema.minLength) {
        pushError(errors, path, `must have minimum length ${schema.minLength}`);
      }

      if (typeof schema.pattern === 'string') {
        const pattern = new RegExp(schema.pattern);
        if (!pattern.test(value)) {
          pushError(errors, path, `must match pattern ${schema.pattern}`);
        }
      }
      break;
    }
    case 'number': {
      if (typeof value !== 'number' || Number.isNaN(value)) {
        pushError(errors, path, 'must be a number');
        return;
      }

      if (typeof schema.minimum === 'number' && value < schema.minimum) {
        pushError(errors, path, `must be >= ${schema.minimum}`);
      }
      if (typeof schema.maximum === 'number' && value > schema.maximum) {
        pushError(errors, path, `must be <= ${schema.maximum}`);
      }
      break;
    }
    default:
      break;
  }
}

function assertContractRules(bundle: Exams.KbrCorrectionImportBundle): void {
  if (!bundle.contract?.rules?.scoring) {
    throw new Error('Import bundle contract.rules.scoring is required.');
  }
  if (!bundle.contract?.rules?.evidence) {
    throw new Error('Import bundle contract.rules.evidence is required.');
  }
  if (!bundle.contract?.rules?.deductionGovernance) {
    throw new Error('Import bundle contract.rules.deductionGovernance is required.');
  }
  if (!bundle.contract?.rules?.imports) {
    throw new Error('Import bundle contract.rules.imports is required.');
  }
}

function getRecord(value: unknown): Record<string, unknown> | undefined {
  return isObject(value) ? value : undefined;
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function getNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function getScoringUnitTaskRef(scoringUnit: Exams.KbrCorrectionScoringUnit): string | undefined {
  const record = scoringUnit as unknown as Record<string, unknown>;
  return getString(record.taskRef) ?? scoringUnit.taskId;
}

interface ImportCriterionContractEntry {
  taskId: string;
  scoringUnitId: string;
  publicCriterionId: string;
  criterionId: string;
  points: number;
}

function readCriterionContractEntries(bundle: Exams.KbrCorrectionImportBundle): ImportCriterionContractEntry[] {
  const entries: ImportCriterionContractEntry[] = [];

  for (const scoringUnit of bundle.contract.scoringUnits ?? []) {
    const metadata = getRecord(scoringUnit.metadata);
    const criteria = Array.isArray(metadata?.criteria) ? metadata.criteria : [];
    const taskId = getScoringUnitTaskRef(scoringUnit);
    if (!taskId || criteria.length === 0) {
      continue;
    }

    for (const rawCriterion of criteria) {
      const criterion = getRecord(rawCriterion);
      const publicCriterionId = getString(criterion?.id);
      const criterionId = getString(criterion?.criterionId);
      const points = getNumber(criterion?.points);
      if (!publicCriterionId || !criterionId || points === undefined) {
        throw new Error(
          `Import bundle contract.scoringUnits.${scoringUnit.id}.metadata.criteria contains an incomplete criterion entry.`
        );
      }

      entries.push({
        taskId,
        scoringUnitId: scoringUnit.id,
        publicCriterionId,
        criterionId,
        points
      });
    }
  }

  return entries;
}

function scoreCriterionKey(score: Exams.KbrCorrectionImportedTaskScore): string | undefined {
  if (!score.scoringUnitId || !score.criterionId) {
    return undefined;
  }

  return `${score.scoringUnitId}::${score.criterionId}`;
}

function assertCriterionLevelScores(bundle: Exams.KbrCorrectionImportBundle): void {
  const criteria = readCriterionContractEntries(bundle);
  if (criteria.length === 0) {
    return;
  }

  const criterionByScoreKey = new Map<string, ImportCriterionContractEntry>();
  const criterionByPublicKey = new Map<string, ImportCriterionContractEntry>();
  const criterionMaxByTask = new Map<string, number>();
  const criterionTaskIds = new Set<string>();
  const criterionScoringUnitIds = new Set<string>();

  for (const criterion of criteria) {
    criterionByScoreKey.set(`${criterion.scoringUnitId}::${criterion.criterionId}`, criterion);
    criterionByPublicKey.set(`${criterion.scoringUnitId}::${criterion.publicCriterionId}`, criterion);
    criterionTaskIds.add(criterion.taskId);
    criterionScoringUnitIds.add(criterion.scoringUnitId);
    criterionMaxByTask.set(
      criterion.taskId,
      (criterionMaxByTask.get(criterion.taskId) ?? 0) + criterion.points
    );
  }

  const taskMaxByRef = new Map((bundle.contract.taskTree ?? []).map((task) => [task.id, task.points]));
  for (const [taskId, criterionMax] of criterionMaxByTask) {
    const taskMax = taskMaxByRef.get(taskId);
    if (taskMax !== undefined && Math.abs(criterionMax - taskMax) > 1e-6) {
      throw new Error(
        `Import bundle contract criteria for task "${taskId}" sum to ${criterionMax}, but task max is ${taskMax}.`
      );
    }
  }

  const expectedKeys = new Set(criteria.map((criterion) => `${criterion.scoringUnitId}::${criterion.criterionId}`));
  const seenKeys = new Set<string>();

  for (const score of bundle.importedTaskScores) {
    if (!score.scoringUnitId || !score.criterionId) {
      if (!criterionTaskIds.has(score.taskId) && (!score.scoringUnitId || !criterionScoringUnitIds.has(score.scoringUnitId))) {
        continue;
      }

      throw new Error(
        `Import bundle score for task "${score.taskId}" must include scoringUnitId and criterionId because the contract contains criteria.`
      );
    }

    const criterion =
      criterionByScoreKey.get(`${score.scoringUnitId}::${score.criterionId}`) ??
      criterionByPublicKey.get(`${score.scoringUnitId}::${score.criterionId}`);
    if (!criterion) {
      throw new Error(
        `Import bundle score references unknown criterionId "${score.criterionId}" for scoringUnitId "${score.scoringUnitId}".`
      );
    }

    const canonicalKey = `${criterion.scoringUnitId}::${criterion.criterionId}`;
    if (seenKeys.has(canonicalKey)) {
      throw new Error(
        `Import bundle contains duplicate score for criterionId "${criterion.criterionId}" in scoringUnitId "${criterion.scoringUnitId}".`
      );
    }

    if (Math.abs(score.maxPoints - criterion.points) > 1e-6) {
      throw new Error(
        `Import bundle score for criterionId "${score.criterionId}" has maxPoints ${score.maxPoints}, expected ${criterion.points}.`
      );
    }

    if (score.points < 0 || score.points > criterion.points + 1e-6) {
      throw new Error(
        `Import bundle score for criterionId "${score.criterionId}" has points ${score.points}, allowed range is 0..${criterion.points}.`
      );
    }

    seenKeys.add(canonicalKey);
  }

  for (const key of expectedKeys) {
    if (!seenKeys.has(key)) {
      const criterion = criterionByScoreKey.get(key);
      throw new Error(
        `Import bundle is missing score for criterionId "${criterion?.criterionId}" in scoringUnitId "${criterion?.scoringUnitId}".`
      );
    }
  }
}

function assertEvidenceForDeductions(bundle: Exams.KbrCorrectionImportBundle): void {
  const rules = bundle.contract.rules;
  const requiresEvidence = rules.evidence.required || rules.deductionGovernance.requireEvidenceForDeductions;
  const requiresDefect = rules.deductionGovernance.requireDefectStatement;
  const requiresExplanation = rules.deductionGovernance.requireExplanationForAnyNonFullScore;
  if (!requiresEvidence && !requiresDefect && !requiresExplanation) {
    return;
  }

  const evidenceById = new Map((bundle.evidence ?? []).map((evidence) => [evidence.id, evidence]));

  for (const score of bundle.importedTaskScores) {
    if (score.points >= score.maxPoints - 1e-6) {
      continue;
    }

    if (requiresEvidence && (!score.evidenceIds || score.evidenceIds.length === 0)) {
      throw new Error(`Import bundle score for task "${score.taskId}" has a deduction without evidenceIds.`);
    }

    for (const evidenceId of score.evidenceIds ?? []) {
      const evidence = evidenceById.get(evidenceId);
      if (!evidence) {
        throw new Error(`Import bundle score references missing evidence "${evidenceId}".`);
      }

      const evidenceRecord = evidence as unknown as Record<string, unknown>;
      const taskRef = getString(evidenceRecord.taskRef) ?? evidence.taskId;
      if (taskRef && taskRef !== score.taskId) {
        throw new Error(`Evidence "${evidenceId}" references task "${taskRef}", expected "${score.taskId}".`);
      }
      if (evidence.scoringUnitId && score.scoringUnitId && evidence.scoringUnitId !== score.scoringUnitId) {
        throw new Error(
          `Evidence "${evidenceId}" references scoringUnitId "${evidence.scoringUnitId}", expected "${score.scoringUnitId}".`
        );
      }

      const evidenceCriterionId = getString(evidenceRecord.criterionId);
      if (evidenceCriterionId && score.criterionId && evidenceCriterionId !== score.criterionId) {
        throw new Error(
          `Evidence "${evidenceId}" references criterionId "${evidenceCriterionId}", expected "${score.criterionId}".`
        );
      }

      if (requiresDefect && !getString(evidenceRecord.defectStatement)) {
        throw new Error(`Evidence "${evidenceId}" is missing defectStatement.`);
      }
      if (requiresExplanation && !getString(evidenceRecord.explanation)) {
        throw new Error(`Evidence "${evidenceId}" is missing explanation.`);
      }
    }
  }
}

export function getDefaultCorrectionImportBundleSchema(): Exams.CorrectionSessionImportBundleSchemaDocument {
  return DEFAULT_CORRECTION_IMPORT_BUNDLE_SCHEMA;
}

export function validateCorrectionImportBundle(
  rawBundle: unknown,
  schema: Exams.CorrectionSessionImportBundleSchemaDocument = DEFAULT_CORRECTION_IMPORT_BUNDLE_SCHEMA
): ImportSchemaValidationResult {
  const errors: SchemaValidationError[] = [];
  validateSchemaNode(rawBundle, schema, '$', errors);
  if (errors.length > 0) {
    const rendered = errors.map((entry) => `${entry.path}: ${entry.message}`).join('; ');
    throw new Error(`Correction import bundle does not match schema: ${rendered}`);
  }

  if (!isObject(rawBundle)) {
    throw new Error('Correction import bundle must be an object.');
  }

  const chatRef = rawBundle.chatRef;
  if (typeof chatRef !== 'string' || chatRef.trim().length === 0) {
    throw new Error('Correction import bundle chatRef must be a non-empty string.');
  }

  const bundle = rawBundle as unknown as KbrCorrectionImportBundleWithChatRef;
  assertContractRules(bundle);
  assertCriterionLevelScores(bundle);
  assertEvidenceForDeductions(bundle);

  return { bundle };
}
