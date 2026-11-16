import type { Exams } from '@viccoboard/core'

export function isExamTemplate(exam: Exams.Exam): boolean {
  return exam.kind === 'template' || (
    exam.candidates.length === 0 && !exam.date && !exam.classGroupId
  )
}

export function examSchoolYear(exam: Exams.Exam, classYears: Map<string, string>): string | null {
  if (isExamTemplate(exam)) return null

  if (exam.classGroupId) {
    const classYear = classYears.get(exam.classGroupId)
    if (classYear) return classYear
  }

  if (!exam.date || !Number.isFinite(exam.date.getTime())) return null
  const year = exam.date.getMonth() >= 7
    ? exam.date.getFullYear()
    : exam.date.getFullYear() - 1
  return `${year}/${year + 1}`
}
