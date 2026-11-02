import { describe, expect, it } from 'vitest';

import { parseFrontmatter } from './frontmatter';
import { frontmatterSchema } from './schema';

const valid = { title: 'Next.js 16 en Workers', description: 'La respuesta, con código.', date: '2026-11-02', readingMinutes: 12 };

describe('frontmatterSchema', () => {
  it('fills the defaults: a guide without tags', () => {
    expect(frontmatterSchema.parse(valid)).toMatchObject({ kind: 'guide', tags: [] });
  });

  it('accepts a pending text in the description', () => {
    expect(frontmatterSchema.safeParse({ ...valid, description: '{{DATO: respuesta}}' }).success).toBe(true);
  });

  it('rejects a bad date, a pending date, an unknown key and a bad kind', () => {
    for (const bad of [{ date: '02/11/2026' }, { date: '{{DATO: fecha}}' }, { author: 'x' }, { kind: 'post' }, { readingMinutes: 0 }]) {
      expect(frontmatterSchema.safeParse({ ...valid, ...bad }).success).toBe(false);
    }
  });
});

describe('parseFrontmatter', () => {
  it('reads the YAML block, dates stay strings', () => {
    const text = '---\ntitle: A\ndescription: B\ndate: 2026-11-02\nreadingMinutes: 3\ntags: [next, cloudflare]\n---\n# Body';
    expect(parseFrontmatter(text)).toMatchObject({ date: '2026-11-02', tags: ['next', 'cloudflare'] });
  });

  it('throws without a block and with an invalid one', () => {
    expect(() => parseFrontmatter('# Body')).toThrow(/missing frontmatter/);
    expect(() => parseFrontmatter('---\ntitle: A\n---\n')).toThrow();
  });
});
