import type { StudentGender } from '../interfaces/core.types.js';

const DATE_ONLY_PATTERN = /^\d{2}\.\d{2}\.\d{4}$/;

export function parseDateOnlyString(value: string): Date | null {
  if (!DATE_ONLY_PATTERN.test(value)) {
    return null;
  }

  const [day, month, year] = value.split('.').map((part) => Number.parseInt(part, 10));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

export function isValidDateOnlyString(value: string): boolean {
  return parseDateOnlyString(value) !== null;
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
  if (!dateOfBirth) {
    return null;
  }

  const birthDate = parseDateOnlyString(dateOfBirth);
  if (!birthDate) {
    return null;
  }

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

  return Number.parseInt(dateOfBirth.slice(6, 10), 10);
}
