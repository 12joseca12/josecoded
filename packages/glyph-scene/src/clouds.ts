import type { Rng } from './rng';

/** Target clouds, ported from ref/home-v6/scene.js:28-135 (identical shapes; rng instead of Math.random). */

type Shape =
  | {
      t: 'seg';
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      th: number;
      w: number;
      trace?: boolean;
    }
  | { t: 'rect'; x: number; y: number; w2: number; h2: number; w: number; side?: boolean }
  | { t: 'fill'; x: number; y: number; w2: number; h2: number; w: number; back?: boolean }
  | { t: 'dot'; x: number; y: number; r: number; w: number };

type Vec3 = readonly [number, number, number];

/** Per-particle data of the chip's traces (kind 1 = trace, param = position along it); used by the scene sway. */
export type ChipMeta = { kind: Float32Array; param: Float32Array };

const rnd = (rng: Rng, a: number, b: number) => a + rng() * (b - a);

function sampleShapes(
  n: number,
  shapes: Shape[],
  depth: number,
  rng: Rng,
  meta?: ChipMeta,
): Float32Array {
  const a = new Float32Array(n * 3);
  const total = shapes.reduce((acc, sh) => acc + sh.w, 0);
  for (let i = 0; i < n; i++) {
    let r = rng() * total;
    let sh = shapes[0] as Shape;
    for (const c of shapes) {
      if (r < c.w) {
        sh = c;
        break;
      }
      r -= c.w;
    }
    let x = 0;
    let y = 0;
    let z = depth / 2 + 0.01;
    if (sh.t === 'seg') {
      const u = rng();
      x = sh.x1 + (sh.x2 - sh.x1) * u + rnd(rng, -sh.th, sh.th);
      y = sh.y1 + (sh.y2 - sh.y1) * u + rnd(rng, -sh.th, sh.th);
      if (meta && sh.trace) {
        meta.kind[i] = 1;
        meta.param[i] = u;
      }
    } else if (sh.t === 'rect') {
      const per = 2 * (sh.w2 + sh.h2);
      const u = rng() * per;
      const px = sh.x;
      const py = sh.y;
      const W = sh.w2;
      const H = sh.h2;
      if (u < W) {
        x = px - W / 2 + u;
        y = py + H / 2;
      } else if (u < W + H) {
        x = px + W / 2;
        y = py + H / 2 - (u - W);
      } else if (u < 2 * W + H) {
        x = px + W / 2 - (u - W - H);
        y = py - H / 2;
      } else {
        x = px - W / 2;
        y = py - H / 2 + (u - 2 * W - H);
      }
      if (sh.side) z = rnd(rng, -depth / 2, depth / 2);
    } else if (sh.t === 'fill') {
      x = sh.x + rnd(rng, -sh.w2 / 2, sh.w2 / 2);
      y = sh.y + rnd(rng, -sh.h2 / 2, sh.h2 / 2);
      if (sh.back) z = -depth / 2 - 0.01;
    } else {
      const ang = rng() * 6.283;
      const rr = Math.sqrt(rng()) * sh.r;
      x = sh.x + Math.cos(ang) * rr;
      y = sh.y + Math.sin(ang) * rr;
    }
    a[i * 3] = x;
    a[i * 3 + 1] = y;
    a[i * 3 + 2] = z;
  }
  return a;
}

export function cloudPhone(n: number, rng: Rng): Float32Array {
  const W = 1.3;
  const H = 2.6;
  const d = 0.14;
  const sh: Shape[] = [];
  sh.push({ t: 'rect', x: 0, y: 0, w2: W, h2: H, w: 16, side: true });
  sh.push({ t: 'rect', x: 0, y: 0, w2: W - 0.12, h2: H - 0.12, w: 8 });
  sh.push({ t: 'fill', x: 0, y: 0, w2: W - 0.16, h2: H - 0.16, w: 10 });
  sh.push({ t: 'fill', x: 0, y: 0, w2: W, h2: H, w: 5, back: true });
  sh.push({ t: 'seg', x1: -0.16, y1: H / 2 - 0.13, x2: 0.16, y2: H / 2 - 0.13, th: 0.02, w: 5 });
  sh.push({
    t: 'seg',
    x1: -W / 2 + 0.14,
    y1: H / 2 - 0.3,
    x2: -W / 2 + 0.38,
    y2: H / 2 - 0.3,
    th: 0.012,
    w: 2,
  });
  sh.push({
    t: 'seg',
    x1: W / 2 - 0.36,
    y1: H / 2 - 0.3,
    x2: W / 2 - 0.14,
    y2: H / 2 - 0.3,
    th: 0.012,
    w: 2,
  });
  for (let r = 0; r < 5; r++)
    for (let c = 0; c < 4; c++)
      sh.push({
        t: 'dot',
        x: -W / 2 + 0.26 + c * 0.26,
        y: H / 2 - 0.62 - r * 0.3,
        r: 0.075,
        w: 1.3,
      });
  sh.push({
    t: 'seg',
    x1: -W / 2 + 0.16,
    y1: -H / 2 + 0.36,
    x2: W / 2 - 0.16,
    y2: -H / 2 + 0.36,
    th: 0.01,
    w: 2,
  });
  for (let c = 0; c < 4; c++)
    sh.push({ t: 'dot', x: -W / 2 + 0.26 + c * 0.26, y: -H / 2 + 0.2, r: 0.08, w: 1.5 });
  sh.push({
    t: 'seg',
    x1: -0.22,
    y1: -H / 2 + 0.06,
    x2: 0.22,
    y2: -H / 2 + 0.06,
    th: 0.008,
    w: 1.5,
  });
  return sampleShapes(n, sh, d, rng);
}

export function cloudWeb(n: number, rng: Rng): Float32Array {
  const W = 3.2;
  const H = 2.1;
  const d = 0.08;
  const sh: Shape[] = [];
  const top = H / 2;
  sh.push({ t: 'rect', x: 0, y: 0, w2: W, h2: H, w: 14, side: true });
  sh.push({ t: 'fill', x: 0, y: 0, w2: W, h2: H, w: 6, back: true });
  sh.push({ t: 'seg', x1: -W / 2, y1: top - 0.26, x2: W / 2, y2: top - 0.26, th: 0.008, w: 4 });
  for (let c = 0; c < 3; c++)
    sh.push({ t: 'dot', x: -W / 2 + 0.14 + c * 0.11, y: top - 0.13, r: 0.03, w: 1.2 });
  sh.push({ t: 'rect', x: 0.15, y: top - 0.13, w2: 1.6, h2: 0.12, w: 5 });
  sh.push({
    t: 'seg',
    x1: -W / 2 + 0.2,
    y1: top - 0.5,
    x2: -W / 2 + 0.6,
    y2: top - 0.5,
    th: 0.012,
    w: 2,
  });
  for (let c = 0; c < 4; c++)
    sh.push({
      t: 'seg',
      x1: W / 2 - 1.5 + c * 0.34,
      y1: top - 0.5,
      x2: W / 2 - 1.3 + c * 0.34,
      y2: top - 0.5,
      th: 0.01,
      w: 1,
    });
  sh.push({
    t: 'seg',
    x1: -W / 2 + 0.2,
    y1: top - 0.85,
    x2: -W / 2 + 1.5,
    y2: top - 0.85,
    th: 0.035,
    w: 5,
  });
  sh.push({
    t: 'seg',
    x1: -W / 2 + 0.2,
    y1: top - 1.02,
    x2: -W / 2 + 1.1,
    y2: top - 1.02,
    th: 0.035,
    w: 4,
  });
  sh.push({
    t: 'seg',
    x1: -W / 2 + 0.2,
    y1: top - 1.22,
    x2: -W / 2 + 1.4,
    y2: top - 1.22,
    th: 0.01,
    w: 2,
  });
  sh.push({
    t: 'seg',
    x1: -W / 2 + 0.2,
    y1: top - 1.32,
    x2: -W / 2 + 1.2,
    y2: top - 1.32,
    th: 0.01,
    w: 2,
  });
  sh.push({ t: 'rect', x: -W / 2 + 0.42, y: top - 1.55, w2: 0.44, h2: 0.14, w: 3 });
  sh.push({ t: 'rect', x: W / 2 - 0.85, y: top - 1.05, w2: 1.2, h2: 0.8, w: 7 });
  sh.push({ t: 'fill', x: W / 2 - 0.85, y: top - 1.05, w2: 1.2, h2: 0.8, w: 3 });
  for (let c = 0; c < 3; c++)
    sh.push({ t: 'rect', x: -W / 2 + 0.55 + c * 1.05, y: -H / 2 + 0.22, w2: 0.9, h2: 0.26, w: 3 });
  return sampleShapes(n, sh, d, rng);
}

function dist(p: Vec3, q: Vec3): number {
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
}

function cloudBrain(n: number, rng: Rng): Float32Array {
  const surf = (u: number, v: number): Vec3 => {
    const cu = Math.cos(u);
    const su = Math.sin(u);
    const cv = Math.cos(v);
    const sv = Math.sin(v);
    const fold =
      1 + 0.045 * Math.sin(7 * u + 2 * v) * Math.cos(5 * v) + 0.03 * Math.sin(11 * v + 3 * u);
    const x = 1.25 * cu * cv * fold + 0.05;
    let y = 0.95 * sv * fold + 0.12;
    const z = 0.85 * su * cv * fold;
    if (y < -0.42) y = -0.42 + (y + 0.42) * 0.25;
    if (y > 0.5 && Math.abs(z) < 0.12) y -= 0.09 * (1 - Math.abs(z) / 0.12);
    return [x, y, z];
  };
  const pts: Vec3[] = [];
  for (let i = 0; i < 900; i++) {
    const u = rng() * 6.283;
    const v = Math.asin(rng() * 2 - 1);
    pts.push(surf(u, v));
  }
  for (let i = 0; i < 160; i++) {
    const u = rng() * 6.283;
    const v = Math.asin(rng() * 2 - 1);
    const cu = Math.cos(u);
    const su = Math.sin(u);
    const cv = Math.cos(v);
    const sv = Math.sin(v);
    pts.push([-0.78 + 0.46 * cu * cv, -0.58 + 0.3 * sv, 0.38 * su * cv]);
  }
  for (let i = 0; i < 40; i++)
    pts.push([-0.28 + rnd(rng, -0.1, 0.1), -0.62 - rng() * 0.42, rnd(rng, -0.1, 0.1)]);
  const nodes: Vec3[] = [];
  for (const p of pts) {
    if (nodes.length >= 120) break;
    if (nodes.every((q) => dist(p, q) > 0.24)) nodes.push(p);
  }
  const edges: Array<readonly [number, number]> = [];
  for (let k = 0; k < nodes.length; k++)
    for (let j = k + 1; j < nodes.length; j++)
      if (dist(nodes[k] as Vec3, nodes[j] as Vec3) < 0.46) edges.push([k, j]);
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    if (rng() < 0.32) {
      const nd = nodes[i % nodes.length] as Vec3;
      a[i * 3] = nd[0] + rnd(rng, -0.05, 0.05);
      a[i * 3 + 1] = nd[1] + rnd(rng, -0.05, 0.05);
      a[i * 3 + 2] = nd[2] + rnd(rng, -0.05, 0.05);
    } else {
      const e = edges[i % edges.length] as readonly [number, number];
      const t = rng();
      const A = nodes[e[0]] as Vec3;
      const B = nodes[e[1]] as Vec3;
      a[i * 3] = A[0] + (B[0] - A[0]) * t;
      a[i * 3 + 1] = A[1] + (B[1] - A[1]) * t;
      a[i * 3 + 2] = A[2] + (B[2] - A[2]) * t;
    }
  }
  return a;
}

/**
 * The chip cloud with its trace metadata. The prototype stashed the meta on the function (`cloudChipBrain.meta`);
 * here it is returned, so the module keeps no mutable state and is safe inside a worker.
 */
export function cloudChipBrain(n: number, rng: Rng): { positions: Float32Array; meta: ChipMeta } {
  const S = 2.5;
  const d = 0.12;
  const sh: Shape[] = [];
  const pinsPerSide = 9;
  sh.push({ t: 'rect', x: 0, y: 0, w2: S, h2: S, w: 16, side: true });
  sh.push({ t: 'rect', x: 0, y: 0, w2: S - 0.22, h2: S - 0.22, w: 6 });
  sh.push({ t: 'fill', x: 0, y: 0, w2: S, h2: S, w: 5, back: true });
  for (let i = 0; i < pinsPerSide; i++) {
    const o = -S / 2 + 0.25 + i * ((S - 0.5) / (pinsPerSide - 1));
    sh.push({ t: 'seg', x1: o, y1: S / 2, x2: o, y2: S / 2 + 0.22, th: 0.02, w: 1.2 });
    sh.push({ t: 'seg', x1: o, y1: -S / 2, x2: o, y2: -S / 2 - 0.22, th: 0.02, w: 1.2 });
    sh.push({ t: 'seg', x1: S / 2, y1: o, x2: S / 2 + 0.22, y2: o, th: 0.02, w: 1.2 });
    sh.push({ t: 'seg', x1: -S / 2, y1: o, x2: -S / 2 - 0.22, y2: o, th: 0.02, w: 1.2 });
  }
  const R = 0.78;
  for (let i = 0; i < 12; i++) {
    const ang = (i * Math.PI) / 6 + Math.PI / 12;
    const ex = Math.cos(ang) * R;
    const ey = Math.sin(ang) * R;
    const horiz = Math.abs(Math.cos(ang)) > Math.abs(Math.sin(ang));
    const tx = horiz ? Math.sign(Math.cos(ang)) * (S / 2 - 0.16) : ex * 1.6;
    const ty = horiz ? ey * 1.6 : Math.sign(Math.sin(ang)) * (S / 2 - 0.16);
    sh.push({ t: 'seg', x1: ex, y1: ey, x2: tx, y2: ty, th: 0.01, w: 1.6, trace: true });
    sh.push({ t: 'dot', x: tx, y: ty, r: 0.035, w: 0.5 });
  }
  const nChip = Math.floor(n * 0.42);
  const nBrain = n - nChip;
  const meta: ChipMeta = { kind: new Float32Array(n), param: new Float32Array(n) };
  const chip = sampleShapes(nChip, sh, d, rng, meta);
  const brain = cloudBrain(nBrain, rng);
  const a = new Float32Array(n * 3);
  a.set(chip, 0);
  for (let i = 0; i < nBrain; i++) {
    a[(nChip + i) * 3] = (brain[i * 3] as number) * 0.6;
    a[(nChip + i) * 3 + 1] = (brain[i * 3 + 1] as number) * 0.6 - 0.02;
    a[(nChip + i) * 3 + 2] = (brain[i * 3 + 2] as number) * 0.35 + d / 2 + 0.1;
  }
  return { positions: a, meta };
}

/** Public cloud generators: `(n, rng) => Float32Array` of length n*3. */
export const clouds = {
  phone: cloudPhone,
  web: cloudWeb,
  chip: (n: number, rng: Rng): Float32Array => cloudChipBrain(n, rng).positions,
} as const;

export type CloudName = keyof typeof clouds;
