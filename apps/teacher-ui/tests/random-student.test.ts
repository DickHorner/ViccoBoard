import { selectRandomStudentId } from '../src/utils/random-student'

describe('random student selection', () => {
  it('avoids selecting already used students while cycle is incomplete', () => {
    const result = selectRandomStudentId(['s1', 's2', 's3'], ['s1', 's2'], () => 0)

    expect(result).toEqual({
      selectedStudentId: 's3',
      updatedHistory: ['s1', 's2', 's3'],
      restartedCycle: false
    })
  })

  it('restarts history when all students were already selected', () => {
    const result = selectRandomStudentId(['s1', 's2'], ['s1', 's2'], () => 0.8)

    expect(result).toEqual({
      selectedStudentId: 's2',
      updatedHistory: ['s2'],
      restartedCycle: true
    })
  })
})
