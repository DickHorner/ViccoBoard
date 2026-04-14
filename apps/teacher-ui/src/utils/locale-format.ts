const GERMAN_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
}

const GERMAN_DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
}

const GERMAN_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
}

const GERMAN_DATE_FORMATTER = new Intl.DateTimeFormat('de-DE', GERMAN_DATE_OPTIONS)
const GERMAN_DATE_TIME_FORMATTER = new Intl.DateTimeFormat('de-DE', GERMAN_DATE_TIME_OPTIONS)
const GERMAN_TIME_FORMATTER = new Intl.DateTimeFormat('de-DE', GERMAN_TIME_OPTIONS)

const GERMAN_DATE_ONLY_UTC_FORMATTER = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC'
})

function isDateOnlyString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function toDate(value: Date | string): Date {
  if (value instanceof Date) {
    return value
  }

  if (isDateOnlyString(value)) {
    return new Date(`${value}T00:00:00.000Z`)
  }

  return new Date(value)
}

export function formatGermanDate(
  value: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = toDate(value)
  if (isDateOnlyString(typeof value === 'string' ? value : '')) {
    return GERMAN_DATE_ONLY_UTC_FORMATTER.format(date)
  }
  if (!options) {
    return GERMAN_DATE_FORMATTER.format(date)
  }
  return new Intl.DateTimeFormat('de-DE', { ...GERMAN_DATE_OPTIONS, ...options }).format(date)
}

export function formatGermanDateTime(
  value: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = toDate(value)
  if (!options) {
    return GERMAN_DATE_TIME_FORMATTER.format(date)
  }
  return new Intl.DateTimeFormat('de-DE', { ...GERMAN_DATE_TIME_OPTIONS, ...options }).format(date)
}

export function formatGermanTime(
  value: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = toDate(value)
  if (!options) {
    return GERMAN_TIME_FORMATTER.format(date)
  }
  return new Intl.DateTimeFormat('de-DE', { ...GERMAN_TIME_OPTIONS, ...options }).format(date)
}

export function formatGermanDateOfBirth(value: string | null | undefined): string {
  if (!value) {
    return ''
  }

  return formatGermanDate(value)
}
