/**
 * ViccoBoard Core Package
 * Exports all core types, interfaces, and contracts
 */

// Core types
export * from './interfaces/core.types';
export * from './interfaces/storage.types';
export * from './interfaces/crypto.types';

// Plugin interfaces (explicit to avoid name collisions)
export type {
  Plugin,
  PluginRegistry,
  AssessmentType,
  AssessmentData,
  AssessmentConfig,
  Grade,
  GradingTable,
  GradingTableEntry,
  ValidationResult,
  AssessmentUIConfig,
  AssessmentField,
  FieldValidation,
  ToolPlugin,
  ToolConfig,
  ToolState,
  ToolLogEntry,
  ToolUIComponent,
  ToolAction,
  ToolActionResult,
  ExporterPlugin,
  ExportData,
  ExportResult,
  ExporterOptions,
  ExportTemplate,
  IntegrationPlugin,
  IntegrationCredentials,
  IntegrationAction,
  IntegrationResult,
  IntegrationUIConfig,
  IntegrationField
} from './interfaces/plugins.types';
export type { ExportOptions as PluginExportOptions } from './interfaces/plugins.types';

// Domain-specific types under namespaces to avoid collisions
export * as Sport from './interfaces/sport.types';
export * as Exams from './interfaces/exam.types';

// Validators
export * from './validators/exam.validator';
export * from './validators/student.validator';
export * from './validators/grade-category.validator';
export * from './validators/performance-entry.validator';

// Utils
export * from './utils/pagination';
export * from './utils/type-guards';
export * from './utils/retry-policy';

// Version
export const VERSION = '0.1.0';
