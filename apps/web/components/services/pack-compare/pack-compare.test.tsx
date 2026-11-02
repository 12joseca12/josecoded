import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { renderIntl } from '@/tests/helpers/render-intl';

import { PackCompare } from '.';

import type { CompareColumn } from '.';

const columns: CompareColumn[] = [
  { code: 'P1', name: 'Web básica', kind: 'web', price: 'Desde 900 €', weeks: '1 semana', includes: 'a', href: '/propuesta?pack=P1', requestName: 'Pedir propuesta con este pack: Web básica (P1)' },
  { code: 'P2', name: 'Pedidos', kind: 'web', price: 'Desde 1.400 €', weeks: '2 semanas', includes: 'b', href: '/propuesta?pack=P2', requestName: 'Pedir propuesta con este pack: Pedidos (P2)' },
  {
    code: 'P5',
    name: 'App móvil',
    kind: 'app',
    price: 'Desde 4.000 €',
    weeks: '6 semanas',
    includes: 'c',
    href: '/propuesta?pack=P5',
    requestName: 'Pedir propuesta con este pack: App móvil (P5)',
    option: { name: 'App ampliada', intro: 'App ampliada: desde 6.000 € · 8 semanas.', includes: 'd' },
  },
];
const labels = { caption: 'Cinco packs', tabs: 'Elige un pack', pack: 'Pack', includes: 'Qué incluye', forWhom: 'Para quién', weeks: 'Plazo', price: 'Precio', request: 'Pedir propuesta con este pack', option: 'Opción ampliada' };

describe('PackCompare', () => {
  it('keeps every price as text in a real table, links each pack to its proposal and nests the extended option in P5', () => {
    renderIntl(<PackCompare columns={columns} labels={labels} />);
    expect(screen.getByRole('table')).toBeTruthy();
    for (const price of ['Desde 900 €', 'Desde 1.400 €', 'Desde 4.000 €']) expect(screen.getByText(price)).toBeTruthy();
    expect(screen.getByRole('link', { name: /propuesta.*P2/i }).getAttribute('href')).toContain('pack=P2');
    expect(screen.getByText(/ampliada: desde 6.000/i).closest('[data-pack="P5"]')).toBeTruthy();
    expect(screen.queryByText(/recomendado|regalo|gratis/i)).toBeNull();
  });

  it('has a tablist to pick one pack per view and moves with the arrow keys', () => {
    renderIntl(<PackCompare columns={columns} labels={labels} />);
    expect(screen.getByRole('tablist', { name: /pack/i })).toBeTruthy();
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]?.getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(tabs[0]!, { key: 'ArrowRight' });
    expect(screen.getAllByRole('tab')[1]?.getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(screen.getAllByRole('tab')[1]!, { key: 'End' });
    expect(screen.getAllByRole('tab')[2]?.getAttribute('aria-selected')).toBe('true');
  });

  it('has no axe violations', async () => {
    const { container } = renderIntl(<PackCompare columns={columns} labels={labels} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
