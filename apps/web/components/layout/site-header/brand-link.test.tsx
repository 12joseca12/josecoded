import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderHeaderIntl } from '@/tests/helpers/render-intl';

import { BrandLink } from './brand-link';

const route = vi.hoisted(() => ({ pathname: '/' as string | null }));
vi.mock('@/i18n/navigation', async (importActual) => ({
  ...(await importActual<typeof import('@/i18n/navigation')>()),
  usePathname: () => route.pathname,
}));

beforeEach(() => {
  route.pathname = '/';
});

describe('BrandLink', () => {
  it('goes to the top of the page on the home', () => {
    renderHeaderIntl(<BrandLink label="josecoded, inicio" name="josecoded" />);
    expect(screen.getByRole('link', { name: 'josecoded, inicio' }).getAttribute('href')).toBe('#top');
  });

  it('goes to the home from any other page', () => {
    route.pathname = '/servicios';
    renderHeaderIntl(<BrandLink label="josecoded, inicio" name="josecoded" />);
    expect(screen.getByRole('link', { name: 'josecoded, inicio' }).getAttribute('href')).toBe('/');
  });
});
