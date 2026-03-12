/**
 * Table Import Service
 *
 * Parses and validates CSV content for sport table definitions.
 * Parsing and validation must NOT happen in the view layer.
 *
 * Expected CSV format:
 *   - First row: column headers (last column must be named "value")
 *   - Remaining rows: data values
 *   - Lines starting with "#" are treated as comments and ignored
 *   - Empty lines are skipped
 *
 * Example:
 *   min_meters,max_meters,value
 *   3200,9999,1
 *   2800,3199,2
 */

import type { Sport } from '@viccoboard/core';

export interface TableImportValidationError {
  row?: number;
  message: string;
}

export interface TableImportResult {
  valid: boolean;
  errors: TableImportValidationError[];
  /** Populated when valid === true */
  definition?: Omit<Sport.TableDefinition, 'id' | 'createdAt' | 'lastModified'>;
}

export class TableImportService {
  /**
   * Parse and validate a CSV string as a Sport.TableDefinition.
   *
   * @param name - Human-readable name for the table (used as the definition name)
   * @param csvContent - Raw CSV text content
   * @param description - Optional description metadata
   * @returns TableImportResult with validation errors or the parsed definition
   */
  parseCsv(
    name: string,
    csvContent: string,
    description?: string
  ): TableImportResult {
    const errors: TableImportValidationError[] = [];

    if (!name || !name.trim()) {
      errors.push({ message: 'Table name must not be empty.' });
    }

    if (!csvContent || !csvContent.trim()) {
      errors.push({ message: 'CSV content must not be empty.' });
      return { valid: false, errors };
    }

    const lines = csvContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));

    if (lines.length < 2) {
      errors.push({
        message:
          'CSV must contain at least a header row and one data row.'
      });
      return { valid: false, errors };
    }

    const headers = this.parseCsvRow(lines[0]);

    if (headers.length < 2) {
      errors.push({
        message:
          'CSV header must contain at least one key column and a "value" column.'
      });
      return { valid: false, errors };
    }

    const valueIndex = headers.lastIndexOf('value');
    if (valueIndex === -1) {
      errors.push({
        message: 'CSV header must include a column named "value".'
      });
      return { valid: false, errors };
    }

    const keyHeaders = headers.filter((h) => h !== 'value');

    const entries: Sport.TableEntry[] = [];

    for (let i = 1; i < lines.length; i++) {
      const rowNum = i + 1;
      const cells = this.parseCsvRow(lines[i]);

      if (cells.length !== headers.length) {
        errors.push({
          row: rowNum,
          message: `Row ${rowNum} has ${cells.length} columns but header has ${headers.length}.`
        });
        continue;
      }

      const rowKey: Record<string, string> = {};
      for (const header of keyHeaders) {
        const idx = headers.indexOf(header);
        const cell = cells[idx];
        if (cell === '') {
          errors.push({
            row: rowNum,
            message: `Row ${rowNum}: key column "${header}" must not be empty.`
          });
        }
        rowKey[header] = cell;
      }

      const rawValue = cells[valueIndex];
      if (rawValue === '') {
        errors.push({
          row: rowNum,
          message: `Row ${rowNum}: "value" column must not be empty.`
        });
      }

      entries.push({
        key: rowKey,
        value: rawValue
      });
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    // Build dimension metadata from key headers
    const dimensionValueMap = new Map<string, Set<string>>();
    for (const header of keyHeaders) {
      dimensionValueMap.set(header, new Set());
    }
    for (const entry of entries) {
      for (const [dim, val] of Object.entries(entry.key as Record<string, string>)) {
        dimensionValueMap.get(dim)?.add(val);
      }
    }

    const dimensions: Sport.TableDimension[] = keyHeaders.map((header) => ({
      name: 'custom' as Sport.TableDimension['name'],
      values: Array.from(dimensionValueMap.get(header) ?? [])
    }));

    const definition: Omit<Sport.TableDefinition, 'id' | 'createdAt' | 'lastModified'> = {
      name: name.trim(),
      type: 'simple',
      description: description?.trim(),
      source: 'imported',
      active: true,
      dimensions,
      mappingRules: [],
      entries
    };

    return { valid: true, errors: [], definition };
  }

  /**
   * Parse a single CSV row, handling quoted fields.
   */
  parseCsvRow(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];

      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }

    result.push(current.trim());
    return result;
  }
}
