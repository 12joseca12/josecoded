'use client';

import { useEffect, useRef } from 'react';

import { ChatBubble } from '@/components/scenes/chat-bubble';
import { typeOnce } from '@/lib/motion/typewriter';

import styles from './mini-chat.module.css';

/** Characters per beat (22 ms in the prototype) and the pause between the lines. */
const TYPE_MS = 22;
const REPLY_DELAY_MS = 700;

/**
 * The example conversation of «Trato directo». The server renders both lines complete (no
 * JavaScript, reduced motion and search engines see the real text); once hydrated, and only with
 * motion welcome, it clears them and types them once, the first time the chat is in view, and leaves
 * the final text in place. Deviation from `v7.js` (mini-chat), which loops: a loop is moving content
 * that never stops (WCAG 2.2.2), and the chat has no pause control of its own. Leaving the view
 * before it ends completes the lines at once, so the text is never left half typed.
 *
 * A11y: a named group; every bubble keeps a visually hidden copy of its text (`ChatBubble`), so the
 * typing is never announced. Nothing here takes focus.
 */
export function MiniChat({ label, visitor, reply }: { label: string; visitor: string; reply: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const chat = root.current;
    if (!chat || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const bubbles = [...chat.querySelectorAll<HTMLElement>('p')];
    const typed = bubbles.map((bubble) => bubble.querySelector<HTMLElement>('[data-typed]'));
    const lines = [visitor, reply];
    let timers: ReturnType<typeof setTimeout>[] = [];
    let cancel: (() => void) | undefined;
    let alive = false;
    let done = false;

    const clear = () => {
      timers.forEach(clearTimeout);
      timers = [];
      cancel?.();
      cancel = undefined;
    };
    const reset = () => {
      bubbles.forEach((bubble, i) => {
        bubble.removeAttribute('data-on');
        const span = typed[i];
        if (span) span.textContent = '';
      });
    };
    const finish = () => {
      clear();
      bubbles.forEach((bubble, i) => {
        bubble.setAttribute('data-on', '');
        const span = typed[i];
        if (span) span.textContent = lines[i] ?? '';
      });
      done = true;
    };
    const run = () => {
      reset();
      const [first, second] = [bubbles[0], bubbles[1]];
      const [firstText, secondText] = [typed[0], typed[1]];
      if (!first || !second || !firstText || !secondText) return;
      first.setAttribute('data-on', '');
      cancel = typeOnce(firstText, lines[0] ?? '', TYPE_MS, () => {
        timers.push(
          setTimeout(() => {
            second.setAttribute('data-on', '');
            cancel = typeOnce(secondText, lines[1] ?? '', TYPE_MS, () => {
              done = true;
              observer.disconnect();
            });
          }, REPLY_DELAY_MS),
        );
      });
    };

    reset();
    const observer = new IntersectionObserver(
      ([entry]) => {
        const was = alive;
        alive = Boolean(entry?.isIntersecting);
        if (done) return;
        if (alive && !was) run();
        if (!alive && was) finish();
      },
      { threshold: 0.4 },
    );
    observer.observe(chat);
    return () => {
      observer.disconnect();
      clear();
    };
  }, [visitor, reply]);

  return (
    <div ref={root} className={styles.chat} role="group" aria-label={label}>
      <ChatBubble from="visitor" text={visitor} />
      <ChatBubble from="author" text={reply} />
    </div>
  );
}
