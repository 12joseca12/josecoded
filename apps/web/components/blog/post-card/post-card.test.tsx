import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { renderIntl } from '@/tests/helpers/render-intl';

import { PostCard } from '.';

it('is an article named by its title, with one link that carries the title, and passes axe', async () => {
  const { container } = renderIntl(
    <ul>
      <li>
        <PostCard
          slug="a"
          title="Next.js en Workers"
          description="La respuesta."
          date={{ iso: '2026-11-02', label: '2 nov 2026' }}
          readingLabel="12 min de lectura"
          tags={['nextjs']}
          tagsLabel="Etiquetas"
          lang="en"
          languageNote="Solo en inglés"
          href="/blog/a"
          linkLabel="Leer guía"
          linkName="Leer guía: Next.js en Workers"
        />
      </li>
    </ul>,
  );
  const article = screen.getByRole('article', { name: 'Next.js en Workers' });
  expect(article.getAttribute('lang')).toBe('en');
  expect(screen.getAllByRole('link')).toHaveLength(1);
  expect(screen.getByRole('link', { name: 'Leer guía: Next.js en Workers' }).getAttribute('href')).toBe('/blog/a');
  expect(screen.getByRole('list', { name: 'Etiquetas' })).toBeTruthy();
  expect(container.querySelector('time')?.getAttribute('datetime')).toBe('2026-11-02');
  expect((await axe(container)).violations).toEqual([]);
});
