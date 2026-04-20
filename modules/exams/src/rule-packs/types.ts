import type { Exams } from '@viccoboard/core';

export interface LoadedCorrectionSessionRulePack extends Exams.CorrectionSessionRulePack {
  directoryPath: string;
  resourcePaths: {
    manifest: string;
    rules: string;
    contractTemplate: string;
    promptTemplate: string;
    importBundleSchema: string;
  };
}

export interface CorrectionSessionRulePackSource {
  id?: string;
  directoryPath?: string;
  loadedRulePack?: LoadedCorrectionSessionRulePack;
}
