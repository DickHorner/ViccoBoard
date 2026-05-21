import type {
  ClassGroup,
  ImportBatch,
  StudentGender
} from '@viccoboard/core';
import { normalizeStudentGender, isValidDateOnlyString } from '@viccoboard/core';
import { ImportBatchRepository } from '../repositories/import-batch.repository.js';
import { ImportBatchItemRepository } from '../repositories/import-batch-item.repository.js';
import { StudentRepository } from '../repositories/student.repository.js';

export interface ClassGroupGateway {
  findBySchoolYear(schoolYear: string): Promise<ClassGroup[]>;
  create(input: Omit<ClassGroup, 'id' | 'createdAt' | 'lastModified'>): Promise<ClassGroup>;
  delete(id: string): Promise<boolean>;
}

export interface StudentCsvFile {
  fileName: string;
  content: string;
}

export interface StudentCsvImportOptions {
  targetClassName?: string;
}

export interface StudentImportIssue {
  rowNumber: number;
  field: string;
  message: string;
  severity: 'error' | 'conflict' | 'warning';
}

export interface StudentImportCandidate {
  rowNumber: number;
  fileName: string;
  firstName: string;
  lastName: string;
  className: string;
  classGroupId?: string;
  dateOfBirth: string | null;
  gender?: StudentGender;
  email?: string;
  status: 'ready' | 'skip_existing' | 'conflict' | 'invalid';
  issueMessages: string[];
}

export interface StudentImportPreview {
  sourceType: 'demo' | 'live';
  label: string;
  summary: ImportBatch['summary'];
  candidates: StudentImportCandidate[];
  issues: StudentImportIssue[];
}

export interface StudentImportExecutionResult extends StudentImportPreview {
  batchId: string;
}

interface ParsedStudentRow {
  rowNumber: number;
  fileName: string;
  firstName: string;
  lastName: string;
  className: string;
  dateOfBirth: string | null;
  gender?: StudentGender;
  email?: string;
  validationErrors: string[];
}

const HEADER_ALIASES = {
  vorname: ['vorname', 'firstname', 'first_name', 'first name'],
  nachname: ['nachname', 'lastname', 'last_name', 'last name', 'surname'],
  klasse: ['klasse', 'class', 'jahrgang', 'stufe'],
  teilklasse: ['teilklasse', 'classsuffix', 'subclass', 'zug', 'gruppe', 'teilklasse/zug'],
  geburtsdatum: ['geburtsdatum', 'dateofbirth', 'date_of_birth', 'dob', 'birthdate'],
  geschlecht: ['geschlecht', 'gender', 'sex'],
  'e-mail': ['e-mail', 'email', 'mail']
};

type HeaderIndex = Partial<Record<keyof typeof HEADER_ALIASES, number>>;

const REQUIRED_HEADERS = ['vorname', 'nachname'] as const;

export class StudentCsvImportUseCase {
  constructor(
    private studentRepository: StudentRepository,
    private classGroupGateway: ClassGroupGateway,
    private importBatchRepository: ImportBatchRepository,
    private importBatchItemRepository: ImportBatchItemRepository
  ) {}

  async preview(
    files: StudentCsvFile[],
    sourceType: 'demo' | 'live',
    label: string,
    options: StudentCsvImportOptions = {}
  ): Promise<StudentImportPreview> {
    return this.buildPreview(files, sourceType, label, options);
  }

  async execute(
    files: StudentCsvFile[],
    sourceType: 'demo' | 'live',
    label: string,
    options: StudentCsvImportOptions = {}
  ): Promise<StudentImportExecutionResult> {
    const preview = await this.buildPreview(files, sourceType, label, options);

    const batch = await this.importBatchRepository.create({
      sourceType,
      importType: 'student_csv',
      label,
      summary: preview.summary,
      metadata: {
        files: files.map((file) => file.fileName),
        targetClassName: options.targetClassName
      }
    });

    const createdClassGroups = new Map<string, ClassGroup>();
    const schoolYear = this.getCurrentSchoolYear();

    for (const candidate of preview.candidates) {
      if (candidate.status === 'invalid' || candidate.status === 'conflict') {
        await this.importBatchItemRepository.create({
          batchId: batch.id,
          entityType: 'student',
          entityId: `row-${candidate.rowNumber}`,
          action: candidate.status === 'conflict' ? 'conflict' : 'skipped',
          payload: {
            rowNumber: candidate.rowNumber,
            messages: candidate.issueMessages
          }
        });
        continue;
      }

      if (candidate.status === 'skip_existing') {
        const existing = candidate.dateOfBirth
          ? await this.studentRepository.findExactIdentityMatch({
              firstName: candidate.firstName,
              lastName: candidate.lastName,
              classGroupId: candidate.classGroupId as string,
              dateOfBirth: candidate.dateOfBirth
            })
          : null;

        await this.importBatchItemRepository.create({
          batchId: batch.id,
          entityType: 'student',
          entityId: existing?.id ?? `row-${candidate.rowNumber}`,
          action: 'skipped',
          payload: {
            rowNumber: candidate.rowNumber,
            reason: 'already_exists'
          }
        });
        continue;
      }

      const classGroup = await this.ensureClassGroup(candidate.className, schoolYear, createdClassGroups);
      if (!candidate.classGroupId) {
        candidate.classGroupId = classGroup.id;
      }

      if (createdClassGroups.get(candidate.className) === classGroup) {
        const classItems = await this.importBatchItemRepository.findByBatchId(batch.id);
        if (!classItems.some((item) => item.entityType === 'class_group' && item.entityId === classGroup.id)) {
          await this.importBatchItemRepository.create({
            batchId: batch.id,
            entityType: 'class_group',
            entityId: classGroup.id,
            action: 'created',
            payload: {
              className: candidate.className
            }
          });
        }
      }

      const student = await this.studentRepository.create({
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        dateOfBirth: candidate.dateOfBirth,
        gender: candidate.gender,
        classGroupId: classGroup.id,
        contactInfo: {
          email: candidate.email
        },
        legacyDateOfBirthMissing: !candidate.dateOfBirth
      });

      await this.importBatchItemRepository.create({
        batchId: batch.id,
        entityType: 'student',
        entityId: student.id,
        action: 'created',
        payload: {
          rowNumber: candidate.rowNumber,
          classGroupId: classGroup.id
        }
      });
    }

    return {
      ...preview,
      batchId: batch.id
    };
  }

  async deleteDemoData(): Promise<{ deletedStudents: number; deletedClassGroups: number; batches: number }> {
    const demoBatches = await this.importBatchRepository.findBySourceType('demo');
    const classGroupIds = new Set<string>();
    const deletedStudentIds = new Set<string>();

    for (const batch of demoBatches) {
      const items = await this.importBatchItemRepository.findByBatchId(batch.id);
      for (const item of items) {
        if (item.entityType === 'student' && item.action === 'created') {
          await this.studentRepository.delete(item.entityId);
          deletedStudentIds.add(item.entityId);
        }
        if (item.entityType === 'class_group' && item.action === 'created') {
          classGroupIds.add(item.entityId);
        }
        await this.importBatchItemRepository.delete(item.id);
      }

      await this.importBatchRepository.delete(batch.id);
    }

    let deletedClassGroups = 0;
    for (const classGroupId of classGroupIds) {
      const remainingStudents = await this.studentRepository.findByClassGroup(classGroupId);
      if (remainingStudents.length === 0) {
        const deleted = await this.classGroupGateway.delete(classGroupId);
        if (deleted) {
          deletedClassGroups += 1;
        }
      }
    }

    return {
      deletedStudents: deletedStudentIds.size,
      deletedClassGroups,
      batches: demoBatches.length
    };
  }

  private async buildPreview(
    files: StudentCsvFile[],
    sourceType: 'demo' | 'live',
    label: string,
    options: StudentCsvImportOptions
  ): Promise<StudentImportPreview> {
    const issues: StudentImportIssue[] = [];
    const candidates: StudentImportCandidate[] = [];
    const schoolYear = this.getCurrentSchoolYear();
    const existingClassGroups = await this.classGroupGateway.findBySchoolYear(schoolYear);
    const classGroupByName = new Map(existingClassGroups.map((group) => [group.name.toLowerCase(), group]));
    const seenKeys = new Map<string, number>();

    for (const file of files) {
      const parsed = this.parseCsvFile(file, issues, options);
      for (const row of parsed) {
        const candidateIssues = [...row.validationErrors];
        const identityKey = this.buildIdentityKey(row);

        if (seenKeys.has(identityKey)) {
          const firstRow = seenKeys.get(identityKey) as number;
          issues.push({
            rowNumber: row.rowNumber,
            field: 'row',
            message: `Doppelte Zeile im Import (erste Zeile ${firstRow})`,
            severity: 'error'
          });
          candidateIssues.push(`Doppelte Zeile im Import (erste Zeile ${firstRow})`);
        } else {
          seenKeys.set(identityKey, row.rowNumber);
        }

        const existingClassGroup = classGroupByName.get(row.className.toLowerCase());
        const existingStudent = existingClassGroup && row.dateOfBirth
          ? await this.studentRepository.findExactIdentityMatch({
              firstName: row.firstName,
              lastName: row.lastName,
              classGroupId: existingClassGroup.id,
              dateOfBirth: row.dateOfBirth
            })
          : null;

        const emailMatches = row.email ? await this.studentRepository.findByEmail(row.email) : [];

        let status: StudentImportCandidate['status'] = 'ready';
        if (candidateIssues.length > 0) {
          status = 'invalid';
        } else if (existingStudent) {
          const sameEmail = !row.email || (existingStudent.contactInfo?.email ?? '') === row.email;
          const sameGender = !row.gender || existingStudent.gender === row.gender;
          status = sameEmail && sameGender ? 'skip_existing' : 'conflict';
          if (status === 'conflict') {
            const message = 'Vorhandener Schüler mit abweichenden Stammdaten gefunden';
            issues.push({
              rowNumber: row.rowNumber,
              field: 'row',
              message,
              severity: 'conflict'
            });
            candidateIssues.push(message);
          }
        } else if (emailMatches.length > 0) {
          status = 'conflict';
          const message = 'E-Mail ist bereits bei einem anderen Schüler vergeben';
          issues.push({
            rowNumber: row.rowNumber,
            field: 'e-mail',
            message,
            severity: 'conflict'
          });
          candidateIssues.push(message);
        }

        candidates.push({
          rowNumber: row.rowNumber,
          fileName: row.fileName,
          firstName: row.firstName,
          lastName: row.lastName,
          className: row.className,
          classGroupId: existingClassGroup?.id,
          dateOfBirth: row.dateOfBirth,
          gender: row.gender,
          email: row.email,
          status,
          issueMessages: candidateIssues
        });
      }
    }

    const summary = {
      read: candidates.length,
      valid: candidates.filter((candidate) => candidate.status === 'ready' || candidate.status === 'skip_existing').length,
      imported: candidates.filter((candidate) => candidate.status === 'ready').length,
      skipped: candidates.filter((candidate) => candidate.status === 'skip_existing').length,
      conflicts: candidates.filter((candidate) => candidate.status === 'conflict').length,
      errors: issues.filter((issue) => issue.severity === 'error').length
    };

    return {
      sourceType,
      label,
      summary,
      candidates,
      issues
    };
  }

  private parseCsvFile(
    file: StudentCsvFile,
    issues: StudentImportIssue[],
    options: StudentCsvImportOptions
  ): ParsedStudentRow[] {
    const rows = this.parseCsv(file.content);
    if (rows.length === 0) {
      return [];
    }

    const headerMatch = this.findHeaderRow(rows, issues, Boolean(options.targetClassName?.trim()));
    if (!headerMatch) {
      return [];
    }

    const parsedRows: ParsedStudentRow[] = [];
    for (let rowIndex = headerMatch.rowIndex + 1; rowIndex < rows.length; rowIndex += 1) {
      const cells = rows[rowIndex];
      if (cells.every((cell) => cell.trim() === '')) {
        continue;
      }

      const rowNumber = rowIndex + 1;
      const firstName = this.getCell(cells, headerMatch.headers.vorname);
      const lastName = this.getCell(cells, headerMatch.headers.nachname);
      const classLevel = this.getCell(cells, headerMatch.headers.klasse);
      const subClass = this.getCell(cells, headerMatch.headers.teilklasse);
      const rawDateOfBirth = this.getCell(cells, headerMatch.headers.geburtsdatum);
      const rawGender = this.getCell(cells, headerMatch.headers.geschlecht);
      const rawEmail = this.getCell(cells, headerMatch.headers['e-mail']);
      const gender = rawGender ? normalizeStudentGender(rawGender) : undefined;
      const email = rawEmail || undefined;
      const dateOfBirth = rawDateOfBirth || null;
      const className = options.targetClassName?.trim() || (subClass ? `${classLevel}${subClass}`.trim() : classLevel.trim());
      const validationErrors: string[] = [];

      if (!firstName) {
        const message = 'Vorname fehlt';
        issues.push({ rowNumber, field: 'vorname', message, severity: 'error' });
        validationErrors.push(message);
      }
      if (!lastName) {
        const message = 'Nachname fehlt';
        issues.push({ rowNumber, field: 'nachname', message, severity: 'error' });
        validationErrors.push(message);
      }
      if (!className) {
        const message = 'Klasse fehlt';
        issues.push({ rowNumber, field: 'klasse', message, severity: 'error' });
        validationErrors.push(message);
      }
      if (rawDateOfBirth && !isValidDateOnlyString(rawDateOfBirth)) {
        const message = 'Ungültiges Geburtsdatum';
        issues.push({ rowNumber, field: 'geburtsdatum', message, severity: 'error' });
        validationErrors.push(message);
      }
      if (rawGender && !gender) {
        const message = 'Geschlecht muss m oder f sein';
        issues.push({ rowNumber, field: 'geschlecht', message, severity: 'warning' });
      }
      if (email && !this.isValidEmail(email)) {
        const message = 'Ungültige E-Mail';
        issues.push({ rowNumber, field: 'e-mail', message, severity: 'warning' });
      }

      parsedRows.push({
        rowNumber,
        fileName: file.fileName,
        firstName,
        lastName,
        className,
        dateOfBirth,
        gender,
        email: email && this.isValidEmail(email) ? email : undefined,
        validationErrors
      });
    }

    return parsedRows;
  }

  private findHeaderRow(
    rows: string[][],
    issues: StudentImportIssue[],
    hasTargetClassName: boolean
  ): { rowIndex: number; headers: HeaderIndex } | null {
    const rowsToInspect = rows.slice(0, Math.min(rows.length, 5));

    for (let rowIndex = 0; rowIndex < rowsToInspect.length; rowIndex += 1) {
      const headers = this.resolveHeaders(rowsToInspect[rowIndex], hasTargetClassName);
      if (headers) {
        return { rowIndex, headers };
      }
    }

    const required = hasTargetClassName ? 'vorname, nachname' : 'vorname, nachname, klasse';
    issues.push({
      rowNumber: 1,
      field: 'header',
      message: `Keine passende Kopfzeile gefunden. Erwartete Spalten: ${required}`,
      severity: 'error'
    });
    return null;
  }

  private resolveHeaders(header: string[], hasTargetClassName: boolean): HeaderIndex | null {
    const normalizedHeader = header.map((cell) => cell.trim().toLowerCase());
    const result: HeaderIndex = {};

    for (const [headerName, aliases] of Object.entries(HEADER_ALIASES)) {
      const index = normalizedHeader.findIndex((entry) => aliases.includes(entry));
      if (index !== -1) {
        result[headerName as keyof typeof HEADER_ALIASES] = index;
      }
    }

    const hasRequiredHeaders = REQUIRED_HEADERS.every((field) => result[field] !== undefined);
    if (!hasRequiredHeaders) {
      return null;
    }

    if (!hasTargetClassName && result.klasse === undefined) {
      return null;
    }

    return result;
  }

  private getCell(cells: string[], index?: number): string {
    if (index === undefined) {
      return '';
    }

    return (cells[index] ?? '').trim();
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

  private buildIdentityKey(row: ParsedStudentRow): string {
    return [
      row.firstName.trim().toLowerCase(),
      row.lastName.trim().toLowerCase(),
      row.className.trim().toLowerCase(),
      row.dateOfBirth ?? ''
    ].join('|');
  }

  private isValidEmail(email: string): boolean {
    if (email.length > 254) {
      return false;
    }

    if (email.includes(' ') || email.includes('\t') || email.includes('\n') || email.includes('\r')) {
      return false;
    }

    const atIndex = email.indexOf('@');
    if (atIndex <= 0 || atIndex !== email.lastIndexOf('@')) {
      return false;
    }

    const domain = email.slice(atIndex + 1);
    const dotIndex = domain.lastIndexOf('.');

    return dotIndex > 0 && dotIndex < domain.length - 1;
  }

  private getCurrentSchoolYear(referenceDate: Date = new Date()): string {
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    return month >= 6 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
  }

  private async ensureClassGroup(
    className: string,
    schoolYear: string,
    createdClassGroups: Map<string, ClassGroup>
  ): Promise<ClassGroup> {
    const existingCreated = createdClassGroups.get(className);
    if (existingCreated) {
      return existingCreated;
    }

    const existing = (await this.classGroupGateway.findBySchoolYear(schoolYear))
      .find((classGroup) => classGroup.name.toLowerCase() === className.toLowerCase());
    if (existing) {
      return existing;
    }

    const created = await this.classGroupGateway.create({
      name: className,
      schoolYear,
      gradingScheme: 'default',
      archived: false
    });
    createdClassGroups.set(className, created);
    return created;
  }
}
