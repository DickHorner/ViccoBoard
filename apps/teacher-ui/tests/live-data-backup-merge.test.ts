import { describe, expect, it } from '@jest/globals'

import { mergeBackupValue } from '../src/services/live-data-backup-merge'

describe('live-data-backup-merge', () => {
  it('merges correction task scores by taskId so criterionScores are restored on reimport', () => {
    const currentRecord = {
      id: 'correction-1',
      taskScores: [
        {
          taskId: 'task-1',
          points: 9,
          maxPoints: 10
        }
      ]
    }

    const incomingRecord = {
      id: 'correction-1',
      taskScores: [
        {
          taskId: 'task-1',
          points: 9,
          maxPoints: 10,
          criterionScores: [
            { criterionId: 'criterion-1', points: 4, maxPoints: 4 },
            { criterionId: 'criterion-2', points: 5, maxPoints: 6 }
          ]
        }
      ]
    }

    const result = mergeBackupValue(currentRecord, incomingRecord)

    expect(result.conflict).toBe(false)
    expect(result.changed).toBe(true)
    expect(result.value).toEqual({
      id: 'correction-1',
      taskScores: [
        {
          taskId: 'task-1',
          points: 9,
          maxPoints: 10,
          criterionScores: [
            { criterionId: 'criterion-1', points: 4, maxPoints: 4 },
            { criterionId: 'criterion-2', points: 5, maxPoints: 6 }
          ]
        }
      ]
    })
  })

  it('merges nested criterionScores by criterionId instead of appending duplicates', () => {
    const currentTaskScore = {
      taskId: 'task-1',
      points: 9,
      maxPoints: 10,
      criterionScores: [
        { criterionId: 'criterion-1', points: 4, maxPoints: 4 }
      ]
    }

    const incomingTaskScore = {
      taskId: 'task-1',
      points: 9,
      maxPoints: 10,
      criterionScores: [
        { criterionId: 'criterion-1', points: 4, maxPoints: 4 },
        { criterionId: 'criterion-2', points: 5, maxPoints: 6 }
      ]
    }

    const result = mergeBackupValue(currentTaskScore, incomingTaskScore)

    expect(result.conflict).toBe(false)
    expect(result.changed).toBe(true)
    expect(result.value).toEqual({
      taskId: 'task-1',
      points: 9,
      maxPoints: 10,
      criterionScores: [
        { criterionId: 'criterion-1', points: 4, maxPoints: 4 },
        { criterionId: 'criterion-2', points: 5, maxPoints: 6 }
      ]
    })
  })
})
