import type { Exams } from '@viccoboard/core'

export function isExamTemplate(exam: Exams.Exam): boolean {
  return exam.kind === 'template' || (
    exam.candidates.length === 0 && !exam.date && !exam.classGroupId
  )
}

export function examSchoolYear(exam: Exams.Exam, classYears: Map<string, string>): string | null {
  if (isExamTemplate(exam)) return null

  const date = exam.date ?? exam.createdAt
  if (date && Number.isFinite(date.getTime())) {
    const year = date.getMonth() >= 7 ? date.getFullYear() : date.getFullYear() - 1
    return `${year}/${year + 1}`
  }

  return exam.classGroupId ? classYears.get(exam.classGroupId) ?? null : null
}
