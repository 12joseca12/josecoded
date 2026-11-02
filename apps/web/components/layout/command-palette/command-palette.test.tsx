import { act, fireEvent, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { SearchTrigger } from '@/components/layout/search-trigger';
import { ShellProvider, useShell } from '@/components/layout/shell-provider';
import { renderIntl } from '@/tests/helpers/render-intl';

import CommandPaletteDialog from './command-palette-dialog';

import type { PaletteCopy, PaletteItem } from './command-palette-dialog';

const push = vi.fn();
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ push }),
}));

const commands: PaletteItem[] = [
  { id: 'about', group: 'goTo', groupLabel: 'Ir a', icon: 'user', href: '/sobre-mi', label: 'Sobre mí', keywords: ['jose', 'quien'] },
  { id: 'packs', group: 'actions', groupLabel: 'Acciones', icon: 'package', href: '/servicios#packs', label: 'Packs', hint: 'desde 900 €', keywords: ['precio'] },
];
const copy: PaletteCopy = {
  label: 'Ir a',
  placeholder: 'Busca «precio», «cv»…',
  hintMove: 'mover',
  hintOpen: 'abrir',
  empty: 'Nada con «{query}».',
  listLabel: 'Resultados',
};

// stands in for the island of the palette: it tells the shell a palette exists
function Opener() {
  const { palette, registerPalette } = useShell();
  useEffect(() => registerPalette(), [registerPalette]);
  return (
    <>
      <SearchTrigger />
      <output>{palette ? 'open' : 'closed'}</output>
    </>
  );
}

it('opens from the search button, filters without accents, opens a command and closes', async () => {
  push.mockClear();
  const { container } = renderIntl(
    <ShellProvider>
      <Opener />
      <CommandPaletteDialog commands={commands} copy={copy} />
    </ShellProvider>,
  );
  const search = screen.getByRole('button', { name: 'Buscar' });
  expect(search.getAttribute('aria-expanded')).toBe('false');
  await act(async () => fireEvent.click(search));
  expect(search.getAttribute('aria-expanded')).toBe('true');

  const input = screen.getByRole('combobox');
  expect(screen.getAllByRole('option')).toHaveLength(2);
  fireEvent.change(input, { target: { value: 'PRÉCIO' } });
  expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Packsdesde 900 €']);
  expect(input.getAttribute('aria-activedescendant')).toBe(screen.getByRole('option').id);
  expect(await axe(container)).toHaveNoViolations();

  fireEvent.keyDown(input, { key: 'Enter' });
  expect(push).toHaveBeenCalledWith('/servicios#packs');
  await act(async () => undefined);
  expect(search.getAttribute('aria-expanded')).toBe('false');
});

it('says so when nothing matches and wraps the arrows', async () => {
  renderIntl(
    <ShellProvider>
      <Opener />
      <CommandPaletteDialog commands={commands} copy={copy} />
    </ShellProvider>,
  );
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Buscar' })));
  const input = screen.getByRole('combobox');
  fireEvent.keyDown(input, { key: 'ArrowUp' });
  expect(screen.getAllByRole('option')[1]?.getAttribute('aria-selected')).toBe('true');
  fireEvent.change(input, { target: { value: 'zzz' } });
  expect(screen.getByText('Nada con «zzz».')).toBeTruthy();
});
