export interface RandomStudentSelection {
  selectedStudentId: string
  updatedHistory: string[]
  restartedCycle: boolean
}

export function selectRandomStudentId(
  studentIds: string[],
  history: string[],
  random: () => number = Math.random
): RandomStudentSelection | null {
  if (studentIds.length === 0) {
    return null
  }

  const historySet = new Set(history)
  let restartedCycle = false
  let candidates = studentIds.filter((studentId) => !historySet.has(studentId))
  let baseHistory = history

  if (candidates.length === 0) {
    restartedCycle = true
    baseHistory = []
    candidates = [...studentIds]
  }

  const clampedRandom = Math.min(Math.max(random(), 0), 0.999999999)
  const selectedIndex = Math.floor(clampedRandom * candidates.length)
  const selectedStudentId = candidates[selectedIndex]

  return {
    selectedStudentId,
    updatedHistory: [...baseHistory, selectedStudentId],
    restartedCycle
  }
}
