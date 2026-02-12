/**
 * @deprecated LEGACY — blocked to prevent direct Dexie access.
 * Use useExamsBridge instead (correction repos/use-cases available there).
 */

export function useCorrections(): never {
  throw new Error(
    'useCorrections is legacy and disabled. Use useExamsBridge instead.'
  )
}
