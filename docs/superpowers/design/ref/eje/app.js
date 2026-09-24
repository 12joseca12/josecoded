/* eje · una sola escena WebGL para toda la home.
   Hereda de hero-lab-3: atlas de glifos reales, morado #a78bfa + verde #34d399 sobre #05060f,
   bloom suave sin OutputPass, intro de caída de caracteres, panel con «c».
   Nuevo: el objeto del hero se deshace en glifos y se recompone en un eje vertical de 6 nodos
   que rota y recorre la página; dos variantes de geometría (A hélice de ADN, B columna de anillos)
   intercambiables en caliente. Todo función continua del scroll y por tanto reversible. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/* ?reduce=1 fuerza el modo de movimiento reducido para poder revisarlo sin tocar el sistema */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]reduce=1/.test(location.search);
const isMobile = matchMedia('(max-width: 56.25rem)').matches;

/* degradación en móvil: menos partículas, menos pixel ratio, glifo más pequeño,
   bloom más flojo y amplitud lateral casi nula (el eje se queda centrado) */
const N = isMobile ? 3600 : 9000;
const LAT_SCALE = isMobile ? 0.28 : 1;

const P = { rot: 1, dens: 1, sep: 3, lat: 1, bright: 1, size: isMobile ? 12 : 15, bloom: isMobile ? 0.22 : 0.32 };

/* ---------- datos de los nodos (contenido real de la home) ---------- */
const NODES = [
  { id: 'sec-0', name: 'Presentación', fact: 'Full-stack freelance. Cinco datos verificables.' },
  { id: 'sec-1', name: 'Qué hago', fact: 'Apps móviles, webs y sistemas con IA.' },
  { id: 'sec-2', name: 'Habilidades y stack', fact: 'Next.js, React Native, Supabase, Workers.' },
  { id: 'sec-3', name: 'Proyectos', fact: 'Con enlace a stores, web o código.' },
  { id: 'sec-4', name: 'Para empresas / tu negocio', fact: '40 €/h o feature cerrada · webs desde 900 €.' },
  { id: 'sec-5', name: 'Contacto', fact: 'Respondo en menos de 24 h laborables.' },
];
const NN = NODES.length;
/* desplazamiento lateral del eje: centro → izquierda → derecha → centro */
const NODE_X = [0, -1, -1, 1, 1, 0];
/* en los nodos centrados el eje sube para dejar el contenido debajo, no encima */
const NODE_Y = [1.15, 0, 0, 0, 0, 1.15];

/* ---------- atlas de glifos (idéntico a hero-lab-3) ---------- */
const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789{}[]()<>=;:.,/*+-_$#@!?&|\\\'"`~^%'.slice(0, 128);
function glyphAtlas() {
  const cols = 16, rows = 8, cell = 64;
  const c = document.createElement('canvas'); c.width = cols * cell; c.height = rows * cell;
  const x = c.getContext('2d');
  x.font = `600 ${cell * 0.72}px "JetBrains Mono", ui-monospace, monospace`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff';
  for (let i = 0; i < CHARS.length; i++) x.fillText(CHARS[i], (i % cols) * cell + cell / 2, Math.floor(i / cols) * cell + cell / 2 + 2);
  const t = new THREE.CanvasTexture(c); t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; return t;
}

/* ---------- nubes cartesianas (hero y bloque final) ---------- */
const rnd = (a, b) => a + Math.random() * (b - a);
function sampleShapes(n, shapes, depth) {
  const a = new Float32Array(n * 3);
  const total = shapes.reduce((acc, sh) => acc + sh.w, 0);
  for (let i = 0; i < n; i++) {
    let r = Math.random() * total, sh = shapes[0];
    for (const c of shapes) { if (r < c.w) { sh = c; break; } r -= c.w; }
    let x = 0, y = 0, z = depth / 2 + 0.01;
    if (sh.t === 'seg') { const u = Math.random(); x = sh.x1 + (sh.x2 - sh.x1) * u + rnd(-sh.th, sh.th); y = sh.y1 + (sh.y2 - sh.y1) * u + rnd(-sh.th, sh.th); }
    else if (sh.t === 'rect') {
      const per = 2 * (sh.w2 + sh.h2), u = Math.random() * per, px = sh.x, py = sh.y, W = sh.w2, H = sh.h2;
      if (u < W) { x = px - W / 2 + u; y = py + H / 2; } else if (u < W + H) { x = px + W / 2; y = py + H / 2 - (u - W); }
      else if (u < 2 * W + H) { x = px + W / 2 - (u - W - H); y = py - H / 2; } else { x = px - W / 2; y = py - H / 2 + (u - 2 * W - H); }
      if (sh.side) z = rnd(-depth / 2, depth / 2);
    }
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
  sh.push({ t: 'seg', x1: -W / 2 + 0.2, y1: top - 0.85, x2: -W / 2 + 1.5, y2: top - 0.85, th: 0.035, w: 5 });
  sh.push({ t: 'seg', x1: -W / 2 + 0.2, y1: top - 1.02, x2: -W / 2 + 1.1, y2: top - 1.02, th: 0.035, w: 4 });
  sh.push({ t: 'seg', x1: -W / 2 + 0.2, y1: top - 1.22, x2: -W / 2 + 1.4, y2: top - 1.22, th: 0.01, w: 2 });
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
  const S = 2.5, d = 0.12, sh = [], pins = 9;
  sh.push({ t: 'rect', x: 0, y: 0, w2: S, h2: S, w: 16, side: true });
  sh.push({ t: 'rect', x: 0, y: 0, w2: S - 0.22, h2: S - 0.22, w: 6 });
  sh.push({ t: 'fill', x: 0, y: 0, w2: S, h2: S, w: 5, back: true });
  for (let i = 0; i < pins; i++) {
    const o = -S / 2 + 0.25 + i * ((S - 0.5) / (pins - 1));
    sh.push({ t: 'seg', x1: o, y1: S / 2, x2: o, y2: S / 2 + 0.22, th: 0.02, w: 1.2 });
    sh.push({ t: 'seg', x1: o, y1: -S / 2, x2: o, y2: -S / 2 - 0.22, th: 0.02, w: 1.2 });
    sh.push({ t: 'seg', x1: S / 2, y1: o, x2: S / 2 + 0.22, y2: o, th: 0.02, w: 1.2 });
    sh.push({ t: 'seg', x1: -S / 2, y1: o, x2: -S / 2 - 0.22, y2: o, th: 0.02, w: 1.2 });
  }
  const R = 0.78;
  for (let i = 0; i < 12; i++) {
    const ang = i * Math.PI / 6 + Math.PI / 12, ex = Math.cos(ang) * R, ey = Math.sin(ang) * R;
    const tx = Math.abs(Math.cos(ang)) > Math.abs(Math.sin(ang)) ? Math.sign(Math.cos(ang)) * (S / 2 - 0.16) : ex * 1.6;
    const ty = Math.abs(Math.cos(ang)) > Math.abs(Math.sin(ang)) ? ey * 1.6 : Math.sign(Math.sin(ang)) * (S / 2 - 0.16);
    sh.push({ t: 'seg', x1: ex, y1: ey, x2: tx, y2: ty, th: 0.01, w: 1.6 }); sh.push({ t: 'dot', x: tx, y: ty, r: 0.035, w: 0.5 });
  }
  const nChip = Math.floor(n * 0.42), nBrain = n - nChip;
  const chip = sampleShapes(nChip, sh, d), brain = cloudBrain(nBrain);
  const a = new Float32Array(n * 3); a.set(chip, 0);
  for (let i = 0; i < nBrain; i++) { a[(nChip + i) * 3] = brain[i * 3] * 0.6; a[(nChip + i) * 3 + 1] = brain[i * 3 + 1] * 0.6 - 0.02; a[(nChip + i) * 3 + 2] = brain[i * 3 + 2] * 0.35 + d / 2 + 0.1; }
  return a;
}
/* bloque final: tarjeta de contacto ancha que se forma detrás del pie */
function cloudEnd(n) {
  const W = 5.6, H = 2.4, d = 0.1, sh = [], top = H / 2;
  sh.push({ t: 'rect', x: 0, y: 0, w2: W, h2: H, w: 20, side: true });
  sh.push({ t: 'rect', x: 0, y: 0, w2: W - 0.2, h2: H - 0.2, w: 6 });
  sh.push({ t: 'seg', x1: -W / 2 + 0.4, y1: top - 0.55, x2: -W / 2 + 2.1, y2: top - 0.55, th: 0.045, w: 7 });
  sh.push({ t: 'seg', x1: -W / 2 + 0.4, y1: top - 0.95, x2: -W / 2 + 3.0, y2: top - 0.95, th: 0.012, w: 3 });
  sh.push({ t: 'seg', x1: -W / 2 + 0.4, y1: top - 1.15, x2: -W / 2 + 2.4, y2: top - 1.15, th: 0.012, w: 3 });
  sh.push({ t: 'rect', x: -W / 2 + 1.0, y: top - 1.65, w2: 1.3, h2: 0.34, w: 5 });
  sh.push({ t: 'fill', x: -W / 2 + 1.0, y: top - 1.65, w2: 1.3, h2: 0.34, w: 2 });
  sh.push({ t: 'rect', x: -W / 2 + 2.7, y: top - 1.65, w2: 1.3, h2: 0.34, w: 4 });
  sh.push({ t: 'dot', x: W / 2 - 0.9, y: 0.1, r: 0.38, w: 6 });
  for (let c = 0; c < 4; c++) sh.push({ t: 'seg', x1: W / 2 - 1.9, y1: -0.75 - c * 0.16, x2: W / 2 - 0.3, y2: -0.75 - c * 0.16, th: 0.008, w: 1.4 });
  return sampleShapes(n, sh, d);
}

/* ---------- el eje: dos variantes en coordenadas cilíndricas ---------- */
/* Para cada partícula guardamos (radio, y, ángulo) en la variante A y en la B, más un
   multiplicador de giro por partícula. El shader interpola entre A y B en cilíndricas:
   cambiar de variante es una animación de un uniform, no una recarga. */
const RA = new Float32Array(N * 4);
for (let i = 0; i < N; i++) for (let k = 0; k < 4; k++) RA[i * 4 + k] = Math.random();
const axA = new Float32Array(N * 3), axB = new Float32Array(N * 3), spin = new Float32Array(N * 2), nodeAttr = new Float32Array(N);
const AX_R = 0.86;

function buildAxis(sep) {
  const L = (NN - 1) * sep;            // longitud total del eje
  /* A: tres vueltas por tramo. Con fase π/2 los cruces de hebra caen exactamente en los nodos. */
  const turns = 3 * (NN - 1);
  const ringCount = (NN - 1) * 3 + 1;  // B: tres anillos por tramo
  for (let i = 0; i < N; i++) {
    const r0 = RA[i * 4], r1 = RA[i * 4 + 1], r2 = RA[i * 4 + 2], r3 = RA[i * 4 + 3];
    let rA, yA, tA, rB, yB, tB, sA = 1, sB = 1;
    if (r0 < 0.13) {
      /* marcador de nodo: mismo sitio en las dos variantes */
      const ni = Math.min(NN - 1, Math.floor(r1 * NN)); nodeAttr[i] = ni + 1;
      const t = ni / (NN - 1), y = -t * L + (r2 - 0.5) * 0.2;
      rA = 0.18 + r3 * 0.34; yA = y; tA = Math.PI / 2 + 2 * Math.PI * turns * t + (r2 - 0.5) * 2.4;
      rB = AX_R * 1.16 + (r3 - 0.5) * 0.12; yB = y; tB = r2 * 6.283;
      sA = 1; sB = 0.55;
    } else if (r0 < 0.44) {
      nodeAttr[i] = 0;
      /* A: travesaños entre hebras · B: columna central y raíles verticales */
      const rungs = turns * 4, k = Math.floor(r1 * rungs), t = k / rungs, u = r2;
      yA = -t * L; rA = AX_R * (1 - 2 * u); tA = Math.PI / 2 + 2 * Math.PI * turns * t;
      if (r3 < 0.55) { rB = 0.05 + r3 * 0.2; tB = r2 * 6.283; sB = 0.25; }         // columna central
      else { rB = AX_R * 0.99; tB = Math.floor(r2 * 6) / 6 * 6.283; sB = 0.4; }    // raíles
      yB = -r1 * L;
    } else {
      nodeAttr[i] = 0;
      /* A: las dos hebras · B: los anillos */
      const s = r1 < 0.5 ? 0 : 1, t = r2;
      yA = -t * L; rA = AX_R + (r3 - 0.5) * 0.07; tA = Math.PI / 2 + 2 * Math.PI * turns * t + s * Math.PI;
      const k = Math.floor(r1 * ringCount), tk = k / (ringCount - 1);
      yB = -tk * L + (r3 - 0.5) * 0.035;
      rB = AX_R * (0.66 + 0.42 * (0.5 + 0.5 * Math.sin(k * 1.7))) + (r3 - 0.5) * 0.05;
      tB = r2 * 6.283;
      sB = (0.35 + 0.95 * ((k % 3) / 2)) * (k % 2 ? -1 : 1);   // cada anillo a su ritmo
    }
    axA[i * 3] = rA; axA[i * 3 + 1] = yA; axA[i * 3 + 2] = tA;
    axB[i * 3] = rB; axB[i * 3 + 1] = yB; axB[i * 3 + 2] = tB;
    spin[i * 2] = sA; spin[i * 2 + 1] = sB;
  }
}
buildAxis(P.sep);

/* ---------- escena ---------- */
const canvas = document.getElementById('three');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.25 : 1.5));
renderer.setClearColor(0x05060f, 1);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;   // sin OutputPass: el composer no levanta los negros
const composer = new EffectComposer(renderer);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60); camera.position.set(0, 0, 8);
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), P.bloom, 0.3, 0.72);
composer.addPass(new RenderPass(scene, camera)); composer.addPass(bloom);

const geo = new THREE.BufferGeometry();
const t0 = cloudPhone(N), t1 = cloudWeb(N), t2 = cloudChipBrain(N), tEnd = cloudEnd(N);
geo.setAttribute('position', new THREE.BufferAttribute(t0.slice(), 3));
geo.setAttribute('aT0', new THREE.BufferAttribute(t0, 3));
geo.setAttribute('aT1', new THREE.BufferAttribute(t1, 3));
geo.setAttribute('aT2', new THREE.BufferAttribute(t2, 3));
geo.setAttribute('aEnd', new THREE.BufferAttribute(tEnd, 3));
const aAxA = new THREE.BufferAttribute(axA, 3), aAxB = new THREE.BufferAttribute(axB, 3);
aAxA.setUsage(THREE.DynamicDrawUsage); aAxB.setUsage(THREE.DynamicDrawUsage);
geo.setAttribute('aAxA', aAxA); geo.setAttribute('aAxB', aAxB);
geo.setAttribute('aSpin', new THREE.BufferAttribute(spin, 2));
geo.setAttribute('aNode', new THREE.BufferAttribute(nodeAttr, 1));
const seed = new Float32Array(N), glyph = new Float32Array(N), col = new Float32Array(N);
for (let i = 0; i < N; i++) { seed[i] = Math.random(); glyph[i] = Math.floor(Math.random() * CHARS.length); col[i] = Math.random(); }
geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
geo.setAttribute('aGlyph', new THREE.BufferAttribute(glyph, 1));
geo.setAttribute('aCol', new THREE.BufferAttribute(col, 1));

const mat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: {
    uTime: { value: 0 }, uProg: { value: 0 }, uIntroT: { value: 100 },
    uAxis: { value: 0 }, uEnd: { value: 0 }, uVariant: { value: 0 }, uSpin: { value: 0 },
    uAxisX: { value: 0 }, uAxisY: { value: 0 }, uEndY: { value: 0.5 },
    uHeroX: { value: 0 }, uHeroY: { value: 0 }, uHeroS: { value: 1 }, uHeroRot: { value: 0 },
    uNodeAct: { value: new Float32Array(NN) },
    uSize: { value: P.size }, uBright: { value: P.bright }, uDens: { value: 1 },
    uAtlas: { value: glyphAtlas() }, uDpr: { value: renderer.getPixelRatio() },
  },
  vertexShader: `
    attribute vec3 aT0, aT1, aT2, aEnd, aAxA, aAxB; attribute vec2 aSpin;
    attribute float aSeed, aGlyph, aCol, aNode;
    uniform float uTime, uProg, uSize, uDpr, uIntroT, uAxis, uEnd, uVariant, uSpin, uAxisX, uAxisY, uEndY, uHeroX, uHeroY, uHeroS, uHeroRot, uBright, uDens;
    uniform float uNodeAct[${NN}];
    varying float vGlyph, vCol, vSeed, vFade, vAlpha;
    float ease(float t){ return t*t*(3.0-2.0*t); }
    void main(){
      /* --- objeto del hero: ciclo móvil → web → chip IA --- */
      float s = floor(uProg), f = fract(uProg);
      int si = int(mod(s, 3.0)), sj = int(mod(s + 1.0, 3.0));
      vec3 A = si==0?aT0:si==1?aT1:aT2;
      vec3 B = sj==0?aT0:sj==1?aT1:aT2;
      float tm = ease(clamp((f - aSeed * 0.25) / 0.75, 0.0, 1.0));
      vec3 hero = mix(A, B, tm);
      hero *= 1.0 + 0.025 * sin(uTime * 1.25 + aSeed * 0.3);
      float ca = cos(uHeroRot), sa = sin(uHeroRot);
      hero = vec3(hero.x * ca + hero.z * sa, hero.y, -hero.x * sa + hero.z * ca);
      hero = hero * uHeroS + vec3(uHeroX, uHeroY, 0.0);

      /* --- eje: mezcla de las dos variantes en cilíndricas + giro por partícula --- */
      float rA = aAxA.x, thA = aAxA.z + uSpin * aSpin.x;
      float rB = aAxB.x, thB = aAxB.z + uSpin * aSpin.y;
      float v = uVariant;
      float r = mix(rA, rB, v), th = mix(thA, thB, v), yy = mix(aAxA.y, aAxB.y, v);
      vec3 axis = vec3(r * cos(th), yy, r * sin(th));
      axis.y += uAxisY; axis.x += uAxisX;

      /* --- bloque final (tarjeta de contacto) --- */
      vec3 endp = aEnd + vec3(0.0, uEndY, 0.0);

      /* --- transiciones continuas: hero → eje → final (reversibles) --- */
      vec3 p = mix(hero, axis, ease(uAxis));
      /* al deshacerse, los glifos salen hacia arriba y se abren */
      float bump = sin(3.14159 * uAxis);
      vec3 n = vec3(fract(aSeed*13.7)-.5, fract(aSeed*29.3)-.5, fract(aSeed*41.9)-.5) * 2.0;
      p += vec3(n.x * 1.1, 1.6 + fract(aSeed * 5.7) * 2.4, n.z * 0.9) * bump * (0.35 + 0.65 * fract(aSeed * 3.3));
      float bump2 = sin(3.14159 * uEnd);
      p = mix(p, endp, ease(uEnd));
      p += vec3(n.x * 1.3, 0.9 + fract(aSeed * 8.3) * 1.6, n.z * 0.8) * bump2 * (0.3 + 0.7 * fract(aSeed * 2.1));

      /* --- intro de caída (solo mientras el hero está montado) --- */
      float startY = 3.4 + fract(aSeed * 9.1) * 2.8;
      float landT = 0.4 + fract(aSeed * 7.13) * 0.8;
      float yR = startY - uIntroT * (startY - p.y) / landT;
      float landed = smoothstep(0.0, 0.5, p.y - yR);
      float head = (1.0 - landed) * 1.1 + exp(-abs(p.y - yR) * 6.0) * 1.6;
      p = mix(vec3(p.x + (fract(aSeed * 17.7) - 0.5) * 0.05, yR, p.z), p, landed);

      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      float depth = max(0.2, -mv.z);
      gl_PointSize = uSize * uDpr * (6.0 / depth) * (0.75 + 0.5 * fract(aSeed * 5.1));

      /* --- nodo activo: los glifos de ese nodo se encienden --- */
      float act = 0.0;
      for (int k = 0; k < ${NN}; k++) { if (abs(aNode - float(k + 1)) < 0.5) act = uNodeAct[k]; }
      float onAxis = uAxis * (1.0 - uEnd);
      float glow = act * onAxis * 1.9;

      /* densidad del eje: se apaga una fracción de partículas solo durante el eje */
      float dens = smoothstep(uDens + 0.08, uDens, aSeed);
      vAlpha = mix(1.0, dens, onAxis);

      vGlyph = aGlyph; vCol = aCol; vSeed = aSeed;
      float mid = max(bump, bump2);
      vFade = (0.38 + 0.22 * (sin(uTime * (1.0 + aSeed) + aSeed * 30.0) * 0.5 + 0.5) + head * 1.4 + mid * 0.6 + glow) * 0.82;
      vFade += (aNode > 0.5 ? 0.25 : 0.0) * onAxis;
    }`,
  fragmentShader: `
    uniform sampler2D uAtlas; uniform float uBright, uTime;
    varying float vGlyph, vCol, vSeed, vFade, vAlpha;
    void main(){
      float g = mod(vGlyph + floor(uTime * (0.4 + vSeed * 0.8) + vSeed * 9.0), 128.0);
      vec2 cell = vec2(mod(g, 16.0), floor(g / 16.0));
      vec2 uv = vec2((cell.x + gl_PointCoord.x) / 16.0, 1.0 - (cell.y + gl_PointCoord.y) / 8.0);
      float a = texture2D(uAtlas, uv).r;
      if (a < 0.12) discard;
      vec3 purple = vec3(0.65, 0.54, 0.98), lav = vec3(0.86, 0.80, 1.0), green = vec3(0.20, 0.83, 0.60);
      vec3 c = mix(purple, lav, vCol * 0.5);
      if (vCol < 0.14) c = green;
      gl_FragColor = vec4(c * vFade * uBright * vAlpha, a * 0.9 * vAlpha);
    }`,
});
const points = new THREE.Points(geo, mat); scene.add(points);
geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 200);   // nunca se descarta por frustum

/* ---------- nodos: enlaces reales colocados sobre la escena ---------- */
const axisnav = document.getElementById('axisnav');
const nodeEls = NODES.map((nd, i) => {
  const a = document.createElement('a');
  a.className = 'axisnode'; a.href = '#' + nd.id; a.dataset.side = 'right';
  a.innerHTML = `<span class="axisnode__dot" aria-hidden="true"></span><span class="axisnode__tip"><span class="axisnode__n">${nd.name}</span><span class="axisnode__f">${nd.fact}</span></span>`;
  axisnav.appendChild(a); return a;
});
/* en móvil y con movimiento reducido los nodos van en un raíl fijo, no sobre la escena */
const railMode = isMobile || reduce;
if (railMode) axisnav.classList.add('axisnav--rail');

/* ---------- mapa scroll → recorrido ---------- */
const secEls = NODES.map((n) => document.getElementById(n.id));
const panels = [...document.querySelectorAll('.panel-glass, .pie__in')];
const heroLeft = document.querySelector('.hero__left');
const heroHint = document.querySelector('.hero__hint');
const pieEl = document.getElementById('pie');
const stage = document.getElementById('stage');
let S = [], maxScroll = 1, vh = innerHeight, worldH = 1, worldW = 1, heroBox = { x: 0, y: 0, s: 1 };

function layout() {
  vh = innerHeight;
  maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
  camera.aspect = innerWidth / vh; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, vh, false); composer.setSize(innerWidth, vh);
  worldH = 2 * camera.position.z * Math.tan(camera.fov * Math.PI / 360); worldW = worldH * camera.aspect;
  S = secEls.map((el) => {
    const r = el.getBoundingClientRect(), topDoc = r.top + scrollY;
    return Math.min(maxScroll, Math.max(0, topDoc + r.height / 2 - vh / 2));
  });
  const r = stage.getBoundingClientRect();
  heroBox.x = ((r.left + r.width / 2) / innerWidth - 0.5) * worldW;
  heroBox.y = (0.5 - (r.top + scrollY - scrollY + r.height / 2) / vh) * worldH;
  heroBox.s = Math.min(1, (r.height / vh) * worldH / 4.4, (r.width / innerWidth) * worldW / 3.6);
}

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const smooth = (t) => t * t * (3 - 2 * t);
/* índice de nodo continuo a partir del scroll (lineal a trozos, extrapolado en los extremos) */
function nodeParam(sc) {
  if (S.length < 2) return 0;
  if (sc <= S[0]) { const d = Math.max(1, S[1] - S[0]); return (sc - S[0]) / d; }
  for (let i = 0; i < NN - 1; i++) if (sc <= S[i + 1]) { const d = Math.max(1, S[i + 1] - S[i]); return i + (sc - S[i]) / d; }
  const d = Math.max(1, S[NN - 1] - S[NN - 2]); return (NN - 1) + (sc - S[NN - 1]) / d;
}
function perNode(table, k) {
  const i0 = clamp(Math.floor(k), 0, NN - 1), i1 = clamp(i0 + 1, 0, NN - 1);
  const f = smooth(clamp(k - i0, 0, 1));
  return table[i0] + (table[i1] - table[i0]) * f;
}
const lateral = (k) => perNode(NODE_X, k) * 0.26 * worldW * P.lat * LAT_SCALE;
const vertical = (k) => perNode(NODE_Y, k);

/* ---------- ciclo de estados del hero (congelado en cuanto empieza la dispersión) ---------- */
let state = 0, phase = 'hold', pt = 0, prog = 0;
function advanceHero(dt, axisT) {
  if (axisT > 0.002 || introT < 1.5) return;
  pt += dt;
  if (phase === 'hold') { prog = state; if (pt >= 3.5) { phase = 'morph'; pt = 0; } }
  else { const f = Math.min(1, pt / 1.6); prog = state + f; if (f >= 1) { state = (state + 1) % 3; phase = 'hold'; pt = 0; prog = state; } }
  mat.uniforms.uProg.value = prog;
}

/* ---------- variante: se tweenea, no se recarga (el scroll no se toca) ---------- */
let variant = 0, variantCur = 0;
function setVariant(v) {
  variant = v;
  document.querySelectorAll('[data-variant]').forEach((b) => {
    const on = +b.dataset.variant === v;
    b.classList.toggle('is-on', on);
    if (b.hasAttribute('aria-pressed')) b.setAttribute('aria-pressed', String(on));
  });
  if (reduce) { variantCur = v; mat.uniforms.uVariant.value = v; render(); }
}
document.querySelectorAll('[data-variant]').forEach((b) => b.addEventListener('click', () => setVariant(+b.dataset.variant)));

/* ---------- bucle ---------- */
const v3 = new THREE.Vector3();
let spinAcc = 0, introT = 100, running = true, last = performance.now(), frames = 0, fpsT = 0;
const fpsEl = document.getElementById('fps'), knodeEl = document.getElementById('knode');
document.getElementById('count').textContent = N;
const scrollpEl = document.getElementById('scrollp');

function updateScene(now, dt) {
  const sc = clamp(scrollY, 0, maxScroll);

  /* dispersión: empieza sobre el 45 % del viewport y está recompuesta antes de llegar al nodo 0.
     Función pura del scroll, así que subir la deshace exactamente igual. */
  const dispA = 0.45 * vh, dispB = Math.max(dispA + 1, S[0] - 0.15 * vh);
  const axisT = clamp((sc - dispA) / (dispB - dispA), 0, 1);
  /* final: el eje se deshace otra vez tras el nodo de contacto y forma el bloque del pie */
  const endA = S[NN - 1] + 0.3 * vh, endB = endA + Math.max(1, (maxScroll - endA) * 0.7);
  const endT = clamp((sc - endA) / (endB - endA), 0, 1);
  const k = nodeParam(sc);

  advanceHero(dt, axisT);
  mat.uniforms.uAxis.value = axisT;
  mat.uniforms.uEnd.value = endT;
  mat.uniforms.uAxisY.value = k * P.sep + vertical(k);
  mat.uniforms.uAxisX.value = lateral(k);
  mat.uniforms.uEndY.value = 0.4;
  mat.uniforms.uHeroX.value = heroBox.x; mat.uniforms.uHeroY.value = heroBox.y; mat.uniforms.uHeroS.value = heroBox.s;
  mat.uniforms.uDens.value = P.dens;
  mat.uniforms.uSize.value = P.size; mat.uniforms.uBright.value = P.bright;
  mat.uniforms.uTime.value = now / 1000; mat.uniforms.uIntroT.value = introT;
  bloom.strength = P.bloom;

  /* giro: ligado al scroll + deriva lenta en reposo */
  if (!reduce) { spinAcc = sc * 0.0022 * P.rot + (now / 1000) * 0.07 * P.rot; mat.uniforms.uSpin.value = spinAcc; }
  mat.uniforms.uHeroRot.value = reduce ? 0 : (now / 1000) * 0.18;

  /* variante: tween suave */
  variantCur += (variant - variantCur) * Math.min(1, dt * 3.2);
  mat.uniforms.uVariant.value = variantCur;

  /* nodos: activación y colocación de los enlaces */
  const act = mat.uniforms.uNodeAct.value;
  const half = innerWidth / 2, top = 5.5 * 16, bot = vh - 4 * 16, gap = 1.5 * 16;
  const ys = [], xs = [];
  for (let i = 0; i < NN; i++) {
    const a = 1 - smooth(clamp((Math.abs(k - i) - 0.18) / 0.62, 0, 1));
    act[i] = a * (1 - endT);
    v3.set(mat.uniforms.uAxisX.value, -i * P.sep + mat.uniforms.uAxisY.value, 0).project(camera);
    xs.push((v3.x * 0.5 + 0.5) * innerWidth);
    ys.push((-v3.y * 0.5 + 0.5) * vh);
  }
  /* El nodo en curso se queda exactamente sobre su cúmulo de glifos (es su ancla).
     Los que quedan fuera de pantalla se acoplan al borde manteniendo el orden, sin empujar al ancla:
     así siguen siendo pulsables y hacen de indicador de progreso. */
  const a = clamp(Math.round(k), 0, NN - 1);
  for (let i = a - 1; i >= 0; i--) ys[i] = Math.min(ys[i], ys[i + 1] - gap);
  for (let i = a + 1; i < NN; i++) ys[i] = Math.max(ys[i], ys[i - 1] + gap);
  for (let i = 0; i < a; i++) if (ys[i] < top) ys[i] = Math.min(top + i * gap, ys[a] - (a - i) * gap);
  for (let i = NN - 1; i > a; i--) if (ys[i] > bot) ys[i] = Math.max(bot - (NN - 1 - i) * gap, ys[a] + (i - a) * gap);
  for (let i = 0; i < NN; i++) {
    const el = nodeEls[i], near = act[i] > 0.55;
    if (railMode) { el.dataset.side = 'right'; el.style.setProperty('--o', (0.4 + 0.6 * act[i]) * (axisT > 0.02 ? 1 : 0)); }
    else {
      const x = clamp(xs[i], 2.75 * 16, innerWidth - 2.75 * 16);
      el.style.setProperty('--x', x + 'px');
      el.style.setProperty('--y', ys[i] + 'px');
      el.style.setProperty('--o', (0.34 + 0.66 * act[i]) * (axisT > 0.02 ? 1 : 0));
      /* el rótulo sale hacia el borde más cercano: el contenido siempre está al otro lado */
      el.dataset.side = x < half ? 'left' : 'right';
    }
    if ((el.getAttribute('aria-current') === 'true') !== near) el.setAttribute('aria-current', String(near));
  }
  axisnav.style.visibility = (axisT > 0.02 || railMode) ? 'visible' : 'hidden';

  /* contenido HTML: entra y sale con el mismo progreso que su nodo */
  for (let i = 0; i < NN; i++) panels[i].style.setProperty('--in', (0.06 + 0.94 * (1 - smooth(clamp((Math.abs(k - i) - 0.1) / 0.6, 0, 1)))).toFixed(3));
  panels[NN].style.setProperty('--in', (0.06 + 0.94 * clamp((sc - endA - 0.15 * vh) / Math.max(1, (endB - endA) * 0.8), 0, 1)).toFixed(3));
  const heroIn = 1 - clamp(sc / (0.55 * vh), 0, 1);
  heroLeft.style.setProperty('--in', heroIn.toFixed(3));
  if (heroHint) heroHint.style.setProperty('--in', heroIn.toFixed(3));
  knodeEl.textContent = k.toFixed(2);
  if (document.activeElement !== scrollpEl) { scrollpEl.value = (sc / maxScroll).toFixed(3); scrollpEl.parentElement.querySelector('output').value = (sc / maxScroll).toFixed(2); }
}

function render() { if (P.bloom > 0) composer.render(); else renderer.render(scene, camera); }

function frame(now) {
  if (!running) return;
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  tickChars(dt);
  updateScene(now, dt);
  render();
  frames++; if (now - fpsT > 1000) { fpsEl.textContent = frames; frames = 0; fpsT = now; }
  requestAnimationFrame(frame);
}

/* pausa fuera de viewport / pestaña oculta */
function setRunning(v) { if (v === running) return; running = v; if (v) { last = performance.now(); requestAnimationFrame(frame); } }
document.addEventListener('visibilitychange', () => setRunning(!document.hidden && visible));
let visible = true;
new IntersectionObserver((e) => { visible = e[0].isIntersecting; setRunning(visible && !document.hidden); }, { threshold: 0 }).observe(document.getElementById('main'));

layout();
addEventListener('resize', () => { layout(); if (reduce) { staticFrame(); } }, { passive: true });
addEventListener('load', layout);

/* ---------- movimiento reducido: eje estático, secciones con fundido ---------- */
function staticFrame() {
  mat.uniforms.uAxis.value = 1; mat.uniforms.uEnd.value = 0; mat.uniforms.uSpin.value = 0;
  mat.uniforms.uAxisX.value = 0; mat.uniforms.uAxisY.value = 2.2 * P.sep; mat.uniforms.uIntroT.value = 100;
  mat.uniforms.uVariant.value = variantCur; mat.uniforms.uDens.value = P.dens;
  mat.uniforms.uSize.value = P.size; mat.uniforms.uBright.value = P.bright;
  const act = mat.uniforms.uNodeAct.value; for (let i = 0; i < NN; i++) act[i] = 0.5;
  bloom.strength = P.bloom;
  render();
}
if (reduce) {
  staticFrame();
  canvas.classList.add('is-on');
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) e.target.classList.add('is-in'); }), { threshold: 0.15 });
  panels.forEach((p) => io.observe(p));
  nodeEls.forEach((el) => el.style.setProperty('--o', 1));
} else {
  requestAnimationFrame(frame);
  requestAnimationFrame(() => canvas.classList.add('is-on'));
}

/* ---------- intro de caída de caracteres (de hero-lab-3) ---------- */
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
          const w = document.createElement('span'); w.className = 'w';
          for (const ch of word) { const sp = document.createElement('span'); sp.className = 'ch'; sp.textContent = ch; sp.dataset.ch = ch; w.appendChild(sp); out.push(sp); }
          frag.appendChild(w);
        }
        c.replaceWith(frag);
      } else if (c.nodeType === 1) walk(c);
    }
  };
  walk(el); return out;
}
let drops = null;
function prepareChars() {
  const els = ['.nav__brand', '.nav__links', '.nav__right', '.badge', 'h1', '.sub', '.hero .ctas'].map((q) => document.querySelector(q)).filter(Boolean);
  [...document.querySelectorAll('.hero .badge, .hero .btn, .nav .btn')].forEach((sh) => sh.classList.add('is-forming'));
  drops = els.flatMap(splitChars).map((el) => {
    const shell = el.closest('.badge, .btn');
    const start = -(0.35 + Math.random() * 0.75) * innerHeight, landT = 0.4 + Math.random() * 0.8;
    return { el, shell, start, speed: -start / landT, y: 0, landed: false, flash: 0 };
  });
  for (const d of drops) { d.y = d.start; d.el.style.transform = `translateY(${d.start}px)`; d.el.classList.add('is-falling'); d.el.textContent = rg(); }
}
function tickChars(dt) {
  if (!drops) return;
  let pending = 0;
  for (const d of drops) {
    if (d.landed) { if (d.flash > 0) { d.flash -= dt; if (d.flash <= 0) { d.el.classList.remove('is-wet'); d.el.textContent = d.el.dataset.ch; } } continue; }
    pending++;
    d.y += d.speed * dt;
    if (d.y >= 0) {
      d.y = 0; d.landed = true; d.flash = 0.14 + Math.random() * 0.16;
      d.el.classList.remove('is-falling'); d.el.classList.add('is-wet'); d.el.style.transform = ''; d.el.textContent = rg();
      if (d.shell && !drops.some((o) => o.shell === d.shell && !o.landed)) d.shell.classList.remove('is-forming');
    } else { d.el.style.transform = `translateY(${d.y}px)`; if (Math.random() < 0.3) d.el.textContent = rg(); }
  }
  if (!pending && drops.every((d) => d.flash <= 0)) drops = null;
}
/* cualquier interacción (o abrir la página en una pestaña de fondo) lleva la intro al estado final */
function finishIntro() {
  introT = 100;
  if (!drops) return;
  for (const d of drops) { d.landed = true; d.flash = 0; d.y = 0; d.el.style.transform = ''; d.el.classList.remove('is-falling', 'is-wet'); d.el.textContent = d.el.dataset.ch; }
  document.querySelectorAll('.is-forming').forEach((el) => el.classList.remove('is-forming'));
  drops = null;
}
function playIntro() {
  if (reduce) return;
  scrollTo(0, 0); prepareChars();
  introT = 0; const t0i = performance.now();
  const tick = (now) => { introT = (now - t0i) / 1000; if (introT < 3) requestAnimationFrame(tick); else introT = 100; };
  requestAnimationFrame(tick);
}
if ((!sessionStorage.getItem('eje_intro') || location.search.includes('intro')) && !reduce) {
  sessionStorage.setItem('eje_intro', '1');
  if (document.hidden) introT = 100; else playIntro();   // en pestaña de fondo no hay rAF: se muestra el estado final
}
for (const ev of ['pointerdown', 'keydown', 'wheel', 'touchstart']) addEventListener(ev, () => { if (drops) finishIntro(); }, { passive: true, once: false });
document.addEventListener('visibilitychange', () => { if (document.hidden && drops) finishIntro(); });

/* ---------- panel «c» ---------- */
const panel = document.getElementById('panel');
addEventListener('keydown', (e) => {
  if (e.key === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
    panel.hidden = !panel.hidden;
  }
});
document.getElementById('replay').addEventListener('click', playIntro);
document.getElementById('toTop').addEventListener('click', () => scrollTo({ top: 0, behavior: 'instant' }));

function bindRange(id, fn) {
  const el = document.getElementById(id), out = el.parentElement.querySelector('output');
  const apply = () => { P[id] = +el.value; out.value = el.value; fn && fn(+el.value); if (reduce) staticFrame(); };
  el.addEventListener('input', apply); apply();
}
['rot', 'dens', 'lat', 'bright', 'size', 'bloom'].forEach((id) => bindRange(id));
bindRange('sep', (v) => { buildAxis(v); aAxA.needsUpdate = true; aAxB.needsUpdate = true; layout(); });

/* gancho de revisión: permite avanzar la escena a mano (pestañas sin rAF, capturas) */
window.__eje = { P, uniforms: mat.uniforms, layout, render, finishIntro, setVariant,
  step(now = performance.now()) { updateScene(now, 1 / 60); render(); } };

/* progreso de scroll forzado: mueve el scroll real, así el HTML y la escena siguen en fase */
const forceOn = document.getElementById('forceOn');
scrollpEl.addEventListener('input', () => {
  if (!forceOn.checked) return;
  const p = +scrollpEl.value;
  scrollpEl.parentElement.querySelector('output').value = p.toFixed(2);
  const prev = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = 'auto';
  scrollTo(0, p * maxScroll);
  document.documentElement.style.scrollBehavior = prev;
  if (reduce) staticFrame();
});
