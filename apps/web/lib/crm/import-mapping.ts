import { z } from 'zod';

import { csvContactRowSchema } from '@josecoded/types';

import { CSV_MAX_COLUMNS } from './csv';

import type { CsvContactRow } from '@josecoded/types';

// Column mapping and row normalisation of the contact import (K4, task 6.10). Pure functions: the preview and the
// import both run them in the Server Action, with the mapping the person chose, so what the database receives is
// never what the browser says it is.

/** The contact fields a column can feed, in the order of the selectors. */
export const IMPORT_FIELDS = [
  'display_name',
  'email',
  'phone',
  'linkedin_url',
  'organization',
  'role',
  'city',
  'kind',
  'notes',
  'tags',
] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number];

/** Field → index of the column that feeds it. A field with no entry is not imported. */
export type ColumnMapping = Partial<Record<ImportField, number>>;

export const mappingSchema = z.strictObject(
  Object.fromEntries(
    IMPORT_FIELDS.map((field) => [
      field,
      z
        .number()
        .int()
        .min(0)
        .max(CSV_MAX_COLUMNS - 1)
        .optional(),
    ]),
  ) as Record<ImportField, z.ZodOptional<z.ZodNumber>>,
);

// Header synonyms (PANT K4), compared without accents, case or punctuation.
const SYNONYMS: Record<ImportField, readonly string[]> = {
  display_name: [
    'nombre',
    'name',
    'nombrecompleto',
    'fullname',
    'contacto',
    'contact',
    'displayname',
    'nombreyapellidos',
  ],
  email: ['email', 'correo', 'correoelectronico', 'mail', 'emailaddress'],
  phone: ['telefono', 'phone', 'movil', 'mobile', 'celular', 'tel', 'telefonomovil', 'phonenumber'],
  linkedin_url: ['linkedin', 'linkedinurl', 'perfillinkedin', 'linkedinprofile', 'urllinkedin'],
  organization: ['empresa', 'organizacion', 'organization', 'company', 'compania', 'organisation'],
  role: ['cargo', 'puesto', 'role', 'title', 'position', 'jobtitle', 'rol'],
  city: ['ciudad', 'city', 'localidad', 'poblacion'],
  kind: ['tipo', 'kind', 'type', 'tipodecontacto'],
  notes: ['notas', 'notes', 'observaciones', 'comentarios', 'comments', 'nota'],
  tags: ['etiquetas', 'tags', 'etiqueta', 'labels', 'tag'],
};

const fold = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

/** The first column whose header is a synonym of each field; a column feeds one field only. */
export function guessMapping(headers: readonly string[]): ColumnMapping {
  const folded = headers.map(fold);
  const mapping: ColumnMapping = {};
  const taken = new Set<number>();
  for (const field of IMPORT_FIELDS) {
    const index = folded.findIndex(
      (header, i) => !taken.has(i) && SYNONYMS[field].includes(header),
    );
    if (index !== -1) {
      mapping[field] = index;
      taken.add(index);
    }
  }
  return mapping;
}

/** `https://linkedin.com/in/ana`: lowercase, https, no `www.`/country subdomain, no query, hash or trailing slash. Null if it is not LinkedIn. */
export function normalizeLinkedin(raw: string): string | null {
  const text = raw.trim();
  // another scheme (javascript:, data:…) is never an address of ours
  if (/^[a-z][a-z0-9+.-]*:/i.test(text) && !/^https?:\/\//i.test(text)) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (host !== 'linkedin.com' && !host.endsWith('.linkedin.com')) return null;
  const path = url.pathname.replace(/\/+$/, '').toLowerCase();
  return path === '' ? null : `https://linkedin.com${path}`;
}

/** Tags of a cell, separated by `;` or `,`; trimmed, without blanks or repeats (case-insensitive). */
export function splitTags(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[;,]/)) {
    const tag = part.trim();
    const key = tag.toLowerCase();
    if (tag !== '' && !seen.has(key)) {
      seen.add(key);
      out.push(tag);
    }
  }
  return out;
}

const KINDS: Record<string, CsvContactRow['kind']> = {
  lead: 'lead',
  leads: 'lead',
  prospecto: 'lead',
  agency: 'agency',
  agencia: 'agency',
  recruiter: 'recruiter',
  reclutador: 'recruiter',
  reclutadora: 'recruiter',
  headhunter: 'recruiter',
  other: 'other',
  otro: 'other',
  otra: 'other',
};

/** Why a row is not valid: a key of `crm.import.errors` (`<field>_invalid` for a value the schema refuses). */
export type RowError =
  | 'name_required'
  | 'unreachable'
  | 'kind_invalid'
  | 'invalid'
  | `${Exclude<ImportField, 'display_name' | 'kind'>}_invalid`;

export interface NormalizedRow {
  data?: CsvContactRow;
  error?: RowError;
}

const UNREACHABLE_MESSAGE = 'email, phone or linkedin_url is required';

const empty = (value: string | undefined): string | undefined => {
  const text = value?.trim();
  return text ? text : undefined;
};

/** One record of the file as a contact, or the first reason it is not one. Never throws. */
export function normalizeRow(cells: readonly string[], mapping: ColumnMapping): NormalizedRow {
  const cell = (field: ImportField): string | undefined => {
    const index = mapping[field];
    return index === undefined ? undefined : empty(cells[index]);
  };

  const name = cell('display_name');
  if (!name) return { error: 'name_required' };

  const rawKind = cell('kind');
  const kind = rawKind === undefined ? 'lead' : KINDS[fold(rawKind)];
  if (!kind) return { error: 'kind_invalid' };

  const email = cell('email')?.toLowerCase();
  const phone = cell('phone');
  const rawLinkedin = cell('linkedin_url');
  const linkedin = rawLinkedin === undefined ? undefined : normalizeLinkedin(rawLinkedin);
  if (rawLinkedin !== undefined && linkedin === null) return { error: 'linkedin_url_invalid' };

  const candidate = {
    display_name: name,
    email,
    phone,
    linkedin_url: linkedin ?? undefined,
    kind,
    organization: cell('organization'),
    role: cell('role'),
    city: cell('city'),
    notes: cell('notes'),
    tags: splitTags(cell('tags') ?? ''),
  };
  const parsed = csvContactRowSchema.safeParse(candidate);
  if (parsed.success) return { data: parsed.data };

  // the first field the schema refuses is the one to fix; «unreachable» is its own message and comes last
  for (const issue of parsed.error.issues) {
    const field = String(issue.path[0] ?? '');
    if (issue.message === UNREACHABLE_MESSAGE) continue;
    if (
      field !== 'display_name' &&
      field !== 'kind' &&
      (IMPORT_FIELDS as readonly string[]).includes(field)
    ) {
      return { error: `${field}_invalid` as RowError };
    }
  }
  return {
    error: email === undefined && phone === undefined && !linkedin ? 'unreachable' : 'invalid',
  };
}

/** The field a column feeds, if any. */
export function fieldOfColumn(mapping: ColumnMapping, column: number): ImportField | null {
  return IMPORT_FIELDS.find((field) => mapping[field] === column) ?? null;
}

/**
 * The mapping after the person picks `field` for `column` (`null` = «No importar»). A column feeds one field and a
 * field comes from one column, so whatever the choice displaces is let go: the field loses its old column and the
 * column loses its old field.
 */
export function assignColumn(
  mapping: ColumnMapping,
  column: number,
  field: ImportField | null,
): ColumnMapping {
  const next: ColumnMapping = { ...mapping };
  const previous = fieldOfColumn(next, column);
  if (previous) delete next[previous];
  if (field) next[field] = column;
  return next;
}
