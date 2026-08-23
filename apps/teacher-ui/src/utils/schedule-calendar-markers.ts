type CalendarMarkerType = 'holiday' | 'school-break'

export interface ScheduleCalendarMarker {
  start: string
  end?: string
  label: string
  type: CalendarMarkerType
  states: string[]
}

export interface ResolvedScheduleCalendarMarker {
  label: string
  type: CalendarMarkerType
}

// Small local reference data for the first planning slice.
// Sources checked 2026-04-26:
// - Berlin.de: Feiertage & Schulferien, school years 2025/2026 and 2026/2027.
// - Berlin.de: Sonn- und Feiertagsrecht for Berlin public holiday set.
// - Brandenburg MBJS/service pages: school holidays through 2029/30.
// - Brandenburg FTG via BRAVORS for public holiday set.
const SCHEDULE_CALENDAR_MARKERS: ScheduleCalendarMarker[] = [
  { start: '2026-01-01', label: 'Neujahr', type: 'holiday', states: ['BE', 'BB'] },
  { start: '2026-03-08', label: 'Internationaler Frauentag', type: 'holiday', states: ['BE'] },
  { start: '2026-04-03', label: 'Karfreitag', type: 'holiday', states: ['BE', 'BB'] },
  { start: '2026-04-05', label: 'Ostersonntag', type: 'holiday', states: ['BB'] },
  { start: '2026-04-06', label: 'Ostermontag', type: 'holiday', states: ['BE', 'BB'] },
  { start: '2026-05-01', label: 'Tag der Arbeit', type: 'holiday', states: ['BE', 'BB'] },
  { start: '2026-05-14', label: 'Christi Himmelfahrt', type: 'holiday', states: ['BE', 'BB'] },
  { start: '2026-05-24', label: 'Pfingstsonntag', type: 'holiday', states: ['BB'] },
  { start: '2026-05-25', label: 'Pfingstmontag', type: 'holiday', states: ['BE', 'BB'] },
  { start: '2026-10-03', label: 'Tag der Deutschen Einheit', type: 'holiday', states: ['BE', 'BB'] },
  { start: '2026-10-31', label: 'Reformationstag', type: 'holiday', states: ['BB'] },
  { start: '2026-12-25', label: '1. Weihnachtsfeiertag', type: 'holiday', states: ['BE', 'BB'] },
  { start: '2026-12-26', label: '2. Weihnachtsfeiertag', type: 'holiday', states: ['BE', 'BB'] },

  { start: '2027-01-01', label: 'Neujahr', type: 'holiday', states: ['BE', 'BB'] },
  { start: '2027-03-08', label: 'Internationaler Frauentag', type: 'holiday', states: ['BE'] },
  { start: '2027-03-26', label: 'Karfreitag', type: 'holiday', states: ['BE', 'BB'] },
  { start: '2027-03-28', label: 'Ostersonntag', type: 'holiday', states: ['BB'] },
  { start: '2027-03-29', label: 'Ostermontag', type: 'holiday', states: ['BE', 'BB'] },
  { start: '2027-05-01', label: 'Tag der Arbeit', type: 'holiday', states: ['BE', 'BB'] },
  { start: '2027-05-06', label: 'Christi Himmelfahrt', type: 'holiday', states: ['BE', 'BB'] },
  { start: '2027-05-16', label: 'Pfingstsonntag', type: 'holiday', states: ['BB'] },
  { start: '2027-05-17', label: 'Pfingstmontag', type: 'holiday', states: ['BE', 'BB'] },
  { start: '2027-10-03', label: 'Tag der Deutschen Einheit', type: 'holiday', states: ['BE', 'BB'] },
  { start: '2027-10-31', label: 'Reformationstag', type: 'holiday', states: ['BB'] },
  { start: '2027-12-25', label: '1. Weihnachtsfeiertag', type: 'holiday', states: ['BE', 'BB'] },
  { start: '2027-12-26', label: '2. Weihnachtsfeiertag', type: 'holiday', states: ['BE', 'BB'] },

  { start: '2025-12-22', end: '2026-01-02', label: 'Weihnachtsferien', type: 'school-break', states: ['BE', 'BB'] },
  { start: '2026-02-02', end: '2026-02-07', label: 'Winterferien', type: 'school-break', states: ['BE', 'BB'] },
  { start: '2026-03-30', end: '2026-04-10', label: 'Osterferien', type: 'school-break', states: ['BE', 'BB'] },
  { start: '2026-05-15', label: 'Unterrichtsfreier Tag', type: 'school-break', states: ['BE'] },
  { start: '2026-05-26', label: 'Pfingstferien', type: 'school-break', states: ['BE', 'BB'] },
  { start: '2026-07-09', end: '2026-08-22', label: 'Sommerferien', type: 'school-break', states: ['BE', 'BB'] },
  { start: '2026-10-19', end: '2026-10-31', label: 'Herbstferien', type: 'school-break', states: ['BE'] },
  { start: '2026-10-19', end: '2026-10-30', label: 'Herbstferien', type: 'school-break', states: ['BB'] },
  { start: '2026-12-23', end: '2027-01-02', label: 'Weihnachtsferien', type: 'school-break', states: ['BE', 'BB'] },

  { start: '2027-02-01', end: '2027-02-06', label: 'Winterferien', type: 'school-break', states: ['BE', 'BB'] },
  { start: '2027-03-22', end: '2027-04-02', label: 'Osterferien', type: 'school-break', states: ['BE'] },
  { start: '2027-03-22', end: '2027-04-03', label: 'Osterferien', type: 'school-break', states: ['BB'] },
  { start: '2027-05-07', label: 'Unterrichtsfreier Tag', type: 'school-break', states: ['BE'] },
  { start: '2027-05-18', end: '2027-05-19', label: 'Pfingstferien', type: 'school-break', states: ['BE'] },
  { start: '2027-05-18', label: 'Pfingstferien', type: 'school-break', states: ['BB'] },
  { start: '2027-07-01', end: '2027-08-14', label: 'Sommerferien', type: 'school-break', states: ['BE', 'BB'] },
]

export const getScheduleCalendarMarkers = (
  dateKey: string,
  states: string[]
): ResolvedScheduleCalendarMarker[] => {
  const normalizedStates = states.length > 0 ? states : ['BE']

  return SCHEDULE_CALENDAR_MARKERS
    .filter((marker) => isDateInMarkerRange(dateKey, marker))
    .filter((marker) => marker.states.some((state) => normalizedStates.includes(state)))
    .map((marker) => ({ label: marker.label, type: marker.type }))
}

const isDateInMarkerRange = (dateKey: string, marker: ScheduleCalendarMarker): boolean =>
  dateKey >= marker.start && dateKey <= (marker.end ?? marker.start)
