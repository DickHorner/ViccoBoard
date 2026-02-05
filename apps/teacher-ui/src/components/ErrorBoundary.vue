<template>
  <div class="error-boundary">
    <slot v-if="!hasError" />
    <div v-else class="error-fallback">
      <div class="error-content">
        <div class="error-icon">⚠️</div>
        <h2>Something went wrong</h2>
        <p class="error-message">{{ errorMessage }}</p>
        <div class="error-actions">
          <button @click="handleReset">Try Again</button>
          <button class="secondary" @click="handleReloadPage">Reload Page</button>
        </div>
        <details v-if="errorStack" class="error-details">
          <summary>Technical Details</summary>
          <pre>{{ errorStack }}</pre>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

const hasError = ref(false)
const errorMessage = ref('')
const errorStack = ref('')

onErrorCaptured((err: unknown, instance, info) => {
  hasError.value = true
  
  if (err instanceof Error) {
    errorMessage.value = err.message || 'An unexpected error occurred'
    errorStack.value = err.stack || info
  } else if (typeof err === 'string') {
    errorMessage.value = err
  } else {
    errorMessage.value = 'An unexpected error occurred'
    errorStack.value = info
  }

  // Log error to console for debugging
  console.error('[ErrorBoundary] Caught error:', {
    error: err,
    instance,
    info,
    timestamp: new Date().toISOString()
  })

  // Prevent error from propagating
  return false
})

const handleReset = (): void => {
  hasError.value = false
  errorMessage.value = ''
  errorStack.value = ''
}

const handleReloadPage = (): void => {
  window.location.reload()
}
</script>

<style scoped>
.error-boundary {
  display: contents;
}

.error-fallback {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.error-content {
  max-width: 600px;
  width: 100%;
  padding: 2rem;
  border: 2px solid var(--color-danger, #e74c3c);
  border-radius: 8px;
  background: var(--color-background-error, #fef5f5);
  text-align: center;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-content h2 {
  margin: 0 0 1rem 0;
  color: var(--color-danger, #e74c3c);
}

.error-message {
  margin: 0 0 1.5rem 0;
  color: var(--color-text, #333);
  font-size: 1rem;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.error-actions button {
  padding: 0.5rem 1.5rem;
  border: 1px solid var(--color-border, #ddd);
  border-radius: 4px;
  background: var(--color-primary, #3498db);
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
}

.error-actions button:hover {
  background: var(--color-primary-dark, #2980b9);
}

.error-actions button.secondary {
  background: transparent;
  color: var(--color-text, #333);
}

.error-actions button.secondary:hover {
  background: var(--color-hover, #f5f5f5);
}

.error-details {
  margin-top: 1.5rem;
  text-align: left;
  border-top: 1px solid var(--color-border, #ddd);
  padding-top: 1rem;
}

.error-details summary {
  cursor: pointer;
  font-weight: 500;
  margin-bottom: 0.5rem;
  user-select: none;
}

.error-details summary:hover {
  color: var(--color-primary, #3498db);
}

.error-details pre {
  margin: 0;
  padding: 1rem;
  background: var(--color-background, #fff);
  border: 1px solid var(--color-border, #ddd);
  border-radius: 4px;
  font-size: 0.85rem;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
