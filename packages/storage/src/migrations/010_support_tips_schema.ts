/**
 * Migration 010: Support Tips Schema
 */

import { SQLiteStorage } from '../storage.js';

export class SupportTipsMigration {
  version = 10;
  name = 'support_tips_schema';

  constructor(private storage: SQLiteStorage) {}

  async up(): Promise<void> {
    const db = this.storage.getDatabase();

    db.exec(`
      CREATE TABLE IF NOT EXISTS support_tips (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        short_description TEXT NOT NULL,
        category TEXT,
        tags TEXT NOT NULL DEFAULT '[]',
        links TEXT NOT NULL DEFAULT '[]',
        qr_code TEXT,
        priority INTEGER NOT NULL DEFAULT 0,
        weight REAL NOT NULL DEFAULT 1,
        usage_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        last_modified TEXT NOT NULL,
        last_used TEXT
      )
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_support_tips_category ON support_tips(category);
      CREATE INDEX IF NOT EXISTS idx_support_tips_usage ON support_tips(usage_count);
      CREATE INDEX IF NOT EXISTS idx_support_tips_created ON support_tips(created_at);
    `);
  }

  async down(): Promise<void> {
    const db = this.storage.getDatabase();
    db.exec(`DROP TABLE IF EXISTS support_tips;`);
  }
}
