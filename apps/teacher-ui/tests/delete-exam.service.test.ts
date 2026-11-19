import type { Exams } from '@viccoboard/core'
import { InMemoryStorageAdapter } from '@viccoboard/storage/browser'
import { deleteExamAndRelatedRecords } from '../src/services/delete-exam.service'

describe('deleteExamAndRelatedRecords', () => {
  let adapter: InMemoryStorageAdapter
  let repository: {
    findById(id: string): Promise<Exams.Exam | null>
    delete(id: string): Promise<boolean>
  }

  beforeEach(async () => {
    adapter = new InMemoryStorageAdapter()
    await adapter.initialize()
    repository = {
      findById: id => adapter.getById<Exams.Exam>('exams', id),
      delete: id => adapter.delete('exams', id)
    }
  })

  it('removes the selected exam and its own corrections, tasks and criteria only', async () => {
    await adapter.insert('exams', { id: 'exam-1', title: 'Prüfung' })
    await adapter.insert('exams', { id: 'exam-2', title: 'Andere Prüfung' })

    for (const table of ['correction_entries', 'criteria', 'task_nodes']) {
      await adapter.insert(table, { id: `${table}-1`, exam_id: 'exam-1' })
      await adapter.insert(table, { id: `${table}-2`, exam_id: 'exam-2' })
    }

    await deleteExamAndRelatedRecords(adapter, repository, 'exam-1')

    expect(await adapter.getById('exams', 'exam-1')).toBeNull()
    expect(await adapter.getById('exams', 'exam-2')).toBeTruthy()
    for (const table of ['correction_entries', 'criteria', 'task_nodes']) {
      expect(await adapter.getById(table, `${table}-1`)).toBeNull()
      expect(await adapter.getById(table, `${table}-2`)).toBeTruthy()
    }
  })

  it('deletes a reusable exam template without touching independent exams', async () => {
    await adapter.insert('exams', { id: 'template-1', kind: 'template' })
    await adapter.insert('exams', { id: 'exam-from-template', kind: 'exam', sourceTemplateId: 'template-1' })

    await deleteExamAndRelatedRecords(adapter, repository, 'template-1')

    expect(await adapter.getById('exams', 'template-1')).toBeNull()
    expect(await adapter.getById('exams', 'exam-from-template')).toBeTruthy()
  })

  it('does not touch any stored records when the exam ID is missing', async () => {
    await adapter.insert('exams', { id: 'exam-1' })
    await expect(deleteExamAndRelatedRecords(adapter, repository, 'missing'))
      .rejects.toThrow('nicht gefunden')
    expect(await adapter.getById('exams', 'exam-1')).toBeTruthy()
  })
})
