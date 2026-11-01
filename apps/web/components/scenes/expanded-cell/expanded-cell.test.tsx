import { act, fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import { ShellProvider } from '@/components/layout/shell-provider';
import { Bento, BentoCell } from '@/components/scenes';

function setup() {
  return render(
    <ShellProvider>
      <header id="site-header">
        <a href="/">home</a>
      </header>
      <main id="main">
        <Bento>
          <BentoCell id="vias" expandable labels={{ open: 'Ampliar vías', close: 'Cerrar' }} title="Vías" more={<p>más</p>}>
            cuerpo
          </BentoCell>
        </Bento>
      </main>
    </ShellProvider>,
  );
}

it('opens from ⤢ as a modal dialog, shuts the rest and closes with Esc returning focus to ⤢', async () => {
  setup();
  const opener = screen.getByRole('button', { name: 'Ampliar vías' });
  opener.focus();
  fireEvent.click(opener);
  const cell = document.getElementById('vias')!;
  await act(async () => undefined);
  expect(cell.getAttribute('role')).toBe('dialog');
  expect(cell.getAttribute('aria-modal')).toBe('true');
  expect(document.getElementById('site-header')!.hasAttribute('inert')).toBe(true);

  fireEvent.keyDown(document, { key: 'Escape' });
  await act(async () => undefined);
  expect(cell.getAttribute('role')).toBeNull();
  expect(document.getElementById('site-header')!.hasAttribute('inert')).toBe(false);
  expect(document.activeElement).toBe(opener);
});
