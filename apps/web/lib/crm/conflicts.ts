import { z } from 'zod';

import type { ConflictResolutionKind, ConflictStatus } from '@josecoded/types';

// Import conflicts (Q22, DATOS §14.12.2): the rows of a CSV that clash with another person's contact wait for the
// admin. These helpers keep the two audiences apart: the importer learns an outcome, the admin sees the whole case.

/** The four resolutions in the order the admin sees them (keep with the owner, give to the importer, merge, discard). */
export const RESOLUTION_ORDER = [
  'assign_existing',
  'assign_importer',
  'merge',
  'discard',
] as const satisfies readonly ConflictResolutionKind[];

export type ResolutionKey = 'keep' | 'assign' | 'merge' | 'discard';

const KEYS: Record<ConflictResolutionKind, ResolutionKey> = {
  assign_existing: 'keep',
  assign_importer: 'assign',
  merge: 'merge',
  discard: 'discard',
};

/**
 * Which message describes a resolution and with which names: `messages` has «Mantener con {owner}», «Asignar a
 * {importer}»… for the buttons and the past forms («Mantenida con {owner}») for the resolved list, under the same key.
 */
export function resolutionLabel(
  resolution: ConflictResolutionKind,
  importerName: string,
  ownerName: string,
): { key: ResolutionKey; values: { importer: string; owner: string } } {
  return { key: KEYS[resolution], values: { importer: importerName, owner: ownerName } };
}

export type ImporterOutcome = 'pending' | 'assigned' | 'not_assigned';

/** What the importer is told about one of her rows: never who the other owner is, only whether the contact became hers. */
export function conflictOutcomeForImporter(row: {
  status: ConflictStatus;
  resolution: ConflictResolutionKind | null;
}): ImporterOutcome {
  if (row.status === 'pending') return 'pending';
  return row.resolution === 'assign_importer' ? 'assigned' : 'not_assigned';
}

const text = z
  .string()
  .nullish()
  .catch(null)
  .transform((value) => value?.trim() || null);

/**
 * The imported side of a conflict as the database keeps it (`crm_import_conflicts.row`, the normalised row of the
 * importer, with `null` for what the file did not have). Read defensively: it is `jsonb`, whatever it holds.
 */
export const conflictRowSchema = z.object({
  display_name: text,
  email: text,
  phone: text,
  linkedin_url: text,
  organization: text,
  role: text,
  city: text,
  kind: text,
  notes: text,
  tags: z.array(z.string()).catch([]).default([]),
});
export type ConflictRow = z.infer<typeof conflictRowSchema>;

export function parseConflictRow(value: unknown): ConflictRow {
  return conflictRowSchema.parse(value && typeof value === 'object' ? value : {});
}

/** The fields shown side by side, in the order of the screen. */
export const COMPARED_FIELDS = ['email', 'phone', 'linkedin_url', 'organization', 'role'] as const;
export type ComparedField = (typeof COMPARED_FIELDS)[number];

/** Normalises a value the way the database compares it, so «distinto» only marks real differences. */
const fold = (value: string | null): string =>
  (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * The fields where the imported row brings something the contact does not have or says otherwise: the ones
 * «Fusionar datos» would fill or that make the two faces differ. An empty value on the imported side is never a difference.
 */
export function differingFields(
  imported: ConflictRow,
  existing: Record<ComparedField, string | null>,
): ComparedField[] {
  return COMPARED_FIELDS.filter(
    (field) => fold(imported[field]) !== '' && fold(imported[field]) !== fold(existing[field]),
  );
}
