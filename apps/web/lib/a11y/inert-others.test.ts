import { afterEach, describe, expect, it } from 'vitest';

import { inertSiblings } from './inert-others';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('inertSiblings', () => {
  it('makes everything outside the element inert and restores it', () => {
    document.body.innerHTML = `
      <header id="h"></header>
      <main id="m"><section id="s1"></section><section id="open"></section></main>
      <footer id="f"></footer>`;
    const open = document.getElementById('open') as HTMLElement;
    const restore = inertSiblings(open);
    const inert = (id: string) => document.getElementById(id)?.hasAttribute('inert');
    expect([inert('h'), inert('s1'), inert('f')]).toEqual([true, true, true]);
    expect(inert('open')).toBe(false);
    expect(inert('m')).toBe(false); // an ancestor of the element is never inert
    restore();
    expect([inert('h'), inert('s1'), inert('f')]).toEqual([false, false, false]);
  });

  it('leaves alone what was already inert, and what must stay live', () => {
    document.body.innerHTML = `
      <header id="h" inert></header>
      <div id="live"><p id="toast"></p></div>
      <main><div id="open"></div></main>`;
    const open = document.getElementById('open') as HTMLElement;
    const toast = document.getElementById('toast') as HTMLElement;
    const restore = inertSiblings(open, [toast]);
    expect(document.getElementById('live')?.hasAttribute('inert')).toBe(false);
    restore();
    // the header was inert before the call: still inert after restoring
    expect(document.getElementById('h')?.hasAttribute('inert')).toBe(true);
  });
});
