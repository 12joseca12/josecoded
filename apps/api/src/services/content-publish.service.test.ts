import { beforeEach, describe, expect, it, vi } from 'vitest';

import { pricing, stableStringify } from '@josecoded/pricing';

import {
  buildTree,
  commitMessage,
  ContentPublishError,
  DEPLOY_RUN_TIMEOUT_MS,
  handlePublishRequested,
  isAllowedPath,
  judgeDeploy,
  MAX_FILES,
  renderBlogPost,
} from './content-publish.service';
import { createFakeClock } from '../../test/fakes/clock.fake';
import { createFakePublications, createFakeRepoWriter } from '../../test/fakes/content.fake';

import type { Deps } from '../deps';

const ID = '33333333-3333-4333-8333-333333333333';
const PREVIOUS = '22222222-2222-4222-8222-222222222222';
const NEWER = '44444444-4444-4444-8444-444444444444';
const code = (fn: () => unknown) => {
  try {
    fn();
  } catch (error) {
    return error instanceof ContentPublishError ? error.code : 'other';
  }
  return 'none';
};

describe('isAllowedPath', () => {
  it.each(['content/pricing.json', 'content/overrides/messages.es.json', 'content/overrides/faq.json', 'content/blog/hola-mundo.es.md'])('allows %s', (p) =>
    expect(isAllowedPath(p)).toBe(true),
  );
  it.each([
    'apps/web/x.ts',
    '.github/workflows/deploy-production.yml',
    'content/pricing.json.bak',
    'content/pricing.json/../x',
    'content/overrides/../../apps/web/x.json',
    'content/overrides/sub/a.json',
    'content/overrides/a.md',
    'content/blog/a.json',
    'content/blog/.md',
    'content/blog/../pricing.json',
    'content/generated/messages.es.json',
    '/content/pricing.json',
    'content//pricing.json',
    'content/overrides/a b.json',
    'content/overrides/a\\b.json',
    'package.json',
    '',
  ])('refuses %j', (p) => expect(isAllowedPath(p)).toBe(false));
});

describe('buildTree', () => {
  it('rejects a path outside the three allowed places', () => {
    expect(code(() => buildTree({ files: { 'apps/web/x.ts': 'boom' } }))).toBe('path_not_allowed');
    expect(code(() => buildTree({ files: { 'content/overrides/a.json': {}, '.github/workflows/x.yml': 'x' } }))).toBe('path_not_allowed');
  });

  it('serializes JSON with sorted keys and a final newline', () => {
    const [entry] = buildTree({ files: { 'content/overrides/settings.json': { b: 1, a: [2] } } });
    expect(entry).toEqual({ path: 'content/overrides/settings.json', mode: '100644', type: 'blob', content: '{\n  "a": [\n    2\n  ],\n  "b": 1\n}\n' });
  });

  it('writes content/pricing.json byte for byte as pricing:pull does, and refuses an invalid catalogue', () => {
    const [entry] = buildTree({ files: { 'content/pricing.json': pricing } });
    expect(entry).toMatchObject({ path: 'content/pricing.json', content: stableStringify(pricing) });
    expect(code(() => buildTree({ files: { 'content/pricing.json': { ...pricing, hourly: -5 } } }))).toBe('invalid_content');
    expect(code(() => buildTree({ files: { 'content/pricing.json': { hello: 'world' } } }))).toBe('invalid_content');
  });

  it('removes a post the bot published before that is in the repo and no longer in the snapshot (sha: null), and keeps the published ones', () => {
    const tree = buildTree(
      { files: { 'content/blog/uno.es.md': { title: 'Uno', body_md: 'Hola' } } },
      ['content/blog/uno.es.md', 'content/blog/viejo.es.md'],
      ['content/blog/uno.es.md', 'content/blog/viejo.es.md'],
    );
    expect(tree.map((e) => [e.path, 'sha' in e ? e.sha : 'content'])).toEqual([
      ['content/blog/uno.es.md', 'content'],
      ['content/blog/viejo.es.md', null],
    ]);
  });

  it('never deletes a post that is not in the previous manifest (written by hand), nor one the manifest names that is not in the repo', () => {
    const tree = buildTree({ files: {} }, ['content/blog/a-mano.es.md', 'content/blog/bot.es.md'], ['content/blog/bot.es.md', 'content/blog/ya-no-esta.es.md']);
    expect(tree.map((e) => [e.path, 'sha' in e ? e.sha : 'content'])).toEqual([['content/blog/bot.es.md', null]]);
    expect(buildTree({ files: {} }, ['content/blog/a-mano.es.md'])).toEqual([]);
  });

  it('never deletes anything outside content/blog/*.md, whatever the listing says', () => {
    const tree = buildTree({ files: {} }, ['content/blog/x.es.md', 'content/pricing.json', 'apps/web/page.tsx', 'content/blog/../x.md', 'content/blog/readme.txt'], [
      'content/blog/x.es.md',
      'content/pricing.json',
      'apps/web/page.tsx',
      'content/blog/../x.md',
      'content/blog/readme.txt',
    ]);
    expect(tree.map((e) => e.path)).toEqual(['content/blog/x.es.md']);
  });

  it('is deterministic: same snapshot, same entries in the same order', () => {
    const files = { 'content/overrides/b.json': { x: 1 }, 'content/overrides/a.json': { y: 2 }, 'content/pricing.json': pricing };
    expect(buildTree({ files })).toEqual(buildTree({ files: Object.fromEntries(Object.entries(files).reverse()) }));
    expect(buildTree({ files }).map((e) => e.path)).toEqual(['content/overrides/a.json', 'content/overrides/b.json', 'content/pricing.json']);
  });

  it(`refuses more than ${MAX_FILES} files, a malformed snapshot and an oversized file`, () => {
    const many = Object.fromEntries(Array.from({ length: MAX_FILES + 1 }, (_, i) => [`content/overrides/f${i}.json`, {}]));
    expect(code(() => buildTree({ files: many }))).toBe('too_many_files');
    expect(code(() => buildTree({ files: Object.fromEntries(Array.from({ length: MAX_FILES }, (_, i) => [`content/overrides/f${i}.json`, {}])) }))).toBe('none');
    expect(code(() => buildTree(null))).toBe('invalid_snapshot');
    expect(code(() => buildTree({ files: [] }))).toBe('invalid_snapshot');
    expect(code(() => buildTree({ files: { 'content/overrides/big.json': { text: 'x'.repeat(600 * 1024) } } }))).toBe('file_too_large');
  });
});

describe('renderBlogPost', () => {
  it('writes sorted front matter as JSON scalars, a blank line, the body and a final newline', () => {
    expect(renderBlogPost({ title: 'Hola "mundo"', body_md: '# Hola\n\nTexto\n\n', date: '2026-11-01', tags: ['a', 'b'], published: true })).toBe(
      '---\ndate: "2026-11-01"\npublished: true\ntags: ["a","b"]\ntitle: "Hola \\"mundo\\""\n---\n\n# Hola\n\nTexto\n',
    );
  });

  it('a plain string is the file; anything else without a body is invalid', () => {
    expect(renderBlogPost('# Solo texto')).toBe('# Solo texto\n');
    expect(code(() => renderBlogPost({ title: 'x' }))).toBe('invalid_content');
    expect(code(() => renderBlogPost(42))).toBe('invalid_content');
    expect(code(() => renderBlogPost(['a']))).toBe('invalid_content');
  });

  it('drops odd keys instead of writing them into the front matter', () => {
    expect(renderBlogPost({ body_md: 'x', 'bad key\nevil: 1': 'y', title: 't' })).toBe('---\ntitle: "t"\n---\n\nx\n');
  });
});

describe('judgeDeploy', () => {
  const now = new Date('2026-11-02T12:00:00Z');
  const recent = new Date(now.getTime() - 60_000);
  it('waits while the run is going or has not appeared', () => {
    expect(judgeDeploy({ id: 1, status: 'in_progress', conclusion: null }, recent, now)).toBeUndefined();
    expect(judgeDeploy(null, recent, now)).toBeUndefined();
  });
  it('success deploys, any other end fails with a fixed reason and the run id', () => {
    expect(judgeDeploy({ id: 9, status: 'completed', conclusion: 'success' }, recent, now)).toEqual({ status: 'deployed', runId: 9 });
    expect(judgeDeploy({ id: 9, status: 'completed', conclusion: 'failure' }, recent, now)).toEqual({ status: 'failed', runId: 9, error: 'deploy_failure' });
    expect(judgeDeploy({ id: 9, status: 'completed', conclusion: null }, recent, now)).toMatchObject({ error: 'deploy_unknown' });
  });
  it('reports no_deploy_run after the timeout', () => {
    expect(judgeDeploy(null, new Date(now.getTime() - DEPLOY_RUN_TIMEOUT_MS - 1), now)).toEqual({ status: 'failed', error: 'no_deploy_run' });
  });
});

describe('handlePublishRequested', () => {
  const snapshot = { files: { 'content/overrides/settings.json': { a: 1 }, 'content/pricing.json': pricing } };
  const setup = (over: { status?: 'queued' | 'committed'; snapshot?: unknown; writer?: boolean } = {}) => {
    const publications = createFakePublications([{ id: ID, status: over.status ?? 'queued', snapshot: over.snapshot ?? snapshot }]);
    const repoWriter = createFakeRepoWriter();
    const deps = { clock: createFakeClock(), contentPublications: publications, ...(over.writer === false ? {} : { repoWriter }) } as unknown as Deps;
    const spend = vi.fn();
    return { publications, repoWriter, deps, spend };
  };

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('commits the snapshot once and marks the publication committed with the sha and the files', async () => {
    const { deps, publications, repoWriter, spend } = setup();
    repoWriter.blog = ['content/blog/viejo.es.md'];
    publications.rows.set(PREVIOUS, {
      id: PREVIOUS,
      status: 'deployed',
      snapshot: { files: {} },
      commitSha: 'b'.repeat(40),
      committedAt: null,
      createdAt: new Date(1000),
      files: { 'content/blog/viejo.es.md': 'sha' },
    });
    publications.rows.get(ID)!.createdAt = new Date(2000);
    await handlePublishRequested(deps, { publication_id: ID }, spend);
    expect(repoWriter.commits).toHaveLength(1);
    expect(repoWriter.commits[0]?.message).toBe(`content: publish 2 entries (${ID})`);
    expect(repoWriter.commits[0]?.message).not.toMatch(/co-authored|claude|generated/i);
    expect(repoWriter.commits[0]?.entries.map((e) => e.path)).toEqual(['content/blog/viejo.es.md', 'content/overrides/settings.json', 'content/pricing.json']);
    expect(publications.marks).toEqual([
      { id: ID, status: 'committed', commitSha: 'a'.repeat(40), files: { 'content/overrides/settings.json': 'sha-of-content/overrides/settings.json', 'content/pricing.json': 'sha-of-content/pricing.json' } },
    ]);
    expect(spend).toHaveBeenCalled();
  });

  it('does not delete a hand-written post: it is not in the previous manifest', async () => {
    const { deps, repoWriter } = setup();
    repoWriter.blog = ['content/blog/a-mano.es.md'];
    await handlePublishRequested(deps, { publication_id: ID }, vi.fn());
    expect(repoWriter.commits[0]?.entries.map((e) => e.path)).not.toContain('content/blog/a-mano.es.md');
  });

  it.each(['queued', 'committed', 'deployed'] as const)('never commits over a newer publication (%s): it is marked failed: superseded', async (status) => {
    const { deps, publications, repoWriter } = setup();
    publications.rows.get(ID)!.createdAt = new Date(1000);
    publications.rows.set(NEWER, { id: NEWER, status, snapshot: { files: {} }, commitSha: null, committedAt: null, createdAt: new Date(2000) });
    await handlePublishRequested(deps, { publication_id: ID }, vi.fn());
    expect(repoWriter.commits).toHaveLength(0);
    expect(publications.marks).toEqual([{ id: ID, status: 'failed', error: 'superseded' }]);
  });

  it('a newer publication that failed does not block an older one', async () => {
    const { deps, publications, repoWriter } = setup();
    publications.rows.get(ID)!.createdAt = new Date(1000);
    publications.rows.set(NEWER, { id: NEWER, status: 'failed', snapshot: { files: {} }, commitSha: null, committedAt: null, createdAt: new Date(2000) });
    await handlePublishRequested(deps, { publication_id: ID }, vi.fn());
    expect(repoWriter.commits).toHaveLength(1);
  });

  it('without the GitHub App secrets the publication is marked failed: github_not_configured', async () => {
    const { deps, publications } = setup({ writer: false });
    await handlePublishRequested(deps, { publication_id: ID }, vi.fn());
    expect(publications.marks).toEqual([{ id: ID, status: 'failed', error: 'github_not_configured' }]);
  });

  it('a snapshot with a path outside the whitelist fails without touching GitHub', async () => {
    const { deps, publications, repoWriter } = setup({ snapshot: { files: { 'apps/web/x.ts': 'boom' } } });
    await handlePublishRequested(deps, { publication_id: ID }, vi.fn());
    expect(repoWriter.commits).toEqual([]);
    expect(publications.marks).toEqual([{ id: ID, status: 'failed', error: 'path_not_allowed' }]);
  });

  it('a GitHub failure is recorded with a fixed reason: no token, url or body', async () => {
    const { deps, publications, repoWriter } = setup();
    repoWriter.failWith = new Error('github create tree 422');
    await handlePublishRequested(deps, { publication_id: ID }, vi.fn());
    expect(publications.marks[0]).toEqual({ id: ID, status: 'failed', error: 'github create tree 422' });

    const second = setup();
    second.repoWriter.failWith = new Error('request to https://api.github.com failed: Bearer ghs_secret');
    await handlePublishRequested(second.deps, { publication_id: ID }, vi.fn());
    expect(second.publications.marks[0]).toEqual({ id: ID, status: 'failed', error: 'unexpected_error' });
  });

  it('is idempotent: a publication that is no longer queued is left alone, an unknown or malformed event is dropped', async () => {
    const committed = setup({ status: 'committed' });
    await handlePublishRequested(committed.deps, { publication_id: ID }, vi.fn());
    expect(committed.repoWriter.commits).toEqual([]);
    expect(committed.publications.marks).toEqual([]);

    const empty = setup();
    await handlePublishRequested(empty.deps, { publication_id: '44444444-4444-4444-8444-444444444444' }, vi.fn());
    await handlePublishRequested(empty.deps, { publication_id: 'not-a-uuid' }, vi.fn());
    await handlePublishRequested(empty.deps, {}, vi.fn());
    expect(empty.publications.marks).toEqual([]);
  });

  it('when the outcome cannot be recorded the handler throws, so the event is retried', async () => {
    const { deps, publications } = setup();
    publications.markFails = new Error('content_publication_mark: down');
    await expect(handlePublishRequested(deps, { publication_id: ID }, vi.fn())).rejects.toThrow('down');
  });

  it('commit message has no trailers of an AI: it is the bot', () => {
    expect(commitMessage(3, ID)).toBe(`content: publish 3 entries (${ID})`);
  });
});
