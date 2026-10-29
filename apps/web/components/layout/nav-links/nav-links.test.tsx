import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { renderHeaderIntl } from '@/tests/helpers/render-intl';

import { NavLinks } from '.';

const route = vi.hoisted(() => ({ pathname: '/' as string | null }));
vi.mock('@/i18n/navigation', async (importActual) => ({
  ...(await importActual<typeof import('@/i18n/navigation')>()),
  usePathname: () => route.pathname,
}));

const items = [
  { href: '/sobre-mi', label: 'Sobre mí', scene: 'sobre-mi' },
  { href: '/proyectos', label: 'Proyectos', scene: 'proyectos' },
  { href: '/lab', label: 'Lab', scene: 'lab-blog' },
] as const;

beforeEach(() => {
  route.pathname = '/';
});

describe('NavLinks', () => {
  it('marks the page with aria-current and a page inside a section with true', async () => {
    route.pathname = '/proyectos/hazmefila';
    const { container } = renderHeaderIntl(<NavLinks items={items} label="Principal" />);
    expect(screen.getByRole('link', { name: 'Proyectos' }).getAttribute('aria-current')).toBe('true');
    expect(screen.getByRole('link', { name: 'Lab' }).getAttribute('aria-current')).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('marks the exact page', () => {
    route.pathname = '/sobre-mi';
    renderHeaderIntl(<NavLinks items={items} label="Principal" />);
    expect(screen.getByRole('link', { name: 'Sobre mí' }).getAttribute('aria-current')).toBe('page');
  });

  it('marks nothing with aria-current on the home (the scene in view is colour only)', () => {
    renderHeaderIntl(<NavLinks items={items} label="Principal" />);
    expect(document.querySelector('[aria-current]')).toBeNull();
    expect(screen.getByRole('navigation', { name: 'Principal' })).toBeTruthy();
  });
});
