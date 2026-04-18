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
  if (!bundle.contract?.rules?.imports) {
    throw new Error('Import bundle contract.rules.imports is required.');
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

  return { bundle };
}
