import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { renderHeaderIntl } from '@/tests/helpers/render-intl';

import { LangSwitch } from '.';

const route = vi.hoisted(() => ({ pathname: '/', params: {} as Record<string, string | string[]> }));

vi.mock('@/i18n/navigation', async (importActual) => ({
  ...(await importActual<typeof import('@/i18n/navigation')>()),
  usePathname: () => route.pathname,
}));
vi.mock('next/navigation', async (importActual) => ({
  ...(await importActual<typeof import('next/navigation')>()),
  useParams: () => route.params,
}));

beforeEach(() => {
  route.pathname = '/';
  route.params = {};
});

describe('LangSwitch inline', () => {
  it('offers the other language, keeping the translated path', () => {
    route.pathname = '/servicios';
    renderHeaderIntl(<LangSwitch />);
    const link = screen.getByRole('link', { name: 'English' });
    expect(link.textContent).toBe('EN');
    expect(link.getAttribute('href')).toBe('/en/services');
    expect(link.getAttribute('hreflang')).toBe('en');
    expect(link.getAttribute('lang')).toBe('en');
  });

  it('goes back to the unprefixed Spanish URL from English', () => {
    route.pathname = '/servicios';
    renderHeaderIntl(<LangSwitch />, 'en');
    const link = screen.getByRole('link', { name: 'Español' });
    expect(link.textContent).toBe('ES');
    expect(link.getAttribute('href')).toBe('/servicios');
  });

  it('keeps the parameters of a dynamic route', () => {
    route.pathname = '/proyectos/[slug]';
    route.params = { locale: 'es', slug: 'hazmefila' };
    renderHeaderIntl(<LangSwitch />);
    expect(screen.getByRole('link', { name: 'English' }).getAttribute('href')).toBe('/en/projects/hazmefila');
  });

  it('maps the home to /en and back', () => {
    renderHeaderIntl(<LangSwitch />);
    expect(screen.getByRole('link', { name: 'English' }).getAttribute('href')).toBe('/en');
  });
});

describe('LangSwitch segmented', () => {
  it('lists both languages with the current one marked and only the other a link', async () => {
    route.pathname = '/sobre-mi';
    const { container } = renderHeaderIntl(<LangSwitch variant="segmented" />);
    const group = screen.getByRole('group', { name: 'Idioma' });
    expect(group.querySelector('[aria-current]')?.textContent).toBe('Español');
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'English' }).getAttribute('href')).toBe('/en/about');
    expect(await axe(container)).toHaveNoViolations();
  });
});
