const MAX_STUDENT_PHOTO_BYTES = 2 * 1024 * 1024
const SUPPORTED_STUDENT_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export function validateStudentPhotoFile(file: Pick<File, 'size' | 'type'>): string | null {
  if (!SUPPORTED_STUDENT_PHOTO_TYPES.has(file.type)) {
    return 'Bitte ein JPG-, PNG- oder WEBP-Bild auswählen.'
  }

  if (file.size > MAX_STUDENT_PHOTO_BYTES) {
    return 'Das Bild ist zu groß (maximal 2 MB).'
  }

  return null
}

export function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Das Bild konnte nicht gelesen werden.'))
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }
      reject(new Error('Das Bild konnte nicht gelesen werden.'))
    }
    reader.readAsDataURL(file)
  })
}
