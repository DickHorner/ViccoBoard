import { Exams } from '@viccoboard/core';
const uuidv4 = () => crypto.randomUUID();

export function createExamPayload(title: string): Exams.Exam {
  const exam: Exams.Exam = {
    id: uuidv4(),
    title,
    assessmentFormat: 'klausur',
    mode: Exams.ExamMode.Simple,
    structure: {
      parts: [],
      tasks: [],
      allowsComments: false,
      allowsSupportTips: false,
      totalPoints: 0
    } as Exams.ExamStructure,
    gradingKey: {
      id: uuidv4(),
      name: 'default',
      type: Exams.GradingKeyType.Points,
      totalPoints: 0,
      gradeBoundaries: [],
      roundingRule: { type: 'none', decimalPlaces: 0 },
      errorPointsToGrade: false,
      customizable: true,
      modifiedAfterCorrection: false
    },
    printPresets: [],
    candidates: [],
    candidateGroups: [],
    status: 'draft',
    createdAt: new Date(),
    lastModified: new Date(),
    description: ''
  };

  return exam;
}
