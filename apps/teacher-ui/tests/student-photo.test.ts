import { validateStudentPhotoFile } from '../src/utils/student-photo'

describe('student photo validation', () => {
  it('accepts supported image types below 2MB', () => {
    expect(validateStudentPhotoFile({ type: 'image/png', size: 128_000 } as File)).toBeNull()
  })

  it('rejects unsupported mime types', () => {
    expect(validateStudentPhotoFile({ type: 'application/pdf', size: 128_000 } as File))
      .toBe('Bitte ein JPG-, PNG- oder WEBP-Bild auswählen.')
  })

  it('rejects files larger than 2MB', () => {
    expect(validateStudentPhotoFile({ type: 'image/jpeg', size: 2 * 1024 * 1024 + 1 } as File))
      .toBe('Das Bild ist zu groß (maximal 2 MB).')
  })
})
