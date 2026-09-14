import type { ClassGroup, Student, StudentCalendarEntry } from '@viccoboard/core';
import { StudentCalendarEntryRepository } from '../repositories/student-calendar-entry.repository.js';
import { StudentRepository } from '../repositories/student.repository.js';

export interface IservClassGroupGateway {
  findAll(): Promise<ClassGroup[]>;
}

export interface IservArchiveTextFile {
  path: string;
  content: string;
}

export interface IservAbsenceImportIssue {
  filePath: string;
  rowNumber?: number;
  message: string;
  severity: 'error' | 'conflict' | 'warning';
}

export interface IservAbsenceImportCandidate {
  filePath: string;
  rowNumber: number;
  className: string;
  studentFolder: string;
  studentId?: string;
  studentName?: string;
  startDate?: string;
  endDate?: string;
  period?: string;
  compulsoryLessons?: string;
  missedDays?: number;
  missedHours?: number;
  missedMinutes?: number;
  statusText?: string;
  sourceKey?: string;
  status: 'ready' | 'skip_existing' | 'conflict' | 'invalid';
  issueMessages: string[];
}

export interface IservAbsenceImportSummary {
  files: number;
  detailFiles: number;
  rows: number;
  ready: number;
  skipped: number;
  conflicts: number;
  errors: number;
}

export interface IservAbsenceImportPreview {
  summary: IservAbsenceImportSummary;
  candidates: IservAbsenceImportCandidate[];
  issues: IservAbsenceImportIssue[];
}

export interface IservAbsenceImportExecutionResult extends IservAbsenceImportPreview {
  imported: number;
}

interface DetailedHeaderIndex {
  datum: number;
  zeitraum: number;
  verpflichtenderUnterricht: number;
  fehltage: number;
  fehlstunden: number;
  fehlminuten: number;
  status: number;
}

interface PathContext {
  className: string;
  studentFolder: string;
}

const DETAIL_HEADERS: Record<keyof DetailedHeaderIndex, string[]> = {
  datum: ['datum'],
  zeitraum: ['zeitraum'],
  verpflichtenderUnterricht: ['verp unterricht', 'verpflichtender unterricht'],
  fehltage: ['fehltage'],
  fehlstunden: ['fehlstunden'],
  fehlminuten: ['fehlminuten'],
  status: ['status']
};

export class IservAbsenceImportUseCase {
  constructor(
    private studentRepository: StudentRepository,
    private classGroupGateway: IservClassGroupGateway,
    private calendarEntryRepository: StudentCalendarEntryRepository
  ) {}

  async preview(files: IservArchiveTextFile[]): Promise<IservAbsenceImportPreview> {
    const [students, classGroups, existingEntries] = await Promise.all([
      this.studentRepository.findAll(),
      this.classGroupGateway.findAll(),
      this.calendarEntryRepository.findAll()
    ]);

    const issues: IservAbsenceImportIssue[] = [];
    const candidates: IservAbsenceImportCandidate[] = [];
    const existingSourceKeys = new Set(
      existingEntries
        .filter((entry) => entry.source === 'iserv' && entry.sourceKey)
        .map((entry) => entry.sourceKey as string)
    );
    const archiveSourceKeys = new Set<string>();
    let detailFiles = 0;

    for (const file of files) {
      const rows = this.parseCsv(file.content);
      const headerMatch = this.findDetailedHeader(rows);
      if (!headerMatch) {
        continue;
      }

      detailFiles += 1;
      const pathContext = this.parsePathContext(file.path);
      if (!pathContext) {
        issues.push({
          filePath: file.path,
          message: 'Dateipfad entspricht nicht der erwarteten IServ-Struktur Klasse/Schüler/CSV.',
          severity: 'error'
        });
        continue;
      }

      const classMatches = this.findClassMatches(classGroups, pathContext.className);
      const classGroup = classMatches.length === 1 ? classMatches[0] : undefined;
      const studentMatches = classGroup
        ? this.findStudentMatches(students, classGroup.id, pathContext.studentFolder)
        : [];
      const matchedStudent = studentMatches.length === 1 ? studentMatches[0] : undefined;

      for (let rowIndex = headerMatch.rowIndex + 1; rowIndex < rows.length; rowIndex += 1) {
        const cells = rows[rowIndex];
        if (cells.every((cell) => cell.trim() === '')) {
          continue;
        }

        const rowNumber = rowIndex + 1;
        const issueMessages: string[] = [];
        let candidateStatus: IservAbsenceImportCandidate['status'] = 'ready';

        if (classMatches.length !== 1) {
          const message = classMatches.length === 0
            ? `Klasse "${pathContext.className}" wurde in ViccoBoard nicht gefunden.`
            : `Klasse "${pathContext.className}" ist in ViccoBoard nicht eindeutig.`;
          issueMessages.push(message);
          issues.push({ filePath: file.path, rowNumber, message, severity: 'conflict' });
          candidateStatus = 'conflict';
        } else if (studentMatches.length !== 1) {
          const message = studentMatches.length === 0
            ? `Schülerordner "${pathContext.studentFolder}" konnte keinem Schüler der Klasse zugeordnet werden.`
            : `Schülerordner "${pathContext.studentFolder}" ist nicht eindeutig.`;
          issueMessages.push(message);
          issues.push({ filePath: file.path, rowNumber, message, severity: 'conflict' });
          candidateStatus = 'conflict';
        }

        const rawDate = this.getCell(cells, headerMatch.headers.datum);
        const startDate = this.normalizeDate(rawDate);
        if (!startDate) {
          const message = `Ungültiges Datum "${rawDate}".`;
          issueMessages.push(message);
          issues.push({ filePath: file.path, rowNumber, message, severity: 'error' });
          candidateStatus = 'invalid';
        }

        const period = this.optionalCell(cells, headerMatch.headers.zeitraum);
        const compulsoryLessons = this.optionalCell(cells, headerMatch.headers.verpflichtenderUnterricht);
        const statusText = this.optionalCell(cells, headerMatch.headers.status);
        const missedDays = this.parseNonNegativeNumber(
          this.getCell(cells, headerMatch.headers.fehltage),
          'Fehltage',
          file.path,
          rowNumber,
          issues,
          issueMessages
        );
        const missedHours = this.parseNonNegativeNumber(
          this.getCell(cells, headerMatch.headers.fehlstunden),
          'Fehlstunden',
          file.path,
          rowNumber,
          issues,
          issueMessages
        );
        const missedMinutes = this.parseNonNegativeNumber(
          this.getCell(cells, headerMatch.headers.fehlminuten),
          'Fehlminuten',
          file.path,
          rowNumber,
          issues,
          issueMessages
        );

        if (issueMessages.some((message) => message.startsWith('Ungültiger Zahlenwert'))) {
          candidateStatus = 'invalid';
        }

        const sourceKey = matchedStudent && startDate
          ? this.buildSourceKey({
              studentId: matchedStudent.id,
              startDate,
              period,
              compulsoryLessons,
              statusText,
              missedDays,
              missedHours,
              missedMinutes
            })
          : undefined;

        if (candidateStatus === 'ready' && sourceKey) {
          if (existingSourceKeys.has(sourceKey) || archiveSourceKeys.has(sourceKey)) {
            candidateStatus = 'skip_existing';
          } else {
            archiveSourceKeys.add(sourceKey);
          }
        }

        candidates.push({
          filePath: file.path,
          rowNumber,
          className: pathContext.className,
          studentFolder: pathContext.studentFolder,
          studentId: matchedStudent?.id,
          studentName: matchedStudent ? `${matchedStudent.firstName} ${matchedStudent.lastName}` : undefined,
          startDate: startDate ?? undefined,
          endDate: startDate ?? undefined,
          period,
          compulsoryLessons,
          missedDays,
          missedHours,
          missedMinutes,
          statusText,
          sourceKey,
          status: candidateStatus,
          issueMessages
        });
      }
    }

    if (detailFiles === 0) {
      issues.push({
        filePath: '',
        message: 'Keine Detail-CSV mit den erwarteten IServ-Abwesenheitsspalten gefunden.',
        severity: 'error'
      });
    }

    return {
      summary: {
        files: files.length,
        detailFiles,
        rows: candidates.length,
        ready: candidates.filter((candidate) => candidate.status === 'ready').length,
        skipped: candidates.filter((candidate) => candidate.status === 'skip_existing').length,
        conflicts: candidates.filter((candidate) => candidate.status === 'conflict').length,
        errors: issues.filter((issue) => issue.severity === 'error').length
      },
      candidates,
      issues
    };
  }

  async execute(files: IservArchiveTextFile[]): Promise<IservAbsenceImportExecutionResult> {
    const preview = await this.preview(files);
    let imported = 0;

    for (const candidate of preview.candidates) {
      if (
        candidate.status !== 'ready'
        || !candidate.studentId
        || !candidate.startDate
        || !candidate.endDate
        || !candidate.sourceKey
      ) {
        continue;
      }

      await this.calendarEntryRepository.create({
        studentId: candidate.studentId,
        type: 'absence',
        startDate: candidate.startDate,
        endDate: candidate.endDate,
        status: candidate.statusText,
        period: candidate.period,
        compulsoryLessons: candidate.compulsoryLessons,
        missedDays: candidate.missedDays,
        missedHours: candidate.missedHours,
        missedMinutes: candidate.missedMinutes,
        source: 'iserv',
        sourceKey: candidate.sourceKey
      });
      imported += 1;
    }

    return {
      ...preview,
      imported
    };
  }

  private findDetailedHeader(
    rows: string[][]
  ): { rowIndex: number; headers: DetailedHeaderIndex } | null {
    for (let rowIndex = 0; rowIndex < Math.min(rows.length, 5); rowIndex += 1) {
      const normalized = rows[rowIndex].map((cell) => this.normalizeHeader(cell));
      const indexes: Partial<DetailedHeaderIndex> = {};

      for (const [key, aliases] of Object.entries(DETAIL_HEADERS)) {
        const index = normalized.findIndex((header) => aliases.includes(header));
        if (index !== -1) {
          indexes[key as keyof DetailedHeaderIndex] = index;
        }
      }

      if (Object.keys(DETAIL_HEADERS).every((key) => indexes[key as keyof DetailedHeaderIndex] !== undefined)) {
        return { rowIndex, headers: indexes as DetailedHeaderIndex };
      }
    }

    return null;
  }

  private parsePathContext(path: string): PathContext | null {
    const segments = path
      .replace(/\\/g, '/')
      .split('/')
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (segments.length < 3) {
      return null;
    }

    return {
      className: segments[segments.length - 3],
      studentFolder: segments[segments.length - 2]
    };
  }

  private findClassMatches(classGroups: ClassGroup[], className: string): ClassGroup[] {
    const normalizedClassName = this.normalizeKey(className);
    const matching = classGroups.filter((group) => this.normalizeKey(group.name) === normalizedClassName);
    const active = matching.filter((group) => !group.archived);
    return active.length > 0 ? active : matching;
  }

  private findStudentMatches(students: Student[], classGroupId: string, studentFolder: string): Student[] {
    const normalizedFolder = this.normalizeKey(studentFolder);
    return students.filter((student) => {
      if (student.classGroupId !== classGroupId) {
        return false;
      }

      const prefix = `${this.normalizeKey(student.lastName)}_${this.normalizeKey(student.firstName)}_`;
      return normalizedFolder.startsWith(prefix);
    });
  }

  private buildSourceKey(input: {
    studentId: string;
    startDate: string;
    period?: string;
    compulsoryLessons?: string;
    statusText?: string;
    missedDays?: number;
    missedHours?: number;
    missedMinutes?: number;
  }): string {
    return [
      'iserv',
      input.studentId,
      input.startDate,
      this.normalizeKey(input.period ?? ''),
      this.normalizeKey(input.compulsoryLessons ?? ''),
      this.normalizeKey(input.statusText ?? ''),
      input.missedDays ?? '',
      input.missedHours ?? '',
      input.missedMinutes ?? ''
    ].join('|');
  }

  private normalizeDate(value: string): string | null {
    const trimmed = value.trim();
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (isoMatch) {
      return this.isValidDateParts(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]))
        ? trimmed
        : null;
    }

    const germanMatch = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(trimmed);
    if (!germanMatch) {
      return null;
    }

    const day = Number(germanMatch[1]);
    const month = Number(germanMatch[2]);
    const year = Number(germanMatch[3]);
    if (!this.isValidDateParts(year, month, day)) {
      return null;
    }

    return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }

  private isValidDateParts(year: number, month: number, day: number): boolean {
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year
      && date.getUTCMonth() === month - 1
      && date.getUTCDate() === day;
  }

  private parseNonNegativeNumber(
    rawValue: string,
    field: string,
    filePath: string,
    rowNumber: number,
    issues: IservAbsenceImportIssue[],
    issueMessages: string[]
  ): number | undefined {
    const value = rawValue.trim();
    if (!value) {
      return undefined;
    }

    const parsed = Number(value.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed < 0) {
      const message = `Ungültiger Zahlenwert in ${field}: "${value}".`;
      issueMessages.push(message);
      issues.push({ filePath, rowNumber, message, severity: 'error' });
      return undefined;
    }

    return parsed;
  }

  private parseCsv(content: string): string[][] {
    const delimiter = this.detectDelimiter(content);
    const rows: string[][] = [];
    let currentCell = '';
    let currentRow: string[] = [];
    let inQuotes = false;

    for (let index = 0; index < content.length; index += 1) {
      const char = content[index];
      const nextChar = content[index + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentCell += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === delimiter && !inQuotes) {
        currentRow.push(currentCell);
        currentCell = '';
        continue;
      }

      if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          index += 1;
        }
        currentRow.push(currentCell);
        rows.push(currentRow);
        currentCell = '';
        currentRow = [];
        continue;
      }

      currentCell += char;
    }

    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell);
      rows.push(currentRow);
    }

    return rows;
  }

  private detectDelimiter(content: string): ',' | ';' | '\t' {
    const lines = content
      .split(/\r?\n/)
      .filter((line) => line.trim())
      .slice(0, 5);
    const candidates: Array<',' | ';' | '\t'> = [',', ';', '\t'];

    return candidates
      .map((delimiter) => ({
        delimiter,
        count: Math.max(...lines.map((line) => line.split(delimiter).length), 1)
      }))
      .sort((left, right) => right.count - left.count)[0]?.delimiter ?? ',';
  }

  private normalizeHeader(value: string): string {
    return value
      .replace(/^\uFEFF/, '')
      .trim()
      .toLocaleLowerCase('de-DE')
      .replace(/[._:/\\-]+/g, ' ')
      .replace(/\s+/g, ' ');
  }

  private normalizeKey(value: string): string {
    return value.trim().normalize('NFKC').toLocaleLowerCase('de-DE');
  }

  private getCell(cells: string[], index: number): string {
    return (cells[index] ?? '').trim();
  }

  private optionalCell(cells: string[], index: number): string | undefined {
    return this.getCell(cells, index) || undefined;
  }
}
