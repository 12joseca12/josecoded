import { afterEach, describe, expect, it, vi } from 'vitest';

import { track, umamiScript } from './analytics';

type UmamiWindow = Window & { umami?: { track: (name: string, data?: object) => void } };

afterEach(() => {
  delete (window as UmamiWindow).umami;
});

describe('track', () => {
  it('is a no-op without umami and forwards when present', () => {
    expect(() => track('intro_played', { skipped: true, reduced: false, mode: 'full' })).not.toThrow();
    const umami = { track: vi.fn() };
    (window as UmamiWindow).umami = umami;
    track('scene_open', { scene: 'business' });
    expect(umami.track).toHaveBeenCalledWith('scene_open', { scene: 'business' });
  });

  it('sends events without payload by name only', () => {
    const umami = { track: vi.fn() };
    (window as UmamiWindow).umami = umami;
    track('scene_drag');
    expect(umami.track).toHaveBeenCalledWith('scene_drag', undefined);
  });

  it('never throws, even if umami does', () => {
    (window as UmamiWindow).umami = {
      track: () => {
        throw new Error('blocked');
      },
    };
    expect(() => track('palette_open')).not.toThrow();
  });

  it('rejects unknown event names and wrong payloads at type level', () => {
    // @ts-expect-error unknown event
    expect(() => track('unknown_event')).not.toThrow();
    // @ts-expect-error scene_open needs its scene
    expect(() => track('scene_open')).not.toThrow();
  });
});

describe('umamiScript', () => {
  const siteUrl = 'https://josecoded.com';

  it('is off without the instance URL or the website id', () => {
    expect(umamiScript({ siteUrl })).toBeUndefined();
    expect(umamiScript({ siteUrl, url: 'https://stats.josecoded.com' })).toBeUndefined();
    expect(umamiScript({ siteUrl, websiteId: 'abc' })).toBeUndefined();
  });

  it('points at the instance and records only on the production host', () => {
    expect(umamiScript({ siteUrl, url: 'https://stats.josecoded.com/', websiteId: 'abc' })).toEqual({
      src: 'https://stats.josecoded.com/script.js',
      websiteId: 'abc',
      domains: 'josecoded.com',
    });
  });
});
