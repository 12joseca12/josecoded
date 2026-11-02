import { fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderIntl } from '@/tests/helpers/render-intl';

import { CalEmbed } from '.';

type WithUmami = Window & { umami?: { track: ReturnType<typeof vi.fn> } };
const labels = { open: 'Reservar 20 min', title: 'Reserva', external: 'Abrir en cal.com' };

afterEach(() => {
  delete (window as WithUmami).umami;
});

describe('CalEmbed', () => {
  it('loads nothing of Cal.com until the visitor asks, then mounts the booking page and tracks it', () => {
    const track = vi.fn();
    (window as WithUmami).umami = { track };
    const { container } = renderIntl(<CalEmbed calLink="josecoded/20min" origin="contact" labels={labels} />);
    expect(container.querySelector('iframe')).toBeNull();
    expect(screen.getByRole('link', { name: labels.external }).getAttribute('href')).toBe('https://cal.com/josecoded/20min');
    fireEvent.click(screen.getByRole('button', { name: labels.open }));
    expect(container.querySelector('iframe')?.getAttribute('src')).toContain('https://cal.com/josecoded/20min');
    expect(screen.getByTitle(labels.title)).toBeTruthy();
    expect(track).toHaveBeenCalledWith('booking_open', { origin: 'contact' });
  });
});
