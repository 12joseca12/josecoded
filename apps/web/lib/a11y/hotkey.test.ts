import { afterEach, describe, expect, it } from 'vitest';

import { bindFocusHotkey, isHotkey } from './hotkey';

import type { HotkeyEvent } from './hotkey';

const press = (over: Partial<HotkeyEvent> = {}): HotkeyEvent => ({
  key: '/',
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  defaultPrevented: false,
  isComposing: false,
  target: document.body,
  ...over,
});

describe('isHotkey', () => {
  it('fires for the key with nothing focused', () => {
    expect(isHotkey(press(), '/')).toBe(true);
  });

  it('ignores other keys and combinations with a modifier', () => {
    expect(isHotkey(press({ key: 'a' }), '/')).toBe(false);
    expect(isHotkey(press({ ctrlKey: true }), '/')).toBe(false);
    expect(isHotkey(press({ metaKey: true }), '/')).toBe(false);
    expect(isHotkey(press({ altKey: true }), '/')).toBe(false);
  });

  it('lets a field receive its own typing', () => {
    for (const tag of ['input', 'textarea', 'select']) {
      expect(isHotkey(press({ target: document.createElement(tag) }), '/')).toBe(false);
    }
    const editable = document.createElement('div');
    Object.defineProperty(editable, 'isContentEditable', { value: true });
    expect(isHotkey(press({ target: editable }), '/')).toBe(false);
  });

  it('respects an input method composing text and an event somebody else handled', () => {
    expect(isHotkey(press({ isComposing: true }), '/')).toBe(false);
    expect(isHotkey(press({ defaultPrevented: true }), '/')).toBe(false);
  });
});

describe('bindFocusHotkey', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('focuses the field and stops listening on cleanup', () => {
    const field = document.createElement('input');
    document.body.append(field);
    const off = bindFocusHotkey(field, '/');
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(field);
    field.blur();
    off();
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).not.toBe(field);
  });
});
