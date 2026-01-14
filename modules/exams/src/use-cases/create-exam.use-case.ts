import { Exam, ExamMode, ExamStructure } from '@viccoboard/core/src/interfaces/exam.types';
import { v4 as uuidv4 } from 'uuid';

export function createExamPayload(title: string): Exam {
  const exam: Exam = {
    id: uuidv4(),
    title,
    mode: ExamMode.Simple,
    structure: { parts: [], tasks: [], allowsComments: false, allowsSupportTips: false, totalPoints: 0 } as ExamStructure,
    gradingKey: { id: uuidv4(), name: 'default', type: 'points', totalPoints: 0, gradeBoundaries: [], roundingRule: { type: 'none', decimalPlaces: 0 }, errorPointsToGrade: false, customizable: true, modifiedAfterCorrection: false },
    printPresets: [],
    candidates: [],
    status: 'draft',
    createdAt: new Date(),
    lastModified: new Date(),
    description: ''
  } as Exam;

  return exam;
}
