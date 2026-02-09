import Dexie from 'dexie';
// Dexie database
export class ViccoDb extends Dexie {
    constructor() {
        super('ViccoBoard');
        // Version 1: Initial schema with core tables
        this.version(1).stores({
            classGroups: 'id, name, schoolYear',
            students: 'id, classId, firstName, lastName',
            attendanceRecords: 'id, studentId, lessonId, date, status',
            assessments: 'id, studentId, type, date'
        });
        // Version 2: Add grading tables
        this.version(2).stores({
            gradeCategories: 'id, classGroupId, type',
            performanceEntries: 'id, studentId, categoryId, timestamp'
        });
        // Version 3: Add exam tables
        this.version(3).stores({
            exams: 'id, title, status, classGroupId'
        });
        // Version 4: Add correction entries
        this.version(4).stores({
            correctionEntries: 'id, examId, candidateId, status'
        });
    }
}
export const db = new ViccoDb();
