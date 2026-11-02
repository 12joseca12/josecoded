import { z } from 'zod';

import { csvContactRowSchema, CSV_IMPORT_MAX_ROWS } from '@josecoded/types';

import { normalizeCsvText, parseCsv } from './csv';
import { guessMapping, IMPORT_FIELDS, normalizeRow } from './import-mapping';

import type { CsvSeparator } from './csv';
import type { ColumnMapping, RowError } from './import-mapping';
import type { CsvContactRow } from '@josecoded/types';

// What the Server Actions of K4 do with the text of a CSV, as pure functions so they are tested without a server:
// `analyzeImport` is the preview (first rows and totals, no database), `buildImportRows` is what the RPC receives.

/** Rows the preview shows (PANT K4). */
export const PREVIEW_ROWS = 20;
const SAMPLE_LENGTH = 60;

export interface PreviewRow {
  /** Row of the file as a spreadsheet numbers it: the header is 1, the first record 2. It is also the number the database keeps. */
  line: number;
  name: string;
  organization: string;
  email: string;
  phone: string;
  /** The normalized kind of a valid row, what was typed for an invalid one. */
  kind: string;
  error?: RowError;
}

export interface ImportAnalysis {
  separator: CsvSeparator;
  bytes: number;
  headers: string[];
  /** First non-empty value of each column, to recognise it. */
  samples: string[];
  mapping: ColumnMapping;
  total: number;
  valid: number;
  invalid: { line: number; error: RowError }[];
  preview: PreviewRow[];
}

/** Throws `bad_mapping` when the mapping points at a column that does not exist. */
function checkMapping(mapping: ColumnMapping, width: number): void {
  for (const field of IMPORT_FIELDS) {
    const index = mapping[field];
    if (index !== undefined && index >= width) throw new Error('bad_mapping');
  }
}

export function analyzeImport(text: string, mapping: ColumnMapping | null): ImportAnalysis {
  const csv = parseCsv(text);
  const chosen = mapping ?? guessMapping(csv.headers);
  checkMapping(chosen, csv.headers.length);

  const preview: PreviewRow[] = [];
  const invalid: ImportAnalysis['invalid'] = [];
  csv.rows.forEach((cells, position) => {
    const line = position + 2;
    const { data, error } = normalizeRow(cells, chosen);
    if (error) invalid.push({ line, error });
    if (position >= PREVIEW_ROWS) return;
    const raw = (field: (typeof IMPORT_FIELDS)[number]) => {
      const index = chosen[field];
      return index === undefined ? '' : (cells[index] ?? '').trim();
    };
    preview.push({
      line,
      name: data?.display_name ?? raw('display_name'),
      organization: data?.organization ?? raw('organization'),
      email: data?.email ?? raw('email'),
      phone: data?.phone ?? raw('phone'),
      kind: data?.kind ?? raw('kind'),
      ...(error ? { error } : {}),
    });
  });

  return {
    separator: csv.separator,
    bytes: csv.bytes,
    headers: csv.headers,
    samples: csv.headers.map((_, column) => {
      const first = csv.rows.map((row) => row[column]?.trim() ?? '').find((value) => value !== '');
      return (first ?? '').slice(0, SAMPLE_LENGTH);
    }),
    mapping: chosen,
    total: csv.rows.length,
    valid: csv.rows.length - invalid.length,
    invalid,
    preview,
  };
}

/** A record that is not a contact travels as `{}`: the database counts it as skipped under its row number. */
export type ImportRow = CsvContactRow | Record<string, never>;

/**
 * Every record of the file in its place (so «fila N» means the same to the person and to the database), valid ones
 * normalized and the rest empty. Throws `bad_mapping` (no name column, or a column that does not exist) and
 * `no_valid_rows` (nothing to import).
 */
export function buildImportRows(
  text: string,
  mapping: ColumnMapping,
): { rows: ImportRow[]; valid: number } {
  const csv = parseCsv(text);
  checkMapping(mapping, csv.headers.length);
  if (mapping.display_name === undefined) throw new Error('bad_mapping');
  let valid = 0;
  const rows = csv.rows.map((cells): ImportRow => {
    const { data } = normalizeRow(cells, mapping);
    if (!data) return {};
    valid += 1;
    return data;
  });
  if (valid === 0) throw new Error('no_valid_rows');
  return { rows, valid };
}

/**
 * What the Server Action hands to the RPC, validated once more (zod is the guard at the boundary, the browser's
 * word is worth nothing): valid rows, or `{}` for a record the database must count as skipped.
 */
export const importPayloadSchema = z.object({
  rows: z
    .array(z.union([csvContactRowSchema, z.strictObject({})]))
    .min(1)
    .max(CSV_IMPORT_MAX_ROWS),
  file_name: z.string().trim().min(1).max(255),
  checksum: z.string().regex(/^[0-9a-f]{64}$/),
});

/** A name the person typed or the browser sent, safe to keep: no path, no control characters, at most 255 characters. */
export function cleanFileName(raw: string): string {
   
  const base = (raw.split(/[\\/]/).pop() ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, 255);
  return base === '' ? 'import.csv' : base;
}

/** sha-256 (hex) of the normalized text: the idempotency key of the import (`uq (owner_id, checksum)`). */
export async function checksumOf(text: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(normalizeCsvText(text)),
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
