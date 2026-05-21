/**
 * Shared utility functions for student management
 */

import { formatGermanDate } from './locale-format'

/**
 * Get initials from first and last name
 */
export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

/**
 * Format date for display with consistent locale
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatGermanDate(d)
}

/**
 * Format date for input field (DD.MM.YYYY)
 */
export const formatDateForInput = (date: Date): string => {
  const d = new Date(date)
  return formatGermanDate(d)
}

/**
 * Get current date in DD.MM.YYYY format for max date validation
 */
export const getTodayDateString = (): string => {
  return formatGermanDate(new Date())
}

/**
 * Debounce function for search input
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
