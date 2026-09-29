import type { IndexedDBMigration } from './indexeddb-migration.js';

const UNASSIGNED_SUBJECT_ID = 'subject:unassigned';

function parseLegacyProfile(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;

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
  workspace_profile: 'generic' | 'sport' | 'kbr';
} {
  if (!profile) {
    return {
      id: UNASSIGNED_SUBJECT_ID,
      name: 'Unzugeordnet',
      workspace_profile: 'generic'
    };
  }

  const normalized = profile.toLowerCase();
  if (normalized.includes('sport')) {
    return { id: 'subject:legacy:sport', name: 'Sport', workspace_profile: 'sport' };
  }
  if (normalized.includes('kbr')) {
    return { id: 'subject:legacy:kbr', name: 'KBR', workspace_profile: 'kbr' };
  }

  return {
    id: 'subject:legacy:' + encodeURIComponent(normalized),
    name: profile,
    workspace_profile: 'generic'
  };
}

export class IndexedDBSubjectAssignmentsMigration implements IndexedDBMigration {
  storage: 'indexeddb' = 'indexeddb';
  version = 27;
  name = 'indexeddb_subject_assignments';

  up(db: IDBDatabase, tx: IDBTransaction): void {
    const subjects = db.objectStoreNames.contains('subjects')
      ? tx.objectStore('subjects')
      : db.createObjectStore('subjects', { keyPath: 'id' });

    if (!subjects.indexNames.contains('name')) {
      subjects.createIndex('name', 'name', { unique: true });
    }

    const lessons = tx.objectStore('lessons');
    if (!lessons.indexNames.contains('subject_id')) {
      lessons.createIndex('subject_id', 'subject_id', { unique: false });
    }

    const planningBlocks = db.objectStoreNames.contains('planning_blocks')
      ? tx.objectStore('planning_blocks')
      : null;
    if (planningBlocks && !planningBlocks.indexNames.contains('subject_id')) {
      planningBlocks.createIndex('subject_id', 'subject_id', { unique: false });
    }

    const classSubjectIds = new Map<string, string>();
    const now = new Date().toISOString();
    const classGroups = tx.objectStore('class_groups');
    const classRequest = classGroups.openCursor();

    const ensureSubject = (profile: string | null): string => {
      const subject = subjectDescriptor(profile);
      subjects.put({
        ...subject,
        created_at: now,
        last_modified: now
      });
      return subject.id;
    };

    const migrateAssignments = () => {
      const lessonRequest = lessons.openCursor();
      lessonRequest.onsuccess = () => {
        const cursor = lessonRequest.result;
        if (!cursor) return;

        const row = cursor.value as Record<string, unknown>;
        const classGroupId = String(row.class_group_id ?? '');
        row.subject_id = classSubjectIds.get(classGroupId) ?? ensureSubject(null);
        cursor.update(row);
        cursor.continue();
      };

      if (planningBlocks) {
        const blockRequest = planningBlocks.openCursor();
        blockRequest.onsuccess = () => {
          const cursor = blockRequest.result;
          if (!cursor) return;

          const row = cursor.value as Record<string, unknown>;
          const classGroupId = String(row.class_group_id ?? '');
          row.subject_id = classSubjectIds.get(classGroupId) ?? ensureSubject(null);
          cursor.update(row);
          cursor.continue();
        };
      }
    };

    classRequest.onsuccess = () => {
      const cursor = classRequest.result;
      if (!cursor) {
        migrateAssignments();
        return;
      }

      const row = cursor.value as Record<string, unknown>;
      const profile = parseLegacyProfile(row.subject_profile);
      classSubjectIds.set(String(row.id), ensureSubject(profile));
      delete row.subject_profile;
      cursor.update(row);
      cursor.continue();
    };
  }
}
