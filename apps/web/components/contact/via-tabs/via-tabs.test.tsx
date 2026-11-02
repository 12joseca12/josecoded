import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ViaTabs } from '.';

import type { Via } from '.';

const vias: Via[] = [
  { id: 'client', label: 'Cliente', panel: <p>Texto cliente</p>, live: <input aria-label="Mensaje cliente" /> },
  { id: 'partner', label: 'Agencia', panel: <p>Texto agencia</p>, live: <input aria-label="Mensaje agencia" /> },
  { id: 'recruiter', label: 'Empleo', panel: <p>Texto empleo</p> },
];

describe('ViaTabs', () => {
  it('moves focus with the arrows but only picks a way with Enter or Space (manual activation)', () => {
    render(<ViaTabs label="Vías" vias={vias} />);
    const client = screen.getByRole('tab', { name: 'Cliente' });
    client.focus();
    fireEvent.keyDown(client, { key: 'ArrowRight' });
    const partner = screen.getByRole('tab', { name: 'Agencia' });
    expect(document.activeElement).toBe(partner);
    expect(client.getAttribute('aria-selected')).toBe('true');
    expect(partner.getAttribute('aria-selected')).toBe('false');
    fireEvent.click(partner); // Enter and Space on a button arrive as a click
    expect(partner.getAttribute('aria-selected')).toBe('true');
  });

  it('keeps a form the visitor started typing in mounted after they look at another way', () => {
    render(<ViaTabs label="Vías" vias={vias} />);
    fireEvent.input(screen.getByLabelText('Mensaje cliente'), { target: { value: 'hola' } });
    fireEvent.click(screen.getByRole('tab', { name: 'Agencia' }));
    expect((screen.getByLabelText('Mensaje cliente') as HTMLInputElement).value).toBe('hola');
    expect(screen.getByLabelText('Mensaje agencia')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Empleo' }));
    // an untouched form is unmounted as before
    expect(screen.queryByLabelText('Mensaje agencia')).toBeNull();
  });
});
