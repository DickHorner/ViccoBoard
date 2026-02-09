/**
 * Composable for modal keyboard accessibility
 */
import { Ref } from 'vue';
export declare function useModal(showModal: Ref<boolean>, closeCallback: () => void): {
    handleEscape: (event: KeyboardEvent) => void;
};
