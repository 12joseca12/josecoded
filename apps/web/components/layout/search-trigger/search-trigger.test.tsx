import { act, fireEvent, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { ShellProvider, useShell } from '@/components/layout/shell-provider';
import { renderHeaderIntl } from '@/tests/helpers/render-intl';

import { SearchTrigger } from '.';

function Probe() {
  return <output data-testid="palette">{String(useShell().palette)}</output>;
}

// stands for the palette of task 2.16: mounting it flips the shell flag
function PaletteStub() {
  const { registerPalette } = useShell();
  useEffect(() => registerPalette(), [registerPalette]);
  return null;
}

const setup = (withPalette = true) =>
  renderHeaderIntl(
    <ShellProvider>
      <SearchTrigger />
      <Probe />
      {withPalette ? <PaletteStub /> : null}
    </ShellProvider>,
  );
const palette = () => screen.getByTestId('palette').textContent;

describe('SearchTrigger without a palette', () => {
  it('is inert: disabled semantics, no dialog claims, click does nothing', () => {
    setup(false);
    const button = screen.getByRole('button', { name: 'Buscar' });
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.hasAttribute('aria-haspopup')).toBe(false);
    expect(button.hasAttribute('aria-expanded')).toBe(false);
    expect(button.hasAttribute('aria-keyshortcuts')).toBe(false);
    fireEvent.click(button);
    expect(palette()).toBe('false');
  });

  it('leaves ⌘K and Ctrl+K to the browser', () => {
    setup(false);
    const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(palette()).toBe('false');
  });

  it('has no axe violations', async () => {
    const { container } = setup(false);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('SearchTrigger with a palette mounted', () => {
  it('is a dialog button named «Buscar» that opens the palette', () => {
    setup();
    const button = screen.getByRole('button', { name: 'Buscar' });
    expect(button.hasAttribute('aria-disabled')).toBe(false);
    expect(button.getAttribute('aria-haspopup')).toBe('dialog');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(button);
    expect(palette()).toBe('true');
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });

  it('toggles the palette with ⌘K and Ctrl+K and swallows the browser default', () => {
    setup();
    const meta = new KeyboardEvent('keydown', { key: 'k', metaKey: true, cancelable: true });
    act(() => void window.dispatchEvent(meta));
    expect(palette()).toBe('true');
    expect(meta.defaultPrevented).toBe(true);
    act(() => void window.dispatchEvent(new KeyboardEvent('keydown', { key: 'K', ctrlKey: true, cancelable: true })));
    expect(palette()).toBe('false');
  });

  it('ignores K alone and other combinations', () => {
    setup();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', metaKey: true }));
    expect(palette()).toBe('false');
  });

  it('stops listening when unmounted', () => {
    const { unmount } = setup();
    unmount();
    const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('has no axe violations', async () => {
    const { container } = setup();
    expect(await axe(container)).toHaveNoViolations();
  });
});
