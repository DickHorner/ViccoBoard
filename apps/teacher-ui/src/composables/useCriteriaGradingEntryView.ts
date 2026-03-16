import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { v4 as uuidv4 } from 'uuid'

import type { Sport, StatusOption } from '@viccoboard/core'

import { useSportBridge } from './useSportBridge'
import { useStudents, getStudentsBridge } from './useStudentsBridge'
import { useToast } from './useToast'

const DEFAULT_GRADING_THRESHOLDS: Array<{ minPercentage: number; grade: string }> = [
  { minPercentage: 92, grade: '1' },
  { minPercentage: 81, grade: '2' },
  { minPercentage: 67, grade: '3' },
  { minPercentage: 50, grade: '4' },
  { minPercentage: 30, grade: '5' },
  { minPercentage: 0, grade: '6' }
]

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

  const newCriterion = ref({
    name: '',
    description: '',
    minValue: 0,
    maxValue: 10,
    weight: 100
  })

  const criteria = computed<CriterionConfig[]>(() => {
    if (!category.value) return []
    const config = category.value.configuration as Sport.CriteriaGradingConfig
    return config.criteria || []
  })

  const remainingWeight = computed(() => {
    const totalWeight = criteria.value.reduce((sum, criterion) => sum + criterion.weight, 0)
    return Math.max(0, 100 - totalWeight)
  })

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

        const latestEntry = entries[entries.length - 1]
        const studentGrades = new Map<string, number>()
        if (latestEntry.measurements) {
          Object.entries(latestEntry.measurements).forEach(([criterionId, value]) => {
            studentGrades.set(criterionId, value as number)
          })
        }
        gradeEntries.value.set(student.id, studentGrades)

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
    } else if (typeof rawValue === 'string') {
      const parsed = Number(rawValue)
      value = Number.isNaN(parsed) ? undefined : parsed
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

  function calculateTotal(studentId: string): number {
    const studentGrades = gradeEntries.value.get(studentId)
    if (!studentGrades) return 0

    let total = 0
    for (const criterion of criteria.value) {
      total += (studentGrades.get(criterion.id) || 0) * (criterion.weight / 100)
    }
    return total
  }

  function calculateGrade(studentId: string): string {
    const total = calculateTotal(studentId)
    const maxPossible = criteria.value.reduce(
      (sum, criterion) => sum + (criterion.maxValue * (criterion.weight / 100)),
      0
    )
    if (maxPossible === 0) return '—'

    const percentage = (total / maxPossible) * 100
    const categoryGradingScale = (category.value as Sport.GradeCategory & {
      gradingScale?: Array<{ minPercentage: number; grade: string }>
    } | null)?.gradingScale
    const gradingScale = categoryGradingScale && categoryGradingScale.length > 0
      ? categoryGradingScale
      : DEFAULT_GRADING_THRESHOLDS

    for (const threshold of gradingScale) {
      if (percentage >= threshold.minPercentage) return threshold.grade
    }
    return gradingScale[gradingScale.length - 1]?.grade ?? '—'
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
        calculatedGrade: calculateGrade(studentId),
        comment: comments.value.get(studentId)
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
    if (newCriterion.value.weight > remainingWeight.value) {
      toast.warning(`Die Gewichtung darf ${remainingWeight.value}% nicht überschreiten.`)
      return
    }
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
        maxValue: 10,
        weight: 100
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
    hasUnsavedChanges,
    hasUnsavedChangesForStudent,
    loading,
    newCriterion,
    onGradeChange,
    participationOptions,
    participationStatus,
    remainingWeight,
    removeCriterion,
    saveAllGrades,
    saveComment,
    saveStudentGrade,
    saving,
    setParticipation,
    showAddCriterionModal,
    showCommentModal,
    students,
    toggleBulkMode
  }
}
