import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { AttendanceStatus, type ClassGroup, type Student, type Sport } from '@viccoboard/core'
import { TeamConstraintError, type TeamAlgorithm, type TeamBasis, type TeamSessionMetadata } from '@viccoboard/sport'

import { getSportBridge, initializeSportBridge } from './useSportBridge'
import { getStudentsBridge, initializeStudentsBridge } from './useStudentsBridge'
import { formatGermanDate } from '../utils/locale-format'

interface DisplayTeam {
  id: string
  name: string
  students: Student[]
  roles?: Record<string, string>
}

export function useTeamBuilderView() {
  const { t } = useI18n()

  initializeSportBridge()
  initializeStudentsBridge()

  const sportBridge = getSportBridge()
  const studentsBridge = getStudentsBridge()

  const classes = ref<ClassGroup[]>([])
  const selectedClassId = ref('')
  const students = ref<Student[]>([])
  const teamCount = ref(2)
  const teamLabel = ref('Team')
  const useLatestAttendance = ref(false)
  const algorithm = ref<TeamAlgorithm>('random')
  const basis = ref<TeamBasis>('performance')
  const sessionName = ref('')
  const rolesInput = ref('')
  const warning = ref('')
  const constraintErrors = ref<string[]>([])
  const saveSuccess = ref(false)
  const savedSessions = ref<Sport.ToolSession[]>([])
  const neverTogetherRules = ref<string[][]>([])
  const alwaysTogetherRules = ref<string[][]>([])
  const teams = ref<DisplayTeam[]>([])

  const maxTeamCount = computed(() => Math.max(2, Math.min(students.value.length, 12)))
  const teamCountPresets = computed(() => {
    const count = students.value.length
    const presets: number[] = []
    for (const preset of [2, 3, 4, 5, 6]) {
      if (preset <= count) presets.push(preset)
    }
    return presets.length > 0 ? presets : [2]
  })
  const showBasisSelector = computed(() =>
    algorithm.value === 'homogeneous' || algorithm.value === 'heterogeneous'
  )
  const parsedRoles = computed(() =>
    rolesInput.value.split(',').map(role => role.trim()).filter(role => role.length > 0)
  )
  const canGenerate = computed(() =>
    Boolean(selectedClassId.value && students.value.length > 0 && teamCount.value >= 2)
  )
  const canSave = computed(() =>
    Boolean(teams.value.length > 0 && sessionName.value.trim().length > 0 && selectedClassId.value)
  )

  async function loadClasses() {
    classes.value = await sportBridge.classGroupRepository.findAll()
  }

  async function loadStudents() {
    warning.value = ''
    constraintErrors.value = []
    teams.value = []
    savedSessions.value = []

    if (!selectedClassId.value) {
      students.value = []
      return
    }

    const allStudents = await studentsBridge.studentRepository.findByClassGroup(selectedClassId.value)
    if (!useLatestAttendance.value) {
      students.value = allStudents
    } else {
      const lesson = await sportBridge.lessonRepository.getMostRecent(selectedClassId.value)
      if (!lesson) {
        warning.value = t('COMMON.error')
        students.value = allStudents
      } else {
        const attendance = await sportBridge.attendanceRepository.findByLesson(lesson.id)
        if (attendance.length === 0) {
          warning.value = t('COMMON.error')
          students.value = allStudents
        } else {
          const presentIds = attendance
            .filter(record => [AttendanceStatus.Present, AttendanceStatus.Passive].includes(record.status))
            .map(record => record.studentId)
          const filtered = allStudents.filter(student => presentIds.includes(student.id))
          if (filtered.length === 0) {
            warning.value = t('COMMON.error')
            students.value = allStudents
          } else {
            students.value = filtered
          }
        }
      }
    }

    await loadSavedSessions()
  }

  async function loadSavedSessions() {
    if (!selectedClassId.value) return
    const allSessions = await sportBridge.toolSessionRepository.findByClassGroup(selectedClassId.value)
    savedSessions.value = allSessions
      .filter(session => session.toolType === 'teams')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  function addConstraint(type: 'never' | 'always') {
    const rule = ['', '']
    if (type === 'never') neverTogetherRules.value.push(rule)
    else alwaysTogetherRules.value.push(rule)
  }

  function removeConstraint(type: 'never' | 'always', idx: number) {
    if (type === 'never') neverTogetherRules.value.splice(idx, 1)
    else alwaysTogetherRules.value.splice(idx, 1)
  }

  function generateTeams() {
    if (!canGenerate.value) return
    warning.value = ''
    constraintErrors.value = []

    const validNever = neverTogetherRules.value.map(rule => rule.filter(id => id.length > 0)).filter(rule => rule.length >= 2)
    const validAlways = alwaysTogetherRules.value.map(rule => rule.filter(id => id.length > 0)).filter(rule => rule.length >= 2)

    try {
      const builtTeams = sportBridge.teamBuilderService.buildTeams({
        students: students.value.map(student => ({ id: student.id, gender: student.gender })),
        teamCount: teamCount.value,
        teamLabel: teamLabel.value,
        algorithm: algorithm.value,
        basis: basis.value,
        roles: parsedRoles.value,
        constraints: { neverTogether: validNever, alwaysTogether: validAlways }
      })
      const studentMap = new Map(students.value.map(student => [student.id, student]))
      teams.value = builtTeams.map((team) => ({
        id: team.id,
        name: team.name,
        students: team.studentIds.map(id => studentMap.get(id)).filter((student): student is Student => student !== undefined),
        roles: team.roles
      }))
    } catch (error) {
      if (error instanceof TeamConstraintError) {
        constraintErrors.value = error.conflicts.map(conflict => conflict.message)
      } else {
        warning.value = t('COMMON.error')
      }
      return
    }

    saveSuccess.value = false
  }

  async function saveTeams() {
    if (!canSave.value) return
    const validNever = neverTogetherRules.value.map(rule => rule.filter(id => id.length > 0)).filter(rule => rule.length >= 2)
    const validAlways = alwaysTogetherRules.value.map(rule => rule.filter(id => id.length > 0)).filter(rule => rule.length >= 2)

    try {
      await sportBridge.saveTeamAssignmentUseCase.execute({
        classGroupId: selectedClassId.value,
        sessionName: sessionName.value,
        algorithm: algorithm.value,
        basis: basis.value,
        teamLabel: teamLabel.value,
        roles: parsedRoles.value.length > 0 ? parsedRoles.value : undefined,
        constraints: validNever.length > 0 || validAlways.length > 0
          ? { neverTogether: validNever, alwaysTogether: validAlways }
          : undefined,
        teams: teams.value.map((team) => ({
          id: team.id,
          name: team.name,
          studentIds: team.students.map(student => student.id),
          roles: team.roles
        }))
      })
      saveSuccess.value = true
      await loadSavedSessions()
    } catch {
      saveSuccess.value = false
      warning.value = t('COMMON.error')
    }
  }

  async function loadSession(session: Sport.ToolSession) {
    const meta = session.sessionMetadata as TeamSessionMetadata
    if (!meta?.teams) return

    algorithm.value = meta.algorithm ?? 'random'
    basis.value = meta.basis ?? 'performance'
    if (meta.teamLabel) teamLabel.value = meta.teamLabel
    teamCount.value = meta.teams.length
    rolesInput.value = meta.roles?.join(', ') ?? ''
    neverTogetherRules.value = meta.constraints?.neverTogether ? meta.constraints.neverTogether.map(group => [...group]) : []
    alwaysTogetherRules.value = meta.constraints?.alwaysTogether ? meta.constraints.alwaysTogether.map(group => [...group]) : []

    const fullRoster = await studentsBridge.studentRepository.findByClassGroup(selectedClassId.value)
    const studentMap = new Map(fullRoster.map(student => [student.id, student]))
    const missingIds: string[] = []
    teams.value = meta.teams.map((team) => ({
      id: team.id,
      name: team.name,
      students: team.studentIds.map(id => {
        const student = studentMap.get(id)
        if (!student) missingIds.push(id)
        return student
      }).filter((student): student is Student => student !== undefined),
      roles: team.roles
    }))

    if (missingIds.length > 0) warning.value = t('COMMON.error')
    saveSuccess.value = false
    sessionName.value = session.sessionMetadata.sessionName ?? ''
    constraintErrors.value = []
  }

  function clearTeams() {
    teams.value = []
    saveSuccess.value = false
    constraintErrors.value = []
  }

  function formatDate(date: Date): string {
    return formatGermanDate(date)
  }

  loadClasses()

  return {
    addConstraint,
    algorithm,
    alwaysTogetherRules,
    basis,
    canGenerate,
    canSave,
    classes,
    clearTeams,
    constraintErrors,
    formatDate,
    generateTeams,
    loadSession,
    loadStudents,
    maxTeamCount,
    neverTogetherRules,
    parsedRoles,
    removeConstraint,
    rolesInput,
    saveSuccess,
    saveTeams,
    savedSessions,
    selectedClassId,
    sessionName,
    showBasisSelector,
    students,
    t,
    teamCount,
    teamCountPresets,
    teamLabel,
    teams,
    useLatestAttendance,
    warning
  }
}
