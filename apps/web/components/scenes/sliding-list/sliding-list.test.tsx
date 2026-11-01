import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { SlidingList } from '.';

vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    disconnect() {}
  },
);

const options = [
  { id: 'hourly', icon: 'clock', name: 'Por horas', figure: '40 €/h' },
  { id: 'fixed', icon: 'package-check', name: 'Encargo', figure: 'desde 150 €' },
] as const;

it('shows the panel of the chosen route and keeps the others out of reach', async () => {
  const { container } = render(
    <SlidingList legend="Cómo trabajar" options={options} panels={[<p key="a">panel horas</p>, <p key="b">panel encargo</p>]} defaultId="hourly" />,
  );
  expect(screen.getByRole('group', { name: 'Cómo trabajar' })).toBeTruthy();
  const panels = [...container.querySelectorAll('[data-selected]')];
  expect(panels).toHaveLength(1);
  expect(panels[0]?.textContent).toBe('panel horas');

  fireEvent.click(screen.getByLabelText(/Encargo/));
  const selected = container.querySelectorAll('[data-selected]');
  expect(selected).toHaveLength(1);
  expect(selected[0]?.textContent).toBe('panel encargo');
  expect(screen.getByLabelText(/Encargo/).getAttribute('aria-controls')).toBe(selected[0]?.id);
  expect(await axe(container)).toHaveNoViolations();
});
