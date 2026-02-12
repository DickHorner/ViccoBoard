/**
 * Migration 014: Tool Sessions Schema
 * 
 * Creates dedicated table for tool usage logs (Timer, Scoreboard, Tournaments, etc.)
 * Separates tool session data from student performance entries.
 * 
 * Rationale:
 * - Timer/tool sessions are class-level utility logs, not student performance records
 * - Previous approach stored with studentId=sessionId (FK violation risk)
 * - Clean separation allows proper domain modeling and future tool expansion
 */

import { Migration } from '@viccoboard/core';
import { SQLiteStorage } from '../storage.js';

export class ToolSessionsSchemaMigration implements Migration {
  version = 14;
  name = 'tool_sessions_schema';

  constructor(private storage: SQLiteStorage) {}

  async up(): Promise<void> {
    const db = this.storage.getDatabase();

    // Tool Sessions Table
    // Stores usage logs for live tools (timer, scoreboard, tournaments, etc.)
    db.exec(`
      CREATE TABLE IF NOT EXISTS tool_sessions (
        id TEXT PRIMARY KEY,
        tool_type TEXT NOT NULL,
        class_group_id TEXT,
        lesson_id TEXT,
        session_metadata TEXT NOT NULL,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        created_at TEXT NOT NULL,
        last_modified TEXT NOT NULL,
        FOREIGN KEY (class_group_id) REFERENCES class_groups(id) ON DELETE SET NULL,
        FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL
      )
    `);

    // Create indexes for common queries
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tool_sessions_tool_type ON tool_sessions(tool_type);
      CREATE INDEX IF NOT EXISTS idx_tool_sessions_class_group ON tool_sessions(class_group_id);
      CREATE INDEX IF NOT EXISTS idx_tool_sessions_started_at ON tool_sessions(started_at);
    `);
  }

  async down(): Promise<void> {
    const db = this.storage.getDatabase();
    
    db.exec(`
      DROP TABLE IF EXISTS tool_sessions;
    `);
  }
}
