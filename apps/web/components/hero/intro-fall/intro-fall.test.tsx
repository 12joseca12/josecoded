import { render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import { SCENE_READY_EVENT } from '@/lib/motion/intro-fall';

import { IntroFall } from '.';

const runIntro = vi.hoisted(() => vi.fn());

vi.mock('@/lib/motion/intro-fall', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/motion/intro-fall')>()),
  runIntro,
}));

afterEach(() => {
  runIntro.mockReset();
  delete document.documentElement.dataset.intro;
});

it('removes the scene:ready listener on cleanup, so a remount starts clean', async () => {
  document.documentElement.dataset.intro = 'pending';
  const cancel = vi.fn();
  runIntro.mockReturnValue({ finish: vi.fn(), cancel });

  const first = render(<IntroFall awaitScene />);
  const firstScene = runIntro.mock.calls[0]![0].sceneReady as Promise<unknown>;
  first.unmount();
  expect(cancel).toHaveBeenCalledTimes(1);

  render(<IntroFall awaitScene />);
  const secondScene = runIntro.mock.calls[1]![0].sceneReady as Promise<unknown>;

  window.dispatchEvent(new Event(SCENE_READY_EVENT));
  const settled = (promise: Promise<unknown>) =>
    Promise.race([promise.then(() => true), new Promise<boolean>((r) => setTimeout(() => r(false), 20))]);
  expect(await settled(secondScene)).toBe(true);
  // the first run's listener is gone: its promise never settles
  expect(await settled(firstScene)).toBe(false);
});
