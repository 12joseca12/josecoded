// @vitest-environment happy-dom
import { expect, it, vi } from 'vitest';

vi.mock('three', async (orig) => ({
  ...(await orig<typeof import('three')>()),
  WebGLRenderer: class {
    domElement = document.createElement('canvas');
    setSize() {}
    setPixelRatio() {}
    setClearColor() {}
    render() {}
    dispose() {}
    getPixelRatio() {
      return 1;
    }
    getContext() {
      return {};
    }
  },
}));
vi.mock('three/addons/postprocessing/EffectComposer.js', () => ({
  EffectComposer: class {
    addPass() {}
    render() {}
    setSize() {}
    dispose() {}
  },
}));
vi.mock('three/addons/postprocessing/RenderPass.js', () => ({ RenderPass: class {} }));
vi.mock('three/addons/postprocessing/UnrealBloomPass.js', () => ({
  UnrealBloomPass: class {
    strength = 0;
  },
}));

import { createGlyphScene } from '../src';

async function make() {
  const canvas = document.createElement('canvas');
  const stage = document.createElement('div');
  document.body.append(stage);
  const states: number[] = [];
  const s = await createGlyphScene({
    canvas,
    stage,
    count: 200,
    seed: 1,
    capture: true,
    onState: (i) => states.push(i),
  });
  return { s, states };
}

it('hold 3.5 s then morph 1.6 s; a full cycle returns to state 0', async () => {
  const { s, states } = await make();
  s.step(3.4);
  expect(s.debug().phase).toBe('hold');
  s.step(0.2);
  expect(s.debug().phase).toBe('morph');
  s.step(1.6);
  expect(states).toEqual([1]);
  for (let t = 0; t < 2 * 5.1; t += 0.1) s.step(0.1);
  expect(states.at(-1)).toBe(0);
  expect(s.debug().uProg).toBeCloseTo(0, 1);
});

it('off mode dims the cloud and keeps it in place; skipIntro sets uIntroT to 100', async () => {
  const { s } = await make();
  s.setMode('off');
  for (let i = 0; i < 30; i++) s.step(0.1);
  expect(s.debug().bright).toBeLessThan(0.05);
  s.playIntro(0);
  expect(s.debug().uIntroT).toBeLessThan(100);
  s.skipIntro();
  expect(s.debug().uIntroT).toBe(100);
});

it('the cycle waits while the intro has not reached 1.5 s', async () => {
  const { s } = await make();
  s.playIntro(0);
  s.step(1.0);
  s.step(0.4);
  expect(s.debug().uIntroT).toBeCloseTo(1.4, 5);
  expect(s.debug().phase).toBe('hold');
  s.skipIntro();
  s.step(3.6);
  expect(s.debug().phase).toBe('morph');
});

it('dispose is safe and stops the loop', async () => {
  const { s } = await make();
  s.start();
  s.dispose();
  expect(() => s.step(0.1)).not.toThrow();
});
