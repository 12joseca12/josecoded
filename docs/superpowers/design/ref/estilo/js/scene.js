/* josecoded · escena de partículas-glifo (hero aprobado `ref/hero-lab-3/`, sin el panel de ajustes).
   Ciclo móvil → web → chip IA. Añadido para esta demo: `uScroll`, el progreso de scroll del hero.

   Script clásico (no módulo) para que la demo se abra por `file://`: expone `window.GlyphScene`
   y el `index.html` le pasa THREE y los pases de post-proceso desde un módulo inline. */
(function () {
  'use strict';

  var P = { hold: 3.5, morph: 1.6, rot: .18, size: 16, bright: 1.0, green: .14, scatter: .6, breath: .025,
            wperiod: 4, wamp: .6, bloom: .3, bloomth: .72, focus: 6.2, mirror: .45 };
  var CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789{}[]()<>=;:.,/*+-_$#@!?&|\\\'"`~^%'.slice(0, 128);
  var rnd = function (a, b) { return a + Math.random() * (b - a); };

  function glyphAtlas(THREE) {
    var cols = 16, rows = 8, cell = 64;
    var c = document.createElement('canvas'); c.width = cols * cell; c.height = rows * cell;
    var x = c.getContext('2d');
    x.font = '600 ' + (cell * 0.72) + 'px "JetBrains Mono", ui-monospace, monospace';
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff';
    for (var i = 0; i < CHARS.length; i++) x.fillText(CHARS[i], (i % cols) * cell + cell / 2, Math.floor(i / cols) * cell + cell / 2 + 2);
    var t = new THREE.CanvasTexture(c); t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; return t;
  }

  /* ---------- nubes de destino (idénticas al hero aprobado) ---------- */
  function sampleShapes(n, shapes, depth, meta) {
    var a = new Float32Array(n * 3);
    var total = shapes.reduce(function (acc, sh) { return acc + sh.w; }, 0);
    for (var i = 0; i < n; i++) {
      var r = Math.random() * total, sh = shapes[0];
      for (var k = 0; k < shapes.length; k++) { if (r < shapes[k].w) { sh = shapes[k]; break; } r -= shapes[k].w; }
      var x = 0, y = 0, z = depth / 2 + 0.01;
      if (sh.t === 'seg') {
        var u = Math.random();
        x = sh.x1 + (sh.x2 - sh.x1) * u + rnd(-sh.th, sh.th);
        y = sh.y1 + (sh.y2 - sh.y1) * u + rnd(-sh.th, sh.th);
        if (meta && sh.trace) { meta.kind[i] = 1; meta.param[i] = u; }
      } else if (sh.t === 'rect') {
        var per = 2 * (sh.w2 + sh.h2), uu = Math.random() * per, px = sh.x, py = sh.y, W = sh.w2, H = sh.h2;
        if (uu < W) { x = px - W / 2 + uu; y = py + H / 2; }
        else if (uu < W + H) { x = px + W / 2; y = py + H / 2 - (uu - W); }
        else if (uu < 2 * W + H) { x = px + W / 2 - (uu - W - H); y = py - H / 2; }
        else { x = px - W / 2; y = py - H / 2 + (uu - 2 * W - H); }
        if (sh.side) z = rnd(-depth / 2, depth / 2);
      } else if (sh.t === 'fill') {
        x = sh.x + rnd(-sh.w2 / 2, sh.w2 / 2); y = sh.y + rnd(-sh.h2 / 2, sh.h2 / 2);
        if (sh.back) z = -depth / 2 - 0.01;
      } else if (sh.t === 'dot') {
        var ang = Math.random() * 6.283, rr = Math.sqrt(Math.random()) * sh.r;
        x = sh.x + Math.cos(ang) * rr; y = sh.y + Math.sin(ang) * rr;
      }
      a[i * 3] = x; a[i * 3 + 1] = y; a[i * 3 + 2] = z;
    }
    return a;
  }
  function cloudPhone(n) {
    var W = 1.3, H = 2.6, d = 0.14, sh = [];
    sh.push({ t: 'rect', x: 0, y: 0, w2: W, h2: H, w: 16, side: true });
    sh.push({ t: 'rect', x: 0, y: 0, w2: W - 0.12, h2: H - 0.12, w: 8 });
    sh.push({ t: 'fill', x: 0, y: 0, w2: W - 0.16, h2: H - 0.16, w: 10 });
    sh.push({ t: 'fill', x: 0, y: 0, w2: W, h2: H, w: 5, back: true });
    sh.push({ t: 'seg', x1: -0.16, y1: H / 2 - 0.13, x2: 0.16, y2: H / 2 - 0.13, th: 0.02, w: 5 });
    sh.push({ t: 'seg', x1: -W / 2 + 0.14, y1: H / 2 - 0.3, x2: -W / 2 + 0.38, y2: H / 2 - 0.3, th: 0.012, w: 2 });
    sh.push({ t: 'seg', x1: W / 2 - 0.36, y1: H / 2 - 0.3, x2: W / 2 - 0.14, y2: H / 2 - 0.3, th: 0.012, w: 2 });
    for (var r = 0; r < 5; r++) for (var c = 0; c < 4; c++) sh.push({ t: 'dot', x: -W / 2 + 0.26 + c * 0.26, y: H / 2 - 0.62 - r * 0.3, r: 0.075, w: 1.3 });
    sh.push({ t: 'seg', x1: -W / 2 + 0.16, y1: -H / 2 + 0.36, x2: W / 2 - 0.16, y2: -H / 2 + 0.36, th: 0.01, w: 2 });
    for (var c2 = 0; c2 < 4; c2++) sh.push({ t: 'dot', x: -W / 2 + 0.26 + c2 * 0.26, y: -H / 2 + 0.2, r: 0.08, w: 1.5 });
    sh.push({ t: 'seg', x1: -0.22, y1: -H / 2 + 0.06, x2: 0.22, y2: -H / 2 + 0.06, th: 0.008, w: 1.5 });
    return sampleShapes(n, sh, d);
  }
  function cloudWeb(n) {
    var W = 3.2, H = 2.1, d = 0.08, sh = [], top = H / 2, c;
    sh.push({ t: 'rect', x: 0, y: 0, w2: W, h2: H, w: 14, side: true });
    sh.push({ t: 'fill', x: 0, y: 0, w2: W, h2: H, w: 6, back: true });
    sh.push({ t: 'seg', x1: -W / 2, y1: top - 0.26, x2: W / 2, y2: top - 0.26, th: 0.008, w: 4 });
    for (c = 0; c < 3; c++) sh.push({ t: 'dot', x: -W / 2 + 0.14 + c * 0.11, y: top - 0.13, r: 0.03, w: 1.2 });
    sh.push({ t: 'rect', x: 0.15, y: top - 0.13, w2: 1.6, h2: 0.12, w: 5 });
    sh.push({ t: 'seg', x1: -W / 2 + 0.2, y1: top - 0.5, x2: -W / 2 + 0.6, y2: top - 0.5, th: 0.012, w: 2 });
    for (c = 0; c < 4; c++) sh.push({ t: 'seg', x1: W / 2 - 1.5 + c * 0.34, y1: top - 0.5, x2: W / 2 - 1.3 + c * 0.34, y2: top - 0.5, th: 0.01, w: 1 });
    sh.push({ t: 'seg', x1: -W / 2 + 0.2, y1: top - 0.85, x2: -W / 2 + 1.5, y2: top - 0.85, th: 0.035, w: 5 });
    sh.push({ t: 'seg', x1: -W / 2 + 0.2, y1: top - 1.02, x2: -W / 2 + 1.1, y2: top - 1.02, th: 0.035, w: 4 });
    sh.push({ t: 'seg', x1: -W / 2 + 0.2, y1: top - 1.22, x2: -W / 2 + 1.4, y2: top - 1.22, th: 0.01, w: 2 });
    sh.push({ t: 'seg', x1: -W / 2 + 0.2, y1: top - 1.32, x2: -W / 2 + 1.2, y2: top - 1.32, th: 0.01, w: 2 });
    sh.push({ t: 'rect', x: -W / 2 + 0.42, y: top - 1.55, w2: 0.44, h2: 0.14, w: 3 });
    sh.push({ t: 'rect', x: W / 2 - 0.85, y: top - 1.05, w2: 1.2, h2: 0.8, w: 7 });
    sh.push({ t: 'fill', x: W / 2 - 0.85, y: top - 1.05, w2: 1.2, h2: 0.8, w: 3 });
    for (c = 0; c < 3; c++) sh.push({ t: 'rect', x: -W / 2 + 0.55 + c * 1.05, y: -H / 2 + 0.22, w2: 0.9, h2: 0.26, w: 3 });
    return sampleShapes(n, sh, d);
  }
  function cloudBrain(n) {
    var surf = function (u, v) {
      var cu = Math.cos(u), su = Math.sin(u), cv = Math.cos(v), sv = Math.sin(v);
      var fold = 1 + 0.045 * Math.sin(7 * u + 2 * v) * Math.cos(5 * v) + 0.03 * Math.sin(11 * v + 3 * u);
      var x = 1.25 * cu * cv * fold + 0.05, y = 0.95 * sv * fold + 0.12, z = 0.85 * su * cv * fold;
      if (y < -0.42) y = -0.42 + (y + 0.42) * 0.25;
      if (y > 0.5 && Math.abs(z) < 0.12) y -= 0.09 * (1 - Math.abs(z) / 0.12);
      return [x, y, z];
    };
    var pts = [], i, u, v;
    for (i = 0; i < 900; i++) { u = Math.random() * 6.283; v = Math.asin(Math.random() * 2 - 1); pts.push(surf(u, v)); }
    for (i = 0; i < 160; i++) { u = Math.random() * 6.283; v = Math.asin(Math.random() * 2 - 1);
      pts.push([-0.78 + 0.46 * Math.cos(u) * Math.cos(v), -0.58 + 0.3 * Math.sin(v), 0.38 * Math.sin(u) * Math.cos(v)]); }
    for (i = 0; i < 40; i++) pts.push([-0.28 + rnd(-0.1, 0.1), -0.62 - Math.random() * 0.42, rnd(-0.1, 0.1)]);
    var nodes = [];
    for (var pi = 0; pi < pts.length; pi++) {
      var p = pts[pi]; if (nodes.length >= 120) break;
      var ok = true;
      for (var q = 0; q < nodes.length; q++) { var d = Math.hypot(p[0] - nodes[q][0], p[1] - nodes[q][1], p[2] - nodes[q][2]); if (d <= 0.24) { ok = false; break; } }
      if (ok) nodes.push(p);
    }
    var edges = [];
    for (var k = 0; k < nodes.length; k++) for (var j = k + 1; j < nodes.length; j++) {
      var dd = Math.hypot(nodes[k][0] - nodes[j][0], nodes[k][1] - nodes[j][1], nodes[k][2] - nodes[j][2]);
      if (dd < 0.46) edges.push([k, j]);
    }
    var a = new Float32Array(n * 3);
    for (i = 0; i < n; i++) {
      if (Math.random() < 0.32) { var nd = nodes[i % nodes.length];
        a[i * 3] = nd[0] + rnd(-.05, .05); a[i * 3 + 1] = nd[1] + rnd(-.05, .05); a[i * 3 + 2] = nd[2] + rnd(-.05, .05);
      } else { var e = edges[i % edges.length], t = Math.random(), A = nodes[e[0]], B = nodes[e[1]];
        a[i * 3] = A[0] + (B[0] - A[0]) * t; a[i * 3 + 1] = A[1] + (B[1] - A[1]) * t; a[i * 3 + 2] = A[2] + (B[2] - A[2]) * t; }
    }
    return a;
  }
  var chipMeta = null;
  function cloudChipBrain(n) {
    var S = 2.5, d = 0.12, sh = [], pins = 9, i;
    sh.push({ t: 'rect', x: 0, y: 0, w2: S, h2: S, w: 16, side: true });
    sh.push({ t: 'rect', x: 0, y: 0, w2: S - 0.22, h2: S - 0.22, w: 6 });
    sh.push({ t: 'fill', x: 0, y: 0, w2: S, h2: S, w: 5, back: true });
    for (i = 0; i < pins; i++) {
      var o = -S / 2 + 0.25 + i * ((S - 0.5) / (pins - 1));
      sh.push({ t: 'seg', x1: o, y1: S / 2, x2: o, y2: S / 2 + 0.22, th: 0.02, w: 1.2 });
      sh.push({ t: 'seg', x1: o, y1: -S / 2, x2: o, y2: -S / 2 - 0.22, th: 0.02, w: 1.2 });
      sh.push({ t: 'seg', x1: S / 2, y1: o, x2: S / 2 + 0.22, y2: o, th: 0.02, w: 1.2 });
      sh.push({ t: 'seg', x1: -S / 2, y1: o, x2: -S / 2 - 0.22, y2: o, th: 0.02, w: 1.2 });
    }
    for (i = 0; i < 4; i++) {
      var sx = i % 2 ? 1 : -1, sy = i < 2 ? 1 : -1;
      sh.push({ t: 'seg', x1: sx * (S / 2 - 0.2), y1: sy * (S / 2 - 0.34), x2: sx * (S / 2 - 0.2), y2: sy * (S / 2 - 0.2), th: 0.012, w: 0.6 });
      sh.push({ t: 'seg', x1: sx * (S / 2 - 0.34), y1: sy * (S / 2 - 0.2), x2: sx * (S / 2 - 0.2), y2: sy * (S / 2 - 0.2), th: 0.012, w: 0.6 });
    }
    var R = 0.78;
    for (i = 0; i < 12; i++) {
      var ang = i * Math.PI / 6 + Math.PI / 12, ex = Math.cos(ang) * R, ey = Math.sin(ang) * R;
      var horiz = Math.abs(Math.cos(ang)) > Math.abs(Math.sin(ang));
      var tx = horiz ? Math.sign(Math.cos(ang)) * (S / 2 - 0.16) : ex * 1.6;
      var ty = horiz ? ey * 1.6 : Math.sign(Math.sin(ang)) * (S / 2 - 0.16);
      sh.push({ t: 'seg', x1: ex, y1: ey, x2: tx, y2: ty, th: 0.01, w: 1.6, trace: true });
      sh.push({ t: 'dot', x: tx, y: ty, r: 0.035, w: 0.5 });
    }
    var nChip = Math.floor(n * 0.42), nBrain = n - nChip;
    var meta = { kind: new Float32Array(n), param: new Float32Array(n) };
    var chip = sampleShapes(nChip, sh, d, meta), brain = cloudBrain(nBrain);
    chipMeta = meta;
    var a = new Float32Array(n * 3);
    a.set(chip, 0);
    for (i = 0; i < nBrain; i++) {
      a[(nChip + i) * 3] = brain[i * 3] * 0.6;
      a[(nChip + i) * 3 + 1] = brain[i * 3 + 1] * 0.6 - 0.02;
      a[(nChip + i) * 3 + 2] = brain[i * 3 + 2] * 0.35 + d / 2 + 0.1;
    }
    return a;
  }

  /* ---------- API ---------- */
  var api = { ready: false, scroll: 0 };

  api.init = function (THREE, Composer, RenderPass, BloomPass, opts) {
    var canvas = opts.canvas, stage = opts.stage, onCycle = opts.onCycle || function () {};
    var N = innerWidth < 640 ? 5000 : 9000;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setClearColor(0x05060f, 1);
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    var composer = new Composer(renderer);
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50); camera.position.set(0, 0, 6.2);
    var group = new THREE.Group(); scene.add(group);
    var bloom = new BloomPass(new THREE.Vector2(innerWidth, innerHeight), P.bloom, 0.3, P.bloomth);
    composer.addPass(new RenderPass(scene, camera)); composer.addPass(bloom);

    var geo = new THREE.BufferGeometry();
    var t0 = cloudPhone(N), t1 = cloudWeb(N), t2 = cloudChipBrain(N);
    geo.setAttribute('position', new THREE.BufferAttribute(t0.slice(), 3));
    geo.setAttribute('aT0', new THREE.BufferAttribute(t0, 3));
    geo.setAttribute('aT1', new THREE.BufferAttribute(t1, 3));
    geo.setAttribute('aT2', new THREE.BufferAttribute(t2, 3));
    var seed = new Float32Array(N), glyph = new Float32Array(N), col = new Float32Array(N);
    for (var i = 0; i < N; i++) { seed[i] = Math.random(); glyph[i] = Math.floor(Math.random() * CHARS.length); col[i] = Math.random(); }
    geo.setAttribute('aKind', new THREE.BufferAttribute(chipMeta.kind, 1));
    geo.setAttribute('aParam', new THREE.BufferAttribute(chipMeta.param, 1));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    geo.setAttribute('aGlyph', new THREE.BufferAttribute(glyph, 1));
    geo.setAttribute('aCol', new THREE.BufferAttribute(col, 1));

    var mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 }, uProg: { value: 0 }, uScroll: { value: 0 }, uWave: { value: 0 },
        uWavePeriod: { value: P.wperiod }, uWaveAmp: { value: P.wamp }, uBreath: { value: P.breath },
        uMirror: { value: 0 }, uFocus: { value: P.focus }, uSize: { value: P.size }, uBright: { value: P.bright },
        uGreen: { value: P.green }, uScatter: { value: P.scatter },
        uAtlas: { value: glyphAtlas(THREE) }, uDpr: { value: renderer.getPixelRatio() }
      },
      vertexShader: [
        'attribute vec3 aT0, aT1, aT2; attribute float aSeed, aGlyph, aCol, aKind, aParam;',
        'uniform float uTime, uProg, uScroll, uSize, uScatter, uDpr, uWave, uWavePeriod, uWaveAmp, uBreath, uMirror, uFocus;',
        'varying float vGlyph, vCol, vSeed, vFade, vAlpha, vSoft;',
        'float ease(float t){ return t*t*(3.0-2.0*t); }',
        'void main(){',
        '  float s = floor(uProg); float f = fract(uProg);',
        '  int si = int(mod(s, 3.0)); int sj = int(mod(s + 1.0, 3.0));',
        '  vec3 A = si==0?aT0:si==1?aT1:aT2;',
        '  vec3 B = sj==0?aT0:sj==1?aT1:aT2;',
        '  float t = clamp((f - aSeed * 0.25) / 0.75, 0.0, 1.0); t = ease(t);',
        '  vec3 p = mix(A, B, t);',
        '  float mid = sin(t * 3.14159);',
        '  vec3 n = vec3(fract(aSeed*13.7)-.5, fract(aSeed*29.3)-.5, fract(aSeed*41.9)-.5) * 2.0;',
        '  p += n * mid * uScatter * (0.4 + 0.6 * fract(aSeed * 3.3));',
        '  p *= 1.0 + uBreath * sin(uTime * 1.25 + aSeed * 0.3);',
        '  float wAlpha = 1.0;',
        '  if (uWave > 0.5) {',
        '    float wi = floor(aSeed * 3.0);',
        '    float ph = fract(uTime / uWavePeriod + wi / 3.0);',
        '    p *= 1.0 + uWaveAmp * ph * ph;',
        '    wAlpha = pow(1.0 - ph, 1.6) * smoothstep(0.0, 0.08, ph) * 0.55;',
        '  }',
        /* --- scroll: el objeto se deshace en glifos que se dispersan HACIA ARRIBA y se apagan.
              Es función pura de uScroll → al subir la rueda, el objeto se recompone. --- */
        '  float sc = clamp(uScroll, 0.0, 1.0);',
        '  float lag = 0.15 + 0.85 * fract(aSeed * 11.3);',
        '  float d = clamp((sc - (1.0 - lag) * 0.35) / (0.65 + 0.35 * lag), 0.0, 1.0);',
        '  float de = d * d;',
        '  p.y += de * (2.2 + 5.0 * fract(aSeed * 7.7));',
        '  p.x += (fract(aSeed * 5.3) - 0.5) * de * 2.6;',
        '  p.z += (fract(aSeed * 19.1) - 0.5) * de * 1.8;',
        '  float burn = 1.0 - smoothstep(0.05, 0.95, d);',
        '  float tracePulse = aKind > 0.5 ? exp(-abs(fract(uTime / 1.25 + aSeed * 0.15) - aParam) * 9.0) * 1.8 : 0.0;',
        '  float refl = 1.0;',
        '  if (uMirror > 0.5) { p.y = -2.9 - p.y; refl = smoothstep(-4.4, -1.6, p.y) * 0.32; }',
        '  vAlpha = wAlpha * refl * burn;',
        '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
        '  vSoft = clamp((abs(-mv.z - uFocus) - 0.6) / 3.0, 0.0, 1.0);',
        '  gl_Position = projectionMatrix * mv;',
        '  float depth = -mv.z;',
        '  gl_PointSize = uSize * uDpr * (5.0 / depth) * (0.75 + 0.5 * fract(aSeed * 5.1)) * (1.0 + vSoft * 0.9);',
        '  vGlyph = aGlyph; vCol = aCol; vSeed = aSeed;',
        '  float dA = (si == 2) ? 0.9 : 0.45;',
        '  float dB = (sj == 2) ? 0.9 : 0.45;',
        '  float dens = mix(dA, dB, t);',
        '  vFade = (0.30 + 0.20 * (sin(uTime * (1.0 + aSeed) + aSeed * 30.0) * 0.5 + 0.5) + mid * 0.5 + tracePulse * (1.0 - sc)) * dens;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D uAtlas; uniform float uBright, uGreen, uTime;',
        'varying float vGlyph, vCol, vSeed, vFade, vAlpha, vSoft;',
        'void main(){',
        '  float g = mod(vGlyph + floor(uTime * (0.4 + vSeed * 0.8) + vSeed * 9.0), 128.0);',
        '  vec2 cell = vec2(mod(g, 16.0), floor(g / 16.0));',
        '  vec2 uv = vec2((cell.x + gl_PointCoord.x) / 16.0, 1.0 - (cell.y + gl_PointCoord.y) / 8.0);',
        '  float a = texture2D(uAtlas, uv).r;',
        '  a = mix(a, a * 0.55 + 0.1 * smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)), vSoft);',
        '  if (a < 0.12) discard;',
        '  vec3 purple = vec3(0.65, 0.54, 0.98); vec3 lav = vec3(0.86, 0.80, 1.0); vec3 green = vec3(0.20, 0.83, 0.60);',
        '  vec3 c = mix(purple, lav, vCol * 0.5);',
        '  if (vCol < uGreen) c = green;',
        '  gl_FragColor = vec4(c * vFade * uBright * vAlpha * (1.0 - vSoft * 0.3), a * 0.9 * vAlpha * (1.0 - vSoft * 0.3));',
        '}'
      ].join('\n')
    });

    var points = new THREE.Points(geo, mat); group.add(points);
    var waveMat = mat.clone(); waveMat.uniforms = THREE.UniformsUtils.clone(mat.uniforms);
    waveMat.uniforms.uAtlas.value = mat.uniforms.uAtlas.value; waveMat.uniforms.uWave.value = 1; waveMat.uniforms.uSize.value = P.size * 0.7;
    var waveGeo = geo.clone(); waveGeo.setDrawRange(0, Math.floor(N * 0.28));
    group.add(new THREE.Points(waveGeo, waveMat));
    var mirrorMat = mat.clone(); mirrorMat.uniforms = THREE.UniformsUtils.clone(mat.uniforms);
    mirrorMat.uniforms.uAtlas.value = mat.uniforms.uAtlas.value; mirrorMat.uniforms.uMirror.value = 1;
    mirrorMat.uniforms.uBright.value = P.bright * P.mirror;
    group.add(new THREE.Points(geo, mirrorMat));

    /* ---------- ciclo de estados ---------- */
    var state = 0, phase = 'hold', pt = 0, prog = 0;
    function advance(dt) {
      pt += dt;
      if (phase === 'hold') { prog = state; if (pt >= P.hold) { phase = 'morph'; pt = 0; } }
      else {
        var f = Math.min(1, pt / P.morph); prog = state + f;
        if (f >= 1) { state = (state + 1) % 3; phase = 'hold'; pt = 0; prog = state; }
      }
      mat.uniforms.uProg.value = prog;
      onCycle(phase === 'hold' ? state : (pt / P.morph > .5 ? (state + 1) % 3 : state));
    }

    /* ---------- arrastre y paralaje del puntero ---------- */
    var dragging = false, lastX = 0, lastY = 0, velX = 0, velY = 0, rotY = 0, rotX = 0, tiltX = 0, tiltY = 0;
    stage.addEventListener('pointerdown', function (e) { dragging = true; lastX = e.clientX; lastY = e.clientY; stage.setPointerCapture(e.pointerId); });
    stage.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      velX = (e.clientX - lastX) * 0.006; velY = (e.clientY - lastY) * 0.004;
      rotY += velX; rotX += velY; lastX = e.clientX; lastY = e.clientY;
    });
    stage.addEventListener('pointerup', function () { dragging = false; });
    stage.addEventListener('pointercancel', function () { dragging = false; });
    addEventListener('pointermove', function (e) { tiltX = (e.clientX / innerWidth - .5); tiltY = (e.clientY / innerHeight - .5); }, { passive: true });

    /* ---------- bucle ---------- */
    var rightX = 0, rightY = 0, objScale = 1;
    function resize() {
      var w = innerWidth, h = innerHeight;
      renderer.setSize(w, h, false); composer.setSize(w, h);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      var r = stage.getBoundingClientRect();
      var vh = 2 * camera.position.z * Math.tan(camera.fov * Math.PI / 360), vw = vh * camera.aspect;
      rightX = ((r.left + r.width / 2) / w - 0.5) * vw;
      rightY = (0.5 - (r.top + r.height / 2) / h) * vh;
      objScale = Math.min(1, (r.height / h) * vh / 4.4, (r.width / w) * vw / 3.6);
    }
    resize(); addEventListener('resize', resize, { passive: true });

    var last = performance.now(), running = false, frames = 0, fpsT = last;
    api.fps = 0;
    function frame(now) {
      if (!running) return;
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (api.scroll < 1) advance(dt);
      if (!dragging) {
        velX *= 0.92; velY *= 0.92;
        var chipNow = (state === 2 && phase === 'hold') ||
          (phase === 'morph' && (((state + 1) % 3 === 2 && pt / P.morph > 0.4) || (state === 2 && pt / P.morph < 0.6)));
        if (chipNow) {
          var base = Math.round(rotY / (2 * Math.PI)) * 2 * Math.PI, target = base + Math.sin(now / 1000 * 0.45) * 0.38;
          rotY += (target - rotY) * 0.035 + velX; rotX += (0 - rotX) * 0.05 + velY;
        } else { rotY += velX + P.rot * dt; rotX += velY; rotX *= 0.98; }
      }
      group.rotation.y = rotY + tiltX * 0.25; group.rotation.x = rotX + tiltY * 0.18;
      group.position.set(rightX, rightY, 0); group.scale.setScalar(objScale);
      mat.uniforms.uTime.value = now / 1000;
      mat.uniforms.uScroll.value = api.scroll;
      var keys = ['uTime', 'uProg', 'uScroll', 'uGreen', 'uScatter', 'uBreath', 'uWavePeriod', 'uWaveAmp', 'uFocus'];
      for (var k = 0; k < keys.length; k++) {
        waveMat.uniforms[keys[k]].value = mat.uniforms[keys[k]].value;
        mirrorMat.uniforms[keys[k]].value = mat.uniforms[keys[k]].value;
      }
      composer.render();
      frames++; if (now - fpsT > 1000) { api.fps = frames; frames = 0; fpsT = now; }
      /* el hero se ha deshecho del todo: se para la escena (no se gasta GPU en el resto de la página) */
      if (api.scroll >= 1 || document.hidden) { running = false; return; }
      requestAnimationFrame(frame);
    }
    function start() {
      if (running || api.scroll >= 1 || document.hidden) return;
      running = true; last = performance.now(); requestAnimationFrame(frame);
    }
    api.start = start;
    api.resize = resize;
    api.setGreen = function (v) { mat.uniforms.uGreen.value = v; };
    api.setScroll = function (p) {
      api.scroll = p;
      if (!running) {
        if (p < 1 && !document.hidden) start();
        else { mat.uniforms.uScroll.value = p; composer.render(); }   /* un fotograma final para dejarlo deshecho */
      }
    };
    document.addEventListener('visibilitychange', function () { if (!document.hidden) start(); });
    api.ready = true;
    start();
    requestAnimationFrame(function () { canvas.classList.add('is-on'); });
  };

  window.GlyphScene = api;
})();
