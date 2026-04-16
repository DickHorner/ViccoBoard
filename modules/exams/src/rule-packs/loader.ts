import fs from 'node:fs';
import path from 'node:path';

import { parse as parseYaml } from 'yaml';
import { Exams } from '@viccoboard/core';

import type { LoadedCorrectionSessionRulePack } from './types.js';
import {
  validateCorrectionSessionRules,
  validateImportBundleSchemaDocument,
  validateRulePackManifest
} from './validation.js';

const DEFAULT_RULE_PACK_ID = 'default';
const MANIFEST_FILE_NAME = 'manifest.yml';

function readRequiredTextFile(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Rule pack resource not found: ${filePath}`);
  }

  return fs.readFileSync(filePath, 'utf8');
}

function parseYamlFile(filePath: string): unknown {
  return parseYaml(readRequiredTextFile(filePath));
}

function parseJsonFile(filePath: string): unknown {
  return JSON.parse(readRequiredTextFile(filePath)) as unknown;
}

function resolveResourcePath(rulePackDirectory: string, relativePath: string): string {
  if (path.isAbsolute(relativePath)) {
    throw new Error(`Rule pack resource paths must be relative: ${relativePath}`);
  }

  const resolvedPath = path.resolve(rulePackDirectory, relativePath);
  const relativeToPack = path.relative(rulePackDirectory, resolvedPath);
  if (relativeToPack.startsWith('..') || path.isAbsolute(relativeToPack)) {
    throw new Error(`Rule pack resource path escapes the pack directory: ${relativePath}`);
  }

  return resolvedPath;
}

export function getCorrectionSessionRulePacksRootDirectory(): string {
  const candidateDirectories = [
    path.resolve(process.cwd(), 'modules', 'exams', 'rule-packs'),
    path.resolve(process.cwd(), 'rule-packs')
  ];

  const resolvedDirectory = candidateDirectories.find((candidate) => fs.existsSync(candidate));
  if (!resolvedDirectory) {
    throw new Error('Could not resolve the correction-session rule pack root directory.');
  }

  return resolvedDirectory;
}

export function resolveCorrectionSessionRulePackDirectory(rulePackId: string): string {
  return path.join(getCorrectionSessionRulePacksRootDirectory(), rulePackId);
}

export function resolveDefaultCorrectionSessionRulePackDirectory(): string {
  return resolveCorrectionSessionRulePackDirectory(DEFAULT_RULE_PACK_ID);
}

export function loadCorrectionSessionRulePackFromDirectory(rulePackDirectory: string): LoadedCorrectionSessionRulePack {
  const manifestPath = path.join(rulePackDirectory, MANIFEST_FILE_NAME);
  const manifest = validateRulePackManifest(parseYamlFile(manifestPath));

  const resourcePaths = {
    manifest: manifestPath,
    rules: resolveResourcePath(rulePackDirectory, manifest.resources.rules),
    contractTemplate: resolveResourcePath(rulePackDirectory, manifest.resources.contractTemplate),
    promptTemplate: resolveResourcePath(rulePackDirectory, manifest.resources.promptTemplate),
    importBundleSchema: resolveResourcePath(rulePackDirectory, manifest.resources.importBundleSchema)
  };

  const rules = validateCorrectionSessionRules(parseYamlFile(resourcePaths.rules));
  const importBundleSchema = validateImportBundleSchemaDocument(parseJsonFile(resourcePaths.importBundleSchema));
  const templates: Exams.CorrectionSessionTemplateSet = {
    contract: readRequiredTextFile(resourcePaths.contractTemplate),
    prompt: readRequiredTextFile(resourcePaths.promptTemplate)
  };

  return {
    directoryPath: rulePackDirectory,
    resourcePaths,
    manifest,
    rules,
    templates,
    importBundleSchema
  };
}

export function loadCorrectionSessionRulePack(rulePackId: string): LoadedCorrectionSessionRulePack {
  return loadCorrectionSessionRulePackFromDirectory(resolveCorrectionSessionRulePackDirectory(rulePackId));
}

export function loadDefaultCorrectionSessionRulePack(): LoadedCorrectionSessionRulePack {
  return loadCorrectionSessionRulePack(DEFAULT_RULE_PACK_ID);
}
