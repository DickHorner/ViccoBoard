import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import type { ClassGroup, Sport, Student } from '@viccoboard/core'

import { getSportBridge, useSportBridge } from './useSportBridge'
import { useStudents } from './useStudentsBridge'
import { useToast } from './useToast'

type NewCategoryForm = {
  name: string
  description: string
  type: Sport.GradeCategoryType | ''
  weight: number
}

function getDefaultConfiguration(type: NewCategoryForm['type']): Sport.GradeCategoryConfig {
  switch (type) {
    case 'criteria':
      return { type: 'criteria', criteria: [], allowSelfAssessment: false, selfAssessmentViaWOW: false }
    case 'time':
      return { type: 'time', bestGrade: 1, worstGrade: 6, linearMapping: true, adjustableAfterwards: true }
    case 'cooper':
      return { type: 'cooper', SportType: 'running', distanceUnit: 'meters', autoEvaluation: true }
    case 'shuttle':
      return { type: 'shuttle', autoEvaluation: true }
    case 'mittelstrecke':
      return { type: 'mittelstrecke', autoEvaluation: true }
    case 'Sportabzeichen':
      return {
        type: 'Sportabzeichen',
        requiresBirthYear: true,
        ageDependent: true,
        disciplines: [],
        pdfExportEnabled: true
      }
    case 'bjs':
      return { type: 'bjs', disciplines: [], autoGrading: true }
    case 'verbal':
      return { type: 'verbal', fields: [], scales: [], exportFormat: 'text' }
    default:
      throw new Error('Unsupported category type')
  }
}

export function useGradingOverviewView() {
  const router = useRouter()
  const { SportBridge } = useSportBridge()
  const { repository: studentRepository } = useStudents()
  const toast = useToast()

  const classes = ref<ClassGroup[]>([])
  const selectedClassId = ref('')
  const categories = ref<Sport.GradeCategory[]>([])
  const students = ref<Student[]>([])
  const performanceEntries = ref<Sport.PerformanceEntry[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const showCreateCategoryModal = ref(false)

  const showEditCategoryModal = ref(false)
  const editingCategory = ref<Sport.GradeCategory | null>(null)
  const editCategoryForm = ref({ name: '', description: '', weight: 0 })

  const deleteCategoryTarget = ref<Sport.GradeCategory | null>(null)
  const deletingCategoryId = ref<string | null>(null)

  const newCategory = ref<NewCategoryForm>({ name: '', description: '', type: '', weight: 0 })

  onMounted(async () => {
    await loadClasses()
  })

  async function loadClasses() {
    try {
      classes.value = await SportBridge.value?.classGroupRepository.findAll() ?? []
    } catch (error) {
      console.error('Failed to load classes:', error)
    }
  }

  async function onClassChange() {
    if (!selectedClassId.value) {
      categories.value = []
      students.value = []
      performanceEntries.value = []
      return
    }

    loading.value = true
    try {
      categories.value = await SportBridge.value?.gradeCategoryRepository.findByClassGroup(selectedClassId.value) ?? []
      students.value = await studentRepository.value?.findByClassGroup(selectedClassId.value) ?? []
      const entryPromises = students.value.map((student) =>
        SportBridge.value?.performanceEntryRepository.findByStudent(student.id) ?? Promise.resolve([])
      )
      performanceEntries.value = (await Promise.all(entryPromises)).flat()
    } catch (error) {
      console.error('Failed to load grading data:', error)
    } finally {
      loading.value = false
    }
  }

  function getCategoryTypeLabel(type: Sport.GradeCategoryType): string {
    const labels: Record<Sport.GradeCategoryType, string> = {
      criteria: 'Kriterienbasiert',
      time: 'Zeitbasiert',
      cooper: 'Cooper-Test',
      shuttle: 'Shuttle-Run',
      mittelstrecke: 'Mittelstrecke',
      Sportabzeichen: 'Sportabzeichen',
      bjs: 'Bundesjugendspiele',
      verbal: 'Verbal'
    }
    return labels[type] || type
  }

  function getStudentGrade(studentId: string, categoryId: string): string | number | null {
    const entry = performanceEntries.value.find(
      (candidate) => candidate.studentId === studentId && candidate.categoryId === categoryId
    )
    return entry?.calculatedGrade || null
  }

  function formatGrade(grade: string | number | null): string {
    if (grade === null || grade === undefined) return '—'
    return String(grade)
  }

  function openGradingEntry(category: Sport.GradeCategory) {
    const routeMap: Partial<Record<Sport.GradeCategoryType, string>> = {
      criteria: 'criteria',
      time: 'time',
      cooper: 'cooper',
      shuttle: 'shuttle',
      mittelstrecke: 'mittelstrecke',
      Sportabzeichen: 'Sportabzeichen',
      bjs: 'bjs',
      verbal: 'verbal'
    }
    const routeSegment = routeMap[category.type]
    if (!routeSegment) {
      toast.info('Dieser Bewertungstyp wird noch nicht unterstützt.')
      return
    }
    router.push(`/grading/${routeSegment}/${category.id}`)
  }

  function viewHistory(category: Sport.GradeCategory) {
    router.push(`/grading/history/${category.id}`)
  }

  function openEditCategoryModal(category: Sport.GradeCategory): void {
    editingCategory.value = category
    editCategoryForm.value = {
      name: category.name,
      description: category.description ?? '',
      weight: category.weight
    }
    showEditCategoryModal.value = true
  }

  function closeEditModal(): void {
    showEditCategoryModal.value = false
    editingCategory.value = null
  }

  async function saveEditCategory(): Promise<void> {
    if (!editingCategory.value) return
    saving.value = true
    try {
      const bridge = getSportBridge()
      await bridge.updateGradeCategoryUseCase.execute({
        id: editingCategory.value.id,
        name: editCategoryForm.value.name,
        description: editCategoryForm.value.description || undefined,
        weight: editCategoryForm.value.weight
      })
      toast.success('Kategorie aktualisiert.')
      closeEditModal()
      await onClassChange()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Fehler beim Speichern.'
      toast.error(message)
    } finally {
      saving.value = false
    }
  }

  function confirmDeleteCategory(category: Sport.GradeCategory): void {
    deleteCategoryTarget.value = category
  }

  async function executeDeleteCategory(): Promise<void> {
    if (!deleteCategoryTarget.value) return
    deletingCategoryId.value = deleteCategoryTarget.value.id
    try {
      const bridge = getSportBridge()
      await bridge.deleteGradeCategoryUseCase.execute(deleteCategoryTarget.value.id)
      toast.success('Kategorie gelöscht.')
      deleteCategoryTarget.value = null
      await onClassChange()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Fehler beim Löschen.'
      toast.error(message)
    } finally {
      deletingCategoryId.value = null
    }
  }

  async function createCategory() {
    if (!selectedClassId.value || !newCategory.value.name || !newCategory.value.type) return
    saving.value = true
    try {
      await SportBridge.value?.createGradeCategoryUseCase.execute({
        classGroupId: selectedClassId.value,
        name: newCategory.value.name,
        description: newCategory.value.description || undefined,
        type: newCategory.value.type,
        weight: newCategory.value.weight,
        configuration: getDefaultConfiguration(newCategory.value.type)
      })
      newCategory.value = { name: '', description: '', type: '', weight: 0 }
      showCreateCategoryModal.value = false
      await onClassChange()
    } catch (error) {
      console.error('Failed to create category:', error)
      if (error instanceof Error && error.message === 'Unsupported category type') {
        toast.error('Die ausgewählte Bewertungskategorie wird nicht unterstützt.')
      } else if (error instanceof Error && error.message.trim().length > 0) {
        toast.error(`Die Kategorie konnte nicht erstellt werden: ${error.message}`)
      } else {
        toast.error('Die Kategorie konnte nicht erstellt werden.')
      }
    } finally {
      saving.value = false
    }
  }

  return {
    categories,
    classes,
    closeEditModal,
    confirmDeleteCategory,
    createCategory,
    deleteCategoryTarget,
    deletingCategoryId,
    editCategoryForm,
    executeDeleteCategory,
    formatGrade,
    getCategoryTypeLabel,
    getStudentGrade,
    loading,
    newCategory,
    onClassChange,
    openEditCategoryModal,
    openGradingEntry,
    saving,
    saveEditCategory,
    selectedClassId,
    showCreateCategoryModal,
    showEditCategoryModal,
    students,
    viewHistory
  }
}
