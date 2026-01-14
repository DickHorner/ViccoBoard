"use strict";
/**
 * ViccoBoard Demo Application
 *
 * This demo shows the complete flow:
 * 1. Initialize encrypted storage
 * 2. Create a class
 * 3. Add students
 * 4. Record attendance
 * 5. View statistics
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const storage_1 = require("@viccoboard/storage");
const sport_1 = require("@viccoboard/sport");
const core_1 = require("@viccoboard/core");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function main() {
    console.log('🎓 ViccoBoard Demo - SportZens & KURT Unified Suite\n');
    console.log('═'.repeat(60));
    try {
        // Step 1: Initialize Storage
        console.log('\n📦 Step 1: Initialize Encrypted Storage');
        console.log('─'.repeat(60));
        const dataDir = path.join(process.cwd(), 'demo-data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        const dbPath = path.join(dataDir, 'viccoboard-demo.db');
        const storage = new storage_1.SQLiteStorage({
            databasePath: dbPath,
            verbose: true
        });
        const password = 'demo-password-2024';
        await storage.initialize(password);
        console.log('✓ Storage initialized with encryption');
        console.log(`  Database: ${dbPath}`);
        // Run migrations
        storage.registerMigration(new storage_1.InitialSchemaMigration(storage));
        await storage.migrate();
        console.log('✓ Database schema migrated');
        // Step 2: Initialize Repositories
        console.log('\n🏗️  Step 2: Initialize Repositories & Use Cases');
        console.log('─'.repeat(60));
        // Get the adapter from storage
        const adapter = storage.getAdapter();
        const classGroupRepo = new sport_1.ClassGroupRepository(adapter);
        const studentRepo = new sport_1.StudentRepository(adapter);
        const attendanceRepo = new sport_1.AttendanceRepository(adapter);
        const createClassUseCase = new sport_1.CreateClassUseCase(classGroupRepo);
        const addStudentUseCase = new sport_1.AddStudentUseCase(studentRepo, classGroupRepo);
        const recordAttendanceUseCase = new sport_1.RecordAttendanceUseCase(attendanceRepo, studentRepo);
        console.log('✓ Storage adapter initialized');
        console.log('✓ Repositories initialized');
        console.log('✓ Use cases ready');
        // Step 3: Create a Class
        console.log('\n📚 Step 3: Create a Class');
        console.log('─'.repeat(60));
        const schoolYear = '2023/2024';
        const classGroup = await createClassUseCase.execute({
            name: '10a Sport',
            schoolYear: schoolYear,
            state: 'Bayern',
            gradingScheme: 'default'
        });
        console.log('✓ Class created:');
        console.log(`  Name: ${classGroup.name}`);
        console.log(`  School Year: ${classGroup.schoolYear}`);
        console.log(`  State: ${classGroup.state}`);
        console.log(`  ID: ${classGroup.id}`);
        // Step 4: Add Students
        console.log('\n👥 Step 4: Add Students to Class');
        console.log('─'.repeat(60));
        const students = [
            {
                firstName: 'Max',
                lastName: 'Mustermann',
                birthYear: 2010,
                gender: 'male',
                email: 'max.mustermann@example.com'
            },
            {
                firstName: 'Anna',
                lastName: 'Schmidt',
                birthYear: 2009,
                gender: 'female',
                email: 'anna.schmidt@example.com'
            },
            {
                firstName: 'Tim',
                lastName: 'Weber',
                birthYear: 2010,
                gender: 'male',
                email: 'tim.weber@example.com'
            },
            {
                firstName: 'Lisa',
                lastName: 'Müller',
                birthYear: 2009,
                gender: 'female',
                parentEmail: 'familie.mueller@example.com'
            }
        ];
        const createdStudents = [];
        for (const studentData of students) {
            const student = await addStudentUseCase.execute({
                ...studentData,
                classGroupId: classGroup.id
            });
            createdStudents.push(student);
            console.log(`✓ Added: ${student.firstName} ${student.lastName} (${student.birthYear})`);
        }
        // Step 5: Record Attendance (Simulated Lesson)
        console.log('\n📝 Step 5: Record Attendance for Lesson');
        console.log('─'.repeat(60));
        // Create a dummy lesson ID (in real app, this would come from LessonRepository)
        const lessonId = 'lesson-2024-01-13-001';
        console.log(`Lesson ID: ${lessonId}`);
        console.log();
        // Record attendance for each student
        await recordAttendanceUseCase.execute({
            studentId: createdStudents[0].id,
            lessonId: lessonId,
            status: core_1.AttendanceStatus.Present
        });
        console.log(`✓ ${createdStudents[0].firstName} ${createdStudents[0].lastName}: Present`);
        await recordAttendanceUseCase.execute({
            studentId: createdStudents[1].id,
            lessonId: lessonId,
            status: core_1.AttendanceStatus.Present
        });
        console.log(`✓ ${createdStudents[1].firstName} ${createdStudents[1].lastName}: Present`);
        await recordAttendanceUseCase.execute({
            studentId: createdStudents[2].id,
            lessonId: lessonId,
            status: core_1.AttendanceStatus.Absent,
            reason: 'Sick'
        });
        console.log(`✓ ${createdStudents[2].firstName} ${createdStudents[2].lastName}: Absent (Sick)`);
        await recordAttendanceUseCase.execute({
            studentId: createdStudents[3].id,
            lessonId: lessonId,
            status: core_1.AttendanceStatus.Passive,
            reason: 'Injury'
        });
        console.log(`✓ ${createdStudents[3].firstName} ${createdStudents[3].lastName}: Passive (Injury)`);
        // Step 6: View Statistics
        console.log('\n📊 Step 6: View Statistics');
        console.log('─'.repeat(60));
        const classStudents = await studentRepo.findByClassGroup(classGroup.id);
        console.log(`\nClass: ${classGroup.name}`);
        console.log(`Total Students: ${classStudents.length}`);
        console.log();
        for (const student of classStudents) {
            const summary = await attendanceRepo.getAttendanceSummary(student.id);
            console.log(`${student.firstName} ${student.lastName}:`);
            console.log(`  Total Lessons: ${summary.total}`);
            console.log(`  Present: ${summary.present}`);
            console.log(`  Absent: ${summary.absent}`);
            console.log(`  Passive: ${summary.passive}`);
            console.log(`  Attendance Rate: ${summary.percentage.toFixed(1)}%`);
            console.log();
        }
        // Step 7: Query Examples
        console.log('🔍 Step 7: Query Examples');
        console.log('─'.repeat(60));
        const searchResults = await studentRepo.findByName('schmidt');
        console.log(`\nSearch for "schmidt": ${searchResults.length} result(s)`);
        searchResults.forEach(s => {
            console.log(`  - ${s.firstName} ${s.lastName}`);
        });
        const lessonAttendance = await attendanceRepo.findByLesson(lessonId);
        console.log(`\nAttendance for lesson ${lessonId}: ${lessonAttendance.length} record(s)`);
        lessonAttendance.forEach(a => {
            const student = classStudents.find(s => s.id === a.studentId);
            if (student) {
                console.log(`  - ${student.firstName} ${student.lastName}: ${a.status}`);
            }
        });
        // Success!
        console.log('\n' + '═'.repeat(60));
        console.log('✨ Demo completed successfully!');
        console.log('═'.repeat(60));
        console.log('\nThe following features were demonstrated:');
        console.log('  ✓ Encrypted database storage');
        console.log('  ✓ Class creation and management');
        console.log('  ✓ Student enrollment');
        console.log('  ✓ Attendance tracking');
        console.log('  ✓ Statistical analysis');
        console.log('  ✓ Search and query capabilities');
        console.log('\nDatabase location:', dbPath);
        console.log('Password:', password);
        console.log('\nYou can inspect the database using SQLite tools.');
        console.log('');
        // Close storage
        await storage.close();
    }
    catch (error) {
        console.error('\n❌ Error:', error instanceof Error ? error.message : error);
        if (error instanceof Error && error.stack) {
            console.error('Stack trace:');
            console.error(error.stack);
        }
        process.exit(1);
    }
}
// Run the demo
main();
