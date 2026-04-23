import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import {
  SQLiteStorage,
  InitialSchemaMigration,
  GradingSchemaMigration,
  ExamSchemaMigration,
  CorrectionSchemaMigration
} from '@viccoboard/storage/node';
import { Exams } from '@viccoboard/core';

import { ExamRepository } from '../src/repositories/exam.repository';
import { CorrectionEntryRepository } from '../src/repositories/correction-entry.repository';
import { RecordCorrectionUseCase } from '../src/use-cases/record-correction.use-case-v2';
import { ExportCorrectionSessionArtifactsUseCase } from '../src/use-cases/export-correction-session.use-case';
import { ImportKbrCorrectionBundleUseCase } from '../src/use-cases/import-kbr-correction-bundle.use-case';
import { loadDefaultCorrectionSessionRulePack } from '../src/rule-packs/loader';

/**
 * Domain-agnostic factory for task nodes.
 */
function createGenericTask(
  overrides: Partial<Exams.TaskNode> & Pick<Exams.TaskNode, 'id' | 'level' | 'order' | 'title' | 'points'>
): Exams.TaskNode {
  return {
    isChoice: false,
    criteria: [],
    allowComments: true,
    allowSupportTips: false,
    commentBoxEnabled: true,
    subtasks: [],
    ...overrides
  };
}

describe('Correction Session Integration (Domain-Agnostic)', () => {
  let storage: SQLiteStorage;
  let examRepo: ExamRepository;
  let correctionRepo: CorrectionEntryRepository;
  let recordUseCase: RecordCorrectionUseCase;
  let exportUseCase: ExportCorrectionSessionArtifactsUseCase;
  let importUseCase: ImportKbrCorrectionBundleUseCase;

  beforeEach(async () => {
    storage = new SQLiteStorage({
      databasePath: ':memory:',
      memory: true
    });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    storage.registerMigration(new GradingSchemaMigration(storage));
    storage.registerMigration(new ExamSchemaMigration(storage));
    storage.registerMigration(new CorrectionSchemaMigration(storage));
    await storage.migrate();

    const adapter = storage.getAdapter();
    examRepo = new ExamRepository(adapter);
    correctionRepo = new CorrectionEntryRepository(adapter);
    recordUseCase = new RecordCorrectionUseCase(correctionRepo, examRepo);
    exportUseCase = new ExportCorrectionSessionArtifactsUseCase();
    importUseCase = new ImportKbrCorrectionBundleUseCase(examRepo, correctionRepo, recordUseCase);
  });

  afterEach(async () => {
    await storage.close();
  });

  it('executes a full export-import chain with hierarchical data and rule validation', async () => {
    // 1. Load Default Rule Pack
    const rulePack = loadDefaultCorrectionSessionRulePack();
    expect(rulePack.manifest.id).toBe('default');
    expect(rulePack.rules.deductionGovernance).toBeDefined();

    // 2. Setup Hierarchical, Domain-Agnostic Exam
    const exam = await examRepo.create({
      title: 'Agnostic Assessment Alpha',
      assessmentFormat: 'klausur',
      mode: Exams.ExamMode.Complex,
      structure: {
        parts: [
          {
            id: 'part-alpha',
            name: 'Module Alpha',
            description: 'Core components',
            taskIds: ['root-1'],
            calculateSubScore: true,
            scoreType: 'points',
            printable: true,
            order: 1
          }
        ],
        tasks: [
          createGenericTask({
            id: 'root-1',
            level: 1,
            order: 1,
            title: 'Section 1',
            points: 20,
            subtasks: ['leaf-1-1', 'leaf-1-2']
          }),
          createGenericTask({
            id: 'leaf-1-1',
            parentId: 'root-1',
            level: 2,
            order: 1,
            title: 'Sub-task 1.1',
            points: 10,
            criteria: [
              {
                id: 'crit-1-1-1',
                text: 'Quality Attribute A',
                points: 5,
                aspectBased: false,
                formatting: {}
              },
              {
                id: 'crit-1-1-2',
                text: 'Quality Attribute B',
                points: 5,
                aspectBased: false,
                formatting: {}
              }
            ]
          }),
          createGenericTask({
            id: 'leaf-1-2',
            parentId: 'root-1',
            level: 2,
            order: 2,
            title: 'Sub-task 1.2',
            points: 10
          })
        ],
        allowsComments: true,
        allowsSupportTips: false,
        totalPoints: 20
      },
      gradingKey: {
        id: 'gk-agnostic',
        name: 'Standard Points',
        type: Exams.GradingKeyType.Points,
        totalPoints: 20,
        gradeBoundaries: [],
        roundingRule: { type: 'nearest', decimalPlaces: 1 },
        errorPointsToGrade: false,
        customizable: true,
        modifiedAfterCorrection: false
      },
      candidates: [
        { id: 'c-1', firstName: 'Candidate', lastName: 'One', examId: 'placeholder' },
        { id: 'c-2', firstName: 'Candidate', lastName: 'Two', examId: 'placeholder' }
      ],
      candidateGroups: [],
      printPresets: [],
      status: 'in-progress'
    });

    // 3. Export Correction Session
    const sessionId = 'session-integration-test';
    const exportResult = exportUseCase.execute({ exam, sessionId });

    expect(exportResult.sessionId).toBe(sessionId);
    expect(exportResult.artifact.contract.rules.rulePackId).toBe('default');
    
    // Verify Contract Structure
    const { contract, promptFile, localReferenceMap } = exportResult.artifact;
    expect(contract.taskTree).toHaveLength(3); // root + 2 leaves
    expect(contract.scoringUnits).toHaveLength(2); // 2 leaves
    
    // Verify Mapping Files
    expect(promptFile.content).toContain(contract.chatRef);
    expect(Object.keys(localReferenceMap.candidateIdByChatRef)).toHaveLength(2);
    
    const chatRef1 = Object.keys(localReferenceMap.candidateIdByChatRef)[0];
    const candidateId1 = localReferenceMap.candidateIdByChatRef[chatRef1];

    // Prepare session map for import
    const importSessionMap = {
      examId: exam.id,
      sessionId,
      candidateIdByChatRef: localReferenceMap.candidateIdByChatRef,
      taskIdByRef: localReferenceMap.taskIdByRef
    };

    // 4. Import Correction Bundle (KbrCorrectionImportBundle)
    // Scenario: Candidate 1 gets full points, Candidate 2 gets deduction with/without evidence
    
    // Test Case A: Valid Import with Deduction + Evidence (Rules: requireEvidenceForDeductions = true)
    const bundleWithEvidence: Exams.KbrCorrectionImportBundle = {
      contract: contract,
      chatRef: chatRef1,
      importedTaskScores: [
        {
          taskId: 'task-1.1', // Ref from contract
          points: 8,
          maxPoints: 10,
          comment: 'Attribute A is missing specific details.',
          evidenceIds: ['ev-1']
        },
        {
          taskId: 'task-1.2',
          points: 10,
          maxPoints: 10
        }
      ],
      evidence: [
        {
          id: 'ev-1',
          kind: 'text',
          value: 'Found no mention of detailed specs in response line 5.'
        }
      ],
      metadata: {
        generalComment: 'Solid performance overall.'
      }
    };

    const importResultA = await importUseCase.execute({
      examId: exam.id,
      sessionId,
      sessionMap: importSessionMap,
      bundle: bundleWithEvidence
    });

    expect(importResultA.candidateId).toBe(candidateId1);
    expect(importResultA.importedTaskScoreCount).toBe(2);
    expect(importResultA.uncertainties).toHaveLength(0); // Should be clean because evidence is provided
    
    // Verify correction persistence
    const correctionA = await correctionRepo.findByExamAndCandidate(exam.id, candidateId1);
    expect(correctionA).toBeDefined();
    expect(correctionA?.taskScores).toHaveLength(2);
    expect(correctionA?.taskScores.find(ts => ts.taskId === 'leaf-1-1')?.points).toBe(8);

    // Test Case B: Validation of Deduction Rules (Missing Evidence)
    const chatRef2 = Object.keys(localReferenceMap.candidateIdByChatRef)[1];
    const candidateId2 = localReferenceMap.candidateIdByChatRef[chatRef2];
    
    const bundleWithoutEvidence: Exams.KbrCorrectionImportBundle = {
      contract: contract,
      chatRef: chatRef2,
      importedTaskScores: [
        {
          taskId: 'task-1.1',
          points: 5,
          maxPoints: 10,
          comment: 'Major flaws.'
          // missing evidenceIds
        }
      ]
    };

    const importResultB = await importUseCase.execute({
      examId: exam.id,
      sessionId,
      sessionMap: importSessionMap,
      bundle: bundleWithoutEvidence
    });

    // Default rule pack requires evidence for deductions (requireEvidenceForDeductions: true)
    // So it should flag an uncertainty but still record it if the use case allows (v2 behavior)
    expect(importResultB.uncertainties).toContainEqual(
      expect.objectContaining({
        code: 'deduction-requires-manual-review',
        reference: 'leaf-1-1'
      })
    );
    
    // 5. Verify Hierarchical Structure Reuse
    // Ensure that root tasks can also be scored if configured, 
    // but default rule pack usually targets leaves ('leaf-only')
    expect(contract.rules.taskSelection).toBe('leaf-only');
    expect(contract.scoringUnits.find(su => su.id === 'task-1.score')).toBeUndefined();
  });
});
