'use client';

import { useEffect, useRef } from 'react';

import { ChatBubble } from '@/components/scenes/chat-bubble';
import { typeOnce } from '@/lib/motion/typewriter';

import styles from './mini-chat.module.css';

/** Characters per beat (22 ms in the prototype) and the pauses between lines and between loops. */
const TYPE_MS = 22;
const REPLY_DELAY_MS = 700;
const LOOP_MS = 5000;

/**
 * The example conversation of «Trato directo». The server renders both lines complete (no
 * JavaScript, reduced motion and search engines see the real text); once hydrated, and only with
 * motion welcome, it clears them and types them while the chat is in view, in a slow loop, and
 * stops when it leaves. Port of `v7.js` (mini-chat).
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
              timers.push(setTimeout(run, LOOP_MS));
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
        if (alive && !was) run();
        if (!alive) clear();
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
