import { act, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { ShellProvider, useShell } from '@/components/layout/shell-provider';
import { renderIntl } from '@/tests/helpers/render-intl';

import { SearchTrigger } from '.';

function Probe() {
  return <output data-testid="palette">{String(useShell().palette)}</output>;
}

const setup = () =>
  renderIntl(
    <ShellProvider>
      <SearchTrigger />
      <Probe />
    </ShellProvider>,
  );
const palette = () => screen.getByTestId('palette').textContent;

describe('SearchTrigger', () => {
  it('is a dialog button named «Buscar» that opens the palette', () => {
    setup();
    const button = screen.getByRole('button', { name: 'Buscar' });
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
