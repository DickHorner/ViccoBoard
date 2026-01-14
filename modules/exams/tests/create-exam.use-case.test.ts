import { createExamPayload } from '../src/use-cases/create-exam.use-case';

describe('Exams module basic', () => {
  it('creates a simple exam payload', () => {
    const exam = createExamPayload('Test Exam');
    expect(exam.title).toBe('Test Exam');
    expect(exam.mode).toBeDefined();
    expect(exam.id).toBeDefined();
  });
});
