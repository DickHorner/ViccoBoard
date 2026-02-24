# CODE REVIEW - PRIORITY ACTION ITEMS

**⚠️ DO NOT MERGE TO PRODUCTION UNTIL CRITICAL ITEMS ARE RESOLVED**

Generated: February 5, 2026  
Total Findings: 19 (6 Critical, 7 Important, 6 Suggestions)

---

## 🚨 CRITICAL - FIX IMMEDIATELY (Blocks Release)

### 1. **Insecure Encryption (CryptoJS)**
- **File:** `packages/storage/src/crypto/crypto.service.ts`
- **Impact:** Student data (grades, names) can be decrypted by attackers
- **Action:** Replace CryptoJS with Web Crypto API + PBKDF2
- **Time:** 2-3 hours
- **Test:** Verify encryption with test vectors

### 2. **Fallback to Unencrypted Database**
- **File:** `packages/storage/src/storage.ts` (lines 50-61)
- **Impact:** Database stored as plaintext on disk; privacy violation
- **Action:** Hard-fail if SQLCipher unavailable; use IndexedDB for browser
- **Time:** 1-2 hours
- **Dependency:** Decide on Node variant (ship with @journeyapps/sqlcipher or dev-only)

### 3. **Fake "Secure" Storage (In-Memory Map)**
- **File:** `packages/storage/src/crypto/crypto.service.ts` (InMemorySecureStorage)
- **Impact:** Credentials visible in memory dumps
- **Action:** 
  - Rename to `SessionSecureStorage` (document as session-only)
  - Add 5-minute TTL + clear on expiry
  - Add warnings in comments
- **Time:** 1 hour

### 4. **SQL Injection in Storage Adapter**
- **File:** `packages/storage/src/adapters/sqlite.adapter.ts` (lines 70-100)
- **Impact:** Attackers could run arbitrary SQL if table names come from user input
- **Action:** 
  - Validate table names with regex: `/^[a-zA-Z_][a-zA-Z0-9_]*$/`
  - Escape identifiers with quotes: `"tableName"`
  - Test with payloads like `DROP TABLE; --`
- **Time:** 1-2 hours

### 5. **Unguarded JSON.parse() Crashes App**
- **File:** Multiple (useDatabase.ts, all mappers)
- **Impact:** Corrupted data in database crashes entire feature
- **Action:**
  - Create `safeJsonParse(json, defaultValue, context)` utility
  - Add logging + corruption tracking
  - Wrap ALL JSON.parse calls
  - Add tests with malformed JSON in database
- **Time:** 3-4 hours
- **Files to Update:** 10+ mapper functions

### 6. **No Input Validation Before Storage**
- **File:** `apps/teacher-ui/src/views/ExamBuilder.vue`
- **Impact:** Invalid data persisted; downstream errors on load
- **Action:**
  - Create `ExamValidator` class with `validateCreate()`
  - Check title length (max 500), description (max 5000)
  - Validate array lengths, enum values
  - Throw ValidationError with field details
  - Test with fuzz inputs (property-based testing)
- **Time:** 4-5 hours
- **Core Requirement:** Create validator for each entity (Exam, Student, GradeCategory, etc.)

---

## ⚠️ IMPORTANT - HIGH PRIORITY (Next Sprint)

### 7. **Monolithic useDatabase (566 lines)**
- **File:** `apps/teacher-ui/src/composables/useDatabase.ts`
- **Action:** Split into 5 composables (useDb, useExams, useCorrections, useClassGroups, useStudents)
- **Time:** 6-8 hours
- **Dependency:** Completes before component split

### 8. **Monolithic ExamBuilder (901 lines)**
- **File:** `apps/teacher-ui/src/views/ExamBuilder.vue`
- **Action:** Split into 6-7 child components + separate store
- **Time:** 8-10 hours
- **Requires:** useDatabase split first; add Pinia store for state

### 9. **Dexie Schema Duplication**
- **File:** `apps/teacher-ui/src/db/index.ts`
- **Action:** 
  - Remove schema duplication across versions
  - Create separate migration modules
  - Add migration handler tests
- **Time:** 2-3 hours

### 10. **Missing Error Boundaries**
- **Files:** All Vue components (ExamBuilder, Grading, etc.)
- **Action:**
  - Add root ErrorBoundary in App.vue
  - Add try-catch in saveExam, recordGrade, etc.
  - Show user-friendly error notifications
- **Time:** 4-5 hours
- **Test:** Simulate component errors

### 11. **No Pagination on Queries**
- **Files:** All repository findXxx() methods
- **Action:**
  - Add `limit: 1000` default to all queries
  - Add `offset` support
  - Throw error if limit > 10000
  - Test with 10k+ records
- **Time:** 3-4 hours

### 12. **Excessive `any` Type Casting**
- **Files:** 50+ matches across codebase
- **Action:**
  - Create type guards for enums (isValidGradeCategoryType, etc.)
  - Replace `as any` with type guards
  - Enable strict mode enforcement in CI
- **Time:** 6-8 hours

### 13. **No Retry Logic**
- **Files:** All database operations
- **Action:**
  - Create `RetryPolicy` class with exponential backoff
  - Wrap create/update/delete with `RetryPolicy.withRetry()`
  - Add max retry tests
- **Time:** 2-3 hours

---

## 💡 SUGGESTIONS (Backlog)

- Photo storage: Switch from Base64 to Blob (saves 33% space)
- useDatabase singleton pattern: Memoize SportBridge creation
- Import validation: Add CSV validator before persist
- Request deduplication: Prevent duplicate submissions
- Remove example console.log entries from production code

---

## 🎯 RECOMMENDED MERGE CRITERIA

**Do NOT merge PR if:**
- ❌ Any CRITICAL finding still open
- ❌ New code introduces `any` types or unsafe type casts
- ❌ New database code lacks JSON.parse error handling
- ❌ New components > 300 lines without split plan
- ❌ Database changes lack input validation

**Automatically merge IF:**
- ✅ All CRITICAL findings addressed or documented as out-of-scope
- ✅ New code has 80%+ test coverage
- ✅ Type safety: No new `any` types
- ✅ Error handling: All async operations wrapped with try-catch
- ✅ File sizes: Components < 300 lines, composables < 200 lines

---

## 📋 QUICK CHECKLIST FOR CODE REVIEW

Use this when reviewing PRs going forward:

```
[ ] No new SQL injection vectors (validate table/column names)
[ ] All JSON.parse() wrapped with error handling
[ ] Input validation before database storage
[ ] No new `any` types without type guard
[ ] Error handling on all async operations
[ ] Component < 300 lines; composable < 200 lines
[ ] Tests added for new logic (80%+ coverage)
[ ] No unguarded database queries (pagination limits)
[ ] No plaintext secrets in code or logs
[ ] Type safety: Strict mode enabled, type guards used
```

---

## 🔗 SEE ALSO

- Full findings: [CODE_REVIEW_FINDINGS.md](CODE_REVIEW_FINDINGS.md)
- Architecture decisions: [ARCHITECTURE_DECISIONS.md](ARCHITECTURE_DECISIONS.md)
- Development guide: [DEVELOPMENT.md](DEVELOPMENT.md)
