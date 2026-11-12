import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { createUuid as uuidv4 } from '@/utils/uuid'

import type { Sport, StatusOption } from '@viccoboard/core'

import { useSportBridge } from './useSportBridge'
import { useStudents, getStudentsBridge } from './useStudentsBridge'
import { useToast } from './useToast'
import { compareCriterionScores } from '../utils/criteria-comparison'

type CriterionConfig = {
  id: string
  name: string
  description?: string
  weight: number
  minValue: number
  maxValue: number
}

type CriteriaCategory = Sport.GradeCategory & {
  configuration: Sport.CriteriaGradingConfig
}

export function useCriteriaGradingEntryView() {
  const route = useRoute()
  const { SportBridge, gradeCategories, performanceEntries } = useSportBridge()
  const { repository: studentRepository } = useStudents()
  const toast = useToast()

  const categoryId = route.params.id as string
  const category = ref<Sport.GradeCategory | null>(null)
  const students = ref<Array<{ id: string; firstName: string; lastName: string }>>([])
  const gradeEntries = ref<Map<string, Map<string, number>>>(new Map())
  const comments = ref<Map<string, string>>(new Map())
  const loading = ref(true)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const bulkMode = ref(false)
  const hasUnsavedChanges = ref(false)
  const unsavedStudents = ref<Set<string>>(new Set())

  const showAddCriterionModal = ref(false)
  const showCommentModal = ref(false)
  const currentCommentStudentId = ref<string | null>(null)
  const currentComment = ref('')

  const participationOptions = ref<StatusOption[]>([])
  const participationStatus = ref<Map<string, string>>(new Map())
  const selfAssessmentEntries = ref<Map<string, Map<string, number>>>(new Map())

  const handoffCandidateId = ref<string | null>(null)
  const handoffStudentId = ref<string | null>(null)
  const handoffPin = ref('')
  const pinDraft = ref('')

  const selfAssessmentEnabled = computed(() =>
    Boolean((category.value?.configuration as Sport.CriteriaGradingConfig | undefined)?.allowSelfAssessment)
  )

  const newCriterion = ref({
    name: '',
    description: '',
    minValue: 0,
    maxValue: 3,
    weight: 1
  })

  const criteria = computed<CriterionConfig[]>(() => {
    if (!category.value) return []
    const config = category.value.configuration as Sport.CriteriaGradingConfig
    return config.criteria || []
  })

  const handoffStudent = computed(() =>
    students.value.find(student => student.id === handoffStudentId.value) ?? null
  )

  const handoffTeacherScores = computed<Record<string, number>>(() =>
    Object.fromEntries(gradeEntries.value.get(handoffStudentId.value ?? '') ?? [])
  )

  const handoffInitialScores = computed<Record<string, number>>(() =>
    Object.fromEntries(selfAssessmentEntries.value.get(handoffStudentId.value ?? '') ?? [])
  )

  async function loadData() {
    loading.value = true
    error.value = null
    try {
      category.value = await gradeCategories.value?.findById(categoryId) ?? null
      if (!category.value) {
        error.value = 'Kategorie nicht gefunden'
        return
      }

      students.value = await studentRepository.value?.findByClassGroup(category.value.classGroupId) ?? []

      for (const student of students.value) {
        const entries = await performanceEntries.value?.findByStudentAndCategory(student.id, categoryId) ?? []
        if (entries.length === 0) continue

        const latestEntry = entries[0]
        const studentGrades = new Map<string, number>()
        if (latestEntry.measurements) {
          Object.entries(latestEntry.measurements).forEach(([criterionId, value]) => {
            studentGrades.set(criterionId, value as number)
          })
        }
        gradeEntries.value.set(student.id, studentGrades)

        const savedSelfAssessment = latestEntry.metadata?.selfAssessment
        if (savedSelfAssessment && typeof savedSelfAssessment === 'object') {
          selfAssessmentEntries.value.set(
            student.id,
            new Map(Object.entries(savedSelfAssessment as Record<string, number>))
          )
        }

        if (latestEntry.comment) comments.value.set(student.id, latestEntry.comment)
      }

      try {
        const studentsBridge = getStudentsBridge()
        const catalog = await studentsBridge.statusCatalogRepository.getOrCreateForClassGroup(
          category.value.classGroupId,
          'participation'
        )
        participationOptions.value = catalog.statuses
          .filter(status => status.active)
          .sort((a, b) => a.order - b.order)
      } catch (catalogError) {
        console.warn('[CriteriaGrading] Participation catalog could not be loaded:', catalogError)
      }
    } catch {
      error.value = 'Fehler beim Laden der Daten'
    } finally {
      loading.value = false
    }
  }

  function getGradeValue(studentId: string, criterionId: string): number | '' {
    const value = gradeEntries.value.get(studentId)?.get(criterionId)
    return value === undefined ? '' : value
  }

  function getSelfAssessmentValue(studentId: string, criterionId: string): number | '' {
    return selfAssessmentEntries.value.get(studentId)?.get(criterionId) ?? ''
  }

  function onSelfAssessmentChange(studentId: string, criterionId: string, rawValue: string): void {
    let scores = selfAssessmentEntries.value.get(studentId)
    if (!scores) {
      scores = new Map<string, number>()
      selfAssessmentEntries.value.set(studentId, scores)
    }
    const criterion = criteria.value.find(item => item.id === criterionId)
    const value = Number(rawValue)
    if (
      rawValue.trim() === '' || !criterion || !Number.isFinite(value) ||
      value < criterion.minValue || value > criterion.maxValue
    ) {
      scores.delete(criterionId)
    } else {
      scores.set(criterionId, value)
    }
    unsavedStudents.value.add(studentId)
    hasUnsavedChanges.value = true
  }

  async function setSelfAssessmentEnabled(enabled: boolean): Promise<void> {
    if (!category.value) return
    const currentCategory = category.value as CriteriaCategory
    const updatedCategory = {
      ...currentCategory,
      configuration: { ...currentCategory.configuration, allowSelfAssessment: enabled },
      lastModified: new Date()
    }
    await gradeCategories.value?.update(currentCategory.id, updatedCategory)
    category.value = updatedCategory
  }

  function setParticipation(studentId: string, code: string): void {
    if (participationStatus.value.get(studentId) === code) {
      participationStatus.value.delete(studentId)
      return
    }
    participationStatus.value.set(studentId, code)
  }

  function onGradeChange(studentId: string, criterionId: string, rawValue?: unknown): void {
    hasUnsavedChanges.value = true
    unsavedStudents.value.add(studentId)

    let value: number | undefined
    if (typeof rawValue === 'number') {
      value = rawValue
    } else if (typeof rawValue === 'string' && rawValue.trim() !== '') {
      const parsed = Number(rawValue)
      value = Number.isFinite(parsed) ? parsed : undefined
    } else if (rawValue && typeof rawValue === 'object' && 'target' in rawValue) {
      const eventTarget = (rawValue as { target: HTMLInputElement | null }).target
      if (eventTarget?.value) {
        const parsed = Number(eventTarget.value)
        value = Number.isNaN(parsed) ? undefined : parsed
      }
    }

    let studentGrades = gradeEntries.value.get(studentId)
    if (!studentGrades) {
      studentGrades = new Map<string, number>()
      gradeEntries.value.set(studentId, studentGrades)
    }

    if (value === undefined) {
      studentGrades.delete(criterionId)
      return
    }
    studentGrades.set(criterionId, value)
  }

  function hasUnsavedChangesForStudent(studentId: string): boolean {
    return unsavedStudents.value.has(studentId)
  }

  function gradingResult(studentId: string) {
    const studentGrades = gradeEntries.value.get(studentId)
    if (!studentGrades || criteria.value.length === 0) return null

    if (criteria.value.some((criterion) => !studentGrades.has(criterion.id))) return null

    const scores = criteria.value.map((criterion) => ({
      criterionId: criterion.id,
      value: studentGrades.get(criterion.id)!
    }))

    try {
      const gradingScale = (category.value as Sport.GradeCategory & {
        gradingScale?: Array<{ minPercentage: number; grade: string }>
      } | null)?.gradingScale

      return SportBridge.value?.criteriaGradingEngine.calculateGradeFromValues(
        { criteria: criteria.value, scores },
        gradingScale
      ) ?? null
    } catch {
      return null
    }
  }

  function calculateTotal(studentId: string): number {
    return gradingResult(studentId)?.totalPoints ?? 0
  }

  function calculateGrade(studentId: string): string {
    return gradingResult(studentId)?.grade ?? '—'
  }

  async function saveStudentGrade(studentId: string) {
    if (!unsavedStudents.value.has(studentId)) return
    const studentGrades = gradeEntries.value.get(studentId)
    if (!studentGrades) return

    saving.value = true
    try {
      const measurements: Record<string, number> = {}
      studentGrades.forEach((value, criterionId) => {
        measurements[criterionId] = value
      })

      await SportBridge.value?.recordGradeUseCase.execute({
        studentId,
        categoryId,
        measurements,
        calculatedGrade: gradingResult(studentId)?.grade,
        comment: comments.value.get(studentId),
        metadata: {
          selfAssessment: Object.fromEntries(selfAssessmentEntries.value.get(studentId) ?? [])
        }
      })

      unsavedStudents.value.delete(studentId)
      if (unsavedStudents.value.size === 0) hasUnsavedChanges.value = false
    } catch {
      toast.error('Fehler beim Speichern der Note')
    } finally {
      saving.value = false
    }
  }

  async function saveAllGrades() {
    saving.value = true
    try {
      for (const studentId of unsavedStudents.value) {
        await saveStudentGrade(studentId)
      }
      toast.success('Alle Noten gespeichert!')
    } catch {
      toast.error('Fehler beim Speichern einiger Noten')
    } finally {
      saving.value = false
    }
  }

  async function addCriterion() {
    if (!newCriterion.value.name || !category.value) return
    if (newCriterion.value.minValue >= newCriterion.value.maxValue) {
      toast.error('Der Minimalwert muss kleiner als der Maximalwert sein.')
      return
    }

    saving.value = true
    try {
      const currentCategory = category.value as CriteriaCategory
      const config = currentCategory.configuration
      const updatedCategory = {
        ...currentCategory,
        configuration: {
          ...config,
          criteria: [
            ...config.criteria,
            {
              id: uuidv4(),
              name: newCriterion.value.name,
              description: newCriterion.value.description || undefined,
              weight: newCriterion.value.weight,
              minValue: newCriterion.value.minValue,
              maxValue: newCriterion.value.maxValue
            }
          ]
        },
        lastModified: new Date()
      }

      await gradeCategories.value?.update(currentCategory.id, updatedCategory)
      category.value = updatedCategory
      newCriterion.value = {
        name: '',
        description: '',
        minValue: 0,
        maxValue: 3,
        weight: 1
      }
      showAddCriterionModal.value = false
    } catch {
      toast.error('Fehler beim Hinzufügen des Kriteriums')
    } finally {
      saving.value = false
    }
  }

  async function removeCriterion(index: number) {
    if (!category.value) return
    if (!confirm('Möchten Sie dieses Kriterium wirklich entfernen?')) return

    saving.value = true
    try {
      const currentCategory = category.value as CriteriaCategory
      const config = currentCategory.configuration
      const updatedCategory = {
        ...currentCategory,
        configuration: {
          ...config,
          criteria: config.criteria.filter((_, currentIndex) => currentIndex !== index)
        },
        lastModified: new Date()
      }

      await gradeCategories.value?.update(currentCategory.id, updatedCategory)
      category.value = updatedCategory
    } catch {
      toast.error('Fehler beim Entfernen des Kriteriums')
    } finally {
      saving.value = false
    }
  }

  function prepareHandoff(studentId: string): void {
    if (!selfAssessmentEnabled.value) {
      toast.warning('Bitte zuerst die Selbsteinschätzung für diese Kategorie aktivieren.')
      return
    }
    if (unsavedStudents.value.has(studentId)) {
      toast.warning('Bitte die Lehrereinschätzung vor der Übergabe speichern.')
      return
    }

    const teacherScores = Object.fromEntries(gradeEntries.value.get(studentId) ?? [])
    try {
      compareCriterionScores(criteria.value, teacherScores, teacherScores)
    } catch {
      toast.warning('Bitte zuerst alle Beobachtungskriterien als Lehrkraft bewerten.')
      return
    }

    handoffCandidateId.value = studentId
    pinDraft.value = ''
  }

  function startHandoff(): void {
    if (!handoffCandidateId.value) return
    if (!/^\d{4,6}$/.test(pinDraft.value)) {
      toast.warning('Bitte eine PIN mit 4 bis 6 Ziffern festlegen.')
      return
    }
    handoffPin.value = pinDraft.value
    pinDraft.value = ''
    handoffStudentId.value = handoffCandidateId.value
    handoffCandidateId.value = null
  }

  function closeHandoff(): void {
    handoffStudentId.value = null
    handoffPin.value = ''
  }

  async function saveHandoffAssessment(scores: Record<string, number>): Promise<void> {
    const studentId = handoffStudentId.value
    const repository = performanceEntries.value
    if (!studentId || !repository) throw new Error('Schülerbewertung ist nicht verfügbar.')

    const teacherScores = Object.fromEntries(gradeEntries.value.get(studentId) ?? [])
    compareCriterionScores(criteria.value, scores, teacherScores)

    const latestEntry = await repository.getLatestEntry(studentId, categoryId)
    if (!latestEntry) throw new Error('Die Lehrereinschätzung muss zuerst gespeichert werden.')

    await repository.update(latestEntry.id, {
      metadata: {
        ...latestEntry.metadata,
        selfAssessment: { ...scores }
      }
    })
    selfAssessmentEntries.value.set(studentId, new Map(Object.entries(scores)))
  }

  function toggleBulkMode() {
    bulkMode.value = !bulkMode.value
    toast.info('Der Bulk-Modus ist derzeit nicht verfügbar.')
  }

  function addComment(studentId: string) {
    currentCommentStudentId.value = studentId
    currentComment.value = comments.value.get(studentId) || ''
    showCommentModal.value = true
  }

  async function saveComment() {
    if (!currentCommentStudentId.value) return
    comments.value.set(currentCommentStudentId.value, currentComment.value)
    unsavedStudents.value.add(currentCommentStudentId.value)
    hasUnsavedChanges.value = true
    await saveStudentGrade(currentCommentStudentId.value)
    showCommentModal.value = false
    currentCommentStudentId.value = null
    currentComment.value = ''
  }

  onMounted(async () => {
    await loadData()
  })

  return {
    addComment,
    addCriterion,
    bulkMode,
    calculateGrade,
    calculateTotal,
    category,
    comments,
    criteria,
    currentComment,
    error,
    getGradeValue,
    getSelfAssessmentValue,
    handoffCandidateId,
    handoffInitialScores,
    handoffPin,
    handoffStudent,
    handoffTeacherScores,
    hasUnsavedChanges,
    hasUnsavedChangesForStudent,
    loading,
    newCriterion,
    onGradeChange,
    onSelfAssessmentChange,
    pinDraft,
    participationOptions,
    prepareHandoff,
    participationStatus,
    removeCriterion,
    saveAllGrades,
    saveComment,
    saveHandoffAssessment,
    saveStudentGrade,
    saving,
    setParticipation,
    setSelfAssessmentEnabled,
    selfAssessmentEnabled,
    showAddCriterionModal,
    startHandoff,
    closeHandoff,
    showCommentModal,
    students,
    toggleBulkMode
  }
}
