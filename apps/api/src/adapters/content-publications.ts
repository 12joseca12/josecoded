// ContentPublicationsRepo (service role): reads `site_content_publications` and notes progress with `content_publication_mark`
// (DATOS §14.4). database.ts predates these tables, so the rows are validated with zod instead of trusting a generated type.
import { z } from 'zod';

import type { RawRpc } from './raw-rpc';
import type { SupabaseGateway } from './supabase';
import type { ContentPublication, ContentPublicationsRepo } from '../ports';

interface Query extends PromiseLike<{ data: unknown; error: { message: string } | null }> {
  eq(column: string, value: string): Query;
  order(column: string, options: { ascending: boolean }): Query;
  limit(count: number): Query;
  maybeSingle(): PromiseLike<{ data: unknown; error: { message: string } | null }>;
}

const COLUMNS = 'id, status, snapshot, commit_sha, committed_at';
const rowSchema = z.object({
  id: z.uuid(),
  status: z.enum(['queued', 'committed', 'deployed', 'failed']),
  snapshot: z.unknown(),
  commit_sha: z.string().nullable(),
  committed_at: z.string().nullable(),
});

const toPublication = (row: z.infer<typeof rowSchema>): ContentPublication => ({
  id: row.id,
  status: row.status,
  snapshot: row.snapshot,
  commitSha: row.commit_sha,
  committedAt: row.committed_at ? new Date(row.committed_at) : null,
});

export function createContentPublicationsRepo(gateway: Pick<SupabaseGateway, 'admin'>, rpc: RawRpc): ContentPublicationsRepo {
  const table = () => (gateway.admin() as unknown as { from(name: string): { select(columns: string): Query } }).from('site_content_publications');
  return {
    async get(id) {
      const { data, error } = await table().select(COLUMNS).eq('id', id).maybeSingle();
      if (error) throw new Error(`site_content_publications: ${error.message}`);
      return data ? toPublication(rowSchema.parse(data)) : null;
    },
    async listCommitted(limit) {
      const { data, error } = await table().select(COLUMNS).eq('status', 'committed').order('created_at', { ascending: true }).limit(limit);
      if (error) throw new Error(`site_content_publications: ${error.message}`);
      return z.array(rowSchema).parse(data ?? []).map(toPublication);
    },
    async mark({ id, status, commitSha, files, runId, error }) {
      await rpc.call('content_publication_mark', {
        p_id: id,
        p_status: status,
        p_commit_sha: commitSha ?? null,
        p_files: files ?? null,
        p_run_id: runId ?? null,
        p_error: error ?? null,
      });
    },
  };
}
