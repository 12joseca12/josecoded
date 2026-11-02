import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { startVideo } from './load-video';

vi.mock('./after-lcp', () => ({
  afterLcp: () => Promise.resolve(),
  afterLoadAndIntent: () => Promise.resolve(),
  idle: () => Promise.resolve(),
}));

const sources = { webm: '/v.webm', mp4: '/v.mp4' };

function setup(play: () => Promise<void>) {
  const stage = document.createElement('div');
  const video = document.createElement('video');
  video.load = vi.fn();
  video.pause = vi.fn();
  video.play = vi.fn(play);
  stage.append(video);
  document.body.append(stage);
  return { stage, video };
}

const settle = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
};

beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal('requestAnimationFrame', () => 1);
  vi.stubGlobal('cancelAnimationFrame', () => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

it('adds the sources, loads and calls play() itself (iOS never fires canplay on preload=none)', async () => {
  const { stage, video } = setup(() => Promise.resolve());
  startVideo({ stage, video, bars: null }, sources);
  await settle();
  expect(video.querySelectorAll('source')).toHaveLength(2);
  expect(video.load).toHaveBeenCalledTimes(1);
  expect(video.play).toHaveBeenCalled();
});

it('does not go live on canplay, only when playback has started', async () => {
  const { stage, video } = setup(() => Promise.resolve());
  startVideo({ stage, video, bars: null }, sources);
  await settle();
  video.dispatchEvent(new Event('canplay'));
  expect(stage.dataset.state).toBeUndefined();
  video.dispatchEvent(new Event('playing'));
  expect(stage.dataset.state).toBe('live');
});

it('keeps the poster (never live) when play() is refused', async () => {
  const { stage, video } = setup(() => Promise.reject(new DOMException('blocked', 'NotAllowedError')));
  startVideo({ stage, video, bars: null }, sources);
  await settle();
  video.dispatchEvent(new Event('canplay'));
  expect(stage.dataset.state).toBeUndefined();
});

it('the cleanup removes the state and the sources', async () => {
  const { stage, video } = setup(() => Promise.resolve());
  const stop = startVideo({ stage, video, bars: null }, sources);
  await settle();
  video.dispatchEvent(new Event('playing'));
  stop();
  expect(stage.dataset.state).toBeUndefined();
  expect(video.querySelectorAll('source')).toHaveLength(0);
});
