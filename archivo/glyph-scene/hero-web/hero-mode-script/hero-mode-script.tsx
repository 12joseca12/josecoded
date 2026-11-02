// Pre-paint half of the hero gate (DT §1.6.2 step 2). It runs while the stage is being parsed, so
// before its first paint: when the device will certainly run the live scene (desktop width, motion
// allowed, no Save-Data, enough memory, WebGL2 — the same conditions as `decideHeroMode`), it marks
// the stage `data-mode="scene"`, and only then CSS hides the poster. Anything else leaves the stage
// unmarked and the poster visible; `HeroSceneGate` takes over after hydration and decides for real.
// If the page JavaScript never arrives (no `data-armed` after 3 s), the mark and the poster
// placeholder are taken back and the poster loads. Any failure leaves the poster visible.
// It cannot read tokens, so 56.25rem and 3000 are the literals here (`bp.compact`).
export const HERO_MODE_GATE =
  "try{var s=document.currentScript.parentElement,n=navigator,m=matchMedia,c=n.connection,g;" +
  "if(m('(min-width:56.25rem)').matches&&!m('(prefers-reduced-motion:reduce)').matches&&" +
  "!(c&&c.saveData)&&(n.deviceMemory||8)>=4){g=document.createElement('canvas').getContext('webgl2');" +
  "if(g){var x=g.getExtension('WEBGL_lose_context');x&&x.loseContext();s.dataset.mode='scene';" +
  "setTimeout(function(){if(s.dataset.armed==null){delete s.dataset.mode;" +
  "var p=s.querySelector('[data-poster-placeholder]');p&&p.remove()}},3000)}}}catch(e){}";

/** Inline blocking script. Render it as the first child of the stage (`document.currentScript.parentElement`). */
export function HeroModeScript() {
  return <script dangerouslySetInnerHTML={{ __html: HERO_MODE_GATE }} />;
}
