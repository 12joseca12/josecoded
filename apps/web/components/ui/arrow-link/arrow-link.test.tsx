import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { renderIntl } from '@/tests/helpers/render-intl';

import { ArrowLink } from '.';

describe('ArrowLink', () => {
  it('is a link with href and a button without, and the icon never names it', async () => {
    const onClick = vi.fn();
    const { container } = renderIntl(
      <main>
        <ArrowLink href="/servicios#packs" emphasis="strong">
          Qué incluye cada pack
        </ArrowLink>
        <ArrowLink icon="download" onClick={onClick}>
          Descargar CV
        </ArrowLink>
      </main>,
    );
    const link = screen.getByRole('link', { name: 'Qué incluye cada pack' });
    expect(link.getAttribute('href')).toBe('/servicios#packs');
    expect(link.dataset.emphasis).toBe('strong');
    const button = screen.getByRole('button', { name: 'Descargar CV' });
    expect(button.getAttribute('type')).toBe('button');
    button.click();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(container.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(2);
    expect(await axe(container)).toHaveNoViolations();
  });
});
