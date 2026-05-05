import { describe, expect, it } from '@jest/globals';

import { Exams } from '@viccoboard/core';

import { ExportCorrectionSessionArtifactsUseCase } from '../src/use-cases/export-correction-session.use-case';

function createTask(
  overrides: Partial<Exams.TaskNode> & Pick<Exams.TaskNode, 'id' | 'level' | 'order' | 'title' | 'points'>
): Exams.TaskNode {
  return {
    isChoice: false,
    criteria: [],
    allowComments: true,
    allowSupportTips: false,
    commentBoxEnabled: false,
    subtasks: [],
    ...overrides
  };
}

describe('ExportCorrectionSessionArtifactsUseCase', () => {
  it('exports one session-scoped contract and prompt with task-centric scoring units', () => {
    const exam: Exams.Exam = {
      id: 'exam-internal-id',
      title: 'Deutsch Klassenarbeit 1',
      assessmentFormat: 'klausur',
      mode: Exams.ExamMode.Complex,
      structure: {
        parts: [
          {
            id: 'part-internal-id',
            name: 'Sprachwissen',
            description: 'Pflichtteil',
            taskIds: ['task-root'],
            calculateSubScore: true,
            scoreType: 'points',
            printable: true,
            order: 1
          }
        ],
        tasks: [
          createTask({
            id: 'task-root',
            level: 1,
            order: 1,
            title: 'Aufgabe 1',
            points: 10,
            subtasks: ['task-leaf-a', 'task-leaf-b']
          }),
          createTask({
            id: 'task-leaf-a',
            parentId: 'task-root',
            level: 2,
            order: 1,
            title: 'Aufgabe 1a',
            points: 4,
            criteria: [
              {
                id: 'criterion-a1',
                text: 'Inhalt',
                formatting: { bold: true },
                points: 2,
                aspectBased: false
              },
              {
                id: 'criterion-a2',
                text: 'Sprache',
                formatting: {},
                points: 2,
                aspectBased: true,
                subCriteria: [
                  {
                    id: 'sub-a2-1',
                    text: 'Fachsprache',
                    formatting: {},
                    weight: 0.5
                  },
                  {
                    id: 'sub-a2-2',
                    text: 'Grammatik',
                    formatting: {},
                    weight: 0.5
                  }
                ]
              }
            ]
          }),
          createTask({
            id: 'task-leaf-b',
            parentId: 'task-root',
            level: 2,
            order: 2,
            title: 'Aufgabe 1b',
            points: 6
          })
        ],
        allowsComments: true,
        allowsSupportTips: true,
        totalPoints: 10
      },
      gradingKey: {
        id: 'grading-key-id',
        name: 'Punkte',
        type: Exams.GradingKeyType.Points,
        totalPoints: 10,
        gradeBoundaries: [],
        roundingRule: { type: 'none', decimalPlaces: 0 },
        errorPointsToGrade: false,
        customizable: true,
        modifiedAfterCorrection: false
      },
      printPresets: [],
      candidates: [
        {
          id: 'candidate-internal-1',
          examId: 'exam-internal-id',
          firstName: 'Mia',
          lastName: 'Muster'
        },
        {
          id: 'candidate-internal-2',
          examId: 'exam-internal-id',
          firstName: 'Noah',
          lastName: 'Beispiel'
        }
      ],
      candidateGroups: [],
      status: 'in-progress',
      createdAt: new Date('2026-04-17T09:00:00.000Z'),
      lastModified: new Date('2026-04-17T09:15:00.000Z')
    };

    const useCase = new ExportCorrectionSessionArtifactsUseCase();
    const result = useCase.execute({
      exam,
      sessionId: 'session-2026-04-17'
    });

    expect(result.sessionId).toBe('session-2026-04-17');
    expect(result.artifact.sessionChatRef).toBe('session-session-2026-04-17');
    expect(result.artifact.chatRefs).toEqual([
      'chat-0001',
      'chat-0002'
    ]);
    expect(result.sessionMap).toEqual({
      'chat-0001': 'candidate-internal-1',
      'chat-0002': 'candidate-internal-2'
    });

    const artifact = result.artifact;

    expect(artifact.contract.examId).toBeUndefined();
    expect(artifact.contract.candidateId).toBeUndefined();
    expect(artifact.contract.chatRef).toBe('session-session-2026-04-17');
    expect(artifact.contract.parts[0].id).toBe('part-1');
    expect(artifact.contract.taskTree.map((task) => task.id)).toEqual([
      'task-1',
      'task-1.1',
      'task-1.2'
    ]);
    expect(artifact.contract.scoringUnits.map((scoringUnit) => scoringUnit.id)).toEqual([
      'task-1.1.score',
      'task-1.2.score'
    ]);
    expect(artifact.contract.scoringUnits[0].metadata).toMatchObject({
      criteria: [
        {
          criterionId: 'criterion-a1',
          text: 'Inhalt',
          points: 2
        },
        {
          criterionId: 'criterion-a2',
          text: 'Sprache',
          points: 2,
          subCriteria: [
            { subCriterionId: 'sub-a2-1', text: 'Fachsprache', weight: 0.5 },
            { subCriterionId: 'sub-a2-2', text: 'Grammatik', weight: 0.5 }
          ]
        }
      ]
    });

    expect(artifact.contractFile.content).toContain('Exam Reference: `exam-deutsch-klassenarbeit-1`');
    expect(artifact.contractFile.fileName).toBe('kbr-correction-session-2026-04-17-contract.md');
    expect(artifact.promptFile.fileName).toBe('kbr-correction-session-2026-04-17-prompt.md');
    expect(artifact.contractFile.content).toContain('- chat-0001');
    expect(artifact.contractFile.content).not.toContain('Candidate Reference');
    expect(artifact.contractFile.content).not.toContain('exam-internal-id');
    expect(artifact.contractFile.content).not.toContain('candidate-internal-1');
    expect(artifact.contractFile.content).not.toContain('mia-muster');
    expect(artifact.contractFile.content).not.toContain('noah-beispiel');
    expect(artifact.promptFile.content).toContain(artifact.contractFile.content);
    expect(artifact.localReferenceMap.taskIdByRef['task-1.1']).toBe('task-leaf-a');
    expect(artifact.localReferenceMap.scoringUnitKeyByRef['task-1.1.score']).toBe(
      'task-leaf-a::task'
    );
    expect(artifact.localReferenceMap.candidateIdByChatRef).toEqual(result.sessionMap);

    // Criteria must appear as expectedHorizon in the rendered contract
    expect(artifact.contractFile.content).toContain('expectedHorizon:');
    expect(artifact.contractFile.content).toContain('Inhalt');
    expect(artifact.contractFile.content).toContain('Sprache');
    expect(artifact.contractFile.content).toContain('Fachsprache');
    expect(artifact.contractFile.content).toContain('Grammatik');

    // The contract must instruct the AI that expectedHorizon is the binding basis
    expect(artifact.contractFile.content).toContain('expectedHorizon');
    expect(artifact.contractFile.content).toContain('Erwartungshorizont');
    expect(artifact.promptFile.content).toContain('expectedHorizon');
  });

  it('export contains no criteria for tasks without criteria defined', () => {
    const exam: Exams.Exam = {
      id: 'exam-no-criteria',
      title: 'Simple Exam',
      assessmentFormat: 'klausur',
      mode: Exams.ExamMode.Simple,
      structure: {
        parts: [],
        tasks: [
          createTask({
            id: 'task-plain',
            level: 1,
            order: 1,
            title: 'Aufgabe 1',
            points: 5
          })
        ],
        allowsComments: false,
        allowsSupportTips: false,
        totalPoints: 5
      },
      gradingKey: {
        id: 'grading-key-plain',
        name: 'Punkte',
        type: Exams.GradingKeyType.Points,
        totalPoints: 5,
        gradeBoundaries: [],
        roundingRule: { type: 'none', decimalPlaces: 0 },
        errorPointsToGrade: false,
        customizable: true,
        modifiedAfterCorrection: false
      },
      printPresets: [],
      candidates: [
        {
          id: 'candidate-plain-1',
          examId: 'exam-no-criteria',
          firstName: 'Test',
          lastName: 'Person'
        }
      ],
      candidateGroups: [],
      status: 'draft',
      createdAt: new Date('2026-05-01T08:00:00.000Z'),
      lastModified: new Date('2026-05-01T08:00:00.000Z')
    };

    const useCase = new ExportCorrectionSessionArtifactsUseCase();
    const result = useCase.execute({ exam, sessionId: 'session-plain' });

    // No criteria defined → no expectedHorizon section in rendered output
    expect(result.artifact.contractFile.content).not.toContain('expectedHorizon:');
    // No hardcoded example criteria
    expect(result.artifact.contract.scoringUnits[0].metadata).toMatchObject({
      criteria: []
    });
  });
});
