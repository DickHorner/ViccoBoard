const mockFindRoster = jest.fn()
const mockFindAttendance = jest.fn()
const mockFindPerformances = jest.fn()
const mockFindCategories = jest.fn()

jest.mock('../src/composables/useStudentsBridge', () => ({
  getStudentsBridge: () => ({
    studentRepository: { findAllByClassGroup: mockFindRoster }
  })
}))

jest.mock('../src/composables/useSportBridge', () => ({
  getSportBridge: () => ({
    attendanceRepository: { findByStudent: mockFindAttendance },
    performanceEntryRepository: { findByStudent: mockFindPerformances },
    gradeCategoryRepository: { findAll: mockFindCategories }
  })
}))

import type { ClassGroup, Student } from '@viccoboard/core'
import {
  loadClassStudents,
  loadStudentSport,
  prefetchClassStudents,
  prefetchStudentSport,
  rememberClassForNavigation,
  rememberStudentForNavigation,
  takeClassForNavigation,
  takeStudentForNavigation
} from '../src/services/navigation-prefetch'

describe('one-hop navigation prefetch', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
    mockFindRoster.mockResolvedValue([{ id: 'student-1' }])
    mockFindAttendance.mockResolvedValue([{ id: 'absence-1' }])
    mockFindPerformances.mockResolvedValue([{ id: 'grade-1' }])
    mockFindCategories.mockResolvedValue([{ id: 'category-1' }])
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('hands off one selected class without another database read', () => {
    const classGroup = { id: 'class-9b', name: '9b' } as ClassGroup
    rememberClassForNavigation(classGroup)

    expect(takeClassForNavigation('class-9b')).toBe(classGroup)
    expect(takeClassForNavigation('class-9b')).toBeNull()
    expect(mockFindRoster).not.toHaveBeenCalled()
  })

  it('never hands off the identity of a different student or an expired one', () => {
    const anna = { id: 'student-1', firstName: 'Anna' } as Student
    rememberStudentForNavigation(anna)

    expect(takeStudentForNavigation('student-2')).toBeNull()

    rememberStudentForNavigation(anna)
    jest.advanceTimersByTime(2000)
    expect(takeStudentForNavigation('student-1')).toBeNull()

    rememberStudentForNavigation(anna)
    expect(takeStudentForNavigation('student-1')).toBe(anna)
  })

  it('reuses an in-flight class-roster query for the matching navigation', async () => {
    prefetchClassStudents('class-9b')
    prefetchClassStudents('class-9b')

    await expect(loadClassStudents('class-9b')).resolves.toEqual([{ id: 'student-1' }])
    expect(mockFindRoster).toHaveBeenCalledTimes(1)
    expect(mockFindRoster).toHaveBeenCalledWith('class-9b')
  })

  it('does not reuse a class roster for a different class', async () => {
    prefetchClassStudents('class-9b')

    await loadClassStudents('class-10a')

    expect(mockFindRoster).toHaveBeenCalledTimes(2)
    expect(mockFindRoster).toHaveBeenLastCalledWith('class-10a')
  })

  it('does not reuse expired data', async () => {
    prefetchClassStudents('class-9b')
    jest.advanceTimersByTime(2000)

    await loadClassStudents('class-9b')

    expect(mockFindRoster).toHaveBeenCalledTimes(2)
  })

  it('retries normally after a rejected prefetch', async () => {
    mockFindRoster.mockRejectedValueOnce(new Error('Transient read error'))
    prefetchClassStudents('class-9b')
    await Promise.resolve()
    await Promise.resolve()

    await expect(loadClassStudents('class-9b')).resolves.toEqual([{ id: 'student-1' }])
    expect(mockFindRoster).toHaveBeenCalledTimes(2)
  })

  it('reuses student sport data while keeping different students isolated', async () => {
    prefetchStudentSport('student-1')
    prefetchStudentSport('student-1')

    await expect(loadStudentSport('student-1')).resolves.toEqual({
      attendance: [{ id: 'absence-1' }],
      performances: [{ id: 'grade-1' }],
      categories: [{ id: 'category-1' }]
    })
    expect(mockFindAttendance).toHaveBeenCalledTimes(1)
    expect(mockFindPerformances).toHaveBeenCalledTimes(1)
    expect(mockFindCategories).toHaveBeenCalledTimes(1)

    await loadStudentSport('student-2')
    expect(mockFindAttendance).toHaveBeenCalledWith('student-2')
    expect(mockFindAttendance).toHaveBeenCalledTimes(2)
  })
})
