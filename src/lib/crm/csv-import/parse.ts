import { importMaxColumns, importMaxRows, type ImportRejection } from "@/types/crm-import";

export interface ParsedCsv {
  headers: string[];
  records: { line: number; cells: string[] }[];
}

export type ParseOutcome = { ok: true; csv: ParsedCsv } | { ok: false; reason: ImportRejection };

const quote = '"';

function detectDelimiter(text: string): "," | ";" {
  let commas = 0;
  let semicolons = 0;
  let quoted = false;
  for (const char of text) {
    if (char === quote) quoted = !quoted;
    else if (!quoted && (char === "\n" || char === "\r")) break;
    else if (!quoted && char === ",") commas += 1;
    else if (!quoted && char === ";") semicolons += 1;
  }
  return semicolons > commas ? ";" : ",";
}

function isBlank(cells: string[]): boolean {
  return cells.every((cell) => cell.trim() === "");
}

export function parseCsv(source: string): ParseOutcome {
  const text = source.startsWith("﻿") ? source.slice(1) : source;
  const delimiter = detectDelimiter(text);
  const rows: { line: number; cells: string[] }[] = [];
  let cells: string[] = [];
  let field = "";
  let inQuotes = false;
  let quotedField = false;
  let afterQuote = false;
  let line = 1;
  let rowLine = 1;

  const endField = () => {
    cells.push(field);
    field = "";
    quotedField = false;
    afterQuote = false;
  };

  const endRow = () => {
    endField();
    if (!isBlank(cells)) rows.push({ line: rowLine, cells });
    cells = [];
  };

  for (let index = 0; index < text.length; index += 1) {
    const char = text.charAt(index);
    if (inQuotes) {
      if (char === quote) {
        if (text.charAt(index + 1) === quote) {
          field += quote;
          index += 1;
        } else {
          inQuotes = false;
          afterQuote = true;
        }
      } else {
        if (char === "\n") line += 1;
        field += char;
      }
      continue;
    }
    if (char === quote) {
      if (field !== "" || quotedField || afterQuote) return { ok: false, reason: "malformed" };
      inQuotes = true;
      quotedField = true;
      continue;
    }
    if (afterQuote && char !== delimiter && char !== "\n" && char !== "\r") {
      return { ok: false, reason: "malformed" };
    }
    if (char === delimiter) {
      endField();
      if (cells.length > importMaxColumns) return { ok: false, reason: "tooManyColumns" };
      continue;
    }
    if (char === "\r" || char === "\n") {
      if (char === "\r" && text.charAt(index + 1) === "\n") index += 1;
      endRow();
      line += 1;
      rowLine = line;
      if (rows.length > importMaxRows + 1) return { ok: false, reason: "tooManyRows" };
      continue;
    }
    field += char;
  }
  if (inQuotes) return { ok: false, reason: "malformed" };
  if (field !== "" || cells.length > 0 || quotedField) endRow();

  const [head, ...records] = rows;
  if (head === undefined) return { ok: false, reason: "noHeader" };
  if (head.cells.length > importMaxColumns) return { ok: false, reason: "tooManyColumns" };
  if (records.length > importMaxRows) return { ok: false, reason: "tooManyRows" };
  return { ok: true, csv: { headers: head.cells.map((cell) => cell.trim()), records } };
}
