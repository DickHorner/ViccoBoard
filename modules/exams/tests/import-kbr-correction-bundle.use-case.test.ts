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
      applyWhenPointsBelowMaxPoints: true,
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

describe('ImportKbrCorrectionBundleUseCase', () => {
  let storage: SQLiteStorage;
  let examRepo: ExamRepository;
  let correctionRepo: CorrectionEntryRepository;
  let recordUseCase: RecordCorrectionUseCase;
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
    recordUseCase = new RecordCorrectionUseCase(correctionRepo, examRepo);
    importUseCase = new ImportKbrCorrectionBundleUseCase(examRepo, correctionRepo, recordUseCase);

    exam = await examRepo.create({
      title: 'Import-Test',
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

  it('imports task scores via chatRef + local session map and stores exam-level comments', async () => {
    const result = await importUseCase.execute({
      examId: exam.id,
      sessionId: 'session-42',
      sessionMap: {
        examId: exam.id,
        sessionId: 'session-42',
        candidateIdByChatRef: {
          'chat-0001': 'candidate-1'
        },
        taskIdByRef: {
          'task-1': 'task-internal-1'
        }
      },
      bundle: {
        contract: {
          id: 'contract-session-session-42',
          chatRef: 'session-session-42',
          title: 'Import contract',
          parts: [],
          taskTree: [],
          scoringUnits: [],
          rules: createImportRules()
        },
        chatRef: 'chat-0001',
        importedTaskScores: [
          {
            taskId: 'task-1',
            points: 10,
            maxPoints: 10,
            comment: 'Teilweise korrekt'
          }
        ],
        metadata: {
          generalComment: 'Gute Gesamtleistung.'
        }
      }
    });

    expect(result.candidateId).toBe('candidate-1');
    expect(result.chatRef).toBe('chat-0001');
    expect(result.importedTaskScoreCount).toBe(1);
    expect(result.correction.taskScores).toHaveLength(1);
    expect(result.correction.taskScores[0].taskId).toBe('task-internal-1');
    expect(result.correction.comments.some((comment) => comment.level === 'exam')).toBe(true);
    expect(result.correction.comments.find((comment) => comment.level === 'exam')?.text).toBe('Gute Gesamtleistung.');
  });

  it('accepts a deduction with defect statement and linked evidence', async () => {
    const result = await importUseCase.execute({
      examId: exam.id,
      sessionId: 'session-42',
      sessionMap: {
        examId: exam.id,
        sessionId: 'session-42',
        candidateIdByChatRef: {
          'chat-0001': 'candidate-1'
        },
        taskIdByRef: {
          'task-1': 'task-internal-1'
        }
      },
      bundle: {
        contract: {
          id: 'contract-session-session-42',
          chatRef: 'session-session-42',
          title: 'Import contract',
          parts: [],
          taskTree: [],
          scoringUnits: [],
          rules: createImportRules()
        },
        chatRef: 'chat-0001',
        importedTaskScores: [
          {
            taskId: 'task-1',
            points: 9,
            maxPoints: 10,
            comment: 'Ein Nachweis fehlt im Antwortteil.',
            evidenceIds: ['evidence-1']
          }
        ],
        evidence: [
          {
            id: 'evidence-1',
            kind: 'quote',
            value: 'Antwortzeile 3 bleibt ohne Beleg.'
          }
        ]
      }
    });

    expect(result.uncertainties.find((entry) => entry.code === 'deduction-requires-manual-review')).toBeUndefined();
    expect(result.correction.comments.find((comment) => comment.text.includes('Manuelle Prüfung erforderlich'))).toBeUndefined();
  });

  it('marks a deduction without evidence for manual review', async () => {
    const result = await importUseCase.execute({
      examId: exam.id,
      sessionId: 'session-42',
      sessionMap: {
        examId: exam.id,
        sessionId: 'session-42',
        candidateIdByChatRef: {
          'chat-0001': 'candidate-1'
        },
        taskIdByRef: {
          'task-1': 'task-internal-1'
        }
      },
      bundle: {
        contract: {
          id: 'contract-session-session-42',
          chatRef: 'session-session-42',
          title: 'Import contract',
          parts: [],
          taskTree: [],
          scoringUnits: [],
          rules: createImportRules()
        },
        chatRef: 'chat-0001',
        importedTaskScores: [
          {
            taskId: 'task-1',
            points: 9,
            maxPoints: 10,
            comment: 'Die Begründung bleibt unvollständig.'
          }
        ]
      }
    });

    expect(result.uncertainties).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'deduction-requires-manual-review',
          reference: 'task-internal-1'
        })
      ])
    );
    expect(result.correction.comments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          taskId: 'task-internal-1',
          level: 'task',
          text: expect.stringContaining('Manuelle Prüfung erforderlich')
        })
      ])
    );
  });

  it('marks the smallest deduction step without evidence for manual review', async () => {
    const result = await importUseCase.execute({
      examId: exam.id,
      sessionId: 'session-42',
      sessionMap: {
        examId: exam.id,
        sessionId: 'session-42',
        candidateIdByChatRef: {
          'chat-0001': 'candidate-1'
        },
        taskIdByRef: {
          'task-1': 'task-internal-1'
        }
      },
      bundle: {
        contract: {
          id: 'contract-session-session-42',
          chatRef: 'session-session-42',
          title: 'Import contract',
          parts: [],
          taskTree: [],
          scoringUnits: [],
          rules: createImportRules()
        },
        chatRef: 'chat-0001',
        importedTaskScores: [
          {
            taskId: 'task-1',
            points: 9.9,
            maxPoints: 10,
            comment: 'Kleiner Mangel ohne Nachweis.'
          }
        ]
      }
    });

    expect(result.uncertainties).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'deduction-requires-manual-review',
          message: expect.stringContaining('kleinste zulässige Abzugsschritt')
        })
      ])
    );
  });

  it('treats full points as unproblematic without extra justification', async () => {
    const result = await importUseCase.execute({
      examId: exam.id,
      sessionId: 'session-42',
      sessionMap: {
        examId: exam.id,
        sessionId: 'session-42',
        candidateIdByChatRef: {
          'chat-0001': 'candidate-1'
        },
        taskIdByRef: {
          'task-1': 'task-internal-1'
        }
      },
      bundle: {
        contract: {
          id: 'contract-session-session-42',
          chatRef: 'session-session-42',
          title: 'Import contract',
          parts: [],
          taskTree: [],
          scoringUnits: [],
          rules: createImportRules()
        },
        chatRef: 'chat-0001',
        importedTaskScores: [
          {
            taskId: 'task-1',
            points: 10,
            maxPoints: 10
          }
        ]
      }
    });

    expect(result.uncertainties.find((entry) => entry.code === 'deduction-requires-manual-review')).toBeUndefined();
    expect(result.correction.comments.find((comment) => comment.text.includes('Manuelle Prüfung erforderlich'))).toBeUndefined();
  });

  it('rejects unresolved chatRef mappings', async () => {
    await expect(
      importUseCase.execute({
        examId: exam.id,
        sessionId: 'session-42',
        sessionMap: {
          examId: exam.id,
          sessionId: 'session-42',
          candidateIdByChatRef: {},
          taskIdByRef: {
            'task-1': 'task-internal-1'
          }
        },
        bundle: {
          contract: {
            id: 'contract-session-session-42',
            chatRef: 'session-session-42',
            title: 'Import contract',
            parts: [],
            taskTree: [],
            scoringUnits: [],
            rules: createImportRules()
          },
          chatRef: 'chat-0001',
          importedTaskScores: [
            {
              taskId: 'task-1',
              points: 8,
              maxPoints: 10
            }
          ]
        }
      })
    ).rejects.toThrow('Could not resolve candidateId');
  });

  it('rejects points that violate configured point-step increments', async () => {
    const strictStepExam = await examRepo.create({
      title: 'Integer-only',
      assessmentFormat: 'klausur',
      mode: Exams.ExamMode.Simple,
      structure: exam.structure,
      gradingKey: {
        ...exam.gradingKey,
        id: 'grading-key-integer',
        roundingRule: {
          type: 'nearest',
          decimalPlaces: 0
        }
      },
      printPresets: [],
      candidates: [],
      candidateGroups: [],
      status: 'in-progress'
    });

    await expect(
      importUseCase.execute({
        examId: strictStepExam.id,
        sessionId: 'session-42',
        sessionMap: {
          examId: strictStepExam.id,
          sessionId: 'session-42',
          candidateIdByChatRef: {
            'chat-0001': 'candidate-1'
          },
          taskIdByRef: {
            'task-1': 'task-internal-1'
          }
        },
        bundle: {
          contract: {
            id: 'contract-session-session-42',
            chatRef: 'session-session-42',
            title: 'Import contract',
            parts: [],
            taskTree: [],
            scoringUnits: [],
            rules: createImportRules()
          },
          chatRef: 'chat-0001',
          importedTaskScores: [
            {
              taskId: 'task-1',
              points: 7.5,
              maxPoints: 10
            }
          ]
        }
      })
    ).rejects.toThrow('violates allowed point step');
  });
});
