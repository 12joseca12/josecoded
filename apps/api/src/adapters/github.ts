// Real adapter of RepoWriter: the GitHub App `josecoded-bot` writing the published content to the repo (task 3.8c, DATOS §14.5).
// App JWT (RS256, `crypto.subtle`) -> installation token (cached 50 min, scoped to this repo with `contents:write` and
// `actions:read`) -> Git Data API: ref, commit, tree (with the files inline: one request however many files), commit, ref
// (`force: false`, one retry if the branch moved). The plan's createBlob per file is folded into createTree with inline content:
// one subrequest instead of n (Workers Free allows 50 per invocation, shared with the rest of the tick). The private key (PKCS8 PEM) only ever lives in `GITHUB_APP_PRIVATE_KEY`, a
// Worker secret: it is never logged and no error carries a token, a URL or a response body.
import { toBase64Url } from '../utils/crypto';

import type { RepoCallHooks, RepoCommitResult, RepoWriter, TreeEntry, WorkflowRunSummary } from '../ports';
import type { Env } from '../types/env.types';

export const DEFAULT_REPO = '12joseca12/josecoded';
export const DEFAULT_BRANCH = 'main';
export const DEPLOY_WORKFLOW = 'deploy-production.yml';
/** The installation token lives one hour; it is renewed after 50 minutes. */
export const TOKEN_TTL_MS = 50 * 60_000;
const API = 'https://api.github.com';
const BOT = 'josecoded-bot[bot]';

export interface TokenCache {
  entry?: { token: string; expiresAt: number };
}
/** Lives as long as the isolate (buildDeps runs per request). */
const isolateTokens: TokenCache = {};

const encoder = new TextEncoder();

/** PKCS8 PEM ("BEGIN PRIVATE KEY") -> DER. GitHub hands out PKCS#1 ("BEGIN RSA PRIVATE KEY"): convert it once with `openssl pkcs8 -topk8 -nocrypt`. */
export function pemToDer(pem: string): Uint8Array<ArrayBuffer> {
  const text = pem.replace(/\\n/g, '\n').trim();
  if (/BEGIN RSA PRIVATE KEY/.test(text)) throw new Error('github_key_must_be_pkcs8');
  const body = /-----BEGIN PRIVATE KEY-----([\s\S]+?)-----END PRIVATE KEY-----/.exec(text)?.[1];
  if (!body) throw new Error('github_key_invalid');
  const binary = atob(body.replace(/\s+/g, ''));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export async function appJwt(appId: string, privateKeyPem: string, nowMs: number): Promise<string> {
  const key = await crypto.subtle.importKey('pkcs8', pemToDer(privateKeyPem), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const seconds = Math.floor(nowMs / 1000);
  // iat 60 s in the past absorbs clock drift; GitHub caps the lifetime at 10 minutes
  const signingInput = `${toBase64Url(encoder.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })))}.${toBase64Url(
    encoder.encode(JSON.stringify({ iat: seconds - 60, exp: seconds + 9 * 60, iss: appId })),
  )}`;
  const signature = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, encoder.encode(signingInput)));
  return `${signingInput}.${toBase64Url(signature)}`;
}

type Json = Record<string, unknown>;

/** The id git gives a file: sha1 of `blob <bytes>\0<content>`. */
export async function gitBlobSha(content: string): Promise<string> {
  const body = encoder.encode(content);
  const header = encoder.encode(`blob ${body.byteLength}\0`);
  const bytes = new Uint8Array(header.byteLength + body.byteLength);
  bytes.set(header);
  bytes.set(body, header.byteLength);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-1', bytes));
  return [...digest].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** `undefined` unless the three secrets of the App are set. */
export function createRepoWriter(
  env: Env,
  fetchImpl: typeof fetch = fetch,
  options: { now?: () => number; tokens?: TokenCache } = {},
): RepoWriter | undefined {
  const appId = env.GITHUB_APP_ID?.trim();
  const installationId = env.GITHUB_APP_INSTALLATION_ID?.trim();
  const privateKey = env.GITHUB_APP_PRIVATE_KEY?.trim();
  if (!appId || !installationId || !privateKey) return undefined;
  const now = options.now ?? Date.now;
  const tokens = options.tokens ?? isolateTokens;
  const repo = env.GITHUB_REPO?.trim() || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH?.trim() || DEFAULT_BRANCH;
  const [owner = '', name = ''] = repo.split('/');

  async function request(method: string, path: string, token: string | null, body?: unknown, hooks?: RepoCallHooks, step = path): Promise<{ status: number; data: Json | unknown[] | null }> {
    hooks?.onRequest?.();
    let res: Response;
    try {
      res = await fetchImpl(`${API}${path}`, {
        method,
        headers: {
          accept: 'application/vnd.github+json',
          'x-github-api-version': '2022-11-28',
          'user-agent': 'josecoded-bot',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
          ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
    } catch {
      throw new Error(`github ${step} network error`);
    }
    const data = (await res.json().catch(() => null)) as Json | unknown[] | null;
    return { status: res.status, data };
  }

  async function installationToken(hooks?: RepoCallHooks): Promise<string> {
    if (tokens.entry && tokens.entry.expiresAt > now()) return tokens.entry.token;
    const jwt = await appJwt(appId!, privateKey!, now());
    const res = await request(
      'POST',
      `/app/installations/${encodeURIComponent(installationId!)}/access_tokens`,
      jwt,
      { repositories: [name], permissions: { contents: 'write', actions: 'read' } },
      hooks,
      'installation token',
    );
    const token = (res.data as Json | null)?.token;
    if (res.status !== 201 || typeof token !== 'string') throw new Error(`github installation token ${res.status}`);
    tokens.entry = { token, expiresAt: now() + TOKEN_TTL_MS };
    return token;
  }

  const repoPath = (rest: string) => `/repos/${owner}/${name}${rest}`;

  async function call(method: string, rest: string, body: unknown, hooks: RepoCallHooks | undefined, step: string, expected: number[]): Promise<Json> {
    const token = await installationToken(hooks);
    const res = await request(method, repoPath(rest), token, body, hooks, step);
    if (!expected.includes(res.status)) throw new Error(`github ${step} ${res.status}`);
    return (res.data ?? {}) as Json;
  }

  const str = (value: unknown, what: string): string => {
    if (typeof value !== 'string' || value === '') throw new Error(`github unexpected response: ${what}`);
    return value;
  };

  async function attemptCommit(input: { message: string; entries: TreeEntry[] }, hooks?: RepoCallHooks): Promise<RepoCommitResult | 'moved'> {
    const ref = await call('GET', `/git/ref/heads/${branch}`, undefined, hooks, 'get ref', [200]);
    const head = str((ref.object as Json | undefined)?.sha, 'ref sha');
    const headCommit = await call('GET', `/git/commits/${head}`, undefined, hooks, 'get commit', [200]);
    const baseTree = str((headCommit.tree as Json | undefined)?.sha, 'commit tree');

    const tree = await call('POST', '/git/trees', { base_tree: baseTree, tree: input.entries }, hooks, 'create tree', [201]);
    const treeSha = str(tree.sha, 'tree sha');
    // the blob ids git itself assigns (the response of createTree lists directories, not the files inside them)
    const files: Record<string, string> = {};
    for (const entry of input.entries) if ('content' in entry) files[entry.path] = await gitBlobSha(entry.content);
    // nothing to commit: the repo already holds exactly this (a retried publication, or a republish without changes)
    if (treeSha === baseTree) return { commitSha: head, files, changed: false };

    const when = new Date(now()).toISOString();
    const identity = { name: BOT, email: `${appId}+${BOT}@users.noreply.github.com`, date: when };
    const commit = await call(
      'POST',
      '/git/commits',
      { message: input.message, tree: treeSha, parents: [head], author: identity, committer: identity },
      hooks,
      'create commit',
      [201],
    );
    const commitSha = str(commit.sha, 'commit sha');

    const token = await installationToken(hooks);
    const update = await request('PATCH', repoPath(`/git/refs/heads/${branch}`), token, { sha: commitSha, force: false }, hooks, 'update ref');
    if (update.status === 422) return 'moved'; // not a fast-forward: somebody pushed in between
    if (update.status !== 200) throw new Error(`github update ref ${update.status}`);
    return { commitSha, files, changed: true };
  }

  return {
    async listDirectory(dir, hooks) {
      const token = await installationToken(hooks);
      const res = await request('GET', repoPath(`/contents/${dir}?ref=${encodeURIComponent(branch)}`), token, undefined, hooks, 'list directory');
      if (res.status === 404) return [];
      if (res.status !== 200 || !Array.isArray(res.data)) throw new Error(`github list directory ${res.status}`);
      return (res.data as Json[]).flatMap((e) => (e.type === 'file' && typeof e.path === 'string' ? [e.path] : []));
    },

    async commit(input, hooks) {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const result = await attemptCommit(input, hooks);
        if (result !== 'moved') return result;
      }
      throw new Error('github update ref 422');
    },

    async workflowRunForSha(sha, hooks): Promise<WorkflowRunSummary | null> {
      if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error('github invalid sha');
      const token = await installationToken(hooks);
      const res = await request(
        'GET',
        repoPath(`/actions/workflows/${DEPLOY_WORKFLOW}/runs?head_sha=${sha}&per_page=5`),
        token,
        undefined,
        hooks,
        'list runs',
      );
      if (res.status !== 200) throw new Error(`github list runs ${res.status}`);
      const run = ((res.data as Json | null)?.workflow_runs as Json[] | undefined)?.[0];
      if (!run || typeof run.id !== 'number') return null;
      return { id: run.id, status: typeof run.status === 'string' ? run.status : 'unknown', conclusion: typeof run.conclusion === 'string' ? run.conclusion : null };
    },
  };
}
