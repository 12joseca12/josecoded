/** Shaders of the v6 hero (ref/home-v6/scene.js:160-228) without the `uGreen` branch (green stays 0). */

export const VERTEX = /* glsl */ `
attribute vec3 aT0, aT1, aT2; attribute float aSeed, aGlyph, aCol, aKind, aParam;
uniform float uTime, uProg, uFrom, uTo, uSize, uScatter, uDpr, uIntroT, uWave, uWavePeriod, uWaveAmp, uBreath, uBreathW, uTracePeriod, uMirror, uFocus, uLoop;
varying float vGlyph, vCol, vSeed, vFade, vAlpha, vSoft, vLand;
float ease(float t){ return t*t*(3.0-2.0*t); }
// Capture only (uLoop = loop seconds): rounds an angular frequency to a whole number of cycles per loop so the seam is invisible.
float loopW(float w){ return uLoop > 0.0 ? floor(w * uLoop / 6.2831853 + 0.5) * 6.2831853 / uLoop : w; }
void main(){
  float f = uProg;
  int si = int(uFrom + 0.5); int sj = int(uTo + 0.5);
  vec3 A = si==0?aT0:si==1?aT1:aT2;
  vec3 B = sj==0?aT0:sj==1?aT1:aT2;
  float t = clamp((f - aSeed * 0.25) / 0.75, 0.0, 1.0); t = ease(t);
  vec3 p = mix(A, B, t);
  float mid = sin(t * 3.14159);
  vec3 n = vec3(fract(aSeed*13.7)-.5, fract(aSeed*29.3)-.5, fract(aSeed*41.9)-.5) * 2.0;
  p += n * mid * uScatter * (0.4 + 0.6 * fract(aSeed * 3.3));
  p *= 1.0 + uBreath * sin(uTime * uBreathW + aSeed * 0.3);
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
  float tracePulse = aKind > 0.5 ? exp(-abs(fract(uTime / uTracePeriod + aSeed * 0.15) - aParam) * 9.0) * 1.8 * chipW : 0.0;
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
  vFade = (0.30 + 0.20 * (sin(uTime * loopW(1.0 + aSeed) + aSeed * 30.0) * 0.5 + 0.5) + head * 1.4 + mid * 0.5 + tracePulse) * dens;
}`;

export const FRAGMENT = /* glsl */ `
uniform sampler2D uAtlas; uniform float uBright, uTime, uLoop;
varying float vGlyph, vCol, vSeed, vFade, vAlpha, vSoft, vLand;
void main(){
  float rate = 0.4 + vSeed * 0.8;
  float k = floor(uTime * rate + vSeed * 9.0);
  if (uLoop > 0.0) {
    // Capture: n glyph changes per loop, walked forward then back (a plain counter would land n glyphs away from where it started).
    float n = floor(rate * uLoop + 0.5);
    k = mod(floor(uTime * n / uLoop + fract(vSeed * 9.0)), n);
    k = min(k, n - k);
  }
  float g = mod(vGlyph + k, 128.0);
  vec2 cell = vec2(mod(g, 16.0), floor(g / 16.0));
  vec2 uv = vec2((cell.x + gl_PointCoord.x) / 16.0, 1.0 - (cell.y + gl_PointCoord.y) / 8.0);
  float a = texture2D(uAtlas, uv).r;
  a = mix(a, a * 0.55 + 0.1 * smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)), vSoft);
  if (a < 0.12) discard;
  vec3 lav = vec3(0.80, 0.76, 1.0); vec3 violet = vec3(0.45, 0.38, 1.0); vec3 green = vec3(0.24, 0.86, 0.52);
  vec3 c = mix(lav, violet, smoothstep(0.2, 0.9, vCol));
  c = mix(c, green, clamp(vLand * 1.5, 0.0, 1.0));
  gl_FragColor = vec4(c * vFade * uBright * vAlpha * (1.0 - vSoft * 0.3), a * 0.9 * vAlpha * (1.0 - vSoft * 0.3));
}`;
