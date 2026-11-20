import { ScoreboardSoundLibrary } from '../src/services/scoreboard-sound-library'

const library = new ScoreboardSoundLibrary()

beforeEach(() => {
  window.localStorage.clear()
})

describe('scoreboard custom sounds', () => {
  it('stores short audio clips locally and restores them', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'gong.wav', { type: 'audio/wav' })
    const clip = await library.replace('end', file)
    expect(clip.name).toBe('gong.wav')
    expect(clip.dataUrl).toMatch(/^data:audio\/wav;base64,/)
    expect(new ScoreboardSoundLibrary().load().end).toEqual(clip)
    library.remove('end')
    expect(library.load()).toEqual({})
  })

  it('rejects non-audio and oversized files without replacing the existing clip', async () => {
    const file = new File(['abc'], 'first.wav', { type: 'audio/wav' })
    await library.replace('start', file)
    await expect(library.replace('start', new File(['x'], 'bad.pdf', {
      type: 'application/pdf'
    }))).rejects.toThrow('Audiodatei')
    await expect(library.replace('start', new File([new Uint8Array(256 * 1024 + 1)],
      'large.wav', { type: 'audio/wav' }))).rejects.toThrow('256 KiB')
    expect(library.load().start?.name).toBe('first.wav')
  })

  it('ignores malformed local content and refuses invalid stored URLs', () => {
    window.localStorage.setItem('viccoboard-scoreboard-sounds-v1', '{"end":{"name":"x","dataUrl":"javascript:alert(1)"}}')
    expect(library.load()).toEqual({})
  })
})
