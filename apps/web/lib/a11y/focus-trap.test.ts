import { afterEach, describe, expect, it } from 'vitest';

import { trapFocus } from './focus-trap';

function tab(shift = false) {
  const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: shift, cancelable: true, bubbles: true });
  document.dispatchEvent(event);
  return event;
}

function setup() {
  document.body.innerHTML = `
    <button id="outside">outside</button>
    <div id="box" tabindex="-1">
      <a id="a" href="/x">a</a>
      <button id="b">b</button>
      <button id="dead" disabled>dead</button>
      <div hidden><button id="hid">hidden</button></div>
      <input id="c" />
    </div>`;
  const get = (id: string) => document.getElementById(id) as HTMLElement;
  return { box: get('box'), a: get('a'), b: get('b'), c: get('c'), outside: get('outside') };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('trapFocus', () => {
  it('cycles forward from the last tabbable to the first, skipping disabled and hidden', () => {
    const { box, a, b, c } = setup();
    const release = trapFocus(box);
    a.focus();
    c.focus();
    const event = tab();
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(a);
    // inside the range it does not interfere: the browser moves focus
    b.focus();
    expect(tab().defaultPrevented).toBe(false);
    release();
  });

  it('cycles backwards from the first tabbable to the last with Shift+Tab', () => {
    const { box, a, c } = setup();
    const release = trapFocus(box);
    a.focus();
    const event = tab(true);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(c);
    release();
  });

  it('pulls focus back in when Tab is pressed outside the container', () => {
    const { box, a, outside } = setup();
    const release = trapFocus(box);
    outside.focus();
    expect(tab().defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(a);
    release();
  });

  it('stops trapping after release', () => {
    const { box, c } = setup();
    const release = trapFocus(box);
    release();
    c.focus();
    expect(tab().defaultPrevented).toBe(false);
  });

  it('keeps focus on the container when there is nothing to tab to', () => {
    document.body.innerHTML = '<div id="empty" tabindex="-1"></div>';
    const empty = document.getElementById('empty') as HTMLElement;
    const release = trapFocus(empty);
    expect(tab().defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(empty);
    release();
  });
});
