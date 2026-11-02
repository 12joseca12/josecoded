// Publishing the site content to the repo (task 3.8c, DATOS §14.5, D53/D54). `content_publish()` leaves a snapshot
// `{files: {path: content}}` in `site_content_publications` and enqueues `content.publish_requested`; `outbox.drain` hands that
// event to `handlePublishRequested`, which commits the snapshot as ONE commit of the bot and notes the result with
// `content_publication_mark`. `buildTree` is the pure part and the security boundary: whatever the snapshot says, only
// `content/overrides/*`, `content/blog/*.md` and `content/pricing.json` can be written, so a snapshot (written by an admin RPC, but read
// by a bot with `contents:write`) can never touch code, workflows or secrets.
import { z } from 'zod';

import { stableStringify } from '@josecoded/pricing';
import { pricingSchema } from '@josecoded/types';

import { logEvent } from '../utils/http-error';

import type { Deps } from '../deps';
import type { TreeEntry } from '../ports';

/** Files per publication (the snapshot always carries the whole state, so this bounds the site, not one edit). */
export const MAX_FILES = 60;
const MAX_FILE_BYTES = 512 * 1024;
const MAX_TOTAL_BYTES = 4 * 1024 * 1024;
export const BLOG_DIR = 'content/blog';

const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]{0,120}$/;

export class ContentPublishError extends Error {
  constructor(readonly code: 'path_not_allowed' | 'too_many_files' | 'file_too_large' | 'invalid_snapshot' | 'invalid_content') {
    super(code);
    this.name = 'ContentPublishError';
  }
}

/** `content/overrides/<file>.json`, `content/blog/<file>.md` and exactly `content/pricing.json`. Nothing else, no traversal. */
export function isAllowedPath(path: string): boolean {
  if (path === 'content/pricing.json') return true;
  const parts = path.split('/');
  if (parts.length !== 3 || parts[0] !== 'content') return false;
  const [, dir, file] = parts as [string, string, string];
  if (!SEGMENT.test(file) || file.includes('..')) return false;
  return (dir === 'overrides' && file.endsWith('.json')) || (dir === 'blog' && file.endsWith('.md'));
}

const snapshotSchema = z.object({ files: z.record(z.string(), z.unknown()) });

/**
 * A blog post as the file the build reads: front matter with every field but the body (one `key: <JSON value>` line each,
 * keys sorted; JSON scalars and flow collections are valid YAML), a blank line, the Markdown body and a final newline.
 */
export function renderBlogPost(post: unknown): string {
  if (typeof post === 'string') return post.endsWith('\n') ? post : `${post}\n`;
  if (post === null || typeof post !== 'object' || Array.isArray(post)) throw new ContentPublishError('invalid_content');
  const { body_md: body, ...meta } = post as Record<string, unknown>;
  if (typeof body !== 'string') throw new ContentPublishError('invalid_content');
  const lines = Object.keys(meta)
    .filter((key) => /^[a-z][a-z0-9_]*$/.test(key) && meta[key] !== undefined)
    .sort()
    .map((key) => `${key}: ${JSON.stringify(meta[key])}`);
  return `---\n${lines.join('\n')}\n---\n\n${body.replace(/\s+$/, '')}\n`;
}

function renderFile(path: string, value: unknown): string {
  if (path === 'content/pricing.json') {
    // the published catalogue must be a valid one, or the build (and every page that prices) would break; it is written
    // exactly as `pnpm pricing:pull` writes it
    const parsed = pricingSchema.safeParse(value);
    if (!parsed.success) throw new ContentPublishError('invalid_content');
    return stableStringify(parsed.data);
  }
  if (path.endsWith('.json')) return stableStringify(value);
  return renderBlogPost(value);
}

/**
 * The tree of the commit: every file of the snapshot, plus the removal (`sha: null`) of each post that the bot itself published
 * before (`managedBlogPaths`: the files of the previous publication's manifest), that is still in the repo (`existingBlogPaths`:
 * the `.md` files now under `content/blog/`) and is no longer in the snapshot. A post written by hand, or by anyone else, is never
 * deleted: it is not in a manifest. Sorted by path, so the same snapshot is the same commit.
 */
export function buildTree(snapshot: unknown, existingBlogPaths: readonly string[] = [], managedBlogPaths: readonly string[] = []): TreeEntry[] {
  const parsed = snapshotSchema.safeParse(snapshot);
  if (!parsed.success) throw new ContentPublishError('invalid_snapshot');
  const paths = Object.keys(parsed.data.files);
  if (paths.length > MAX_FILES) throw new ContentPublishError('too_many_files');
  for (const path of paths) if (!isAllowedPath(path)) throw new ContentPublishError('path_not_allowed');

  let total = 0;
  const entries: TreeEntry[] = paths.map((path) => {
    const content = renderFile(path, parsed.data.files[path]);
    const bytes = new TextEncoder().encode(content).byteLength;
    if (bytes > MAX_FILE_BYTES) throw new ContentPublishError('file_too_large');
    total += bytes;
    return { path, mode: '100644', type: 'blob', content };
  });
  if (total > MAX_TOTAL_BYTES) throw new ContentPublishError('file_too_large');

  const kept = new Set(paths);
  const managed = new Set(managedBlogPaths);
  for (const path of existingBlogPaths) {
    // only posts this bot published before: allowed shape, directly under content/blog/, in the previous manifest
    if (isAllowedPath(path) && path.startsWith(`${BLOG_DIR}/`) && managed.has(path) && !kept.has(path)) {
      entries.push({ path, mode: '100644', type: 'blob', sha: null });
    }
  }
  return entries.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

/** Only codes and fixed words reach the database and Telegram: never a response body, URL or token. */
function failureReason(error: unknown): string {
  if (error instanceof ContentPublishError) return error.code;
  const message = error instanceof Error ? error.message : '';
  return /^github [a-z ]{1,40}( \d{3}| network error)?$/.test(message) || /^github_[a-z0-9_]{1,40}$/.test(message) ? message : 'unexpected_error';
}

export function commitMessage(fileCount: number, publicationId: string): string {
  return `content: publish ${fileCount} entries (${publicationId})`;
}

const payloadSchema = z.object({ publication_id: z.uuid() });

/**
 * Handler of `content.publish_requested`. Resolves (the event is acked) both when the commit is done and when the publication is
 * marked `failed`; it throws only when the outcome could not be recorded, so the event is retried. Idempotent: a publication that is
 * no longer `queued` is left alone, and a repeated commit of the same snapshot finds the tree unchanged and returns the head.
 */
export async function handlePublishRequested(deps: Deps, payload: Record<string, unknown>, spend: () => void): Promise<void> {
  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success) {
    logEvent('content', 'publish_event_invalid'); // a poisoned event would be retried ten times for nothing
    return;
  }
  const id = parsed.data.publication_id;
  const { contentPublications: publications, repoWriter: writer } = deps;
  if (!publications) throw new Error('content_publications_unavailable');

  spend();
  const publication = await publications.get(id);
  if (!publication) {
    logEvent('content', 'publication_not_found');
    return;
  }
  if (publication.status !== 'queued') return;

  const fail = async (reason: string) => {
    logEvent('content', 'publish_failed', { reason });
    spend();
    await publications.mark({ id, status: 'failed', error: reason });
  };
  if (!writer) {
    await fail('github_not_configured');
    return;
  }

  // A newer publication carries the whole state again: committing this one over it would bring back old content.
  spend();
  if (await publications.hasNewer(publication)) {
    await fail('superseded');
    return;
  }

  let result;
  try {
    const hooks = { onRequest: spend };
    const existing = (await writer.listDirectory(BLOG_DIR, hooks)).filter((p) => p.endsWith('.md'));
    spend();
    const managed = await publications.previousManifest(publication);
    const entries = buildTree(publication.snapshot, existing, managed);
    result = await writer.commit({ message: commitMessage(entries.filter((e) => 'content' in e).length, id), entries }, hooks);
  } catch (error) {
    await fail(failureReason(error));
    return;
  }
  spend();
  await publications.mark({ id, status: 'committed', commitSha: result.commitSha, files: result.files });
}

/** How long a committed publication waits for a deploy run to appear before it is reported as failed. */
export const DEPLOY_RUN_TIMEOUT_MS = 3 * 60 * 60_000;

/** Judges one `committed` publication from its deploy run. Returns what to record, or `undefined` to keep waiting. */
export function judgeDeploy(
  run: { id: number; status: string; conclusion: string | null } | null,
  committedAt: Date | null,
  now: Date,
): { status: 'deployed' | 'failed'; runId?: number; error?: string } | undefined {
  if (!run) {
    return committedAt && now.getTime() - committedAt.getTime() > DEPLOY_RUN_TIMEOUT_MS
      ? { status: 'failed', error: 'no_deploy_run' }
      : undefined;
  }
  if (run.status !== 'completed') return undefined;
  return run.conclusion === 'success'
    ? { status: 'deployed', runId: run.id }
    : { status: 'failed', runId: run.id, error: `deploy_${(run.conclusion ?? 'unknown').replace(/[^a-z_]/g, '').slice(0, 30) || 'unknown'}` };
}
