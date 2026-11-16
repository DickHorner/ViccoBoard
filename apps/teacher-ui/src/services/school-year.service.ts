import type { ClassGroup } from '@viccoboard/core'
import type { StorageAdapter } from '@viccoboard/storage/browser'
import type { ClassGroupRepository } from '@viccoboard/sport'
import type {
  CopyClassGroupToSchoolYearUseCase,
  StudentRepository
} from '@viccoboard/students'
import type { ExamRepository } from '@viccoboard/exams'
import { examSchoolYear, isExamTemplate } from '../utils/exam-school-year'

const ACTIVE_YEAR_ID = 'active'

export interface SchoolYearDecision {
  classGroupId: string
  action: 'archive' | 'promote'
  targetName?: string
  targetGradeLevel?: number
}

export interface SchoolYearSwitchInput {
  fromYear: string
  targetYear: string
  decisions: SchoolYearDecision[]
}

export interface SchoolYearSwitchPreview {
  fromYear: string
  targetYear: string
  archivedClasses: number
  promotedClasses: number
  continuedStudents: number
  historicalExams: number
}

function validYear(year: string): boolean {
  const match = /^(\d{4})\/(\d{4})$/.exec(year)
  return Boolean(match && Number(match[2]) === Number(match[1]) + 1)
}

export function nextSchoolYear(year: string): string {
  if (!validYear(year)) throw new Error('Ungültiges Schuljahr (YYYY/YYYY).')
  const next = Number(year.slice(0, 4)) + 1
  return `${next}/${next + 1}`
}

export function suggestedClassName(group: ClassGroup): string {
  if (!group.gradeLevel) return group.name
  const match = /^(\d{1,2})(.*)$/.exec(group.name)
  if (!match || Number(match[1]) !== group.gradeLevel) return group.name
  return `${group.gradeLevel + 1}${match[2]}`
}

export async function loadActiveSchoolYear(
  adapter: StorageAdapter,
  classGroups: ClassGroupRepository
): Promise<string> {
  const saved = await adapter.getById<{ school_year?: string }>('school_year_state', ACTIVE_YEAR_ID)
  if (saved?.school_year && validYear(saved.school_year)) return saved.school_year

  const classes = await classGroups.findAll()
  const activeYears = classes
    .filter(group => !group.archived && validYear(group.schoolYear))
    .map(group => group.schoolYear)
    .sort()
  if (activeYears.length) return activeYears[activeYears.length - 1]

  const today = new Date()
  const startYear = today.getMonth() >= 7 ? today.getFullYear() : today.getFullYear() - 1
  return `${startYear}/${startYear + 1}`
}

export class SchoolYearTransitionService {
  constructor(
    private classGroups: ClassGroupRepository,
    private students: StudentRepository,
    private exams: ExamRepository,
    private adapter: StorageAdapter,
    private copyClass: CopyClassGroupToSchoolYearUseCase
  ) {}

  async currentYear(): Promise<string> {
    return loadActiveSchoolYear(this.adapter, this.classGroups)
  }

  async preview(input: SchoolYearSwitchInput): Promise<SchoolYearSwitchPreview> {
    if (!validYear(input.fromYear) || input.targetYear !== nextSchoolYear(input.fromYear)) {
      throw new Error('Der Wechsel ist nur in das unmittelbar nächste Schuljahr möglich.')
    }
    if (await this.currentYear() !== input.fromYear) {
      throw new Error('Das aktive Schuljahr hat sich geändert. Bitte die Vorschau aktualisieren.')
    }

    const allClasses = await this.classGroups.findAll()
    const source = allClasses.filter(group =>
      !group.archived && group.schoolYear === input.fromYear
    )
    if (!source.length) {
      throw new Error('Keine aktiven Klassen für das Ausgangsschuljahr vorhanden.')
    }

    const decisions = new Map(input.decisions.map(decision => [decision.classGroupId, decision]))
    if (decisions.size !== source.length || input.decisions.length !== source.length) {
      throw new Error('Für jede aktive Klasse muss eine Entscheidung getroffen werden.')
    }

    const existingNames = new Set(allClasses.filter(group =>
      group.schoolYear === input.targetYear
    ).map(group => group.name.trim().toLocaleLowerCase('de-DE')))

    let archivedClasses = 0
    let promotedClasses = 0
    let continuedStudents = 0

    for (const group of source) {
      const decision = decisions.get(group.id)
      if (!decision) throw new Error(`Entscheidung für ${group.name} fehlt.`)

      if (decision.action === 'archive') {
        archivedClasses++
        continue
      }
      if (decision.action !== 'promote') throw new Error('Unbekannte Klassenentscheidung.')

      const name = decision.targetName?.trim()
      const gradeLevel = decision.targetGradeLevel
      if (!name) throw new Error(`Bitte einen Zielnamen für ${group.name} angeben.`)
      if (!Number.isInteger(gradeLevel) || gradeLevel! < 1 || gradeLevel! > 13) {
        throw new Error(`Bitte eine gültige Ziel-Klassenstufe für ${group.name} angeben.`)
      }
      if (group.gradeLevel && gradeLevel !== group.gradeLevel + 1) {
        throw new Error(`${group.name}: Die Ziel-Klassenstufe muss um eins steigen.`)
      }
      const normalizedName = name.toLocaleLowerCase('de-DE')
      if (existingNames.has(normalizedName)) {
        throw new Error(`Klasse ${name} existiert im Zieljahr bereits oder wurde doppelt gewählt.`)
      }
      existingNames.add(normalizedName)
      promotedClasses++
      continuedStudents += await this.students.countByClassGroup(group.id)
    }

    const classYears = new Map(allClasses.map(group => [group.id, group.schoolYear]))
    const historicalExams = (await this.exams.findAll()).filter(exam =>
      !isExamTemplate(exam) && examSchoolYear(exam, classYears) === input.fromYear
    ).length

    return {
      fromYear: input.fromYear,
      targetYear: input.targetYear,
      archivedClasses,
      promotedClasses,
      continuedStudents,
      historicalExams
    }
  }

  async execute(input: SchoolYearSwitchInput): Promise<SchoolYearSwitchPreview> {
    await this.preview(input)

    return this.adapter.transaction(async () => {
      const preview = await this.preview(input)
      for (const decision of input.decisions) {
        if (decision.action === 'promote') {
          await this.copyClass.execute({
            sourceClassGroupId: decision.classGroupId,
            targetSchoolYear: input.targetYear,
            targetClassName: decision.targetName,
            targetGradeLevel: decision.targetGradeLevel
          })
        }
        if (decision.action === 'archive') {
          await this.classGroups.update(decision.classGroupId, { archived: true })
        }
      }

      const existing = await this.adapter.getById('school_year_state', ACTIVE_YEAR_ID)
      if (existing) {
        await this.adapter.update('school_year_state', ACTIVE_YEAR_ID, { school_year: input.targetYear })
      } else {
        await this.adapter.insert('school_year_state', {
          id: ACTIVE_YEAR_ID,
          school_year: input.targetYear
        })
      }

      return preview
    })
  }
}
