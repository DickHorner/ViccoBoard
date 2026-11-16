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
