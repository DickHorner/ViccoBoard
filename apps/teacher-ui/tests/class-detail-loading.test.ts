import { createApp, nextTick, ref } from 'vue'
import ClassDetail from '../src/views/ClassDetail.vue'

const findClass = jest.fn()
const findStudents = jest.fn()
const countLessons = jest.fn()
const countCategories = jest.fn()
const countPerformances = jest.fn()

jest.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: 'class-9b' } })
}))

jest.mock('../src/composables/useSportBridge', () => ({
  initializeSportBridge: jest.fn(),
  useClassGroups: () => ({ findById: findClass }),
  getSportBridge: () => ({
    lessonRepository: { count: countLessons },
    gradeCategoryRepository: { count: countCategories },
    performanceEntryRepository: { count: countPerformances }
  })
}))

jest.mock('../src/composables/useStudentsBridge', () => ({
  initializeStudentsBridge: jest.fn(),
  getStudentsBridge: () => ({
    studentRepository: { findAllByClassGroup: findStudents }
  })
}))

function flushPromises(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

describe('ClassDetail progressive loading', () => {
  let container: HTMLDivElement
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    jest.clearAllMocks()
    container = document.createElement('div')
    document.body.appendChild(container)
    app = createApp(ClassDetail)
    app.component('RouterLink', {
      props: ['to'],
      template: '<a><slot /></a>'
    })
    findClass.mockResolvedValue({
      id: 'class-9b',
      name: '9b',
      schoolYear: '2026/2027',
      createdAt: new Date('2026-09-01T00:00:00Z')
    })
    findStudents.mockResolvedValue([
      { id: 's1', firstName: 'Alex', lastName: 'Becker', inactive: false },
      { id: 's2', firstName: 'Emil', lastName: 'Meyer', inactive: true }
    ])
    countLessons.mockResolvedValue(7)
    countCategories.mockResolvedValue(3)
    countPerformances.mockResolvedValue(4)
  })

  afterEach(() => {
    app.unmount()
    container.remove()
  })

  it('shows the class and students while sport summary is still loading', async () => {
    let releaseSummary!: (value: number) => void
    countLessons.mockReturnValue(new Promise<number>(resolve => { releaseSummary = resolve }))

    app.mount(container)
    await flushPromises()
    await nextTick()

    expect(container.textContent).toContain('9b')
    expect(container.textContent).toContain('Alex Becker')
    expect(container.textContent).toContain('Sport-Kennzahlen werden geladen')
    expect(countPerformances).toHaveBeenCalledWith({ student_id: 's1' })
    expect(countPerformances).toHaveBeenCalledWith({ student_id: 's2' })

    releaseSummary(7)
    await flushPromises()
    await nextTick()

    expect(container.textContent).toContain('Bewertungen')
    expect(container.textContent).not.toContain('Sport-Kennzahlen werden geladen')
  })

  it('does not hide the class if loading sport statistics fails', async () => {
    countLessons.mockRejectedValue(new Error('Database error'))

    app.mount(container)
    await flushPromises()
    await nextTick()

    expect(container.textContent).toContain('Alex Becker')
    expect(container.textContent).toContain('Sport-Kennzahlen konnten nicht geladen werden')
    expect(container.textContent).toContain('Erneut versuchen')
  })

  it('does not start performance counting before the student list is available', async () => {
    let releaseStudents!: (value: unknown[]) => void
    findStudents.mockReturnValue(new Promise(resolve => { releaseStudents = resolve }))

    app.mount(container)
    await flushPromises()
    await nextTick()

    expect(container.textContent).toContain('Klasseninformation')
    expect(container.textContent).toContain('Schüler werden geladen')
    expect(countPerformances).not.toHaveBeenCalled()

    releaseStudents([{ id: 's1', firstName: 'Alex', lastName: 'Becker' }])
    await flushPromises()
    await nextTick()

    expect(container.textContent).toContain('Alex Becker')
    expect(countPerformances).toHaveBeenCalledTimes(1)
  })
})
