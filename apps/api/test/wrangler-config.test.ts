import { describe, expect, it } from 'vitest';

// Vite inlines the file as text: the tests run in workerd, which has no filesystem.
import raw from '../wrangler.jsonc?raw';

type WranglerSection = { vars?: Record<string, unknown>; define?: Record<string, string> };
type Wrangler = WranglerSection & { env?: Record<string, WranglerSection> };

/** Minimal JSONC reader: strips /* *\/ blocks and full-line // comments (the file has no others). */
function parseJsonc(text: string): Wrangler {
  const withoutBlocks = text.replace(/\/\*[\s\S]*?\*\//g, '');
  const withoutLines = withoutBlocks
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
  return JSON.parse(withoutLines) as Wrangler;
}

const config = parseJsonc(raw);
const sections: [string, WranglerSection][] = [
  ['top level', config],
  ...Object.entries(config.env ?? {}).map(([name, s]): [string, WranglerSection] => [`env.${name}`, s]),
];

describe('wrangler.jsonc keeps the test hooks out of deployed Workers', () => {
  it.each(sections)('%s: vars never contain TEST or __deps', (_name, section) => {
    const keys = Object.keys(section.vars ?? {});
    expect(keys).not.toContain('TEST');
    expect(keys).not.toContain('__deps');
  });

  it.each(sections)('%s: __TEST_HOOKS__ is compiled to false (define is not inherited)', (_name, section) => {
    expect(section.define?.__TEST_HOOKS__).toBe('false');
  });
});
