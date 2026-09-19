/* Luz volumétrica 2D: rayos estriados desde la esquina, niebla y bokeh con paralaje.
   Un solo programa, sin librería, media resolución, screen-blend sobre el código.
   Se carga en diferido; si WebGL no está o falla, devuelve null y la página sigue igual. */

const VS = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;

const FS = `precision mediump float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse;
uniform vec3 uAccent; uniform vec3 uCool;
uniform float uIntensity, uBeam, uFog, uSpeed;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float v = 0., a = .5; for(int i=0;i<3;i++){ v += a*noise(p); p = p*2.03 + 17.1; a *= .5; } return v; }
float disc(vec2 p, vec2 c, float r){ float d = length(p - c); return smoothstep(r, r*.72, d) * (0.55 + 0.45*smoothstep(r*.2, r*.9, d)); }

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 q = vec2(uv.x * aspect, uv.y);
  float t = uTime * uSpeed;
  vec2 m = uMouse - .5;

  // rayos desde la esquina superior izquierda, con estrías que giran muy despacio
  vec2 L = vec2(-0.02 * aspect + m.x*.05, 1.06 + m.y*.03);
  vec2 d = q - L; float dist = length(d); vec2 dir = d / max(dist, 1e-3);
  float ang = atan(dir.y, dir.x);
  float streak = smoothstep(.35, .8, fbm(vec2(ang * 9.0 + t*.06, dist * .6 - t*.02)));
  vec2 axis = normalize(vec2(.55, -.83));
  float cone = exp(-pow(acos(clamp(dot(dir, axis), -1., 1.)), 2.) / (2. * uBeam * uBeam));
  float fall = exp(-dist * 1.5);
  float rays = cone * fall * (0.3 + 0.7 * streak) * 2.6;

  // niebla lenta
  float fog = fbm(q * 1.8 + vec2(t*.03, -t*.02));
  float haze = fall * (0.25 + 0.45 * fog) * uFog;

  // bokeh: discos a distintas profundidades, deriva lenta, paralaje con el ratón
  float bk = 0.;
  for (int i = 0; i < 22; i++) {
    float fi = float(i);
    vec2 h = vec2(hash(vec2(fi, 1.7)), hash(vec2(fi, 9.3)));
    float depth = mix(.25, 1., hash(vec2(fi, 4.2)));
    vec2 c = vec2(h.x * aspect, h.y);
    c += vec2(sin(t*.07 + fi), cos(t*.05 + fi*1.3)) * .03 * depth;
    c += m * .09 * depth;
    float r = mix(.012, .075, depth) * (0.8 + 0.4 * hash(vec2(fi, 2.2)));
    float a = mix(.14, .34, 1. - depth) * uFog;
    bk += disc(q, c, r) * a * (0.6 + 0.4 * fog);
  }

  float light = (rays + haze + bk) * uIntensity;
  vec3 col = uAccent * light;
  col += uCool * exp(-length(q - vec2(1.05*aspect, -.1)) * 2.4) * .12 * uIntensity;
  float vig = smoothstep(.0, .6, distance(uv, vec2(.5, .5)));
  col *= mix(.7, 1., vig);
  gl_FragColor = vec4(col, 1.);
}`;

export function createLight(canvas, getParams) {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'low-power' });
  if (!gl) return null;

  const compile = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {}; for (const n of ['uRes', 'uTime', 'uMouse', 'uAccent', 'uCool', 'uIntensity', 'uBeam', 'uFog', 'uSpeed']) U[n] = gl.getUniformLocation(prog, n);

  // resolución interna: mitad en escritorio, tercio en móvil / dpr alto
  const scale = () => (innerWidth < 640 || devicePixelRatio > 2 ? 1 / 3 : 1 / 2);
  const resize = () => { canvas.width = Math.max(1, Math.round(canvas.clientWidth * scale())); canvas.height = Math.max(1, Math.round(canvas.clientHeight * scale())); gl.viewport(0, 0, canvas.width, canvas.height); };
  resize(); addEventListener('resize', resize, { passive: true });

  const cssVar = (name) => getComputedStyle(document.body).getPropertyValue(name).trim();
  let accent = [0, 0, 0], cool = [0, 0, 0];
  const recolor = () => {
    accent = cssVar('--accent-rgb').split(/\s+/).map((v) => +v / 255);
    const mm = cssVar('--cool').match(/#([0-9a-f]{6})/i);
    cool = mm ? [0, 2, 4].map((i) => parseInt(mm[1].slice(i, i + 2), 16) / 255) : [.3, .55, .7];
  };
  recolor();

  const mouse = [.5, .5]; let target = [.5, .5];
  addEventListener('pointermove', (e) => { target = [e.clientX / innerWidth, 1 - e.clientY / innerHeight]; }, { passive: true });

  let running = true, t0 = performance.now(), lastFrame = 0, slow = 0;
  const frame = (now) => {
    if (!running) return;
    const p = getParams();
    if (p.on && !document.hidden) {
      // presupuesto: si el frame se pasa de 24 ms muchas veces seguidas, baja a un tercio de resolución
      if (lastFrame && now - lastFrame > 24) { if (++slow === 20) { canvas.width = Math.round(canvas.clientWidth / 3); canvas.height = Math.round(canvas.clientHeight / 3); gl.viewport(0, 0, canvas.width, canvas.height); } } else slow = 0;
      lastFrame = now;
      mouse[0] += (target[0] - mouse[0]) * .04; mouse[1] += (target[1] - mouse[1]) * .04;
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform1f(U.uTime, (now - t0) / 1000);
      gl.uniform2f(U.uMouse, mouse[0], mouse[1]);
      gl.uniform3fv(U.uAccent, accent); gl.uniform3fv(U.uCool, cool);
      gl.uniform1f(U.uIntensity, p.intensity); gl.uniform1f(U.uBeam, p.beam); gl.uniform1f(U.uFog, p.fog); gl.uniform1f(U.uSpeed, p.lspeed);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  requestAnimationFrame(() => requestAnimationFrame(() => canvas.classList.add('is-on')));
  new IntersectionObserver(([e]) => { running = e.isIntersecting; if (running) requestAnimationFrame(frame); }).observe(canvas);

  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const info = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL).replace(/ANGLE \(|\)/g, '').slice(0, 40) : 'webgl';
  return { recolor, info, destroy: () => { running = false; } };
}
