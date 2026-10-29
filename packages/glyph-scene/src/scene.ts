import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  LinearSRGBColorSpace,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
  type IUniform,
  type Texture,
} from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { createAtlasTexture } from './atlas';
import { loadClouds } from './cloud-loader';
import { advanceCycle, CHIP, createCycle, cycleFill, cycleIndex, type StateIndex } from './cycle';
import { advanceIntro, createIntro, INTRO_HOLD_UNTIL, playIntro as startIntro, skipIntro as endIntro } from './intro';
import { CAPTURE, COUNT, PARAMS, type Params } from './params';
import { FRAGMENT, VERTEX } from './shaders';

export type GlyphSceneMode = 'cycle' | 'off';

export interface GlyphSceneOptions {
  canvas: HTMLCanvasElement;
  /** Hero column: position and scale of the cloud, and the drag surface. */
  stage: HTMLElement;
  /** Light field that follows the cloud by `transform` only. */
  field?: HTMLElement;
  count?: number;
  seed?: number;
  params?: Partial<Params>;
  /** Fixed dt, no intro, `rot` 0 and loop-perfect periods (sway 5.1 s, breath 3 cycles per 15.3 s, waves 3.825 s). */
  capture?: boolean;
  /** CSS colour of the clear colour; defaults to the `--bg` custom property, then `#07060f`. */
  background?: string;
  /** Fires when the highlighted cycle state changes (not for the initial state). `progress` is the bar fill at that moment. */
  onState?(index: StateIndex, progress: number): void;
}

export interface GlyphScene {
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  playIntro(t0: DOMHighResTimeStamp): void;
  skipIntro(): void;
  /** One deterministic frame (capture and tests): advances by `dt` seconds and renders. */
  step(dt: number): void;
  layout(): void;
  dispose(): void;
  debug(): Readonly<GlyphSceneDebug>;
  setMode(mode: GlyphSceneMode): void;
}

export type GlyphSceneDebug = {
  phase: 'hold' | 'morph';
  state: StateIndex;
  next: StateIndex;
  uProg: number;
  uIntroT: number;
  bright: number;
  mirror: number;
  scale: number;
  x: number;
  y: number;
  count: number;
  mode: GlyphSceneMode;
};

const LOOP_SECONDS = CAPTURE.frames / CAPTURE.fps; // 15.3
const TAU = Math.PI * 2;
const BREATH_W = 1.25;
const SWAY_W = 0.45;
const DEFAULT_BG = '#07060f';

type Target = { x: number; y: number; scale: number; bright: number; mirror: number };
type Uniforms = Record<string, IUniform<unknown>>;

const u = <T>(value: T): IUniform<T> => ({ value });

function readBackground(): string {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    return v || DEFAULT_BG;
  } catch {
    return DEFAULT_BG;
  }
}

function isNarrow(): boolean {
  // Baseline breakpoint 56.25rem (working-agreements §8); matchMedia keeps it in rem.
  try {
    return !matchMedia('(min-width: 56.25rem)').matches;
  } catch {
    return innerWidth < 900;
  }
}

export async function createGlyphScene(o: GlyphSceneOptions): Promise<GlyphScene> {
  const capture = o.capture ?? false;
  const seed = o.seed ?? CAPTURE.seed;
  const P: Params = { ...PARAMS, ...o.params, ...(capture ? { rot: 0, wperiod: LOOP_SECONDS / 4 } : null) };
  const N = o.count ?? COUNT.desktop;
  const { canvas, stage, field } = o;

  const [clouds, atlas] = await Promise.all([loadClouds(N, seed), createAtlasTexture()]);

  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(capture ? 1 : Math.min(devicePixelRatio || 1, 1.5));
  // Linear output without conversion: the clear colour lands exactly on the page background.
  renderer.setClearColor(new Color().setStyle(o.background ?? readBackground(), LinearSRGBColorSpace), 1);
  renderer.outputColorSpace = LinearSRGBColorSpace;

  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.1, 50);
  camera.position.set(0, 0, P.focus);
  const group = new Group();
  scene.add(group);

  let composer: EffectComposer | null = null;
  let bloom: UnrealBloomPass | null = null;
  if (P.bloom > 0) {
    composer = new EffectComposer(renderer);
    bloom = new UnrealBloomPass(new Vector2(innerWidth, innerHeight), P.bloom, 0.3, P.bloomth);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(bloom);
  }

  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(clouds.t0.slice(), 3));
  geo.setAttribute('aT0', new BufferAttribute(clouds.t0, 3));
  geo.setAttribute('aT1', new BufferAttribute(clouds.t1, 3));
  geo.setAttribute('aT2', new BufferAttribute(clouds.t2, 3));
  geo.setAttribute('aKind', new BufferAttribute(clouds.kind, 1));
  geo.setAttribute('aParam', new BufferAttribute(clouds.param, 1));
  geo.setAttribute('aSeed', new BufferAttribute(clouds.aSeed, 1));
  geo.setAttribute('aGlyph', new BufferAttribute(clouds.aGlyph, 1));
  geo.setAttribute('aCol', new BufferAttribute(clouds.aCol, 1));
  // The wave layer draws 28 % of the same attributes: shared, not cloned.
  const waveGeo = new BufferGeometry();
  for (const name of Object.keys(geo.attributes)) waveGeo.setAttribute(name, geo.getAttribute(name));
  waveGeo.setDrawRange(0, Math.floor(N * 0.28));

  const breathW = capture ? (TAU * 3) / LOOP_SECONDS : BREATH_W;
  const swayW = capture ? TAU / 5.1 : SWAY_W;
  const makeMaterial = (extra: Partial<Record<string, number>>, texture: Texture): ShaderMaterial => {
    const uniforms: Uniforms = {
      uTime: u(0),
      uProg: u(0),
      uFrom: u(0),
      uTo: u(1),
      uIntroT: u(100),
      uWave: u(0),
      uWavePeriod: u(P.wperiod),
      uWaveAmp: u(P.wamp),
      uBreath: u(P.breath),
      uBreathW: u(breathW),
      uMirror: u(0),
      uFocus: u(P.focus),
      uSize: u(P.size),
      uBright: u(1),
      uScatter: u(P.scatter),
      uAtlas: u(texture),
      uDpr: u(renderer.getPixelRatio()),
    };
    for (const [k, v] of Object.entries(extra)) uniforms[k] = u(v);
    return new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms,
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
    });
  };
  const mat = makeMaterial({}, atlas);
  const waveMat = makeMaterial({ uWave: 1, uSize: P.size * 0.7 }, atlas);
  const mirrorMat = makeMaterial({ uMirror: 1 }, atlas);
  const mats = [mat, waveMat, mirrorMat];
  group.add(new Points(geo, mat), new Points(waveGeo, waveMat), new Points(geo, mirrorMat));
  const uni = (m: ShaderMaterial, k: string) => m.uniforms[k] as IUniform<number>;

  /* ---- screen geometry -> world ---- */
  let vw = 1;
  let vh = 1;
  let heroX = 0;
  let heroY = 0;
  let heroScale = 1;
  let narrow = isNarrow();
  let mode: GlyphSceneMode = 'cycle';

  function layout(): void {
    const w = innerWidth;
    const h = innerHeight;
    narrow = isNarrow();
    renderer.setSize(w, h, false);
    composer?.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    vh = 2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360);
    vw = vh * camera.aspect;
    const r = stage.getBoundingClientRect();
    const top = r.top + scrollY; // column position with the page scrolled to the top
    heroX = ((r.left + r.width / 2) / w - 0.5) * vw;
    heroY = (0.5 - (top + r.height / 2) / h) * vh;
    heroScale = Math.min(1.35, ((r.height / h) * vh) / 3.4, ((r.width / w) * vw) / 3.4);
  }

  function targetFor(m: GlyphSceneMode): Target {
    if (m === 'off') return { x: heroX, y: heroY + vh * 0.35, scale: heroScale * 0.9, bright: 0, mirror: 0 };
    return { x: heroX, y: heroY, scale: heroScale, bright: narrow ? 0.55 : 1, mirror: narrow ? 0 : 1 };
  }

  layout();
  const cur = { x: heroX, y: heroY, scale: heroScale, bright: narrow ? 0.55 : 1, mirror: 1 };

  /* ---- state ---- */
  const cycle = createCycle();
  const intro = createIntro();
  let clock = 0;
  let lastIndex: StateIndex = 0;

  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let velX = 0;
  let velY = 0;
  let rotY = 0;
  let rotX = 0;
  let tiltX = 0;
  let tiltY = 0;
  let fx = 0;
  let fy = 0;

  const onDown = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    stage.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    velX = (e.clientX - lastX) * 0.006;
    velY = (e.clientY - lastY) * 0.004;
    rotY += velX;
    rotX += velY;
    lastX = e.clientX;
    lastY = e.clientY;
  };
  const onUp = () => {
    dragging = false;
  };
  const onTilt = (e: PointerEvent) => {
    tiltX = e.clientX / innerWidth - 0.5;
    tiltY = e.clientY / innerHeight - 0.5;
  };
  const onResize = () => layout();
  stage.addEventListener('pointerdown', onDown);
  stage.addEventListener('pointermove', onMove);
  stage.addEventListener('pointerup', onUp);
  stage.addEventListener('pointercancel', onUp);
  if (!capture) {
    addEventListener('pointermove', onTilt, { passive: true });
    addEventListener('resize', onResize, { passive: true });
  }

  function update(dt: number, nowMs?: number): void {
    clock += dt;
    advanceIntro(intro, dt, nowMs);
    advanceCycle(cycle, dt, P, intro.t < INTRO_HOLD_UNTIL);
    uni(mat, 'uFrom').value = cycle.state;
    uni(mat, 'uTo').value = cycle.next;
    uni(mat, 'uProg').value = cycle.prog;
    const idx = cycleIndex(cycle);
    if (idx !== lastIndex) {
      lastIndex = idx;
      o.onState?.(idx, cycleFill(cycle, P.hold));
    }

    const T = targetFor(mode);
    const k = 1 - Math.exp(-dt * 3.2); // smooth, interruptible follow
    cur.x += (T.x - cur.x) * k;
    cur.y += (T.y - cur.y) * k;
    cur.scale += (T.scale - cur.scale) * k;
    cur.mirror += (T.mirror - cur.mirror) * k;
    // switches off fast when leaving the hero, comes back softly
    cur.bright += (T.bright - cur.bright) * (T.bright < cur.bright ? Math.min(1, k * 3) : k);

    // per-frame constants of the prototype (60 fps) made frame-rate independent
    const s = dt * 60;
    const decay = (r: number) => Math.pow(r, s);
    if (!dragging) {
      velX *= decay(0.92);
      velY *= decay(0.92);
      const base = Math.round(rotY / TAU) * TAU;
      if (cycle.state === CHIP && cycle.phase === 'hold') {
        const target = base + Math.sin(clock * swayW) * 0.34;
        rotY += (target - rotY) * (1 - decay(0.965)) + velX * s;
        rotX += (0 - rotX) * (1 - decay(0.95)) + velY * s;
      } else {
        // capture relaxes to the front so frame 0 and the last frame match
        rotY += capture ? (base - rotY) * (1 - decay(0.965)) : velX * s + P.rot * dt;
        rotX += velY * s;
        rotX *= decay(0.98);
      }
    }
    group.rotation.y = rotY + tiltX * 0.22;
    group.rotation.x = rotX + tiltY * 0.14;
    group.position.set(cur.x, cur.y, 0);
    group.scale.setScalar(cur.scale);

    for (const m of mats) {
      uni(m, 'uTime').value = clock;
      uni(m, 'uProg').value = cycle.prog;
      uni(m, 'uFrom').value = cycle.state;
      uni(m, 'uTo').value = cycle.next;
      uni(m, 'uIntroT').value = intro.t;
      uni(m, 'uBright').value = cur.bright;
    }
    uni(mirrorMat, 'uBright').value = cur.bright * P.mirror * cur.mirror;
    if (bloom) bloom.strength = P.bloom * cur.bright;

    if (field) {
      // light field follows the object and slightly the cursor (own layer, transform only)
      const sx = cur.x / vw;
      const sy = cur.y / vh;
      fx += ((sx + tiltX * 0.06) * innerWidth - fx) * k;
      fy += ((-sy + tiltY * 0.05) * innerHeight - fy) * k;
      field.style.transform = `translate3d(${fx.toFixed(1)}px, ${fy.toFixed(1)}px, 0) rotate(${(tiltX * 4).toFixed(2)}deg)`;
    }
  }

  function render(): void {
    if (composer) composer.render();
    else renderer.render(scene, camera);
  }

  /* ---- loop: runs only while started, not paused, visible and on screen ---- */
  let started = false;
  let userPaused = false;
  let hidden = typeof document !== 'undefined' && document.hidden;
  let offscreen = false;
  let raf = 0;
  let last = 0;

  const shouldRun = () => started && !userPaused && !hidden && !offscreen;
  function frame(now: number): void {
    raf = 0;
    if (!shouldRun()) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt, now);
    render();
    raf = requestAnimationFrame(frame);
  }
  function sync(): void {
    if (shouldRun()) {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    } else if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }
  const onVisibility = () => {
    hidden = document.hidden;
    sync();
  };
  document.addEventListener('visibilitychange', onVisibility);
  const io =
    typeof IntersectionObserver === 'function'
      ? new IntersectionObserver((entries) => {
          const e = entries[entries.length - 1];
          if (!e) return;
          offscreen = !e.isIntersecting;
          sync();
        })
      : null;
  io?.observe(stage);

  return {
    start() {
      started = true;
      sync();
    },
    stop() {
      started = false;
      sync();
    },
    pause() {
      userPaused = true;
      sync();
    },
    resume() {
      userPaused = false;
      sync();
    },
    playIntro(t0) {
      startIntro(intro, t0);
      for (const m of mats) uni(m, 'uIntroT').value = intro.t;
    },
    skipIntro() {
      endIntro(intro);
      for (const m of mats) uni(m, 'uIntroT').value = intro.t;
    },
    step(dt) {
      update(dt);
      render();
    },
    layout,
    setMode(m) {
      mode = m;
    },
    debug: () => ({
      phase: cycle.phase,
      state: cycle.state,
      next: cycle.next,
      uProg: cycle.prog,
      uIntroT: intro.t,
      bright: cur.bright,
      mirror: cur.mirror,
      scale: cur.scale,
      x: cur.x,
      y: cur.y,
      count: N,
      mode,
    }),
    dispose() {
      started = false;
      sync();
      io?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      stage.removeEventListener('pointerdown', onDown);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerup', onUp);
      stage.removeEventListener('pointercancel', onUp);
      removeEventListener('pointermove', onTilt);
      removeEventListener('resize', onResize);
      geo.dispose();
      waveGeo.dispose();
      for (const m of mats) m.dispose();
      atlas.dispose();
      composer?.dispose();
      renderer.dispose();
    },
  };
}
