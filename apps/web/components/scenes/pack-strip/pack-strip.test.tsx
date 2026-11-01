import { fireEvent, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { renderIntl } from '@/tests/helpers/render-intl';

import { PackStrip } from '.';

vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    disconnect() {}
  },
);

const pack = (code: string, name: string, price: string) => ({
  code,
  name,
  price,
  description: `desde ${price} sin IVA. Ver qué incluye`,
  href: `/servicios?pack=${code}#packs` as const,
});

it('lists the five packs as links, features P2 and returns to it when the pointer leaves', async () => {
  const { container } = renderIntl(
    <PackStrip
      web={[pack('P1', 'Web básica', '900 €'), pack('P2', 'Pedidos o reservas', '1.400 €'), pack('P3', 'Gestión', '2.500 €'), pack('P4', 'Gestión + automatizaciones', '4.200 €')]}
      app={[pack('P5', 'App móvil', '4.000 €')]}
      featured="P2"
    />,
  );
  const links = screen.getAllByRole('link');
  expect(links).toHaveLength(5);
  expect(links.map((l) => l.querySelector('[aria-hidden]')?.textContent)).toEqual(['900 €', '1.400 €', '2.500 €', '4.200 €', '4.000 €']);
  expect(container.querySelector('[data-active]')?.getAttribute('data-code')).toBe('P2');
  // the accessible name carries the visible text plus the sentence with the price (WCAG 2.5.3)
  expect(screen.getByRole('link', { name: /Web básica.*desde 900 € sin IVA/ })).toBeTruthy();

  fireEvent.pointerOver(links[4]!);
  expect(container.querySelector('[data-active]')?.getAttribute('data-code')).toBe('P5');
  fireEvent.pointerLeave(container.firstElementChild!);
  expect(container.querySelector('[data-active]')?.getAttribute('data-code')).toBe('P2');
  expect(await axe(container)).toHaveNoViolations();
});
