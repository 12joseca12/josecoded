/* home v4 · GlyphScene guiada por el scroll.
   Una sola nube de partículas-glifo (caracteres reales de código) recorre la home: en el hero cicla móvil → web → chip IA;
   en cada bloque se desplaza a su lado y forma lo que el bloque ofrece. En "Dos vías" responde al puntero: Empresas → chip, Negocios → móvil.
   Derivado de ref/hero-lab-3 (aprobado, D16) con la paleta nueva: plata fría con núcleo violeta y verde solo al aterrizar. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const P = { hold: 3.5, morph: 1.6, directedMorph: 1.1, rot: 0.18, size: 16, green: 0, scatter: 0.6, breath: 0.025, wperiod: 4, wamp: 0.6, bloom: 0.22, bloomth: 0.72, focus: 6.2, mirror: 0.35 };
const N = innerWidth < 640 ? 5000 : 9000;
const PHONE = 0, WEB = 1, CHIP = 2;

/* ---------- atlas de glifos ---------- */
const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789{}[]()<>=;:.,/*+-_$#@!?&|\\\'"`~^%'.slice(0, 128);
function glyphAtlas() {
  const cols = 16, rows = 8, cell = 64;
  const c = document.createElement('canvas'); c.width = cols * cell; c.height = rows * cell;
  const x = c.getContext('2d');
  x.font = `500 ${cell * 0.72}px "Geist Mono", ui-monospace, monospace`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff';
  for (let i = 0; i < CHARS.length; i++) x.fillText(CHARS[i], (i % cols) * cell + cell / 2, Math.floor(i / cols) * cell + cell / 2 + 2);
  const t = new THREE.CanvasTexture(c); t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; return t;
}

/* ---------- nubes de destino (idénticas al prototipo aprobado) ---------- */
const rnd = (a, b) => a + Math.random() * (b - a);
function sampleShapes(n, shapes, depth, meta) {
  const a = new Float32Array(n * 3);
  const total = shapes.reduce((acc, sh) => acc + sh.w, 0);
  for (let i = 0; i < n; i++) {
    let r = Math.random() * total, sh = shapes[0];
    for (const c of shapes) { if (r < c.w) { sh = c; break; } r -= c.w; }
    let x = 0, y = 0, z = depth / 2 + 0.01;
    if (sh.t === 'seg') { const u = Math.random(); x = sh.x1 + (sh.x2 - sh.x1) * u + rnd(-sh.th, sh.th); y = sh.y1 + (sh.y2 - sh.y1) * u + rnd(-sh.th, sh.th); if (meta && sh.trace) { meta.kind[i] = 1; meta.param[i] = u; } }
    else if (sh.t === 'rect') { const per = 2 * (sh.w2 + sh.h2), u = Math.random() * per; const px = sh.x, py = sh.y, W = sh.w2, H = sh.h2;
      if (u < W) { x = px - W / 2 + u; y = py + H / 2; } else if (u < W + H) { x = px + W / 2; y = py + H / 2 - (u - W); } else if (u < 2 * W + H) { x = px + W / 2 - (u - W - H); y = py - H / 2; } else { x = px - W / 2; y = py - H / 2 + (u - 2 * W - H); }
      if (sh.side) z = rnd(-depth / 2, depth / 2); }
    else if (sh.t === 'fill') { x = sh.x + rnd(-sh.w2 / 2, sh.w2 / 2); y = sh.y + rnd(-sh.h2 / 2, sh.h2 / 2); if (sh.back) z = -depth / 2 - 0.01; }
    else if (sh.t === 'dot') { const ang = Math.random() * 6.283, rr = Math.sqrt(Math.random()) * sh.r; x = sh.x + Math.cos(ang) * rr; y = sh.y + Math.sin(ang) * rr; }
    a[i * 3] = x; a[i * 3 + 1] = y; a[i * 3 + 2] = z;
  }
  return a;
}
function cloudPhone(n) {
  const W = 1.3, H = 2.6, d = 0.14, sh = [];
  sh.push({ t: 'rect', x: 0, y: 0, w2: W, h2: H, w: 16, side: true });
  sh.push({ t: 'rect', x: 0, y: 0, w2: W - 0.12, h2: H - 0.12, w: 8 });
  sh.push({ t: 'fill', x: 0, y: 0, w2: W - 0.16, h2: H - 0.16, w: 10 });
  sh.push({ t: 'fill', x: 0, y: 0, w2: W, h2: H, w: 5, back: true });
  sh.push({ t: 'seg', x1: -0.16, y1: H / 2 - 0.13, x2: 0.16, y2: H / 2 - 0.13, th: 0.02, w: 5 });
  sh.push({ t: 'seg', x1: -W / 2 + 0.14, y1: H / 2 - 0.3, x2: -W / 2 + 0.38, y2: H / 2 - 0.3, th: 0.012, w: 2 });
  sh.push({ t: 'seg', x1: W / 2 - 0.36, y1: H / 2 - 0.3, x2: W / 2 - 0.14, y2: H / 2 - 0.3, th: 0.012, w: 2 });
  for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) sh.push({ t: 'dot', x: -W / 2 + 0.26 + c * 0.26, y: H / 2 - 0.62 - r * 0.3, r: 0.075, w: 1.3 });
  sh.push({ t: 'seg', x1: -W / 2 + 0.16, y1: -H / 2 + 0.36, x2: W / 2 - 0.16, y2: -H / 2 + 0.36, th: 0.01, w: 2 });
  for (let c = 0; c < 4; c++) sh.push({ t: 'dot', x: -W / 2 + 0.26 + c * 0.26, y: -H / 2 + 0.2, r: 0.08, w: 1.5 });
  sh.push({ t: 'seg', x1: -0.22, y1: -H / 2 + 0.06, x2: 0.22, y2: -H / 2 + 0.06, th: 0.008, w: 1.5 });
  return sampleShapes(n, sh, d);
}
function cloudWeb(n) {
  const W = 3.2, H = 2.1, d = 0.08, sh = [], top = H / 2;
  sh.push({ t: 'rect', x: 0, y: 0, w2: W, h2: H, w: 14, side: true });
  sh.push({ t: 'fill', x: 0, y: 0, w2: W, h2: H, w: 6, back: true });
  sh.push({ t: 'seg', x1: -W / 2, y1: top - 0.26, x2: W / 2, y2: top - 0.26, th: 0.008, w: 4 });
  for (let c = 0; c < 3; c++) sh.push({ t: 'dot', x: -W / 2 + 0.14 + c * 0.11, y: top - 0.13, r: 0.03, w: 1.2 });
  sh.push({ t: 'rect', x: 0.15, y: top - 0.13, w2: 1.6, h2: 0.12, w: 5 });
  sh.push({ t: 'seg', x1: -W / 2 + 0.2, y1: top - 0.5, x2: -W / 2 + 0.6, y2: top - 0.5, th: 0.012, w: 2 });
  for (let c = 0; c < 4; c++) sh.push({ t: 'seg', x1: W / 2 - 1.5 + c * 0.34, y1: top - 0.5, x2: W / 2 - 1.3 + c * 0.34, y2: top - 0.5, th: 0.01, w: 1 });
  sh.push({ t: 'seg', x1: -W / 2 + 0.2, y1: top - 0.85, x2: -W / 2 + 1.5, y2: top - 0.85, th: 0.035, w: 5 });
  sh.push({ t: 'seg', x1: -W / 2 + 0.2, y1: top - 1.02, x2: -W / 2 + 1.1, y2: top - 1.02, th: 0.035, w: 4 });
  sh.push({ t: 'seg', x1: -W / 2 + 0.2, y1: top - 1.22, x2: -W / 2 + 1.4, y2: top - 1.22, th: 0.01, w: 2 });
  sh.push({ t: 'seg', x1: -W / 2 + 0.2, y1: top - 1.32, x2: -W / 2 + 1.2, y2: top - 1.32, th: 0.01, w: 2 });
  sh.push({ t: 'rect', x: -W / 2 + 0.42, y: top - 1.55, w2: 0.44, h2: 0.14, w: 3 });
  sh.push({ t: 'rect', x: W / 2 - 0.85, y: top - 1.05, w2: 1.2, h2: 0.8, w: 7 });
  sh.push({ t: 'fill', x: W / 2 - 0.85, y: top - 1.05, w2: 1.2, h2: 0.8, w: 3 });
  for (let c = 0; c < 3; c++) sh.push({ t: 'rect', x: -W / 2 + 0.55 + c * 1.05, y: -H / 2 + 0.22, w2: 0.9, h2: 0.26, w: 3 });
  return sampleShapes(n, sh, d);
}
function cloudBrain(n) {
  const surf = (u, v) => {
    const cu = Math.cos(u), su = Math.sin(u), cv = Math.cos(v), sv = Math.sin(v);
    const fold = 1 + 0.045 * Math.sin(7 * u + 2 * v) * Math.cos(5 * v) + 0.03 * Math.sin(11 * v + 3 * u);
    let x = 1.25 * cu * cv * fold + 0.05, y = 0.95 * sv * fold + 0.12, z = 0.85 * su * cv * fold;
    if (y < -0.42) y = -0.42 + (y + 0.42) * 0.25;
    if (y > 0.5 && Math.abs(z) < 0.12) y -= 0.09 * (1 - Math.abs(z) / 0.12);
    return [x, y, z];
  };
  const pts = [];
  for (let i = 0; i < 900; i++) { const u = Math.random() * 6.283, v = Math.asin(Math.random() * 2 - 1); pts.push(surf(u, v)); }
  for (let i = 0; i < 160; i++) { const u = Math.random() * 6.283, v = Math.asin(Math.random() * 2 - 1); const cu = Math.cos(u), su = Math.sin(u), cv = Math.cos(v), sv = Math.sin(v); pts.push([-0.78 + 0.46 * cu * cv, -0.58 + 0.3 * sv, 0.38 * su * cv]); }
  for (let i = 0; i < 40; i++) pts.push([-0.28 + rnd(-0.1, 0.1), -0.62 - Math.random() * 0.42, rnd(-0.1, 0.1)]);
  const nodes = [];
  for (const p of pts) { if (nodes.length >= 120) break; if (nodes.every((q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) > 0.24)) nodes.push(p); }
  const edges = [];
  for (let k = 0; k < nodes.length; k++) for (let j = k + 1; j < nodes.length; j++) { const d = Math.hypot(nodes[k][0] - nodes[j][0], nodes[k][1] - nodes[j][1], nodes[k][2] - nodes[j][2]); if (d < 0.46) edges.push([k, j]); }
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    if (Math.random() < 0.32) { const nd = nodes[i % nodes.length]; a[i * 3] = nd[0] + rnd(-.05, .05); a[i * 3 + 1] = nd[1] + rnd(-.05, .05); a[i * 3 + 2] = nd[2] + rnd(-.05, .05); }
    else { const e = edges[i % edges.length], t = Math.random(); const A = nodes[e[0]], B = nodes[e[1]]; a[i * 3] = A[0] + (B[0] - A[0]) * t; a[i * 3 + 1] = A[1] + (B[1] - A[1]) * t; a[i * 3 + 2] = A[2] + (B[2] - A[2]) * t; }
  }
  return a;
}
function cloudChipBrain(n) {
  const S = 2.5, d = 0.12, sh = [], pinsPerSide = 9;
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
  for (let i = 0; i < 12; i++) { const ang = i * Math.PI / 6 + Math.PI / 12; const ex = Math.cos(ang) * R, ey = Math.sin(ang) * R;
    const horiz = Math.abs(Math.cos(ang)) > Math.abs(Math.sin(ang));
    const tx = horiz ? Math.sign(Math.cos(ang)) * (S / 2 - 0.16) : ex * 1.6, ty = horiz ? ey * 1.6 : Math.sign(Math.sin(ang)) * (S / 2 - 0.16);
    sh.push({ t: 'seg', x1: ex, y1: ey, x2: tx, y2: ty, th: 0.01, w: 1.6, trace: true }); sh.push({ t: 'dot', x: tx, y: ty, r: 0.035, w: 0.5 }); }
  const nChip = Math.floor(n * 0.42), nBrain = n - nChip;
  const meta = { kind: new Float32Array(n), param: new Float32Array(n) };
  const chip = sampleShapes(nChip, sh, d, meta), brain = cloudBrain(nBrain);
  cloudChipBrain.meta = meta;
  const a = new Float32Array(n * 3);
  a.set(chip, 0);
  for (let i = 0; i < nBrain; i++) { a[(nChip + i) * 3] = brain[i * 3] * 0.6; a[(nChip + i) * 3 + 1] = brain[i * 3 + 1] * 0.6 - 0.02; a[(nChip + i) * 3 + 2] = brain[i * 3 + 2] * 0.35 + d / 2 + 0.1; }
  return a;
}

/* ---------- escena ---------- */
const canvas = document.getElementById('scene');
const stage = document.getElementById('stage');
const cycleBars = [...document.querySelectorAll('.cycle li')];

if (!reduce) boot();

function boot() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setClearColor(new THREE.Color().setRGB(7 / 255, 6 / 255, 15 / 255, THREE.LinearSRGBColorSpace), 1);   // salida lineal sin conversión: el fondo queda en #07060F exacto
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  const composer = new EffectComposer(renderer);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50); camera.position.set(0, 0, 6.2);
  const group = new THREE.Group(); scene.add(group);
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), P.bloom, 0.3, P.bloomth);
  composer.addPass(new RenderPass(scene, camera)); composer.addPass(bloom);

  const geo = new THREE.BufferGeometry();
  const t0 = cloudPhone(N), t1 = cloudWeb(N), t2 = cloudChipBrain(N);
  geo.setAttribute('position', new THREE.BufferAttribute(t0.slice(), 3));
  geo.setAttribute('aT0', new THREE.BufferAttribute(t0, 3)); geo.setAttribute('aT1', new THREE.BufferAttribute(t1, 3)); geo.setAttribute('aT2', new THREE.BufferAttribute(t2, 3));
  const seed = new Float32Array(N), glyph = new Float32Array(N), col = new Float32Array(N);
  for (let i = 0; i < N; i++) { seed[i] = Math.random(); glyph[i] = Math.floor(Math.random() * CHARS.length); col[i] = Math.random(); }
  geo.setAttribute('aKind', new THREE.BufferAttribute(cloudChipBrain.meta.kind, 1)); geo.setAttribute('aParam', new THREE.BufferAttribute(cloudChipBrain.meta.param, 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1)); geo.setAttribute('aGlyph', new THREE.BufferAttribute(glyph, 1)); geo.setAttribute('aCol', new THREE.BufferAttribute(col, 1));

  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uProg: { value: 0 }, uFrom: { value: 0 }, uTo: { value: 1 }, uIntroT: { value: 100 }, uWave: { value: 0 }, uWavePeriod: { value: P.wperiod }, uWaveAmp: { value: P.wamp }, uBreath: { value: P.breath }, uMirror: { value: 0 }, uFocus: { value: P.focus }, uSize: { value: P.size }, uBright: { value: 1 }, uGreen: { value: P.green / 100 }, uScatter: { value: P.scatter }, uAtlas: { value: glyphAtlas() }, uDpr: { value: renderer.getPixelRatio() } },
    vertexShader: `
      attribute vec3 aT0, aT1, aT2; attribute float aSeed, aGlyph, aCol, aKind, aParam;
      uniform float uTime, uProg, uFrom, uTo, uSize, uScatter, uDpr, uIntroT, uWave, uWavePeriod, uWaveAmp, uBreath, uMirror, uFocus;
      varying float vGlyph, vCol, vSeed, vFade, vAlpha, vSoft, vLand;
      float ease(float t){ return t*t*(3.0-2.0*t); }
      void main(){
        float f = uProg;   // 0..1 entre el estado de origen y el de destino (directo, sin pasar por el intermedio)
        int si = int(uFrom + 0.5); int sj = int(uTo + 0.5);
        vec3 A = si==0?aT0:si==1?aT1:aT2;
        vec3 B = sj==0?aT0:sj==1?aT1:aT2;
        float t = clamp((f - aSeed * 0.25) / 0.75, 0.0, 1.0); t = ease(t);
        vec3 p = mix(A, B, t);
        float mid = sin(t * 3.14159);
        vec3 n = vec3(fract(aSeed*13.7)-.5, fract(aSeed*29.3)-.5, fract(aSeed*41.9)-.5) * 2.0;
        p += n * mid * uScatter * (0.4 + 0.6 * fract(aSeed * 3.3));
        p *= 1.0 + uBreath * sin(uTime * 1.25 + aSeed * 0.3);
        float wAlpha = 1.0;
        if (uWave > 0.5) {
          float wi = floor(aSeed * 3.0);
          float ph = fract(uTime / uWavePeriod + wi / 3.0);
          p *= 1.0 + uWaveAmp * ph * ph;
          wAlpha = pow(1.0 - ph, 1.6) * smoothstep(0.0, 0.08, ph) * 0.5 * smoothstep(1.3, 2.3, uIntroT);
        }
        float startY = 2.8 + fract(aSeed * 9.1) * 2.6;
        float landT = 0.4 + fract(aSeed * 7.13) * 0.8;
        float speedI = (startY - p.y) / landT;
        float yR = startY - uIntroT * speedI;
        float landed = smoothstep(0.0, 0.5, p.y - yR);
        vec3 dropP = vec3(p.x + (fract(aSeed * 17.7) - 0.5) * 0.05, yR, p.z);
        float head = (1.0 - landed) * 1.1 + exp(-abs(p.y - yR) * 6.0) * 1.6;
        vLand = exp(-abs(p.y - yR) * 6.0) * step(uIntroT, 3.0);
        p = mix(dropP, p, landed);
        float chipW = (si == 2 ? 1.0 - t : 0.0) + (sj == 2 ? t : 0.0);
        float tracePulse = aKind > 0.5 ? exp(-abs(fract(uTime / 1.25 + aSeed * 0.15) - aParam) * 9.0) * 1.8 * chipW : 0.0;
        float refl = 1.0;
        if (uMirror > 0.5) { p.y = -2.9 - p.y; refl = smoothstep(-4.4, -1.6, p.y) * 0.3; }
        vAlpha = wAlpha * refl;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vSoft = clamp((abs(-mv.z - uFocus) - 0.6) / 3.0, 0.0, 1.0);
        gl_Position = projectionMatrix * mv;
        float depth = -mv.z;
        gl_PointSize = uSize * uDpr * (5.0 / depth) * (0.75 + 0.5 * fract(aSeed * 5.1)) * (1.0 + vSoft * 0.9);
        vGlyph = aGlyph; vCol = aCol; vSeed = aSeed;
        float dA = (si == 2) ? 0.62 : 0.45;
        float dB = (sj == 2) ? 0.62 : 0.45;
        float dens = mix(dA, dB, t);
        vFade = (0.30 + 0.20 * (sin(uTime * (1.0 + aSeed) + aSeed * 30.0) * 0.5 + 0.5) + head * 1.4 + mid * 0.5 + tracePulse) * dens;
      }`,
    fragmentShader: `
      uniform sampler2D uAtlas; uniform float uBright, uGreen, uTime;
      varying float vGlyph, vCol, vSeed, vFade, vAlpha, vSoft, vLand;
      void main(){
        float g = mod(vGlyph + floor(uTime * (0.4 + vSeed * 0.8) + vSeed * 9.0), 128.0);
        vec2 cell = vec2(mod(g, 16.0), floor(g / 16.0));
        vec2 uv = vec2((cell.x + gl_PointCoord.x) / 16.0, 1.0 - (cell.y + gl_PointCoord.y) / 8.0);
        float a = texture2D(uAtlas, uv).r;
        a = mix(a, a * 0.55 + 0.1 * smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)), vSoft);
        if (a < 0.12) discard;
        // lavanda con núcleo violeta; verde solo al aterrizar en la intro y en un 7 % de glifos
        vec3 lav = vec3(0.80, 0.76, 1.0); vec3 violet = vec3(0.45, 0.38, 1.0); vec3 green = vec3(0.24, 0.86, 0.52);
        vec3 c = mix(lav, violet, smoothstep(0.2, 0.9, vCol));
        if (vCol < uGreen) c = green;
        c = mix(c, green, clamp(vLand * 1.5, 0.0, 1.0));
        gl_FragColor = vec4(c * vFade * uBright * vAlpha * (1.0 - vSoft * 0.3), a * 0.9 * vAlpha * (1.0 - vSoft * 0.3));
      }`,
  });
  const points = new THREE.Points(geo, mat); group.add(points);
  const waveMat = mat.clone(); waveMat.uniforms = THREE.UniformsUtils.clone(mat.uniforms); waveMat.uniforms.uAtlas.value = mat.uniforms.uAtlas.value; waveMat.uniforms.uWave.value = 1;
  const waveGeo = geo.clone(); waveGeo.setDrawRange(0, Math.floor(N * 0.28));
  group.add(new THREE.Points(waveGeo, waveMat));
  const mirrorMat = mat.clone(); mirrorMat.uniforms = THREE.UniformsUtils.clone(mat.uniforms); mirrorMat.uniforms.uAtlas.value = mat.uniforms.uAtlas.value; mirrorMat.uniforms.uMirror.value = 1;
  group.add(new THREE.Points(geo, mirrorMat));
  const mats = [mat, waveMat, mirrorMat];

  /* ---------- la web se compila: chorros de glifos que salen de la nube y dibujan el borde de cada componente ---------- */
  const SM = 9000;   // reserva circular de partículas de chorro
  const sGeo = new THREE.BufferGeometry();
  const aStart = new Float32Array(SM * 3), aTarget = new Float32Array(SM * 2), aTime = new Float32Array(SM * 2), aSSeed = new Float32Array(SM), aSGlyph = new Float32Array(SM);
  for (let i = 0; i < SM; i++) { aTime[i * 2] = -100; aTime[i * 2 + 1] = 1; aSSeed[i] = Math.random(); aSGlyph[i] = Math.floor(Math.random() * CHARS.length); }
  sGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SM * 3), 3));
  sGeo.setAttribute('aStart', new THREE.BufferAttribute(aStart, 3)); sGeo.setAttribute('aTarget', new THREE.BufferAttribute(aTarget, 2));
  sGeo.setAttribute('aTime', new THREE.BufferAttribute(aTime, 2)); sGeo.setAttribute('aSeed', new THREE.BufferAttribute(aSSeed, 1)); sGeo.setAttribute('aGlyph', new THREE.BufferAttribute(aSGlyph, 1));
  const sMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uScroll: { value: 0 }, uVp: { value: new THREE.Vector2(1, 1) }, uWorld: { value: new THREE.Vector2(1, 1) }, uAtlas: mat.uniforms.uAtlas, uDpr: { value: renderer.getPixelRatio() } },
    vertexShader: `
      attribute vec3 aStart; attribute vec2 aTarget; attribute vec2 aTime; attribute float aSeed, aGlyph;
      uniform float uTime, uScroll, uDpr; uniform vec2 uVp, uWorld;
      varying float vA, vGlyph, vSeed, vLand;
      void main(){
        float t = clamp((uTime - aTime.x) / aTime.y, 0.0, 1.0);
        float e = 1.0 - pow(1.0 - t, 3.0);                                   // ease-out: sale rápido, frena al llegar
        vec3 T = vec3((aTarget.x / uVp.x - 0.5) * uWorld.x, (0.5 - (aTarget.y - uScroll) / uVp.y) * uWorld.y, 0.0);
        vec3 d = T - aStart; vec3 side = normalize(vec3(-d.y, d.x, 0.0) + 1e-4);
        vec3 p = mix(aStart, T, e) + side * sin(t * 3.14159) * (fract(aSeed * 7.3) - 0.5) * 0.9;   // arco por partícula
        float after = uTime - aTime.x - aTime.y;                              // tiempo desde el aterrizaje
        vLand = exp(-max(after, 0.0) * 14.0) * step(0.0, after);
        vA = step(0.0, uTime - aTime.x) * (t < 1.0 ? 0.35 + 0.65 * t : clamp(1.0 - after / 0.45, 0.0, 1.0));
        vGlyph = aGlyph; vSeed = aSeed;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (9.0 + 5.0 * fract(aSeed * 5.1)) * uDpr * (1.0 + vLand * 0.6);
      }`,
    fragmentShader: `
      uniform sampler2D uAtlas; uniform float uTime;
      varying float vA, vGlyph, vSeed, vLand;
      void main(){
        if (vA <= 0.001) discard;
        float g = mod(vGlyph + floor(uTime * (6.0 + vSeed * 8.0)), 128.0);   // el glifo muta rápido mientras vuela
        vec2 cell = vec2(mod(g, 16.0), floor(g / 16.0));
        vec2 uv = vec2((cell.x + gl_PointCoord.x) / 16.0, 1.0 - (cell.y + gl_PointCoord.y) / 8.0);
        float a = texture2D(uAtlas, uv).r; if (a < 0.15) discard;
        vec3 c = mix(vec3(0.78, 0.74, 1.0), vec3(0.24, 0.86, 0.52), clamp(vLand * 1.4, 0.0, 1.0));
        gl_FragColor = vec4(c * (0.9 + vLand), a * vA);
      }`,
  });
  const streams = new THREE.Points(sGeo, sMat); streams.frustumCulled = false; scene.add(streams);
  let sHead = 0;
  function perimeterPoints(r, n) {   // puntos repartidos por el contorno del rectángulo, en coordenadas de página
    const per = 2 * (r.width + r.height), out = [];
    for (let i = 0; i < n; i++) {
      let u = (i / n + Math.random() * 0.002) * per, x, y;
      if (u < r.width) { x = r.left + u; y = r.top; } else if ((u -= r.width) < r.height) { x = r.right; y = r.top + u; }
      else if ((u -= r.height) < r.width) { x = r.right - u; y = r.bottom; } else { u -= r.width; x = r.left; y = r.bottom - u; }
      out.push(x, y + scrollY);
    }
    return out;
  }
  window.compileBurst = (el) => {
    const r = el.getBoundingClientRect();
    const n = Math.min(2200, Math.round(2 * (r.width + r.height) / 1.1));
    const pts = perimeterPoints(r, n), now = performance.now() / 1000;
    const ox = group.position.x, oy = group.position.y, sc = group.scale.x;
    let latest = 0;
    for (let k = 0; k < n; k++) {
      const i = sHead; sHead = (sHead + 1) % SM;
      const a = Math.random() * 6.283, rr = Math.sqrt(Math.random()) * 1.3 * sc;
      aStart[i * 3] = ox + Math.cos(a) * rr; aStart[i * 3 + 1] = oy + Math.sin(a) * rr * 1.4; aStart[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
      aTarget[i * 2] = pts[k * 2]; aTarget[i * 2 + 1] = pts[k * 2 + 1];
      // el borde se dibuja en orden: los primeros puntos del contorno salen antes (se traza como una línea de código)
      const delay = (k / n) * 0.32 + Math.random() * 0.06, dur = 0.6 + Math.random() * 0.25;
      aTime[i * 2] = now + delay; aTime[i * 2 + 1] = dur; latest = Math.max(latest, delay + dur);
    }
    for (const name of ['aStart', 'aTarget', 'aTime']) sGeo.attributes[name].needsUpdate = true;
    return latest;   // segundos hasta que aterriza el último glifo
  };

  /* ---------- director de scroll: qué bloque manda ---------- */
  const sections = [...document.querySelectorAll('[data-scene]')];
  let active = sections[0];
  let doorTarget = null;
  document.querySelectorAll('.door').forEach((d) => {
    const on = () => { doorTarget = d.dataset.door === 'chip' ? CHIP : PHONE; };
    const off = () => { doorTarget = null; };
    d.addEventListener('pointerenter', on); d.addEventListener('pointerleave', off);
    d.addEventListener('focusin', on); d.addEventListener('focusout', off);
  });
  function pickActive() {
    const mid = innerHeight * 0.5;
    for (const s of sections) { const r = s.getBoundingClientRect(); if (r.top <= mid && r.bottom >= mid) { active = s; return; } }
  }
  addEventListener('scroll', pickActive, { passive: true });

  /* ---------- geometría de pantalla → mundo ---------- */
  const doorEl = document.querySelector('.door');
  let vw = 1, vh = 1, heroX = 0, heroY = 0, heroScale = 1, sideScale = 0.8, doorsScale = 0.6;
  const narrow = () => innerWidth < 900;
  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false); composer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
    vh = 2 * camera.position.z * Math.tan(camera.fov * Math.PI / 360); vw = vh * camera.aspect;
    const r = stage.getBoundingClientRect(); const top = r.top + scrollY;   // posición de la columna con la página arriba del todo
    heroX = ((r.left + r.width / 2) / w - 0.5) * vw; heroY = (0.5 - (top + r.height / 2) / h) * vh;
    heroScale = Math.min(1.35, (r.height / h) * vh / 3.4, (r.width / w) * vw / 3.4);
    sideScale = Math.min(1, 0.62 * vh / 4.4, 0.36 * vw / 3.6);
    const doors = document.querySelectorAll('.door');
    if (doors.length === 2) { const a = doors[0].getBoundingClientRect(), b = doors[1].getBoundingClientRect(); const gap = b.left - a.right; doorsScale = Math.max(0.3, Math.min(sideScale, (gap * 0.9 / w) * vw / 3.2)); }
  }
  resize(); addEventListener('resize', resize, { passive: true });

  function targetFor(s) {
    const kind = s.dataset.scene, side = s.dataset.side;
    if (kind === 'off') return { x: heroX, y: heroY + vh * 0.35, scale: heroScale * 0.9, bright: 0, mirror: 0, state: null };   // la nube vive solo en el hero
    if (kind === 'cycle') return { x: heroX, y: heroY, scale: heroScale, bright: narrow() ? 0.55 : 1, mirror: narrow() ? 0 : 1, state: null };
    if (narrow()) return { x: 0, y: 0.2 * vh, scale: sideScale * 0.9, bright: 0, mirror: 0, state: null };   // en móvil la escena vive solo en el hero: nunca bajo texto ni botones
    const x = side === 'left' ? -vw * 0.27 : side === 'right' ? vw * 0.27 : 0;
    if (kind === 'doors') {   // anclada al hueco real entre las dos puertas, no al centro de pantalla
      const r = doorEl.getBoundingClientRect(), cy = (r.top + r.bottom) / 2;
      return { x: 0, y: (0.5 - cy / innerHeight) * vh, scale: doorsScale, bright: 0.8, mirror: 0, state: doorTarget ?? WEB };
    }
    if (kind === 'dim') return { x: vw * 0.3, y: 0, scale: sideScale, bright: 0.05, mirror: 0, state: null };
    return { x, y: 0, scale: sideScale, bright: 0.9, mirror: 0, state: kind === 'phone' ? PHONE : WEB };
  }

  /* ---------- estado del morph ---------- */
  let state = PHONE, next = WEB, phase = 'hold', pt = 0, morphDur = P.morph;
  function advance(dt, directed) {
    if (intro.t < 1.5) { pt = 0; return; }
    pt += dt;
    let f = 0;
    if (phase === 'hold') {
      const wants = directed === null ? pt >= P.hold : directed !== state;
      if (wants) { next = directed === null ? (state + 1) % 3 : directed; phase = 'morph'; pt = 0; morphDur = directed === null ? P.morph : P.directedMorph; }
    } else {
      f = Math.min(1, pt / morphDur);
      if (f >= 1) { state = next; phase = 'hold'; pt = 0; f = 0; }
    }
    mat.uniforms.uFrom.value = state; mat.uniforms.uTo.value = next; mat.uniforms.uProg.value = f;
    // indicador sin palabras: el tramo del ciclo en curso se llena
    const cur = phase === 'hold' ? state : (f > 0.5 ? next : state);
    const fill = directed === null && phase === 'hold' ? Math.min(1, pt / P.hold) : 1;
    cycleBars.forEach((b, i) => b.style.setProperty('--p', i === cur ? fill.toFixed(3) : i < cur ? '1' : '0'));
  }

  /* ---------- arrastre y paralaje (solo en el hero) ---------- */
  let dragging = false, lastX = 0, lastY = 0, velX = 0, velY = 0, rotY = 0, rotX = 0, tiltX = 0, tiltY = 0;
  stage.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') return; dragging = true; lastX = e.clientX; lastY = e.clientY; stage.setPointerCapture(e.pointerId); });
  stage.addEventListener('pointermove', (e) => { if (!dragging) return; velX = (e.clientX - lastX) * 0.006; velY = (e.clientY - lastY) * 0.004; rotY += velX; rotX += velY; lastX = e.clientX; lastY = e.clientY; });
  const endDrag = () => { dragging = false; }; stage.addEventListener('pointerup', endDrag); stage.addEventListener('pointercancel', endDrag);
  addEventListener('pointermove', (e) => { tiltX = e.clientX / innerWidth - 0.5; tiltY = e.clientY / innerHeight - 0.5; }, { passive: true });

  /* ---------- bucle (pausa con la pestaña oculta) ---------- */
  const cur = { x: heroX, y: heroY, scale: heroScale, bright: narrow() ? 0.55 : 1, mirror: 1 };
  const field = document.getElementById('field'); let fx = 0, fy = 0;
  let last = performance.now(), running = true;
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) { last = performance.now(); requestAnimationFrame(frame); } });
  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const T = targetFor(active);
    advance(dt, T.state);
    tickChars(dt);
    const k = 1 - Math.exp(-dt * 3.2);   // seguimiento suave y amortiguado, interrumpible
    for (const key of ['x', 'y', 'scale', 'mirror']) cur[key] += (T[key] - cur[key]) * k;
    cur.bright += (T.bright - cur.bright) * (T.bright < cur.bright ? Math.min(1, k * 3) : k);   // se apaga rápido al salir del hero, se enciende suave al volver
    if (!dragging) {
      velX *= 0.92; velY *= 0.92;
      const facing = state === CHIP && phase === 'hold';
      if (facing || T.state !== null) {   // chip y estados dirigidos: de cara a la cámara con vaivén
        const base = Math.round(rotY / (2 * Math.PI)) * 2 * Math.PI, target = base + Math.sin(now / 1000 * 0.45) * 0.34;
        rotY += (target - rotY) * 0.035 + velX; rotX += (0 - rotX) * 0.05 + velY;
      } else { rotY += velX + P.rot * dt; rotX += velY; rotX *= 0.98; }
    }
    group.rotation.y = rotY + tiltX * 0.22; group.rotation.x = rotX + tiltY * 0.14;
    const ik = intro.k;
    group.position.set(cur.x * ik, cur.y * ik, 0); group.scale.setScalar(1 + (cur.scale - 1) * ik);
    for (const m of mats) { m.uniforms.uTime.value = now / 1000; m.uniforms.uProg.value = mat.uniforms.uProg.value; m.uniforms.uFrom.value = mat.uniforms.uFrom.value; m.uniforms.uTo.value = mat.uniforms.uTo.value; m.uniforms.uIntroT.value = intro.t; m.uniforms.uBright.value = cur.bright; }
    mirrorMat.uniforms.uBright.value = cur.bright * P.mirror * cur.mirror;
    waveMat.uniforms.uSize.value = P.size * 0.7;
    bloom.strength = P.bloom * cur.bright;
    // el campo de luz sigue al objeto por la página y un poco al cursor (solo transform en su propia capa)
    const sx = (cur.x * ik) / vw, sy = (cur.y * ik) / vh;   // -0.5..0.5 de pantalla
    fx += ((sx + tiltX * 0.06) * innerWidth - fx) * k; fy += ((-sy + tiltY * 0.05) * innerHeight - fy) * k;
    field.style.transform = `translate3d(${fx.toFixed(1)}px, ${fy.toFixed(1)}px, 0) rotate(${(tiltX * 4).toFixed(2)}deg)`;
    sMat.uniforms.uTime.value = now / 1000; sMat.uniforms.uScroll.value = scrollY;
    sMat.uniforms.uVp.value.set(innerWidth, innerHeight); sMat.uniforms.uWorld.value.set(vw, vh);
    composer.render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  requestAnimationFrame(() => canvas.classList.add('is-on'));
  if (!narrow()) window.dispatchEvent(new Event('scene:ready'));
  pickActive();
}

/* ---------- intro de primera visita por sesión: las letras del primer viewport caen y aterrizan (D16) ---------- */
const intro = { k: 1, t: 100 };
const GL = '{}[]()<>=;:/*+-_$#@!?&|0123456789abcdefghijklmnopqrstuvwxyz';
const rg = () => GL[Math.floor(Math.random() * GL.length)];
function splitChars(el) {
  const out = [];
  const walk = (n) => {
    for (const c of [...n.childNodes]) {
      if (c.nodeType === 3 && c.textContent.trim()) {
        const flex = /flex|grid/.test(getComputedStyle(c.parentElement).display);
        const frag = flex ? document.createElement('span') : document.createDocumentFragment();
        for (const word of c.textContent.split(/(\s+)/)) {
          if (!word) continue;
          if (/^\s+$/.test(word)) { frag.appendChild(document.createTextNode(' ')); continue; }
          const w = document.createElement('span'); w.className = 'w'; w.style.cssText = 'display:inline-block;white-space:nowrap';
          for (const ch of word) { const sp = document.createElement('span'); sp.style.display = 'inline-block'; sp.textContent = ch; sp.dataset.ch = ch; sp.setAttribute('aria-hidden', 'true'); w.appendChild(sp); out.push(sp); }
          frag.appendChild(w);
        }
        c.replaceWith(frag);
      } else if (c.nodeType === 1 && !c.matches('svg')) walk(c);
    }
  };
  walk(el); return out;
}
let drops = null;
function prepareChars() {
  const els = ['.hero__title', '.hero__sub', '.hero__ctas'].map((q) => document.querySelector(q));
  els.forEach((el) => { if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim()); });
  const vh = innerHeight;
  drops = els.flatMap(splitChars).map((el) => { const start = -(0.35 + Math.random() * 0.75) * vh, landT = 0.4 + Math.random() * 0.8; return { el, start, speed: -start / landT, y: start, landed: false, flash: 0 }; });
  for (const d of drops) { d.el.style.transform = `translateY(${d.start}px)`; d.el.style.color = 'var(--violet-soft)'; d.el.textContent = rg(); }
}
function finishChars() { if (!drops) return; for (const d of drops) { d.el.style.transform = ''; d.el.style.color = ''; d.el.textContent = d.el.dataset.ch; } drops = null; intro.t = 100; }
function tickChars(dt) {
  if (!drops) return;
  let pending = 0;
  for (const d of drops) {
    if (d.landed) { if (d.flash > 0) { d.flash -= dt; if (d.flash <= 0) { d.el.style.color = ''; d.el.textContent = d.el.dataset.ch; } } continue; }
    pending++;
    d.y += d.speed * dt;
    if (d.y >= 0) { d.landed = true; d.flash = 0.14 + Math.random() * 0.16; d.el.style.transform = ''; d.el.style.color = 'var(--green)'; d.el.textContent = rg(); }
    else { d.el.style.transform = `translateY(${d.y}px)`; if (Math.random() < 0.3) d.el.textContent = rg(); }
  }
  if (!pending && drops.every((d) => d.flash <= 0)) drops = null;
}
function playIntro() {
  prepareChars();
  intro.t = 0; const t0 = performance.now();
  const tick = (now) => { if (intro.t === 100) return; intro.t = (now - t0) / 1000; if (intro.t < 3) requestAnimationFrame(tick); else intro.t = 100; };
  requestAnimationFrame(tick);
  // cualquier tecla, clic, toque o scroll la termina al momento
  const stop = () => { finishChars(); ['keydown', 'pointerdown', 'wheel', 'touchstart'].forEach((ev) => removeEventListener(ev, stop)); };
  ['keydown', 'pointerdown', 'wheel', 'touchstart'].forEach((ev) => addEventListener(ev, stop, { passive: true }));
}
let seen = false; try { seen = !!sessionStorage.getItem('intro_seen'); } catch {}
if (location.search.includes('nointro')) seen = true;
if ((!seen || /[?&]intro/.test(location.search)) && !reduce) { playIntro(); try { sessionStorage.setItem('intro_seen', '1'); } catch {} }
