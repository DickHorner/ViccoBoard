import type { ExamRepository } from '@viccoboard/exams'
import type { StorageAdapter } from '@viccoboard/storage/browser'

/**
 * Browser storage has no foreign-key cascade. Remove an exam and its child
 * records in one IndexedDB transaction so a failed deletion is rolled back.
 */
export async function deleteExamAndRelatedRecords(
  adapter: StorageAdapter,
  examRepository: Pick<ExamRepository, 'findById' | 'delete'>,
  examId: string
): Promise<void> {
  await adapter.transaction(async () => {
    if (!(await examRepository.findById(examId))) {
      throw new Error('Die Prüfung wurde nicht gefunden.')
    }

    for (const table of ['correction_entries', 'criteria', 'task_nodes']) {
      const rows = await adapter.getAll<{ id: string }>(table, { exam_id: examId })
      for (const row of rows) {
        await adapter.delete(table, row.id)
      }
    }

    if (!(await examRepository.delete(examId))) {
      throw new Error('Die Prüfung konnte nicht gelöscht werden.')
    }
  })
}
