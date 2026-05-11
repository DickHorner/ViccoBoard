import type { LoadedCorrectionSessionRulePack } from './types.js';
import {
  validateCorrectionSessionRules,
  validateImportBundleSchemaDocument,
  validateRulePackManifest
} from './validation.js';

const EMBEDDED_RULE_PACK_DIRECTORY = 'embedded://rule-packs/default';

const DEFAULT_RULE_PACK_MANIFEST_SOURCE = {
  id: 'default',
  schemaVersion: '1',
  version: '1.0.0',
  name: 'Default correction session rule pack',
  description: 'Generic default resources for external correction-session contracts and imports.',
  target: 'correction-session',
  resources: {
    rules: 'rules.yml',
    contractTemplate: 'contract.template.md',
    promptTemplate: 'prompt.template.md',
    importBundleSchema: 'import-bundle.schema.json'
  },
  compatibility: {
    contractType: 'correction-session',
    contractVersion: '1',
    importBundleType: 'correction-import-bundle',
    importBundleVersion: '1'
  },
  metadata: {
    audience: 'generic-correction-session'
  }
} as const;

const DEFAULT_RULE_PACK_RULES_SOURCE = {
  rulePackId: 'default',
  taskSelection: 'leaf-only',
  scoring: {
    aggregation: 'task',
    allowPartialPoints: true,
    allowAlternativeGrading: true,
    allowManualScoringUnits: false
  },
  evidence: {
    required: false,
    supportedKinds: ['text', 'quote', 'annotation', 'link', 'attachment', 'structured'],
    allowMultipleEvidenceItems: true
  },
  deductionGovernance: {
    applyWhenPointsBelowMaxPoints: true,
    requireDefectStatement: true,
    requireEvidenceForDeductions: true,
    requireExplanationForAnyNonFullScore: true,
    rejectUnjustifiedDeductions: true,
    minimumDeductionStepRequiresJustification: true,
    onMissingDefect: 'reject-deduction',
    onMissingEvidence: 'reject-deduction'
  },
  imports: {
    mergeStrategy: 'merge',
    allowUnmappedScores: false,
    preserveManualComments: true,
    preserveExistingEvidence: true
  },
  metadata: {
    policy: 'generic-default'
  }
} as const;

const DEFAULT_CONTRACT_TEMPLATE = `# Correction Session Contract

- Session ID: \`{{session.id}}\`
- Session Chat Reference: \`{{session.chatRef}}\`
- Title: \`{{session.title}}\`
- Exam Reference: \`{{session.examRef}}\`
- Rule Pack: \`{{rulePack.manifest.id}}@{{rulePack.manifest.version}}\`

## Chat Reference Roles

- \`Session Chat Reference\` identifies this correction session/contract.
- Leistung chatRefs identify individual submitted Leistungen and are listed under \`Chat References\`.
- The import bundle top-level \`chatRef\` must always be a Leistung chatRef from the \`Chat References\` list, for example \`chat-0001\`.
- Never use the \`Session Chat Reference\` as the import bundle top-level \`chatRef\`.

## Matching Rule

- Each submitted Leistung must be explicitly associated with exactly one Leistung \`chatRef\`.
- The Leistung \`chatRef\` must be provided together with the submitted Leistung or immediately before it.
- Upload order is not semantic and must never be used for matching.
- Do not match by candidate order, file position, file name, personal name, candidate ID, or student ID.
- If a submitted Leistung has no unambiguous Leistung \`chatRef\`, it must not be evaluated until the Leistung \`chatRef\` is provided.
- Returned correction data must be matched back only by Leistung \`chatRef\`.

## Expected Return Format

- \`Zwischenexport\` and \`Ende Korrektur\` must return raw JSON only when a valid import-bundle export can be produced.
- The returned JSON must conform to the loaded import bundle schema.
- No YAML, CSV, Markdown table, prose summary, or substitute export format is allowed when emitting JSON.
- If a valid import-bundle JSON export cannot be produced, output exactly one short plain-text line stating the missing prerequisite, and nothing else.

## Chat References

{{render.chatRefs}}

## Parts

{{render.parts}}

## Task Tree

{{render.taskTree}}

## Scoring Units

> Criteria listed under \`expectedHorizon\` per scoring unit are the binding assessment basis (Erwartungshorizont). When present, use them as the authoritative evaluation standard for that task.

{{render.scoringUnits}}

## Rules

{{render.rules}}
`;

const DEFAULT_PROMPT_TEMPLATE = `You are assisting with a correction session based on a structured contract.

Initial response:
- \`Bereit. Bitte laden Sie die erste Leistung hoch.\`

Session workflow (generic and strict):
- process exactly one Leistung at a time
- keep each Leistung isolated; do not mix data between Leistungen
- use only Leistung \`chatRef\` values from the contract's \`Chat References\` list as external references for submitted Leistungen
- do not use names, candidate IDs, student IDs, or other personal identifiers
- use only the supplied contract structure for all structured outputs
- do not invent assessment metadata, fields, labels, scoring dimensions, or identifiers that are not present in the loaded contract or rules
- emit importable task scores and evidence only when supported by the loaded rules
- keep comments and evidence tied to explicit task or scoring-unit references
- treat \`evidence.required\` as global evidence policy and \`deductionGovernance.requireEvidenceForDeductions\` as deduction-specific policy
- if a scoring unit contains an \`expectedHorizon\` section, treat those criteria as the binding assessment basis (Erwartungshorizont) for that task; do not invent or replace them

Chat reference roles:
- the contract's \`Session Chat Reference\` identifies the session/contract only
- Leistung chatRefs identify individual submitted Leistungen and look like \`chat-0001\`
- the import bundle top-level \`chatRef\` must always be the Leistung chatRef from the \`Chat References\` list
- never write the \`Session Chat Reference\` into the import bundle top-level \`chatRef\`

Matching rule:
- each uploaded Leistung must have exactly one explicit Leistung \`chatRef\`
- the Leistung \`chatRef\` must be provided in the same message as the uploaded Leistung or immediately before it
- upload order is never semantic and must never be used for matching
- do not infer Leistung \`chatRef\` from candidate order, file position, file name, personal name, candidate ID, or student ID
- if no unambiguous Leistung \`chatRef\` is provided, ask for the Leistung \`chatRef\` and do not evaluate the Leistung yet
- every stored result and every export must use the explicit Leistung \`chatRef\` of that Leistung

Control commands in this session:
- \`Zwischenexport\`: output current result state for the active Leistung \`chatRef\`
- \`Ende Korrektur\`: finish the session cleanly after current Leistung
- \`Verwirf letzte Arbeit\`: discard only the last processed Leistung for the active Leistung \`chatRef\`

Output format requirements:
- \`Zwischenexport\` must return exactly one raw JSON object for the active Leistung \`chatRef\` when a valid export can be produced
- \`Ende Korrektur\` must return exactly one raw JSON object for the final export when a valid export can be produced
- the returned JSON must conform to the loaded import bundle schema
- do not output YAML, CSV, Markdown tables, prose summaries, or any substitute export format when emitting JSON
- do not wrap JSON in Markdown code fences
- do not prepend or append explanatory text when emitting JSON for an export command
- if a valid import-bundle JSON export cannot be produced without inventing unsupported fields or structure, do not emit JSON
- in that failure case, output exactly one short plain-text line stating the missing prerequisite, and nothing else

Required import bundle fields:
- include \`contract\` exactly as required by the loaded import bundle schema
- include the active Leistung \`chatRef\` as the import bundle top-level \`chatRef\`
- include \`importedTaskScores\`
- include optional fields such as \`rulePack\`, \`evidence\`, or \`metadata\` only when supported by the loaded contract, rules, and import bundle schema

## Contract

{{contractMarkdown}}

## Rule Pack Metadata

{{rulePackManifest}}

## Active Rules

{{rulePackRules}}
`;

const DEFAULT_IMPORT_BUNDLE_SCHEMA_SOURCE = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://viccoboard.local/schemas/correction-session/import-bundle.schema.json',
  title: 'Correction Session Import Bundle',
  description: 'Generic import bundle for externally corrected task scores and linked evidence.',
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
      pattern: '^chat-[0-9]+$',
      description: 'Session-local opaque chat reference of the corrected Leistung.'
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
} as const;

export function getEmbeddedDefaultCorrectionSessionRulePack(): LoadedCorrectionSessionRulePack {
  return {
    directoryPath: EMBEDDED_RULE_PACK_DIRECTORY,
    resourcePaths: {
      manifest: `${EMBEDDED_RULE_PACK_DIRECTORY}/manifest.yml`,
      rules: `${EMBEDDED_RULE_PACK_DIRECTORY}/rules.yml`,
      contractTemplate: `${EMBEDDED_RULE_PACK_DIRECTORY}/contract.template.md`,
      promptTemplate: `${EMBEDDED_RULE_PACK_DIRECTORY}/prompt.template.md`,
      importBundleSchema: `${EMBEDDED_RULE_PACK_DIRECTORY}/import-bundle.schema.json`
    },
    manifest: validateRulePackManifest(DEFAULT_RULE_PACK_MANIFEST_SOURCE),
    rules: validateCorrectionSessionRules(DEFAULT_RULE_PACK_RULES_SOURCE),
    templates: {
      contract: DEFAULT_CONTRACT_TEMPLATE,
      prompt: DEFAULT_PROMPT_TEMPLATE
    },
    importBundleSchema: validateImportBundleSchemaDocument(DEFAULT_IMPORT_BUNDLE_SCHEMA_SOURCE)
  };
}
