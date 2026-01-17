/**
 * Composable for modal keyboard accessibility
 */

import { onMounted, onUnmounted, Ref } from 'vue'

export function useModal(showModal: Ref<boolean>, closeCallback: () => void) {
  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && showModal.value) {
      closeCallback()
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleEscape)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleEscape)
  })

  return {
    handleEscape
  }
}
