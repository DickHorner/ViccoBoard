# Security & Code Quality Checklist

**For use in PR reviews and development**

Updated: February 5, 2026

---

## 🔐 Security Checklist

### Encryption & Cryptography
- [ ] No CryptoJS usage (use Web Crypto API instead)
- [ ] All password hashing uses bcryptjs with 10+ rounds
- [ ] No plaintext storage of passwords, tokens, or keys
- [ ] Encryption keys derived with PBKDF2 (100k+ iterations) or Web Crypto key derivation
- [ ] IV/nonce generated for each encryption operation
- [ ] Database fallback explicitly fails if encryption unavailable

### Storage & Data Persistence
- [ ] All JSON.parse() calls wrapped in try-catch with error logging
- [ ] Input validation before storing to database
- [ ] Entity validators created for all CRUD operations
- [ ] String lengths bounded (title max 500, description max 5000)
- [ ] No circular references in JSON serialization
- [ ] Pagination enforced (limit ≤ 1000, default 100)

### SQL Injection Prevention
- [ ] Table names validated: `/^[a-zA-Z_][a-zA-Z0-9_]*$/`
- [ ] Column names escaped: `"columnName"`
- [ ] All user input parameterized in WHERE clauses
- [ ] No string concatenation in SQL queries
- [ ] SQLite PRAGMA statements reviewed for security

### Session & Authentication
- [ ] Session tokens have explicit TTL (max 5 minutes)
- [ ] Secure storage implementation clears expired tokens
- [ ] No credentials logged to console
- [ ] No credentials passed in query strings or URL fragments
- [ ] User data (grades, attendance) never exposed in error messages

### Privacy & Data Protection
- [ ] No telemetry or tracking without explicit opt-in
- [ ] Backup/export data can be encrypted
- [ ] Deleted records actually removed from storage (no soft deletes)
- [ ] Student photos stored as Blob, not Base64
- [ ] Sensitive calculations stay offline

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Every use case has tests
- [ ] Every repository has repository tests
- [ ] Mock data doesn't use real student data
- [ ] Error paths tested (invalid input, missing IDs)
- [ ] Edge cases tested (0, negative, max value, empty array)

### Integration Tests
- [ ] Database migrations run successfully
- [ ] Data serialization/deserialization round-trips correctly
- [ ] Grade calculations produce expected results
- [ ] Duplicate prevention works (no duplicate classes/exams)

### Security Tests
- [ ] JSON.parse with malformed data doesn't crash
- [ ] SQL injection payloads are properly escaped
- [ ] Encryption/decryption round-trips match
- [ ] Unauthorized access returns clear errors
- [ ] Rate limiting / attempt limits work

### E2E/UI Tests (Vue)
- [ ] Error boundaries catch component errors
- [ ] User sees friendly error message on failure
- [ ] Validation messages appear for invalid input
- [ ] Network failure dialog appears gracefully
- [ ] Offline detection and warning works

---

## 📐 Code Quality Checklist

### TypeScript & Types
- [ ] No `any` type usage (use `unknown` with type guards instead)
- [ ] All function return types explicit
- [ ] Type guards created for runtime validation
- [ ] Strict mode enabled (`"strict": true`)
- [ ] No `@ts-ignore` comments without explanation

### File Size & Modularity
- [ ] Vue components ≤ 300 lines
- [ ] Composables ≤ 200 lines
- [ ] Services ≤ 400 lines
- [ ] Single responsibility enforced
- [ ] Related tests co-located with code

### Error Handling
- [ ] All async operations wrapped in try-catch
- [ ] Error details logged for debugging
- [ ] User-friendly error messages shown in UI
- [ ] Validation errors have field-level details
- [ ] Database errors caught and not exposed to users

### Performance
- [ ] No N+1 queries (fetch all at once or paginate)
- [ ] Expensive computations memoized or cached
- [ ] Database indexes created for frequent queries
- [ ] Lazy loading for large components
- [ ] No console.log() in production paths

### Dependencies
- [ ] No heavy third-party crypto libraries
- [ ] Browser APIs compatible with Safari/WebKit
- [ ] No File System Access API usage
- [ ] Offline-first verified (no required network calls)
- [ ] All dependencies have security reviews in PR

---

## 🚫 Antipatterns to Avoid

### Security Red Flags
```typescript
// ❌ BAD
db.pragma(`key = '${password}'`);  // SQL injection
JSON.parse(data);                   // No error handling
new CryptoJS.AES.encrypt(data);    // Unsafe library
localStorage.setItem('token', jwt); // Exposed in dev tools
```

### Code Quality Red Flags
```typescript
// ❌ BAD
const bridge: any = ...;           // any type bypass
function saveAll() {...} // 500+ lines; unclear responsibility
export function useStuff() {       // Side effects in composable
  const state = ref({...big object...});
}
```

### Architecture Red Flags
```typescript
// ❌ BAD
// In ExamBuilder.vue
const saveExam = async () => {
  try {
    await exams.add(examData);    // No validation before save
  } catch {
    // Silent failure
  }
};

// In repository
async find(id) {
  const data = db.prepare(`SELECT * FROM ${table}`).all();  // No limit
  return data.map(r => JSON.parse(r.config));              // No error handling
}
```

---

## ✨ Best Practices to Follow

### Security
```typescript
// ✅ GOOD
import { encrypt, decrypt, deriveKey } from '@/crypto/safe-crypto';

async function encryptData(plaintext: string, password: string) {
  const key = await deriveKey(password);
  const encrypted = await encrypt(plaintext, key);
  return encrypted;
}

// Safe storage
export class SessionStorage implements SecureStorage {
  private storage = new Map<string, { value: string; expires: number }>();
  private readonly TTL = 5 * 60_000; // 5 minutes
  
  async set(key: string, value: string) {
    this.storage.set(key, { value, expires: Date.now() + this.TTL });
  }

  async get(key: string) {
    const entry = this.storage.get(key);
    if (!entry || Date.now() > entry.expires) {
      this.storage.delete(key);
      return null;
    }
    return entry.value;
  }
}
```

### Type Safety
```typescript
// ✅ GOOD
type GradeCategoryType = 'criteria' | 'time' | 'cooper' | 'Sportabzeichen';

function isValidGradeCategoryType(value: unknown): value is GradeCategoryType {
  return ['criteria', 'time', 'cooper', 'Sportabzeichen'].includes(value as string);
}

function mapToEntity(row: unknown): GradeCategory {
  if (!row || typeof row !== 'object') throw new Error('Invalid row');
  const typed = row as Record<string, unknown>;
  
  if (!isValidGradeCategoryType(typed.type)) {
    throw new Error(`Invalid type: ${typed.type}`);
  }

  return {
    // ...
    type: typed.type,
    // ...
  };
}
```

### Error Handling
```typescript
// ✅ GOOD
function safeJsonParse<T>(
  json: string,
  defaultValue: T,
  context: string
): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    logError(`JSON parse failed in ${context}`, { json, error });
    // Maybe report to monitoring
    return defaultValue;
  }
}

async function loadExams() {
  try {
    const records = await db.exams.toArray();
    return records.map(r => mapRecordToExam(r));
  } catch (error) {
    showErrorNotification('Failed to load exams. Please refresh.');
    return [];
  }
}
```

### SQL Safety
```typescript
// ✅ GOOD
function validateTableName(name: string): void {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    throw new Error(`Invalid table name: ${name}`);
  }
}

function escapeIdentifier(name: string): string {
  validateTableName(name);
  return `"${name}"`; // SQL identifier quoting
}

async function getByClassGroup(classGroupId: string) {
  const sql = `SELECT * FROM "${this.tableName}" 
               WHERE "class_group_id" = ? 
               LIMIT ?`;
  return this.db.prepare(sql).all(classGroupId, 1000);
}
```

### Component Architecture
```typescript
// ✅ GOOD
// ExamBuilder.vue (< 150 lines)
<script setup lang="ts">
import { useExamForm } from '@/composables/useExamForm';
import { ExamDetailsSection } from '@/components/exam/ExamDetailsSection';
import { TasksBuilder } from '@/components/exam/TasksBuilder';

const { formData, errors, saveExam } = useExamForm();
</script>

// composables/useExamForm.ts (< 200 lines)
export function useExamForm() {
  const { form, errors } = useForm(ExamValidator.create);
  const { create } = useExams();

  const saveExam = async () => {
    const validated = form.validate();
    if (!validated) return;
    
    try {
      await RetryPolicy.withRetry(() => create(form.value));
      showSuccess('Exam saved');
    } catch (error) {
      // Handle error
    }
  };

  return { form, errors, saveExam };
}
```

---

## 🔄 Code Review Process

**When reviewing PRs:**

1. **Security First** — Check encryption, input validation, error handling
2. **Type Safety** — No `any` without type guards; enforce strict mode
3. **File Size** — Components < 300, composables < 200, services < 400 lines
4. **Testing** — Unit tests for logic; integration tests for data flow
5. **Error Handling** — All async wrapped; user-friendly errors
6. **Documentation** — Code comments explain WHY, not WHAT

**If ANY blocker found:**
- Request changes (do not approve)
- Link to relevant section of this checklist
- Provide specific refactoring suggestion

---

## 📊 Metrics to Track

**In CI/CD pipeline, enforce:**

```
✅ Test coverage ≥ 80% (new code)
✅ 0 TypeScript errors with strict mode
✅ 0 security vulnerabilities (per OWASP top 10)
✅ 0 new `any` types
✅ Max 300 lines per component / 200 per composable
✅ All JSON.parse() guarded with proper error handling
✅ All async operations caught and logged
```

---

## 🎓 Training & References

**For team onboarding:**
1. Read [CODE_REVIEW_FINDINGS.md](CODE_REVIEW_FINDINGS.md) - Understand why findings matter
2. Read [ARCHITECTURE_DECISIONS.md](ARCHITECTURE_DECISIONS.md) - System design rationale
3. Read [DEVELOPMENT.md](DEVELOPMENT.md) - Development workflow
4. Review [agents.md](agents.md#1-globale-arbeitsregeln) - Guardrails for AI agents

**For security deep-dives:**
1. OWASP Top 10 (Web, Mobile)
2. MDN Web Crypto API docs
3. NIST Cryptographic Standards

---

Generated: 2026-02-05  
Last Updated: 2026-02-05
