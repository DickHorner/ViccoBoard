export interface ScheduleHourSlot {
  label: string
  startTime: string
  durationMinutes: 45 | 90
  order: number
}

const DEFAULT_SCHEDULE_HOUR_GRID: ScheduleHourSlot[] = [
  { label: '1. Stunde', startTime: '08:00', durationMinutes: 45, order: 1 },
  { label: '2. Stunde', startTime: '08:50', durationMinutes: 45, order: 2 },
  { label: '3. Stunde', startTime: '09:55', durationMinutes: 45, order: 3 },
  { label: '4. Stunde', startTime: '10:45', durationMinutes: 45, order: 4 },
  { label: '5. Stunde', startTime: '11:50', durationMinutes: 45, order: 5 },
  { label: '6. Stunde', startTime: '12:40', durationMinutes: 45, order: 6 },
  { label: '7. Stunde', startTime: '13:30', durationMinutes: 45, order: 7 },
  { label: '8. Stunde', startTime: '14:20', durationMinutes: 45, order: 8 },
  { label: '1./2. Stunde', startTime: '08:00', durationMinutes: 90, order: 1 },
  { label: '3./4. Stunde', startTime: '09:55', durationMinutes: 90, order: 3 },
  { label: '5./6. Stunde', startTime: '11:50', durationMinutes: 90, order: 5 },
  { label: '7./8. Stunde', startTime: '13:30', durationMinutes: 90, order: 7 }
]

export const getScheduleHourSlot = (
  startTime: string | undefined,
  durationMinutes: number | undefined
): ScheduleHourSlot | null => {
  if (!startTime || !durationMinutes) {
    return null
  }

  return DEFAULT_SCHEDULE_HOUR_GRID.find((slot) =>
    slot.startTime === startTime && slot.durationMinutes === durationMinutes
  ) ?? null
}
