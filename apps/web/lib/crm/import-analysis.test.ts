// @vitest-environment node
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { decodeCsvBytes } from './csv';
import {
  analyzeImport,
  buildImportRows,
  checksumOf,
  cleanFileName,
  importPayloadSchema,
} from './import-analysis';

const CSV =
  'Nombre;Email;Teléfono;Empresa\nAna;ana@x.es;;Foo\nSin contacto;;;Bar\n"Pérez, Luis";;+34 600 000 111;\n';

describe('analyzeImport', () => {
  it('parses, guesses the mapping and gives a verdict per row with its line', () => {
    const out = analyzeImport(CSV, null);
    expect(out.separator).toBe(';');
    expect(out.mapping).toMatchObject({ display_name: 0, email: 1, phone: 2, organization: 3 });
    expect(out.total).toBe(3);
    expect(out.valid).toBe(2);
    expect(out.invalid).toEqual([{ line: 3, error: 'unreachable' }]);
    expect(out.preview.map((r) => r.line)).toEqual([2, 3, 4]);
    expect(out.preview[1]?.error).toBe('unreachable');
    expect(out.samples[0]).toBe('Ana');
  });

  it('caps the preview at 20 rows', () => {
    const csv =
      'nombre,email\n' + Array.from({ length: 30 }, (_, i) => `n${i},n${i}@x.es`).join('\n');
    const out = analyzeImport(csv, null);
    expect(out.preview).toHaveLength(20);
    expect(out.total).toBe(30);
  });

  it('uses the mapping it is given instead of guessing', () => {
    const out = analyzeImport(CSV, { display_name: 3, email: 1 });
    expect(out.mapping).toEqual({ display_name: 3, email: 1 });
    expect(out.valid).toBe(1);
  });

  it('refuses a mapping that points beyond the columns', () => {
    expect(() => analyzeImport(CSV, { display_name: 0, email: 9 })).toThrow('bad_mapping');
  });
});

describe('buildImportRows', () => {
  it('keeps every record in its place so the line numbers of the database are the ones of the file; invalid ones go empty', () => {
    const { rows, valid } = buildImportRows(CSV, {
      display_name: 0,
      email: 1,
      phone: 2,
      organization: 3,
    });
    expect(rows).toHaveLength(3);
    expect(rows[1]).toEqual({});
    expect(rows[0]).toMatchObject({
      display_name: 'Ana',
      email: 'ana@x.es',
      organization: 'Foo',
      kind: 'lead',
      tags: [],
    });
    expect(valid).toBe(2);
  });

  it('needs at least one valid row and a name column', () => {
    expect(() => buildImportRows('a\nb', { display_name: 0 })).toThrow('no_valid_rows');
    expect(() => buildImportRows(CSV, { email: 1 })).toThrow('bad_mapping');
  });
});

describe('checksumOf', () => {
  it('is a sha-256 hex that does not change with BOM or line endings', async () => {
    const a = await checksumOf('﻿a;b\r\n1;2\r\n');
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(await checksumOf('a;b\n1;2')).toBe(a);
    expect(await checksumOf('a;b\n1;3')).not.toBe(a);
  });
});

describe('importPayloadSchema', () => {
  const checksum = 'a'.repeat(64);
  it('takes valid rows and the empty ones that stand for invalid records', () => {
    const rows = [{ display_name: 'Ana', email: 'ana@x.es', kind: 'lead', tags: [] }, {}];
    expect(importPayloadSchema.safeParse({ rows, file_name: 'a.csv', checksum }).success).toBe(
      true,
    );
  });
  it('refuses a row that is neither, extra fields and more than 500 rows', () => {
    expect(
      importPayloadSchema.safeParse({
        rows: [{ display_name: 'Ana' }],
        file_name: 'a.csv',
        checksum,
      }).success,
    ).toBe(false);
    expect(
      importPayloadSchema.safeParse({ rows: [{ owner_id: 'x' }], file_name: 'a.csv', checksum })
        .success,
    ).toBe(false);
    expect(
      importPayloadSchema.safeParse({ rows: Array(501).fill({}), file_name: 'a.csv', checksum })
        .success,
    ).toBe(false);
    expect(
      importPayloadSchema.safeParse({ rows: [{}], file_name: 'a.csv', checksum: 'nope' }).success,
    ).toBe(false);
  });
});

describe('cleanFileName', () => {
  it('keeps only the name of the file', () => {
    expect(cleanFileName('C:\\Users\\ana\\feria.csv')).toBe('feria.csv');
    expect(cleanFileName('../../etc/passwd\u0000.csv')).toBe('passwd.csv');
    expect(cleanFileName('   ')).toBe('import.csv');
    expect(cleanFileName('x'.repeat(300))).toHaveLength(255);
  });
});

describe('e2e/fixtures/contacts-30.csv', () => {
  // the file the E2E spec uploads: Excel-style (BOM, CRLF, «;»), 30 rows of which exactly one has no way to reach the person
  const text = decodeCsvBytes(
    readFileSync(new URL('../../e2e/fixtures/contacts-30.csv', import.meta.url)),
  );
  it('is 29 valid rows and 1 invalid, with the mapping guessed', () => {
    const out = analyzeImport(text, null);
    expect(out).toMatchObject({ total: 30, valid: 29, separator: ';' });
    expect(out.invalid).toEqual([{ line: 31, error: 'unreachable' }]);
    expect(out.mapping).toMatchObject({
      display_name: 0,
      email: 1,
      phone: 2,
      organization: 3,
      kind: 4,
      notes: 5,
    });
  });
  it('keeps a formula as plain text', () => {
    const { rows } = buildImportRows(text, analyzeImport(text, null).mapping);
    expect(
      rows.some((row) => 'display_name' in row && row.display_name.startsWith('=HYPERLINK(')),
    ).toBe(true);
  });
});
