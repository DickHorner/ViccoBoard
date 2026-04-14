import { formatGermanDate, formatGermanDateOfBirth, formatGermanTime } from '../src/utils/locale-format'

describe('locale-format utilities', () => {
  it('formats dates in German order', () => {
    expect(formatGermanDate(new Date('2026-04-11T08:30:00Z'))).toBe('11.04.2026')
  })

  it('formats dates of birth without timezone drift', () => {
    expect(formatGermanDateOfBirth('2008-09-03')).toBe('03.09.2008')
  })

  it('formats times in 24-hour notation', () => {
    const formatted = formatGermanTime(new Date('2026-04-11T08:05:00Z'))

    expect(formatted.endsWith(':05')).toBe(true)
    expect(formatted).not.toMatch(/[AP]M/)
  })
})
