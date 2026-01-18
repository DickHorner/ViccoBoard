# ViccoBoard Copilot Instructions

This repository contains ViccoBoard, a unified teacher application combining SportZens (physical education management) and KURT (exam creation and grading) into a single TypeScript monorepo.

## Project Structure

This is an npm workspaces monorepo with three main directories:
- `packages/` - Core shared packages (core types, plugins, storage)
- `modules/` - Domain-specific modules (sport, exams)
- `apps/` - Applications (demo, teacher-ui; wow-web planned)

## Architecture Principles

1. **Clean Architecture + Domain-Driven Design**: Core knows only interfaces, never implementations. Each module is self-contained.
2. **Local-First/Offline-First**: All core functionality works without network. Data stays local with encrypted storage.
3. **Modular Plugin System**: New features can be added as plugins without changing core code.
4. **iPadOS Safari-first**: Target browser environment with IndexedDB for production; SQLite adapter for Node/testing only.

## Code Style and Conventions

### TypeScript Standards
- Always use strict mode (`"strict": true`)
- Explicitly specify return types for all functions
- Prefer interfaces over type aliases for object shapes
- Use async/await instead of raw promises
- Always handle errors explicitly

### Naming Conventions
- **Files**: kebab-case (e.g., `class-group.repository.ts`, `create-class.use-case.ts`)
- **Classes**: PascalCase (e.g., `ClassGroupRepository`, `CreateClassUseCase`)
- **Interfaces**: PascalCase (e.g., `ClassGroup`, `ToolPlugin`)
- **Functions/Methods**: camelCase (e.g., `findBySchoolYear`, `initialize`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_TIMEOUT`, `MAX_STUDENTS`)

### Code Organization in Files
1. Imports (grouped: external libraries, internal packages, types)
2. Types and interfaces
3. Constants
4. Class/function implementation (private fields, constructor, public methods, private methods)
5. Exports

### Storage Notes
- Default target is **IndexedDB** for browser/runtime (encrypted storage with migrations)
- SQLite adapter is Node-only for local development and demos
- iPadOS Safari can evict local storage after inactivity: always surface backup status/reminders
- Support export/import via download + file picker (no File System Access API)

## Building and Testing

### Build Commands
```bash
# Build all packages
npm run build

# Build and run demo
npm run demo

# Install all dependencies
npm install --workspaces
```

### Testing
- Test files use `.test.ts` extension
- Located in `tests/` directories within each package/module
- Run tests with `npm test` (when configured)
- Always create tests for new use cases and repositories

## Package Development

### Creating a New Package
1. Create directory structure: `packages/my-package/src`
2. Add `package.json` with `@viccoboard/` namespace
3. Add `tsconfig.json` extending root config
4. Define exports in `src/index.ts`
5. Build with `npm run build`

### Creating a New Module
1. Create in `modules/` directory
2. Add dependencies on `@viccoboard/core` and `@viccoboard/storage`
3. Organize as: `src/{use-cases,repositories,plugins}`
4. Implement domain-specific logic following Clean Architecture

### Implementing Repositories
- Extend `BaseRepository<T>` from `@viccoboard/storage`
- Implement `mapToEntity()` and `mapToRow()` methods
- Use snake_case for database column names, camelCase for TypeScript properties
- Add domain-specific query methods

### Implementing Use Cases
- Pure business logic, no infrastructure concerns
- Accept repositories via constructor dependency injection
- Validate inputs and throw clear error messages
- Return domain entities, not database rows

### Implementing Plugins
- Implement appropriate plugin interface from `@viccoboard/core`
- Follow plugin contract strictly (id, name, version, enabled, type)
- Register with PluginRegistry
- Keep plugins stateless when possible

## Important Files to Review

- `README.md` - Project overview and feature list
- `DEVELOPMENT.md` - Detailed development workflow
- `ARCHITECTURE_DECISIONS.md` - Key architectural decisions and rationale
- `Plan.md` - Complete feature specification
- `agents.md` - Agent roles and responsibilities (for AI development)

## Security Considerations

- Always encrypt sensitive data before storage
- Support app lock (PIN/Password/Biometric)
- Never commit secrets or sensitive data
- Implement session timeout for security
- Support encrypted backup/restore

## Feature Completeness

All features from both SportZens and KURT must be implemented. No features should be left behind. Refer to `Plan.md` for the complete feature list.

## Dependencies

When adding new dependencies:
- Prefer existing libraries over new ones
- Only add new libraries if absolutely necessary
- Ensure compatibility with browser environments (especially Safari)
- Check for TypeScript type definitions
