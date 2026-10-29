import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { renderIntl } from '@/tests/helpers/render-intl';

import { UserMenu } from '.';

const client = vi.hoisted(() => ({
  getUser: vi.fn(),
  signOut: vi.fn(async () => ({ error: null })),
  loaded: vi.fn(),
}));
vi.mock('@/lib/supabase/browser', () => {
  client.loaded();
  return { createClient: () => ({ auth: { getUser: client.getUser, signOut: client.signOut } }) };
});

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock('@/i18n/navigation', async (importActual) => ({
  ...(await importActual<typeof import('@/i18n/navigation')>()),
  useRouter: () => router,
}));

beforeEach(() => {
  client.getUser.mockResolvedValue({ data: { user: { email: 'marta@example.com' } } });
});
afterEach(() => {
  document.cookie = 'sb-abc-auth-token=; max-age=0';
  vi.clearAllMocks();
});

describe('UserMenu', () => {
  it('paints «Login» and never loads Supabase without a session cookie', async () => {
    const { container } = renderIntl(<UserMenu />);
    const link = screen.getByRole('link', { name: 'Login' });
    expect(link.getAttribute('href')).toBe('/auth/login');
    await Promise.resolve();
    expect(client.loaded).not.toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('becomes the account menu when the cookie holds a live session', async () => {
    document.cookie = 'sb-abc-auth-token=base64-x';
    renderIntl(<UserMenu />);
    const trigger = await screen.findByRole('button', { name: 'Mi cuenta' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('marta@example.com')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Área de clientes' }).getAttribute('href')).toBe('/area-clientes');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
  });

  it('keeps «Login» when the cookie is stale (no user)', async () => {
    document.cookie = 'sb-abc-auth-token=base64-x';
    client.getUser.mockResolvedValue({ data: { user: null } });
    renderIntl(<UserMenu />);
    await waitFor(() => expect(client.getUser).toHaveBeenCalled());
    expect(screen.getByRole('link', { name: 'Login' })).toBeTruthy();
  });

  it('signs out and goes home', async () => {
    document.cookie = 'sb-abc-auth-token=base64-x';
    renderIntl(<UserMenu />);
    fireEvent.click(await screen.findByRole('button', { name: 'Mi cuenta' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/'));
    expect(client.signOut).toHaveBeenCalled();
    expect(await screen.findByRole('link', { name: 'Login' })).toBeTruthy();
  });
});
