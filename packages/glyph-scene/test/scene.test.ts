// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const spies = vi.hoisted(() => ({
  renderer: { dispose: vi.fn(), forceContextLoss: vi.fn(), render: vi.fn() },
  composer: { dispose: vi.fn(), render: vi.fn() },
  bloom: { dispose: vi.fn() },
}));

vi.mock('three', async (orig) => ({
  ...(await orig<typeof import('three')>()),
  WebGLRenderer: class {
    domElement = document.createElement('canvas');
    setSize() {}
    setPixelRatio() {}
    setClearColor() {}
    render() {
      spies.renderer.render();
    }
    dispose() {
      spies.renderer.dispose();
    }
    forceContextLoss() {
      spies.renderer.forceContextLoss();
    }
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
    render() {
      spies.composer.render();
    }
    setSize() {}
    dispose() {
      spies.composer.dispose();
    }
  },
}));
vi.mock('three/addons/postprocessing/RenderPass.js', () => ({ RenderPass: class {} }));
vi.mock('three/addons/postprocessing/UnrealBloomPass.js', () => ({
  UnrealBloomPass: class {
    strength = 0;
    dispose() {
      spies.bloom.dispose();
    }
  },
}));

import { createGlyphScene } from '../src';

async function make(capture = true) {
  const canvas = document.createElement('canvas');
  const stage = document.createElement('div');
  document.body.append(stage);
  const states: number[] = [];
  const s = await createGlyphScene({
    canvas,
    stage,
    count: 200,
    seed: 1,
    capture,
    ...(capture ? null : { background: '#07060f' }),
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

it('capture loop closes in 459 steps of 1/30 s: state, phase, uProg, rotY and uTime match frame 0', async () => {
  const { s } = await make();
  const dbg = () => ({ ...s.debug() });
  const first = dbg();
  const dt = 1 / 30;
  for (let i = 0; i < 459; i++) {
    s.step(dt);
  }
  const last = dbg();
  expect(last.state).toBe(first.state);
  expect(last.phase).toBe(first.phase);
  expect(last.uProg).toBe(first.uProg);
  // the chip sway relaxes with a lag: ~0.005 rad (0.3 deg) of residual at the wrap
  expect(Math.abs(last.rotY - first.rotY)).toBeLessThan(0.01);
  expect(last.uTime).toBeCloseTo(0, 6);
  expect(first.uTime).toBe(0);
});

it('capture starts on its steady look (no fading reflection) and honours the initial pose; live fades from the prototype start', async () => {
  const mk = async (capture: boolean, pose?: { rotY: number }) => {
    const stage = document.createElement('div');
    document.body.append(stage);
    return createGlyphScene({ canvas: document.createElement('canvas'), stage, count: 200, capture, background: '#07060f', ...(pose ? { pose } : null) });
  };
  vi.stubGlobal('matchMedia', () => ({ matches: false })); // below 56.25rem: the narrow look has no reflection
  const cap = await mk(true);
  const live = await mk(false);
  expect(cap.debug().mirror).toBe(0);
  expect(live.debug().mirror).toBe(1);
  expect((await mk(false, { rotY: 0.6 })).debug().rotY).toBe(0.6);
  vi.unstubAllGlobals();
});

describe('lifecycle', () => {
  let raf: ReturnType<typeof vi.fn>;
  let caf: ReturnType<typeof vi.fn>;
  let ioCb: ((e: { isIntersecting: boolean }[]) => void) | undefined;
  beforeEach(() => {
    vi.clearAllMocks();
    let id = 0;
    raf = vi.fn(() => ++id);
    caf = vi.fn();
    vi.stubGlobal('requestAnimationFrame', raf);
    vi.stubGlobal('cancelAnimationFrame', caf);
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: (e: { isIntersecting: boolean }[]) => void) {
          ioCb = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('dispose cancels rAF, frees GPU resources, removes listeners and makes start/step no-ops', async () => {
    const removeDoc = vi.spyOn(document, 'removeEventListener');
    const removeWin = vi.spyOn(window, 'removeEventListener');
    const { s } = await make(false);
    s.start();
    expect(raf).toHaveBeenCalledTimes(1);
    s.dispose();
    expect(caf).toHaveBeenCalledTimes(1);
    expect(spies.bloom.dispose).toHaveBeenCalledTimes(1);
    expect(spies.composer.dispose).toHaveBeenCalledTimes(1);
    expect(spies.renderer.dispose).toHaveBeenCalledTimes(1);
    expect(spies.renderer.forceContextLoss).toHaveBeenCalledTimes(1);
    expect(removeDoc).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(removeWin).toHaveBeenCalledWith('pointermove', expect.any(Function));
    expect(removeWin).toHaveBeenCalledWith('resize', expect.any(Function));
    const renders = spies.composer.render.mock.calls.length;
    const rafs = raf.mock.calls.length;
    s.start();
    s.step(0.1);
    s.dispose();
    expect(raf.mock.calls.length).toBe(rafs);
    expect(spies.composer.render.mock.calls.length).toBe(renders);
    expect(spies.renderer.dispose).toHaveBeenCalledTimes(1);
  });

  it('pauses on visibilitychange and when the stage leaves the viewport, drawing one dim frame', async () => {
    const { s } = await make(false);
    s.start();
    expect(raf).toHaveBeenCalledTimes(1);
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(caf).toHaveBeenCalledTimes(1);
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(raf).toHaveBeenCalledTimes(2);

    const before = spies.composer.render.mock.calls.length;
    ioCb?.([{ isIntersecting: false }]);
    expect(caf).toHaveBeenCalledTimes(2);
    expect(s.debug().bright).toBe(0);
    expect(spies.composer.render.mock.calls.length).toBe(before + 1);
    ioCb?.([{ isIntersecting: true }]);
    expect(raf).toHaveBeenCalledTimes(3);
    s.dispose();
  });
});
