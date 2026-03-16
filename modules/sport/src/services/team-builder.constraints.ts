import { TeamConstraintError } from './team-builder.types'
import type { BuiltTeam, TeamConstraintConflict, TeamStudent } from './team-builder.types'

export function mergeAlwaysTogether(groups: string[][]): string[][] {
  if (groups.length === 0) return []
  const parent: Map<string, string> = new Map()
  const find = (id: string): string => {
    if (!parent.has(id)) parent.set(id, id)
    const current = parent.get(id)!
    if (current !== id) parent.set(id, find(current))
    return parent.get(id)!
  }
  const union = (a: string, b: string) => {
    parent.set(find(a), find(b))
  }

  for (const group of groups) {
    for (let i = 1; i < group.length; i++) union(group[0], group[i])
  }

  const merged: Map<string, string[]> = new Map()
  for (const [id] of parent) {
    const root = find(id)
    if (!merged.has(root)) merged.set(root, [])
    merged.get(root)!.push(id)
  }
  return Array.from(merged.values()).filter(group => group.length > 1)
}

export function validateConstraints(
  students: TeamStudent[],
  alwaysTogether: string[][],
  neverTogether: string[][],
  teamCount: number
): void {
  const conflicts: TeamConstraintConflict[] = []
  const studentIds = new Set(students.map(student => student.id))
  const maxTeamSize = Math.ceil(students.length / teamCount)

  for (const group of alwaysTogether) {
    if (group.length > maxTeamSize) {
      conflicts.push({
        type: 'alwaysTogether-group-too-large',
        message: `An "always together" group of ${group.length} students cannot fit into a team (max team size: ${maxTeamSize})`,
        studentIds: group
      })
    }
  }

  for (const alwaysGroup of alwaysTogether) {
    const alwaysSet = new Set(alwaysGroup)
    for (const neverGroup of neverTogether) {
      const commonIds = neverGroup.filter(id => alwaysSet.has(id))
      if (commonIds.length >= 2) {
        conflicts.push({
          type: 'direct-contradiction',
          message: `Students [${commonIds.join(', ')}] must be both together and separated – this is impossible`,
          studentIds: commonIds
        })
      }
    }
  }

  for (const group of neverTogether) {
    const validIds = group.filter(id => studentIds.has(id))
    if (validIds.length > teamCount) {
      conflicts.push({
        type: 'neverTogether-unsatisfiable',
        message: `A "never together" group has ${validIds.length} members but only ${teamCount} teams exist – some pair must share a team`,
        studentIds: validIds
      })
    }
  }

  if (conflicts.length > 0) {
    throw new TeamConstraintError(
      `Team constraints cannot be satisfied (${conflicts.length} conflict${conflicts.length > 1 ? 's' : ''})`,
      conflicts
    )
  }
}

export function resolveNeverTogether(teams: BuiltTeam[], neverTogether: string[][]): void {
  if (neverTogether.length === 0) return
  const teamOf = new Map<string, number>()
  teams.forEach((team, teamIndex) => team.studentIds.forEach(id => teamOf.set(id, teamIndex)))

  let changed = true
  let iterations = 0
  const maxIterations = teams.length * Math.max(1, ...teams.map(team => team.studentIds.length)) * neverTogether.length + 10

  while (changed && iterations < maxIterations) {
    changed = false
    iterations++
    for (const group of neverTogether) {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const idA = group[i]
          const idB = group[j]
          const tiA = teamOf.get(idA)
          const tiB = teamOf.get(idB)
          if (tiA === undefined || tiB === undefined || tiA !== tiB) continue
          if (trySwap(idA, teams, neverTogether, teamOf)) changed = true
        }
      }
    }
  }
}

function trySwap(
  targetId: string,
  teams: BuiltTeam[],
  neverTogether: string[][],
  teamOf: Map<string, number>
): boolean {
  const sourceTeamIdx = teamOf.get(targetId)
  if (sourceTeamIdx === undefined) return false

  const neverPartnersOf = (id: string): Set<string> => {
    const partners = new Set<string>()
    for (const group of neverTogether) {
      if (group.includes(id)) group.forEach(partner => { if (partner !== id) partners.add(partner) })
    }
    return partners
  }

  const targetNeverPartners = neverPartnersOf(targetId)
  for (let teamIndex = 0; teamIndex < teams.length; teamIndex++) {
    if (teamIndex === sourceTeamIdx) continue
    const targetTeam = teams[teamIndex]
    for (const candidateId of targetTeam.studentIds) {
      const candidateNeverPartners = neverPartnersOf(candidateId)
      const targetTeamMembers = new Set(targetTeam.studentIds.filter(id => id !== candidateId))
      const sourceTeamMembers = new Set(teams[sourceTeamIdx].studentIds.filter(id => id !== targetId))
      const newViolationForTarget = [...targetTeamMembers].some(member => targetNeverPartners.has(member))
      const newViolationForCandidate = [...sourceTeamMembers].some(member => candidateNeverPartners.has(member))
      if (!newViolationForTarget && !newViolationForCandidate) {
        teams[sourceTeamIdx].studentIds = teams[sourceTeamIdx].studentIds.filter(id => id !== targetId)
        teams[sourceTeamIdx].studentIds.push(candidateId)
        targetTeam.studentIds = targetTeam.studentIds.filter(id => id !== candidateId)
        targetTeam.studentIds.push(targetId)
        teamOf.set(targetId, teamIndex)
        teamOf.set(candidateId, sourceTeamIdx)
        return true
      }
    }
  }
  return false
}
