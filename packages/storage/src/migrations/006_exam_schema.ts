/**
 * Exam Schema Migration
 * Creates tables for exams, tasks, and criteria
 */

import { Migration } from '@viccoboard/core';
import { SQLiteStorage } from '../storage';

export class ExamSchemaMigration implements Migration {
  version = 6;
  name = 'exam_schema';

  constructor(private storage: SQLiteStorage) {}

  async up(): Promise<void> {
    const db = this.storage.getDatabase();

    db.exec(`
      CREATE TABLE IF NOT EXISTS exams (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        class_group_id TEXT,
        mode TEXT NOT NULL,
        structure TEXT NOT NULL,
        grading_key TEXT NOT NULL,
        print_presets TEXT NOT NULL,
        candidates TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_modified TEXT NOT NULL,
        FOREIGN KEY (class_group_id) REFERENCES class_groups(id) ON DELETE SET NULL
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS task_nodes (
        id TEXT PRIMARY KEY,
        exam_id TEXT NOT NULL,
        parent_id TEXT,
        level INTEGER NOT NULL,
        order_index INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        points REAL NOT NULL,
        bonus_points REAL,
        is_choice INTEGER NOT NULL,
        choice_group TEXT,
        allow_comments INTEGER NOT NULL,
        allow_support_tips INTEGER NOT NULL,
        comment_box_enabled INTEGER NOT NULL,
        subtasks TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_modified TEXT NOT NULL,
        FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES task_nodes(id) ON DELETE CASCADE
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS criteria (
        id TEXT PRIMARY KEY,
        exam_id TEXT NOT NULL,
        task_id TEXT NOT NULL,
        text TEXT NOT NULL,
        formatting TEXT NOT NULL,
        points REAL NOT NULL,
        aspect_based INTEGER NOT NULL,
        sub_criteria TEXT,
        created_at TEXT NOT NULL,
        last_modified TEXT NOT NULL,
        FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
        FOREIGN KEY (task_id) REFERENCES task_nodes(id) ON DELETE CASCADE
      )
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_exams_class_group ON exams(class_group_id);
      CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);
      CREATE INDEX IF NOT EXISTS idx_task_nodes_exam ON task_nodes(exam_id);
      CREATE INDEX IF NOT EXISTS idx_task_nodes_parent ON task_nodes(parent_id);
      CREATE INDEX IF NOT EXISTS idx_task_nodes_order ON task_nodes(order_index);
      CREATE INDEX IF NOT EXISTS idx_criteria_exam ON criteria(exam_id);
      CREATE INDEX IF NOT EXISTS idx_criteria_task ON criteria(task_id);
    `);
  }

  async down(): Promise<void> {
    const db = this.storage.getDatabase();

    db.exec(`
      DROP TABLE IF EXISTS criteria;
      DROP TABLE IF EXISTS task_nodes;
      DROP TABLE IF EXISTS exams;
    `);
  }
}
