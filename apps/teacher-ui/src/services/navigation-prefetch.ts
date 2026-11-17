import type { AttendanceRecord, ClassGroup, Student, Sport } from '@viccoboard/core'
import { getStudentsBridge } from '../composables/useStudentsBridge'
import { getSportBridge } from '../composables/useSportBridge'

const PREFETCH_AGE_MS = 2000

type Pending<T> = {
  id: string
  createdAt: number
  promise: Promise<T>
}

type StudentSportData = {
  attendance: AttendanceRecord[]
  performances: Sport.PerformanceEntry[]
  categories: Sport.GradeCategory[]
}

let pendingRoster: Pending<Student[]> | null = null
let pendingSport: Pending<StudentSportData> | null = null

type Selection<T> = { id: string; createdAt: number; value: T }

let selectedClass: Selection<ClassGroup> | null = null
let selectedStudent: Selection<Student> | null = null

export function rememberClassForNavigation(classGroup: ClassGroup): void {
  const selection = { id: classGroup.id, createdAt: Date.now(), value: classGroup }
  selectedClass = selection
  window.setTimeout(() => {
    if (selectedClass === selection) selectedClass = null
  }, PREFETCH_AGE_MS)
}

export function takeClassForNavigation(classId: string): ClassGroup | null {
  const selected = selectedClass
  selectedClass = null
  return selected?.id === classId && Date.now() - selected.createdAt < PREFETCH_AGE_MS
    ? selected.value
    : null
}

export function rememberStudentForNavigation(student: Student): void {
  const selection = { id: student.id, createdAt: Date.now(), value: student }
  selectedStudent = selection
  window.setTimeout(() => {
    if (selectedStudent === selection) selectedStudent = null
  }, PREFETCH_AGE_MS)
}

export function takeStudentForNavigation(studentId: string): Student | null {
  const selected = selectedStudent
  selectedStudent = null
  return selected?.id === studentId && Date.now() - selected.createdAt < PREFETCH_AGE_MS
    ? selected.value
    : null
}

export function prefetchClassStudents(classId: string): void {
  if (pendingRoster?.id === classId && Date.now() - pendingRoster.createdAt < PREFETCH_AGE_MS) {
    return
  }

  const promise = getStudentsBridge().studentRepository.findAllByClassGroup(classId)
  pendingRoster = { id: classId, createdAt: Date.now(), promise }
  void promise.catch(() => {
    if (pendingRoster?.promise === promise) pendingRoster = null
  })
  window.setTimeout(() => {
    if (pendingRoster?.promise === promise) pendingRoster = null
  }, PREFETCH_AGE_MS)
}

export function loadClassStudents(classId: string): Promise<Student[]> {
  const prefetched = pendingRoster
  pendingRoster = null
  if (prefetched?.id === classId && Date.now() - prefetched.createdAt < PREFETCH_AGE_MS) {
    return prefetched.promise
  }
  return getStudentsBridge().studentRepository.findAllByClassGroup(classId)
}

function readStudentSport(studentId: string): Promise<StudentSportData> {
  const sport = getSportBridge()
  return Promise.all([
    sport.attendanceRepository.findByStudent(studentId),
    sport.performanceEntryRepository.findByStudent(studentId),
    sport.gradeCategoryRepository.findAll()
  ]).then(([attendance, performances, categories]) => ({ attendance, performances, categories }))
}

export function prefetchStudentSport(studentId: string): void {
  if (pendingSport?.id === studentId && Date.now() - pendingSport.createdAt < PREFETCH_AGE_MS) {
    return
  }

  const promise = readStudentSport(studentId)
  pendingSport = { id: studentId, createdAt: Date.now(), promise }
  void promise.catch(() => {
    if (pendingSport?.promise === promise) pendingSport = null
  })
  window.setTimeout(() => {
    if (pendingSport?.promise === promise) pendingSport = null
  }, PREFETCH_AGE_MS)
}

export function loadStudentSport(studentId: string): Promise<StudentSportData> {
  const prefetched = pendingSport
  pendingSport = null
  return prefetched?.id === studentId && Date.now() - prefetched.createdAt < PREFETCH_AGE_MS
    ? prefetched.promise
    : readStudentSport(studentId)
}

export function scheduleViewPrefetch(loader: () => Promise<unknown>): () => void {
  if (window.location.protocol === 'file:') return () => {}

  let timer = 0
  const frame = window.requestAnimationFrame(() => {
    timer = window.setTimeout(() => {
      void loader().catch(error => console.warn('Could not prefetch next view:', error))
    }, 0)
  })

  return () => {
    window.cancelAnimationFrame(frame)
    window.clearTimeout(timer)
  }
}
