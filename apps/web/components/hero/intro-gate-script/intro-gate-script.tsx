// Gate of the intro (DT §1.6.4). It runs before the hero is parsed, so before its first paint:
// on the first visit of the session (or with ?intro), and without reduced motion, it marks <html>
// as `pending`, which hides the `.ch` letters (globals.css). `sessionStorage` is written either
// way; `?nointro` skips it. If the page JavaScript never arrives, 2.5 s later the letters come
// back by themselves. Any failure (storage blocked, no matchMedia) leaves the letters visible.
// It cannot read tokens (it runs before anything else), so the 2500 is the one literal here.
// Under 400 bytes, no dependencies.
export const INTRO_GATE =
  "try{var d=document.documentElement,s=sessionStorage,q=location.search," +
  "f=/[?&]intro/.test(q)||!(s.getItem('intro_seen')||/[?&]nointro/.test(q));" +
  "s.setItem('intro_seen','1');" +
  "if(f&&!matchMedia('(prefers-reduced-motion:reduce)').matches){d.dataset.intro='pending';" +
  "setTimeout(function(){d.dataset.intro=='pending'&&delete d.dataset.intro},2500)}}catch(e){}";

/**
 * Inline blocking script. Render it as the first child of the hero (home only, `/` and `/en`), so
 * that it runs right before the letters it hides are parsed.
 */
export function IntroGateScript() {
  return <script dangerouslySetInnerHTML={{ __html: INTRO_GATE }} />;
}
