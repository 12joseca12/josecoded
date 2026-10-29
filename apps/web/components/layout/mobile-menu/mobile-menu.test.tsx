import { act, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { ShellProvider, useShell } from '@/components/layout/shell-provider';
import { renderIntl } from '@/tests/helpers/render-intl';

import { MobileMenu } from '.';

import type { ReactNode } from 'react';

const links = [
  { href: '/sobre-mi', label: 'Sobre mí' },
  { href: '/servicios', label: 'Servicios' },
] as const;
const contact = { href: '/contacto', label: 'Contacto' } as const;

function Probe() {
  const { menu, openPalette } = useShell();
  return (
    <>
      <output data-testid="menu">{String(menu)}</output>
      <button type="button" onClick={openPalette}>
        open palette
      </button>
    </>
  );
}

function setup(children?: ReactNode) {
  return renderIntl(
    <ShellProvider>
      <header>
        <MobileMenu
          links={links}
          secondary={[{ href: '/partners', label: 'Para agencias' }]}
          contact={contact}
          currentPath="/servicios"
        >
          {children}
        </MobileMenu>
      </header>
      <Probe />
    </ShellProvider>,
  );
}

describe('MobileMenu', () => {
  it('is a disclosure with aria-controls, marks the current page and highlights contact', () => {
    setup();
    const button = screen.getByRole('button', { name: 'Menú' });
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-controls')).toBeTruthy();
    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById(button.getAttribute('aria-controls')!)?.hidden).toBe(false);
    expect(screen.getByRole('link', { name: 'Servicios' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Sobre mí' }).getAttribute('aria-current')).toBeNull();
    expect(screen.getByRole('link', { name: 'Contacto' }).dataset.highlighted).toBe('true');
  });

  it('puts the agencies door after a separator and Contacto last', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Menú' }));
    const rows = screen.getAllByRole('link').map((a) => a.textContent);
    expect(rows.slice(-3)).toEqual(['Servicios', 'Para agencias', 'Contacto']);
    expect(screen.getByRole('link', { name: 'Para agencias' }).dataset.separated).toBe('true');
  });

  it('closes with Escape and gives the focus back to the button', () => {
    setup();
    const button = screen.getByRole('button', { name: 'Menú' });
    fireEvent.click(button);
    screen.getByRole('link', { name: 'Sobre mí' }).focus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(button);
  });

  it('closes when a link is chosen', () => {
    setup();
    const button = screen.getByRole('button', { name: 'Menú' });
    fireEvent.click(button);
    fireEvent.click(screen.getByRole('link', { name: 'Sobre mí' }));
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('mirrors the shell state and yields to the palette', () => {
    setup();
    const button = screen.getByRole('button', { name: 'Menú' });
    fireEvent.click(button);
    expect(screen.getByTestId('menu').textContent).toBe('true');
    act(() => screen.getByRole('button', { name: 'open palette' }).click());
    expect(screen.getByTestId('menu').textContent).toBe('false');
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('has a no-script fallback link to the footer index', () => {
    setup();
    expect(screen.getByRole('link', { name: 'Menú: ir al índice del pie' }).getAttribute('href')).toBe('#pie');
  });

  it('has no axe violations open', async () => {
    const { container } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Menú' }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
