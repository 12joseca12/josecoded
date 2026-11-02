import { act, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderIntl } from '@/tests/helpers/render-intl';

import { StaffTabBar } from './staff-tab-bar';

vi.mock('@/i18n/navigation', async (importActual) => ({
  ...(await importActual<typeof import('@/i18n/navigation')>()),
  usePathname: () => '/crm',
}));

const item = (id: 'contacts' | 'clients', href: '/crm/contactos' | '/crm/clientes', label: string) =>
  ({ id, href, icon: 'users', label }) as const;

/** A controllable `matchMedia`: tests flip `matches` and fire the `change` listeners. */
function stubMatchMedia() {
  const listeners = new Set<() => void>();
  const mql = {
    matches: false,
    media: '',
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  };
  vi.stubGlobal('matchMedia', (query: string) => Object.assign(mql, { media: query }));
  return {
    mql,
    set(matches: boolean) {
      mql.matches = matches;
      act(() => listeners.forEach((listener) => listener()));
    },
  };
}

function setup() {
  return renderIntl(
    <StaffTabBar
      label="Navegación del CRM"
      items={[item('contacts', '/crm/contactos', 'Contactos')]}
      sheetItems={[item('clients', '/crm/clientes', 'Clientes')]}
      moreButton="Más"
      moreSections="Más secciones"
      close="Cerrar"
    />,
  );
}

beforeEach(() => {
  // jsdom has no modal dialog: model what the tests observe, `open`
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open');
  };
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('StaffTabBar sheet', () => {
  it('opens from the «Más» button', () => {
    stubMatchMedia();
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Más' }));
    expect(document.querySelector('dialog')?.hasAttribute('open')).toBe(true);
  });

  it('closes by itself when the viewport reaches the rail breakpoint, so the page is not left inert', () => {
    const media = stubMatchMedia();
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Más' }));
    media.set(true);
    expect(media.mql.media).toBe('(width >= 64rem)');
    expect(document.querySelector('dialog')?.hasAttribute('open')).toBe(false);
  });

  it('stays open while the viewport is still narrow', () => {
    const media = stubMatchMedia();
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Más' }));
    media.set(false);
    expect(document.querySelector('dialog')?.hasAttribute('open')).toBe(true);
  });
});
