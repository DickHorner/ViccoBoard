/**
 * Catalog Domain Types
 * Configurable catalogs for status and criteria options
 * Used across attendance, grading, and other sections
 */

/**
 * Status Option
 * Represents a single status choice (present, absent, late, etc.)
 */
export interface StatusOption {
  id: string;
  name: string;
  code: string; // short code like "P", "A", "L"
  description?: string;
  color?: string; // hex or CSS color
  icon?: string; // icon class or emoji
  active: boolean; // can be disabled without deletion
  order: number; // for custom ordering
  metadata?: Record<string, any>; // extensible for future fields
}

/**
 * Status Catalog
 * Collection of available status options for a specific context (e.g., attendance)
 */
export interface StatusCatalog {
  id: string;
  classGroupId: string;
  context: 'attendance' | 'participation' | 'behavior'; // context where these statuses apply
  statuses: StatusOption[];
  createdAt: Date;
  lastModified: Date;
}

/**
 * Criterion Option
 * Represents a single criterion for assessment (teamwork, accuracy, etc.)
 */
export interface CriterionOption {
  id: string;
  name: string;
  description?: string;
  category?: string; // e.g., "technical", "social", "creative"
  active: boolean; // can be disabled without deletion
  order: number; // for custom ordering
  metadata?: Record<string, any>; // extensible for future fields
}

/**
 * Criteria Catalog
 * Collection of available criteria for assessment or grading
 */
export interface CriteriaCatalog {
  id: string;
  classGroupId: string;
  context: 'grading' | 'participation' | 'feedback'; // context where these criteria apply
  criteria: CriterionOption[];
  createdAt: Date;
  lastModified: Date;
}

/**
 * Default attendance statuses (initial setup)
 * These are the standard options when a class is created
 */
export const DEFAULT_ATTENDANCE_STATUSES: StatusOption[] = [
  {
    id: 'status-present',
    name: 'Present',
    code: 'P',
    description: 'Student was present',
    color: '#10b981', // emerald
    icon: '✓',
    active: true,
    order: 0
  },
  {
    id: 'status-absent',
    name: 'Absent',
    code: 'A',
    description: 'Student was absent',
    color: '#ef4444', // red
    icon: '✗',
    active: true,
    order: 1
  },
  {
    id: 'status-excused',
    name: 'Excused',
    code: 'E',
    description: 'Absence was excused',
    color: '#f59e0b', // amber
    icon: '!',
    active: true,
    order: 2
  },
  {
    id: 'status-late',
    name: 'Late',
    code: 'L',
    description: 'Student arrived late',
    color: '#eab308', // yellow
    icon: '⏱',
    active: true,
    order: 3
  },
  {
    id: 'status-passive',
    name: 'Passive',
    code: 'PA',
    description: 'Student participated passively (PE only)',
    color: '#8b5cf6', // violet
    icon: '◯',
    active: true,
    order: 4
  }
];
