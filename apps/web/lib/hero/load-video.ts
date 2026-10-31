// Video mode (DT §1.6.3): every phone and small tablet, and any desktop without WebGL2. After the
// LCP the sources are added (no `<source>` in the HTML: poster mode and Save-Data download nothing),
// `load()` waits for idle, and the poster hides on `canplay` without a fade. The clip is paused
// outside the viewport and with the tab hidden; the cycle bars follow `currentTime`.
import { afterLcp, idle } from './after-lcp';
import { createBarWriter } from './bars';
import { barsAt } from './cycle-clock';

export interface VideoSources {
  webm: string;
  mp4: string;
}

export interface HeroVideoElements {
  stage: HTMLElement;
  video: HTMLVideoElement;
  bars: Element | null;
}

/** Returns the cleanup. */
export function startVideo(el: HeroVideoElements, sources: VideoSources): () => void {
  const { stage, video } = el;
  const abort = new AbortController();
  const { signal } = abort;
  const write = createBarWriter(el.bars);
  let frame = 0;
  let inView = true;

  const tick = () => {
    const { index, fill } = barsAt(video.currentTime);
    write(index, fill);
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    cancelAnimationFrame(frame);
    if (inView && !document.hidden) {
      void video.play().catch(() => undefined); // a blocked autoplay leaves the poster on
      frame = requestAnimationFrame(tick);
    } else {
      video.pause();
    }
  };

  void (async () => {
    await afterLcp();
    if (signal.aborted) return;
    for (const [src, type] of [
      [sources.webm, 'video/webm; codecs="vp9"'],
      [sources.mp4, 'video/mp4'],
    ] as const) {
      const source = document.createElement('source');
      source.src = src;
      source.type = type;
      video.append(source);
    }
    await idle();
    if (signal.aborted) return;
    video.addEventListener(
      'canplay',
      () => {
        stage.dataset.state = 'live';
        sync();
      },
      { once: true, signal },
    );
    video.load();
  })();

  const io = new IntersectionObserver((entries) => {
    inView = entries[entries.length - 1]?.isIntersecting ?? true;
    if (stage.dataset.state === 'live') sync();
  });
  io.observe(stage);
  document.addEventListener(
    'visibilitychange',
    () => {
      if (stage.dataset.state === 'live') sync();
    },
    { signal },
  );

  return () => {
    abort.abort();
    cancelAnimationFrame(frame);
    io.disconnect();
    video.pause();
    video.replaceChildren();
    video.load(); // releases the download
    delete stage.dataset.state;
  };
}
