/**
 * Core domain interfaces for ViccoBoard
 * Defines the contracts that all modules must follow
 */

// ============================================================================
// Security & Identity
// ============================================================================

export interface TeacherAccount {
  id: string;
  createdAt: Date;
  lastModified: Date;
  securitySettings: SecuritySettings;
}

export interface SecuritySettings {
  pinEnabled: boolean;
  pinHash?: string;
  passwordHash?: string;
  databasePasswordHash?: string;
  sessionTimeoutMinutes: number;
  biometricEnabled: boolean;
  lockAfterMinutes: number;
}

// ============================================================================
// Storage & Backup
// ============================================================================

export interface BackupMetadata {
  id: string;
  createdAt: Date;
  version: string;
  description?: string;
  encrypted: boolean;
  size: number;
}

export interface BackupData {
  metadata: BackupMetadata;
  data: Record<string, any>;
}

// ============================================================================
// Core Entities (Shared between Sport and Exams)
// ============================================================================

export interface ClassGroup {
  id: string;
  name: string;
  schoolYear: string;
  color?: string;
  archived?: boolean;
  state?: string; // Bundesland
  holidayCalendarRef?: string;
  gradingScheme?: string;
  subjectProfile?: string;
  createdAt: Date;
  lastModified: Date;
}

export type StudentGender = 'm' | 'f';

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gender?: StudentGender;
  photoUri?: string;
  contactInfo?: ContactInfo;
  classGroupId: string;
  legacyDateOfBirthMissing?: boolean;
  createdAt: Date;
  lastModified: Date;
}

export interface ContactInfo {
  email?: string;
  parentEmail?: string;
  phone?: string;
}

export interface StudentModuleProfile {
  id: string;
  studentId: string;
  moduleKey: string;
  createdAt: Date;
  lastModified: Date;
}

export interface SportStudentProfile extends StudentModuleProfile {
  moduleKey: 'sport';
  medicalNotes?: string;
  asthma?: boolean;
  diabetes?: boolean;
  hemiplegia?: boolean;
  exemptFrom?: string | null;
  exemptUntil?: string | null;
  disadvantageCompensation?: string;
  swimmingCapable?: boolean;
}

export interface ImportBatchSummary {
  read: number;
  valid: number;
  imported: number;
  skipped: number;
  conflicts: number;
  errors: number;
}

export interface ImportBatch {
  id: string;
  sourceType: 'demo' | 'live';
  importType: 'student_csv';
  label: string;
  summary: ImportBatchSummary;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  lastModified: Date;
}

export interface ImportBatchItem {
  id: string;
  batchId: string;
  entityType: 'student' | 'class_group';
  entityId: string;
  action: 'created' | 'reused' | 'skipped' | 'conflict';
  payload?: Record<string, unknown>;
  createdAt: Date;
  lastModified: Date;
}

export interface Lesson {
  id: string;
  classGroupId: string;
  date: Date;
  lessonParts?: LessonPart[];
  shortcuts?: string[];
  randomStudentSeed?: string;
  randomStudentHistory?: string[];
  attendance: AttendanceRecord[];
  createdAt: Date;
  lastModified: Date;
}

export interface LessonPart {
  id: string;
  description: string;
  duration?: number;
  type?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  lessonId: string;
  status: AttendanceStatus;
  reason?: string;
  notes?: string;
  timestamp: Date;
  createdAt: Date;
  lastModified: Date;
  exported?: boolean;
}

export enum AttendanceStatus {
  Present = 'present',
  Absent = 'absent',
  Excused = 'excused',
  Late = 'late',
  Passive = 'passive'
}

// ============================================================================
// Attachment & Media
// ============================================================================

export interface Attachment {
  id: string;
  type: 'photo' | 'signature' | 'image' | 'document';
  uri: string;
  mimeType: string;
  size: number;
  createdAt: Date;
}

// ============================================================================
// Template System
// ============================================================================

export interface Template {
  id: string;
  name: string;
  type: 'csv' | 'pdf' | 'email' | 'print';
  content: string;
  variables: TemplateVariable[];
  createdAt: Date;
  lastModified: Date;
}

export interface TemplateVariable {
  name: string;
  description: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;
}

// ============================================================================
// Export/Import
// ============================================================================

export interface ExportOptions {
  format: 'csv' | 'pdf' | 'json' | 'share-package';
  includeAttachments: boolean;
  includeDeleted: boolean;
  dateRange?: DateRange;
}

export interface DateRange {
  start: Date;
  end: Date;
}

// ============================================================================
// Analytics (Privacy-respecting)
// ============================================================================

export interface AnalyticsData {
  aggregatedStats: Record<string, number>;
  timestamp: Date;
  // No personal data should ever be included
}
