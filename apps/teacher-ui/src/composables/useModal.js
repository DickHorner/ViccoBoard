/**
 * Composable for modal keyboard accessibility
 */
import { onMounted, onUnmounted } from 'vue';
export function useModal(showModal, closeCallback) {
    const handleEscape = (event) => {
        if (event.key === 'Escape' && showModal.value) {
            closeCallback();
        }
    };
    onMounted(() => {
        document.addEventListener('keydown', handleEscape);
    });
    onUnmounted(() => {
        document.removeEventListener('keydown', handleEscape);
    });
    return {
        handleEscape
    };
}
