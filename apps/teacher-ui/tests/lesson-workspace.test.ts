import { resolveLessonWorkspaceSubject } from '../src/utils/lesson-workspace'

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
