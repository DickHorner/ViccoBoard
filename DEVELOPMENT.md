# ViccoBoard Development Guide

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- Git

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/DickHorner/ViccoBoard.git
cd ViccoBoard

# Install dependencies for all packages
npm install

# Build everything (packages + apps)
npm run build

# Build only the internal packages (core/modules/plugins/storage)
npm run build:packages

# Build the iPad app only (teacher UI)
npm run build:ipad

# Run tests (when available)
npm test
```

### App Start Scripts

```bash
# Teacher UI (iPad target) - dev server
cd apps/teacher-ui
npm run dev

# Teacher UI - production preview
npm run build
npm run preview

# Demo CLI app (optional)
cd apps/demo
npm run dev
```

## Project Structure

```
ViccoBoard/
├── packages/              # Shared packages
│   ├── core/             # Type definitions and interfaces
│   ├── plugins/          # Plugin registry
│   └── storage/          # Storage implementation
├── modules/              # Domain modules (to be created)
│   ├── sport/           # SportZens functionality
│   ├── exams/           # KURT functionality
│   ├── export/          # PDF/CSV exports
│   └── integrations/    # External integrations
├── apps/                 # Applications (to be created)
│   ├── teacher/         # Main teacher app
│   └── wow-web/         # WOW web interface
├── Plan.md              # Feature specification
├── agents.md            # Agent guidelines
├── README.md            # Project overview
└── STATUS.md            # Development status
```

## Development Workflow

### 1. Working with Packages

Each package is independent but can depend on other packages:

```bash
# Work in a specific package
cd packages/core
npm run build
npm test

# Link packages for development
npm link
cd ../plugins
npm link @viccoboard/core
```

### 2. Creating a New Package

```bash
# Create directory structure
mkdir -p packages/my-package/src
cd packages/my-package

# Create package.json
cat > package.json << EOF
{
  "name": "@viccoboard/my-package",
  "version": "0.1.0",
  "description": "Description",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "@viccoboard/core": "*"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
EOF

# Create tsconfig.json
cat > tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
EOF

# Create index file
echo "export const VERSION = '0.1.0';" > src/index.ts

# Build
npm install
npm run build
```

### 3. Creating a Module

Modules are domain-specific implementations:

```bash
# Create module structure
mkdir -p modules/my-module/src/{use-cases,repositories,plugins}
cd modules/my-module

# Similar package.json setup
# Add dependencies on @viccoboard/core, @viccoboard/storage, etc.
```

### 4. Implementing a Repository

Example: Class Group Repository

```typescript
// modules/sport/src/repositories/class-group.repository.ts
import { BaseRepository } from '@viccoboard/storage';
import { ClassGroup } from '@viccoboard/core';
import { SQLiteStorage } from '@viccoboard/storage';

export class ClassGroupRepository extends BaseRepository<ClassGroup> {
  constructor(storage: SQLiteStorage) {
    super(storage, 'class_groups');
  }

  mapToEntity(row: any): ClassGroup {
    return {
      id: row.id,
      name: row.name,
      schoolYear: row.school_year,
      state: row.state,
      holidayCalendarRef: row.holiday_calendar_ref,
      gradingScheme: row.grading_scheme,
      subjectProfile: row.subject_profile,
      createdAt: new Date(row.created_at),
      lastModified: new Date(row.last_modified)
    };
  }

  mapToRow(entity: Partial<ClassGroup>): any {
    const row: any = {};
    if (entity.id) row.id = entity.id;
    if (entity.name) row.name = entity.name;
    if (entity.schoolYear) row.school_year = entity.schoolYear;
    if (entity.state) row.state = entity.state;
    if (entity.holidayCalendarRef) row.holiday_calendar_ref = entity.holidayCalendarRef;
    if (entity.gradingScheme) row.grading_scheme = entity.gradingScheme;
    if (entity.subjectProfile) row.subject_profile = entity.subjectProfile;
    if (entity.createdAt) row.created_at = entity.createdAt.toISOString();
    if (entity.lastModified) row.last_modified = entity.lastModified.toISOString();
    return row;
  }

  async findBySchoolYear(schoolYear: string): Promise<ClassGroup[]> {
    return this.find({ school_year: schoolYear });
  }
}
```

### 5. Implementing a Use Case

Example: Create Class Use Case

```typescript
// modules/sport/src/use-cases/create-class.use-case.ts
import { ClassGroup } from '@viccoboard/core';
import { ClassGroupRepository } from '../repositories/class-group.repository';

export interface CreateClassInput {
  name: string;
  schoolYear: string;
  state?: string;
  gradingScheme?: string;
}

export class CreateClassUseCase {
  constructor(private classGroupRepo: ClassGroupRepository) {}

  async execute(input: CreateClassInput): Promise<ClassGroup> {
    // Validation
    if (!input.name || !input.schoolYear) {
      throw new Error('Name and school year are required');
    }

    // Business logic
    const classGroup = await this.classGroupRepo.create({
      name: input.name,
      schoolYear: input.schoolYear,
      state: input.state,
      gradingScheme: input.gradingScheme || 'default'
    });

    return classGroup;
  }
}
```

### 6. Implementing a Plugin

Example: Timer Tool Plugin

```typescript
// modules/sport/src/plugins/timer.plugin.ts
import { ToolPlugin, ToolConfig, ToolState, ToolAction, ToolActionResult } from '@viccoboard/core';

export class TimerPlugin implements ToolPlugin {
  id = 'timer';
  name = 'Timer';
  version = '1.0.0';
  description = 'Countdown, stopwatch, and interval timer';
  enabled = true;
  type = 'tool' as const;
  category = 'timer' as const;

  private state: any = {
    mode: 'stopwatch',
    running: false,
    elapsed: 0,
    startTime: null
  };

  initialize(config: ToolConfig): void {
    this.state = {
      ...this.state,
      ...config.parameters
    };
  }

  getState(): ToolState {
    return {
      timestamp: new Date(),
      data: this.state,
      logs: []
    };
  }

  setState(state: ToolState): void {
    this.state = state.data;
  }

  getUIComponent() {
    return {
      componentType: 'Timer',
      props: {
        mode: this.state.mode,
        elapsed: this.state.elapsed
      }
    };
  }

  handleAction(action: ToolAction): ToolActionResult {
    switch (action.type) {
      case 'start':
        this.state.running = true;
        this.state.startTime = Date.now();
        return { success: true };
      
      case 'stop':
        this.state.running = false;
        this.state.elapsed += Date.now() - this.state.startTime;
        return { success: true };
      
      case 'reset':
        this.state.elapsed = 0;
        this.state.running = false;
        return { success: true };
      
      default:
        return { success: false, error: 'Unknown action' };
    }
  }
}
```

## Testing

### Unit Tests

```typescript
// Example: class-group.repository.test.ts
import { SQLiteStorage } from '@viccoboard/storage';
import { ClassGroupRepository } from './class-group.repository';

describe('ClassGroupRepository', () => {
  let storage: SQLiteStorage;
  let repo: ClassGroupRepository;

  beforeEach(async () => {
    storage = new SQLiteStorage({
      databasePath: ':memory:',
      memory: true
    });
    await storage.initialize('test-password');
    // Run migrations
    repo = new ClassGroupRepository(storage);
  });

  afterEach(async () => {
    await storage.close();
  });

  test('creates a class group', async () => {
    const classGroup = await repo.create({
      name: 'Test Class',
      schoolYear: '2023/2024'
    });

    expect(classGroup.id).toBeDefined();
    expect(classGroup.name).toBe('Test Class');
    expect(classGroup.schoolYear).toBe('2023/2024');
  });

  test('finds by school year', async () => {
    await repo.create({ name: 'Class A', schoolYear: '2023/2024' });
    await repo.create({ name: 'Class B', schoolYear: '2023/2024' });
    await repo.create({ name: 'Class C', schoolYear: '2024/2025' });

    const classes = await repo.findBySchoolYear('2023/2024');
    expect(classes).toHaveLength(2);
  });
});
```

## Code Style

### TypeScript Guidelines

1. **Use strict mode**: All packages use `"strict": true`
2. **Explicit types**: Always specify return types for functions
3. **Interface over type**: Prefer interfaces for object shapes
4. **Async/await**: Use async/await instead of promises
5. **Error handling**: Always handle errors explicitly

### Naming Conventions

- **Files**: kebab-case (e.g., `class-group.repository.ts`)
- **Classes**: PascalCase (e.g., `ClassGroupRepository`)
- **Interfaces**: PascalCase (e.g., `ClassGroup`)
- **Functions**: camelCase (e.g., `findBySchoolYear`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_TIMEOUT`)

### Code Organization

```typescript
// 1. Imports (grouped by external, internal, types)
import { ClassGroup } from '@viccoboard/core';
import { BaseRepository } from '@viccoboard/storage';
import type { SQLiteStorage } from '@viccoboard/storage';

// 2. Types and interfaces
interface LocalType {
  // ...
}

// 3. Constants
const DEFAULT_VALUE = 42;

// 4. Class/function implementation
export class MyClass {
  // Private fields
  private field: string;
  
  // Constructor
  constructor(param: string) {
    this.field = param;
  }
  
  // Public methods
  public method(): void {
    // ...
  }
  
  // Private methods
  private helper(): void {
    // ...
  }
}

// 5. Exports
export { LocalType };
```

## Debugging

### Storage Notes

By default, ViccoBoard targets **IndexedDB** for browser/runtime storage (encrypted storage + migrations). For local CLI development and the demo runner we keep a SQLite adapter (Node-only). Add `IndexedDB` migrations and adapters under `packages/storage` and prefer them for web apps. iPadOS Safari can evict local storage after inactivity: always surface backup status/reminders and support export/import via download + file picker (no File System Access API).

### SQLite Database

```bash
# Install sqlite3 CLI
sqlite3 data/viccoboard.db

# Useful queries
.tables
.schema class_groups
SELECT * FROM class_groups;
```

### Logging

```typescript
// Add debug logging
const DEBUG = process.env.DEBUG === 'true';

if (DEBUG) {
  console.log('Debug info:', data);
}
```

## Common Tasks

### Adding a New Entity Type

1. Define type in `packages/core/src/interfaces/*.types.ts`
2. Create migration in `packages/storage/src/migrations/`
3. Create repository extending `BaseRepository`
4. Create use cases for business logic
5. Register with dependency injection (when implemented)

### Adding a New Plugin

1. Define plugin interface in core (if new type)
2. Implement plugin following interface
3. Register with `PluginRegistry`
4. Create UI component (if tool plugin)
5. Add tests

### Creating a New Screen (UI)

1. Define screen in app navigation
2. Create screen component
3. Connect to use cases/repositories
4. Add state management
5. Add navigation logic

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)

## Getting Help

1. Check [Plan.md](./Plan.md) for feature specifications
2. Check [agents.md](./agents.md) for development guidelines
3. Review [STATUS.md](./STATUS.md) for current progress
4. Read package READMEs for specific documentation

---

Happy coding! 🚀
