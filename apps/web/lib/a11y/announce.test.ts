import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { announce, resetAnnouncer } from './announce';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  resetAnnouncer();
  vi.useRealTimers();
});

describe('announce', () => {
  it('writes into one polite live region, created on demand', () => {
    announce('Guardado');
    vi.runAllTimers();
    const regions = document.querySelectorAll('[aria-live]');
    expect(regions).toHaveLength(1);
    expect(regions[0]?.getAttribute('aria-live')).toBe('polite');
    expect(regions[0]?.textContent).toBe('Guardado');
  });

  it('reuses the region and empties it first so a repeated message is announced again', () => {
    announce('Hecho');
    vi.runAllTimers();
    announce('Hecho');
    const region = document.querySelector('[aria-live]');
    expect(region?.textContent).toBe('');
    vi.runAllTimers();
    expect(document.querySelectorAll('[aria-live]')).toHaveLength(1);
    expect(region?.textContent).toBe('Hecho');
  });
});
