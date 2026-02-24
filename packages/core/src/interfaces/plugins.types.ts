/**
 * Plugin System Interfaces
 * These define the contracts for extending ViccoBoard functionality
 * Following the modular architecture principle: Core knows only interfaces, never implementations
 */

import { Student } from './core.types.js';

// ============================================================================
// Base Plugin Interface
// ============================================================================

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  enabled: boolean;
}

// ============================================================================
// Assessment Type Plugin (for Sport grading categories)
// ============================================================================

export interface AssessmentType extends Plugin {
  type: 'assessment';
  
  /**
   * Calculate grade based on assessment data
   * @param data - Assessment-specific data (time, criteria scores, etc.)
   * @param config - Configuration for this assessment type
   * @returns Calculated grade
   */
  calculateGrade(data: AssessmentData, config: AssessmentConfig): Grade;
  
  /**
   * Validate assessment data
   */
  validate(data: AssessmentData): ValidationResult;
  
  /**
   * Get UI configuration for data entry
   */
  getEntryUIConfig(): AssessmentUIConfig;
}

export interface AssessmentData {
  studentId: string;
  timestamp: Date;
  values: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface AssessmentConfig {
  parameters: Record<string, any>;
  gradingTable?: GradingTable;
}

export interface Grade {
  value: number | string;
  displayValue: string;
  points?: number;
  maxPoints?: number;
  percentage?: number;
  comment?: string;
}

export interface GradingTable {
  id: string;
  name: string;
  type: 'simple' | 'complex';
  dimensions?: ('age' | 'gender' | 'Sport')[];
  entries: GradingTableEntry[];
}

export interface GradingTableEntry {
  criteria: Record<string, any>;
  grade: string | number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AssessmentUIConfig {
  fields: AssessmentField[];
  layout: 'vertical' | 'horizontal' | 'grid';
}

export interface AssessmentField {
  id: string;
  label: string;
  type: 'number' | 'time' | 'text' | 'slider' | 'checkbox' | 'select';
  required: boolean;
  validation?: FieldValidation;
  hint?: string;
}

export interface FieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
  customValidator?: (value: any) => boolean;
}

// ============================================================================
// Tool Plugin (for live classroom tools like Timer, Scoreboard, etc.)
// ============================================================================

export interface ToolPlugin extends Plugin {
  type: 'tool';
  category: 'timer' | 'scoreboard' | 'planning' | 'tactics' | 'random' | 'other';
  icon?: string;
  
  /**
   * Initialize the tool with configuration
   */
  initialize(config: ToolConfig): void;
  
  /**
   * Get the tool's current state for persistence
   */
  getState(): ToolState;
  
  /**
   * Restore tool from saved state
   */
  setState(state: ToolState): void;
  
  /**
   * Get UI component configuration
   */
  getUIComponent(): ToolUIComponent;
  
  /**
   * Handle tool-specific actions
   */
  handleAction(action: ToolAction): ToolActionResult;
}

export interface ToolConfig {
  classGroupId: string;
  lessonId?: string;
  parameters: Record<string, any>;
}

export interface ToolState {
  timestamp: Date;
  data: Record<string, any>;
  logs?: ToolLogEntry[];
}

export interface ToolLogEntry {
  timestamp: Date;
  action: string;
  data: Record<string, any>;
}

export interface ToolUIComponent {
  componentType: string;
  props: Record<string, any>;
}

export interface ToolAction {
  type: string;
  payload: any;
}

export interface ToolActionResult {
  success: boolean;
  data?: any;
  error?: string;
}

// ============================================================================
// Exporter Plugin (for PDF, CSV, Share Packages, etc.)
// ============================================================================

export interface ExporterPlugin extends Plugin {
  type: 'exporter';
  exportFormat: 'pdf' | 'csv' | 'json' | 'share-package' | 'email' | 'other';
  mimeType: string;
  fileExtension: string;
  
  /**
   * Export data in the specified format
   */
  export(data: ExportData, options: ExportOptions): Promise<ExportResult>;
  
  /**
   * Get available export options/templates
   */
  getOptions(): ExporterOptions;
  
  /**
   * Validate export data
   */
  validateData(data: ExportData): ValidationResult;
}

export interface ExportData {
  type: 'class' | 'student' | 'exam' | 'grades' | 'feedback' | 'report' | 'mixed';
  data: any;
  metadata?: Record<string, any>;
}

export interface ExportOptions {
  template?: string;
  includeImages: boolean;
  includeComments: boolean;
  anonymize: boolean;
  customOptions?: Record<string, any>;
}

export interface ExportResult {
  success: boolean;
  data?: Buffer | string;
  filePath?: string;
  mimeType: string;
  error?: string;
}

export interface ExporterOptions {
  templates: ExportTemplate[];
  customizableFields: string[];
  supportsBatch: boolean;
}

export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  previewImage?: string;
}

// ============================================================================
// Integration Plugin (for WebUntis, grade apps, sharing, etc.)
// ============================================================================

export interface IntegrationPlugin extends Plugin {
  type: 'integration';
  integrationType: 'import' | 'export' | 'sync' | 'share';
  requiresOnline: boolean;
  
  /**
   * Initialize integration (e.g., authenticate)
   */
  initialize(credentials?: IntegrationCredentials): Promise<boolean>;
  
  /**
   * Check if integration is available/connected
   */
  isAvailable(): Promise<boolean>;
  
  /**
   * Execute integration action
   */
  execute(action: IntegrationAction): Promise<IntegrationResult>;
  
  /**
   * Get configuration UI
   */
  getConfigUI(): IntegrationUIConfig;
}

export interface IntegrationCredentials {
  username?: string;
  password?: string;
  apiKey?: string;
  token?: string;
  customFields?: Record<string, any>;
}

export interface IntegrationAction {
  type: 'import' | 'export' | 'sync' | 'share';
  data?: any;
  options?: Record<string, any>;
}

export interface IntegrationResult {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

export interface IntegrationUIConfig {
  fields: IntegrationField[];
  instructions?: string;
}

export interface IntegrationField {
  id: string;
  label: string;
  type: 'text' | 'password' | 'select' | 'file';
  required: boolean;
  hint?: string;
}

// ============================================================================
// Plugin Registry Interface
// ============================================================================

export interface PluginRegistry {
  /**
   * Register a new plugin
   */
  register(plugin: Plugin): void;
  
  /**
   * Unregister a plugin
   */
  unregister(pluginId: string): void;
  
  /**
   * Get plugin by ID
   */
  getPlugin(pluginId: string): Plugin | undefined;
  
  /**
   * Get all plugins of a specific type
   */
  getPluginsByType(type: 'assessment' | 'tool' | 'exporter' | 'integration'): Plugin[];
  
  /**
   * Enable/disable a plugin
   */
  setPluginEnabled(pluginId: string, enabled: boolean): void;
  
  /**
   * Get all registered plugins
   */
  getAllPlugins(): Plugin[];
}
