import { afterEach, describe, expect, it } from 'vitest';

import { focusableWithin } from './focusable';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('focusableWithin', () => {
  it('skips hidden, inert, tabindex -1 and disabled elements', () => {
    document.body.innerHTML = `<div id="c">
      <button id="ok">ok</button><button disabled>x</button><button tabindex="-1">x</button>
      <div hidden><button>x</button></div><div inert><button>x</button></div></div>`;
    const ids = focusableWithin(document.getElementById('c') as HTMLElement).map((el) => el.id);
    expect(ids).toEqual(['ok']);
  });

  it('skips elements that are not rendered (display: none, visibility: hidden)', () => {
    document.body.innerHTML = `<div id="c">
      <button id="ok">ok</button>
      <div style="display: none"><button id="none">x</button></div>
      <button id="vis" style="visibility: hidden">x</button></div>`;
    const ids = focusableWithin(document.getElementById('c') as HTMLElement).map((el) => el.id);
    expect(ids).toContain('ok');
    expect(ids).not.toContain('none');
    expect(ids).not.toContain('vis');
  });
});
