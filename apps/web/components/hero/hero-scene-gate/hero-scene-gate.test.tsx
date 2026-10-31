import { render } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { HeroSceneGate } from '.';

const mocks = vi.hoisted(() => ({
  mode: 'scene' as 'scene' | 'video' | 'poster',
  startScene: vi.fn(),
  startVideo: vi.fn(),
}));

vi.mock('@/lib/motion/hero-gate', () => ({
  decideHeroMode: () => mocks.mode,
  readHeroContext: () => ({}),
}));
vi.mock('@/lib/hero/load-scene', () => ({ startScene: mocks.startScene }));
vi.mock('@/lib/hero/load-video', () => ({ startVideo: mocks.startVideo }));

const sources = { webm: '/v.webm', mp4: '/v.mp4' };
let stage: HTMLElement;

beforeEach(() => {
  mocks.mode = 'scene';
  mocks.startScene.mockReset().mockReturnValue({ ready: new Promise(() => undefined), stop: vi.fn() });
  mocks.startVideo.mockReset().mockReturnValue(vi.fn());
  document.body.innerHTML =
    '<div data-backdrop-canvas></div><div data-hero-stage><picture><source data-poster-placeholder></picture><video></video></div>';
  stage = document.querySelector<HTMLElement>('[data-hero-stage]') as HTMLElement;
});

afterEach(() => {
  document.body.replaceChildren();
});

it('arms the stage and keeps the placeholder while the scene runs', () => {
  render(<HeroSceneGate sources={sources} />);
  expect(stage.dataset.armed).toBe('');
  expect(stage.dataset.mode).toBe('scene');
  expect(stage.querySelector('[data-poster-placeholder]')).not.toBeNull();
});

it('falls back to the video and brings the poster back when the context is lost', () => {
  render(<HeroSceneGate sources={sources} />);
  const { onContextLost } = mocks.startScene.mock.calls[0]![0] as { onContextLost: () => void };
  onContextLost();
  expect(stage.dataset.mode).toBe('video');
  expect(stage.querySelector('[data-poster-placeholder]')).toBeNull();
  expect(mocks.startVideo).toHaveBeenCalledTimes(1);
});

it('brings the poster back in poster mode', () => {
  mocks.mode = 'poster';
  render(<HeroSceneGate sources={sources} />);
  expect(stage.dataset.mode).toBe('poster');
  expect(stage.querySelector('[data-poster-placeholder]')).toBeNull();
});

it('does not restart the media when it re-renders with an equal but new sources object', () => {
  const { rerender } = render(<HeroSceneGate sources={sources} />);
  rerender(<HeroSceneGate sources={{ ...sources }} />);
  expect(mocks.startScene).toHaveBeenCalledTimes(1);
});
