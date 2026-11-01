import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { SegmentedControl } from '.';

const options = [
  { id: 'hour', label: 'Por horas' },
  { id: 'feature', label: 'Encargo' },
];

function Harness() {
  const [value, setValue] = useState('hour');
  return (
    <>
      <SegmentedControl legend="Modalidad" options={options} value={value} onValueChange={setValue} controls="figure" />
      <div id="figure" />
    </>
  );
}

it('is a named group of radios with arrow keys that wrap and move focus', async () => {
  const { container } = render(<Harness />);
  expect(screen.getByRole('group', { name: 'Modalidad' })).toBeTruthy();
  const radios = screen.getAllByRole('radio');
  expect((radios[0] as HTMLInputElement).checked).toBe(true);
  expect(radios[0]?.getAttribute('aria-controls')).toBe('figure');
  radios[0]?.focus();
  fireEvent.keyDown(radios[0]!, { key: 'ArrowRight' });
  expect((radios[1] as HTMLInputElement).checked).toBe(true);
  expect(document.activeElement).toBe(radios[1]);
  fireEvent.keyDown(radios[1]!, { key: 'ArrowRight' });
  expect((radios[0] as HTMLInputElement).checked).toBe(true);
  expect(await axe(container)).toHaveNoViolations();
});

it('click chooses the option and moves the thumb (data-index)', () => {
  const { container } = render(<Harness />);
  fireEvent.click(screen.getByLabelText('Encargo'));
  expect(container.querySelector('fieldset')?.getAttribute('data-index')).toBe('1');
});
