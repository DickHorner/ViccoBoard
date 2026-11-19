<template>
  <Dialog
    :visible="Boolean(props.exam)"
    :closable="!deleting"
    modal
    :header="isTemplate ? 'Prüfungsvorlage löschen' : 'Prüfung löschen'"
    :style="{ width: '30rem', maxWidth: 'calc(100vw - 2rem)' }"
    @update:visible="visible => { if (!visible && !deleting) emit('close') }"
  >
    <p>
      <strong>{{ props.exam?.title }}</strong> wirklich endgültig löschen?
    </p>
    <p v-if="isTemplate">
      Die Prüfungsvorlage wird entfernt. Bereits daraus erstellte Prüfungen bleiben erhalten.
    </p>
    <p v-else>
      Dabei werden auch die zugehörigen Korrekturen und Ergebnisse gelöscht.
      Diese Aktion kann nicht rückgängig gemacht werden.
    </p>
    <Message v-if="error" severity="error" role="alert">{{ error }}</Message>
    <div class="dialog-actions">
      <Button label="Abbrechen" severity="secondary" :disabled="deleting" @click="emit('close')" />
      <Button
        severity="danger"
        :label="deleting ? 'Wird gelöscht…' : isTemplate ? 'Vorlage endgültig löschen' : 'Prüfung endgültig löschen'"
        :loading="deleting"
        :disabled="deleting"
        @click="confirmDelete"
      />
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Dialog from 'openvue/dialog'
import Button from 'openvue/button'
import Message from 'openvue/message'
import type { Exams } from '@viccoboard/core'
import { useExamsBridge } from '../composables/useExamsBridge'
import { isExamTemplate } from '../utils/exam-school-year'

const props = defineProps<{ exam: Exams.Exam | null }>()
const emit = defineEmits<{ close: []; deleted: [id: string] }>()
const { deleteExam } = useExamsBridge()
const deleting = ref(false)
const error = ref('')
const isTemplate = computed(() => props.exam ? isExamTemplate(props.exam) : false)

watch(() => props.exam?.id, () => { error.value = '' })

async function confirmDelete(): Promise<void> {
  const exam = props.exam
  if (!exam || deleting.value) return

  deleting.value = true
  error.value = ''
  try {
    await deleteExam(exam.id)
    emit('deleted', exam.id)
  } catch (cause) {
    console.error('Failed to delete exam:', cause)
    error.value = cause instanceof Error ? cause.message : 'Der Datensatz konnte nicht gelöscht werden.'
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.dialog-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.dialog-actions :deep(.p-button) {
  min-height: 44px;
}
</style>
