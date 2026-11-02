import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { computeBlogIndex, computeContentIndex } from './content-index';

function fixture(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'content-index-'));
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(join(root, path, '..'), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}

describe('computeContentIndex', () => {
  it('has both sections off with no content', () => {
    const idx = computeContentIndex({ contentRoot: fixture({}) });
    expect(idx).toMatchObject({ blogEnabled: false, labEnabled: false, blog: { guides: 0 }, lab: { demos: 0 } });
  });

  it('enables the blog with three real guides, counted per site and not per locale', () => {
    const two = fixture({ 'blog/es/a.mdx': 'x', 'blog/es/b.md': 'x', 'blog/en/a.mdx': 'x' });
    expect(computeContentIndex({ contentRoot: two }).blogEnabled).toBe(false);
    const three = fixture({ 'blog/es/a.mdx': 'x', 'blog/es/b.md': 'x', 'blog/en/c.mdx': 'x' });
    expect(computeContentIndex({ contentRoot: three })).toMatchObject({ blogEnabled: true, blog: { guides: 3 } });
  });

  it('ignores pending texts and notes', () => {
    const root = fixture({
      'blog/es/a.mdx': 'x',
      'blog/es/b.mdx': 'x',
      'blog/es/pending.mdx': '---\ntitle: {{DATO: titulo}}\n---\nx',
      'blog/es/note.md': "---\nkind: 'note'\n---\nx",
    });
    expect(computeContentIndex({ contentRoot: root })).toMatchObject({ blogEnabled: false, blog: { guides: 2 } });
  });

  it('enables the lab with two real demos', () => {
    const one = fixture({ 'lab/a/meta.es.md': 'x', 'lab/b/meta.es.md': '{{DATO: demo}}' });
    expect(computeContentIndex({ contentRoot: one })).toMatchObject({ labEnabled: false, lab: { demos: 1 } });
    const two = fixture({ 'lab/a/meta.es.md': 'x', 'lab/b/meta.en.md': 'x' });
    expect(computeContentIndex({ contentRoot: two })).toMatchObject({ labEnabled: true, lab: { demos: 2 } });
  });

  it('checks the pending marker in the frontmatter only, not in the body', () => {
    const root = fixture({
      'blog/es/a.mdx': '---\ntitle: A\n---\nHow to write {{DATO: x}} markers',
      'blog/es/b.mdx': '---\ntitle: B\n---\nx',
      'blog/es/c.mdx': '---\ntitle: C\n---\nx',
    });
    expect(computeContentIndex({ contentRoot: root })).toMatchObject({ blogEnabled: true, blog: { guides: 3 } });
  });

  it('detects `kind: note` in the frontmatter only, not inside a code block', () => {
    const root = fixture({
      'blog/es/a.mdx': '---\ntitle: A\n---\n```yaml\nkind: note\n```\n',
      'blog/es/b.mdx': '---\ntitle: B\n---\nkind: note',
      'blog/es/c.mdx': '---\ntitle: C\nkind: note\n---\nx',
    });
    expect(computeContentIndex({ contentRoot: root })).toMatchObject({ blog: { guides: 2 } });
  });
});

const guide = (title: string, date: string, extra = '') =>
  `---\ntitle: ${title}\ndescription: Una frase.\ndate: ${date}\nreadingMinutes: 8\n${extra}---\nCuerpo`;

describe('computeBlogIndex', () => {
  it('lists every guide with its locale, newest first, and links the translations', () => {
    const root = fixture({
      'blog/es/a.mdx': guide('A', '2026-10-01'),
      'blog/en/a.mdx': guide('A en', '2026-10-01'),
      'blog/es/solo-es.md': guide('Solo', '2026-10-05'),
    });
    const { posts } = computeBlogIndex({ contentRoot: root });
    expect(posts.map((p) => `${p.slug}/${p.locale}`)).toEqual(['solo-es/es', 'a/en', 'a/es']);
    expect(posts.map((p) => p.hasTranslation)).toEqual([false, true, true]);
  });

  it('marks a post with a {{DATO}} in its frontmatter as pending and keeps it in the list', () => {
    const root = fixture({ 'blog/es/a.mdx': guide('A', '2026-10-01', 'tags: [x]\n').replace('Una frase.', "'{{DATO: frase}}'") });
    expect(computeBlogIndex({ contentRoot: root }).posts[0]).toMatchObject({ pending: true, tags: ['x'] });
  });

  it('fails the build on an invalid frontmatter, naming the file', () => {
    const root = fixture({ 'blog/es/rota.mdx': '---\ntitle: A\n---\nx' });
    expect(() => computeBlogIndex({ contentRoot: root })).toThrow(/blog\/es\/rota\.mdx/);
  });

  it('is empty without a blog folder', () => {
    expect(computeBlogIndex({ contentRoot: fixture({}) }).posts).toEqual([]);
  });
});
