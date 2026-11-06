import { type ContactKind, contactKinds } from "@/types/crm";
import {
  type ImportField,
  importFields,
  type ImportMapping,
  type ImportPreviewRow,
  importPreviewRows,
  type ImportProblemRow,
  type ImportRowProblem,
  importRowProblems,
  importRowSchema,
  type ImportRowValues,
} from "@/types/crm-import";

import type { ParsedCsv } from "./parse";

const aliases: Record<ImportField, readonly string[]> = {
  fullName: ["nombre", "name", "fullname", "nombrecompleto", "contacto"],
  email: ["email", "correo", "mail", "correoelectronico", "emailaddress"],
  phone: ["telefono", "phone", "movil", "tel", "telefonomovil"],
  organization: ["empresa", "company", "organizacion", "organization", "compania"],
  kind: ["tipo", "kind", "type", "categoria"],
  notes: ["notas", "notes", "observaciones", "comentarios"],
};

const kindAliases: Record<string, ContactKind> = {
  prospecto: "prospect",
  cliente: "client",
  reclutador: "recruiter",
  socio: "partner",
  otro: "other",
};

const formulaStarts = ["=", "+", "-", "@"];

export function normalizeHeader(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function emptyMapping(): ImportMapping {
  return { fullName: null, email: null, phone: null, organization: null, kind: null, notes: null };
}

export function suggestMapping(headers: readonly string[]): ImportMapping {
  const normalized = headers.map(normalizeHeader);
  const mapping = emptyMapping();
  const taken = new Set<number>();
  for (const field of importFields) {
    const index = normalized.findIndex(
      (header, position) => !taken.has(position) && aliases[field].includes(header),
    );
    if (index >= 0) {
      mapping[field] = index;
      taken.add(index);
    }
  }
  return mapping;
}

export function startsLikeFormula(value: string): boolean {
  return formulaStarts.includes(value.trimStart().charAt(0));
}

function neutralize(value: string): { text: string; changed: boolean } {
  const text = value.trim();
  if (text !== "" && startsLikeFormula(text)) return { text: `'${text}`, changed: true };
  return { text, changed: false };
}

function cellAt(cells: readonly string[], index: number | null): string {
  return index === null ? "" : (cells[index] ?? "");
}

function kindOf(raw: string): ContactKind | null {
  const value = raw.trim().toLowerCase();
  if (value === "") return "prospect";
  const direct = contactKinds.find((kind) => kind === value);
  return direct ?? kindAliases[normalizeHeader(value)] ?? null;
}

function problemOf(path: PropertyKey | undefined): ImportRowProblem {
  const found = importRowProblems.find((problem) => problem === path);
  return found ?? "fullName";
}

export interface EvaluatedRow {
  line: number;
  cells: string[];
  values: ImportRowValues | null;
  problems: ImportRowProblem[];
  neutralized: boolean;
}

export function evaluateRow(
  record: { line: number; cells: string[] },
  headerCount: number,
  mapping: ImportMapping,
): EvaluatedRow {
  const { line, cells } = record;
  if (cells.length !== headerCount) {
    return { line, cells, values: null, problems: ["columns"], neutralized: false };
  }
  const fullName = neutralize(cellAt(cells, mapping.fullName));
  const organization = neutralize(cellAt(cells, mapping.organization));
  const notes = neutralize(cellAt(cells, mapping.notes));
  const email = cellAt(cells, mapping.email).trim().toLowerCase();
  const phone = cellAt(cells, mapping.phone).trim();
  const kind = kindOf(cellAt(cells, mapping.kind));
  const neutralized = fullName.changed || organization.changed || notes.changed;
  const problems: ImportRowProblem[] = [];
  if (kind === null) problems.push("kind");
  const parsed = importRowSchema.safeParse({
    fullName: fullName.text,
    email: startsLikeFormula(email) ? "=" : email,
    phone,
    organization: organization.text,
    kind: kind ?? "prospect",
    notes: notes.text,
  });
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const problem = problemOf(issue.path[0]);
      if (!problems.includes(problem)) problems.push(problem);
    }
  }
  if (problems.length > 0 || !parsed.success) {
    return { line, cells, values: null, problems, neutralized };
  }
  return { line, cells, values: parsed.data, problems: [], neutralized };
}

export interface EvaluatedFile {
  rows: EvaluatedRow[];
  duplicateInFile: Set<number>;
}

export function evaluateFile(csv: ParsedCsv, mapping: ImportMapping): EvaluatedFile {
  const rows = csv.records.map((record) => evaluateRow(record, csv.headers.length, mapping));
  const seen = new Set<string>();
  const duplicateInFile = new Set<number>();
  for (const row of rows) {
    const email = row.values?.email ?? "";
    if (email === "") continue;
    if (seen.has(email)) duplicateInFile.add(row.line);
    else seen.add(email);
  }
  return { rows, duplicateInFile };
}

export function emailsOf(rows: readonly EvaluatedRow[]): string[] {
  return [...new Set(rows.flatMap((row) => (row.values?.email ? [row.values.email] : [])))];
}

export interface Classified {
  preview: ImportPreviewRow[];
  problems: ImportProblemRow[];
  totals: {
    rows: number;
    valid: number;
    invalid: number;
    duplicates: number;
    neutralized: number;
  };
  importable: ImportRowValues[];
}

export function classify(
  evaluated: EvaluatedFile,
  existingEmails: ReadonlySet<string>,
): Classified {
  const preview: ImportPreviewRow[] = [];
  const problems: ImportProblemRow[] = [];
  const importable: ImportRowValues[] = [];
  let valid = 0;
  let invalid = 0;
  let duplicates = 0;
  let neutralized = 0;
  for (const row of evaluated.rows) {
    if (row.neutralized) neutralized += 1;
    let verdict: "ok" | "duplicate" | "invalid" = "ok";
    const rowProblems = [...row.problems];
    if (row.values === null) {
      verdict = "invalid";
      invalid += 1;
    } else if (evaluated.duplicateInFile.has(row.line)) {
      verdict = "duplicate";
      rowProblems.push("duplicateInFile");
      duplicates += 1;
    } else if (row.values.email !== "" && existingEmails.has(row.values.email)) {
      verdict = "duplicate";
      duplicates += 1;
      importable.push(row.values);
    } else {
      valid += 1;
      importable.push(row.values);
    }
    preview.push({
      line: row.line,
      cells: row.cells,
      values: row.values,
      verdict,
      problems: rowProblems,
      neutralized: row.neutralized,
    });
    if (verdict !== "ok") {
      problems.push({ line: row.line, cells: row.cells, verdict, problems: rowProblems });
    }
  }
  return {
    preview,
    problems,
    totals: { rows: evaluated.rows.length, valid, invalid, duplicates, neutralized },
    importable,
  };
}

export function samplePreview(rows: readonly ImportPreviewRow[]): ImportPreviewRow[] {
  const flagged = rows.filter((row) => row.verdict !== "ok");
  const head = rows.slice(0, importPreviewRows);
  const extra = flagged.filter((row) => !head.includes(row)).slice(0, importPreviewRows);
  return [...head, ...extra];
}
