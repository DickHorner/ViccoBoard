import { InMemoryStorageAdapter } from '@viccoboard/storage/browser'
import { PlanningBlockRepository } from '../src/services/planning-block.repository'

describe('PlanningBlockRepository', () => {
  const createRepository = async () => {
    const adapter = new InMemoryStorageAdapter()
    await adapter.initialize()
    return new PlanningBlockRepository(adapter)
  }

  it('creates and reloads planning blocks by class group', async () => {
    const repository = await createRepository()

    const created = await repository.create({
      classGroupId: 'class-1',
      title: 'Basketball',
      startDate: '2026-09-14',
      endDate: '2026-10-09',
      color: 'blue',
      notes: 'Technik und Spielaufbau'
    })

    const loaded = await repository.findByClassGroup('class-1')

    expect(loaded).toHaveLength(1)
    expect(loaded[0].id).toBe(created.id)
    expect(loaded[0].title).toBe('Basketball')
    expect(loaded[0].startDate).toBe('2026-09-14')
    expect(loaded[0].endDate).toBe('2026-10-09')
  })

  it('rejects invalid date ranges', async () => {
    const repository = await createRepository()

    await expect(repository.create({
      classGroupId: 'class-1',
      title: 'Volleyball',
      startDate: '2026-11-20',
      endDate: '2026-11-10'
    })).rejects.toThrow('startDate must be before or equal to endDate')
  })

  it('sorts planning blocks by start date', async () => {
    const repository = await createRepository()

    await repository.create({
      classGroupId: 'class-1',
      title: 'Volleyball',
      startDate: '2026-11-02',
      endDate: '2026-11-27'
    })
    await repository.create({
      classGroupId: 'class-1',
      title: 'Basketball',
      startDate: '2026-09-14',
      endDate: '2026-10-09'
    })

    const loaded = await repository.findByClassGroup('class-1')

    expect(loaded.map((block) => block.title)).toEqual(['Basketball', 'Volleyball'])
  })
})
