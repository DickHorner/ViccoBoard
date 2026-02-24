/**
 * @deprecated LEGACY — blocked to prevent direct Dexie access.
 * Use module bridges instead: useSportBridge, useStudentsBridge, useExamsBridge.
 */

export function useDatabase(): never {
  throw new Error(
    'useDatabase is legacy and disabled. Use module bridges (Sport/students/exams) instead.'
  )
}
