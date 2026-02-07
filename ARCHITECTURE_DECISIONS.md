# ViccoBoard Architecture Decisions

**Document Date:** January 16, 2026  
**Baseline Commit:** d8875dd  
**Status:** Architecture validated with working demo

---

## 1. Monorepo Structure (npm workspaces)

### Decision
Use npm workspaces with a hierarchical package structure: **packages/** (core shared), **modules/** (domain-specific), **apps/** (applications).

### Rationale
- **Shared type definitions**: All packages use @viccoboard/core for consistency
- **Code reuse**: Core types, storage, crypto shared across modules and apps
- **Independent deployment**: Apps can be deployed separately (web, desktop, mobile)
- **Clear boundaries**: Plugin system enables optional features without core changes
- **Team scaling**: Clear package ownership (Agent A → core, Agent D → sport module, etc.)

### Structure
```
packages/
├── core/          # Types, interfaces, domain models (mandatory)
├── plugins/       # Plugin registry and contracts
└── storage/       # Encrypted storage, repositories, migrations

modules/
├── sport/         # SportZens domain (PE management)
└── exams/         # KURT domain (assessments)

apps/
├── teacher-ui/    # Main teacher application (UI TBD)
├── wow-web/       # Student workout web interface
└── demo/          # CLI proof-of-concept (validation only)
```

### Trade-offs
**Pros:**
- Single TypeScript compilation (`npm run build`)
- Unified versioning for related packages
- Easy to enforce architectural boundaries
- Simple dependency management

**Cons:**
- Requires understanding of workspace structure
- Some developers prefer separate repos
- Monorepo tooling is essential

### How This Supports agents.md
- Agent A (Spec Keeper) maintains core types across packages
- Agent B (Architecture) enforces boundaries between packages
- Agents C-I implement features within their module packages
- Agent I writes tests across all packages

---

## 2. Local-First, Offline-First Architecture

### Decision
**No online requirement.** All core functionality works without network. Optional features (WebUntis, email, WOW results sharing) can fail gracefully.

### Data Storage Strategy

#### Default: IndexedDB (Browser/iPad)
```typescript
// Production: iPadOS Safari environment
const storage = new IndexedDBStorage({
  dbName: 'viccoboard',
  version: 1,
  encryptionKey: await deriveKey(password)
});
```

**Why IndexedDB:**
- Built into Safari/WebKit (no external dependencies)
- ~50MB+ storage on iPad (sufficient for ~500 students + exams)
- Encrypted with AES before storage
- Async API suitable for web
- Persists across app reloads

#### Demo/Testing: SQLite (Node.js)
```typescript
// Demo environment: CLI with better-sqlite3
const storage = new SQLiteStorage({
  filePath: 'demo.db',
  password: 'test-password'
});
```

**Why SQLite for demo:**
- Sync API simpler for CLI testing
- Can verify encryption (readable with SQLCipher)
- Easy to inspect database with command-line tools
- Good for scripting automated tests

#### Production (Future): SQLCipher
```typescript
// Production deployment: Encrypted native database
const storage = new SQLCipherStorage({
  filePath: '/secure/viccoboard.db',
  password: userPassword
});
```

**Why SQLCipher for production:**
- Military-grade AES-256 encryption
- Industry standard for secure mobile apps
- Available on iOS and Android
- Drop-in replacement for SQLite

### Encryption Philosophy
**No plaintext data at rest.** All sensitive information (names, grades, attendance) is AES-256 encrypted before storage.

```typescript
// CryptoService encryption flow
const plaintext = "Student Name";
const encrypted = await crypto.encrypt(plaintext, derivedKey);
// Result: base64-encoded AES-256-GCM ciphertext (not reversible without key)
```

### Backup & Recovery
- **Backup**: Export encrypted database file (user can save to cloud)
- **Restore**: Import previously backed-up database
- **No transmission**: Backups are local files, never sent to server

### Trade-offs
**Pros:**
- Complete user privacy (no server sees data)
- Works without internet
- No GDPR/compliance issues with 3rd parties
- User retains full control

**Cons:**
- Synchronization complex (no central server)
- Backup discipline required (user must remember)
- Password recovery difficult (no "forgot password" option)
- Platform-specific storage implementations needed

### How This Supports agents.md
- Agent C (Security) owns encryption implementation
- Passwords managed with bcrypt hashing
- Sessions timeout for inactive users
- Database deletions are secure (overwrite + delete)

---

## 3. Plugin System for Extensibility

### Decision
Implement a plugin registry where assessment types, tools, exporters, and integrations are optional plugins.

### Plugin Types (from Plan.md)

#### 1. AssessmentType Plugin
Defines how grades are calculated and stored.

```typescript
interface AssessmentTypePlugin extends Plugin {
  name: 'criteria' | 'time' | 'cooper' | 'sportabzeichen' | ...;
  
  // Calculate grade from measurements
  calculateGrade(input: AssessmentInput): Grade;
  
  // Render UI for data entry
  renderEntry(student: Student): VNode;
}
```

**Examples:**
- Criteria-based: 8 criteria with weights → composite grade
- Time-based: Time → linear interpolation → grade
- Cooper: Distance → table lookup → grade

#### 2. ToolPlugin
Live classroom tools that don't generate grades.

```typescript
interface ToolPlugin extends Plugin {
  name: 'timer' | 'scoreboard' | 'tactic-board' | ...;
  
  // Render tool UI
  render(): VNode;
  
  // Handle tool-specific actions
  onAction(action: string, payload: any): void;
}
```

**Examples:**
- Timer: Countdown/stopwatch with audio signals
- Scoreboard: Display team scores
- Tactic board: Draw formations

#### 3. ExporterPlugin
Generate output formats (PDF, CSV, email).

```typescript
interface ExporterPlugin extends Plugin {
  name: 'pdf' | 'csv' | 'email' | ...;
  
  // Generate export
  export(data: ExportPayload): Promise<Uint8Array | string>;
  
  // Describe output format
  mimeType: string;
}
```

**Examples:**
- PDF: Rückmeldebogen with 4 layouts
- CSV: Grade table for import into grade apps
- Email: Send feedback sheets to parents

#### 4. IntegrationPlugin
Connect to external systems (WebUntis, grade apps).

```typescript
interface IntegrationPlugin extends Plugin {
  name: 'webuntis' | 'grade-app' | 'nextcloud' | ...;
  
  // Authenticate if needed
  authenticate(credentials: any): Promise<void>;
  
  // Perform integration task
  execute(action: string, payload: any): Promise<any>;
  
  // Enable/disable at runtime
  isOnline(): boolean;
}
```

**Examples:**
- WebUntis: Import student lists from school system
- Grade App: Export grades in native format
- Sync: Share exam templates between teachers

### Registry Implementation

```typescript
// Usage: Register and discover plugins
const registry = new PluginRegistry();

// Register built-in plugins
registry.register(new CriteriasAssessmentPlugin());
registry.register(new TimerToolPlugin());
registry.register(new PDFExporterPlugin());

// Query plugins by type
const assessmentPlugins = registry.getByType('assessment');
const toolPlugins = registry.getByType('tool');
```

### When to Use Plugins vs. Core
| Feature | Plugin | Core |
|---|---|---|
| Core domain models | ❌ | ✅ |
| Grading calculation method | ✅ | ❌ |
| Storage adapters | ❌ | ✅ (registry agnostic) |
| PDF export format | ✅ | ❌ |
| WebUntis integration | ✅ | ❌ |
| Exam builder logic | ❌ | ✅ (core KURT) |
| Timer tool | ✅ | ❌ |

### Trade-offs
**Pros:**
- Add new features without changing core
- Disable features without removing code
- Clear contracts between components
- Easy to test plugins in isolation
- Supports multi-agent development

**Cons:**
- More boilerplate than direct implementation
- Plugin discovery needs documentation
- Version compatibility between plugin and core

### How This Supports agents.md
- Agent B defines plugin contracts
- Agent D implements assessment plugins
- Agent G implements exporters
- Agent H implements integrations

---

## 4. Clean Architecture + Domain-Driven Design

### Layering Strategy

#### Layer 1: Domain (Core Types)
```
packages/core/src/interfaces/*.types.ts
```
- Entity definitions (ClassGroup, Student, Lesson, etc.)
- Value objects (Grade, Time, etc.)
- Domain rules (validation, calculations)
- **No dependencies**: Pure TypeScript

**Examples:**
```typescript
// Domain entity
interface ClassGroup {
  id: string;
  name: string;
  school_year: string;
  grade_level: number;
  created_at: Date;
}

// Domain rule: validation
function isValidClassGroup(group: Partial<ClassGroup>): ValidationResult {
  if (!group.name || group.name.length < 2) {
    return { valid: false, errors: ['Name must be at least 2 characters'] };
  }
  return { valid: true };
}
```

#### Layer 2: Application (Use Cases)
```
modules/sport/src/use-cases/*.use-case.ts
```
- Coordinate domain and repository
- Apply business rules
- Handle transactions
- **Depends on:** Domain types, repositories

**Examples:**
```typescript
// Use case: CreateClassUseCase
export class CreateClassUseCase {
  constructor(private repo: ClassGroupRepository) {}
  
  async execute(input: CreateClassInput): Promise<ClassGroup> {
    // Validate
    const validation = isValidClassGroup(input);
    if (!validation.valid) throw new ValidationError(...);
    
    // Check duplicates
    const existing = await this.repo.findByName(input.name);
    if (existing) throw new DuplicateError(...);
    
    // Create and persist
    return await this.repo.create(input);
  }
}
```

#### Layer 3: Repository (Persistence)
```
modules/sport/src/repositories/*.repository.ts
```
- Abstract database operations
- Implement CRUD with adapters
- Support queries
- **Depends on:** Domain types, storage adapter

**Examples:**
```typescript
// Repository: ClassGroupRepository
export class ClassGroupRepository extends BaseRepository<ClassGroup> {
  constructor(adapter: StorageAdapter) {
    super(adapter, 'class_groups');
  }
  
  async findByName(name: string): Promise<ClassGroup | null> {
    return this.findOne((row) => row.name === name);
  }
}
```

#### Layer 4: UI/Integration (Apps)
```
apps/teacher-ui/src/screens/*
apps/teacher-ui/src/components/*
```
- Present domain via user interfaces
- Dispatch use cases
- Handle user input
- **Depends on:** Use cases, domain types

**Examples:**
```typescript
// Vue component: ClassList.vue
<script>
export default {
  setup() {
    const classes = ref([]);
    const createClassUseCase = inject('createClassUseCase');
    
    async function createClass(name: string) {
      try {
        const newClass = await createClassUseCase.execute({ name });
        classes.value.push(newClass);
      } catch (error) {
        showError(error.message);
      }
    }
    
    return { classes, createClass };
  }
}
</script>
```

### Dependency Flow
```
UI → Use Cases → Repositories → Domain Types
  ↓     ↓          ↓
  └─────┴──────────┘ ← CryptoService (shared)
```

### Trade-offs
**Pros:**
- **Testability**: Each layer tested independently
- **Reusability**: Same use case works for CLI, web, mobile
- **Maintainability**: Changes isolated to layer
- **Domain clarity**: Business logic in domain, not views

**Cons:**
- **More files**: Separate use case for each operation
- **Ceremony**: Repository for each entity type
- **Learning curve**: Team must understand pattern

### How This Supports agents.md
- Domain types (Agent A) define "what" is stored
- Use cases (Agents D-H) define "how" operations work
- Repositories (Agents B, C) abstract storage details
- UI (Agents D-H) presents data to users

---

## 5. UI Framework Selection (DECIDED: Vue 3 Web-Only)

**Decision:** Vue 3 in `apps/teacher-ui`, built as static web assets for iPadOS Safari.

**Non-options:** React Native, Flutter, and Electron are out of scope under current constraints.

**Rationale:**
1. Matches the no-install, web-only deployment requirement
2. Existing scaffold accelerates delivery
3. Offline-first works with IndexedDB in Safari
4. Keeps the architecture modular and TypeScript-first

---

## 6. Storage Adapter Pattern

### Decision
Abstract storage behind an adapter interface so SQLite and IndexedDB are swappable.

### Adapter Interface
```typescript
interface StorageAdapter {
  // Initialization
  initialize(password: string): Promise<void>;
  
  // CRUD operations
  create(table: string, data: Record<string, any>): Promise<any>;
  read(table: string, id: any): Promise<any | null>;
  update(table: string, id: any, data: Partial<any>): Promise<void>;
  delete(table: string, id: any): Promise<void>;
  
  // Queries
  query(table: string, where?: (row: any) => boolean): Promise<any[]>;
  
  // Transactions
  transaction(fn: () => Promise<void>): Promise<void>;
  
  // Backup/Restore
  backup(): Promise<Uint8Array>;
  restore(backup: Uint8Array): Promise<void>;
}
```

### Implementations Provided

#### SQLiteAdapter
```typescript
// Node.js CLI/demo
const adapter = new SQLiteAdapter({ filePath: 'app.db' });
await adapter.initialize('user-password');
```

#### IndexedDBAdapter
```typescript
// Browser and iPad Safari
const adapter = new IndexedDBAdapter({ dbName: 'viccoboard' });
await adapter.initialize('user-password');
```

### How Adapters Are Swapped
```typescript
// Single source: Storage class selects adapter
export class ViccoboardStorage {
  private adapter: StorageAdapter;
  
  static async create(config: StorageConfig): Promise<ViccoboardStorage> {
    let adapter: StorageAdapter;
    
    if (config.type === 'sqlite') {
      adapter = new SQLiteAdapter(config.options);
    } else if (config.type === 'indexeddb') {
      adapter = new IndexedDBAdapter(config.options);
    } else {
      throw new Error(`Unknown storage type: ${config.type}`);
    }
    
    await adapter.initialize(config.password);
    return new ViccoboardStorage(adapter);
  }
  
  private constructor(adapter: StorageAdapter) {
    this.adapter = adapter;
  }
}
```

### Trade-offs
**Pros:**
- Same code works for CLI (SQLite) and web (IndexedDB)
- Easy to test with in-memory adapter
- Can switch storage without application code changes
- Supports future adapters (SQLCipher, etc.)

**Cons:**
- Each adapter must implement full interface
- Some features may not be supported by all adapters
- Query API somewhat limited (no SQL)

### How This Supports agents.md
- Agent C (Security) owns adapter encryption
- Adapters tested independently
- Apps don't know which storage backend is used

---

## 7. Type Safety Strategy

### Decision
Use strict TypeScript everywhere. No `any` type allowed.

### Type Generation from Plan.md
All types in [packages/core/src/interfaces/](./packages/core/src/interfaces/) are derived from Plan.md.

**Example: SportZens Types**
```typescript
// From Plan.md §3: "Grading Scheme with categories..."
interface GradeScheme {
  id: string;
  name: string;
  description?: string;
  categories: GradeCategory[];
  created_at: Date;
}

interface GradeCategory {
  id: string;
  name: 'criteria' | 'time' | 'cooper' | 'sportabzeichen' | 'bjs' | 'verbal';
  scheme_id: string;
  weight?: number;
  // ... category-specific fields
}
```

### Benefit: Compile-Time Safety
```typescript
// ❌ This is a compile error:
const category: GradeCategory = {
  name: 'invalid-category'  // Error: Type '"invalid-category"' not assignable to type '...'
};

// ✅ This compiles:
const category: GradeCategory = {
  id: uuid(),
  name: 'criteria',
  scheme_id: 'scheme-123'
};
```

### No Data Validation Needed at Runtime
```typescript
// Because types are strict, API payloads can be validated once:
function validateInput(input: any): asserts input is CreateClassInput {
  if (typeof input.name !== 'string') {
    throw new Error('name must be string');
  }
  // ... other checks
}

// Inside use case:
validateInput(input);
// Now TypeScript knows input is CreateClassInput
const result = await repository.create(input); // Type-safe
```

### Trade-offs
**Pros:**
- Errors caught at compile time, not runtime
- IDE autocompletion works (no guessing)
- Refactoring safe (rename = find all usages)
- Code is self-documenting

**Cons:**
- More verbose than JavaScript
- Type annotations required
- Learning curve for less experienced developers

### How This Supports agents.md
- Type system is source of truth
- All features documented in types
- No "missing feature" surprises at runtime

---

## 8. Testing Strategy

### Unit Tests (Each Layer)

**Domain:**
```typescript
// test: isValidClassGroup
expect(isValidClassGroup({ name: 'A' })).toBeFalsy();
expect(isValidClassGroup({ name: 'Class 10a' })).toBeTruthy();
```

**Use Cases:**
```typescript
// test: CreateClassUseCase.execute
const useCase = new CreateClassUseCase(mockRepository);
const result = await useCase.execute({ name: 'Class 10a' });
expect(result.name).toBe('Class 10a');
```

**Repositories:**
```typescript
// test: ClassGroupRepository.create
const repo = new ClassGroupRepository(inMemoryAdapter);
const created = await repo.create({ name: 'Class 10a' });
expect(created.id).toBeDefined();
```

### Integration Tests
```typescript
// test: CreateClass → AddStudent → RecordAttendance workflow
const storage = await createTestStorage();
const classRepo = new ClassGroupRepository(storage.adapter);
const studentRepo = new StudentRepository(storage.adapter); // from @viccoboard/students
const attendanceRepo = new AttendanceRepository(storage.adapter);

const classGroup = await new CreateClassUseCase(classRepo).execute({ name: 'Class 10a' });
const student = await new AddStudentUseCase(studentRepo, classRepo).execute({ ... });
const record = await new RecordAttendanceUseCase(attendanceRepo).execute({ ... });

expect(record.class_id).toBe(classGroup.id);
expect(record.student_id).toBe(student.id);
```

### UI Tests (When Phase 2 Starts)
```typescript
// test: Can create class from UI
const wrapper = mount(ClassForm);
await wrapper.find('input[name="name"]').setValue('Class 10a');
await wrapper.find('button[type="submit"]').trigger('click');
expect(mockUseCase.execute).toHaveBeenCalledWith({ name: 'Class 10a' });
```

### Offline Tests (Critical for This App)
```typescript
// test: Works without network
const storage = new IndexedDBStorage();
await storage.initialize('password');

// Network connection lost
navigator.onLine = false;

// Should still work
const classes = await classRepo.findAll();
expect(classes.length).toBeGreaterThan(0);
```

### Trade-offs
**Pros:**
- Confidence in code changes
- Regression protection
- Fast feedback loop during development
- Documentation of expected behavior

**Cons:**
- Requires time to write
- Maintenance when code changes
- UI tests can be brittle

### How This Supports agents.md
- Agent I creates comprehensive test suite
- Tests verify feature completion
- Regression tests prevent feature loss

---

## 9. Data Model & Migrations

### Migration System
```typescript
// packages/storage/src/migrations/001_initial_schema_new.ts
export const migration = {
  version: 1,
  name: 'Initial schema with core entities',
  
  up(adapter: StorageAdapter) {
    // Create tables: teacher_accounts, class_groups, students, etc.
  },
  
  down(adapter: StorageAdapter) {
    // Drop tables if rolling back
  }
};
```

### Adding New Migrations
When Phase 3 adds grading:
```typescript
// 002_add_grading_schema.ts
export const migration = {
  version: 2,
  name: 'Add grading tables',
  
  up(adapter: StorageAdapter) {
    adapter.createTable('grade_schemes', {
      id: 'TEXT PRIMARY KEY',
      name: 'TEXT NOT NULL',
      // ...
    });
    
    adapter.createTable('grade_categories', {
      // ...
    });
  }
};
```

### Version Tracking
```typescript
// schema_version table tracks current version
// On app start: detect missing migrations and apply them
export async function runMigrations(adapter: StorageAdapter) {
  const currentVersion = await getSchemaVersion();
  const migrations = await loadAllMigrations();
  
  for (const mig of migrations) {
    if (mig.version > currentVersion) {
      await mig.up(adapter);
      await updateSchemaVersion(mig.version);
    }
  }
}
```

### Trade-offs
**Pros:**
- Schema evolution tracked
- Reproducible deployments
- Rollback capability (if needed)
- Team coordination on schema

**Cons:**
- Migration must handle schema changes
- Testing migrations needed
- Backward compatibility complex

---

## 10. Risks & Mitigation

### Risk 1: IndexedDB Storage Limits
**Risk:** 50MB quota on iPad Safari might not be enough.  
**Impact:** HIGH (app stops working when quota exceeded)  
**Mitigation:**
- Design data model for ~500 students (typical school class)
- Compress image attachments before storage
- Implement archival (old years exported and deleted)
- Monitor storage usage in UI

### Risk 2: Password Recovery
**Risk:** User forgets password → data unrecoverable.  
**Impact:** MEDIUM (data loss for that user)  
**Mitigation:**
- Backup before password change
- Document password management best practices
- Consider optional backup with trusted email (encrypted)

### Risk 3: Browser Storage Persistence
**Risk:** User clears Safari data → all local storage lost.  
**Impact:** MEDIUM (loss of current year's data)  
**Mitigation:**
- Regular backup reminders
- Warn before clearing data
- Auto-backup to export file

### Risk 4: PDF Generation Library
**Risk:** No good PDF library for web (avoid external API).  
**Impact:** HIGH (PDF feature broken)  
**Mitigation:**
- Evaluate pdfkit (Node.js) and jsPDF/pdfmake (browser)
- Start Phase 9 early (PDF is high priority)
- Plan for fallback (CSV export if PDF fails)

### Risk 5: Email Without Backend
**Risk:** Can't send email from browser (no SMTP from client).  
**Impact:** MEDIUM (email feature limited)  
**Mitigation:**
- Use `mailto:` with CSV/PDF attachment
- Plan for optional email service (Phase 10)
- Fallback: teacher copies data manually

### Risk 6: UI Scope Creep
**Risk:** Pressure to introduce non-web UI targets (Electron/React Native/Flutter) despite constraints.  
**Impact:** HIGH (breaks deployment model and modularity focus)  
**Mitigation:**
- Enforce web-only guardrails in docs and reviews
- Keep UI isolated in `apps/teacher-ui`
- Reject non-web PRs unless constraints are formally changed

### Risk 7: WOW Online Dependency
**Risk:** WOW feature requires online connection.  
**Impact:** MEDIUM (feature unusable offline)  
**Mitigation:**
- Design WOW as separate, optional module
- Local WOW mode (QR linking, no online needed)
- Backend sync as Phase 10+ enhancement

---

## 11. Deployment & Distribution

### Option A: Static Web (Recommended for Phase 2)
```bash
# Build Vue app
npm run build:ui
# Outputs: apps/teacher-ui/dist/

# Deploy to any static host:
# - GitHub Pages
# - Vercel
# - Netlify
# - School's own server
# - USB drive (offline/air-gapped)
```

**Advantages:**
- No server needed (Plan.md constraint)
- Can run offline on any device
- Deploy to private school network

### Non-Options (Out of Scope)
Electron and native mobile apps are not part of the deployment model.
All deployments must be static web assets.

### Version Management
- Semantic versioning: MAJOR.MINOR.PATCH
- Phase 1 → v0.1.0
- Phase 2 complete → v0.2.0
- Phase 3-6 complete → v1.0.0

---

## 12. Security Posture

### What's Encrypted
- ✅ All user data at rest (AES-256)
- ✅ Student names, grades, attendance
- ✅ Teacher accounts and credentials
- ✅ Exam answers and grading notes

### What's Not Encrypted (By Design)
- ❌ App UI/layout (public)
- ❌ User interface strings (translations)
- ❌ Application code (open source OK)

### Threat Model
| Threat | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Device stolen | MEDIUM | HIGH | App lock (PIN/biometric) |
| Password guessed | LOW | MEDIUM | bcrypt with strong salt |
| Data exported | MEDIUM | HIGH | Encryption + PIN |
| Backup file stolen | MEDIUM | MEDIUM | Encrypted backup, password-protected |
| Side-channel attack | LOW | LOW | Use proven crypto libraries |

### Compliance
- GDPR: Data encrypted, never transmitted, user controls export
- FERPA (US): Similar encryption approach
- GDPR Article 32: Encryption at rest, access controls, secure deletion
- No third-party data sharing (encrypted locally)

---

## 13. Known Limitations & Future Work

### Phase 2-6 (This Roadmap)
- ✅ No external dependencies (local-first)
- ✅ Encrypted storage
- ✅ Core features complete
- ⏳ UI complete
- ⏳ PDF rendering
- ⏳ Integrations

### Phase 7-12 (Future)
- Advanced statistics and analytics
- WOW workout platform
- WebUntis integration
- Mobile native app
- Advanced PDF customization
- Email integration
- Multi-teacher sharing

### Not In Scope (Ever)
- Real-time collaborative editing (requires backend)
- Learning management system (LMS) features
- Video conferencing integration
- Compliance tracking (FERPA automated checks)

---

## Conclusion

ViccoBoard architecture is designed for:
1. **Data Privacy**: Encrypted, local-first, offline-capable
2. **Teacher Agency**: No external services, full control
3. **Extensibility**: Plugin system for new features
4. **Reliability**: Type-safe, well-tested, clean architecture
5. **Deployability**: Static web assets, no server needed

This architecture validates successfully with the Phase 1 demo.

**Next Decision Point:** Phase 2-1 (UI Framework Choice)  
**Recommended Choice:** Vue 3 (web-first, scaffold exists)  
**Timeline:** Start Phase 2 implementation immediately after architecture review
