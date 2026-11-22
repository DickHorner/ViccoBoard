import { canBackfillBuiltInVideo, CURATED_GAME_VIDEO_URLS } from '../src/data/curated-game-videos'
import { GAME_SEED_DATA } from '../src/data/game-seed-data'
import { METHODENFUNDGRUBE_SEED_DATA } from '../src/data/methodenfundgrube-seed-data'

describe('curated sport exercise videos', () => {
  it('references real built-in entries using only secure external links', () => {
    const knownKeys = new Set([
      ...GAME_SEED_DATA.map((entry) => `core:${entry.name}`),
      ...METHODENFUNDGRUBE_SEED_DATA.map((entry) => {
        const page = entry.notes?.match(/S\. (\d+)\./)?.[1]
        return page ? `methodenfundgrube:p${page}` : `methodenfundgrube:${entry.name}`
      })
    ])

    expect(Object.keys(CURATED_GAME_VIDEO_URLS)).toHaveLength(5)
    for (const [key, value] of Object.entries(CURATED_GAME_VIDEO_URLS)) {
      expect(knownKeys.has(key)).toBe(true)
      const parsed = new URL(value)
      expect(parsed.protocol).toBe('https:')
      expect(parsed.username).toBe('')
      expect(parsed.password).toBe('')
    }
  })

  it('backfills only unmodified built-in entries without video links', () => {
    const createdAt = new Date('2026-01-01T10:00:00.000Z')
    const base = { createdAt, lastModified: new Date(createdAt), videoUrl: undefined, isCustom: false }

    expect(canBackfillBuiltInVideo(base)).toBe(true)
    expect(canBackfillBuiltInVideo({ ...base, isCustom: true })).toBe(false)
    expect(canBackfillBuiltInVideo({ ...base, videoUrl: 'https://example.org/own-video' })).toBe(false)
    expect(canBackfillBuiltInVideo({
      ...base, lastModified: new Date('2026-01-02T10:00:00.000Z')
    })).toBe(false)
  })
})
