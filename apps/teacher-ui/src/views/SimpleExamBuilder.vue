<template>
  <div class="simple-exam-builder-page">
    <SimpleExamBuilderForm />
  </div>
</template>

<script setup lang="ts">
import SimpleExamBuilderForm from '../components/SimpleExamBuilderForm.vue';
</script>

<style scoped>
.simple-exam-builder-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 2rem 0;
}
</style>
