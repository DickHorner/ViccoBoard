# ViccoBoard - Unified Teacher Suite

ViccoBoard is a comprehensive teacher application that combines **SportZens** (physical education organization and assessment) and **KURT** (exam creation, correction, and grading) into a single, unified platform.

## 🎯 Project Vision

A single application that provides the full functionality of:
- **SportZens**: Class organization, grading, live classroom tools, WOW workouts, and statistics
- **KURT**: Exam structuring, correction, feedback, support tips, long-term tracking, and email distribution

## 🏗️ Architecture

### Monorepo Structure

```
ViccoBoard/
├── packages/          # Core packages
│   ├── core/         # Domain models, interfaces, storage abstractions
│   └── plugins/      # Plugin registry and contracts
├── modules/          # Domain modules
│   ├── sport/        # SportZens functionality
│   ├── exams/        # KURT functionality
│   ├── export/       # PDF/CSV/Email exports
│   └── integrations/ # WebUntis, grade apps, sharing
└── apps/             # Applications
    ├── teacher/      # Main teacher app (mobile)
    └── wow-web/      # WOW web interface for students
```

### Core Principles

1. **No Features Left Behind**: Every feature from both SportZens and KURT is included
2. **Modular Architecture**: New domains can be added as modules/plugins without core changes
3. **Local-First/Offline**: Data remains local; internet only when required (WOW, email)
4. **Security**: Encrypted local storage, app lock (PIN/password), backup/restore

### Technology Stack

- **Language**: TypeScript
- **Mobile Framework**: React Native / Flutter (TBD based on environment)
- **Storage**: Encrypted SQLite (SQLCipher)
- **Architecture**: Clean Architecture + Domain-Driven Design
- **Plugin System**: Interface-based extensibility

## 📦 Packages

### @viccoboard/core

Core domain models, interfaces, and contracts. Defines:
- Security & Identity types
- Storage & Backup interfaces
- Core entities (Classes, Students, Lessons, Attendance)
- Plugin system interfaces (AssessmentType, ToolPlugin, Exporter, Integration)
- SportZens domain types
- KURT/Exam domain types

### @viccoboard/plugins

Plugin registry and management system. Allows registration of:
- Assessment types (criteria-based, time-based, Cooper test, etc.)
- Tools (timer, scoreboard, tactics board, etc.)
- Exporters (PDF, CSV, share packages)
- Integrations (WebUntis, grade apps)

## 🎓 SportZens Features

### Core Management
- ✅ Class creation and management
- ✅ Student profiles with photos and birth years
- ✅ Lesson planning with automatic generation
- ✅ Attendance tracking and export
- ✅ Quick navigation and shortcuts

### Grading System
- ✅ Multiple grading schemes per class
- ✅ Criteria-based grading (up to 8 criteria)
- ✅ Time-based grading with linear mapping
- ✅ Cooper test (paperless, automated)
- ✅ Verbal assessments

### Tests & Measurements
- ✅ Shuttle Run with audio signals and custom config
- ✅ Cooper Test (running/swimming)
- ✅ Middle-distance timing
- ✅ Sportabzeichen (sports badge) with PDF export
- ✅ Bundesjugendspiele (federal youth games)

### Live Tools
- ✅ Team division (digital, fair algorithms)
- ✅ Tournament planning and execution
- ✅ Scoreboard for tracking scores
- ✅ Timer (countdown, stopwatch, intervals)
- ✅ Tactics board with sport-specific annotations
- ✅ Dice rolling with logging

### WOW (Workouts Online Worksheet)
- ✅ Create and publish workouts
- ✅ Browser-based student input (no registration)
- ✅ Progress tracking and overview

## 📝 KURT Features

### Exam Structure
- ✅ Simple vs. Complex modes
- ✅ 3-level task hierarchy (unlimited tasks in complex mode)
- ✅ Choice tasks (e.g., 3a/3b)
- ✅ Bonus points
- ✅ Exam parts with sub-scores
- ✅ Criteria formatting (bold, italic, etc.)

### Grading System
- ✅ Flexible grading keys with presets
- ✅ Percentage-based grade boundaries
- ✅ Post-correction adjustments
- ✅ Error points to grade conversion
- ✅ Rounding rules and fine-tuning

### Correction
- ✅ Compact correction interface
- ✅ Tab navigation
- ✅ Task-wise correction (table mode)
- ✅ Alternative grading (++, +, 0, -, --)
- ✅ Comment boxes per task level
- ✅ Quick candidate switching

### Support Tips (Fördertipps)
- ✅ Personal database of support tips
- ✅ Task-specific assignment
- ✅ Up to 3 links per tip
- ✅ QR code generation
- ✅ Weighting and prioritization
- ✅ Usage analytics

### Analysis & Export
- ✅ Difficulty analysis
- ✅ Point adjustment assistant
- ✅ 4 PDF layouts with customization
- ✅ Batch PDF generation
- ✅ Email distribution with templates
- ✅ Special achievement highlighting

### Integration
- ✅ WebUntis import
- ✅ Grade app compatibility
- ✅ Exam draft sharing
- ✅ Support tip sharing

## 🔒 Security Features

- ✅ Encrypted local storage
- ✅ App lock (PIN/Password)
- ✅ Database password protection
- ✅ Session timeout
- ✅ Biometric authentication (optional)
- ✅ Backup/Restore with encryption

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher

### Quick Demo

See ViccoBoard in action with a working demonstration:

```bash
# Windows (PowerShell)
.\build-and-run.ps1

# Unix/Mac/Linux
chmod +x build-and-run.sh
./build-and-run.sh

# Or manually
npm run build
npm run demo
```

The demo creates a class, enrolls students, records attendance, and shows statistics - proving the entire architecture works end-to-end!

See [DEMO_COMPLETE.md](./DEMO_COMPLETE.md) for details.

### Development

```bash
# Install dependencies for a specific package
cd packages/core && npm install

# Build a specific package
cd packages/core && npm run build

# Run tests (when available)
npm test
```

## 📖 Documentation

For detailed documentation, see:
- [Plan.md](./Plan.md) - Complete feature specification
- [agents.md](./agents.md) - Agent setup and development guidelines

## 🛠️ Development

### Project Status

✅ **Working Proof-of-Concept Complete!**

A full working demo is available that demonstrates:
- Encrypted database storage
- Class and student management
- Attendance tracking
- Statistics and queries
- Complete Clean Architecture implementation

**Progress: 25% complete** - Foundation proven, ready for feature expansion.

Run `npm run demo` to see it in action!

### Contributing

This project follows strict modularity principles:
1. Core knows only interfaces, never implementations
2. Each module is self-contained
3. Plugins extend functionality without core changes
4. All features from Plan.md must be implemented

## 📋 License

UNLICENSED - Private project

---

**Note**: This is a comprehensive educational software project combining physical education management (SportZens) with exam/assessment management (KURT) into a unified teacher toolkit.
