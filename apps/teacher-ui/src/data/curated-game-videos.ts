import type { Sport } from '@viccoboard/core'

/**
 * Source-checked external demonstrations for built-in exercises.
 * No video is loaded until the user opens the link in the game details.
 * The source descriptions and known deviations are recorded in docs/sport-video-sources.md.
 */
export const CURATED_GAME_VIDEO_URLS: Readonly<Record<string, string>> = {
  'core:Kettenfangen': 'https://www.youtube.com/watch?v=kCeSqe4SE6c',
  'core:Völkerball (klassisch)': 'https://www.uni-muenster.de/ProVision/video/SPO_K5_LK3_1DS_KLE_Clip1.shtml',
  'core:Blind führen': 'https://albathek.de/spiele/blindenhund-ein-spiel-fur-kooperation-und-vertrauen',
  'core:Jonglieren lernen (mit Tüchern)': 'https://www.youtube.com/watch?v=E6k6tQu3m5s',
  'core:Progressive Muskelentspannung': 'https://www.youtube.com/watch?v=KOgjIWzCgJk',
  'core:Frisbee-Golf': 'https://www.youtube.com/watch?v=o9LWgNvp2Fw',
  'methodenfundgrube:p182': 'https://www.youtube.com/watch?v=TJoiPAkzwrY'
}

export function canBackfillBuiltInVideo(
  entry: Pick<Sport.GameEntry, 'isCustom' | 'videoUrl' | 'createdAt' | 'lastModified'>
): boolean {
  return !entry.isCustom &&
    !entry.videoUrl &&
    entry.createdAt.getTime() === entry.lastModified.getTime()
}
