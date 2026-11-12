import { Exams } from '@viccoboard/core';

import { parseExamDefinition } from '../src/use-cases/import-exam-definition.use-case';

const valid = {
  format: 'viccoboard-exam',
  version: 1,
  title: 'Übungsprüfung',
  description: 'Thema',
  assessmentFormat: 'test',
  tasks: [
    {
      title: 'Aufgabe 1',
      description: 'Erläutere die Antwort.',
      criteria: [
        { text: 'Fachlich richtige Aussage', points: 2 },
        { text: 'Nachvollziehbare Begründung', points: 1.5 }
      ]
    },
    {
      title: 'Aufgabe 2',
      subtasks: [
        { title: 'Teilaufgabe a', description: 'Nenne ein Merkmal.', criteria: [{ text: 'Merkmal genannt', points: 1 }] },
        { title: 'Teilaufgabe b', criteria: [{ text: 'Zwei Merkmale erläutert', points: 2 }] }
      ]
    }
  ]
};

describe('parseExamDefinition', () => {
  it('imports criterion-level expectations and nested tasks without candidate data', () => {
    const exam = parseExamDefinition(valid);
    expect(exam.kind).toBe('template');
    expect(exam.mode).toBe(Exams.ExamMode.Complex);
    expect(exam.status).toBe('draft');
    expect(exam.candidates).toEqual([]);
    expect(exam.assessmentFormat).toBe('test');
    expect(exam.structure.totalPoints).toBe(6.5);
    expect(exam.gradingKey.totalPoints).toBe(6.5);
    expect(exam.structure.tasks).toHaveLength(4);
    expect(exam.structure.tasks[0].description).toBe('Erläutere die Antwort.');
    expect(exam.structure.tasks[0].criteria[1]).toMatchObject({ text: 'Nachvollziehbare Begründung', points: 1.5 });
    expect(exam.structure.tasks[1].subtasks).toEqual([exam.structure.tasks[2].id, exam.structure.tasks[3].id]);
    expect(exam.structure.tasks[2].parentId).toBe(exam.structure.tasks[1].id);
    expect(exam.structure.tasks[1].points).toBe(3);
  });

  it('rejects unsupported format versions', () => {
    expect(() => parseExamDefinition({ ...valid, version: 2 })).toThrow('nicht unterstützte Version');
  });

  it('rejects an ambiguous task with both criteria and subtasks', () => {
    expect(() => parseExamDefinition({ ...valid, tasks: [
      { title: 'Aufgabe', criteria: [{ text: 'Kriterium', points: 1 }], subtasks: valid.tasks[1].subtasks }
    ] })).toThrow('nicht beides');
  });

  it('rejects invalid point values rather than silently recalculating them', () => {
    expect(() => parseExamDefinition({ ...valid, tasks: [
      { title: 'Aufgabe', criteria: [{ text: 'Kriterium', points: -1 }] }
    ] })).toThrow('0,5er-Schritten');
    expect(() => parseExamDefinition({ ...valid, tasks: [
      { title: 'Aufgabe', criteria: [{ text: 'Kriterium', points: 0.25 }] }
    ] })).toThrow('0,5er-Schritten');
  });

  it('rejects over-deep structures and unknown fields', () => {
    const tooDeep = { title: 'A', subtasks: [{ title: 'B', subtasks: [
      { title: 'C', subtasks: [{ title: 'D', criteria: [{ text: 'E', points: 1 }] }] }
    ] }] };
    expect(() => parseExamDefinition({ ...valid, tasks: [tooDeep] })).toThrow('drei Aufgabenebenen');
    expect(() => parseExamDefinition({ ...valid, students: [] })).toThrow('Unbekanntes Feld');
  });

  it('rejects empty expectations and tasks exceeding the limit', () => {
    expect(() => parseExamDefinition({ ...valid, tasks: [{ title: 'A', criteria: [] }] })).toThrow('Entweder Kriterien');
    expect(() => parseExamDefinition({ ...valid, tasks: Array.from({ length: 101 }, () => ({
      title: 'A', criteria: [{ text: 'B', points: 1 }]
    })) })).toThrow('Maximal 100 Aufgaben');
  });
});