import type { ContentPublication, ContentPublicationsRepo, RepoCommitResult, RepoWriter, TreeEntry, WorkflowRunSummary } from '../../src/ports';

export interface FakeRepoWriter extends RepoWriter {
  /** Files under content/blog/ in the repo now. */
  blog: string[];
  commits: { message: string; entries: TreeEntry[] }[];
  /** Calls the adapter would have made (to check the budget hooks). */
  requests: number;
  /** When set, `commit` throws it. */
  failWith?: Error;
  /** When set, the tree is unchanged. */
  unchanged?: boolean;
  runs: Map<string, WorkflowRunSummary>;
  runLookups: string[];
}

export function createFakeRepoWriter(): FakeRepoWriter {
  const fake: FakeRepoWriter = {
    blog: [],
    commits: [],
    requests: 0,
    runs: new Map(),
    runLookups: [],
    async listDirectory(_dir, hooks) {
      hooks?.onRequest?.();
      fake.requests += 1;
      return fake.blog;
    },
    async commit(input, hooks): Promise<RepoCommitResult> {
      for (let i = 0; i < 4; i += 1) {
        hooks?.onRequest?.();
        fake.requests += 1;
      }
      if (fake.failWith) throw fake.failWith;
      fake.commits.push(input);
      const files = Object.fromEntries(input.entries.flatMap((e) => ('content' in e ? [[e.path, `sha-of-${e.path}`]] : [])));
      return { commitSha: fake.unchanged ? 'f'.repeat(40) : 'a'.repeat(40), files, changed: !fake.unchanged };
    },
    async workflowRunForSha(sha, hooks) {
      hooks?.onRequest?.();
      fake.requests += 1;
      fake.runLookups.push(sha);
      return fake.runs.get(sha) ?? null;
    },
  };
  return fake;
}

export interface FakePublications extends ContentPublicationsRepo {
  rows: Map<string, ContentPublication & { error?: string; files?: Record<string, string>; runId?: number }>;
  marks: Parameters<ContentPublicationsRepo['mark']>[0][];
  /** When set, `mark` throws it (the RPC failed). */
  markFails?: Error;
}

export function createFakePublications(rows: (Partial<ContentPublication> & { id: string })[] = []): FakePublications {
  const fake: FakePublications = {
    rows: new Map(),
    marks: [],
    async get(id) {
      return fake.rows.get(id) ?? null;
    },
    async listCommitted(limit) {
      return [...fake.rows.values()].filter((r) => r.status === 'committed').slice(0, limit);
    },
    async mark(update) {
      if (fake.markFails) throw fake.markFails;
      fake.marks.push(update);
      const row = fake.rows.get(update.id);
      if (row) {
        row.status = update.status;
        if (update.commitSha) row.commitSha = update.commitSha;
        if (update.error) row.error = update.error;
        if (update.files) row.files = update.files;
        if (update.runId) row.runId = update.runId;
        if (update.status === 'committed') row.committedAt = new Date();
      }
    },
  };
  for (const r of rows) fake.rows.set(r.id, { status: 'queued', snapshot: { files: {} }, commitSha: null, committedAt: null, ...r });
  return fake;
}
