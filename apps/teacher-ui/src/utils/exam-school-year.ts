import type { Exams } from '@viccoboard/core'

export function isExamTemplate(exam: Exams.Exam): boolean {
  if (exam.candidates.length > 0) return false
  if (exam.kind) return exam.kind === 'template'
  return !exam.date && !exam.classGroupId
}

export function schoolYearForDate(date: Date): string | null {
  if (!Number.isFinite(date.getTime())) return null
  const year = date.getMonth() >= 7 ? date.getFullYear() : date.getFullYear() - 1
  return `${year}/${year + 1}`
}

export function examSchoolYear(exam: Exams.Exam, classYears: Map<string, string>): string | null {
  if (isExamTemplate(exam)) return null

  const date = exam.date ?? exam.createdAt
  const datedYear = date && schoolYearForDate(date)
  if (datedYear) return datedYear

  return exam.classGroupId ? classYears.get(exam.classGroupId) ?? null : null
}
