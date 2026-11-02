// Own CSV parser for the contact import (K4, task 6.10): RFC 4180 (quotes, separators and line breaks inside quotes,
// doubled quotes), `,` or `;` detected from the header, BOM and CRLF tolerated. No dependency: the format is small and
// the limits below are part of the security of the import (the file is read in the Server Action, never trusted).

export const CSV_MAX_BYTES = 1024 * 1024;
export const CSV_MAX_ROWS = 500;
export const CSV_MAX_COLUMNS = 60;

/** Why a file is refused: the message of the thrown `CsvError` is one of these. */
export type CsvErrorCode =
  'too_large' | 'too_many_rows' | 'too_many_columns' | 'empty' | 'no_rows' | 'malformed';

export class CsvError extends Error {
  constructor(readonly code: CsvErrorCode) {
    super(code);
    this.name = 'CsvError';
  }
}

export type CsvSeparator = ',' | ';';

export interface ParsedCsv {
  headers: string[];
  /** Data records, blank ones left out, each padded to the width of the header. */
  rows: string[][];
  separator: CsvSeparator;
  /** Size of the text in UTF-8. */
  bytes: number;
}

/** NUL breaks `jsonb` and the rest of the C0 controls are never part of a name: dropped (tab and line breaks stay). */
 
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

const stripBom = (text: string): string => (text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);

/** The text the checksum is taken from: the same data saved by another program (BOM, CRLF, final break) is the same file. */
export function normalizeCsvText(text: string): string {
  return stripBom(text).replace(/\r\n?/g, '\n').replace(/\n+$/, '');
}

function byteLength(text: string): number {
  // a UTF-16 length is never above the UTF-8 one, so the cheap test settles the clear cases
  return text.length > CSV_MAX_BYTES ? text.length : new TextEncoder().encode(text).length;
}

/** `;` or `,` by which occurs more in the first record, outside quotes. A tie (or none) is `,`. */
function detectSeparator(text: string): CsvSeparator {
  let commas = 0;
  let semicolons = 0;
  let quoted = false;
  for (const char of text) {
    if (char === '"') quoted = !quoted;
    else if (!quoted) {
      if (char === '\n' || char === '\r') break;
      if (char === ',') commas += 1;
      else if (char === ';') semicolons += 1;
    }
  }
  return semicolons > commas ? ';' : ',';
}

export function parseCsv(input: string): ParsedCsv {
  const bytes = byteLength(input);
  if (bytes > CSV_MAX_BYTES) throw new CsvError('too_large');
  const text = stripBom(input);
  if (text.trim() === '') throw new CsvError('empty');
  const separator = detectSeparator(text);

  const records: string[][] = [];
  let record: string[] = [];
  let cell = '';
  let quoted = false;
  let cellStarted = false;

  const endCell = () => {
    record.push(cell.replace(CONTROL, ''));
    cell = '';
    cellStarted = false;
  };
  const endRecord = () => {
    endCell();
    // a record of empty cells (a blank line, a row of separators) is no record
    if (record.some((value) => value.trim() !== '')) {
      records.push(record);
      // the header is the first record: data rows are counted after it
      if (records.length - 1 > CSV_MAX_ROWS) throw new CsvError('too_many_rows');
    }
    record = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]!;
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else quoted = false;
      } else if (char === '\r') {
        cell += '\n';
        if (text[i + 1] === '\n') i += 1;
      } else cell += char;
      continue;
    }
    if (char === '"' && !cellStarted) {
      // a quote opens a field only at its start; inside an unquoted one it is a literal character
      quoted = true;
      cellStarted = true;
    } else if (char === separator) endCell();
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      endRecord();
    } else {
      cell += char;
      cellStarted = true;
    }
  }
  if (quoted) throw new CsvError('malformed');
  if (cellStarted || cell !== '' || record.length > 0) endRecord();

  const header = records[0];
  if (!header) throw new CsvError('empty');
  if (header.length > CSV_MAX_COLUMNS) throw new CsvError('too_many_columns');
  const rows = records.slice(1);
  if (rows.length === 0) throw new CsvError('no_rows');

  const width = header.length;
  return {
    headers: header.map((value) => value.trim()),
    rows: rows.map((row) =>
      row.length >= width ? row : [...row, ...Array<string>(width - row.length).fill('')],
    ),
    separator,
    bytes,
  };
}

/**
 * The bytes of a file as text. Excel saves «CSV UTF-8» with a BOM but the plain «CSV» in Windows-1252: if the bytes are
 * not valid UTF-8 they are read as Windows-1252, so the accents survive either way.
 */
export function decodeCsvBytes(bytes: ArrayBuffer | Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('windows-1252').decode(bytes);
  }
}
