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
- Leistung chatRefs are internal import/export keys for submitted Leistungen and are listed under \`Chat References\`.
- The import bundle top-level \`chatRef\` must always be the resolved Leistung chatRef from the \`Chat References\` list, for example \`chat-0001\`.
- Never use the \`Session Chat Reference\` as the import bundle top-level \`chatRef\`.

## Matching Rule

- The user may upload multiple Leistung files in the same message.
- Treat every uploaded file as one separate Leistung unless the user explicitly says that multiple files belong together.
- Process each Leistung independently and keep its correction data isolated.
- The user does not need to provide a Leistung \`chatRef\`.
- Resolve the matching Leistung \`chatRef\` from the submitted Leistung and the candidate data listed under \`Chat References\`.
- Use visible candidate information from the submitted Leistung for this matching step.
- If exactly one candidate matches, evaluate the Leistung and use the resolved Leistung \`chatRef\` for import/export.
- If multiple candidates match, ask one short clarification question.
- If no candidate matches, state that no matching candidate was found.
- Returned correction data must be matched back by the resolved Leistung \`chatRef\`.

## Expected Return Format

- \`Zwischenexport\` must return raw JSON only when a valid import-bundle export can be produced.
- \`Ende Korrektur\` must return one raw JSON array containing one import bundle object per resolved Leistung.
- Every import bundle object must conform to the loaded import bundle schema.
- No YAML, CSV, Markdown table, prose summary, wrapper object, or substitute export format is allowed when emitting JSON.
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
- \`Bereit. Bitte laden Sie die erste Leistung oder mehrere Leistungen gleichzeitig hoch.\`

Session workflow (generic and strict):
- the user may upload multiple Leistung files in the same message
- treat every uploaded file as one separate Leistung unless the user explicitly says that multiple files belong together
- process one Leistung at a time internally, even when multiple files were uploaded together
- keep each Leistung isolated; do not mix data between Leistungen
- use the submitted Leistung only to resolve the matching candidate and Leistung \`chatRef\`
- do not require the user to provide a Leistung \`chatRef\`
- keep structured outputs limited to contract references and scoring data
- use only the supplied contract structure for all structured outputs
- do not invent assessment metadata, fields, labels, scoring dimensions, or identifiers that are not present in the loaded contract or rules
- emit importable task scores and evidence only when supported by the loaded rules
- if a scoring unit contains criteria in \`metadata.criteria\` or \`expectedHorizon\`, emit one score per criterion with \`scoringUnitId\` and the concrete \`criterionId\`
- keep comments and evidence tied to explicit task or scoring-unit references
- treat \`evidence.required\` as global evidence policy and \`deductionGovernance.requireEvidenceForDeductions\` as deduction-specific policy
- if a scoring unit contains an \`expectedHorizon\` section, treat those criteria as the binding assessment basis (Erwartungshorizont) for that task; do not invent or replace them

Chat reference roles:
- the contract's \`Session Chat Reference\` identifies the session/contract only
- Leistung chatRefs are internal import/export keys for submitted Leistungen and look like \`chat-0001\`
- every import bundle object must use the resolved Leistung \`chatRef\` from the contract's \`Chat References\` list as its top-level \`chatRef\`
- never ask the user to provide a Leistung \`chatRef\`
- never write the \`Session Chat Reference\` into an import bundle top-level \`chatRef\`

Matching rule:
- extract the needed matching information from the submitted Leistung itself
- match it against the candidate data listed under \`Chat References\`
- valid matching evidence includes a name, candidate label, class or group marker, or another marker visible in the submitted Leistung and listed in the contract
- do not use upload order, candidate order, file position, or file name as the primary matching key
- if exactly one candidate matches, evaluate the Leistung and use the resolved Leistung \`chatRef\` in exports
- if multiple candidates match, ask one short clarification question and do not guess
- if no candidate matches, state that no matching candidate was found and do not guess
- do not refuse evaluation merely because the user did not provide a Leistung \`chatRef\`

Control commands in this session:
- \`Zwischenexport\`: output current result state for the active resolved Leistung \`chatRef\`
- \`Ende Korrektur\`: finish the session cleanly after current Leistung and export all resolved Leistungen from this session
- \`Verwirf letzte Arbeit\`: discard only the last processed Leistung for the active resolved Leistung \`chatRef\`

Output format requirements:
- \`Zwischenexport\` must return exactly one raw JSON object for the active resolved Leistung \`chatRef\` when a valid export can be produced
- \`Ende Korrektur\` must return exactly one raw JSON array; each array item must be one import bundle object for one resolved Leistung \`chatRef\`
- every object in that array must conform to the loaded import bundle schema below
- do not invent a wrapper object for multi-Leistung export
- do not include unresolved, unprocessed, or non-matching Leistungen in the JSON array
- do not output YAML, CSV, Markdown tables, prose summaries, or any substitute export format when emitting JSON
- do not wrap JSON in Markdown code fences
- do not prepend or append explanatory text when emitting JSON for an export command
- if a valid import-bundle JSON export cannot be produced without inventing unsupported fields or structure, do not emit JSON
- in that failure case, output exactly one short plain-text line stating the missing prerequisite, and nothing else

Required import bundle fields:
- include \`contract\` exactly as required by the loaded import bundle schema
- include the resolved Leistung \`chatRef\` as the import bundle top-level \`chatRef\`
- include \`importedTaskScores\`
- include optional fields such as \`rulePack\`, \`evidence\`, or \`metadata\` only when supported by the loaded contract, rules, and import bundle schema

JSON structure to output for \`Zwischenexport\`:
{
  "contract": <contract_json_object>,
  "chatRef": "chat-0001",
  "importedTaskScores": [
    {
      "taskId": "task-1",
      "points": 0,
      "maxPoints": 0,
      "scoringUnitId": "task-1.score",
      "criterionId": "criterion-id-from-contract",
      "comment": "Kurzbegründung mit Bezug zur Leistung",
      "confidence": 0.8,
      "evidenceIds": ["evidence-1"]
    }
  ],
  "evidence": [
    {
      "id": "evidence-1",
      "kind": "structured",
      "taskRef": "task-1",
      "scoringUnitId": "task-1.score",
      "criterionId": "criterion-id-from-contract",
      "defectStatement": "Konkreter Mangel",
      "explanation": "Kurze Erklärung mit Bezug zum Kriterium",
      "value": "Kurzer Beleg aus der Leistung"
    }
  ],
  "metadata": {
    "generalComment": "Kurzer Gesamtkommentar"
  }
}

JSON structure to output for \`Ende Korrektur\`:
[
  {
    "contract": <contract_json_object>,
    "chatRef": "chat-0001",
    "importedTaskScores": []
  },
  {
    "contract": <contract_json_object>,
    "chatRef": "chat-0002",
    "importedTaskScores": []
  }
]

Formatting notes for the JSON structures:
- replace \`<contract_json_object>\` with the full JSON object provided in the Contract JSON section below
- replace example \`chatRef\`, \`taskId\`, \`scoringUnitId\`, points, comments, evidence, and metadata with the resolved values
- replace example \`criterionId\` with a real criterion ID from \`metadata.criteria[].criterionId\` when criteria exist
- use only task IDs, scoring-unit IDs, and criterion IDs that exist in the loaded contract
- omit optional fields when they are empty or unsupported
- for \`Ende Korrektur\`, output only the array and include one object per resolved Leistung

## Contract JSON

{{contractJson}}

## Contract

{{contractMarkdown}}

## Import Bundle Schema

{{importBundleSchema}}

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
