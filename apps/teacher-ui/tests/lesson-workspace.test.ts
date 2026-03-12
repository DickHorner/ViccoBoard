import { resolveLessonWorkspaceSubject, buildSportToolEntries, formatToolLabel } from '../src/utils/lesson-workspace'

describe('lesson workspace subject resolution', () => {
  it('maps known subject profiles to sport or kbr', () => {
    expect(resolveLessonWorkspaceSubject('sport')).toBe('sport')
    expect(resolveLessonWorkspaceSubject('Sport Sek I')).toBe('sport')
    expect(resolveLessonWorkspaceSubject('kbr')).toBe('kbr')
  })

  it('falls back to generic for unknown or missing profiles', () => {
    expect(resolveLessonWorkspaceSubject()).toBe('generic')
    expect(resolveLessonWorkspaceSubject('mathe')).toBe('generic')
  })
})

describe('buildSportToolEntries', () => {
  const ctx = { lessonId: 'lesson-42', classGroupId: 'class-7' }

  it('returns exactly three sport tool entries', () => {
    const entries = buildSportToolEntries(ctx)
    expect(entries).toHaveLength(3)
  })

  it('embeds lessonId and classGroupId in every entry URL', () => {
    const entries = buildSportToolEntries(ctx)
    for (const entry of entries) {
      expect(entry.to).toContain('lessonId=lesson-42')
      expect(entry.to).toContain('classGroupId=class-7')
    }
  })

  it('targets the correct base paths for sport-hub, grading and live-tools', () => {
    const entries = buildSportToolEntries(ctx)
    expect(entries[0].to).toMatch(/^\/subjects\/sport\?/)
    expect(entries[1].to).toMatch(/^\/grading\?/)
    expect(entries[2].to).toMatch(/^\/tools\/timer\?/)
  })

  it('URL-encodes special characters in lessonId and classGroupId', () => {
    const specialCtx = { lessonId: 'lesson/1 2', classGroupId: 'class&3' }
    const entries = buildSportToolEntries(specialCtx)
    for (const entry of entries) {
      expect(entry.to).not.toContain(' ')
      expect(entry.to).toContain('lessonId=lesson%2F1%202')
      expect(entry.to).toContain('classGroupId=class%263')
    }
  })
})

describe('formatToolLabel', () => {
  it('returns human-readable German labels for known tool types', () => {
    expect(formatToolLabel('timer')).toBe('Timer')
    expect(formatToolLabel('scoreboard')).toBe('Scoreboard')
    expect(formatToolLabel('teams')).toBe('Teams')
    expect(formatToolLabel('tournaments')).toBe('Turnier')
    expect(formatToolLabel('tactics')).toBe('Taktikboard')
    expect(formatToolLabel('feedback')).toBe('Feedback')
    expect(formatToolLabel('multistop')).toBe('Multistop')
  })

  it('is case-insensitive', () => {
    expect(formatToolLabel('TIMER')).toBe('Timer')
    expect(formatToolLabel('Scoreboard')).toBe('Scoreboard')
  })

  it('falls back to the raw toolType for unknown types', () => {
    expect(formatToolLabel('unknown-tool')).toBe('unknown-tool')
  })
})
