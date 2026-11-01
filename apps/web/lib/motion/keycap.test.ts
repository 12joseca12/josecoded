import { expect, it, vi } from 'vitest';

import { isKeyDown, keyLabel, keyOf, modLabel, subscribeKeys } from './keycap';

it('knows which key an event is', () => {
  expect(keyOf(new KeyboardEvent('keydown', { key: 'Meta' }))).toBe('mod');
  expect(keyOf(new KeyboardEvent('keydown', { key: 'Control' }))).toBe('mod');
  expect(keyOf(new KeyboardEvent('keydown', { key: 'K' }))).toBe('k');
  expect(keyOf(new KeyboardEvent('keydown', { key: 'a' }))).toBeNull();
});

it('sinks the keys while held, releases them on keyup and on blur, and detaches with the last subscriber', () => {
  const listener = vi.fn();
  const stop = subscribeKeys(listener);
  dispatchEvent(new KeyboardEvent('keydown', { key: 'Meta' }));
  dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
  expect(isKeyDown('mod')).toBe(true);
  expect(isKeyDown('k')).toBe(true);
  dispatchEvent(new KeyboardEvent('keyup', { key: 'k' }));
  expect(isKeyDown('k')).toBe(false);
  dispatchEvent(new Event('blur'));
  expect(isKeyDown('mod')).toBe(false);
  expect(listener).toHaveBeenCalled();
  stop();
  listener.mockClear();
  dispatchEvent(new KeyboardEvent('keydown', { key: 'Meta' }));
  expect(listener).not.toHaveBeenCalled();
});

it('shows ⌘ on Apple platforms and Ctrl elsewhere', () => {
  expect(modLabel('MacIntel')).toBe('⌘');
  expect(modLabel('iPhone')).toBe('⌘');
  expect(modLabel('Linux x86_64')).toBe('Ctrl');
  expect(keyLabel('k', 'Linux')).toBe('K');
  expect(keyLabel('mod', 'MacIntel')).toBe('⌘');
});
