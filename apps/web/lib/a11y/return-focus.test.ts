import { afterEach, describe, expect, it } from 'vitest';

import { captureFocus } from './return-focus';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('captureFocus', () => {
  it('gives focus back to the element that had it', () => {
    document.body.innerHTML = '<button id="opener"></button><button id="inside"></button>';
    const opener = document.getElementById('opener') as HTMLElement;
    const inside = document.getElementById('inside') as HTMLElement;
    opener.focus();
    const restore = captureFocus();
    inside.focus();
    restore();
    expect(document.activeElement).toBe(opener);
  });

  it('uses the explicit trigger, and the fallback when the trigger is gone', () => {
    document.body.innerHTML = '<button id="t"></button><button id="fb"></button>';
    const trigger = document.getElementById('t') as HTMLElement;
    const fallback = document.getElementById('fb') as HTMLElement;
    const restore = captureFocus(trigger, fallback);
    trigger.remove();
    restore();
    expect(document.activeElement).toBe(fallback);
  });
});
