import { Migration } from '@viccoboard/core';
import { SQLiteStorage } from '../storage.js';

export class KbrFeedbackWorkflowMigration implements Migration {
  version = 18;
  name = 'kbr_feedback_workflow';

  constructor(private storage: SQLiteStorage) {}

  async up(): Promise<void> {
    const db = this.storage.getDatabase();
    const columns = db.prepare('PRAGMA table_info(exams)').all() as Array<{ name: string }>;

    if (!columns.some((column) => column.name === 'exam_date')) {
      db.exec('ALTER TABLE exams ADD COLUMN exam_date TEXT');
    }
  }

  async down(): Promise<void> {
    throw new Error('Reverting kbr_feedback_workflow migration is not supported');
  }
}
