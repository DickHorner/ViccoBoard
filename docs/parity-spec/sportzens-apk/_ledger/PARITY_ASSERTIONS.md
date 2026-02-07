# SportZens APK Parity Assertions

**Version:** 1.0.0  
**Date:** 2026-02-07  
**Purpose:** Define how "100% functional and options parity" is measured

---

## 1. Definition of Parity

**Parity** means that ViccoBoard can perform all SportZens APK functions (excluding WOW) with:
1. **Data Equivalence:** Can store/retrieve all SportZens data fields
2. **Functional Equivalence:** Can perform all SportZens workflows end-to-end
3. **Options Equivalence:** All settings/configurations are available
4. **UI Equivalence:** All screens/flows are accessible (not visual pixel-match)

**Scope v2 Constraint:** WOW features are excluded, but data structures are preserved for future compatibility.

---

## 2. Parity Measurement by Item Type

### 2.1 i18n_key Parity

#### Definition
An i18n key is "implemented" when:
1. The key exists in the teacher-ui i18n loader
2. The key is used in at least one rendered component
3. The string is not hardcoded (uses i18n lookup)

#### Test Strategy
- **Static Analysis:** Grep all `.vue` components for i18n usage
- **Missing Key Test:** Load app → trigger all screens → assert no `⟦MISSING:key⟧` markers appear
- **Coverage Report:** Generate list of unused keys vs. parity spec

#### Exclusions
- WOW.* keys are excluded (scope v2)
- Keys with `excluded_by_scope_v2` in PARITY_MATRIX are allowed to be missing

---

### 2.2 schema_field Parity

#### Definition
A schema field is "implemented" when:
1. The field can be written to storage (create/update)
2. The field can be read from storage (query/retrieve)
3. **Roundtrip Test:** `write(obj) → read() → deepEqual(obj)` passes for field

#### Required vs. Optional Fields
- **Required fields:** MUST be implemented (PARITY_MATRIX `required=yes`)
- **Optional fields:** SHOULD be implemented; if not, must document reason in TBD

#### Test Strategy
- **Schema Contract Tests:** For each schema, write Jest test:
  ```typescript
  test('class schema roundtrip', async () => {
    const original = {
      id: 'cls1',
      name: 'Class 5A',
      school_year: '2023/2024',
      teacher_id: 't1',
      color: '#FF5733',
      grade_scheme: 'viertel16',
      settings: { foo: 'bar' },
      stats: { count: 42 }
    };
    await repo.create(original);
    const retrieved = await repo.findById('cls1');
    expect(retrieved).toEqual(original);
  });
  ```
- **Field-Level Assertions:** For each field in schema, assert it survives roundtrip
- **Export/Import Test:** Create object → export to JSON → import → deepEqual

#### Exclusions
- `wow.name`, `wow.wowtyp`, `wow.wowtimer`: excluded (scope v2)
- `gradeWeighting.wow`: field retained but set to 0 for v2

---

### 2.3 workflow Parity

#### Definition
A workflow is "implemented" when:
1. The user can navigate to the workflow entry point (route/button/menu)
2. The workflow can be completed end-to-end without errors
3. The workflow produces the expected data mutations (DB writes)
4. The workflow is testable (unit test for logic + integration test for flow)

#### Example: workflow=`class_create`
- **Entry Point:** "Add Class" button on Classes screen
- **Steps:** Fill form (name, school_year) → Submit → DB insert
- **Expected Mutations:** New row in `classes` table with all required fields
- **Test:** Integration test that simulates form submission and asserts DB state

#### Test Strategy
- **Happy Path Tests:** For each workflow, write 1+ test covering normal case
- **Edge Case Tests:** For critical workflows (grading, backup), test error paths
- **Manual Test Plan:** For UI-heavy workflows (tournaments, timer), document manual test steps

#### Exclusions
- `workflow=wow_create`, `workflow=wow_student_tracking`: excluded (scope v2)

---

### 2.4 route Parity

#### Definition
A route is "implemented" when:
1. The route is defined in `apps/teacher-ui/src/router/index.ts`
2. Navigating to the route renders a view (not 404)
3. The view is functional (not blank/placeholder)

#### Test Strategy
- **Route Registry Test:** Assert all in-scope routes exist in router config
- **Smoke Test:** For each route, navigate → assert no error boundary triggered
- **Offline Test:** Navigate to route with network disabled → assert renders

#### Exclusions
- `/wow`: excluded (scope v2)

---

## 3. Parity Gates (Pass/Fail Criteria)

### GATE 1: i18n String Parity
**Pass Condition:** All `in_scope_v2` i18n keys are loaded and no missing key markers appear in UI

**Test Command:**
```bash
npm run test:i18n-coverage
```

**Fail Example:**
- User opens Classes screen → sees `⟦MISSING:KLASSEN.title⟧`

---

### GATE 2: Schema Field Parity
**Pass Condition:** All required `in_scope_v2` schema fields pass roundtrip tests

**Test Command:**
```bash
npm run test:schemas
```

**Fail Example:**
- `class.color` field is written but returns `undefined` on read

---

### GATE 3: Workflow Parity
**Pass Condition:** All `in_scope_v2` workflows have at least 1 passing test

**Test Command:**
```bash
npm run test:workflows
```

**Fail Example:**
- `workflow=grade_cooper_entry` has no test coverage

---

### GATE 4: Route Parity
**Pass Condition:** All `in_scope_v2` routes render without errors

**Test Command:**
```bash
npm run test:routes
```

**Fail Example:**
- Navigating to `/tables` shows blank screen

---

## 4. Handling Ambiguities

### TBD Items
If a feature from SportZens APK is unclear or incomplete:
1. Add entry to `Plan.md §9 TBD`
2. Mark in PARITY_MATRIX as `implemented=no` + reason
3. Implement placeholder UI with clear error message (e.g., "Feature pending spec: see Plan.md §9.X")
4. **NEVER** silently omit a feature

### Example TBD Entry
```markdown
## Plan.md §9.3 TBD: Cooper Test Audio Cues

**Issue:** SportZens APK plays audio signals during Cooper test. Exact timing/format unclear.

**Workaround:** Implement visual timer only; mark audio as TBD in PARITY_MATRIX.

**Location:** `workflow=grade_cooper_entry` + i18n keys `COOPER.*`
```

---

## 5. Validation Strategy: Automated + Manual

### Automated Tests (CI)
- **Schema Roundtrip Tests:** Jest tests for all 8 in-scope schemas
- **i18n Coverage:** Script to detect unused/missing keys
- **Route Smoke Tests:** Playwright tests to navigate all routes
- **Build Tests:** `build:packages` + `build:ipad` must pass

### Manual Tests (Pre-Release)
- **Offline Cold Start:** Clear site data → reload → test core flow offline
- **iPad Safari:** Test on real iPadOS Safari or simulator
- **Export/Import:** Create data → export → clear → import → verify
- **Split View:** Test UI in ½ screen (iPad multitasking)

---

## 6. Reporting

### Per-Phase Reports
Each phase (3-8) generates a report in `_evidence/PHASE_X_REPORT.md` with:
- Parity items completed (PARITY_MATRIX rows `no → yes`)
- Tests added/passing
- Known issues/TBD items

### Final Report (Phase 10)
`_evidence/FINAL_RUN_REPORT.md` includes:
- Git commit hash
- Build output logs
- All test results
- PARITY_MATRIX summary (count of `implemented=yes` vs. `no`)
- **PARITY_GATE=PASS** only if restlist is empty

---

**END OF PARITY_ASSERTIONS.md**
