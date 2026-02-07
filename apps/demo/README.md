# ViccoBoard Demo

## 🎯 Quick Start

Run the working demo to see ViccoBoard in action:

```bash
# Install all dependencies
npm install
npm run install:all

# Build all packages
npm run build

# Run the demo
npm run demo
```

## 🎬 What the Demo Does

The demo application demonstrates the complete flow of ViccoBoard's core functionality:

### 1. **Storage Initialization**
- Creates an encrypted SQLite database
- Applies schema migrations
- Sets up security (password-protected)

### 2. **Class Management**
- Creates a new class: "10a Sport" for school year 2023/2024
- Sets location (Bayern) and grading scheme

### 3. **Student Enrollment**
- Adds 4 students to the class
- Stores personal information (name, birth year, email)
- Links students to the class group

### 4. **Attendance Tracking**
- Records attendance for a simulated lesson
- Demonstrates different statuses:
  - Present
  - Absent (with reason: "Sick")
  - Passive (with reason: "Injury")

### 5. **Statistics & Queries**
- Calculates attendance percentages
- Shows attendance summaries per student
- Demonstrates search functionality
- Lists all attendance records for a lesson

## 📊 Demo Output

You'll see output like this:

```
🎓 ViccoBoard Demo - SportZens & KURT Unified Suite

═════════════════════════════════════════════════════════════

📦 Step 1: Initialize Encrypted Storage
────────────────────────────────────────────────────────────
✓ Storage initialized with encryption
  Database: /path/to/demo-data/viccoboard-demo.db
✓ Database schema migrated

🏗️  Step 2: Initialize Repositories & Use Cases
────────────────────────────────────────────────────────────
✓ Repositories initialized
✓ Use cases ready

📚 Step 3: Create a Class
────────────────────────────────────────────────────────────
✓ Class created:
  Name: 10a Sport
  School Year: 2023/2024
  State: Bayern
  ID: [generated-uuid]

👥 Step 4: Add Students to Class
────────────────────────────────────────────────────────────
✓ Added: Max Mustermann (2010)
✓ Added: Anna Schmidt (2009)
✓ Added: Tim Weber (2010)
✓ Added: Lisa Müller (2009)

📝 Step 5: Record Attendance for Lesson
────────────────────────────────────────────────────────────
✓ Max Mustermann: Present
✓ Anna Schmidt: Present
✓ Tim Weber: Absent (Sick)
✓ Lisa Müller: Passive (Injury)

📊 Step 6: View Statistics
────────────────────────────────────────────────────────────
Class: 10a Sport
Total Students: 4

Max Mustermann:
  Total Lessons: 1
  Present: 1
  Absent: 0
  Passive: 0
  Attendance Rate: 100.0%

Anna Schmidt:
  Total Lessons: 1
  Present: 1
  Absent: 0
  Passive: 0
  Attendance Rate: 100.0%

Tim Weber:
  Total Lessons: 1
  Present: 0
  Absent: 1
  Passive: 0
  Attendance Rate: 0.0%

Lisa Müller:
  Total Lessons: 1
  Present: 0
  Absent: 0
  Passive: 1
  Attendance Rate: 0.0%

🔍 Step 7: Query Examples
────────────────────────────────────────────────────────────
Search for "schmidt": 1 result(s)
  - Anna Schmidt

Attendance for lesson lesson-2024-01-13-001: 4 record(s)
  - Max Mustermann: present
  - Anna Schmidt: present
  - Tim Weber: absent
  - Lisa Müller: passive

═════════════════════════════════════════════════════════════
✨ Demo completed successfully!
═════════════════════════════════════════════════════════════

The following features were demonstrated:
  ✓ Encrypted database storage
  ✓ Class creation and management
  ✓ Student enrollment
  ✓ Attendance tracking
  ✓ Statistical analysis
  ✓ Search and query capabilities
```

## 🗂️ Database Inspection

After running the demo, you can inspect the database:

```bash
# Using sqlite3 CLI
sqlite3 demo-data/viccoboard-demo.db

# View tables
.tables

# Query data
SELECT * FROM class_groups;
SELECT * FROM students;
SELECT * FROM attendance_records;
```

## 🏗️ Architecture Demonstrated

This demo validates the complete architecture:

```
Demo App (CLI)
    ↓
Use Cases (Business Logic)
    ├── CreateClassUseCase
    ├── AddStudentUseCase
    └── RecordAttendanceUseCase
    ↓
Repositories (Data Access)
    ├── ClassGroupRepository
    ├── StudentRepository
    └── AttendanceRepository
    ↓
Storage Layer (SQLite + Encryption)
    └── SQLiteStorage with migrations
```

Student management is centralized in `modules/students` (`StudentRepository`) and must not be reimplemented in apps or `packages/storage`.

## 📦 Packages Used

- **@viccoboard/core** - Type definitions and interfaces
- **@viccoboard/storage** - Encrypted SQLite storage
- **@viccoboard/sport** - SportZens domain logic
- **@viccoboard/students** - Central student management

## ✅ What This Proves

1. ✅ **Clean Architecture Works** - Clear separation of concerns
2. ✅ **Storage Layer Works** - Encrypted database, migrations, CRUD
3. ✅ **Business Logic Works** - Use cases with validation
4. ✅ **Type Safety Works** - Full TypeScript type checking
5. ✅ **Modularity Works** - Independent packages working together
6. ✅ **Offline-First Works** - No internet required

## 🚀 Next Steps

Now that the foundation is proven, you can:

1. **Continue Web UI** - Build on `apps/teacher-ui` (Vue 3, static web)
2. **Implement More Features** - From the 176 items in Plan.md
3. **Add Testing** - Unit and integration tests
4. **Create Plugins** - Assessment types, tools, exporters
5. **Build KURT Domain** - Exam creation and correction

## 🔧 Troubleshooting

If you encounter errors:

```bash
# Clean rebuild
rm -rf node_modules packages/*/node_modules modules/*/node_modules apps/*/node_modules
npm install
npm run install:all
npm run build

# Check TypeScript compilation
cd packages/core && npm run build
cd packages/storage && npm run build
cd modules/students && npm run build
cd modules/sport && npm run build
cd apps/demo && npm run build
```

## 📝 Files Created

```
modules/students/
├── src/
│   ├── repositories/
│   │   └── student.repository.ts
│   └── use-cases/
│       └── add-student.use-case.ts

modules/sport/
├── src/
│   ├── repositories/
│   │   ├── class-group.repository.ts
│   │   └── attendance.repository.ts
│   ├── use-cases/
│   │   ├── create-class.use-case.ts
│   │   └── record-attendance.use-case.ts
│   └── index.ts
├── package.json
└── tsconfig.json

apps/demo/
├── src/
│   └── index.ts
├── package.json
└── tsconfig.json
```

---

**Congratulations!** You now have a working proof-of-concept that demonstrates ViccoBoard's architecture end-to-end.
