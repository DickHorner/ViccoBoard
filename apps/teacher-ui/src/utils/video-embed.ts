/**
 * Derive an embeddable player URL from supported video providers.
 * Never put an arbitrary user-entered URL into an iframe.
 */
export function youtubeEmbedUrl(value?: string): string | null {
  if (!value) return null

  let url: URL
  try {
    url = new URL(value.trim())
  } catch {
    return null
  }

  if (url.protocol !== 'https:' || url.username || url.password) return null

  const host = url.hostname.toLowerCase()
  let videoId: string | null = null

  if (host === 'www.youtube.com' || host === 'youtube.com' || host === 'm.youtube.com') {
    if (url.pathname === '/watch') {
      videoId = url.searchParams.get('v')
    } else {
      videoId = url.pathname.match(/^\/(?:shorts|embed)\/([A-Za-z0-9_-]{11})$/)?.[1] ?? null
    }
  } else if (host === 'youtu.be' || host === 'www.youtu.be') {
    videoId = url.pathname.match(/^\/([A-Za-z0-9_-]{11})$/)?.[1] ?? null
  } else if (host === 'www.youtube-nocookie.com' || host === 'youtube-nocookie.com') {
    videoId = url.pathname.match(/^\/embed\/([A-Za-z0-9_-]{11})$/)?.[1] ?? null
  }

  return videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId)
    ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`
    : null
}
