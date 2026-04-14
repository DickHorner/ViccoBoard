import type { Exams, Student } from '@viccoboard/core'
import { createUuid } from './uuid'

export function mapStudentToExamCandidate(
  student: Student,
  examId: string,
  existingCandidateId?: string
): Exams.Candidate {
  return {
    id: existingCandidateId ?? createUuid(),
    examId,
    studentId: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    metadata: {
      classGroupId: student.classGroupId,
      dateOfBirth: student.dateOfBirth,
      importedFromStudentRepository: true
    }
  }
}

export function mergeImportedCandidates(
  existingCandidates: Exams.Candidate[],
  importedCandidates: Exams.Candidate[]
): Exams.Candidate[] {
  const byStudentId = new Map(
    existingCandidates
      .filter((candidate) => candidate.studentId)
      .map((candidate) => [candidate.studentId as string, candidate])
  )

  const merged = [...existingCandidates]

  for (const candidate of importedCandidates) {
    if (candidate.studentId && byStudentId.has(candidate.studentId)) {
      continue
    }

    merged.push(candidate)
  }

  return merged
}

export function createCandidateGroup(name?: string): Exams.CandidateGroup {
  return {
    id: createUuid(),
    name: name?.trim() || 'Neue Gruppe',
    memberCandidateIds: []
  }
}

export function synchronizeCandidateGroups(
  groups: Exams.CandidateGroup[],
  candidates: Exams.Candidate[]
): Exams.CandidateGroup[] {
  const validCandidateIds = new Set(candidates.map((candidate) => candidate.id))

  return groups.map((group) => ({
    ...group,
    memberCandidateIds: group.memberCandidateIds.filter((candidateId: string) => validCandidateIds.has(candidateId))
  }))
}
