import { describe, expect, it } from 'vitest';

import { fetchGithub, repoSlug } from './github';

describe('github script', () => {
  it('reads owner/name from a repository URL and rejects anything else', () => {
    expect(repoSlug('https://github.com/jose/app')).toBe('jose/app');
    expect(repoSlug('https://github.com/jose/app.git')).toBe('jose/app');
    expect(repoSlug('https://example.com/jose/app')).toBeNull();
  });

  it('keeps the previous entry when the request fails and stores no figure', async () => {
    const previous = { app: { url: 'https://github.com/jose/app', pushedAt: '2026-10-01T00:00:00Z' } };
    const down = await fetchGithub({ app: 'https://github.com/jose/app' }, previous, {
      fetchImpl: async () => ({ ok: false, json: async () => ({}) }),
    });
    expect(down).toEqual(previous);
    const up = await fetchGithub({ app: 'https://github.com/jose/app' }, {}, {
      fetchImpl: async () => ({ ok: true, json: async () => ({ html_url: 'https://github.com/jose/app', pushed_at: '2026-11-01T00:00:00Z', stargazers_count: 9 }) }),
    });
    expect(up).toEqual({ app: { url: 'https://github.com/jose/app', pushedAt: '2026-11-01T00:00:00Z' } });
  });

  it('writes nothing for a project without a public repository', async () => {
    expect(await fetchGithub({}, {})).toEqual({});
  });
});
