/* Túnel de código real (derivado del shader de Stitch) como módulo reutilizable.
   createTunnel(canvas, params) → { start, stop, set }. La textura de código se comparte entre instancias. */
const CODE = `const app = new Hono<{ Bindings: Env }>();
app.use('*', requestId);
app.use('*', securityHeaders);
app.route('/api/v1', v1Routes);
export default app;
// app/[locale]/page.tsx — React Server Component
export default async function Home() {
  const facts = await getBuildFacts();
  return <HeroIntro facts={facts} />;
}
export const dynamic = 'force-static';
create table public.affiliates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  code text not null unique,
  level text default 'standard'
);
alter table public.affiliates enable row level security;
create policy "own row" on public.affiliates
  for select using (auth.uid() = user_id);
const proposal = await classify(input, { model: 'llama-3.3-70b' });
const price = pricing.from(proposal.pack, proposal.extras);
await notify('lead.created', { id: lead.id, source: 'web' });
import { Flip } from 'gsap/Flip';
const state = Flip.getState('.title');
Flip.from(state, { duration: .7, ease: 'power3.inOut' });
select count(*) from leads where estado = 'nuevo';
type Pack = 'P1' | 'P2' | 'P3' | 'P4';
export async function POST(req: Request) {
  const body = await req.json();
  return Response.json({ ok: true });
}`.split('\n');

const KW = /\b(import|from|const|export|default|async|function|return|await|create|table|policy|alter|enable|using|select|for|type|count|where|on|not|null|references|primary|key|default|new|row|level|security)\b/;

function buildCodeTexture(greenAmount) {
  const W = 2048, H = 2048, ROW = 40, FONT = 27;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.clearRect(0, 0, W, H);
  x.font = `500 ${FONT}px "JetBrains Mono", ui-monospace, monospace`;
  x.textBaseline = 'middle';
  const rows = Math.floor(H / ROW);
  const paint = (t) => {
    let col = 'rgba(205,195,255,0.92)';
    if (/^['"]/.test(t) || /^\d+$/.test(t)) col = `rgba(52,211,153,${0.55 + greenAmount * 0.45})`;
    else if (KW.test(t)) col = 'rgba(167,139,250,1)';
    else if (/^(\/\/|--)/.test(t)) col = 'rgba(150,140,190,0.6)';
    else if (/^[^\w\s]+$/.test(t)) col = 'rgba(190,180,230,0.7)';
    return col;
  };
  for (let r = 0; r < rows; r++) {
    // cada fila: varias líneas de código seguidas hasta llenar el ancho (tile continuo en x)
    let cx = -((r * 131) % 400), cy = r * ROW + ROW / 2, k = r;
    while (cx < W) {
      const line = CODE[k++ % CODE.length].trim() + '   ';
      const tokens = line.match(/('[^']*'|"[^"]*"|\/\/.*$|--.*$|\w+|[^\w\s]+|\s+)/g) || [line];
      for (const t of tokens) { x.fillStyle = paint(t); x.fillText(t, cx, cy); cx += x.measureText(t).width; }
    }
  }
  return c;
}


let sharedTex = null;
function codeTexture(green) { if (!sharedTex) sharedTex = buildCodeTexture(green); return sharedTex; }

const VS = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0., 1.); }`;
const FS = `precision highp float;
uniform float u_time; uniform vec2 u_res; uniform vec2 u_mouse; uniform sampler2D u_code;
uniform float u_flow, u_bright, u_scale, u_clear, u_cad, u_dens, u_aura, u_green, u_cols;
const vec3 PURPLE = vec3(0.65, 0.54, 0.98);
const vec3 GREEN  = vec3(0.20, 0.83, 0.60);
const vec3 LAV    = vec3(0.80, 0.76, 1.00);

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float hash1(float n){ return fract(sin(n) * 43758.5453123); }

void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  float t = u_time;
  float loopT = mod(t, 20.0) / 20.0 * 6.28318530718;

  vec2 mouse = u_mouse / u_res; if (u_mouse.x <= 0.0 && u_mouse.y <= 0.0) mouse = vec2(0.5);
  vec2 m = (mouse - 0.5) * vec2(u_res.x / u_res.y, 1.0);
  float distMouse = length(p - m);

  // fondo obsidiana-índigo
  vec3 col = mix(vec3(0.016, 0.018, 0.055), vec3(0.030, 0.014, 0.062), uv.y + sin(uv.x * 2.5 + sin(loopT) * 0.5) * 0.15);

  // atenuación suave detrás del texto (nunca hueco): baja a un 35 % en el centro
  vec2 tc = vec2(p.x * 0.9, p.y * 1.9);
  float clearMask = smoothstep(u_clear * 0.45, u_clear * 1.05, length(tc));
  float textDim = mix(0.35, 1.0, clearMask);

  // TÚNEL: cámara en el origen, suelo y techo continuos hasta el punto de fuga; el ratón inclina un poco la cámara
  vec3 rd = normalize(vec3(p.x * 1.15 + m.x * 0.06, p.y + m.y * 0.05, 0.9));
  float planeY = rd.y < 0.0 ? -0.9 : 0.9;
  float tP = planeY / (abs(rd.y) < 0.001 ? (rd.y < 0.0 ? -0.001 : 0.001) : rd.y);
  vec3 hit = rd * tP;
  float isFloor = rd.y < 0.0 ? 1.0 : 0.0;
  float s = 1.0 / u_scale;

  // texto sobre el plano: x a lo ancho, z en profundidad; las filas fluyen hacia la cámara
  float flipV = isFloor > 0.5 ? 1.0 : -1.0;
  vec2 tuv = vec2(hit.x * 0.20 * s, hit.z * 0.075 * s * flipV + t * u_flow * 0.04 * flipV);
  vec4 tex = texture2D(u_code, fract(tuv));

  // MATRIX: por columna, una cabeza brillante recorre la profundidad hacia la cámara con estela
  float colId = floor(hit.x * u_cols);                 // columnas estrechas e independientes de la escala del texto
  float cseed = hash1(colId * 7.31 + isFloor * 3.0);
  float span = 26.0;
  float head = span - mod(t * (0.9 + cseed * 1.3) * (0.3 + u_flow) + cseed * span, span);   // z de la cabeza
  float dz = hit.z - head;
  float trail = exp(-max(dz, 0.0) * 0.16) * step(0.0, dz);                                    // estela detrás de la cabeza
  float headGlow = exp(-abs(dz) * 2.2);
  // brillo base por fila (pulso lento) + estela + cabeza
  float row = floor(fract(tuv.y) * 51.2);
  float base = 0.42 + 0.25 * pow(fract(hash1(row) * 3.0 + t * 0.02), 2.0);   // todo el código se lee; la estela y la cabeza se suman
  float bright = base + trail * 0.8 + headGlow * 1.4;

  float depthFade = exp(-tP * 0.11) * smoothstep(0.0, 0.6, tP);
  vec3 glyph = tex.rgb * tex.a;
  // la cabeza tira a blanco-verde (Matrix), la estela conserva el color de sintaxis
  vec3 gcol = mix(glyph, (glyph + vec3(0.35)) * mix(vec3(1.0), GREEN, 0.5), clamp(headGlow, 0.0, 1.0));
  col += gcol * bright * depthFade * textDim * u_bright;

  // retícula fina del túnel (líneas en x y en z)
  vec2 grid = abs(fract(vec2(hit.x * 1.6, hit.z * 0.55) - 0.5) - 0.5);
  float wire = smoothstep(0.035, 0.005, min(grid.x, grid.y));
  col += wire * PURPLE * 0.12 * depthFade * textDim;
  // punto de fuga: neblina hacia el fondo
  col = mix(col, vec3(0.03, 0.02, 0.07), smoothstep(8.0, 26.0, tP) * 0.8);

  // nodos: pocos, cadencia larga, con fundido, solo fuera del texto
  for (float i = 1.0; i <= 3.0; i++) {
    vec2 lp = p * (1.6 + i * 0.5);
    lp.x += sin(loopT + i * 1.7) * 0.18; lp.y += cos(loopT * 0.8 + i * 2.1) * 0.12;
    vec2 ng = fract(lp * 2.2) - 0.5; vec2 nid = floor(lp * 2.2);
    float active = step(1.0 - u_dens * 0.14, hash(nid + vec2(i * 19.3, 7.1)));
    if (active > 0.5) {
      float seed = hash1(nid.x * 13.0 + nid.y * 31.0);
      float phase = fract(t / u_cad + seed);
      float life = smoothstep(0.0, 0.12, phase) * (1.0 - smoothstep(0.30, 0.42, phase));
      float nd = length(ng);
      float ring = smoothstep(0.03, 0.0, abs(nd - 0.13));
      float core = smoothstep(0.07, 0.0, nd);
      vec3 ncol = mix(PURPLE, GREEN, step(0.7, seed) * u_green * 2.0);
      col += (ring * 0.8 + core * 1.2) * (0.55 / i) * life * clearMask * ncol;
      float ray = smoothstep(0.025, 0.0, abs(ng.x * ng.y * 3.5));
      col += ray * ncol * 0.18 * (0.5 / i) * life * clearMask;
    }
  }

  // aura y anillos del ratón
  float aura = 0.06 / (distMouse + 0.18);
  col += aura * PURPLE * 0.5 * u_aura * max(0.25, clearMask);
  float memRing = abs(sin(distMouse * 16.0 - loopT * 1.8));
  col += smoothstep(0.96, 1.0, 1.0 - memRing) * exp(-distMouse * 3.0) * mix(PURPLE, GREEN, 0.3) * 0.35 * u_aura * max(0.2, clearMask);

  col += sin(gl_FragCoord.y * 1.6 + loopT * 2.0) * 0.012 * PURPLE;
  col *= smoothstep(1.5, 0.35, length(p));
  gl_FragColor = vec4(col, 1.0);
}`;


export const DEFAULTS = { flow: .5, bright: 1.4, scale: 1.6, clear: .5, cad: 30, dens: .5, aura: .6, green: .15, cols: 5, dim: 1 };

export function createTunnel(canvas, params = {}) {
  const P = { ...DEFAULTS, ...params };
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) return null;
  const cs = (type, s) => { const sh = gl.createShader(type); gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; };
  const prog = gl.createProgram(); gl.attachShader(prog, cs(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, cs(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const a = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
  const U = {}; for (const n of ['u_time', 'u_res', 'u_mouse', 'u_code', 'u_flow', 'u_bright', 'u_scale', 'u_clear', 'u_cad', 'u_dens', 'u_aura', 'u_green', 'u_cols']) U[n] = gl.getUniformLocation(prog, n);
  const tex = gl.createTexture();
  const upload = () => {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, codeTexture(P.green));
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  };
  upload(); document.fonts?.ready.then(() => { sharedTex = null; upload(); });
  gl.uniform1i(U.u_code, 0);
  const dpr = Math.min(devicePixelRatio || 1, 1.5) * (innerWidth < 640 ? 0.7 : 0.85);
  const resize = () => { const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr); if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); } };
  resize(); addEventListener('resize', resize, { passive: true });
  let mouse = [0, 0], target = [0, 0];
  addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); target = [(e.clientX - r.left) / r.width * canvas.width, (1 - (e.clientY - r.top) / r.height) * canvas.height]; }, { passive: true });
  let running = false, t0 = performance.now(), raf = 0;
  const frame = (now) => {
    if (!running) return;
    resize();
    mouse[0] += (target[0] - mouse[0]) * .06; mouse[1] += (target[1] - mouse[1]) * .06;
    gl.uniform1f(U.u_time, (now - t0) / 1000); gl.uniform2f(U.u_res, canvas.width, canvas.height); gl.uniform2f(U.u_mouse, mouse[0], mouse[1]);
    gl.uniform1f(U.u_flow, P.flow); gl.uniform1f(U.u_bright, P.bright * P.dim); gl.uniform1f(U.u_scale, P.scale); gl.uniform1f(U.u_clear, P.clear);
    gl.uniform1f(U.u_cad, P.cad); gl.uniform1f(U.u_dens, P.dens); gl.uniform1f(U.u_aura, P.aura); gl.uniform1f(U.u_green, P.green); gl.uniform1f(U.u_cols, P.cols);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  };
  return {
    start() { if (running) return; running = true; raf = requestAnimationFrame(frame); canvas.classList.add('is-on'); },
    stop() { running = false; cancelAnimationFrame(raf); },
    set(k, v) { P[k] = v; },
  };
}

/* Activa cada túnel solo cuando su canvas está en pantalla */
export function autoTunnels(selector = 'canvas[data-tunnel]') {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  const map = new Map();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      let t = map.get(e.target);
      if (e.isIntersecting) { if (!t) { t = createTunnel(e.target, JSON.parse(e.target.dataset.tunnel || '{}')); map.set(e.target, t); } t?.start(); }
      else t?.stop();
    }
  }, { threshold: 0.05 });
  document.querySelectorAll(selector).forEach((c) => io.observe(c));
  return map;
}
