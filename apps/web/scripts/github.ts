// Writes content/generated/github.json: the public repositories the project sheets link to. It only feeds links and
// JSON-LD; no figure from GitHub (stars, commits) is ever shown (the site publishes no metrics).
// Run by `pnpm --filter @josecoded/web content:refresh`, never by the build: a build must not need the network.
// With no `repoUrl` in any sheet (today: none, the josecoded repository is private) it writes an empty file; a failed
// request keeps the committed file's entry, so a GitHub outage never empties a link.
// Runs with plain Node (type stripping): internal imports carry `.ts`.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { projectSchema } from '../content/projects/schema.ts';
import { isPendingDato } from '../lib/content/dato.ts';

export interface GithubEntry {
  url: string;
  pushedAt: string | null;
}
export type GithubIndex = Record<string, GithubEntry>;

type Fetch = (url: string, init?: { headers?: Record<string, string> }) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

/** `https://github.com/owner/name` to `owner/name`, or `null` for anything else. */
export function repoSlug(repoUrl: string): string | null {
  const match = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/.exec(repoUrl);
  return match ? `${match[1]}/${match[2]}` : null;
}

export async function fetchGithub(
  repos: Record<string, string>,
  previous: GithubIndex,
  { token, fetchImpl = fetch as unknown as Fetch }: { token?: string; fetchImpl?: Fetch } = {},
): Promise<GithubIndex> {
  const result: GithubIndex = {};
  for (const [slug, repoUrl] of Object.entries(repos)) {
    const full = repoSlug(repoUrl);
    const kept = previous[slug];
    if (!full) continue;
    try {
      const response = await fetchImpl(`https://api.github.com/repos/${full}`, {
        headers: { accept: 'application/vnd.github+json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      });
      if (!response.ok) throw new Error('github request failed');
      const body = (await response.json()) as { html_url?: string; pushed_at?: string | null };
      result[slug] = { url: body.html_url ?? repoUrl, pushedAt: body.pushed_at ?? null };
    } catch {
      result[slug] = kept ?? { url: repoUrl, pushedAt: null };
    }
  }
  return result;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const contentRoot = fileURLToPath(new URL('../content', import.meta.url));
  const dir = join(contentRoot, 'projects');
  const repos: Record<string, string> = {};
  for (const name of readdirSync(dir).filter((file) => file.endsWith('.json'))) {
    const sheet = projectSchema.parse(JSON.parse(readFileSync(join(dir, name), 'utf8')));
    if (sheet.proofs.repoUrl && !isPendingDato(sheet.proofs.repoUrl)) repos[sheet.slug] = sheet.proofs.repoUrl;
  }
  const target = join(contentRoot, 'generated/github.json');
  const previous: GithubIndex = existsSync(target) ? (JSON.parse(readFileSync(target, 'utf8')) as GithubIndex) : {};
  const index = await fetchGithub(repos, previous, { token: process.env.GITHUB_TOKEN });
  mkdirSync(join(contentRoot, 'generated'), { recursive: true });
  writeFileSync(target, `${JSON.stringify(index, null, 2)}\n`);
  console.log(`github: ${Object.keys(index).length} repositories`);
}
