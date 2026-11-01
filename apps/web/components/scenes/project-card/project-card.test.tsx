import { screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { renderIntl } from '@/tests/helpers/render-intl';

import { ProjectCard } from '.';
import { ProjectsTour } from '../projects-tour';


vi.stubGlobal('requestAnimationFrame', (fn: () => void) => {
  fn();
  return 1;
});

const card = (slug: string, name: string) => (
  <ProjectCard
    key={slug}
    slug={slug}
    name={name}
    lead="Una frase"
    kind="app"
    kindLabel="App"
    art="/art/glyph-phone.avif"
    href={`/proyectos/${slug}`}
    linkLabel="Ver proyecto"
    linkName={`Ver proyecto ${name}`}
  />
);

it('names each card by its heading, tells the links apart and hides the art', async () => {
  const { container } = renderIntl(
    <ProjectsTour titleId="t" names={['3cat', '3catinfo']} head={<h2 id="t">Proyectos</h2>}>
      {card('3cat', '3cat')}
      {card('3catinfo', '3catinfo')}
    </ProjectsTour>,
  );
  expect(screen.getByRole('article', { name: '3cat' })).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Ver proyecto 3catinfo' }).getAttribute('href')).toBe('/proyectos/3catinfo');
  expect(container.querySelectorAll('[data-tcard] img[alt=""]')).toHaveLength(2);
  expect(container.querySelector('[aria-hidden="true"] img')).toBeTruthy();
  expect(await axe(container)).toHaveNoViolations();
});

it('marks exactly one card as the one in focus and lights its name in the rail', () => {
  const { container } = renderIntl(
    <ProjectsTour titleId="t" names={['3cat', '3catinfo']} head={<h2 id="t">Proyectos</h2>}>
      {card('3cat', '3cat')}
      {card('3catinfo', '3catinfo')}
    </ProjectsTour>,
  );
  expect(container.querySelectorAll('[data-tcard][data-active]')).toHaveLength(1);
  expect(container.querySelectorAll('[data-on]')).toHaveLength(1);
});
