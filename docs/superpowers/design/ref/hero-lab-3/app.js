/* hero-lab 3 · partículas-glifo (caracteres reales de código) que morfan: código (lluvia Matrix) → móvil → web → IA → código.
   Three.js por ESM. Morph en el vertex shader entre 4 nubes de destino. Morado base, toques verdes. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const P = { hold: 3.5, morph: 1.6, rot: .18, size: 16, bright: 1.0, green: 14, rain: .7, scatter: .6, breath: .025, wperiod: 4, wamp: .6, bloom: .3, bloomth: .72, focus: 6.2, mirror: .45 };
const N = innerWidth < 640 ? 5000 : 9000;

/* ---------- atlas de glifos: 16×8 caracteres de código en JetBrains Mono ---------- */
const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789{}[]()<>=;:.,/*+-_$#@!?&|\\\'"`~^%'.slice(0, 128);
function glyphAtlas() {
  const cols = 16, rows = 8, cell = 64;
  const c = document.createElement('canvas'); c.width = cols * cell; c.height = rows * cell;
  const x = c.getContext('2d');
  x.font = `600 ${cell * 0.72}px "JetBrains Mono", ui-monospace, monospace`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff';
  for (let i = 0; i < CHARS.length; i++) x.fillText(CHARS[i], (i % cols) * cell + cell / 2, Math.floor(i / cols) * cell + cell / 2 + 2);
  const t = new THREE.CanvasTexture(c); t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; return t;
}

/* ---------- nubes de destino ---------- */
const rnd = (a, b) => a + Math.random() * (b - a);
function cloudCode(n) {          // columnas: x/z en rejilla, y aleatoria (la lluvia la anima el shader)
  const a = new Float32Array(n * 3);
  const cols = 34, depth = 7;
  for (let i = 0; i < n; i++) {
    const c = i % cols, d = Math.floor(i / cols) % depth;
    a[i * 3] = (c / (cols - 1) - .5) * 3.4 + rnd(-.03, .03);
    a[i * 3 + 1] = rnd(-1.9, 1.9);
    a[i * 3 + 2] = (d / (depth - 1) - .5) * 1.6 + rnd(-.05, .05);
  }
  return a;
}
/* Muestreador de dispositivos: lista de formas 2D (en el plano z) con pesos → puntos.
   seg: línea gruesa; rect: contorno; fill: relleno; dot: cúmulo. Coordenadas centradas. */
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
  sh.push({ t: 'rect', x: 0, y: 0, w2: W, h2: H, w: 16, side: true });                 // canto (con grosor)
  sh.push({ t: 'rect', x: 0, y: 0, w2: W - 0.12, h2: H - 0.12, w: 8 });                // borde de pantalla
  sh.push({ t: 'fill', x: 0, y: 0, w2: W - 0.16, h2: H - 0.16, w: 10 });               // pantalla tenue
  sh.push({ t: 'fill', x: 0, y: 0, w2: W, h2: H, w: 5, back: true });                  // trasera
  sh.push({ t: 'seg', x1: -0.16, y1: H / 2 - 0.13, x2: 0.16, y2: H / 2 - 0.13, th: 0.02, w: 5 }); // isla/notch
  sh.push({ t: 'seg', x1: -W / 2 + 0.14, y1: H / 2 - 0.3, x2: -W / 2 + 0.38, y2: H / 2 - 0.3, th: 0.012, w: 2 }); // hora
  sh.push({ t: 'seg', x1: W / 2 - 0.36, y1: H / 2 - 0.3, x2: W / 2 - 0.14, y2: H / 2 - 0.3, th: 0.012, w: 2 });   // batería
  for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) sh.push({ t: 'dot', x: -W / 2 + 0.26 + c * 0.26, y: H / 2 - 0.62 - r * 0.3, r: 0.075, w: 1.3 }); // iconos
  sh.push({ t: 'seg', x1: -W / 2 + 0.16, y1: -H / 2 + 0.36, x2: W / 2 - 0.16, y2: -H / 2 + 0.36, th: 0.01, w: 2 }); // separador dock
  for (let c = 0; c < 4; c++) sh.push({ t: 'dot', x: -W / 2 + 0.26 + c * 0.26, y: -H / 2 + 0.2, r: 0.08, w: 1.5 });  // dock
  sh.push({ t: 'seg', x1: -0.22, y1: -H / 2 + 0.06, x2: 0.22, y2: -H / 2 + 0.06, th: 0.008, w: 1.5 });   // barra home
  return sampleShapes(n, sh, d);
}
function cloudWeb(n) {
  const W = 3.2, H = 2.1, d = 0.08, sh = [], top = H / 2;
  sh.push({ t: 'rect', x: 0, y: 0, w2: W, h2: H, w: 14, side: true });                       // marco
  sh.push({ t: 'fill', x: 0, y: 0, w2: W, h2: H, w: 6, back: true });
  sh.push({ t: 'seg', x1: -W / 2, y1: top - 0.26, x2: W / 2, y2: top - 0.26, th: 0.008, w: 4 }); // línea bajo la barra
  for (let c = 0; c < 3; c++) sh.push({ t: 'dot', x: -W / 2 + 0.14 + c * 0.11, y: top - 0.13, r: 0.03, w: 1.2 }); // semáforo
  sh.push({ t: 'rect', x: 0.15, y: top - 0.13, w2: 1.6, h2: 0.12, w: 5 });                     // barra de dirección
  sh.push({ t: 'seg', x1: -W / 2 + 0.2, y1: top - 0.5, x2: -W / 2 + 0.6, y2: top - 0.5, th: 0.012, w: 2 }); // logo
  for (let c = 0; c < 4; c++) sh.push({ t: 'seg', x1: W / 2 - 1.5 + c * 0.34, y1: top - 0.5, x2: W / 2 - 1.3 + c * 0.34, y2: top - 0.5, th: 0.01, w: 1 }); // menú
  sh.push({ t: 'seg', x1: -W / 2 + 0.2, y1: top - 0.85, x2: -W / 2 + 1.5, y2: top - 0.85, th: 0.035, w: 5 });  // titular 1
  sh.push({ t: 'seg', x1: -W / 2 + 0.2, y1: top - 1.02, x2: -W / 2 + 1.1, y2: top - 1.02, th: 0.035, w: 4 });  // titular 2
  sh.push({ t: 'seg', x1: -W / 2 + 0.2, y1: top - 1.22, x2: -W / 2 + 1.4, y2: top - 1.22, th: 0.01, w: 2 });   // párrafo
  sh.push({ t: 'seg', x1: -W / 2 + 0.2, y1: top - 1.32, x2: -W / 2 + 1.2, y2: top - 1.32, th: 0.01, w: 2 });
  sh.push({ t: 'rect', x: -W / 2 + 0.42, y: top - 1.55, w2: 0.44, h2: 0.14, w: 3 });          // botón
  sh.push({ t: 'rect', x: W / 2 - 0.85, y: top - 1.05, w2: 1.2, h2: 0.8, w: 7 });              // imagen/hero block
  sh.push({ t: 'fill', x: W / 2 - 0.85, y: top - 1.05, w2: 1.2, h2: 0.8, w: 3 });
  for (let c = 0; c < 3; c++) sh.push({ t: 'rect', x: -W / 2 + 0.55 + c * 1.05, y: -H / 2 + 0.22, w2: 0.9, h2: 0.26, w: 3 }); // tarjetas
  return sampleShapes(n, sh, d);
}
function cloudBrain(n) {
  // silueta de cerebro (perfil): lóbulo principal + cerebelo + tronco, con "circunvoluciones" en la superficie.
  // nodos repartidos por la superficie (distancia mínima) y aristas entre vecinos; las partículas van a nodos y aristas.
  const surf = (u, v) => {
    // u: azimut, v: elevación → punto en el elipsoide principal con pliegues
    const cu = Math.cos(u), su = Math.sin(u), cv = Math.cos(v), sv = Math.sin(v);
    const fold = 1 + 0.045 * Math.sin(7 * u + 2 * v) * Math.cos(5 * v) + 0.03 * Math.sin(11 * v + 3 * u);
    let x = 1.25 * cu * cv * fold + 0.05, y = 0.95 * sv * fold + 0.12, z = 0.85 * su * cv * fold;
    if (y < -0.42) y = -0.42 + (y + 0.42) * 0.25;   // base plana
    // fisura longitudinal: hundir la cresta superior cerca de z=0
    if (y > 0.5 && Math.abs(z) < 0.12) y -= 0.09 * (1 - Math.abs(z) / 0.12);
    return [x, y, z];
  };
  const pts = [];
  for (let i = 0; i < 900; i++) { const u = Math.random() * 6.283, v = Math.asin(Math.random() * 2 - 1); pts.push(surf(u, v)); }
  for (let i = 0; i < 160; i++) { const u = Math.random() * 6.283, v = Math.asin(Math.random() * 2 - 1); const cu = Math.cos(u), su = Math.sin(u), cv = Math.cos(v), sv = Math.sin(v); pts.push([-0.78 + 0.46 * cu * cv, -0.58 + 0.3 * sv, 0.38 * su * cv]); } // cerebelo
  for (let i = 0; i < 40; i++) pts.push([-0.28 + rnd(-0.1, 0.1), -0.62 - Math.random() * 0.42, rnd(-0.1, 0.1)]); // tronco
  // nodos con distancia mínima (poisson por rechazo)
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
  // chip cuadrado (placa con pines y pistas) con el cerebro dentro, ambos de cara a la cámara
  const S = 2.5, d = 0.12, sh = [], pinsPerSide = 9;
  sh.push({ t: 'rect', x: 0, y: 0, w2: S, h2: S, w: 16, side: true });                 // canto de la placa
  sh.push({ t: 'rect', x: 0, y: 0, w2: S - 0.22, h2: S - 0.22, w: 6 });                // borde interior
  sh.push({ t: 'fill', x: 0, y: 0, w2: S, h2: S, w: 5, back: true });
  for (let i = 0; i < pinsPerSide; i++) {                                              // pines en los cuatro lados
    const o = -S / 2 + 0.25 + i * ((S - 0.5) / (pinsPerSide - 1));
    sh.push({ t: 'seg', x1: o, y1: S / 2, x2: o, y2: S / 2 + 0.22, th: 0.02, w: 1.2 });
    sh.push({ t: 'seg', x1: o, y1: -S / 2, x2: o, y2: -S / 2 - 0.22, th: 0.02, w: 1.2 });
    sh.push({ t: 'seg', x1: S / 2, y1: o, x2: S / 2 + 0.22, y2: o, th: 0.02, w: 1.2 });
    sh.push({ t: 'seg', x1: -S / 2, y1: o, x2: -S / 2 - 0.22, y2: o, th: 0.02, w: 1.2 });
  }
  for (let i = 0; i < 4; i++) {                                                         // marcas de esquina
    const sx = i % 2 ? 1 : -1, sy = i < 2 ? 1 : -1;
    sh.push({ t: 'seg', x1: sx * (S / 2 - 0.2), y1: sy * (S / 2 - 0.34), x2: sx * (S / 2 - 0.2), y2: sy * (S / 2 - 0.2), th: 0.012, w: 0.6 });
    sh.push({ t: 'seg', x1: sx * (S / 2 - 0.34), y1: sy * (S / 2 - 0.2), x2: sx * (S / 2 - 0.2), y2: sy * (S / 2 - 0.2), th: 0.012, w: 0.6 });
  }
  const R = 0.78;                                                                        // pistas del cerebro a los bordes
  for (let i = 0; i < 12; i++) { const ang = i * Math.PI / 6 + Math.PI / 12; const ex = Math.cos(ang) * R, ey = Math.sin(ang) * R;
    const tx = Math.abs(Math.cos(ang)) > Math.abs(Math.sin(ang)) ? Math.sign(Math.cos(ang)) * (S / 2 - 0.16) : ex * 1.6, ty = Math.abs(Math.cos(ang)) > Math.abs(Math.sin(ang)) ? ey * 1.6 : Math.sign(Math.sin(ang)) * (S / 2 - 0.16);
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
const canvas = document.getElementById('three');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setClearColor(0x05060f, 1);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;   // sin conversión de color: el composer no levanta los negros
const composer = new EffectComposer(renderer);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50); camera.position.set(0, 0, 6.2);
const group = new THREE.Group(); scene.add(group);
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.3, 0.3, 0.72);
composer.addPass(new RenderPass(scene, camera)); composer.addPass(bloom);

const geo = new THREE.BufferGeometry();
const tRain = cloudCode(N), t0 = cloudPhone(N), t1 = cloudWeb(N), t2 = cloudChipBrain(N);
geo.setAttribute('position', new THREE.BufferAttribute(t0.slice(), 3));
geo.setAttribute('aRain', new THREE.BufferAttribute(tRain, 3)); geo.setAttribute('aT0', new THREE.BufferAttribute(t0, 3)); geo.setAttribute('aT1', new THREE.BufferAttribute(t1, 3)); geo.setAttribute('aT2', new THREE.BufferAttribute(t2, 3));
const seed = new Float32Array(N), glyph = new Float32Array(N), col = new Float32Array(N);
for (let i = 0; i < N; i++) { seed[i] = Math.random(); glyph[i] = Math.floor(Math.random() * CHARS.length); col[i] = Math.random(); }
geo.setAttribute('aKind', new THREE.BufferAttribute(cloudChipBrain.meta.kind, 1)); geo.setAttribute('aParam', new THREE.BufferAttribute(cloudChipBrain.meta.param, 1));
geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1)); geo.setAttribute('aGlyph', new THREE.BufferAttribute(glyph, 1)); geo.setAttribute('aCol', new THREE.BufferAttribute(col, 1));

const mat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uTime: { value: 0 }, uProg: { value: 0 }, uIntroT: { value: 100 }, uWave: { value: 0 }, uWavePeriod: { value: 4.0 }, uWaveAmp: { value: 0.6 }, uBreath: { value: 0.025 }, uMirror: { value: 0 }, uFocus: { value: 6.2 }, uSize: { value: P.size }, uBright: { value: P.bright }, uGreen: { value: P.green / 100 }, uRain: { value: P.rain }, uScatter: { value: P.scatter }, uAtlas: { value: glyphAtlas() }, uDpr: { value: renderer.getPixelRatio() } },
  vertexShader: `
    attribute vec3 aRain, aT0, aT1, aT2; attribute float aSeed, aGlyph, aCol, aKind, aParam;
    uniform float uTime, uProg, uSize, uRain, uScatter, uDpr, uIntroT, uWave, uWavePeriod, uWaveAmp, uBreath, uMirror, uFocus;
    varying float vGlyph, vCol, vSeed, vFade, vAlpha;
    varying float vSoft;
    float ease(float t){ return t*t*(3.0-2.0*t); }
    void main(){
      float s = floor(uProg); float f = fract(uProg);
      int si = int(mod(s, 3.0)); int sj = int(mod(s + 1.0, 3.0));
      vec3 A = si==0?aT0:si==1?aT1:aT2;
      vec3 B = sj==0?aT0:sj==1?aT1:aT2;
      // cada partícula arranca su morph con un pequeño desfase → la transición "recorre" la nube
      float t = clamp((f - aSeed * 0.25) / 0.75, 0.0, 1.0); t = ease(t);
      vec3 p = mix(A, B, t);
      // dispersión a mitad de camino (explosión contenida) con ruido por partícula
      float mid = sin(t * 3.14159);
      vec3 n = vec3(fract(aSeed*13.7)-.5, fract(aSeed*29.3)-.5, fract(aSeed*41.9)-.5) * 2.0;
      p += n * mid * uScatter * (0.4 + 0.6 * fract(aSeed * 3.3));
      // respiración: el objeto se hincha y deshincha muy despacio
      p *= 1.0 + uBreath * sin(uTime * 1.25 + aSeed * 0.3);
      // ondas de código: capa que emite copias del objeto expandiéndose y apagándose (3 ondas desfasadas)
      float wAlpha = 1.0;
      if (uWave > 0.5) {
        float wi = floor(aSeed * 3.0);
        float ph = fract(uTime / uWavePeriod + wi / 3.0);
        p *= 1.0 + uWaveAmp * ph * ph;
        wAlpha = pow(1.0 - ph, 1.6) * smoothstep(0.0, 0.08, ph) * 0.55 * smoothstep(1.3, 2.3, uIntroT);
      }
      // intro: cada partícula cae como gota desde arriba y se queda clavada al alcanzar su sitio
      float startY = 2.8 + fract(aSeed * 9.1) * 2.6;
      float landT = 0.4 + fract(aSeed * 7.13) * 0.8;            // todas aterrizan entre 0,4 y 1,2 s
      float speedI = (startY - p.y) / landT;
      float yR = startY - uIntroT * speedI;
      float landed = smoothstep(0.0, 0.5, p.y - yR);          // 0 cayendo · 1 aterrizada
      vec3 dropP = vec3(p.x + (fract(aSeed * 17.7) - 0.5) * 0.05, yR, p.z);
      float head = (1.0 - landed) * 1.1 + exp(-abs(p.y - yR) * 6.0) * 1.6;   // gota brillante + destello al aterrizar
      p = mix(dropP, p, landed);
      // pistas del chip: pulso que viaja del cerebro a los pines, al ritmo de la respiración
      float chipW = (si == 2 ? 1.0 - t : 0.0) + (sj == 2 ? t : 0.0);
      float tracePulse = aKind > 0.5 ? exp(-abs(fract(uTime / 1.25 + aSeed * 0.15) - aParam) * 9.0) * 1.8 * chipW : 0.0;
      // reflejo: copia espejada bajo el objeto, atenuada con la profundidad hacia abajo
      float refl = 1.0;
      if (uMirror > 0.5) { p.y = -2.9 - p.y; refl = smoothstep(-4.4, -1.6, p.y) * 0.32; }
      vAlpha = wAlpha * refl;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      // profundidad de campo falsa: lejos del plano focal, más grande y más tenue
      vSoft = clamp((abs(-mv.z - uFocus) - 0.6) / 3.0, 0.0, 1.0);   // zona nítida de ±0,6 alrededor del foco
      gl_Position = projectionMatrix * mv;
      float depth = -mv.z;
      gl_PointSize = uSize * uDpr * (5.0 / depth) * (0.75 + 0.5 * fract(aSeed * 5.1)) * (1.0 + vSoft * 0.9);
      vGlyph = aGlyph; vCol = aCol; vSeed = aSeed;
      // brillo: cabezas de lluvia durante la intro, pulso después
      // compensación de densidad: en código (volumen) cada partícula brilla más; en móvil/web (superficie) menos
      float dA = (si == 2) ? 0.9 : 0.45;
      float dB = (sj == 2) ? 0.9 : 0.45;
      float dens = mix(dA, dB, t);
      vFade = (0.30 + 0.20 * (sin(uTime * (1.0 + aSeed) + aSeed * 30.0) * 0.5 + 0.5) + head * 1.4 + mid * 0.5 + tracePulse) * dens;
    }`,
  fragmentShader: `
    uniform sampler2D uAtlas; uniform float uBright, uGreen, uTime;
    varying float vGlyph, vCol, vSeed, vFade, vAlpha, vSoft;
    void main(){
      // el glifo cambia de vez en cuando (mutación lenta)
      float g = mod(vGlyph + floor(uTime * (0.4 + vSeed * 0.8) + vSeed * 9.0), 128.0);
      vec2 cell = vec2(mod(g, 16.0), floor(g / 16.0));
      // atlas con flipY: v=1 es la parte superior; gl_PointCoord.y crece hacia abajo → glifo derecho
      vec2 uv = vec2((cell.x + gl_PointCoord.x) / 16.0, 1.0 - (cell.y + gl_PointCoord.y) / 8.0);
      float a = texture2D(uAtlas, uv).r;
      a = mix(a, a * 0.55 + 0.1 * smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)), vSoft); // desenfocado: glifo difuso
      if (a < 0.12) discard;
      vec3 purple = vec3(0.65, 0.54, 0.98); vec3 lav = vec3(0.86, 0.80, 1.0); vec3 green = vec3(0.20, 0.83, 0.60);
      vec3 c = mix(purple, lav, vCol * 0.5);
      if (vCol < uGreen) c = green;
      gl_FragColor = vec4(c * vFade * uBright * vAlpha * (1.0 - vSoft * 0.3), a * 0.9 * vAlpha * (1.0 - vSoft * 0.3));
    }`,
});
const points = new THREE.Points(geo, mat); group.add(points);
const waveMat = mat.clone(); waveMat.uniforms = THREE.UniformsUtils.clone(mat.uniforms); waveMat.uniforms.uAtlas.value = mat.uniforms.uAtlas.value; waveMat.uniforms.uWave.value = 1; waveMat.uniforms.uSize.value = P.size * 0.7;
const waveGeo = geo.clone(); waveGeo.setDrawRange(0, Math.floor(N * 0.28));
const waves = new THREE.Points(waveGeo, waveMat); group.add(waves);
const mirrorMat = mat.clone(); mirrorMat.uniforms = THREE.UniformsUtils.clone(mat.uniforms); mirrorMat.uniforms.uAtlas.value = mat.uniforms.uAtlas.value; mirrorMat.uniforms.uMirror.value = 1;
const mirror = new THREE.Points(geo, mirrorMat); group.add(mirror);

/* ---------- ciclo de estados ---------- */
let state = 0, phase = 'hold', pt = 0, prog = 0;
const labels = [...document.querySelectorAll('#stateLabel span')];
function advance(dt) {
  if (intro.t < 1.5) { pt = 0; return; }   // durante la intro el móvil se mantiene
  pt += dt;
  if (phase === 'hold') { prog = state; if (pt >= P.hold) { phase = 'morph'; pt = 0; } }
  else { const f = Math.min(1, pt / P.morph); prog = state + f; if (f >= 1) { state = (state + 1) % 3; phase = 'hold'; pt = 0; prog = state; } }
  mat.uniforms.uProg.value = prog;
  labels.forEach((l, i) => l.classList.toggle('is-active', i === (phase === 'hold' ? state : (pt / P.morph > .5 ? (state + 1) % 3 : state))));
}
document.getElementById('next').addEventListener('click', () => { if (phase === 'hold') { phase = 'morph'; pt = 0; } });

/* ---------- rotación, arrastre y paralaje ---------- */
const stage = document.getElementById('stage');
let dragging = false, lastX = 0, lastY = 0, velX = 0, velY = 0, rotY = 0, rotX = 0, tiltX = 0, tiltY = 0;
stage.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; stage.setPointerCapture(e.pointerId); });
stage.addEventListener('pointermove', (e) => { if (dragging) { velX = (e.clientX - lastX) * 0.006; velY = (e.clientY - lastY) * 0.004; rotY += velX; rotX += velY; lastX = e.clientX; lastY = e.clientY; } });
stage.addEventListener('pointerup', () => { dragging = false; }); stage.addEventListener('pointercancel', () => { dragging = false; });
addEventListener('pointermove', (e) => { tiltX = (e.clientX / innerWidth - .5); tiltY = (e.clientY / innerHeight - .5); }, { passive: true });

/* ---------- bucle ---------- */
let rightX = 0, rightY = 0, objScale = 1;
function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); composer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
  const r = stage.getBoundingClientRect(); const vh = 2 * camera.position.z * Math.tan(camera.fov * Math.PI / 360), vw = vh * camera.aspect;
  rightX = ((r.left + r.width / 2) / w - 0.5) * vw; rightY = (0.5 - (r.top + r.height / 2) / h) * vh;
  objScale = Math.min(1, (r.height / h) * vh / 4.4, (r.width / w) * vw / 3.6);
}
resize(); addEventListener('resize', resize, { passive: true });
let last = performance.now(), frames = 0, fpsT = 0;
const fpsEl = document.getElementById('fps'); document.getElementById('count').textContent = N;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  advance(dt); tickChars(dt);
  if (!dragging) {
    velX *= 0.92; velY *= 0.92;
    const chipNow = state === 2 && phase === 'hold' || (phase === 'morph' && ((state + 1) % 3 === 2 && pt / P.morph > 0.4 || state === 2 && pt / P.morph < 0.6));
    if (chipNow) {   // chip: vaivén de cara a la cámara (se fija a la vuelta entera más cercana)
      const base = Math.round(rotY / (2 * Math.PI)) * 2 * Math.PI, target = base + Math.sin(now / 1000 * 0.45) * 0.38;
      rotY += (target - rotY) * 0.035 + velX; rotX += (0 - rotX) * 0.05 + velY;
    } else { rotY += velX + P.rot * dt; rotX += velY; rotX *= 0.98; }
  }
  group.rotation.y = rotY + tiltX * 0.25; group.rotation.x = rotX + tiltY * 0.18;
  const k = intro.k;  // 0 = lluvia centrada a pantalla completa, 1 = objeto en su columna
  group.position.set(rightX * k, rightY * k, 0); group.scale.setScalar(1 + (objScale - 1) * k);
  mat.uniforms.uIntroT.value = intro.t; waveMat.uniforms.uIntroT.value = intro.t;
  for (const u of ['uTime', 'uProg', 'uBright', 'uGreen', 'uRain', 'uScatter', 'uBreath', 'uWavePeriod', 'uWaveAmp', 'uSize', 'uFocus']) { waveMat.uniforms[u].value = u === 'uSize' ? mat.uniforms.uSize.value * 0.7 : mat.uniforms[u].value; mirrorMat.uniforms[u].value = mat.uniforms[u].value; }
  mirrorMat.uniforms.uIntroT.value = intro.t; mirror.visible = P.mirror > 0; mirrorMat.uniforms.uBright.value = mat.uniforms.uBright.value * P.mirror;
  mat.uniforms.uTime.value = now / 1000;
  bloom.strength = P.bloom; bloom.threshold = P.bloomth; mat.uniforms.uFocus.value = P.focus;
  if (P.bloom > 0) composer.render(); else renderer.render(scene, camera);
  frames++; if (now - fpsT > 1000) { fpsEl.textContent = frames; frames = 0; fpsT = now; }
  requestAnimationFrame(frame);
}
if (!reduce) { requestAnimationFrame(frame); requestAnimationFrame(() => canvas.classList.add('is-on')); }

/* ---------- intro de primera visita: lluvia Matrix que forma textos y objeto (una vez por sesión) ---------- */
const intro = { k: 1, t: 100 };
const GL = '{}[]()<>=;:/*+-_$#@!?&|0123456789abcdefghijklmnopqrstuvwxyz';
const rg = () => GL[Math.floor(Math.random() * GL.length)];
/* divide el texto en caracteres (spans) conservando el layout; devuelve la lista con sus rects */
function splitChars(el) {
  const out = [];
  const walk = (n) => {
    for (const c of [...n.childNodes]) {
      if (c.nodeType === 3 && c.textContent.trim()) {
        const flex = /flex|grid/.test(getComputedStyle(c.parentElement).display);   // en flex/grid cada span sería un item: se envuelve el texto
        const frag = flex ? document.createElement('span') : document.createDocumentFragment();
        for (const word of c.textContent.split(/(\s+)/)) {
          if (!word) continue;
          if (/^\s+$/.test(word)) { frag.appendChild(document.createTextNode(' ')); continue; }
          const w = document.createElement('span'); w.className = 'w';                     // palabra indivisible
          for (const ch of word) { const sp = document.createElement('span'); sp.className = 'ch'; sp.textContent = ch; sp.dataset.ch = ch; w.appendChild(sp); out.push(sp); }
          frag.appendChild(w);
        }
        c.replaceWith(frag);
      } else if (c.nodeType === 1) walk(c);
    }
  };
  walk(el); return out;
}
/* caída de caracteres: mismo modelo que las partículas 3D (altura de salida aleatoria, velocidad constante, aterrizaje con destello) */
let drops = null;
function prepareChars() {
  const els = ['.nav__brand', '.nav__links', '.nav__right', '.badge', 'h1', '.sub', '.ctas'].map((q) => document.querySelector(q));
  const shells = [...document.querySelectorAll('.badge, .btn')]; shells.forEach((sh) => sh.classList.add('is-forming'));
  const vh = innerHeight;
  drops = els.flatMap(splitChars).map((el) => {
    const shell = el.closest('.badge, .btn');
    const start = -(0.35 + Math.random() * 0.75) * vh, landT = 0.4 + Math.random() * 0.8;
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
    if (d.y >= 0) { d.y = 0; d.landed = true; d.flash = 0.14 + Math.random() * 0.16; d.el.classList.remove('is-falling'); d.el.classList.add('is-wet'); d.el.style.transform = ''; d.el.textContent = rg();
      if (d.shell && !drops.some((o) => o.shell === d.shell && !o.landed)) d.shell.classList.remove('is-forming'); }
    else { d.el.style.transform = `translateY(${d.y}px)`; if (Math.random() < 0.3) d.el.textContent = rg(); }
  }
  if (!pending && drops.every((d) => d.flash <= 0)) { drops = null; }
}
function playIntro() {
  prepareChars();
  intro.t = 0; const t0 = performance.now();
  const tick = (now) => { intro.t = (now - t0) / 1000; if (intro.t < 3) requestAnimationFrame(tick); else intro.t = 100; };
  requestAnimationFrame(tick);
}
const firstVisit = !sessionStorage.getItem('intro_seen') || location.search.includes('intro');
if (firstVisit && !reduce) { playIntro(); sessionStorage.setItem('intro_seen', '1'); }
document.getElementById('replay').addEventListener('click', playIntro);

/* ---------- fondo: capas con variables CSS ---------- */
document.querySelectorAll('#panel [data-layer]').forEach((cb) => { const apply = () => document.getElementById('bg-' + cb.dataset.layer).hidden = !cb.checked; cb.addEventListener('change', apply); apply(); });
document.querySelectorAll('#panel [data-var]').forEach((el) => {
  const apply = () => { document.documentElement.style.setProperty(el.dataset.var, el.value + (el.dataset.unit || '')); const o = el.parentElement.querySelector('output'); if (o) o.value = el.value; };
  el.addEventListener('input', apply); apply();
});

/* ---------- panel ---------- */
const panel = document.getElementById('panel');
addEventListener('keydown', (e) => { if (e.key === 'c' && !e.metaKey && !e.ctrlKey) panel.hidden = !panel.hidden; });
const U = { size: 'uSize', bright: 'uBright', green: 'uGreen', rain: 'uRain', scatter: 'uScatter', breath: 'uBreath', wperiod: 'uWavePeriod', wamp: 'uWaveAmp' };
for (const k of Object.keys(P)) {
  const el = document.getElementById(k); if (!el) continue;
  el.addEventListener('input', () => { P[k] = +el.value; el.parentElement.querySelector('output').value = el.value; if (U[k]) mat.uniforms[U[k]].value = k === 'green' ? P[k] / 100 : P[k]; if (k === 'size') waveMat.uniforms.uSize.value = P.size * 0.7; });
}
