/**
 * ViccoBoard Core Package
 * Exports all core types, interfaces, and contracts
 */

// Core types
export * from './interfaces/core.types.js';
export * from './interfaces/storage.types.js';
export * from './interfaces/crypto.types.js';
export * from './interfaces/catalog-types.js';

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
} from './interfaces/plugins.types.js';
export type { ExportOptions as PluginExportOptions } from './interfaces/plugins.types.js';

// Domain-specific types under namespaces to avoid collisions
export * as Sport from './interfaces/sport.types.js';
export * as Exams from './interfaces/exam.types.js';
export * as SportZens from './interfaces/sportzens.types.js';

// Validators
export * from './validators/exam.validator.js';
export * from './validators/student.validator.js';
export * from './validators/grade-category.validator.js';
export * from './validators/performance-entry.validator.js';

// Utils
export * from './utils/pagination.js';
export * from './utils/type-guards.js';
export * from './utils/retry-policy.js';
export * from './utils/safe-json.js';

// Version
export const VERSION = '0.1.0';
