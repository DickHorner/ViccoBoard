import Dexie, { type EntityTable } from 'dexie';
export interface ClassGroup {
    id: string;
    name: string;
    schoolYear: string;
    color?: string;
    archived?: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Student {
    id: string;
    classId: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: Date;
    email?: string;
    /**
     * Base64 encoded image
     * Note: Base64 encoding adds ~33% size overhead vs binary storage.
     * For a 2MB image limit, this results in ~2.7MB of storage per photo.
     * Consider using Blob storage in IndexedDB for more efficient storage if this becomes a bottleneck.
     */
    photo?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface AttendanceRecord {
    id: string;
    studentId: string;
    lessonId: string;
    date: Date;
    status: 'present' | 'absent' | 'excused' | 'late' | 'passive';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface Assessment {
    id: string;
    studentId: string;
    type: string;
    date: Date;
    value: number | string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface GradeCategory {
    id: string;
    classGroupId: string;
    name: string;
    description?: string;
    type: 'criteria' | 'time' | 'cooper' | 'shuttle' | 'mittelstrecke' | 'sportabzeichen' | 'bjs' | 'verbal';
    weight: number;
    configuration: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface PerformanceEntry {
    id: string;
    studentId: string;
    categoryId: string;
    measurements: string;
    calculatedGrade?: string | number;
    timestamp: Date;
    comment?: string;
    metadata?: string;
}
export interface ExamRecord {
    id: string;
    title: string;
    description?: string;
    classGroupId?: string;
    mode: 'simple' | 'complex';
    structure: string;
    gradingKey: string;
    printPresets: string;
    candidates: string;
    status: 'draft' | 'in-progress' | 'completed';
    createdAt: Date;
    updatedAt: Date;
}
export interface CorrectionEntryRecord {
    id: string;
    examId: string;
    candidateId: string;
    taskScores: string;
    totalPoints: number;
    totalGrade: string | number;
    percentageScore: number;
    comments: string;
    supportTips: string;
    highlightedWork?: string;
    status: 'not-started' | 'in-progress' | 'completed';
    correctedAt?: Date;
    lastModified: Date;
}
export declare class ViccoDb extends Dexie {
    classGroups: EntityTable<ClassGroup, 'id'>;
    students: EntityTable<Student, 'id'>;
    attendanceRecords: EntityTable<AttendanceRecord, 'id'>;
    assessments: EntityTable<Assessment, 'id'>;
    gradeCategories: EntityTable<GradeCategory, 'id'>;
    performanceEntries: EntityTable<PerformanceEntry, 'id'>;
    exams: EntityTable<ExamRecord, 'id'>;
    correctionEntries: EntityTable<CorrectionEntryRecord, 'id'>;
    constructor();
}
export declare const db: ViccoDb;
