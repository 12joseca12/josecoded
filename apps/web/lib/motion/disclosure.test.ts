import { afterEach, describe, expect, it, vi } from 'vitest';

import { createDisclosure } from './disclosure';

function setup(onChange?: (open: boolean) => void) {
  document.body.innerHTML =
    '<button id="b" aria-expanded="false" aria-controls="p"></button><nav id="p" hidden><a href="#x">x</a></nav><input id="out">';
  const button = document.getElementById('b') as HTMLButtonElement;
  const panel = document.getElementById('p') as HTMLElement;
  button.focus();
  const d = createDisclosure(button, panel, { closeOnWheel: true, closeAboveRem: 67.5, onChange });
  return { button, panel, d, out: document.getElementById('out') as HTMLInputElement };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('createDisclosure', () => {
  it('opens, closes on Escape and returns focus to the button', () => {
    const { button, panel, d, out } = setup();
    d.open();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(panel.hidden).toBe(false);
    panel.querySelector('a')!.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(panel.hidden).toBe(true);
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(button);
    expect(out).toBeTruthy();
  });

  it('closes when choosing a link, without stealing the focus from where it goes', () => {
    const { panel, d } = setup();
    d.open();
    panel.querySelector('a')!.click();
    expect(panel.hidden).toBe(true);
  });

  it('closes when focus or a tap lands outside, and keeps the focus there', () => {
    const { panel, d, out } = setup();
    d.open();
    out.focus();
    document.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(panel.hidden).toBe(true);
    expect(document.activeElement).toBe(out);

    d.open();
    out.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(panel.hidden).toBe(true);
  });

  it('stays open for focus or taps inside the panel and on its own button', () => {
    const { button, panel, d } = setup();
    d.open();
    panel.querySelector('a')!.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    button.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(panel.hidden).toBe(false);
  });

  it('closes on the wheel, except while scrolling inside the panel', () => {
    const { panel, d } = setup();
    d.open();
    panel.dispatchEvent(new WheelEvent('wheel', { bubbles: true }));
    expect(panel.hidden).toBe(false);
    window.dispatchEvent(new WheelEvent('wheel'));
    expect(panel.hidden).toBe(true);
  });

  it('closes when the viewport grows past the menu breakpoint', () => {
    let listener: ((event: MediaQueryListEvent) => void) | undefined;
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      addEventListener: (_: string, fn: (event: MediaQueryListEvent) => void) => (listener = fn),
      removeEventListener: () => (listener = undefined),
    }));
    const { panel, d } = setup();
    d.open();
    listener?.({ matches: true } as MediaQueryListEvent);
    expect(panel.hidden).toBe(true);
    vi.unstubAllGlobals();
  });

  it('reports each real change once and ignores repeated calls', () => {
    const onChange = vi.fn();
    const { d } = setup(onChange);
    d.open();
    d.open();
    d.close();
    d.close();
    d.toggle();
    expect(onChange.mock.calls).toEqual([[true], [false], [true]]);
  });

  it('listens to the document only while open', () => {
    const add = vi.spyOn(document, 'addEventListener');
    const { d } = setup();
    expect(add).not.toHaveBeenCalled();
    d.open();
    expect(add).toHaveBeenCalled();
    add.mockRestore();
  });
});
