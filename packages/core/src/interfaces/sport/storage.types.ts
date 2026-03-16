/**
 * Sport persistence and configuration types.
 */

export interface PerformanceEntry {
  id: string;
  studentId: string;
  categoryId: string;
  measurements: Record<string, any>;
  calculatedGrade?: string | number;
  timestamp: Date;
  deviceInfo?: string;
  comment?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  lastModified: Date;
}

export interface ToolSession {
  id: string;
  toolType: string;
  classGroupId?: string;
  lessonId?: string;
  sessionMetadata: Record<string, any>;
  startedAt: Date;
  endedAt?: Date;
  createdAt: Date;
  lastModified: Date;
}

export interface TableDefinition {
  id: string;
  name: string;
  type: 'simple' | 'complex';
  description?: string;
  source: 'local' | 'imported' | 'downloaded';
  active?: boolean;
  dimensions: TableDimension[];
  mappingRules: MappingRule[];
  entries: TableEntry[];
  createdAt: Date;
  lastModified: Date;
}

export interface TableDimension {
  name: 'age' | 'gender' | 'Sport' | 'discipline' | 'custom';
  values: string[];
}

export interface MappingRule {
  condition: Record<string, any>;
  output: Record<string, any>;
}

export interface TableEntry {
  key: Record<string, any>;
  value: any;
}

export interface ShuttleRunConfig {
  id: string;
  name: string;
  levels: ShuttleRunLevel[];
  audioSignalsEnabled: boolean;
  source: 'default' | 'imported';
  createdAt: Date;
  lastModified: Date;
}

export interface ShuttleRunLevel {
  level: number;
  lane: number;
  speed: number;
  duration: number;
}

export interface CooperTestConfig {
  id: string;
  name: string;
  SportType: 'running' | 'swimming';
  distanceUnit: 'meters' | 'kilometers';
  lapLengthMeters: number;
  gradingTableId?: string;
  source: 'default' | 'imported';
  createdAt: Date;
  lastModified: Date;
}
