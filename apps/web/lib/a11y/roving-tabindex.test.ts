import { afterEach, describe, expect, it, vi } from 'vitest';

import { createRovingTabindex } from './roving-tabindex';

import type { RovingOptions } from './roving-tabindex';

function setup(options: Partial<RovingOptions> = {}, html?: string) {
  document.body.innerHTML = `<div id="list" role="tablist">${
    html ??
    `<button role="tab" id="t1">1</button><button role="tab" id="t2">2</button><button role="tab" id="t3">3</button>`
  }</div>`;
  const list = document.getElementById('list') as HTMLElement;
  const items = () => [...list.querySelectorAll<HTMLElement>('[role=tab]')];
  const roving = createRovingTabindex(list, { orientation: 'horizontal', loop: true, items, ...options });
  const press = (target: string, key: string) => {
    const el = document.getElementById(target) as HTMLElement;
    el.focus();
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    el.dispatchEvent(event);
    return event;
  };
  return { list, items, roving, press };
}

const tabIndexes = (items: () => HTMLElement[]) => items().map((el) => el.tabIndex);

afterEach(() => {
  document.body.innerHTML = '';
});

describe('createRovingTabindex', () => {
  it('leaves exactly one tab stop: the first item, or the selected one', () => {
    expect(tabIndexes(setup().items)).toEqual([0, -1, -1]);
    const selected = setup(
      {},
      `<button role="tab" id="t1">1</button><button role="tab" id="t2" aria-selected="true">2</button>`,
    );
    expect(tabIndexes(selected.items)).toEqual([-1, 0]);
  });

  it('moves with the arrows, carrying the tab stop and the focus', () => {
    const onMove = vi.fn();
    const { items, press } = setup({ onMove });
    expect(press('t1', 'ArrowRight').defaultPrevented).toBe(true);
    expect(document.activeElement?.id).toBe('t2');
    expect(tabIndexes(items)).toEqual([-1, 0, -1]);
    expect(onMove).toHaveBeenCalledWith(document.getElementById('t2'), 1);
  });

  it('wraps with loop and stops at the ends without it', () => {
    const looped = setup({ loop: true });
    looped.press('t3', 'ArrowRight');
    expect(document.activeElement?.id).toBe('t1');
    looped.press('t1', 'ArrowLeft');
    expect(document.activeElement?.id).toBe('t3');
    const plain = setup({ loop: false });
    plain.press('t3', 'ArrowRight');
    expect(document.activeElement?.id).toBe('t3');
  });

  it('jumps with Home and End and ignores keys of the other axis', () => {
    const { press } = setup();
    press('t2', 'End');
    expect(document.activeElement?.id).toBe('t3');
    press('t3', 'Home');
    expect(document.activeElement?.id).toBe('t1');
    expect(press('t1', 'ArrowDown').defaultPrevented).toBe(false);
    expect(document.activeElement?.id).toBe('t1');
  });

  it('skips disabled items and follows focus that arrives by other means', () => {
    const { items, press } = setup(
      {},
      `<button role="tab" id="t1">1</button><button role="tab" id="t2" disabled>2</button><button role="tab" id="t3">3</button>`,
    );
    press('t1', 'ArrowRight');
    expect(document.activeElement?.id).toBe('t3');
    (document.getElementById('t1') as HTMLElement).focus();
    expect(tabIndexes(items)).toEqual([0, -1, -1]);
  });

  it('supports both axes and stops listening after destroy', () => {
    const { roving, press } = setup({ orientation: 'both' });
    press('t1', 'ArrowDown');
    expect(document.activeElement?.id).toBe('t2');
    roving.destroy();
    expect(press('t2', 'ArrowRight').defaultPrevented).toBe(false);
  });
});
