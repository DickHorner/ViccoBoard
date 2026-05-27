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
import { ImportKbrCorrectionBundleUseCase } from '../src/use-cases/import-kbr-correction-bundle.use-case';

function createImportRules(): Exams.CorrectionSessionRules {
  return {
    taskSelection: 'leaf-only',
    scoring: {
      aggregation: 'task',
      allowPartialPoints: true,
      allowAlternativeGrading: true,
      allowManualScoringUnits: false
    },
    evidence: {
      required: false,
      supportedKinds: ['text', 'structured'],
      allowMultipleEvidenceItems: true
    },
    deductionGovernance: {
      applyWhenPointsBelowMaxPoints: false,
      requireDefectStatement: false,
      requireEvidenceForDeductions: false,
      requireExplanationForAnyNonFullScore: false,
      rejectUnjustifiedDeductions: false,
      minimumDeductionStepRequiresJustification: false,
      onMissingDefect: 'allow-deduction',
      onMissingEvidence: 'allow-deduction'
    },
    imports: {
      mergeStrategy: 'merge',
      allowUnmappedScores: false,
      preserveManualComments: true,
      preserveExistingEvidence: true
    }
  };
}

function createBundle(chatRef: string, points: number): Exams.KbrCorrectionImportBundle {
  return {
    contract: {
      id: 'contract-session-session-42',
      chatRef: 'session-session-42',
      title: 'Import contract',
      parts: [],
      taskTree: [],
      scoringUnits: [],
      rules: createImportRules()
    },
    chatRef,
    importedTaskScores: [
      {
        taskId: 'task-1',
        points,
        maxPoints: 10
      }
    ]
  };
}

describe('ImportKbrCorrectionBundleUseCase batch import', () => {
  let storage: SQLiteStorage;
  let examRepo: ExamRepository;
  let correctionRepo: CorrectionEntryRepository;
  let importUseCase: ImportKbrCorrectionBundleUseCase;
  let exam: Exams.Exam;

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

    examRepo = new ExamRepository(storage.getAdapter());
    correctionRepo = new CorrectionEntryRepository(storage.getAdapter());
    const recordUseCase = new RecordCorrectionUseCase(correctionRepo, examRepo);
    importUseCase = new ImportKbrCorrectionBundleUseCase(examRepo, correctionRepo, recordUseCase);

    exam = await examRepo.create({
      title: 'Batch Import Test',
      assessmentFormat: 'klausur',
      mode: Exams.ExamMode.Simple,
      structure: {
        parts: [],
        tasks: [
          {
            id: 'task-internal-1',
            level: 1,
            order: 1,
            title: 'Aufgabe 1',
            points: 10,
            isChoice: false,
            criteria: [],
            allowComments: true,
            allowSupportTips: false,
            commentBoxEnabled: true,
            subtasks: []
          }
        ],
        allowsComments: true,
        allowsSupportTips: false,
        totalPoints: 10
      },
      gradingKey: {
        id: 'grading-key',
        name: 'Standard',
        type: Exams.GradingKeyType.Points,
        totalPoints: 10,
        gradeBoundaries: [],
        roundingRule: {
          type: 'nearest',
          decimalPlaces: 1
        },
        errorPointsToGrade: false,
        customizable: true,
        modifiedAfterCorrection: false
      },
      printPresets: [],
      candidates: [],
      candidateGroups: [],
      status: 'in-progress'
    });
  });

  afterEach(async () => {
    await storage.close();
  });

  it('imports an array of correction bundles sequentially', async () => {
    const result = await importUseCase.executeMany({
      examId: exam.id,
      sessionId: 'session-42',
      sessionMap: {
        examId: exam.id,
        sessionId: 'session-42',
        candidateIdByChatRef: {
          'chat-0001': 'candidate-1',
          'chat-0002': 'candidate-2'
        },
        taskIdByRef: {
          'task-1': 'task-internal-1'
        }
      },
      bundles: [createBundle('chat-0001', 8), createBundle('chat-0002', 10)]
    });

    expect(result.importedBundleCount).toBe(2);
    expect(result.importedTaskScoreCount).toBe(2);
    expect(result.results.map((entry) => entry.chatRef)).toEqual(['chat-0001', 'chat-0002']);

    const firstCorrection = await correctionRepo.findByExamAndCandidate(exam.id, 'candidate-1');
    const secondCorrection = await correctionRepo.findByExamAndCandidate(exam.id, 'candidate-2');

    expect(firstCorrection?.taskScores[0].points).toBe(8);
    expect(secondCorrection?.taskScores[0].points).toBe(10);
  });
});
