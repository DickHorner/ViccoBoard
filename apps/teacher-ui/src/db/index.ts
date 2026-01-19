import Dexie, { type EntityTable } from 'dexie'

// Entity interfaces matching core domain models
export interface ClassGroup {
  id: string
  name: string
  schoolYear: string
  createdAt: Date
  updatedAt: Date
}

export interface Student {
  id: string
  classId: string
  firstName: string
  lastName: string
  dateOfBirth?: Date
  email?: string
  /**
   * Base64 encoded image
   * Note: Base64 encoding adds ~33% size overhead vs binary storage.
   * For a 2MB image limit, this results in ~2.7MB of storage per photo.
   * Consider using Blob storage in IndexedDB for more efficient storage if this becomes a bottleneck.
   */
  photo?: string
  createdAt: Date
  updatedAt: Date
}

export interface AttendanceRecord {
  id: string
  studentId: string
  lessonId: string
  date: Date
  status: 'present' | 'absent' | 'excused' | 'late' | 'passive'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface Assessment {
  id: string
  studentId: string
  type: string
  date: Date
  value: number | string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface GradeCategory {
  id: string
  classGroupId: string
  name: string
  description?: string
  type: 'criteria' | 'time' | 'cooper' | 'sportabzeichen' | 'bjs' | 'verbal'
  weight: number
  configuration: string // JSON string of GradeCategoryConfig
  createdAt: Date
  updatedAt: Date
}

export interface PerformanceEntry {
  id: string
  studentId: string
  categoryId: string
  measurements: string // JSON string of measurements
  calculatedGrade?: string | number
  timestamp: Date
  comment?: string
  metadata?: string // JSON string of metadata
}

// Dexie database
export class ViccoDb extends Dexie {
  classGroups!: EntityTable<ClassGroup, 'id'>
  students!: EntityTable<Student, 'id'>
  attendanceRecords!: EntityTable<AttendanceRecord, 'id'>
  assessments!: EntityTable<Assessment, 'id'>
  gradeCategories!: EntityTable<GradeCategory, 'id'>
  performanceEntries!: EntityTable<PerformanceEntry, 'id'>

  constructor() {
    super('ViccoBoard')
    
    this.version(1).stores({
      classGroups: 'id, name, schoolYear',
      students: 'id, classId, firstName, lastName',
      attendanceRecords: 'id, studentId, lessonId, date, status',
      assessments: 'id, studentId, type, date'
    })
    
    // Add grading tables in version 2
    this.version(2).stores({
      classGroups: 'id, name, schoolYear',
      students: 'id, classId, firstName, lastName',
      attendanceRecords: 'id, studentId, lessonId, date, status',
      assessments: 'id, studentId, type, date',
      gradeCategories: 'id, classGroupId, type',
      performanceEntries: 'id, studentId, categoryId, timestamp'
    })
  }
}

export const db = new ViccoDb()
