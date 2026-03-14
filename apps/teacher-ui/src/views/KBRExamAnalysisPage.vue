<template>
  <section class="analysis-page">
    <div v-if="loading" class="state-card">Analyse wird geladen...</div>
    <div v-else-if="loadError" class="state-card error">{{ loadError }}</div>
    <ExamAnalysis
      v-else-if="exam"
      :exam="exam"
      :corrections="corrections"
      :candidates="exam.candidates"
    />
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useExamsBridge } from '../composables/useExamsBridge'
import ExamAnalysis from './ExamAnalysis.vue'
import type { Exams as ExamsTypes } from '@viccoboard/core'

const route = useRoute()
const {
  examRepository,
  correctionEntryRepository
} = useExamsBridge()

const loading = ref(true)
const loadError = ref('')
const exam = ref<ExamsTypes.Exam | null>(null)
const corrections = ref<ExamsTypes.CorrectionEntry[]>([])

const loadData = async () => {
  loading.value = true
  loadError.value = ''

  try {
    const examId = String(route.params.id)
    const loadedExam = await examRepository?.findById(examId) ?? null

    if (!loadedExam) {
      loadError.value = 'Die angeforderte Prüfung wurde nicht gefunden.'
      return
    }

    exam.value = loadedExam
    corrections.value = await correctionEntryRepository?.findByExam(examId) ?? []
  } catch (error) {
    console.error('Failed to load exam analysis page:', error)
    loadError.value = 'Die Analyse konnte nicht geladen werden.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.analysis-page {
  display: flex;
  flex-direction: column;
}

.state-card {
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  padding: 1.25rem;
}

.state-card.error {
  color: #991b1b;
}
</style>
