<template>
  <section class="app-form-grid">
    <header class="app-actions-row">
      <h1>KBR</h1>
      <Tag :value="loading ? '… Prüfungen' : `${examCount} Prüfungen`" severity="info" />
    </header>

    <Panel header="Prüfungen und Korrektur">
      <div class="app-actions-row">
        <Button
          v-for="entry in entries"
          :key="entry.to"
          as="router-link"
          :to="entry.to"
          :label="entry.title"
          severity="secondary"
          outlined
          size="small"
        />
      </div>
    </Panel>

    <div class="app-actions-row" aria-label="KBR-Kennzahlen">
      <Tag :value="`${examCount} Prüfungen`" severity="secondary" />
      <Tag :value="`${countsLoading ? '…' : supportTipCount} Fördertipps`" severity="secondary" />
      <Tag :value="`${countsLoading ? '…' : longTermNoteCount} Langzeitnotizen`" severity="secondary" />
    </div>
    <Message v-if="countsError" severity="warn" role="status">{{ countsError }}</Message>

    <Panel header="Zuletzt bearbeitet">
      <p v-if="loading">Prüfungen werden geladen…</p>
      <div v-else-if="loadError">
        <Message severity="error" role="alert">{{ loadError }}</Message>
        <Button label="Erneut versuchen" size="small" @click="loadData" />
      </div>
      <p v-else-if="recentExams.length === 0">Noch keine Prüfungen vorhanden.</p>
      <div v-else class="app-form-grid">
        <div v-for="exam in recentExams" :key="exam.id" class="app-form-grid">
          <div>
            <strong>{{ exam.title }}</strong>
            <span class="app-data-note"> · {{ formatDate(exam.lastModified) }}</span>
          </div>
          <div class="app-actions-row">
            <Button as="router-link" :to="`/exams/${exam.id}/workspace`" label="Öffnen" size="small" severity="secondary" outlined />
            <Button as="router-link" :to="`/exams/${exam.id}/correct`" label="Korrigieren" size="small" severity="secondary" outlined />
            <Button as="router-link" :to="`/exams/${exam.id}/analysis`" label="Analyse" size="small" severity="secondary" outlined />
            <Button as="router-link" :to="`/exams/${exam.id}/export`" label="Rückmeldebogen" size="small" severity="secondary" outlined />
          </div>
        </div>
      </div>
    </Panel>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Panel from 'openvue/panel'
import Button from 'openvue/button'
import Message from 'openvue/message'
import Tag from 'openvue/tag'
import { useExamsBridge } from '../composables/useExamsBridge'
import type { Exams as ExamsTypes } from '@viccoboard/core'
import { formatGermanDate } from '../utils/locale-format'
import { isExamTemplate } from '../utils/exam-school-year'

const { examRepository } = useExamsBridge()
const { supportTipRepository, studentLongTermNoteRepository } = useExamsBridge()

const loading = ref(true)
const loadError = ref('')
const countsError = ref('')
const countsLoading = ref(true)
const exams = ref<ExamsTypes.Exam[]>([])
const supportTipCount = ref(0)
const longTermNoteCount = ref(0)

const examCount = computed(() => exams.value.length)
const recentExams = computed(() =>
  [...exams.value]
    .filter(exam => !isExamTemplate(exam))
    .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
    .slice(0, 5)
)
const entries = [
  {
    to: '/exams/new',
    title: 'Neue Prüfung',
  },
  {
    to: '/exams',
    title: 'Prüfungen',
  },
  {
    to: '/exams?workflow=correct',
    title: 'Manuelle Korrektur',
  },
  {
    to: '/sheet-templates',
    title: 'Druckbogenvorlagen',
  },
  {
    to: '/exams?workflow=sheets',
    title: 'Rückmeldebögen',
  },
  {
    to: '/exams?workflow=analysis',
    title: 'Analyse',
  },
  {
    to: '/support-tips',
    title: 'Fördertipps',
  }
]

const loadData = async () => {
  loading.value = true
  loadError.value = ''
  try {
    exams.value = await (examRepository?.findAll() ?? Promise.resolve([]))
  } catch (error) {
    console.error('Failed to load KBR exams:', error)
    loadError.value = 'Prüfungen konnten nicht geladen werden.'
  } finally {
    loading.value = false
  }
}

const loadCounts = async () => {
  countsLoading.value = true
  try {
    const [supportTips, longTermNotes] = await Promise.all([
      supportTipRepository?.findAll() ?? Promise.resolve([]),
      studentLongTermNoteRepository?.findAll() ?? Promise.resolve([])
    ])
    supportTipCount.value = supportTips.length
    longTermNoteCount.value = longTermNotes.length
  } catch (error) {
    console.error('Failed to load KBR metrics:', error)
    countsError.value = 'Einige Kennzahlen konnten nicht geladen werden.'
  } finally {
    countsLoading.value = false
  }
}

const formatDate = (date: Date): string =>
  formatGermanDate(date)

onMounted(() => {
  void loadData()
  void loadCounts()
})
</script>
