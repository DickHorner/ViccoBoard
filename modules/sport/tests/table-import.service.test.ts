import { TableImportService } from '../src/services/table-import.service';

describe('TableImportService', () => {
  let service: TableImportService;

  beforeEach(() => {
    service = new TableImportService();
  });

  describe('parseCsv – valid input', () => {
    test('parses a simple two-column CSV', () => {
      const csv = 'min_meters,value\n3200,1\n2800,2\n';
      const result = service.parseCsv('Cooper Table', csv);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.definition).toBeDefined();
      expect(result.definition!.name).toBe('Cooper Table');
      expect(result.definition!.source).toBe('imported');
      expect(result.definition!.active).toBe(true);
      expect(result.definition!.entries).toHaveLength(2);
      expect(result.definition!.entries[0].key).toEqual({ min_meters: '3200' });
      expect(result.definition!.entries[0].value).toBe('1');
    });

    test('parses a multi-key CSV', () => {
      const csv = 'min_meters,max_meters,value\n3200,9999,1\n2800,3199,2\n';
      const result = service.parseCsv('Cooper Table', csv);

      expect(result.valid).toBe(true);
      expect(result.definition!.entries).toHaveLength(2);
      expect(result.definition!.entries[1].key).toEqual({
        min_meters: '2800',
        max_meters: '3199'
      });
      expect(result.definition!.dimensions).toHaveLength(2);
    });

    test('ignores comment lines starting with #', () => {
      const csv = '# Cooper-Normen\nmin_meters,value\n# another comment\n3200,1\n2800,2\n';
      const result = service.parseCsv('Cooper Table', csv);

      expect(result.valid).toBe(true);
      expect(result.definition!.entries).toHaveLength(2);
    });

    test('skips blank lines', () => {
      const csv = 'min_meters,value\n\n3200,1\n\n2800,2\n';
      const result = service.parseCsv('Cooper Table', csv);

      expect(result.valid).toBe(true);
      expect(result.definition!.entries).toHaveLength(2);
    });

    test('uses provided description', () => {
      const csv = 'meters,value\n1000,3\n';
      const result = service.parseCsv('Test Table', csv, 'For class 7');

      expect(result.valid).toBe(true);
      expect(result.definition!.description).toBe('For class 7');
    });

    test('handles quoted CSV fields', () => {
      const csv = '"key col","value"\n"3200","1"\n';
      const result = service.parseCsv('Quoted Table', csv);

      expect(result.valid).toBe(true);
      expect(result.definition!.entries[0].key).toEqual({ 'key col': '3200' });
    });

    test('omits description when not provided', () => {
      const csv = 'meters,value\n1000,3\n';
      const result = service.parseCsv('Test Table', csv);

      expect(result.valid).toBe(true);
      expect(result.definition!.description).toBeUndefined();
    });

    test('sets type to simple', () => {
      const csv = 'meters,value\n1000,3\n';
      const result = service.parseCsv('Test Table', csv);

      expect(result.definition!.type).toBe('simple');
    });

    test('collects dimension values from entries', () => {
      const csv = 'age,value\n10,1\n12,2\n10,3\n';
      const result = service.parseCsv('Age Table', csv);

      expect(result.valid).toBe(true);
      const ageDim = result.definition!.dimensions.find((d) => d.name === 'custom');
      expect(ageDim).toBeDefined();
      expect(ageDim!.values.sort()).toEqual(['10', '12']);
    });
  });

  describe('parseCsv – invalid input', () => {
    test('returns error for empty name', () => {
      const csv = 'meters,value\n1000,3\n';
      const result = service.parseCsv('', csv);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('name'))).toBe(true);
    });

    test('returns error for empty CSV content', () => {
      const result = service.parseCsv('Table', '');

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    test('returns error when CSV has only comments', () => {
      const result = service.parseCsv('Table', '# only a comment\n');

      expect(result.valid).toBe(false);
    });

    test('returns error for header only (no data rows)', () => {
      const result = service.parseCsv('Table', 'meters,value\n');

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('header row and one data row'))).toBe(true);
    });

    test('returns error when value column is missing', () => {
      const csv = 'meters,grade\n1000,3\n';
      const result = service.parseCsv('Table', csv);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('"value"'))).toBe(true);
    });

    test('returns error for wrong column count in data row', () => {
      const csv = 'meters,value\n1000\n';
      const result = service.parseCsv('Table', csv);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('columns'))).toBe(true);
    });

    test('returns error when value cell is empty', () => {
      const csv = 'meters,value\n1000,\n';
      const result = service.parseCsv('Table', csv);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('"value"'))).toBe(true);
    });

    test('returns error when key cell is empty', () => {
      const csv = 'meters,value\n,3\n';
      const result = service.parseCsv('Table', csv);

      expect(result.valid).toBe(false);
    });

    test('returns error for header with only one column', () => {
      const csv = 'value\n1\n';
      const result = service.parseCsv('Table', csv);

      expect(result.valid).toBe(false);
    });
  });

  describe('parseCsvRow', () => {
    test('splits simple row', () => {
      expect(service.parseCsvRow('a,b,c')).toEqual(['a', 'b', 'c']);
    });

    test('handles quoted fields with commas', () => {
      expect(service.parseCsvRow('"a,b",c')).toEqual(['a,b', 'c']);
    });

    test('handles escaped quotes inside quoted field', () => {
      expect(service.parseCsvRow('"a""b",c')).toEqual(['a"b', 'c']);
    });

    test('trims whitespace around values', () => {
      expect(service.parseCsvRow(' a , b ')).toEqual(['a', 'b']);
    });
  });
});
