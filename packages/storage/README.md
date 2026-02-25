# @viccoboard/storage

Storage implementations for ViccoBoard. The browser-first runtime targets **IndexedDB** (encrypted options planned) and includes an `IndexedDBStorage` adapter. A Node-focused **SQLite** adapter (`SQLiteStorage`) is provided for local CLI demos and testing (SQLCipher-ready).

## Features

- ✅ Encrypted local database storage (SQLCipher support)
- ✅ Password hashing and verification (bcrypt)
- ✅ AES encryption for sensitive data
- ✅ Migration system for schema updates
- ✅ Base repository with CRUD operations
- ✅ Transaction support
- ✅ Secure key management

## Installation

```bash
npm install @viccoboard/storage
```

## Usage

### Initialize Storage

```typescript
import { SQLiteStorage, InitialSchemaMigration, cryptoService } from '@viccoboard/storage';

// Create storage instance
const storage = new SQLiteStorage({
  databasePath: './data/viccoboard.db',
  verbose: false
});

// Initialize with password
await storage.initialize('your-secure-password');

// Register and run migrations
storage.registerMigration(new InitialSchemaMigration(storage));
await storage.migrate();
```

### Crypto Service

```typescript
// Hash a password
const hash = await cryptoService.hashPassword('mypassword');

// Verify password
const isValid = await cryptoService.verifyPassword('mypassword', hash);

// Encrypt data
const encrypted = await cryptoService.encrypt('sensitive data', 'encryption-key');

// Decrypt data
const decrypted = await cryptoService.decrypt(encrypted, 'encryption-key');

// Generate secure token
const token = await cryptoService.generateToken(32);
```

### Using Domain Repositories (Preferred)

Student management and other domain repositories live in their respective modules
(e.g., `@viccoboard/students`). The storage package provides adapters and base
infrastructure only.

```typescript
import { SQLiteStorage } from '@viccoboard/storage';
import { StudentRepository } from '@viccoboard/students';

const storage = new SQLiteStorage({ databasePath: './data/viccoboard.db' });
await storage.initialize('your-secure-password');

const studentRepo = new StudentRepository(storage.getAdapter());
const classStudents = await studentRepo.findByClassGroup('class-123');
```

### Transactions

```typescript
await storage.transaction(async () => {
  // All operations within this block are executed in a transaction
  const class1 = await classRepo.create({ name: 'Class A', schoolYear: '2023/2024' });
  const student1 = await studentRepo.create({
    firstName: 'Jane',
    lastName: 'Smith',
    classGroupId: class1.id
  });
  
  // If any operation fails, all changes are rolled back
});
```

## Security Considerations

### For Development
The current implementation uses `better-sqlite3` which does not include SQLCipher by default. Database encryption is optional.

### For Production
Use `@journeyapps/sqlcipher` or similar for full database encryption support:

```bash
npm install @journeyapps/sqlcipher
```

Then update the import in `storage.ts`:
```typescript
import Database from '@journeyapps/sqlcipher';
```

### Secure Storage
The `InMemorySecureStorage` implementation is for development only. In production, use:
- **iOS**: Keychain Services
- **Android**: Android Keystore System
- **Desktop**: OS-specific credential managers

## Database Schema

The initial migration creates the following core tables:
- `teacher_accounts` - User authentication and security settings
- `class_groups` - Class/course information
- `students` - Student profiles
- `lessons` - Lesson records
- `lesson_parts` - Lesson components
- `attendance_records` - Attendance tracking
- `backups` - Backup metadata
- `templates` - Template storage

## Migrations

Migrations are automatically applied in version order. To create a new migration:

```typescript
import { Migration } from '@viccoboard/core';

export class MyMigration implements Migration {
  version = 2;
  name = 'my_migration';
  
  constructor(private storage: SQLiteStorage) {}
  
  async up(): Promise<void> {
    const db = this.storage.getDatabase();
    // Apply schema changes
    db.exec(`ALTER TABLE students ADD COLUMN nickname TEXT`);
  }
  
  async down(): Promise<void> {
    const db = this.storage.getDatabase();
    // Revert schema changes
    db.exec(`ALTER TABLE students DROP COLUMN nickname`);
  }
}

// Register the migration
storage.registerMigration(new MyMigration(storage));
await storage.migrate();
```

## License

MIT

