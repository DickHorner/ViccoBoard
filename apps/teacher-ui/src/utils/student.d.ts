/**
 * Shared utility functions for student management
 */
/**
 * Get initials from first and last name
 */
export declare const getInitials: (firstName: string, lastName: string) => string;
/**
 * Format date for display with consistent locale
 */
export declare const formatDate: (date: Date | string) => string;
/**
 * Format date for input field (YYYY-MM-DD)
 */
export declare const formatDateForInput: (date: Date) => string;
/**
 * Get current date in YYYY-MM-DD format for max date validation
 */
export declare const getTodayDateString: () => string;
/**
 * Debounce function for search input
 */
export declare const debounce: <T extends (...args: any[]) => any>(func: T, wait: number) => ((...args: Parameters<T>) => void);
