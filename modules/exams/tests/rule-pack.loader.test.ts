import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from '@jest/globals';

import {
  loadCorrectionSessionRulePackFromDirectory,
  loadDefaultCorrectionSessionRulePack,
  resolveDefaultCorrectionSessionRulePackDirectory,
  validateCorrectionSessionRules,
  validateRulePackManifest
} from '../src/rule-packs/index';

describe('correction session rule pack loader', () => {
  it('loads the default rule pack with resolved resources', () => {
    const rulePack = loadDefaultCorrectionSessionRulePack();

    expect(rulePack.manifest.id).toBe('default');
    expect(rulePack.manifest.resources.rules).toBe('rules.yml');
    expect(rulePack.rules.rulePackId).toBe('default');
    expect(rulePack.rules.scoring.aggregation).toBe('task');
    expect(rulePack.rules.evidence.required).toBe(false);
    expect(rulePack.rules.deductionGovernance).toEqual({
      applyWhenPointsBelowMaxPoints: true,
      requireDefectStatement: true,
      requireEvidenceForDeductions: true,
      requireExplanationForAnyNonFullScore: true,
      rejectUnjustifiedDeductions: true,
      minimumDeductionStepRequiresJustification: true,
      onMissingDefect: 'reject-deduction',
      onMissingEvidence: 'reject-deduction'
    });
    expect(rulePack.rules.metadata?.deductionGovernance).toBeUndefined();
    expect(rulePack.templates.contract).toContain('{{session.chatRef}}');
    expect(rulePack.templates.contract).toContain('{{render.chatRefs}}');
    expect(rulePack.templates.contract).not.toContain('{{session.candidateRef}}');
    expect(rulePack.templates.prompt).toContain('{{contractMarkdown}}');
    expect(rulePack.importBundleSchema.type).toBe('object');
    expect(rulePack.importBundleSchema.properties?.sessionMap).toBeUndefined();
  });

  it('resolves the default rule pack directory inside the exams package', () => {
    const rulePackDirectory = resolveDefaultCorrectionSessionRulePackDirectory();

    expect(path.basename(rulePackDirectory)).toBe('default');
    expect(fs.existsSync(path.join(rulePackDirectory, 'manifest.yml'))).toBe(true);
  });

  it('rejects manifests without resource descriptors', () => {
    const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'viccoboard-rule-pack-'));

    fs.writeFileSync(
      path.join(tempDirectory, 'manifest.yml'),
      [
        'id: invalid',
        'schemaVersion: "1"',
        'version: 1.0.0',
        'name: Invalid',
        'target: correction-session'
      ].join('\n'),
      'utf8'
    );

    expect(() => loadCorrectionSessionRulePackFromDirectory(tempDirectory)).toThrow(
      'Rule pack manifest resources must be an object.'
    );
  });

  it('validates manifest objects explicitly', () => {
    const manifest = validateRulePackManifest({
      id: 'custom',
      schemaVersion: '1',
      version: '2.0.0',
      name: 'Custom Pack',
      target: 'correction-session',
      resources: {
        rules: 'rules.yml',
        contractTemplate: 'contract.template.md',
        promptTemplate: 'prompt.template.md',
        importBundleSchema: 'import-bundle.schema.json'
      }
    });

    expect(manifest.resources.promptTemplate).toBe('prompt.template.md');
  });

  it('rejects correction rules without first-class deduction governance', () => {
    expect(() =>
      validateCorrectionSessionRules({
        taskSelection: 'leaf-only',
        scoring: {
          aggregation: 'task',
          allowPartialPoints: true,
          allowAlternativeGrading: true,
          allowManualScoringUnits: false
        },
        evidence: {
          required: false,
          supportedKinds: ['text'],
          allowMultipleEvidenceItems: true
        },
        imports: {
          mergeStrategy: 'merge',
          allowUnmappedScores: false,
          preserveManualComments: true,
          preserveExistingEvidence: true
        }
      })
    ).toThrow('Correction session deduction governance rules must be an object.');
  });

  it('rejects deduction governance shadow keys in metadata', () => {
    expect(() =>
      validateCorrectionSessionRules({
        taskSelection: 'leaf-only',
        scoring: {
          aggregation: 'task',
          allowPartialPoints: true,
          allowAlternativeGrading: true,
          allowManualScoringUnits: false
        },
        evidence: {
          required: false,
          supportedKinds: ['text'],
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
          deductionGovernance: {
            requireEvidence: true
          }
        }
      })
    ).toThrow('Correction session metadata must not define deduction governance key "deductionGovernance".');
  });
});
