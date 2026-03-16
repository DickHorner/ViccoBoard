import { computed, onMounted, ref } from 'vue'

import { Exams } from '@viccoboard/core'
import {
  AnalysisUIHelper,
  ExamAnalysisService,
  type DifficultyAnalysis,
  type ExamStatistics,
  type PointAdjustmentSuggestion
} from '@viccoboard/exams'

interface ExamAnalysisProps {
  exam: Exams.Exam
  corrections: Exams.CorrectionEntry[]
  candidates: Exams.Candidate[]
}

const tabs = ['statistics', 'difficulty', 'adjustment', 'risk', 'variance'] as const

export function useExamAnalysisView(props: ExamAnalysisProps) {
  const selectedTab = ref<(typeof tabs)[number]>('statistics')
  const analysis = ref<ExamStatistics | null>(null)
  const outliers = ref<{ veryDifficult: DifficultyAnalysis[]; veryEasy: DifficultyAnalysis[] } | null>(null)
  const adjustmentSuggestion = ref<PointAdjustmentSuggestion | null>(null)
  const studentsAtRisk = ref<Array<{ candidateId: string; score: number; percentage: number; riskLevel: 'critical' | 'warning' | 'ok' }>>([])
  const taskVariance = ref<Map<string, number>>(new Map())
  const targetDifficulty = ref(0.6)
  const riskThreshold = ref(50)
  const difficultySort = ref<'title' | 'difficultyIndex' | 'averageScore' | 'standardDeviation'>('title')
  const riskSort = ref<'name' | 'percentage' | 'riskLevel'>('percentage')

  function performAnalysis() {
    analysis.value = ExamAnalysisService.analyzeExamDifficulty(props.exam, props.corrections)
    outliers.value = ExamAnalysisService.identifyOutliers(analysis.value, 0.2)
    studentsAtRisk.value = ExamAnalysisService.identifyStudentsAtRisk(props.corrections, riskThreshold.value)
    taskVariance.value = ExamAnalysisService.calculateTaskVariance(props.corrections, props.exam)
  }

  function calculateAdjustments() {
    adjustmentSuggestion.value = ExamAnalysisService.suggestPointAdjustments(
      props.exam,
      props.corrections,
      targetDifficulty.value
    )
  }

  function refreshAnalysis() {
    performAnalysis()
  }

  function exportAnalysis() {
    const exportData = {
      exam: props.exam.title,
      timestamp: new Date().toISOString(),
      statistics: analysis.value,
      outliers: outliers.value,
      atRisk: studentsAtRisk.value
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `analyse-${props.exam.id}-${Date.now()}.json`
    anchor.click()
  }

  function applyAdjustments() {
    alert('Das Übernehmen der Anpassungen wird über einen Use Case umgesetzt.')
  }

  function resetAdjustments() {
    adjustmentSuggestion.value = null
  }

  function sortBy(field: typeof difficultySort.value) {
    difficultySort.value = field
  }

  function sortRiskBy(field: typeof riskSort.value) {
    riskSort.value = field
  }

  const sortedDifficulties = computed(() => {
    if (!analysis.value) return []
    const sorted = [...analysis.value.taskDifficulties]
    sorted.sort((a, b) => {
      switch (difficultySort.value) {
        case 'title':
          return a.taskTitle.localeCompare(b.taskTitle)
        case 'difficultyIndex':
          return a.difficultyIndex - b.difficultyIndex
        case 'averageScore':
          return a.averageScore - b.averageScore
        case 'standardDeviation':
          return b.standardDeviation - a.standardDeviation
        default:
          return 0
      }
    })
    return sorted
  })

  const sortedAtRisk = computed(() => {
    const sorted = [...studentsAtRisk.value]
    sorted.sort((a, b) => {
      switch (riskSort.value) {
        case 'name':
          return getCandidateName(a.candidateId).localeCompare(getCandidateName(b.candidateId))
        case 'percentage':
          return a.percentage - b.percentage
        case 'riskLevel':
          return a.riskLevel.localeCompare(b.riskLevel)
        default:
          return 0
      }
    })
    return sorted
  })

  const formatScore = (value?: number): string => value === undefined ? '—' : value.toFixed(2)
  const formatPercentage = (value?: number): string => value === undefined ? '—' : (value * 100).toFixed(1)
  const getDifficultyText = (index: number): string => AnalysisUIHelper.formatDifficultyText(index)
  const getDifficultyColor = (index: number): string => AnalysisUIHelper.getDifficultyColor(index)
  const getDifficultyClass = (index: number): string => {
    if (index < 0.3) return 'very-difficult'
    if (index < 0.5) return 'difficult'
    if (index < 0.7) return 'moderate'
    if (index < 0.85) return 'easy'
    return 'very-easy'
  }
  const getPercentage = (value: number, total: number): number => (value / total) * 100
  const getChangeIndicator = (current: number, suggested: number): string => {
    if (suggested > current) return `+${suggested - current} ↑`
    if (suggested < current) return `${suggested - current} ↓`
    return '— (no change)'
  }
  const getChangeClass = (current: number, suggested: number): string => {
    if (suggested > current) return 'increase'
    if (suggested < current) return 'decrease'
    return 'unchanged'
  }
  const formatRiskLevel = (level: string): string => AnalysisUIHelper.formatRiskLevel(level)
  const getCandidateName = (candidateId: string): string => {
    const candidate = props.candidates?.find(item => item.id === candidateId)
    return candidate ? `${candidate.firstName} ${candidate.lastName}`.trim() : 'Unbekannt'
  }
  const getTabLabel = (tab: string): string => {
    switch (tab) {
      case 'statistics':
        return 'Statistik'
      case 'difficulty':
        return 'Schwierigkeit'
      case 'adjustment':
        return 'Anpassungen'
      case 'risk':
        return 'Risiko'
      case 'variance':
        return 'Varianz'
      default:
        return tab
    }
  }
  const getTaskTitle = (taskId: string): string => props.exam.structure.tasks.find(task => task.id === taskId)?.title || 'Unbekannte Aufgabe'
  const getSortIcon = (field: string): string => difficultySort.value === field || riskSort.value === field ? '↓' : ''
  const getVarianceClass = (variance: number): string => variance < 2 ? 'consistent' : variance < 4 ? 'moderate-variance' : 'high-variance'
  const getVariancePercentage = (variance: number): number => Math.min((variance / 6) * 100, 100)

  onMounted(() => {
    performAnalysis()
  })

  return {
    adjustmentSuggestion,
    analysis,
    applyAdjustments,
    calculateAdjustments,
    difficultySort,
    exportAnalysis,
    formatPercentage,
    formatRiskLevel,
    formatScore,
    getCandidateName,
    getChangeClass,
    getChangeIndicator,
    getDifficultyClass,
    getDifficultyColor,
    getDifficultyText,
    getPercentage,
    getSortIcon,
    getTabLabel,
    getTaskTitle,
    getVarianceClass,
    getVariancePercentage,
    outliers,
    refreshAnalysis,
    resetAdjustments,
    riskSort,
    riskThreshold,
    selectedTab,
    sortBy,
    sortRiskBy,
    sortedAtRisk,
    sortedDifficulties,
    studentsAtRisk,
    tabs,
    targetDifficulty,
    taskVariance
  }
}
