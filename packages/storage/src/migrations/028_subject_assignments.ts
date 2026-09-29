import { Migration } from '@viccoboard/core';
import { SQLiteStorage } from '../storage.js';

type TableInfoRow = { name: string };
type ClassRow = { id: string; subject_profile: string | null };

const UNASSIGNED_SUBJECT_ID = 'subject:unassigned';

function parseLegacyProfile(raw: string | null): string | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'string' && parsed.trim()) {
      return parsed.trim();
    }
  } catch {
    // Legacy rows may contain a plain string rather than JSON.
  }

  return raw.trim() || null;
}

function subjectDescriptor(profile: string | null): {
  id: string;
  name: string;
  workspaceProfile: 'generic' | 'sport' | 'kbr';
} {
  if (!profile) {
    return { id: UNASSIGNED_SUBJECT_ID, name: 'Unzugeordnet', workspaceProfile: 'generic' };
  }

  const normalized = profile.toLowerCase();
  if (normalized.includes('sport')) {
    return { id: 'subject:legacy:sport', name: 'Sport', workspaceProfile: 'sport' };
  }
  if (normalized.includes('kbr')) {
    return { id: 'subject:legacy:kbr', name: 'KBR', workspaceProfile: 'kbr' };
  }

  return {
    id: 'subject:legacy:' + encodeURIComponent(normalized),
    name: profile,
    workspaceProfile: 'generic'
  };
}

export class SubjectAssignmentsMigration implements Migration {
  version = 28;
  name = 'subject_assignments';

  constructor(private storage: SQLiteStorage) {}

  async up(): Promise<void> {
    const db = this.storage.getDatabase();

    db.exec(`
      CREATE TABLE IF NOT EXISTS subjects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        workspace_profile TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_modified TEXT NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_subjects_name ON subjects(name COLLATE NOCASE);
    `);

    const classColumns = db.prepare('PRAGMA table_info(class_groups)').all() as TableInfoRow[];
    const hasLegacyProfile = classColumns.some((column) => column.name === 'subject_profile');
    const classRows = db.prepare(
      hasLegacyProfile
        ? 'SELECT id, subject_profile FROM class_groups'
        : 'SELECT id, NULL AS subject_profile FROM class_groups'
    ).all() as ClassRow[];

    const now = new Date().toISOString();
    const classSubjectIds = new Map<string, string>();
    const insertSubject = db.prepare(`
      INSERT OR IGNORE INTO subjects (
        id, name, workspace_profile, created_at, last_modified
      ) VALUES (?, ?, ?, ?, ?)
    `);

    for (const classRow of classRows) {
      const subject = subjectDescriptor(parseLegacyProfile(classRow.subject_profile));
      insertSubject.run(subject.id, subject.name, subject.workspaceProfile, now, now);
      classSubjectIds.set(classRow.id, subject.id);
    }

    const lessonColumns = db.prepare('PRAGMA table_info(lessons)').all() as TableInfoRow[];
    if (!lessonColumns.some((column) => column.name === 'subject_id')) {
      db.exec('ALTER TABLE lessons ADD COLUMN subject_id TEXT;');
    }

    const lessonRows = db.prepare('SELECT id, class_group_id FROM lessons').all() as Array<{
      id: string;
      class_group_id: string;
    }>;
    const updateLesson = db.prepare('UPDATE lessons SET subject_id = ? WHERE id = ?');

    for (const lesson of lessonRows) {
      let subjectId = classSubjectIds.get(lesson.class_group_id);
      if (!subjectId) {
        const subject = subjectDescriptor(null);
        insertSubject.run(subject.id, subject.name, subject.workspaceProfile, now, now);
        subjectId = subject.id;
      }
      updateLesson.run(subjectId, lesson.id);
    }

    db.exec('CREATE INDEX IF NOT EXISTS idx_lessons_subject ON lessons(subject_id);');

    if (hasLegacyProfile) {
      db.exec('ALTER TABLE class_groups DROP COLUMN subject_profile;');
    }
  }

  async down(): Promise<void> {
    // Rebuilding lessons/class_groups would be required to restore the legacy shape.
  }
}
