/**
 * Simple toast notification composable
 */
export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration: number;
}
export declare function useToast(): {
    toasts: import("vue").Ref<{
        id: number;
        message: string;
        type: "success" | "error" | "info" | "warning";
        duration: number;
    }[], Toast[] | {
        id: number;
        message: string;
        type: "success" | "error" | "info" | "warning";
        duration: number;
    }[]>;
    showToast: (message: string, type?: Toast["type"], duration?: number) => number;
    removeToast: (id: number) => void;
    success: (message: string, duration?: number) => number;
    error: (message: string, duration?: number) => number;
    info: (message: string, duration?: number) => number;
    warning: (message: string, duration?: number) => number;
};
