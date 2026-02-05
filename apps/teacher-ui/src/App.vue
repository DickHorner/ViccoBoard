<template>
  <ErrorBoundary>
    <AppLayout />
    <ToastNotification />
  </ErrorBoundary>
</template>

<script setup lang="ts">
import AppLayout from './layouts/AppLayout.vue'
import ToastNotification from './components/ToastNotification.vue'
import ErrorBoundary from './components/ErrorBoundary.vue'
</script>
