import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { Marquee, MarqueePause } from '.';

it('toggles data-paused on its cell with aria-pressed and swaps the label, without axe violations', async () => {
  const { container } = render(
    <article data-cell="">
      <MarqueePause pauseLabel="Pausar animación" resumeLabel="Reanudar" />
      <Marquee items={['Next.js', 'Expo']} label="Next.js, Expo" />
    </article>,
  );
  const cell = container.querySelector('[data-cell]');
  const pause = screen.getByRole('button', { name: 'Pausar animación' });
  expect(pause.getAttribute('aria-pressed')).toBe('false');
  expect(cell?.hasAttribute('data-paused')).toBe(false);

  fireEvent.click(pause);
  const resume = screen.getByRole('button', { name: 'Reanudar' });
  expect(resume.getAttribute('aria-pressed')).toBe('true');
  expect(cell?.getAttribute('data-paused')).toBe('true');
  expect(await axe(container)).toHaveNoViolations();

  fireEvent.click(resume);
  expect(screen.getByRole('button', { name: 'Pausar animación' }).getAttribute('aria-pressed')).toBe('false');
  expect(cell?.getAttribute('data-paused')).toBe('false');
});
