/**
 * Strict calendar-date validation.
 * Rejects ISO strings that don't represent a real calendar date (e.g. 1999-02-31).
 * No auto-correction.
 */
export function assertValidDate(value: string, fieldName: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${fieldName} must be in YYYY-MM-DD format`);
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(`${fieldName} is not a valid calendar date`);
  }
}
