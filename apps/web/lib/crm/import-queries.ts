import { parseConflictRow, conflictOutcomeForImporter } from './conflicts';

import type {
  ConflictQueueData,
  ConflictCase,
  ImportRecord,
  OwnConflict,
  ResolvedConflict,
} from './import-types';
import type { StaffRole } from '@/lib/auth/staff';
import type { ServerSupabase } from '@/lib/supabase/server';
import type { ConflictResolutionKind, ContactKind } from '@josecoded/types';

// Reads of K4 (import history, own conflicts, the admin's queue). They run with the JWT of the person: RLS and the
// column grants decide what exists for them. A closer's reads never name the other owner (`existing_*` is not granted
// to her), and the queue is only requested by pages that already passed `requireAdmin()`.

const HISTORY_LIMIT = 20;
const OWN_CONFLICTS_LIMIT = 50;
const RESOLVED_LIMIT = 20;

async function importNames(
  supabase: ServerSupabase,
  ids: readonly string[],
): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const { data } = await supabase
    .from('crm_imports')
    .select('id, file_name')
    .in('id', [...new Set(ids)]);
  return new Map((data ?? []).map((row) => [row.id, row.file_name ?? '']));
}

async function staffNames(
  supabase: ServerSupabase,
  ids: readonly string[],
): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const { data } = await supabase
    .from('staff_members')
    .select('user_id, display_name')
    .in('user_id', [...new Set(ids)]);
  return new Map((data ?? []).map((row) => [row.user_id, row.display_name ?? '—']));
}

/** The last imports: a closer's own (RLS), everyone's for the admin, who also gets the importer's name. */
export async function getImportHistory(
  supabase: ServerSupabase,
  role: StaffRole,
): Promise<ImportRecord[]> {
  const { data, error } = await supabase
    .from('crm_imports')
    .select(
      'id, owner_id, file_name, created_at, row_count, created_count, updated_count, skipped_count, conflicts_count',
    )
    .order('created_at', { ascending: false })
    .limit(HISTORY_LIMIT);
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  const names =
    role === 'admin'
      ? await staffNames(
          supabase,
          rows.map((row) => row.owner_id),
        )
      : new Map<string, string>();
  return rows.map((row) => ({
    id: row.id,
    fileName: row.file_name ?? '',
    createdAt: row.created_at,
    rows: row.row_count,
    created: row.created_count,
    updated: row.updated_count,
    skipped: row.skipped_count,
    conflicts: row.conflicts_count,
    importer: role === 'admin' ? (names.get(row.owner_id) ?? '—') : null,
  }));
}

/**
 * The person's own rows in conflict, with the outcome and nothing else. The columns are the ones the grant allows
 * (`existing_contact_id`, `existing_owner_id` and the note are never selected), and the filter is explicit because the
 * admin's policy would otherwise return everyone's.
 */
export async function getOwnConflicts(
  supabase: ServerSupabase,
  userId: string,
): Promise<OwnConflict[]> {
  const { data, error } = await supabase
    .from('crm_import_conflicts')
    .select('id, import_id, row_index, status, resolution')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
    .limit(OWN_CONFLICTS_LIMIT);
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  const files = await importNames(
    supabase,
    rows.map((row) => row.import_id),
  );
  return rows.map((row) => ({
    id: row.id,
    fileName: files.get(row.import_id) ?? '',
    line: row.row_index + 1,
    outcome: conflictOutcomeForImporter({ status: row.status, resolution: row.resolution }),
  }));
}

/** How many conflicts wait for the admin (the badge of the tab). */
export async function getPendingConflictCount(supabase: ServerSupabase): Promise<number> {
  const { count } = await supabase
    .from('crm_import_conflicts')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');
  return count ?? 0;
}

interface QueueRow {
  id: string;
  import_id: string;
  importer_user_id: string;
  importer_name: string | null;
  row: unknown;
  existing_contact_id: string;
  existing_display_name: string;
  existing_kind: ContactKind;
  existing_status: string;
  existing_owner_name: string | null;
  created_at: string;
}

/** The admin's queue: pending cases with both faces, and the last resolved ones. Call only after `requireAdmin()`. */
export async function getConflictQueue(supabase: ServerSupabase): Promise<ConflictQueueData> {
  const [pending, resolved, decisions] = await Promise.all([
    supabase.rpc('admin_import_conflicts', { p_status: 'pending' }),
    supabase.rpc('admin_import_conflicts', { p_status: 'resolved' }),
    supabase
      .from('crm_import_conflicts')
      .select('id, row_index, resolution, resolved_at')
      .eq('status', 'resolved')
      .order('resolved_at', { ascending: false })
      .limit(RESOLVED_LIMIT),
  ]);
  if (pending.error) throw new Error(pending.error.message);
  if (resolved.error) throw new Error(resolved.error.message);
  const pendingRows = (pending.data ?? []) as unknown as QueueRow[];
  const resolvedRows = (resolved.data ?? []) as unknown as QueueRow[];
  const decided = new Map((decisions.data ?? []).map((row) => [row.id, row]));
  const shownResolved = resolvedRows.filter((row) => decided.has(row.id)).slice(0, RESOLVED_LIMIT);

  const [files, details, lines] = await Promise.all([
    importNames(
      supabase,
      [...pendingRows, ...shownResolved].map((row) => row.import_id),
    ),
    supabase
      .from('crm_contacts')
      .select('id, email, phone, linkedin_url, role, last_interaction_at, crm_organizations(name)')
      .in(
        'id',
        pendingRows.map((row) => row.existing_contact_id),
      ),
    supabase
      .from('crm_import_conflicts')
      .select('id, row_index')
      .in(
        'id',
        pendingRows.map((row) => row.id),
      ),
  ]);
  const detail = new Map(
    (
      (details.data ?? []) as unknown as {
        id: string;
        email: string | null;
        phone: string | null;
        linkedin_url: string | null;
        role: string | null;
        last_interaction_at: string | null;
        crm_organizations: { name: string } | null;
      }[]
    ).map((row) => [row.id, row]),
  );
  const lineOf = new Map((lines.data ?? []).map((row) => [row.id, row.row_index + 1]));

  const cases: ConflictCase[] = pendingRows.map((row) => {
    const more = detail.get(row.existing_contact_id);
    return {
      id: row.id,
      fileName: files.get(row.import_id) ?? '',
      line: lineOf.get(row.id) ?? 0,
      importerId: row.importer_user_id,
      importerName: row.importer_name ?? '—',
      createdAt: row.created_at,
      imported: parseConflictRow(row.row),
      existing: {
        id: row.existing_contact_id,
        name: row.existing_display_name,
        kind: row.existing_kind,
        status: row.existing_status,
        ownerName: row.existing_owner_name ?? 'Jose',
        email: more?.email ?? null,
        phone: more?.phone ?? null,
        linkedin_url: more?.linkedin_url ?? null,
        organization: more?.crm_organizations?.name ?? null,
        role: more?.role ?? null,
        lastInteractionAt: more?.last_interaction_at ?? null,
      },
    };
  });

  const done: ResolvedConflict[] = shownResolved.map((row) => {
    const decision = decided.get(row.id)!;
    const imported = parseConflictRow(row.row);
    return {
      id: row.id,
      fileName: files.get(row.import_id) ?? '',
      line: decision.row_index + 1,
      importerName: row.importer_name ?? '—',
      rowName: imported.display_name ?? row.existing_display_name,
      rowKind: imported.kind,
      resolution: decision.resolution as ConflictResolutionKind,
      ownerName: row.existing_owner_name ?? 'Jose',
      resolvedAt: decision.resolved_at,
    };
  });
  return { pending: cases, resolved: done };
}
