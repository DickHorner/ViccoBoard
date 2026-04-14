import type { Exams, Student } from '@viccoboard/core'

import {
  createCandidateGroup,
  mapStudentToExamCandidate,
  mergeImportedCandidates,
  synchronizeCandidateGroups
} from '../src/utils/exam-candidates'

describe('exam candidate utilities', () => {
  const student: Student = {
    id: 'student-1',
    firstName: 'Mia',
    lastName: 'Becker',
    dateOfBirth: '2010-03-05',
    classGroupId: 'class-1',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    lastModified: new Date('2026-01-01T00:00:00Z')
  }

  it('maps students to linked exam candidates', () => {
    const candidate = mapStudentToExamCandidate(student, 'exam-1')

    expect(candidate.studentId).toBe('student-1')
    expect(candidate.firstName).toBe('Mia')
    expect(candidate.lastName).toBe('Becker')
    expect(candidate.examId).toBe('exam-1')
  })

  it('deduplicates imported candidates by student id', () => {
    const existing = [mapStudentToExamCandidate(student, 'exam-1')]
    const merged = mergeImportedCandidates(existing, [mapStudentToExamCandidate(student, 'exam-1')])

    expect(merged).toHaveLength(1)
  })

  it('keeps only valid group members after candidate changes', () => {
    const candidates: Exams.Candidate[] = [mapStudentToExamCandidate(student, 'exam-1')]
    const groups = [{
      ...createCandidateGroup('Gruppe A'),
      memberCandidateIds: [candidates[0].id, 'missing-candidate']
    }]

    const synchronized = synchronizeCandidateGroups(groups, candidates)

    expect(synchronized[0].memberCandidateIds).toEqual([candidates[0].id])
  })
})
