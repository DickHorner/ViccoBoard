/**
 * Grading scheme constants
 */

export const DEFAULT_GRADING_SCHEME = 'default' as const

export const GRADING_SCHEMES = {
  'default': 'Default (1-6 German)',
  'numeric-1-15': 'Numeric (1-15 Points)',
  'letter-a-f': 'Letter Grades (A-F)',
  'percentage': 'Percentage (0-100%)'
} as const

export type GradingSchemeKey = keyof typeof GRADING_SCHEMES
