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

  it('only the top-most of two nested traps handles Tab, and popping restores the previous one', () => {
    document.body.innerHTML = `
      <div id="cell" tabindex="-1"><button id="c1">1</button><button id="c2">2</button></div>
      <div id="pal" tabindex="-1"><button id="p1">1</button><button id="p2">2</button></div>`;
    const get = (id: string) => document.getElementById(id) as HTMLElement;
    const releaseCell = trapFocus(get('cell'));
    const releasePalette = trapFocus(get('pal'));
    get('p2').focus();
    expect(tab().defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(get('p1')); // the palette wraps, the cell does not steal it
    releasePalette();
    get('c2').focus();
    expect(tab().defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(get('c1')); // the cell is back in charge
    releaseCell();
  });

  it('releasing the lower trap first leaves the upper one active', () => {
    document.body.innerHTML = `
      <div id="a" tabindex="-1"><button id="a1">1</button></div>
      <div id="b" tabindex="-1"><button id="b1">1</button><button id="b2">2</button></div>`;
    const get = (id: string) => document.getElementById(id) as HTMLElement;
    const releaseA = trapFocus(get('a'));
    const releaseB = trapFocus(get('b'));
    releaseA();
    get('b2').focus();
    expect(tab().defaultPrevented).toBe(true);
    releaseB();
    expect(tab().defaultPrevented).toBe(false);
  });
});
