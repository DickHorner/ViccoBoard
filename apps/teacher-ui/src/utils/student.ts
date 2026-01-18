/**
 * Shared utility functions for student management
 */

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
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  })
}

/**
 * Format date for input field (YYYY-MM-DD)
 */
export const formatDateForInput = (date: Date): string => {
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

/**
 * Get current date in YYYY-MM-DD format for max date validation
 */
export const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0]
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
