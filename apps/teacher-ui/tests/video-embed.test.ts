import { youtubeEmbedUrl } from '../src/utils/video-embed'

describe('inline video player URL', () => {
  const embed = 'https://www.youtube-nocookie.com/embed/kCeSqe4SE6c?autoplay=1&rel=0'

  it.each([
    'https://www.youtube.com/watch?v=kCeSqe4SE6c',
    'https://www.youtube.com/watch?v=kCeSqe4SE6c&t=30',
    'https://youtu.be/kCeSqe4SE6c',
    'https://m.youtube.com/shorts/kCeSqe4SE6c',
    'https://www.youtube-nocookie.com/embed/kCeSqe4SE6c'
  ])('embeds a supported YouTube address without leaving ViccoBoard', (url) => {
    expect(youtubeEmbedUrl(url)).toBe(embed)
  })

  it.each([
    undefined,
    '',
    'not a URL',
    'javascript:alert(1)',
    'http://youtube.com/watch?v=kCeSqe4SE6c',
    'https://youtube.com.evil.example/watch?v=kCeSqe4SE6c',
    'https://user:pass@youtube.com/watch?v=kCeSqe4SE6c',
    'https://youtube.com/watch?v=bad',
    'https://youtube.com/watch?v=kCeSqe4SE6c/extra',
    'https://www.uni-muenster.de/ProVision/video/clip.shtml',
    'https://albathek.de/spiele/blindenhund-ein-spiel-fur-kooperation-und-vertrauen'
  ])('does not embed untrusted or unsupported source URLs', (url) => {
    expect(youtubeEmbedUrl(url)).toBeNull()
  })
})
