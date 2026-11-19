import type { Exams } from '@viccoboard/core'
import { examSchoolYear, isExamTemplate } from '../src/utils/exam-school-year'

const classYears = new Map([
  ['class-old', '2025/2026'],
  ['class-new', '2026/2027']
])

describe('exam school-year classification', () => {
  test('keeps templates available independent of date or school year', () => {
    const template = {
      kind: 'template',
      classGroupId: 'class-old',
      date: new Date('2026-05-05'),
      candidates: []
    } as unknown as Exams.Exam
    expect(isExamTemplate(template)).toBe(true)
    expect(examSchoolYear(template, classYears)).toBeNull()
  })

  test('explicit exams remain exams without a date, class or candidates', () => {
    const draft = {
      kind: 'exam',
      candidates: []
    } as unknown as Exams.Exam
    expect(isExamTemplate(draft)).toBe(false)
  })

  test('does not treat previously mislabelled exams with candidates as templates', () => {
    const exam = {
      kind: 'template',
      candidates: [{ id: 'candidate-1' }],
      date: new Date('2026-11-04')
    } as unknown as Exams.Exam
    expect(isExamTemplate(exam)).toBe(false)
    expect(examSchoolYear(exam, classYears)).toBe('2026/2027')
  })

  test('retains the legacy fallback for records without a saved kind', () => {
    const legacy = { candidates: [] } as unknown as Exams.Exam
    expect(isExamTemplate(legacy)).toBe(true)
  })

  test('uses the exam date when the class advances to another year', () => {
    const exam = {
      kind: 'exam',
      classGroupId: 'class-old',
      date: new Date('2026-10-04'),
      candidates: [{ id: 'one' }]
    } as unknown as Exams.Exam
    expect(examSchoolYear(exam, classYears)).toBe('2026/2027')
  })

  test('uses the exam date for unassigned concrete exams', () => {
    const exam = {
      kind: 'exam',
      date: new Date('2026-11-04'),
      candidates: [{ id: 'one' }]
    } as unknown as Exams.Exam
    expect(examSchoolYear(exam, classYears)).toBe('2026/2027')
  })

  test('does not invent a school year for an unassigned draft without date', () => {
    const exam = { kind: 'exam', candidates: [{ id: 'one' }] } as unknown as Exams.Exam
    expect(examSchoolYear(exam, classYears)).toBeNull()
  })
})
