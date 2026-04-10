import type { StudentGender } from '../interfaces/core.types.js';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateOnlyString(value: string): boolean {
  if (!DATE_ONLY_PATTERN.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.toISOString().slice(0, 10) === value;
}

export function normalizeStudentGender(value: string | undefined | null): StudentGender | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'm') {
    return 'm';
  }
  if (normalized === 'f' || normalized === 'w') {
    return 'f';
  }
  return undefined;
}

export function calculateAgeFromDateOfBirth(
  dateOfBirth: string | null | undefined,
  referenceDate: Date = new Date()
): number | null {
  if (!dateOfBirth || !isValidDateOnlyString(dateOfBirth)) {
    return null;
  }

  const birthDate = new Date(`${dateOfBirth}T00:00:00.000Z`);
  let age = referenceDate.getUTCFullYear() - birthDate.getUTCFullYear();
  const monthDelta = referenceDate.getUTCMonth() - birthDate.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && referenceDate.getUTCDate() < birthDate.getUTCDate())) {
    age -= 1;
  }

  return Math.max(0, age);
}

export function getBirthYearFromDateOfBirth(dateOfBirth: string | null | undefined): number | null {
  if (!dateOfBirth || !isValidDateOnlyString(dateOfBirth)) {
    return null;
  }

  return Number.parseInt(dateOfBirth.slice(0, 4), 10);
}
