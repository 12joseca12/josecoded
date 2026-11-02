import type { ConflictRow, ImporterOutcome } from './conflicts';
import type { ImportAnalysis } from './import-analysis';
import type { ColumnMapping } from './import-mapping';
import type { ConflictResolutionKind, ContactKind, ImportResult } from '@josecoded/types';

// Shapes shared by the reads, the Server Actions and the views of K4 (task 6.10).

/** Why an action refused: a key of `crm.import.errors`. */
export type ImportErrorKey =
  | 'too_large'
  | 'too_many_rows'
  | 'too_many_columns'
  | 'empty'
  | 'no_rows'
  | 'malformed'
  | 'bad_mapping'
  | 'no_valid_rows'
  | 'hourly'
  | 'contactQuota'
  | 'forbidden'
  | 'failed';

export type PreviewOutcome =
  { status: 'ok'; analysis: ImportAnalysis } | { status: 'error'; error: ImportErrorKey };

export interface ImportDone extends ImportResult {
  /** When the file had already been imported: the date of that first import (nothing was changed now). */
  importedAt?: string;
}

export type ImportOutcome =
  { status: 'ok'; result: ImportDone } | { status: 'error'; error: ImportErrorKey };

export type { ColumnMapping };

/** One import of the history (the admin also gets who made it). */
export interface ImportRecord {
  id: string;
  fileName: string;
  createdAt: string;
  rows: number;
  created: number;
  updated: number;
  skipped: number;
  conflicts: number;
  importer: string | null;
}

/** A row of the person's own that waits (or waited) for the admin: its place in the file and its outcome, nothing of the other side. */
export interface OwnConflict {
  id: string;
  fileName: string;
  /** Row of the file as a spreadsheet numbers it (the header is 1). */
  line: number;
  outcome: ImporterOutcome;
}

export interface ExistingContact {
  id: string;
  name: string;
  kind: ContactKind;
  /** Key of `crmContacts.status`. */
  status: string;
  ownerName: string;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  organization: string | null;
  role: string | null;
  lastInteractionAt: string | null;
}

/** What the admin sees of a pending conflict: both faces. */
export interface ConflictCase {
  id: string;
  fileName: string;
  line: number;
  importerId: string;
  importerName: string;
  createdAt: string;
  imported: ConflictRow;
  existing: ExistingContact;
}

export interface ResolvedConflict {
  id: string;
  fileName: string;
  line: number;
  importerName: string;
  /** Who it was about: the imported name and kind. */
  rowName: string;
  rowKind: string | null;
  resolution: ConflictResolutionKind;
  ownerName: string;
  resolvedAt: string | null;
}

export interface ConflictQueueData {
  pending: ConflictCase[];
  resolved: ResolvedConflict[];
}
