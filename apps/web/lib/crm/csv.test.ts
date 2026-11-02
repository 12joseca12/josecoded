import { describe, expect, it } from 'vitest';

import { CSV_MAX_BYTES, CSV_MAX_ROWS, decodeCsvBytes, normalizeCsvText, parseCsv } from './csv';

describe('parseCsv', () => {
  it('parses quoted fields, embedded separators and CRLF with BOM', () => {
    const out = parseCsv('﻿nombre;email;notas\r\n"Pérez, Ana";ana@x.es;"línea 1\nlínea 2"\r\n');
    expect(out.headers).toEqual(['nombre', 'email', 'notas']);
    expect(out.rows[0]).toEqual(['Pérez, Ana', 'ana@x.es', 'línea 1\nlínea 2']);
    expect(out.separator).toBe(';');
  });

  it('detects the comma and ignores separators inside quotes of the header', () => {
    expect(parseCsv('a,b,c\n1,2,3').separator).toBe(',');
    expect(parseCsv('"a;b",c\n1,2').separator).toBe(',');
    expect(parseCsv('"a,b";c\n1;2').separator).toBe(';');
    expect(parseCsv('solo\nx').separator).toBe(',');
  });

  it('unescapes doubled quotes and keeps a lone quote inside an unquoted field', () => {
    const out = parseCsv('a,b\n"di ""hola""",5" tall\n');
    expect(out.rows[0]).toEqual(['di "hola"', '5" tall']);
  });

  it('skips blank records', () => {
    expect(parseCsv('a,b\n1,2\n\n,\n3,4\n').rows).toEqual([
      ['1', '2'],
      ['3', '4'],
    ]);
  });

  it('accepts a missing final newline, a lone CR and pads short rows', () => {
    expect(parseCsv('a,b\r1,2').rows).toEqual([['1', '2']]);
    expect(parseCsv('a,b,c\n1').rows).toEqual([['1', '', '']]);
  });

  it('rejects more than 500 rows and more than 1 MB', () => {
    expect(() => parseCsv('a\n' + 'x\n'.repeat(CSV_MAX_ROWS + 1))).toThrow('too_many_rows');
    expect(parseCsv('a\n' + 'x\n'.repeat(CSV_MAX_ROWS)).rows).toHaveLength(CSV_MAX_ROWS);
    expect(() => parseCsv('a\n' + 'x'.repeat(CSV_MAX_BYTES + 1))).toThrow('too_large');
  });

  it('counts bytes, not characters', () => {
    expect(() => parseCsv('a\n' + 'é'.repeat(CSV_MAX_BYTES / 2))).toThrow('too_large');
  });

  it('rejects an empty file, a file without rows and an unterminated quote', () => {
    expect(() => parseCsv('')).toThrow('empty');
    expect(() => parseCsv('﻿  \n')).toThrow('empty');
    expect(() => parseCsv('a,b\n')).toThrow('no_rows');
    expect(() => parseCsv('a,b\n"x,1')).toThrow('malformed');
  });

  it('rejects absurdly wide files', () => {
    expect(() => parseCsv(Array.from({ length: 61 }, (_, i) => `c${i}`).join(',') + '\n1')).toThrow(
      'too_many_columns',
    );
  });

  it('trims the headers and drops control characters (NUL breaks jsonb)', () => {
    const out = parseCsv(' nombre ,email\nAna\u0000,a@x.es');
    expect(out.headers).toEqual(['nombre', 'email']);
    expect(out.rows[0]).toEqual(['Ana', 'a@x.es']);
  });
});

describe('normalizeCsvText', () => {
  it('is the same for the same data however Excel saved it', () => {
    expect(normalizeCsvText('﻿a;b\r\n1;2\r\n')).toBe(normalizeCsvText('a;b\n1;2'));
  });
});

describe('decodeCsvBytes', () => {
  it('reads UTF-8, with or without BOM', () => {
    expect(decodeCsvBytes(new TextEncoder().encode('Pérez'))).toBe('Pérez');
    expect(decodeCsvBytes(new Uint8Array([0xef, 0xbb, 0xbf, 0x41]))).toBe('A');
  });
  it('falls back to Windows-1252 when the bytes are not UTF-8 (Excel «CSV»)', () => {
    expect(decodeCsvBytes(new Uint8Array([0x50, 0xe9, 0x72, 0x65, 0x7a]))).toBe('Pérez');
  });
});
