import { Migration } from '@viccoboard/core';
import { SQLiteStorage } from '../storage.js';

export class ExamAssessmentFormatSchemaMigration implements Migration {
  version = 22;
  name = 'exam_assessment_format_schema';

  constructor(private storage: SQLiteStorage) {}

  async up(): Promise<void> {
    const db = this.storage.getDatabase();
    const columns = db.prepare('PRAGMA table_info(exams)').all() as Array<{ name: string }>;

    if (!columns.some((column) => column.name === 'assessment_format')) {
      db.exec("ALTER TABLE exams ADD COLUMN assessment_format TEXT DEFAULT 'klausur'");
    }

    if (!columns.some((column) => column.name === 'candidate_groups')) {
      db.exec("ALTER TABLE exams ADD COLUMN candidate_groups TEXT DEFAULT '[]'");
    }
  }

  async down(): Promise<void> {
    throw new Error('Reverting exam_assessment_format_schema migration is not supported');
  }
}
