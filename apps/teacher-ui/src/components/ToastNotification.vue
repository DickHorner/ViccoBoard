<template>
  <Toast
    position="top-right"
    :breakpoints="{
      '960px': { width: 'min(32rem, calc(100vw - 2rem))' },
      '640px': { width: 'calc(100vw - 1.5rem)', right: '0.75rem', left: '0.75rem' }
    }"
  />
</template>

<script setup lang="ts">
import { watch } from 'vue'
import Toast from 'primevue/toast'
import { useToast as usePrimeToast } from 'primevue/usetoast'
import { useToast, type Toast as AppToast } from '../composables/useToast'

const toastService = usePrimeToast()
const { toasts, removeToast } = useToast()

const severityMap: Record<AppToast['type'], 'success' | 'info' | 'warn' | 'error'> = {
  success: 'success',
  info: 'info',
  warning: 'warn',
  error: 'error'
}

const summaryMap: Record<AppToast['type'], string> = {
  success: 'Erfolg',
  info: 'Hinweis',
  warning: 'Achtung',
  error: 'Fehler'
}

watch(
  toasts,
  (queue) => {
    queue.slice().forEach((entry) => {
      toastService.add({
        severity: severityMap[entry.type],
        summary: summaryMap[entry.type],
        detail: entry.message,
        life: entry.duration,
        closable: true
      })

      removeToast(entry.id)
    })
  },
  { deep: true, immediate: true }
)
</script>
