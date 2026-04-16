import { Exams } from '@viccoboard/core';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function expectPlainObject(value: unknown, label: string): Record<string, unknown> {
  if (!isPlainObject(value)) {
    throw new Error(`${label} must be an object.`);
  }

  return value;
}

function expectString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }

  return value;
}

function expectBoolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`${label} must be a boolean.`);
  }

  return value;
}

function expectStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string' || entry.trim().length === 0)) {
    throw new Error(`${label} must be an array of non-empty strings.`);
  }

  return value;
}

function optionalRecord(value: unknown): Record<string, unknown> | undefined {
  return value === undefined ? undefined : expectPlainObject(value, 'metadata');
}

export function validateRulePackManifest(input: unknown): Exams.RulePackManifest {
  const manifest = expectPlainObject(input, 'Rule pack manifest');
  const resourcesInput = expectPlainObject(manifest.resources, 'Rule pack manifest resources');
  const compatibilityInput = manifest.compatibility === undefined
    ? undefined
    : expectPlainObject(manifest.compatibility, 'Rule pack compatibility');

  return {
    id: expectString(manifest.id, 'Rule pack manifest id'),
    schemaVersion: expectString(manifest.schemaVersion, 'Rule pack manifest schemaVersion'),
    version: expectString(manifest.version, 'Rule pack manifest version'),
    name: expectString(manifest.name, 'Rule pack manifest name'),
    description: manifest.description === undefined ? undefined : expectString(manifest.description, 'Rule pack manifest description'),
    chatRef: manifest.chatRef === undefined ? undefined : expectString(manifest.chatRef, 'Rule pack manifest chatRef'),
    target: (() => {
      const target = expectString(manifest.target, 'Rule pack manifest target');
      if (target !== 'correction-session') {
        throw new Error(`Unsupported rule pack target "${target}".`);
      }

      return 'correction-session' as const;
    })(),
    resources: {
      rules: expectString(resourcesInput.rules, 'Rule pack manifest resources.rules'),
      contractTemplate: expectString(resourcesInput.contractTemplate, 'Rule pack manifest resources.contractTemplate'),
      promptTemplate: expectString(resourcesInput.promptTemplate, 'Rule pack manifest resources.promptTemplate'),
      importBundleSchema: expectString(resourcesInput.importBundleSchema, 'Rule pack manifest resources.importBundleSchema')
    },
    compatibility: compatibilityInput
      ? {
          contractType: (() => {
            const value = expectString(compatibilityInput.contractType, 'Rule pack compatibility contractType');
            if (value !== 'correction-session') {
              throw new Error(`Unsupported compatibility contractType "${value}".`);
            }

            return 'correction-session' as const;
          })(),
          contractVersion: expectString(compatibilityInput.contractVersion, 'Rule pack compatibility contractVersion'),
          importBundleType: (() => {
            const value = expectString(compatibilityInput.importBundleType, 'Rule pack compatibility importBundleType');
            if (value !== 'correction-import-bundle') {
              throw new Error(`Unsupported compatibility importBundleType "${value}".`);
            }

            return 'correction-import-bundle' as const;
          })(),
          importBundleVersion: expectString(compatibilityInput.importBundleVersion, 'Rule pack compatibility importBundleVersion')
        }
      : undefined,
    checksum: manifest.checksum === undefined ? undefined : expectString(manifest.checksum, 'Rule pack manifest checksum'),
    metadata: optionalRecord(manifest.metadata)
  };
}

export function validateCorrectionSessionRules(input: unknown): Exams.CorrectionSessionRules {
  const rules = expectPlainObject(input, 'Correction session rules');
  const scoring = expectPlainObject(rules.scoring, 'Correction session scoring rules');
  const evidence = expectPlainObject(rules.evidence, 'Correction session evidence rules');
  const imports = expectPlainObject(rules.imports, 'Correction session import rules');

  const taskSelection = expectString(rules.taskSelection, 'Correction session taskSelection');
  if (!['leaf-only', 'all-nodes', 'mapped-only'].includes(taskSelection)) {
    throw new Error(`Unsupported taskSelection "${taskSelection}".`);
  }

  const aggregation = expectString(scoring.aggregation, 'Correction session scoring aggregation');
  if (!['task', 'scoring-unit', 'external'].includes(aggregation)) {
    throw new Error(`Unsupported scoring aggregation "${aggregation}".`);
  }

  const mergeStrategy = expectString(imports.mergeStrategy, 'Correction session import mergeStrategy');
  if (!['replace', 'merge', 'append'].includes(mergeStrategy)) {
    throw new Error(`Unsupported mergeStrategy "${mergeStrategy}".`);
  }

  return {
    rulePackId: rules.rulePackId === undefined ? undefined : expectString(rules.rulePackId, 'Correction session rulePackId'),
    taskSelection: taskSelection as Exams.CorrectionSessionRules['taskSelection'],
    scoring: {
      aggregation: aggregation as Exams.CorrectionSessionScoringRules['aggregation'],
      allowPartialPoints: expectBoolean(scoring.allowPartialPoints, 'Correction session scoring allowPartialPoints'),
      allowAlternativeGrading: expectBoolean(scoring.allowAlternativeGrading, 'Correction session scoring allowAlternativeGrading'),
      allowManualScoringUnits: expectBoolean(scoring.allowManualScoringUnits, 'Correction session scoring allowManualScoringUnits')
    },
    evidence: {
      required: expectBoolean(evidence.required, 'Correction session evidence required'),
      supportedKinds: expectStringArray(evidence.supportedKinds, 'Correction session evidence supportedKinds')
        .map((kind) => {
          if (!['text', 'quote', 'annotation', 'link', 'attachment', 'structured'].includes(kind)) {
            throw new Error(`Unsupported evidence kind "${kind}".`);
          }

          return kind as Exams.KbrCorrectionEvidenceKind;
        }),
      allowMultipleEvidenceItems: expectBoolean(evidence.allowMultipleEvidenceItems, 'Correction session evidence allowMultipleEvidenceItems')
    },
    imports: {
      mergeStrategy: mergeStrategy as Exams.CorrectionSessionImportRules['mergeStrategy'],
      allowUnmappedScores: expectBoolean(imports.allowUnmappedScores, 'Correction session import allowUnmappedScores'),
      preserveManualComments: expectBoolean(imports.preserveManualComments, 'Correction session import preserveManualComments'),
      preserveExistingEvidence: expectBoolean(imports.preserveExistingEvidence, 'Correction session import preserveExistingEvidence')
    },
    metadata: optionalRecord(rules.metadata)
  };
}

export function validateImportBundleSchemaDocument(input: unknown): Exams.CorrectionSessionImportBundleSchemaDocument {
  const schema = expectPlainObject(input, 'Import bundle schema');
  const type = expectString(schema.type, 'Import bundle schema type');

  if (type !== 'object') {
    throw new Error(`Import bundle schema type must be "object", received "${type}".`);
  }

  const required = schema.required === undefined ? undefined : expectStringArray(schema.required, 'Import bundle schema required');

  return {
    ...schema,
    $schema: schema.$schema === undefined ? undefined : expectString(schema.$schema, 'Import bundle schema $schema'),
    $id: schema.$id === undefined ? undefined : expectString(schema.$id, 'Import bundle schema $id'),
    title: schema.title === undefined ? undefined : expectString(schema.title, 'Import bundle schema title'),
    description: schema.description === undefined ? undefined : expectString(schema.description, 'Import bundle schema description'),
    type,
    required,
    additionalProperties: schema.additionalProperties === undefined
      ? undefined
      : expectBoolean(schema.additionalProperties, 'Import bundle schema additionalProperties')
  };
}
