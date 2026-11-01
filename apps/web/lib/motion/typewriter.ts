export interface TypewriterOptions {
  /** Milliseconds per typed character. */
  typeMs: number;
  /** Milliseconds per erased character. */
  eraseMs: number;
  /** How long a finished text stays before it is erased. */
  pauseMs: number;
}

export interface Typewriter {
  start: () => void;
  /** Stops where it is: the text is left as written. */
  pause: () => void;
}

/**
 * Types each text into `el`, holds it, erases it and goes on with the next one, in a loop (the
 * examples of a prompt field). It only writes `textContent`; the caller starts it when the element
 * is in view and pauses it when it leaves or gets focus. Port of `base.js` (`.ask__ph`).
 */
export function createTypewriter(
  el: HTMLElement,
  texts: readonly string[],
  { typeMs, eraseMs, pauseMs }: TypewriterOptions,
): Typewriter {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let index = 0;
  let running = false;

  const later = (fn: () => void, ms: number) => {
    timer = setTimeout(fn, ms);
  };
  const type = (text: string, i: number) => {
    if (!running) return;
    el.textContent = text.slice(0, i);
    if (i < text.length) later(() => type(text, i + 1), typeMs);
    else later(() => erase(text, text.length), pauseMs);
  };
  const erase = (text: string, i: number) => {
    if (!running) return;
    el.textContent = text.slice(0, i);
    if (i > 0) later(() => erase(text, i - 1), eraseMs);
    else {
      index = (index + 1) % texts.length;
      later(() => type(texts[index] ?? '', 1), typeMs);
    }
  };

  return {
    start() {
      if (running || texts.length === 0) return;
      running = true;
      later(() => type(texts[index] ?? '', 1), typeMs);
    },
    pause() {
      running = false;
      clearTimeout(timer);
    },
  };
}

/**
 * Types `text` once into `el`, one character per `ms`, and calls `done` after the last one. Returns
 * the function that cancels it (the text stays as far as it got). The mini conversation uses it.
 */
export function typeOnce(el: HTMLElement, text: string, ms: number, done?: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let i = 0;
  const tick = () => {
    i += 1;
    el.textContent = text.slice(0, i);
    if (i < text.length) timer = setTimeout(tick, ms);
    else done?.();
  };
  timer = setTimeout(tick, ms);
  return () => clearTimeout(timer);
}
