import { describe, expect, it } from 'vitest';

// DATOS §10.7 (plan 1.8a step 6): Gmail is drafts-only. No source file in apps/ or packages/ may send mail through
// the Gmail API: neither the client methods (users.messages.send, users.drafts.send) nor the REST endpoints
// (…/messages/send, …/drafts/send). The tests run in workerd, which has no filesystem, so Vite inlines the files.
const files = import.meta.glob<string>(
  [
    '../../../apps/**/*.{ts,tsx,mts,cts,js,mjs,cjs}',
    '../../../packages/**/*.{ts,tsx,mts,cts,js,mjs,cjs}',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/.open-next/**',
    '!**/.wrangler/**',
    '!**/dist/**',
    '!**/coverage/**',
  ],
  { query: '?raw', import: 'default', eager: true },
);

// Built from parts so this file does not match itself.
const forbidden = new RegExp(['(messages|drafts)', '[./]', 'send', '\\b'].join(''));

describe('no Gmail send (DATOS §10.7)', () => {
  it('scans the sources of apps/ and packages/', () => {
    const paths = Object.keys(files);
    // Keys are relative to this file: ../src (api), ../../web (web), ../../../packages.
    expect(paths.some((p) => p.startsWith('../src/'))).toBe(true);
    expect(paths.some((p) => p.startsWith('../../web/'))).toBe(true);
    expect(paths.some((p) => p.startsWith('../../../packages/types/src/'))).toBe(true);
    expect(paths.some((p) => p.includes('/node_modules/'))).toBe(false);
  });

  it('no file calls messages.send or drafts.send', () => {
    const offenders = Object.entries(files)
      .filter(([, text]) => forbidden.test(text))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });
});
