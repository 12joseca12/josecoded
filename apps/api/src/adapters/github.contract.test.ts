// The GitHub App adapter against a strict fetch mock (task 3.8c): the exact sequence of calls, the body of the tree and of the ref
// update, the JWT it signs, the token cache and the errors that never carry a secret.
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { appJwt, createRepoWriter, gitBlobSha, pemToDer, TOKEN_TTL_MS, type TokenCache } from './github';

import type { TreeEntry } from '../ports';
import type { Env } from '../types/env.types';

const APP_ID = '123456';
const INSTALLATION = '98765';
const HEAD = 'b'.repeat(40);
const BASE_TREE = 't'.repeat(40);
const NEW_TREE = 'n'.repeat(40);
const NEW_COMMIT = 'c'.repeat(40);
const TOKEN = 'ghs_installation_token_value';

let privateKeyPem: string;
let publicKey: CryptoKey;

beforeAll(async () => {
  const pair = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  );
  publicKey = pair.publicKey;
  const der = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey));
  const b64 = btoa(String.fromCharCode(...der)).replace(/(.{64})/g, '$1\n');
  privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${b64}\n-----END PRIVATE KEY-----`;
});

const env = (extra: Partial<Env> = {}): Env => ({
  API_MODE: 'development',
  CORS_ORIGINS: '',
  SUPABASE_URL: 'http://127.0.0.1:54321',
  GITHUB_APP_ID: APP_ID,
  GITHUB_APP_INSTALLATION_ID: INSTALLATION,
  GITHUB_APP_PRIVATE_KEY: privateKeyPem,
  ...extra,
});

type Call = { method: string; path: string; headers: Record<string, string>; body: unknown };

/** A fetch that answers in order and fails the test on any call it was not told about. */
function strictFetch(script: ((call: Call) => Response)[]) {
  const calls: Call[] = [];
  const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const u = new URL(String(url));
    const call: Call = {
      method: init?.method ?? 'GET',
      path: `${u.pathname}${u.search}`,
      headers: init?.headers as Record<string, string>,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    };
    calls.push(call);
    const next = script[calls.length - 1];
    if (!next) throw new Error(`unexpected call #${calls.length}: ${call.method} ${call.path}`);
    return next(call);
  }) as unknown as typeof fetch;
  return { calls, fetchImpl };
}
const reply = (status: number, body: unknown) => () => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const tokenStep = reply(201, { token: TOKEN, expires_at: '2099-01-01T00:00:00Z' });
const refStep = reply(200, { object: { sha: HEAD } });
const commitGetStep = reply(200, { sha: HEAD, tree: { sha: BASE_TREE } });
const treeStep = reply(201, { sha: NEW_TREE, tree: [{ path: 'content', type: 'tree', sha: 'd'.repeat(40) }] });
const commitPostStep = reply(201, { sha: NEW_COMMIT });
const refPatchStep = reply(200, { object: { sha: NEW_COMMIT } });

const entries: TreeEntry[] = [
  { path: 'content/pricing.json', mode: '100644', type: 'blob', content: '{}\n' },
  { path: 'content/blog/viejo.es.md', mode: '100644', type: 'blob', sha: null },
];

describe('JWT and key handling', () => {
  it('signs a RS256 app JWT that verifies with the public key and lives under ten minutes', async () => {
    const now = Date.UTC(2026, 10, 2, 12, 0, 0);
    const jwt = await appJwt(APP_ID, privateKeyPem, now);
    const [h, p, s] = jwt.split('.') as [string, string, string];
    const decode = (x: string) => JSON.parse(atob(x.replace(/-/g, '+').replace(/_/g, '/'))) as Record<string, unknown>;
    expect(decode(h)).toEqual({ alg: 'RS256', typ: 'JWT' });
    const claims = decode(p) as { iat: number; exp: number; iss: string };
    expect(claims.iss).toBe(APP_ID);
    expect(claims.exp - claims.iat).toBeLessThanOrEqual(600);
    expect(claims.iat).toBeLessThan(now / 1000);
    const signature = Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), (c) => c.charCodeAt(0));
    expect(await crypto.subtle.verify('RSASSA-PKCS1-v1_5', publicKey, signature, new TextEncoder().encode(`${h}.${p}`))).toBe(true);
  });

  it('accepts a PEM with escaped newlines (how a one-line secret arrives) and refuses PKCS#1 with a hint', () => {
    expect(pemToDer(privateKeyPem.replace(/\n/g, '\\n')).byteLength).toBeGreaterThan(1000);
    expect(() => pemToDer('-----BEGIN RSA PRIVATE KEY-----\nabc\n-----END RSA PRIVATE KEY-----')).toThrow('github_key_must_be_pkcs8');
    expect(() => pemToDer('garbage')).toThrow('github_key_invalid');
  });

  it('hashes a blob like git does', async () => {
    expect(await gitBlobSha('hello\n')).toBe('ce013625030ba8dba906f756967f9e9ca394464a');
    expect(await gitBlobSha('')).toBe('e69de29bb2d1d6434b8b29ae775ad8c2e48c5391');
  });
});

describe('createRepoWriter', () => {
  it('is absent unless the three secrets are set', () => {
    for (const k of ['GITHUB_APP_ID', 'GITHUB_APP_INSTALLATION_ID', 'GITHUB_APP_PRIVATE_KEY'] as const) {
      expect(createRepoWriter(env({ [k]: undefined }))).toBeUndefined();
    }
  });

  it('commits with the exact sequence ref -> commit -> tree -> commit -> ref, force false, as the bot', async () => {
    const { calls, fetchImpl } = strictFetch([tokenStep, refStep, commitGetStep, treeStep, commitPostStep, refPatchStep]);
    const tokens: TokenCache = {};
    const onRequest = vi.fn();
    const result = await createRepoWriter(env(), fetchImpl, { now: () => Date.UTC(2026, 10, 2), tokens })!.commit(
      { message: 'content: publish 1 entries (p1)', entries },
      { onRequest },
    );

    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      `POST /app/installations/${INSTALLATION}/access_tokens`,
      'GET /repos/12joseca12/josecoded/git/ref/heads/main',
      `GET /repos/12joseca12/josecoded/git/commits/${HEAD}`,
      'POST /repos/12joseca12/josecoded/git/trees',
      'POST /repos/12joseca12/josecoded/git/commits',
      'PATCH /repos/12joseca12/josecoded/git/refs/heads/main',
    ]);
    expect(onRequest).toHaveBeenCalledTimes(6);
    // the token request is the app JWT, narrowed to this repo and to contents:write + actions:read
    expect(calls[0]!.headers.authorization).toMatch(/^Bearer eyJ/);
    expect(calls[0]!.body).toEqual({ repositories: ['josecoded'], permissions: { contents: 'write', actions: 'read' } });
    for (const c of calls.slice(1)) {
      expect(c.headers.authorization).toBe(`Bearer ${TOKEN}`);
      expect(c.headers['x-github-api-version']).toBe('2022-11-28');
      expect(c.headers['user-agent']).toBe('josecoded-bot');
    }
    // the tree: onto the head's tree, files inline, deletions as sha null
    expect(calls[3]!.body).toEqual({ base_tree: BASE_TREE, tree: entries });
    const commit = calls[4]!.body as { message: string; tree: string; parents: string[]; author: { name: string }; committer: { name: string } };
    expect(commit).toMatchObject({ message: 'content: publish 1 entries (p1)', tree: NEW_TREE, parents: [HEAD] });
    expect(commit.author.name).toBe('josecoded-bot[bot]');
    expect(commit.committer.name).toBe('josecoded-bot[bot]');
    expect(calls[5]!.body).toEqual({ sha: NEW_COMMIT, force: false });
    expect(result).toEqual({ commitSha: NEW_COMMIT, changed: true, files: { 'content/pricing.json': await gitBlobSha('{}\n') } });
  });

  it('reuses the installation token for 50 minutes and asks for a new one after that', async () => {
    let now = 1_000_000;
    const { calls, fetchImpl } = strictFetch([tokenStep, reply(404, {}), reply(200, []), tokenStep, reply(200, [])]);
    const writer = createRepoWriter(env(), fetchImpl, { now: () => now, tokens: {} })!;
    await writer.listDirectory('content/blog');
    await writer.listDirectory('content/blog');
    expect(calls.filter((c) => c.path.includes('access_tokens'))).toHaveLength(1);
    now += TOKEN_TTL_MS;
    await writer.listDirectory('content/blog');
    expect(calls.filter((c) => c.path.includes('access_tokens'))).toHaveLength(2);
  });

  it('retries once when the branch moved (422 on the ref update), on top of the new head', async () => {
    const NEWER = 'e'.repeat(40);
    const { calls, fetchImpl } = strictFetch([
      tokenStep, refStep, commitGetStep, treeStep, commitPostStep, reply(422, { message: 'Update is not a fast forward' }),
      reply(200, { object: { sha: NEWER } }), reply(200, { sha: NEWER, tree: { sha: 'u'.repeat(40) } }), treeStep, commitPostStep, refPatchStep,
    ]);
    const result = await createRepoWriter(env(), fetchImpl, { tokens: {} })!.commit({ message: 'm', entries });
    expect(result.changed).toBe(true);
    const second = calls.filter((c) => c.path.endsWith('/git/commits'))[1]!.body as { parents: string[] };
    expect(second.parents).toEqual([NEWER]);
    expect(calls.filter((c) => c.method === 'PATCH')).toHaveLength(2);
  });

  it('gives up after the second 422 instead of looping or forcing', async () => {
    const { fetchImpl } = strictFetch([
      tokenStep, refStep, commitGetStep, treeStep, commitPostStep, reply(422, {}),
      refStep, commitGetStep, treeStep, commitPostStep, reply(422, {}),
    ]);
    await expect(createRepoWriter(env(), fetchImpl, { tokens: {} })!.commit({ message: 'm', entries })).rejects.toThrow('github update ref 422');
  });

  it('creates no commit when the tree is the one already in the repo', async () => {
    const { calls, fetchImpl } = strictFetch([tokenStep, refStep, commitGetStep, reply(201, { sha: BASE_TREE, tree: [] })]);
    const result = await createRepoWriter(env(), fetchImpl, { tokens: {} })!.commit({ message: 'm', entries });
    expect(result).toMatchObject({ commitSha: HEAD, changed: false });
    expect(calls.some((c) => c.path.endsWith('/git/commits') && c.method === 'POST')).toBe(false);
    expect(calls.some((c) => c.method === 'PATCH')).toBe(false);
  });

  it('lists the files directly under a directory, and nothing when it does not exist', async () => {
    const listing = [
      { type: 'file', path: 'content/blog/a.es.md' },
      { type: 'dir', path: 'content/blog/sub' },
      { type: 'file', path: 'content/blog/b.en.md' },
    ];
    const { calls, fetchImpl } = strictFetch([tokenStep, reply(200, listing), reply(404, { message: 'Not Found' })]);
    const writer = createRepoWriter(env(), fetchImpl, { tokens: {} })!;
    expect(await writer.listDirectory('content/blog')).toEqual(['content/blog/a.es.md', 'content/blog/b.en.md']);
    expect(calls[1]!.path).toBe('/repos/12joseca12/josecoded/contents/content/blog?ref=main');
    expect(await writer.listDirectory('content/blog')).toEqual([]);
  });

  it('finds the deploy run of a commit', async () => {
    const { calls, fetchImpl } = strictFetch([
      tokenStep,
      reply(200, { workflow_runs: [{ id: 555, status: 'completed', conclusion: 'success' }] }),
      reply(200, { workflow_runs: [] }),
    ]);
    const writer = createRepoWriter(env(), fetchImpl, { tokens: {} })!;
    expect(await writer.workflowRunForSha(NEW_COMMIT)).toEqual({ id: 555, status: 'completed', conclusion: 'success' });
    expect(calls[1]!.path).toBe(`/repos/12joseca12/josecoded/actions/workflows/deploy-production.yml/runs?head_sha=${NEW_COMMIT}&per_page=5`);
    expect(await writer.workflowRunForSha(NEW_COMMIT)).toBeNull();
    await expect(writer.workflowRunForSha('../x')).rejects.toThrow('github invalid sha');
  });

  it('honours GITHUB_REPO and GITHUB_BRANCH', async () => {
    const { calls, fetchImpl } = strictFetch([tokenStep, refStep, commitGetStep, reply(201, { sha: BASE_TREE })]);
    await createRepoWriter(env({ GITHUB_REPO: 'acme/site', GITHUB_BRANCH: 'release' }), fetchImpl, { tokens: {} })!.commit({ message: 'm', entries });
    expect(calls[1]!.path).toBe('/repos/acme/site/git/ref/heads/release');
    expect((calls[0]!.body as { repositories: string[] }).repositories).toEqual(['site']);
  });

  it('errors name the step and the status only: no token, key, url or response body', async () => {
    const secretBody = reply(401, { message: `Bad credentials ${TOKEN} ${privateKeyPem}` });
    const failing = strictFetch([secretBody]);
    const error = await createRepoWriter(env(), failing.fetchImpl, { tokens: {} })!.commit({ message: 'm', entries }).catch((e: Error) => e);
    expect((error as Error).message).toBe('github installation token 401');

    const boom = vi.fn(async () => {
      throw new Error(`fetch failed https://api.github.com Bearer ${TOKEN}`);
    }) as unknown as typeof fetch;
    const net = await createRepoWriter(env(), boom, { tokens: {} })!.commit({ message: 'm', entries }).catch((e: Error) => e);
    expect((net as Error).message).toBe('github installation token network error');
    expect(JSON.stringify(net)).not.toContain(TOKEN);
  });
});
