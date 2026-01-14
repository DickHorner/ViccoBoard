"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const create_exam_use_case_1 = require("../src/use-cases/create-exam.use-case");
describe('Exams module basic', () => {
    it('creates a simple exam payload', () => {
        const exam = (0, create_exam_use_case_1.createExamPayload)('Test Exam');
        expect(exam.title).toBe('Test Exam');
        expect(exam.mode).toBeDefined();
        expect(exam.id).toBeDefined();
    });
});
