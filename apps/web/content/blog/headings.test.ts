import { describe, expect, it } from 'vitest';

import { extractHeadings, slugify } from './headings';

describe('slugify', () => {
  it('matches the ids rehype-slug gives (github-slugger): lowercase, accents kept, punctuation dropped', () => {
    expect(slugify('¿Cómo se enruta por idioma sin middleware?')).toBe('cómo-se-enruta-por-idioma-sin-middleware');
    expect(slugify('En resumen')).toBe('en-resumen');
    expect(slugify('Next.js 16 & OpenNext')).toBe('nextjs-16--opennext');
  });
});

describe('extractHeadings', () => {
  const body = ['---', 'title: x', '---', '', '## En resumen', '', '```md', '## not a heading', '```', '### Detail', '## Repetido', '## Repetido', '## Con `código` y **negrita**', '## [Enlace](https://x.test)'].join('\n');

  it('lists the h2 of the body, with the ids rehype-slug will give them', () => {
    expect(extractHeadings(body)).toEqual([
      { id: 'en-resumen', label: 'En resumen' },
      { id: 'repetido', label: 'Repetido' },
      { id: 'repetido-1', label: 'Repetido' },
      { id: 'con-código-y-negrita', label: 'Con código y negrita' },
      { id: 'enlace', label: 'Enlace' },
    ]);
  });

  it('unescapes the markers a pending guide writes', () => {
    expect(extractHeadings('## \\{\\{DATO: x\\}\\}')[0]?.label).toBe('{{DATO: x}}');
  });
});
