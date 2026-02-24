/**
 * Sport APK Schema Types
 * Snake_case fields match parity-spec schemas exactly.
 */

export interface SportClass {
  id: string;
  name: string;
  school_year: string;
  teacher_id: string;
  color?: string;
  created_at?: string;
  grade_category_count?: number;
  grade_scheme?: string;
  is_dirty?: number;
  settings?: Record<string, unknown>;
  sort?: string;
  stats?: Record<string, unknown>;
  student_count?: number;
  updated_at?: string;
  version?: number;
}

export interface SportStudent {
  class_id: string;
  first_name: string;
  id: string;
  last_name: string;
  teacher_id: string;
  gender?: string;
  is_dirty?: number;
  public_code?: string;
  settings?: Record<string, unknown>;
  stats?: Record<string, unknown>;
  version?: number;
}

export interface SportGrade {
  category_id: string;
  class_id: string;
  id: string;
  student_id: string;
  teacher_id: string;
  type: string;
  year: number;
  created_at?: string;
  criterias?: Record<string, unknown>;
  deleted?: number;
  grade?: string;
  is_dirty?: number;
  main_category_id?: string;
  name?: string;
  total_points?: number;
  updated_at?: string;
  weight?: number;
}

export interface SportCategory {
  class_id: string;
  id: string;
  name: string;
  teacher_id: string;
  type: string;
  weight: number;
  year: number;
  categories?: Record<string, unknown>;
  color?: string;
  created_at?: string;
  deleted?: number;
  is_dirty?: number;
  main_category_id?: string;
  max_value?: number;
  min_value?: number;
  settings?: Record<string, unknown>;
  stats?: Record<string, unknown>;
  updated_at?: string;
}

export interface SportTable {
  grade_scheme: string;
  id: string;
  name: string;
  teacher_id: string;
  color?: string;
  created_at?: string;
  grade_scheme_direction?: string;
  is_dirty?: number;
  school?: string;
  updated_at?: string;
  version?: number;
  visibility?: string;
}

export interface SportGradeWeighting {
  attendance: number;
  grades: number;
  remarks: number;
  wow: number;
}

export interface SportNewDayData {
  date: string;
  additionalExercises?: unknown[];
  exercises?: unknown[];
  notes?: string;
}

export interface SportUserData {
  email: string;
  id: string;
  role: string;
  addons?: unknown[];
  first_name?: string;
  invoices?: unknown[];
  last_name?: string;
  settings?: Record<string, unknown>;
}
