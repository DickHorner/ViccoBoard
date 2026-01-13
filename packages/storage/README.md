# @viccoboard/storage

Encrypted local storage implementation for ViccoBoard using SQLite.

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

### Creating a Repository

```typescript
import { BaseRepository } from '@viccoboard/storage';
import { Student } from '@viccoboard/core';

class StudentRepository extends BaseRepository<Student> {
  constructor(storage: SQLiteStorage) {
    super(storage, 'students');
  }

  mapToEntity(row: any): Student {
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      birthYear: row.birth_year,
      gender: row.gender,
      photoUri: row.photo_uri,
      contactInfo: {
        email: row.email,
        parentEmail: row.parent_email,
        phone: row.phone
      },
      classGroupId: row.class_group_id,
      createdAt: new Date(row.created_at),
      lastModified: new Date(row.last_modified)
    };
  }

  mapToRow(entity: Partial<Student>): any {
    const row: any = {};
    
    if (entity.id) row.id = entity.id;
    if (entity.firstName) row.first_name = entity.firstName;
    if (entity.lastName) row.last_name = entity.lastName;
    if (entity.birthYear !== undefined) row.birth_year = entity.birthYear;
    if (entity.gender) row.gender = entity.gender;
    if (entity.photoUri) row.photo_uri = entity.photoUri;
    if (entity.contactInfo?.email) row.email = entity.contactInfo.email;
    if (entity.contactInfo?.parentEmail) row.parent_email = entity.contactInfo.parentEmail;
    if (entity.contactInfo?.phone) row.phone = entity.contactInfo.phone;
    if (entity.classGroupId) row.class_group_id = entity.classGroupId;
    if (entity.createdAt) row.created_at = entity.createdAt.toISOString();
    if (entity.lastModified) row.last_modified = entity.lastModified.toISOString();
    
    return row;
  }

  // Custom query methods
  async findByClassGroup(classGroupId: string): Promise<Student[]> {
    return this.find({ class_group_id: classGroupId });
  }
}

// Usage
const studentRepo = new StudentRepository(storage);

// Create a student
const student = await studentRepo.create({
  firstName: 'John',
  lastName: 'Doe',
  birthYear: 2010,
  gender: 'male',
  classGroupId: 'class-123'
});

// Find by ID
const found = await studentRepo.findById(student.id);

// Find by class
const classStudents = await studentRepo.findByClassGroup('class-123');

// Update
await studentRepo.update(student.id, {
  birthYear: 2011
});

// Delete
await studentRepo.delete(student.id);
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

UNLICENSED - Private project
