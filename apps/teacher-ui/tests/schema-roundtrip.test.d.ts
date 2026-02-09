/**
 * Phase 4: SportZens Schema Roundtrip Tests
 *
 * Test Objectives:
 * 1. Verify all 8 in-scope schemas can be exported/imported without data loss
 * 2. Verify field names match SportZens APK exactly (snake_case preservation)
 * 3. Verify optional fields are preserved
 * 4. Verify WOW schema is excluded (no tests for wow.schema.json)
 *
 * In-Scope Schemas:
 * 1. class.schema.json → ClassGroup
 * 2. student.schema.json → Student
 * 3. category.schema.json → GradeCategory
 * 4. grade.schema.json → GradeEntry
 * 5. table.schema.json → GradingTable
 * 6. gradeWeighting.schema.json → GradeWeighting
 * 7. userData.schema.json → AppUser
 * 8. newDayData.schema.json → SportsLesson
 *
 * Out-of-Scope:
 * - wow.schema.json (excluded_by_scope_v2)
 */
/**
 * Manual Test Plan (for Phase 4 GATE validation)
 *
 * 1. Run: npm test -- --run schema-roundtrip.test.ts
 * 2. Verify all 8 schemas pass roundtrip tests
 * 3. Update PARITY_MATRIX.csv:
 *    - Mark schema_field items as implemented=yes where tests pass
 *    - Add test locations
 * 4. Verify build still passes: npm run build:ipad
 * 5. Mark GATE 4 as PASSED in evidence docs
 */
